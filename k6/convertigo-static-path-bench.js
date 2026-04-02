import http from 'k6/http';
import { check, group, sleep } from 'k6';

const HAR_USER_AGENT =
  __ENV.USER_AGENT ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

export const options = {
  userAgent: HAR_USER_AGENT,
  scenarios: {
    statics: {
      executor: 'ramping-vus',
      startVUs: Number(__ENV.START_VUS || 1),
      stages: [
        { duration: __ENV.RAMP_UP || '1m', target: Number(__ENV.TARGET_VUS || 20) },
        { duration: __ENV.HOLD || '1m', target: Number(__ENV.TARGET_VUS || 20) },
        { duration: __ENV.RAMP_DOWN || '5s', target: 0 },
      ],
      gracefulRampDown: __ENV.GRACEFUL_RAMP_DOWN || '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<5000'],
    'http_req_duration{asset_group:critical-mobile}': ['p(95)<3000'],
    'http_req_duration{asset_group:critical-pwa}': ['p(95)<3000'],
    checks: ['rate>0.99'],
  },
};

const ORIGIN = (__ENV.BASE_ORIGIN || 'https://toulouse-m-dev.convertigo.com').replace(/\/$/, '');
const DEBUG_PROGRESS = (__ENV.DEBUG_PROGRESS || '').toLowerCase() === 'true';
const DEBUG_FAILURES = (__ENV.DEBUG_FAILURES || '').toLowerCase() !== 'false';
const ASSET_TIMEOUT = __ENV.ASSET_TIMEOUT || '30s';
const BATCH_SIZE = Number(__ENV.ASSET_BATCH_SIZE || 6);
const SLEEP_SECONDS = Number(__ENV.SLEEP_SECONDS || 0);
const PUBLISHED_APP_ID = __ENV.PUBLISHED_APP_ID || 'published_1774946272392';
const PWA_BASE_PATH = `/convertigo/projects/C8Oforms/DisplayObjects/pwas/${PUBLISHED_APP_ID}`;

const ASSET_GROUPS = {
  'critical-mobile': [
    '/convertigo/projects/C8Oforms/DisplayObjects/mobile/runtime.15aba381475b15d3.js',
    '/convertigo/projects/C8Oforms/DisplayObjects/mobile/polyfills.eea1a8b56a05e4aa.js',
    '/convertigo/projects/C8Oforms/DisplayObjects/mobile/scripts.cb42d5d187f18a8a.js',
    '/convertigo/projects/C8Oforms/DisplayObjects/mobile/main.855be14848f358bc.js',
    '/convertigo/projects/C8Oforms/DisplayObjects/mobile/styles.28db3436e8debf5e.css',
    '/convertigo/projects/C8Oforms/DisplayObjects/mobile/common.e5c45282dec3635d.js',
    '/convertigo/projects/C8Oforms/DisplayObjects/mobile/7720.20c6da9c50e94bad.js',
    '/convertigo/projects/C8Oforms/DisplayObjects/mobile/2075.7d953ffaa9e7fffa.js',
    '/convertigo/projects/C8Oforms/DisplayObjects/mobile/3506.52dad6c88dc52711.js',
  ],
  'critical-pwa': [
    `${PWA_BASE_PATH}/scripts/runtime.6d01a261afb992fd.js`,
    `${PWA_BASE_PATH}/scripts/polyfills.eea1a8b56a05e4aa.js`,
    `${PWA_BASE_PATH}/scripts/scripts.cb42d5d187f18a8a.js`,
    `${PWA_BASE_PATH}/scripts/main.bb1e95bd8586e328.js`,
    `${PWA_BASE_PATH}/scripts/styles.28db3436e8debf5e.css`,
    `${PWA_BASE_PATH}/scripts/common.8395e4c0736267db.js`,
    `${PWA_BASE_PATH}/scripts/7720.20c6da9c50e94bad.js`,
    `${PWA_BASE_PATH}/scripts/2075.7d953ffaa9e7fffa.js`,
    `${PWA_BASE_PATH}/scripts/3506.52dad6c88dc52711.js`,
  ],
};

const SELECTED_GROUPS = (__ENV.ASSET_GROUPS || 'critical-mobile,critical-pwa')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

function progress(message) {
  if (DEBUG_PROGRESS) console.log(`[progress] ${message}`);
}

function summarizeBody(res) {
  if (!res || typeof res.body !== 'string') return '';
  return res.body.replace(/\s+/g, ' ').slice(0, 300);
}

function logFailure(label, res) {
  if (!DEBUG_FAILURES) return;
  const parts = [
    `label=${label}`,
    `status=${res && typeof res.status !== 'undefined' ? res.status : 'n/a'}`,
    `url=${res && res.request ? res.request.url : 'n/a'}`,
    `duration=${res && res.timings && typeof res.timings.duration !== 'undefined' ? Math.round(res.timings.duration) + 'ms' : 'n/a'}`,
  ];
  if (res && res.error) parts.push(`error=${res.error}`);
  if (res && res.error_code) parts.push(`error_code=${res.error_code}`);
  const body = summarizeBody(res);
  if (body) parts.push(`body=${body}`);
  console.warn(`[failure] ${parts.join(' | ')}`);
}

function assetHeaders() {
  return {
    Accept: '*/*',
  };
}

function fetchAssetGroup(groupName, paths) {
  progress(`asset group start: ${groupName} (${paths.length})`);
  let ok = true;

  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const reqs = paths.slice(i, i + BATCH_SIZE).map((path) => ({
      method: 'GET',
      url: `${ORIGIN}${path}`,
      params: {
        headers: assetHeaders(),
        timeout: ASSET_TIMEOUT,
        tags: {
          asset_group: groupName,
          asset_name: path.split('/').pop(),
        },
      },
    }));

    const res = http.batch(reqs);
    for (const r of res) {
      const requestOk = r.status === 200;
      if (!requestOk) logFailure(`asset:${groupName}`, r);
      ok = ok && requestOk;
    }
  }

  check(ok, { [`asset group ok: ${groupName}`]: (v) => v });
  progress(`asset group done: ${groupName}`);
  return ok;
}

export default function () {
  group('static-groups', () => {
    for (const groupName of SELECTED_GROUPS) {
      const assets = ASSET_GROUPS[groupName];
      if (!assets) {
        throw new Error(`Unknown ASSET_GROUPS entry: ${groupName}`);
      }
      fetchAssetGroup(groupName, assets);
    }
  });

  if (SLEEP_SECONDS > 0) {
    sleep(SLEEP_SECONDS);
  }
}
