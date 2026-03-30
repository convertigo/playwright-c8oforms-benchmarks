#!/usr/bin/env bash
set -euo pipefail

KUBECONFIG_PATH="${KUBECONFIG_PATH:-/Users/opic/outscale/outscale.yaml}"
NAMESPACE="${NAMESPACE:-convertigo-dev}"
GATEWAY_NAMESPACE="${GATEWAY_NAMESPACE:-envoy-gateway-system}"
LONGHORN_NAMESPACE="${LONGHORN_NAMESPACE:-longhorn-system}"
GATEWAY_NAME="${GATEWAY_NAME:-toulouse-m-dev}"
OUT_DIR="${OUT_DIR:-./artifacts/cluster-snapshots/$(date +%Y%m%d-%H%M%S)}"

mkdir -p "${OUT_DIR}"

run() {
  local name="$1"
  shift
  echo "==> ${name}"
  KUBECONFIG="${KUBECONFIG_PATH}" "$@" > "${OUT_DIR}/${name}.txt" 2>&1 || true
}

run nodes kubectl top nodes
run pods_all kubectl top pods -A
run convertigo_pods kubectl -n "${NAMESPACE}" get pods -o wide
run convertigo_top kubectl -n "${NAMESPACE}" top pods
run convertigo_deploy kubectl -n "${NAMESPACE}" get deploy convertigo-convertigo -o yaml
run gateway_pods kubectl -n "${GATEWAY_NAMESPACE}" get pods -l "gateway.envoyproxy.io/owning-gateway-name=${GATEWAY_NAME}" -o wide
run gateway_top kubectl -n "${GATEWAY_NAMESPACE}" top pods
run gateway_deploy kubectl -n "${GATEWAY_NAMESPACE}" get deploy -l "gateway.envoyproxy.io/owning-gateway-name=${GATEWAY_NAME}" -o yaml
run gateway_logs kubectl -n "${GATEWAY_NAMESPACE}" logs deploy/envoy-convertigo-dev-toulouse-m-dev-b47338d5 --all-containers --since=10m
run longhorn_pods kubectl -n "${LONGHORN_NAMESPACE}" get pods -o wide
run longhorn_top kubectl -n "${LONGHORN_NAMESPACE}" top pods
run longhorn_volume kubectl -n "${LONGHORN_NAMESPACE}" get volumes.longhorn.io pvc-51dc574e-6192-4c73-97cb-f7c56bec3710 -o yaml

echo "Cluster snapshot written to ${OUT_DIR}"
