import http from 'k6/http';
import { check, group, sleep } from 'k6';

const HAR_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

export const options = {
  vus: Number(__ENV.VUS || 1),
  iterations: Number(__ENV.ITERATIONS || 1),
  userAgent: __ENV.USER_AGENT || HAR_USER_AGENT,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
    'http_req_duration{step:formssource_GetTableData}': ['p(95)<2500'],
    'checks{type:business}': ['rate>0.99'],
  },
};

const ORIGIN = (__ENV.BASE_ORIGIN || 'https://toulouse-m-dev.convertigo.com').replace(/\/$/, '');
const LOGIN = __ENV.LOGIN || '';
const PASSWORD = __ENV.PASSWORD || '';
const DEBUG_PROGRESS = (__ENV.DEBUG_PROGRESS || '').toLowerCase() === 'true';
const DEBUG_FAILURES = (__ENV.DEBUG_FAILURES || '').toLowerCase() !== 'false';
const LOAD_STATICS_ONCE_PER_VU = (__ENV.LOAD_STATICS_ONCE_PER_VU || '').toLowerCase() === 'true';
const SIMULATE_HTTP_CACHE = (__ENV.SIMULATE_HTTP_CACHE || 'true').toLowerCase() !== 'false';
const ASSET_MODE = (__ENV.ASSET_MODE || 'full').toLowerCase();
const X_CONVERTIGO_MB = __ENV.X_CONVERTIGO_MB || '8.4.0';
const X_CONVERTIGO_SDK = __ENV.X_CONVERTIGO_SDK || '4.0.26-beta8';
const CLIENT_TIMEOUT = __ENV.CLIENT_TIMEOUT || '60s';
const ASSET_TIMEOUT = __ENV.ASSET_TIMEOUT || '30s';

const MOBILE_INDEX = '/convertigo/projects/C8Oforms/DisplayObjects/mobile/index.html';
const PUBLISHED_INDEX = '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/index.html';
const MOBILE_SELECTOR_REF = `${ORIGIN}/convertigo/projects/C8Oforms/DisplayObjects/mobile/selector/:published/:folder/:sub/:grid/:shared?formId=:formId&page=selectorPage&edit=:edit&published=null&d=:d&e=:e`;
const MOBILE_PUBLISHED_REF = `${ORIGIN}/convertigo/projects/C8Oforms/DisplayObjects/mobile/selector/true/:folder/:sub/true/true`;
const PWA_VIEWER_REF = `${ORIGIN}/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/viewer/published_1774523888110/:edit/:i`;

const MOBILE_ASSETS = [
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/runtime.15aba381475b15d3.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/polyfills.eea1a8b56a05e4aa.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/scripts.cb42d5d187f18a8a.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/main.855be14848f358bc.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/assets/css/animate.min.css',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/styles.28db3436e8debf5e.css',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/common.e5c45282dec3635d.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/7720.20c6da9c50e94bad.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/2075.7d953ffaa9e7fffa.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/3506.52dad6c88dc52711.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/4591.17df21152b67ca8c.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/1705.c6338e2a7b4b832a.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/9984.6dc64d26de509ce4.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/7240.ba76c4dff547ca68.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/964.5f92ca71df414a6d.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/inter-latin-400-normal.ef6d3f52c547a6e3.woff2',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/7356.e3a9f6bdddac6acf.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/6743.38f05f7881fb6666.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/9511.76aa763c24e9bc05.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/3821.158b6a2c4ca87f52.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/5100.8d579c557e238511.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/9344.b7077d626586e35d.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/1577.ad222a493756bd6a.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/3395.e37d5ddd448148ac.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/3731.1b10467b8ca0fb62.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/2451.3559d47fe660207d.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/5451.a6f4f2e453d04da5.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/1990.7d30c03961e77a37.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/198.ed46c762c76771de.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/918.bb5f04bcdf991c62.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/5918.2370a79ac3c06b5e.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/9638.9fcdea0b332ea86b.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/538.8c9ab2f4413af6ba.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/2166.a07278eadcffc005.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/1513.2b6a4841a1fec57f.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/6860.aec54c9f194a9741.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/2571.86228529e0c9ccf9.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/8882.625686b4a08299f1.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/6885.adac7c4791d6fc64.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/4933.0609e571bb435d1f.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/6066.5e9a8fcc5e3e29e7.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/5163.7ba7af5592aac4df.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/4797.60391441a2b000b6.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/1137.b7b8cc749ca19ce8.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/9341.cbbca6dce04dc536.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/6075.003cfed4adf45f3d.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/8873.89795888035e7da6.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/835.060bc8599d743c56.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/1617.568c0920a9098cbc.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/7399.9387172419557655.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/6074.ab8e794be8fb2c3b.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/8246.d6ba347a49013f76.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/2746.7d876253e3ce688c.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/7372.30952eae8ad70c3a.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/8805.43b1fa5ea2aebf21.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/1049.9c670bc2ebfe3f3f.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/2375.d7a70495c4d5069f.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/mobile/3511.92b663115b29b405.js',
];

const PWA_ASSETS = [
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/runtime.6d01a261afb992fd.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/polyfills.eea1a8b56a05e4aa.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/scripts.cb42d5d187f18a8a.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/main.bb1e95bd8586e328.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/assets/css/animate.min.css',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/styles.28db3436e8debf5e.css',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/common.8395e4c0736267db.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/7720.20c6da9c50e94bad.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/2075.7d953ffaa9e7fffa.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/3506.52dad6c88dc52711.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/4591.17df21152b67ca8c.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/9511.816cd3ef1accb0b7.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/4460.0a444738dfe59f7c.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/7240.ba76c4dff547ca68.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/964.5f92ca71df414a6d.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/inter-latin-400-normal.ef6d3f52c547a6e3.woff2',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/7356.e3a9f6bdddac6acf.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/7076.5db592938881a68d.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/2375.d7a70495c4d5069f.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/1049.9c670bc2ebfe3f3f.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/6885.50ea6a8bfa880ac3.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/1705.c8670072711ae0e1.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/8895.c160c9906bce69fc.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/6075.281d49bafb7c1fa9.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/5163.0e14ba2225ad055a.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/5100.8d579c557e238511.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/4406.166e99dbeda5945c.js',
  '/convertigo/projects/C8Oforms/DisplayObjects/pwas/published_1774523888110/scripts/4550.3e46105b7ec09f30.js',
];

let mobileAssetsLoadedForVu = false;
let pwaAssetsLoadedForVu = false;
const assetCacheByVu = Object.create(null);

function makeUuid() {
  return 'web-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function progress(label) {
  if (DEBUG_PROGRESS) {
    console.log(`[progress] ${label}`);
  }
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
    `duration=${res && typeof res.timings?.duration !== 'undefined' ? Math.round(res.timings.duration) + 'ms' : 'n/a'}`,
  ];
  if (res && res.error) parts.push(`error=${res.error}`);
  if (res && res.error_code) parts.push(`error_code=${res.error_code}`);
  const body = summarizeBody(res);
  if (body) parts.push(`body=${body}`);
  console.warn(`[failure] ${parts.join(' | ')}`);
}

function expectStatus(res, label, expected = 200, type = 'business') {
  const ok = res && res.status === expected;
  if (!ok) logFailure(label, res);
  check(res, { [label]: (r) => r && r.status === expected }, { type });
  return ok;
}

function boundary() {
  return `----k6FormBoundary${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function multipartBody(fields) {
  const b = boundary();
  const lines = [];
  for (const [name, value] of Object.entries(fields)) {
    lines.push(`--${b}`);
    lines.push(`Content-Disposition: form-data; name="${name}"`);
    lines.push('');
    lines.push(value == null ? '' : String(value));
  }
  lines.push(`--${b}--`);
  lines.push('');
  return {
    body: lines.join('\r\n'),
    contentType: `multipart/form-data; boundary=${b}`,
  };
}

function htmlHeaders() {
  return {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  };
}

function jsonHeaders(referer) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-convertigo-mb': X_CONVERTIGO_MB,
    'x-convertigo-sdk': X_CONVERTIGO_SDK,
  };
  if (referer) headers.Referer = referer;
  return headers;
}

function assetHeaders(referer) {
  const headers = {
    Accept: '*/*',
  };
  if (referer) headers.Referer = referer;
  return headers;
}

function nowMs() {
  return Date.now();
}

function getResponseHeader(res, name) {
  if (!res || !res.headers) return '';
  const lower = name.toLowerCase();
  for (const key of Object.keys(res.headers)) {
    if (key.toLowerCase() === lower) {
      const value = res.headers[key];
      if (Array.isArray(value)) return value[0] || '';
      return value || '';
    }
  }
  return '';
}

function parseMaxAgeSeconds(cacheControl) {
  if (!cacheControl) return null;
  const match = String(cacheControl).match(/(?:^|,)\s*max-age=(\d+)/i);
  return match ? Number(match[1]) : null;
}

function cacheEntry(path) {
  return assetCacheByVu[path];
}

function isCachedFresh(path) {
  if (!SIMULATE_HTTP_CACHE) return false;
  const entry = cacheEntry(path);
  return Boolean(entry && entry.expiresAtMs > nowMs());
}

function rememberCache(path, res) {
  if (!SIMULATE_HTTP_CACHE || !res || res.status !== 200) return;
  const cacheControl = getResponseHeader(res, 'cache-control');
  if (/no-store/i.test(cacheControl)) return;
  const maxAgeSeconds = parseMaxAgeSeconds(cacheControl);
  if (maxAgeSeconds == null || Number.isNaN(maxAgeSeconds) || maxAgeSeconds <= 0) return;
  assetCacheByVu[path] = {
    expiresAtMs: nowMs() + maxAgeSeconds * 1000,
    cacheControl,
  };
}

function fetchAssetBatch(paths, referer, step) {
  const pathsToFetch = [];
  let skippedFromCache = 0;

  for (const path of paths) {
    if (isCachedFresh(path)) {
      skippedFromCache += 1;
    } else {
      pathsToFetch.push(path);
    }
  }

  progress(`asset batch start: ${step} (${pathsToFetch.length}/${paths.length} fetch, ${skippedFromCache} cached)`);

  if (pathsToFetch.length === 0) {
    progress(`asset batch done: ${step} (all cached)`);
    return true;
  }

  let ok = true;
  const chunkSize = Number(__ENV.ASSET_BATCH_SIZE || 10);
  for (let i = 0; i < pathsToFetch.length; i += chunkSize) {
    const chunkPaths = pathsToFetch.slice(i, i + chunkSize);
    const reqs = chunkPaths.map((path) => ({
      method: 'GET',
      url: `${ORIGIN}${path}`,
      params: {
        headers: assetHeaders(referer),
        tags: { step, asset: path.split('/').pop() },
        timeout: ASSET_TIMEOUT,
      },
    }));
    const res = http.batch(reqs);
    for (let j = 0; j < res.length; j += 1) {
      const r = res[j];
      const path = chunkPaths[j];
      const assetOk = r.status === 200;
      if (!assetOk) logFailure(`asset:${step}`, r);
      if (assetOk) rememberCache(path, r);
      ok = ok && assetOk;
    }
  }
  check(ok, { 'asset batch ok': (v) => v }, { type: 'assets' });
  progress(`asset batch done: ${step}`);
  return ok;
}

function maybeFetchAssetBatch(paths, referer, step, stateKey) {
  if (ASSET_MODE === 'business-only') {
    progress(`asset batch skipped (business-only mode): ${step}`);
    return true;
  }

  if (LOAD_STATICS_ONCE_PER_VU && stateKey()) {
    progress(`asset batch skipped (already loaded by VU): ${step}`);
    return true;
  }

  const ok = fetchAssetBatch(paths, referer, step);
  if (ok && LOAD_STATICS_ONCE_PER_VU) {
    stateKey(true);
  }
  return ok;
}

function postSequence(project, sequence, fields, uuid, step, referer) {
  progress(`sequence start: ${step}`);
  const { body, contentType } = multipartBody({
    ...fields,
    __project: project,
    __sequence: sequence,
    __uuid: uuid,
  });
  const params = {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': contentType,
      'x-convertigo-mb': X_CONVERTIGO_MB,
      'x-convertigo-sdk': X_CONVERTIGO_SDK,
      ...(referer ? { Referer: referer } : {}),
    },
    tags: { step, sequence },
    timeout: CLIENT_TIMEOUT,
  };
  const res = http.post(`${ORIGIN}/convertigo/projects/C8Oforms/.json`, body, params);
  progress(`sequence done: ${step} -> ${res.status}`);
  return res;
}

function postUserGet(referer, step) {
  progress(`user.Get start: ${step}`);
  const res = http.post(
    `${ORIGIN}/convertigo/services/user.Get`,
    '{}',
    {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'x-convertigo-mb': X_CONVERTIGO_MB,
        'x-convertigo-sdk': X_CONVERTIGO_SDK,
        ...(referer ? { Referer: referer } : {}),
      },
      tags: { step, sequence: 'user.Get' },
      timeout: CLIENT_TIMEOUT,
    },
  );
  progress(`user.Get done: ${step} -> ${res.status}`);
  return res;
}

function getJson(path, referer, step, extraParams = {}) {
  progress(`GET start: ${step} ${path}`);
  const res = http.get(`${ORIGIN}${path}`, {
    headers: jsonHeaders(referer),
    tags: { step },
    timeout: CLIENT_TIMEOUT,
    ...extraParams,
  });
  progress(`GET done: ${step} -> ${res.status}`);
  return res;
}

function parseJson(res) {
  try {
    return res.json();
  } catch {
    return null;
  }
}

export default function () {
  if (!LOGIN || !PASSWORD) {
    throw new Error('LOGIN and PASSWORD env vars are required');
  }

  const uuid = makeUuid();

  group('mobile app bootstrap', () => {
    const index = http.get(`${ORIGIN}${MOBILE_INDEX}`, {
      headers: htmlHeaders(),
      tags: { step: 'mobile-index' },
    });
    expectStatus(index, 'mobile index 200', 200, 'assets');

    maybeFetchAssetBatch(
      MOBILE_ASSETS,
      `${ORIGIN}${MOBILE_INDEX}`,
      'mobile-assets',
      (value) => {
        if (typeof value !== 'undefined') mobileAssetsLoadedForVu = value;
        return mobileAssetsLoadedForVu;
      },
    );
    postUserGet(`${ORIGIN}${MOBILE_INDEX}`, 'user-get-anon');

    [
      ['C8Oforms', 'getGDRPmenu', {}, 'getGDRPmenu'],
      ['C8Oforms', 'getBrevoChatId', {}, 'getBrevoChatId'],
      ['C8Oforms', 'getCurrentUserSettings', {}, 'getCurrentUserSettings'],
      ['C8Oforms', 'getGDRPtoast', {}, 'getGDRPtoast'],
      ['C8Oforms', 'GetLanguage', { __disableAutologin: 'false', email: '' }, 'GetLanguage'],
      ['C8Oforms', 'getAvailableAuthModeForLogin', { __disableAutologin: 'false' }, 'getAvailableAuthModeForLogin'],
      ['lib_OAuth', 'GetOAuthCredentials', { __disableAutologin: 'false' }, 'GetOAuthCredentials'],
      ['C8Oforms', 'GetLanguage', { __localCache_ttl: '3000', __disableAutologin: 'false', email: LOGIN }, 'GetLanguage'],
    ].forEach(([project, sequence, fields, step]) => {
      const res = postSequence(project, sequence, fields, uuid, step, `${ORIGIN}${MOBILE_INDEX}`);
      expectStatus(res, `${sequence} ok`, 200, 'business');
    });

    const login = postSequence(
      'C8Oforms',
      'Login',
      {
        __disableAutologin: 'false',
        password: PASSWORD,
        email: LOGIN,
      },
      uuid,
      'Login',
      `${ORIGIN}${MOBILE_INDEX}`,
    );
    expectStatus(login, 'login ok', 200, 'business');
    postUserGet(MOBILE_SELECTOR_REF, 'user-get-auth');
  });

  group('published app selector', () => {
    const currentUser = postSequence('C8Oforms', 'getCurrentUserSettings', {}, uuid, 'getCurrentUserSettings', MOBILE_SELECTOR_REF);
    expectStatus(currentUser, 'post-login settings ok', 200, 'business');

    const outFolder = postSequence(
      'C8Oforms',
      'APIV2_ExecuteView',
      {
        target: 'formsV2/out_folder',
        acl: 'true',
        dynamicParams: '{"folder":"","filters":{}}',
      },
      uuid,
      'APIV2_ExecuteView',
      MOBILE_SELECTOR_REF,
    );
    expectStatus(outFolder, 'forms view ok', 200, 'business');

    const templates = postSequence(
      'C8Oforms',
      'APIV2_ExecuteView',
      { target: 'templatesEN' },
      uuid,
      'APIV2_ExecuteView',
      MOBILE_SELECTOR_REF,
    );
    expectStatus(templates, 'templates view ok', 200, 'business');

    const fsRoot = getJson('/convertigo/fullsync/c8oforms_fs/', MOBILE_SELECTOR_REF, 'fullsync-root');
    expectStatus(fsRoot, 'fullsync root ok', 200, 'business');

    postSequence('C8Oforms', 'getCurrentUserSettings', {}, uuid, 'getCurrentUserSettings', MOBILE_PUBLISHED_REF);
    postSequence(
      'C8Oforms',
      'APIV2_ExecuteView',
      {
        target: 'published_formsV2/out_folder',
        acl: 'true',
        dynamicParams: '{"folder":"","filters":{}}',
      },
      uuid,
      'APIV2_ExecuteView',
      MOBILE_PUBLISHED_REF,
    );
  });

  group('published app viewer', () => {
    const pwaIndex = http.get(`${ORIGIN}${PUBLISHED_INDEX}`, {
      headers: htmlHeaders(),
      tags: { step: 'pwa-index' },
    });
    expectStatus(pwaIndex, 'pwa index 200', 200, 'assets');

    maybeFetchAssetBatch(
      PWA_ASSETS,
      `${ORIGIN}${PUBLISHED_INDEX}`,
      'pwa-assets',
      (value) => {
        if (typeof value !== 'undefined') pwaAssetsLoadedForVu = value;
        return pwaAssetsLoadedForVu;
      },
    );

    const currentUser = postSequence('C8Oforms', 'getCurrentUserSettings', {}, uuid, 'getCurrentUserSettings', PWA_VIEWER_REF);
    expectStatus(currentUser, 'viewer settings ok', 200, 'business');

    const doc = postSequence(
      'C8Oforms',
      'APIV2_getDocument',
      { id: 'published_1774523888110' },
      uuid,
      'APIV2_getDocument',
      PWA_VIEWER_REF,
    );
    expectStatus(doc, 'document load ok', 200, 'business');

    const responseFsRoot = getJson('/convertigo/fullsync/c8oforms_response_fs/', PWA_VIEWER_REF, 'response-fs-root');
    expectStatus(responseFsRoot, 'response fs root ok', 200, 'business');
    const responseFsDesign = getJson('/convertigo/fullsync/c8oforms_response_fs/_design/c8o', PWA_VIEWER_REF, 'response-fs-design');
    expectStatus(responseFsDesign, 'response fs design ok', 200, 'business');
    const fullsyncRoot = getJson('/convertigo/fullsync/', PWA_VIEWER_REF, 'fullsync-api-root');
    expectStatus(fullsyncRoot, 'fullsync api root ok', 200, 'business');
    const localDoc = getJson('/convertigo/fullsync/c8oforms_response_fs/_local/3ETQbCpSk3XPwKHW5wMSNg%3D%3D', PWA_VIEWER_REF, 'response-fs-local');
    expectStatus(localDoc, 'response fs local ok', 200, 'business');

    const tempData = postSequence(
      'lib_BaseRow',
      'formssource_GetTableData',
      {
        forms_config:
          '{"table_id":"Convertigo NoCode Databases - gregoryv@convertigo.com~>Temperatures~>synthetics","table_id_int":831,"columns":["date","t_avg_c"],"hidden":[],"form_id":"1774523888110","source_id":1773937886289,"source_owner":"gregoryv@convertigo.com","link_row_table_id":[]}',
        forms_tableFilter: '{"filters":[],"mode":"AND"}',
        forms_tableSort: '',
      },
      uuid,
      'formssource_GetTableData',
      PWA_VIEWER_REF,
    );
    expectStatus(tempData, 'temperatures table ok', 200, 'business');

    const employeeData = postSequence(
      'lib_BaseRow',
      'formssource_GetTableData',
      {
        forms_config:
          '{"table_id":"Convertigo NoCode Databases - gregoryv@convertigo.com~>Employee Directory~>Employees","table_id_int":829,"columns":["Department","Office location","Email","Supervisor","Date of birth","Remarks","Start date","Status","Is active","End date","Name","Phone","Picture","Manager of","Unit","Job role","Unit name","Home address","ZIP code","Birthday this year"],"hidden":[],"form_id":"1774523888110","source_id":1773925939519,"source_owner":"gregoryv@convertigo.com","link_row_table_id":[828,829]}',
        forms_tableFilter: '',
        forms_tableSort: '',
      },
      uuid,
      'formssource_GetTableData',
      PWA_VIEWER_REF,
    );
    expectStatus(employeeData, 'employee table ok', 200, 'business');
  });

  sleep(Number(__ENV.SLEEP_SECONDS || 1));
}
