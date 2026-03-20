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
