const view = document.querySelector('#view');
const pauseControl = document.querySelector('#pause-control');
const systemStatus = document.querySelector('#system-status');
const state = { session: null, overview: null, sources: [], connectors: [], exceptions: [], assessments: [], audit: [] };

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.detail ?? body.error ?? 'Studio request failed.');
  return body;
}

function element(name, text, className) {
  const node = document.createElement(name);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function empty(title, detail) {
  const container = element('div', undefined, 'empty');
  container.append(element('strong', title), element('p', detail));
  return container;
}

function renderList(items, label) {
  if (!items.length) return empty(`No ${label}`, 'Only items in the current account scope appear here.');
  const list = element('ul', undefined, 'record-list');
  for (const item of items) {
    const row = element('li');
    row.append(element('strong', item.name ?? item.id), element('span', item.reason_code ?? item.type ?? item.activation_state ?? item.action ?? 'Recorded'));
    list.append(row);
  }
  return list;
}

function render(viewName) {
  view.replaceChildren();
  const title = element('h2', viewName[0].toUpperCase() + viewName.slice(1));
  view.append(title);

  if (viewName === 'exceptions') view.append(renderList(state.exceptions.filter((item) => item.state !== 'dismissed'), 'open exceptions'));
  if (viewName === 'sources') view.append(renderList(state.sources, 'reviewed sources'));
  if (viewName === 'assessments') {
    view.append(element('p', 'Assessment definitions are visible, but execution remains disabled.'));
    view.append(renderList(state.assessments, 'assessments'));
  }
  if (viewName === 'audit') view.append(renderList(state.audit, 'audit events'));
  if (viewName === 'connectors') {
    view.append(element('p', 'Connector configurations remain disabled and make no external calls.'));
    view.append(renderList(state.connectors, 'configured connectors'));
    if (state.session?.capabilities?.includes('account:write')) {
      const fragment = document.querySelector('#connector-form-template').content.cloneNode(true);
      const form = fragment.querySelector('form');
      const select = fragment.querySelector('[name="source_id"]');
      for (const source of state.sources) {
        const option = document.createElement('option');
        option.value = source.id;
        option.textContent = source.name;
        select.append(option);
      }
      form.addEventListener('submit', saveConnector);
      view.append(fragment);
    }
  }
  view.setAttribute('aria-busy', 'false');
}

async function saveConnector(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = String(data.get('id') ?? '');
  const accessMode = String(data.get('access_mode') ?? 'public');
  const credentialRef = String(data.get('credential_ref') ?? '');
  const body = { source_id: String(data.get('source_id') ?? ''), access_mode: accessMode };
  if (accessMode !== 'public' && credentialRef) body.credential_ref = credentialRef;
  await request(`/v1/studio/connectors/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'idempotency-key': crypto.randomUUID() },
    body: JSON.stringify(body),
  });
  state.connectors = (await request('/v1/studio/connectors')).connectors;
  render('connectors');
}

pauseControl.addEventListener('click', async () => {
  const paused = !state.overview.paused;
  state.overview = { ...state.overview, ...(await request('/v1/studio/control/global-pause', {
    method: 'PUT',
    headers: { 'idempotency-key': crypto.randomUUID() },
    body: JSON.stringify({ paused }),
  })) };
  pauseControl.textContent = paused ? 'Resume automations' : 'Pause automations';
  systemStatus.textContent = paused ? 'Automations paused' : 'Local control plane';
});

for (const tab of document.querySelectorAll('[data-view]')) {
  tab.addEventListener('click', () => {
    for (const candidate of document.querySelectorAll('[data-view]')) candidate.setAttribute('aria-pressed', String(candidate === tab));
    render(tab.dataset.view);
  });
}

Promise.all([
  request('/v1/studio/session'),
  request('/v1/studio/overview'),
  request('/v1/studio/sources'),
  request('/v1/studio/connectors'),
  request('/v1/studio/exceptions'),
  request('/v1/studio/assessments'),
  request('/v1/studio/audit'),
]).then(([session, overview, sources, connectors, exceptions, assessments, audit]) => {
  Object.assign(state, {
    session,
    overview,
    sources: sources.sources,
    connectors: connectors.connectors,
    exceptions: exceptions.exceptions,
    assessments: assessments.assessments,
    audit: audit.events,
  });
  document.querySelector('#exception-count').textContent = String(overview.exception_count);
  document.querySelector('#source-count').textContent = String(overview.source_setting_count);
  document.querySelector('#connector-count').textContent = String(overview.connector_count);
  if (session.capabilities.includes('system:pause')) {
    pauseControl.hidden = false;
    pauseControl.textContent = overview.paused ? 'Resume automations' : 'Pause automations';
  }
  systemStatus.textContent = overview.paused ? 'Automations paused' : 'Local control plane';
  render('exceptions');
}).catch((error) => {
  view.replaceChildren(element('h2', 'Studio unavailable'), element('p', error.message));
  view.setAttribute('aria-busy', 'false');
});
