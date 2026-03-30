#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUBECONFIG_PATH="${KUBECONFIG_PATH:-/Users/opic/outscale/outscale.yaml}"
NAMESPACE="${NAMESPACE:-convertigo-dev}"
SCRIPT_NAME="${SCRIPT_NAME:-convertigo-static-path-bench.js}"
CONFIGMAP_NAME="${CONFIGMAP_NAME:-k6-static-path-bench}"
K6_IMAGE="${K6_IMAGE:-grafana/k6:0.49.0}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://toulouse-m-dev.convertigo.com}"
SERVICE_ORIGIN="${SERVICE_ORIGIN:-http://convertigo.convertigo-dev.svc.cluster.local:28080}"
POD_ORIGIN="${POD_ORIGIN:-http://10.21.8.95:28080}"
PUBLIC_JOB_NAME="${PUBLIC_JOB_NAME:-k6-static-public}"
SERVICE_JOB_NAME="${SERVICE_JOB_NAME:-k6-static-service}"
POD_JOB_NAME="${POD_JOB_NAME:-k6-static-pod}"

create_job() {
  local job_name="$1"
  local base_origin="$2"

  KUBECONFIG="${KUBECONFIG_PATH}" kubectl -n "${NAMESPACE}" delete job "${job_name}" --ignore-not-found >/dev/null 2>&1 || true

  cat <<EOF | KUBECONFIG="${KUBECONFIG_PATH}" kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${job_name}
  namespace: ${NAMESPACE}
spec:
  backoffLimit: 0
  template:
    metadata:
      labels:
        app: ${job_name}
    spec:
      restartPolicy: Never
      containers:
        - name: k6
          image: ${K6_IMAGE}
          imagePullPolicy: IfNotPresent
          env:
            - name: BASE_ORIGIN
              value: ${base_origin}
            - name: DEBUG_FAILURES
              value: "true"
            - name: ASSET_TIMEOUT
              value: "30s"
          command: ["k6"]
          args:
            - run
            - --stage
            - 1m:20
            - --stage
            - 1m:20
            - --stage
            - 5s:0
            - /scripts/${SCRIPT_NAME}
          volumeMounts:
            - name: scripts
              mountPath: /scripts
      volumes:
        - name: scripts
          configMap:
            name: ${CONFIGMAP_NAME}
EOF
}

echo "==> Refreshing ConfigMap ${CONFIGMAP_NAME}"
KUBECONFIG="${KUBECONFIG_PATH}" kubectl -n "${NAMESPACE}" delete configmap "${CONFIGMAP_NAME}" --ignore-not-found >/dev/null 2>&1 || true
KUBECONFIG="${KUBECONFIG_PATH}" kubectl -n "${NAMESPACE}" create configmap "${CONFIGMAP_NAME}" \
  --from-file="${SCRIPT_NAME}=${ROOT_DIR}/k6/${SCRIPT_NAME}"

echo "==> Creating Jobs"
create_job "${PUBLIC_JOB_NAME}" "${PUBLIC_ORIGIN}"
create_job "${SERVICE_JOB_NAME}" "${SERVICE_ORIGIN}"
create_job "${POD_JOB_NAME}" "${POD_ORIGIN}"

echo "==> Waiting for pods"
KUBECONFIG="${KUBECONFIG_PATH}" kubectl -n "${NAMESPACE}" get pods -l app="${PUBLIC_JOB_NAME}" -w --request-timeout=10s >/dev/null 2>&1 || true
KUBECONFIG="${KUBECONFIG_PATH}" kubectl -n "${NAMESPACE}" get pods -l app="${SERVICE_JOB_NAME}" -w --request-timeout=10s >/dev/null 2>&1 || true
KUBECONFIG="${KUBECONFIG_PATH}" kubectl -n "${NAMESPACE}" get pods -l app="${POD_JOB_NAME}" -w --request-timeout=10s >/dev/null 2>&1 || true

echo "==> Jobs created:"
KUBECONFIG="${KUBECONFIG_PATH}" kubectl -n "${NAMESPACE}" get jobs "${PUBLIC_JOB_NAME}" "${SERVICE_JOB_NAME}" "${POD_JOB_NAME}"
