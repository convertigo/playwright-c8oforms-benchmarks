# playwright-c8oforms-benchmarks

Playwright end-to-end test project currently targeting the `chromium` project.

## Prerequisites

- Node.js LTS
- npm

## Installation

From the project root:

```bash
npm install
npx playwright install chromium
```

`npm install` installs the project dependencies, including `@playwright/test`.
`npx playwright install chromium` installs the Chromium browser used by the tests.

## Configuration

Create a `.env` file at the project root.

Example:

```dotenv
LOGIN=your-login
PASSWORD=your-password
BASE_URL=https://your-url/convertigo/projects/C8Oforms/DisplayObjects/mobile/
CI=true
WORKERS=1
RETRIES=0
REPEAT_EACH=1
PLAYWRIGHT_TIMEOUT_MS=60000
PLAYWRIGHT_TEST_TIMEOUT_MS=180000
```

## Docker

Build the image:

```bash
docker build -t playwright-c8oforms-benchmarks:latest .
```

Run the test container:

```bash
docker run --rm --ipc=host --env-file .env \
  -e WORKERS=1 \
  -e RETRIES=0 \
  -e REPEAT_EACH=1 \
  -e PLAYWRIGHT_TIMEOUT_MS=60000 \
  -e PLAYWRIGHT_TEST_TIMEOUT_MS=180000 \
  playwright-c8oforms-benchmarks:latest
```

Pass extra Playwright arguments after the image name, for example:

```bash
docker run --rm --ipc=host --env-file .env \
  -e WORKERS=1 \
  -e REPEAT_EACH=1 \
  playwright-c8oforms-benchmarks:latest --project=chromium --grep "NO CODE STUDIO"
```

The container writes test artifacts to `/tmp/playwright-results` and the HTML report to `/tmp/playwright-report`.

## OpenShift

The repository includes OpenShift manifests:

- [openshift/configmap.yaml](./openshift/configmap.yaml)
- [openshift/secret.example.yaml](./openshift/secret.example.yaml)
- [openshift/job.yaml](./openshift/job.yaml)

Typical usage:

```bash
oc apply -f openshift/configmap.yaml
oc apply -f openshift/secret.example.yaml
oc apply -f openshift/job.yaml
```

Before applying the Job:

- update the image reference in `openshift/job.yaml`
- replace the placeholder values in the ConfigMap and Secret

## Environment Variables

- `LOGIN`: login used by the test.
- `PASSWORD`: password used by the test.
- `BASE_URL`: base URL used by Playwright. The test then navigates to `index.html`.
- `CI`: enables CI mode in the Playwright config.
- `WORKERS`: number of Playwright workers.
- `RETRIES`: number of retries when a test fails.
- `REPEAT_EACH`: number of times each test is repeated.
- `PLAYWRIGHT_TIMEOUT_MS`: timeout used for `expect` and navigation.
- `PLAYWRIGHT_TEST_TIMEOUT_MS`: global timeout for a test.

## k6 Business Flow Bench

The repository also includes a k6 script that replays the C8Oforms business flow at the HTTP level:

- [k6/convertigo-dev-c8oforms.js](./k6/convertigo-dev-c8oforms.js)
- [k6/convertigo-prod-scenaria.js](./k6/convertigo-prod-scenaria.js)

By default it runs the full authenticated app flow, then continues into the published PWA viewer requests captured from production. It also validates JSON payloads so a plain HTTP `200` is not treated as success when the response body contains application-level errors.

The script also includes configurable think time so one virtual user behaves more like a real person moving through the app instead of firing requests back-to-back.

Typical authenticated run:

```bash
BASE_ORIGIN=https://toulouse-m-prod.convertigo.com \
LOGIN=your-login \
PASSWORD=your-password \
PUBLISHED_APP_ID=published_1774946272392 \
/opt/homebrew/bin/k6 run k6/convertigo-dev-c8oforms.js
```

To replay only the direct PWA viewer portion instead:

```bash
BASE_ORIGIN=https://toulouse-m-prod.convertigo.com \
FLOW_MODE=pwa-viewer \
/opt/homebrew/bin/k6 run k6/convertigo-dev-c8oforms.js
```

Useful environment variables:

- `BASE_ORIGIN`: target origin to benchmark, default `https://toulouse-m-prod.convertigo.com`
- `FLOW_MODE`: `full-app` or `pwa-viewer`, default `full-app`
- `PUBLISHED_APP_ID`: published PWA identifier, default `published_1774946272392`
- `LOGIN`, `PASSWORD`: required when `FLOW_MODE=full-app`
- `VUS`, `ITERATIONS`
- `ASSET_MODE=full|business-only`
- `LOAD_STATICS_ONCE_PER_VU=true|false`
- `SIMULATE_HTTP_CACHE=true|false`
- `THINK_TIME_ENABLED=true|false`
- `THINK_TIME_MIN_SECONDS`, `THINK_TIME_MAX_SECONDS`
- `THINK_TIME_AFTER_LOGIN_SECONDS`
- `THINK_TIME_AFTER_NAV_SECONDS`
- `THINK_TIME_VIEW_SECONDS`
- `ASSET_BATCH_SIZE`, `ASSET_TIMEOUT`, `CLIENT_TIMEOUT`
- `DEBUG_FAILURES=true|false`
- `DEBUG_PROGRESS=true|false`

Example with more realistic pacing:

```bash
BASE_ORIGIN=https://toulouse-m-prod.convertigo.com \
LOGIN=your-login \
PASSWORD=your-password \
THINK_TIME_ENABLED=true \
THINK_TIME_MIN_SECONDS=2 \
THINK_TIME_MAX_SECONDS=6 \
THINK_TIME_AFTER_LOGIN_SECONDS=3 \
THINK_TIME_AFTER_NAV_SECONDS=2 \
THINK_TIME_VIEW_SECONDS=5 \
/opt/homebrew/bin/k6 run k6/convertigo-dev-c8oforms.js
```

The `convertigo-prod-scenaria.js` script is a separate, HAR-derived scenario for the production tenant. It focuses on the authenticated business flow only and deliberately skips static assets so the measurements stay centered on backend/API behavior. It models the captured flow as explicit user stages with think time between them:

1. bootstrap
2. auth preflight
3. login
4. selector
5. published app open
6. viewer bootstrap
7. document load
8. data viewing
By default it also keeps cookies across iterations for each VU and reuses the authenticated session when it is still valid, so one VU behaves more like the same returning browser session instead of logging in and out on every iteration. You can disable cookie persistence with `K6_NO_COOKIES_RESET=false`.

Typical staged scenario run:

```bash
BASE_ORIGIN=https://toulouse-m-prod.convertigo.com \
LOGIN=your-login \
PASSWORD=your-password \
THINK_TIME_ENABLED=true \
THINK_TIME_AFTER_STAGE_SECONDS=2 \
THINK_TIME_VIEW_SECONDS=5 \
/opt/homebrew/bin/k6 run k6/convertigo-prod-scenaria.js
```

## k6 Static Bottleneck Bench

The repository also includes a dedicated static-asset k6 bench:

- [k6/convertigo-static-path-bench.js](./k6/convertigo-static-path-bench.js)

Its goal is to isolate frontend asset serving from the business flow and compare different access paths:

- public hostname through Envoy Gateway
- internal service path
- direct pod IP path

Typical public-path run:

```bash
BASE_ORIGIN=https://toulouse-m-dev.convertigo.com \
/opt/homebrew/bin/k6 run \
  --stage 1m:20 \
  --stage 1m:20 \
  --stage 5s:0 \
  k6/convertigo-static-path-bench.js
```

Typical direct-pod comparison:

```bash
BASE_ORIGIN=http://10.21.8.95:28080 \
/opt/homebrew/bin/k6 run \
  --stage 30s:20 \
  --stage 30s:20 \
  --stage 5s:0 \
  k6/convertigo-static-path-bench.js
```

Useful environment variables:

- `BASE_ORIGIN`: target origin to benchmark
- `PUBLISHED_APP_ID`: published PWA identifier, default `published_1774946272392`
- `ASSET_GROUPS`: comma-separated asset groups, default `critical-mobile,critical-pwa`
- `ASSET_TIMEOUT`: per-request timeout, default `30s`
- `ASSET_BATCH_SIZE`: concurrent asset batch size inside one VU, default `6`
- `START_VUS`, `TARGET_VUS`, `RAMP_UP`, `HOLD`, `RAMP_DOWN`
- `DEBUG_FAILURES=true|false`
- `DEBUG_PROGRESS=true|false`

This bench is useful to determine whether bottlenecks are primarily on:

- the public Gateway/LB path
- the Convertigo service itself
- or the shared storage path behind Convertigo

## Cluster Snapshot Helper

To correlate k6 results with live cluster state, use:

- [scripts/collect-cluster-bottlenecks.sh](./scripts/collect-cluster-bottlenecks.sh)

Example:

```bash
chmod +x scripts/collect-cluster-bottlenecks.sh
KUBECONFIG_PATH=/Users/opic/outscale/outscale.yaml \
scripts/collect-cluster-bottlenecks.sh
```

It captures:

- `kubectl top nodes`
- `kubectl top pods -A`
- Convertigo pod placement and deployment details
- Envoy Gateway pod placement, top output, deployment config, and recent logs
- Longhorn pod placement, top output, and the current workspace volume spec

## Run Tests

List detected tests:

```bash
npx playwright test --list
```

Run all tests:

```bash
npx playwright test
```

Run a single file:

```bash
npx playwright test tests/test-1.spec.ts --project=chromium
```

Override values at runtime:

```bash
WORKERS=1 REPEAT_EACH=1 PLAYWRIGHT_TIMEOUT_MS=60000 PLAYWRIGHT_TEST_TIMEOUT_MS=180000 npx playwright test
```

Open the HTML report:

```bash
npx playwright show-report
```

## Current Behavior

- The Playwright config is in [playwright.config.ts](./playwright.config.ts).
- The main test is in [tests/test-1.spec.ts](./tests/test-1.spec.ts).
- The Playwright project currently in use is `chromium`.
- Application loading waits for `domcontentloaded`, Ionic hydration when present, and then for loading overlays to disappear.

## Notes

- The `.env` file is ignored by Git.
- The Playwright config logs the effective loaded values at startup, which helps diagnose timeout or environment variable issues.
- The Docker image is based on `mcr.microsoft.com/playwright:v1.58.2-noble`, matching the Playwright version declared in `package.json`.
