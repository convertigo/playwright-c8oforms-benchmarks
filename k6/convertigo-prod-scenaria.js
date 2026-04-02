import http from 'k6/http';
import { check, group, sleep } from 'k6';

const HAR_USER_AGENT =
  __ENV.USER_AGENT ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

export const options = {
  vus: Number(__ENV.VUS || 1),
  iterations: Number(__ENV.ITERATIONS || 1),
  noCookiesReset: (__ENV.K6_NO_COOKIES_RESET || 'true').toLowerCase() !== 'false',
  userAgent: HAR_USER_AGENT,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
    'http_req_duration{step:formssource_GetTableData:employees}': ['p(95)<1500'],
    'http_req_duration{step:formssource_GetTableData:temperatures}': ['p(95)<1200'],
    'checks{type:business}': ['rate>0.99'],
  },
};

const ORIGIN = (__ENV.BASE_ORIGIN || 'https://toulouse-m-prod.convertigo.com').replace(/\/$/, '');
const LOGIN = __ENV.LOGIN || '';
const PASSWORD = __ENV.PASSWORD || '';
const DEBUG_PROGRESS = (__ENV.DEBUG_PROGRESS || '').toLowerCase() === 'true';
const DEBUG_FAILURES = (__ENV.DEBUG_FAILURES || '').toLowerCase() !== 'false';
const X_CONVERTIGO_MB = __ENV.X_CONVERTIGO_MB || '8.4.0';
const X_CONVERTIGO_SDK = __ENV.X_CONVERTIGO_SDK || '4.0.26-beta8';
const CLIENT_TIMEOUT = __ENV.CLIENT_TIMEOUT || '120s';
const THINK_TIME_ENABLED = (__ENV.THINK_TIME_ENABLED || 'true').toLowerCase() !== 'false';
const THINK_TIME_MIN_SECONDS = Number(__ENV.THINK_TIME_MIN_SECONDS || 1.5);
const THINK_TIME_MAX_SECONDS = Number(__ENV.THINK_TIME_MAX_SECONDS || 4.0);
const THINK_TIME_AFTER_STAGE_SECONDS = Number(__ENV.THINK_TIME_AFTER_STAGE_SECONDS || 2.0);
const THINK_TIME_VIEW_SECONDS = Number(__ENV.THINK_TIME_VIEW_SECONDS || 5.0);
const PUBLISHED_APP_ID = __ENV.PUBLISHED_APP_ID || 'published_1774946272392';
const PWA_BASE_PATH = `/convertigo/projects/C8Oforms/DisplayObjects/pwas/${PUBLISHED_APP_ID}`;
const MOBILE_LOGIN_REF = `${ORIGIN}/convertigo/projects/C8Oforms/DisplayObjects/mobile/login/:formId/:page/:edit/:published/:d/:e`;
const MOBILE_SELECTOR_REF = `${ORIGIN}/convertigo/projects/C8Oforms/DisplayObjects/mobile/selector/:published/:folder/:sub/:grid/:shared?formId=:formId&page=selectorPage&edit=:edit&published=null&d=:d&e=:e`;
const MOBILE_PUBLISHED_REF = `${ORIGIN}/convertigo/projects/C8Oforms/DisplayObjects/mobile/selector/true/:folder/:sub/true/true`;
const PWA_VIEWER_REF = `${ORIGIN}${PWA_BASE_PATH}/viewer/${PUBLISHED_APP_ID}/:edit/:i`;
const TEMPERATURE_TABLE_CONFIG = {
  table_id: 'Convertigo NoCode Databases - olivierp@convertigo.com~>Temperatures~>synthetics',
  table_id_int: 767,
  columns: ['date', 't_avg_c'],
  hidden: [],
  form_id: '1774946272392',
  source_id: 1773937886289,
  source_owner: 'olivierp@convertigo.com',
  link_row_table_id: [],
};
const EMPLOYEE_TABLE_CONFIG = {
  table_id: 'Convertigo NoCode Databases - olivierp@convertigo.com~>Employee Directory~>Employees',
  table_id_int: 762,
  columns: [
    'Name',
    'Email',
    'Phone',
    'Picture',
    'Manager of',
    'Unit',
    'Department',
    'Job role',
    'Unit name',
    'Home address',
    'ZIP code',
    'Date of birth',
    'Remarks',
    'Start date',
    'End date',
    'Is active',
    'Status',
    'Birthday this year',
    'Supervisor',
    'Office location',
  ],
  hidden: [],
  form_id: '1774946272392',
  source_id: 1773925939519,
  source_owner: 'olivierp@convertigo.com',
  link_row_table_id: [],
};

function makeUuid() {
  return 'web-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function progress(label) {
  if (DEBUG_PROGRESS) console.log(`[progress] ${label}`);
}

function clampThinkSeconds(value) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function randomThinkSeconds() {
  const min = clampThinkSeconds(THINK_TIME_MIN_SECONDS);
  const max = clampThinkSeconds(THINK_TIME_MAX_SECONDS);
  if (max <= min) return min;
  return min + Math.random() * (max - min);
}

function think(label, seconds = randomThinkSeconds()) {
  if (!THINK_TIME_ENABLED) return;
  const duration = clampThinkSeconds(seconds);
  if (duration <= 0) return;
  progress(`think start: ${label} (${duration.toFixed(2)}s)`);
  sleep(duration);
  progress(`think done: ${label}`);
}

function summarizeBody(res) {
  if (!res || typeof res.body !== 'string') return '';
  return res.body.replace(/\s+/g, ' ').slice(0, 300);
}

function logFailure(label, res, extra = '') {
  if (!DEBUG_FAILURES) return;
  const parts = [
    `label=${label}`,
    `status=${res && typeof res.status !== 'undefined' ? res.status : 'n/a'}`,
    `url=${res && res.request ? res.request.url : 'n/a'}`,
    `duration=${res && typeof res.timings?.duration !== 'undefined' ? Math.round(res.timings.duration) + 'ms' : 'n/a'}`,
  ];
  if (extra) parts.push(extra);
  if (res && res.error) parts.push(`error=${res.error}`);
  if (res && res.error_code) parts.push(`error_code=${res.error_code}`);
  const body = summarizeBody(res);
  if (body) parts.push(`body=${body}`);
  console.warn(`[failure] ${parts.join(' | ')}`);
}

function parseJson(res) {
  try {
    return res.json();
  } catch {
    return null;
  }
}

function getJsonValueAtPath(value, path) {
  let current = value;
  for (const part of path.split('.')) {
    if (current == null || typeof current !== 'object' || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function findAppError(value, path = '$') {
  if (value == null) return null;

  if (typeof value === 'string') {
    if (/\b(error|exception|denied|forbidden|unauthorized)\b/i.test(value)) {
      return `${path}=${value.slice(0, 160)}`;
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = findAppError(value[index], `${path}[${index}]`);
      if (nested) return nested;
    }
    return null;
  }

  if (typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      if (/^(error|errors|exception|exceptions|stack|stacktrace|throwable|cause)$/i.test(key)) {
        return `${path}.${key}`;
      }
      const nested = findAppError(nestedValue, `${path}.${key}`);
      if (nested) return nested;
    }
  }

  return null;
}

function validateBusinessJson(res) {
  const payload = parseJson(res);
  if (payload == null) return 'response body is not valid JSON';
  const errorPath = findAppError(payload);
  return errorPath ? `error marker found at ${errorPath}` : null;
}

function validateAuthenticatedUser(res) {
  const payload = parseJson(res);
  if (payload == null) return 'response body is not valid JSON';
  if (payload.authenticated !== true) return `authenticated=${String(payload.authenticated)}`;
  if (!payload.user) return 'missing user in authenticated session';
  return null;
}

function isAuthenticatedSession(res) {
  const payload = parseJson(res);
  return Boolean(payload && payload.authenticated === true && payload.user);
}

function validateRequiredPaths(paths) {
  return (res) => {
    const payload = parseJson(res);
    if (payload == null) return 'response body is not valid JSON';
    const errorPath = findAppError(payload);
    if (errorPath) return `error marker found at ${errorPath}`;
    for (const path of paths) {
      if (typeof getJsonValueAtPath(payload, path) === 'undefined') {
        return `missing required field ${path}`;
      }
    }
    return null;
  };
}

function expectStatus(res, label, expected = 200, type = 'business', validator = null) {
  let ok = res && res.status === expected;
  let appFailure = null;

  if (ok && validator) {
    appFailure = validator(res);
    ok = !appFailure;
  }

  if (!ok) logFailure(label, res, appFailure ? `app_error=${appFailure}` : '');
  check(res, { [label]: (r) => r && r.status === expected }, { type });
  if (validator) {
    check({ appFailure }, { [`${label} payload valid`]: (v) => !v.appFailure }, { type });
  }
  return ok;
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

function getJson(path, referer, step) {
  progress(`GET start: ${step} ${path}`);
  const res = http.get(`${ORIGIN}${path}`, {
    headers: jsonHeaders(referer),
    tags: { step },
    timeout: CLIENT_TIMEOUT,
  });
  progress(`GET done: ${step} -> ${res.status}`);
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

function postSequence(project, sequence, fields, uuid, step, referer) {
  progress(`sequence start: ${step}`);
  const { body, contentType } = multipartBody({
    ...fields,
    __project: project,
    __sequence: sequence,
    __uuid: uuid,
  });
  const res = http.post(`${ORIGIN}/convertigo/projects/C8Oforms/.json`, body, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': contentType,
      'x-convertigo-mb': X_CONVERTIGO_MB,
      'x-convertigo-sdk': X_CONVERTIGO_SDK,
      ...(referer ? { Referer: referer } : {}),
    },
    tags: { step, sequence },
    timeout: CLIENT_TIMEOUT,
  });
  progress(`sequence done: ${step} -> ${res.status}`);
  return res;
}

function runBootstrapStage(uuid) {
  group('stage: bootstrap', () => {
    [
      ['C8Oforms', 'getGDRPmenu', {}, 'getGDRPmenu'],
      ['C8Oforms', 'getBrevoChatId', {}, 'getBrevoChatId'],
      ['C8Oforms', 'getCurrentUserSettings', {}, 'getCurrentUserSettings'],
      ['C8Oforms', 'getGDRPtoast', {}, 'getGDRPtoast'],
    ].forEach(([project, sequence, fields, step]) => {
      const res = postSequence(project, sequence, fields, uuid, `bootstrap:${step}`, MOBILE_LOGIN_REF);
      const validator = sequence === 'getCurrentUserSettings' ? null : validateBusinessJson;
      expectStatus(res, `${step} ok`, 200, 'business', validator);
    });
  });
}

function runAuthStage(uuid) {
  group('stage: auth-preflight', () => {
    const languageBlank = postSequence(
      'C8Oforms',
      'GetLanguage',
      { __disableAutologin: 'false', email: '' },
      uuid,
      'GetLanguage:blank',
      MOBILE_LOGIN_REF,
    );
    expectStatus(languageBlank, 'GetLanguage blank ok', 200, 'business', validateBusinessJson);

    const authMode = postSequence(
      'C8Oforms',
      'getAvailableAuthModeForLogin',
      { __disableAutologin: 'false' },
      uuid,
      'getAvailableAuthModeForLogin',
      MOBILE_LOGIN_REF,
    );
    expectStatus(authMode, 'auth mode ok', 200, 'business');

    const oauth = postSequence(
      'lib_OAuth',
      'GetOAuthCredentials',
      { __disableAutologin: 'false' },
      uuid,
      'GetOAuthCredentials',
      MOBILE_LOGIN_REF,
    );
    expectStatus(oauth, 'oauth credentials ok', 200, 'business');

    const languageUser = postSequence(
      'C8Oforms',
      'GetLanguage',
      { __localCache_ttl: '3000', __disableAutologin: 'false', email: LOGIN },
      uuid,
      'GetLanguage:user',
      MOBILE_LOGIN_REF,
    );
    expectStatus(languageUser, 'GetLanguage user ok', 200, 'business', validateBusinessJson);
  });
}

function runLoginStage(uuid) {
  group('stage: login', () => {
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
      MOBILE_LOGIN_REF,
    );
    expectStatus(login, 'login ok', 200, 'business', validateBusinessJson);
    think('after login before user-get-auth', 0.5);

    const authenticated = postUserGet(MOBILE_SELECTOR_REF, 'user-get-auth');
    expectStatus(authenticated, 'user-get-auth ok', 200, 'business', validateAuthenticatedUser);
  });
}

function ensureAuthenticatedSession(uuid) {
  const currentSession = postUserGet(MOBILE_SELECTOR_REF, 'user-get-current');
  if (isAuthenticatedSession(currentSession)) {
    expectStatus(currentSession, 'user-get-current ok', 200, 'business', validateAuthenticatedUser);
    progress('session already authenticated, skipping login stage');
    return true;
  }

  progress('no authenticated session detected, running login stage');
  runLoginStage(uuid);
  return false;
}

function runSelectorStage(uuid) {
  group('stage: selector', () => {
    const currentUser = postSequence('C8Oforms', 'getCurrentUserSettings', {}, uuid, 'selector:getCurrentUserSettings', MOBILE_SELECTOR_REF);
    expectStatus(currentUser, 'selector settings ok', 200, 'business');

    const outFolder = postSequence(
      'C8Oforms',
      'APIV2_ExecuteView',
      {
        target: 'formsV2/out_folder',
        acl: 'true',
        dynamicParams: '{"folder":"","filters":{}}',
      },
      uuid,
      'selector:formsV2',
      MOBILE_SELECTOR_REF,
    );
    expectStatus(outFolder, 'forms view ok', 200, 'business', validateRequiredPaths(['res.docs']));

    const templates = postSequence(
      'C8Oforms',
      'APIV2_ExecuteView',
      { target: 'templatesFR' },
      uuid,
      'selector:templatesFR',
      MOBILE_SELECTOR_REF,
    );
    expectStatus(templates, 'templates view ok', 200, 'business', validateRequiredPaths(['res.docs']));
  });
}

function runPublishedOpenStage(uuid) {
  group('stage: published-open', () => {
    const currentUser = postSequence('C8Oforms', 'getCurrentUserSettings', {}, uuid, 'published:getCurrentUserSettings', MOBILE_PUBLISHED_REF);
    expectStatus(currentUser, 'published settings ok', 200, 'business');

    const publishedForms = postSequence(
      'C8Oforms',
      'APIV2_ExecuteView',
      {
        target: 'published_formsV2/out_folder',
        acl: 'true',
        dynamicParams: '{"folder":"","filters":{}}',
      },
      uuid,
      'published:forms',
      MOBILE_PUBLISHED_REF,
    );
    expectStatus(publishedForms, 'published forms ok', 200, 'business', validateRequiredPaths(['res.docs']));
  });
}

function runViewerStage(uuid) {
  group('stage: viewer-bootstrap', () => {
    [
      ['C8Oforms', 'getGDRPmenu', {}, 'getGDRPmenu'],
      ['C8Oforms', 'getBrevoChatId', {}, 'getBrevoChatId'],
      ['C8Oforms', 'getCurrentUserSettings', {}, 'getCurrentUserSettings'],
      ['C8Oforms', 'getGDRPtoast', {}, 'getGDRPtoast'],
    ].forEach(([project, sequence, fields, step]) => {
      const res = postSequence(project, sequence, fields, uuid, `viewer:${step}`, PWA_VIEWER_REF);
      const validator = sequence === 'getCurrentUserSettings' ? null : validateBusinessJson;
      expectStatus(res, `${step} viewer ok`, 200, 'business', validator);
    });
  });
}

function runDocumentStage(uuid) {
  group('stage: document', () => {
    const currentUser = postSequence('C8Oforms', 'getCurrentUserSettings', {}, uuid, 'document:getCurrentUserSettings', PWA_VIEWER_REF);
    expectStatus(currentUser, 'document settings ok', 200, 'business');

    const doc = postSequence(
      'C8Oforms',
      'APIV2_getDocument',
      { id: PUBLISHED_APP_ID },
      uuid,
      'APIV2_getDocument',
      PWA_VIEWER_REF,
    );
    expectStatus(doc, 'document load ok', 200, 'business', validateRequiredPaths(['res._id']));
  });
}

function runDataStage(uuid) {
  group('stage: data-view', () => {
    const tempData = postSequence(
      'lib_BaseRow',
      'formssource_GetTableData',
      {
        forms_config: JSON.stringify(TEMPERATURE_TABLE_CONFIG),
        forms_tableFilter: '{"filters":[],"mode":"AND"}',
        forms_tableSort: '',
      },
      uuid,
      'formssource_GetTableData:temperatures',
      PWA_VIEWER_REF,
    );
    expectStatus(tempData, 'temperatures table ok', 200, 'business', validateBusinessJson);

    const employeeData = postSequence(
      'lib_BaseRow',
      'formssource_GetTableData',
      {
        forms_config: JSON.stringify(EMPLOYEE_TABLE_CONFIG),
        forms_tableFilter: '',
        forms_tableSort: '',
      },
      uuid,
      'formssource_GetTableData:employees',
      PWA_VIEWER_REF,
    );
    expectStatus(employeeData, 'employee table ok', 200, 'business', validateBusinessJson);
  });
}

export default function () {
  if (!LOGIN || !PASSWORD) {
    throw new Error('LOGIN and PASSWORD env vars are required');
  }

  const uuid = makeUuid();

  runBootstrapStage(uuid);
  runAuthStage(uuid);
  const reusedSession = ensureAuthenticatedSession(uuid);
  if (!reusedSession) {
    think('between login and selector', THINK_TIME_AFTER_STAGE_SECONDS);
  }

  runSelectorStage(uuid);
  think('between selector and published open', THINK_TIME_AFTER_STAGE_SECONDS);

  runPublishedOpenStage(uuid);
  think('between published open and viewer', THINK_TIME_AFTER_STAGE_SECONDS);

  runViewerStage(uuid);
  runDocumentStage(uuid);
  runDataStage(uuid);
}
