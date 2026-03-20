import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

const isCI = process.env.CI === 'true';
const toNumber = (value: string | undefined, fallback: number) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const testDir = './tests';
const fullyParallel = true;
const retries = isCI ? toNumber(process.env.RETRIES, 0) : 0;
const workers = isCI ? toNumber(process.env.WORKERS, 1) : 1;
const repeatEach = isCI ? toNumber(process.env.REPEAT_EACH, 1) : 1;
const reporter = 'html';
const baseURL = process.env.BASE_URL;
const trace = 'on-first-retry';
const projects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
];

console.info('[playwright.config] Current configuration');
console.info({
  ci: isCI,
  testDir,
  fullyParallel,
  forbidOnly: isCI,
  retries,
  workers,
  repeatEach,
  reporter,
  baseURL,
  trace,
  projects: projects.map(({ name }) => name),
});

export default defineConfig({
  testDir,
  fullyParallel,
  forbidOnly: isCI,
  retries,
  workers,
  repeatEach,
  reporter,

  use: {
    baseURL,
    trace,
  },

  projects,

  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !isCI,
  // },
});
