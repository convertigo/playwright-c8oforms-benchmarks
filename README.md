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
