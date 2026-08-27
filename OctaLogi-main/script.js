const SUPABASE_CONFIG = {
  URL: 'https://wszfjtekanydaoafvsbr.supabase.co',
  ANON_KEY: 'sb_publishable_QLLTHNacijFP7lCbZMW-Ng_7nP8DZXx'
};

/* ==========================================================================
   CONFIGURAÇÃO DA API REST DO GLPI (SOMENTE LEITURA / HTTP GET)
   ========================================================================== */
const GLPI_CONFIG = {
  USE_PROXY: false,                                                  // Altere para true se utilizar o Cloudflare Worker Proxy
  PROXY_URL: '',                                                     // URL do seu Worker (ex: https://octologis-glpi-proxy.workers.dev)
  BASE_URL: 'https://helpdesk.lightfarmstudios.com.br/apirest.php', // URL corrigida da API GLPI sem /S no final
  APP_TOKEN: 'Dw54T0fAqZhM4zHWVBtZylhldKnhXcifTUi9uuxX',               // App-Token do GLPI
  USER_TOKEN: 'O7E1mGrsgMYmOC0C8XXnBtzqvIsfnbHSgjowt6Wp',             // User-Token do GLPI
  SESSION_TOKEN: ''                                                 // Session-Token
};

const STORAGE_KEYS = {
  SUPABASE_URL: 'octologis_supabase_url',
  SUPABASE_ANON_KEY: 'octologis_supabase_anon_key',
  GLPI_CACHE: 'octologis_glpi_users_cache'
};

let supabaseClient = null;
let allTrips = [];

function initSupabase() {
  const url = (SUPABASE_CONFIG.URL && SUPABASE_CONFIG.URL.trim())
    ? SUPABASE_CONFIG.URL.trim()
    : localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);

  const anonKey = (SUPABASE_CONFIG.ANON_KEY && SUPABASE_CONFIG.ANON_KEY.trim())
    ? SUPABASE_CONFIG.ANON_KEY.trim()
    : localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY);

  if (url && anonKey && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(url.trim(), anonKey.trim());
      console.log("✅ Supabase conectado com sucesso!");
      return true;
    } catch (err) {
      console.error("Erro ao inicializar Supabase:", err);
      supabaseClient = null;
      return false;
    }
  }
  return false;
}

const topNavbar = document.querySelector('.top-navbar');
const mainContainer = document.getElementById('mainContainer');
const viewDashboard = document.getElementById('viewDashboard');
const viewForm = document.getElementById('viewForm');
const viewHistory = document.getElementById('viewHistory');
const tabBtnDashboard = document.getElementById('tabBtnDashboard');
const tabBtnForm = document.getElementById('tabBtnForm');
const tabBtnHistory = document.getElementById('tabBtnHistory');

const form = document.getElementById('activityForm');
const btnSubmit = document.getElementById('btnSubmit');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const feedbackMessage = document.getElementById('feedbackMessage');

const campoData = document.getElementById('campoData');
const campoOperador = document.getElementById('campoOperador');
const containerOutroOperador = document.getElementById('containerOutroOperador');
const campoOutroOperador = document.getElementById('campoOutroOperador');
const campoNome = document.getElementById('campoNome');
const campoEquipamento = document.getElementById('campoEquipamento');
const campoStatus = document.getElementById('campoStatus');
const campoTipoMovimentacao = document.getElementById('campoTipoMovimentacao');
const campoModalidadePagamento = document.getElementById('campoModalidadePagamento');
const campoTransportadora = document.getElementById('campoTransportadora');
const campoCodigoRastreio = document.getElementById('campoCodigoRastreio');
const containerOutraTransportadora = document.getElementById('containerOutraTransportadora');
const campoOutraTransportadora = document.getElementById('campoOutraTransportadora');
const campoValor = document.getElementById('campoValor');
const campoCentroCusto = document.getElementById('campoCentroCusto');
const containerOutroCentroCusto = document.getElementById('containerOutroCentroCusto');
const campoOutroCentroCusto = document.getElementById('campoOutroCentroCusto');
const campoSetor = document.getElementById('campoSetor');
const campoLinkCard = document.getElementById('campoLinkCard');

const campoArquivo = document.getElementById('campoArquivo');
const fileDropZone = document.getElementById('fileDropZone');
const filesSelectedContainer = document.getElementById('filesSelectedContainer');
const filesCountSummary = document.getElementById('filesCountSummary');
const selectedFilesList = document.getElementById('selectedFilesList');
const btnAddMoreFiles = document.getElementById('btnAddMoreFiles');
const btnClearAllFiles = document.getElementById('btnClearAllFiles');

const tripsTableBody = document.getElementById('tripsTableBody');
const btnRefreshHistory = document.getElementById('btnRefreshHistory');
const kpiTotalTrips = document.getElementById('kpiTotalTrips');
const kpiTotalSpent = document.getElementById('kpiTotalSpent');
const kpiStatusCount = document.getElementById('kpiStatusCount');
const filterSearch = document.getElementById('filterSearch');
const filterStatus = document.getElementById('filterStatus');
const filterTransportadora = document.getElementById('filterTransportadora');
const filterDate = document.getElementById('filterDate');

const attachmentModal = document.getElementById('attachmentModal');
const attachmentModalTitle = document.getElementById('attachmentModalTitle');
const attachmentModalBody = document.getElementById('attachmentModalBody');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limite por arquivo
let selectedFiles = [];
let feedbackTimeoutId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (campoData) {
    campoData.valueAsDate = new Date();
  }

  const formElement = document.getElementById('activityForm');
  if (formElement) {
    formElement.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const submitBtn = document.getElementById('btnSubmit');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
        }
      }
    });
  }

  initSupabase();
  setupFileUploadEvents();
  fetchTrips();
});

function switchView(viewName) {
  if (viewName === 'dashboard') {
    if (viewDashboard) viewDashboard.classList.add('active-view');
    if (viewForm) viewForm.classList.remove('active-view');
    if (viewHistory) viewHistory.classList.remove('active-view');

    if (tabBtnDashboard) tabBtnDashboard.classList.add('active');
    if (tabBtnForm) tabBtnForm.classList.remove('active');
    if (tabBtnHistory) tabBtnHistory.classList.remove('active');

    if (mainContainer) mainContainer.classList.add('wide-mode');
    if (topNavbar) topNavbar.classList.add('wide-mode');

    if (allTrips && allTrips.length > 0) {
      renderDashboard(allTrips);
    } else {
      fetchTrips();
    }
  } else if (viewName === 'form') {
    if (viewDashboard) viewDashboard.classList.remove('active-view');
    if (viewForm) viewForm.classList.add('active-view');
    if (viewHistory) viewHistory.classList.remove('active-view');

    if (tabBtnDashboard) tabBtnDashboard.classList.remove('active');
    if (tabBtnForm) tabBtnForm.classList.add('active');
    if (tabBtnHistory) tabBtnHistory.classList.remove('active');

    if (mainContainer) mainContainer.classList.remove('wide-mode');
    if (topNavbar) topNavbar.classList.remove('wide-mode');
  } else if (viewName === 'history') {
    if (viewDashboard) viewDashboard.classList.remove('active-view');
    if (viewForm) viewForm.classList.remove('active-view');
    if (viewHistory) viewHistory.classList.add('active-view');

    if (tabBtnDashboard) tabBtnDashboard.classList.remove('active');
    if (tabBtnForm) tabBtnForm.classList.remove('active');
    if (tabBtnHistory) tabBtnHistory.classList.add('active');

    if (mainContainer) mainContainer.classList.add('wide-mode');
    if (topNavbar) topNavbar.classList.add('wide-mode');
    fetchTrips();
  }
}

function toggleOutroOperador() {
  const isOutro = campoOperador && campoOperador.value === 'Outro';
  if (containerOutroOperador) {
    containerOutroOperador.style.display = isOutro ? 'block' : 'none';
  }
  if (campoOutroOperador) {
    campoOutroOperador.required = isOutro;
    if (!isOutro) campoOutroOperador.value = '';
  }
}

function toggleEditOutroOperador() {
  const isOutro = editCampoOperador && editCampoOperador.value === 'Outro';
  if (editContainerOutroOperador) {
    editContainerOutroOperador.style.display = isOutro ? 'block' : 'none';
  }
  if (editCampoOutroOperador) {
    editCampoOutroOperador.required = isOutro;
    if (!isOutro) editCampoOutroOperador.value = '';
  }
}

const SETOR_TO_CENTRO_CUSTO = {
  "Administrative Hub Finance": "CC.005.002.000",
  "Administrative Hub General": "CC.005.000.000",
  "Administrative Hub Legal": "CC.005.004.001",
  "Administrative Hub People and Culture": "CC.005.003.000",
  "Business Commercial": "CC.003.002.000",
  "Business Marketing": "CC.003.003.000",
  "Business Pitch Development": "CC.003.001.000",
  "Innovation General": "CC.006.000.000",
  "Innovation Research and Development Game Development": "CC.006.001.003",
  "Innovation Research and Development Information Technology": "CC.006.001.001",
  "Innovation Research and Development Pipeline": "CC.006.001.002",
  "Operational 3D Development General": "CC.004.005.000",
  "Operational 3D Development Simulation": "CC.004.005.001",
  "Operational Animation 2D Animation": "CC.004.006.001",
  "Operational Animation 3D Animation": "CC.004.006.002",
  "Operational Animation Editing": "CC.004.006.004",
  "Operational Animation Rigging": "CC.004.006.003",
  "Operational Animation Storyboard": "CC.004.006.005",
  "Operational Creative Direction": "CC.004.001.000",
  "Operational Creative Project Management": "CC.004.002.000",
  "Operational General": "CC.004.000.000",
  "Operational Post Production Still": "CC.004.007.001",
  "Operational Post Production Video": "CC.004.007.002",
  "Operational Project Production": "CC.004.003.000",
  "Operational Set Production": "CC.004.011.000",
  "Operational Visual Development": "CC.004.004.000",
  "Strategy Executive Management": "CC.002.001.000"
};

function updateCentroCustoFromSetor() {
  if (!campoSetor || !campoCentroCusto) return;
  const setorSelecionado = campoSetor.value;
  const cc = SETOR_TO_CENTRO_CUSTO[setorSelecionado] || '';
  campoCentroCusto.value = cc;
}

function updateEditCentroCustoFromSetor() {
  if (!editCampoSetor || !editCampoCentroCusto) return;
  const setorSelecionado = editCampoSetor.value;
  const cc = SETOR_TO_CENTRO_CUSTO[setorSelecionado] || '';
  editCampoCentroCusto.value = cc;
}

/* ==========================================================================
   INTEGRAÇÃO GLPI REST API (REGRA INVIOLÁVEL: SOMENTE LEITURA / HTTP GET)
   ========================================================================== */

// REGRA INVIOLÁVEL: Função de leitura EXCLUSIVAMENTE via HTTP GET para API GLPI
async function fetchGlpiUsersViaGet(query = '') {
  const term = (query || '').trim().toLowerCase();

  // 1. Suporte a Proxy Serverless (Cloudflare Worker) para contornar CORS e ocultar tokens
  if (GLPI_CONFIG.USE_PROXY && GLPI_CONFIG.PROXY_URL) {
    try {
      const proxyUrl = (GLPI_CONFIG.PROXY_URL || '').trim().replace(/\/+$/, '');
      console.log("🔄 Consultando colaboradores via Proxy Serverless Worker...");
      const response = await fetch(proxyUrl, { method: 'GET' });

      if (response.ok) {
        const data = await response.json();
        const mapped = processRawGlpiUsers(data);
        if (mapped && mapped.length > 0) {
          console.log(`✅ GLPI Proxy Worker: Retornados ${mapped.length} colaboradores!`);
          saveGlpiUsersToCache(mapped);
          const filtered = filterGlpiUsers(mapped, term);
          return { data: filtered, isCached: false, error: null };
        }
      } else {
        console.warn(`⚠️ Proxy Worker GLPI retornou status HTTP ${response.status}`);
      }
    } catch (proxyErr) {
      console.warn("Aviso ao conectar com Proxy Worker GLPI:", proxyErr);
    }
  }

  // 2. Consulta Direta ao GLPI (com URL corrigida e initSession via Header Authorization)
  const baseUrl = (GLPI_CONFIG.BASE_URL || '').trim().replace(/\/+$/, '');
  if (baseUrl && GLPI_CONFIG.APP_TOKEN) {
    try {
      const appToken = GLPI_CONFIG.APP_TOKEN.trim();
      const userToken = (GLPI_CONFIG.USER_TOKEN && !GLPI_CONFIG.USER_TOKEN.includes('SEU_USER_TOKEN')) ? GLPI_CONFIG.USER_TOKEN.trim() : '';

      // Autenticação initSession enviando user_token no header Authorization (BUG 2 CORRIGIDO)
      if (!GLPI_CONFIG.SESSION_TOKEN && userToken) {
        try {
          const initUrl = `${baseUrl}/initSession`;
          console.log("🔄 Conectando à API GLPI via GET /initSession (Header Authorization)...");

          const initResp = await fetch(initUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'App-Token': appToken,
              'Authorization': `user_token ${userToken}`
            }
          });

          if (initResp.ok) {
            const initData = await initResp.json();
            if (initData && initData.session_token) {
              GLPI_CONFIG.SESSION_TOKEN = initData.session_token;
              console.log("✅ Sessão GLPI iniciada com sucesso via Header Authorization! Session-Token:", GLPI_CONFIG.SESSION_TOKEN);
            }
          } else {
            const errInit = await initResp.text().catch(() => '');
            console.warn(`⚠️ initSession GLPI retornou código ${initResp.status}:`, errInit);
          }
        } catch (initErr) {
          console.warn("Aviso na inicialização de sessão GLPI via GET:", initErr);
        }
      }

      const sessionToken = GLPI_CONFIG.SESSION_TOKEN || '';
      const searchUrl = `${baseUrl}/User?expand_dropdowns=true&is_recursive=true&get_all=true&range=0-1000&range_size=1000&is_deleted=0` +
        `&app_token=${encodeURIComponent(appToken)}` +
        (sessionToken ? `&session_token=${encodeURIComponent(sessionToken)}` : (userToken ? `&user_token=${encodeURIComponent(userToken)}` : ''));

      // 1. Remoção do Header Bloqueado pelo CORS preflight do GLPI
      const headers = {
        'Content-Type': 'application/json',
        'App-Token': appToken
      };

      if (sessionToken) {
        headers['Session-Token'] = sessionToken;
      } else if (userToken) {
        headers['Authorization'] = `user_token ${userToken}`;
      }

      // EXCLUSIVAMENTE GET - NENHUM OUTRO MÉTODO É UTILIZADO
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 [GLPI API GET Response Bruto]:", data);

        const mapped = processRawGlpiUsers(data);
        if (mapped && mapped.length > 0) {
          console.log(`✅ GLPI API: Retornados ${mapped.length} colaboradores com sucesso!`);
          saveGlpiUsersToCache(mapped);
          const filtered = filterGlpiUsers(mapped, term);
          return { data: filtered, isCached: false, error: null };
        }
      } else {
        const errText = await response.text().catch(() => '');
        console.error(`❌ GLPI API retornou erro HTTP ${response.status} (${response.statusText}):`, errText);
      }
    } catch (err) {
      console.error("❌ ERRO NA CONEXÃO HTTP GET GLPI (Verifique CORS ou F12 Console):", err);
    }
  }

  // 3. Fallback Real para LocalStorage Cache
  const cachedUsers = getGlpiUsersFromCache();
  if (cachedUsers && cachedUsers.length > 0) {
    console.warn("⚡ GLPI ao vivo indisponível. Utilizando colaboradores do cache local (localStorage).");
    const filteredCached = filterGlpiUsers(cachedUsers, term);
    return { data: filteredCached, isCached: true, error: null };
  }

  return { data: [], isCached: false, error: "Falha na conexão com o GLPI" };
}

function processRawGlpiUsers(data) {
  let rawList = [];
  if (Array.isArray(data)) {
    rawList = data;
  } else if (data && Array.isArray(data.data)) {
    rawList = data.data;
  } else if (data && typeof data === 'object') {
    rawList = Object.values(data).filter(item => item && typeof item === 'object');
  }

  if (rawList.length === 0) return [];

  return rawList.map(u => {
    const firstname = String(u.firstname || u[34] || u['34'] || '').trim();
    const realname = String(u.realname || u[9] || u['9'] || '').trim();
    const username = String(u.name || u[1] || u['1'] || '').trim();
    const completename = String(u.completename || u[80] || u['80'] || '').trim();

    let displayName = '';
    if (firstname && realname) {
      displayName = `${firstname} ${realname}`;
    } else if (firstname || realname) {
      displayName = firstname || realname;
    } else if (completename) {
      displayName = completename;
    } else {
      displayName = username || 'Colaborador GLPI';
    }

    const sectorName = u.completename_group || u.entity_name || u.location_name || u.setor || u[70] || u['70'] || '';
    const matchedSetor = findMatchingSetor(sectorName);
    const cc = SETOR_TO_CENTRO_CUSTO[matchedSetor] || u.centro_custo || 'CC.004.000.000';

    return {
      id: u.id || u[2] || u['2'] || Math.random(),
      name: displayName,
      username: username,
      firstname: firstname,
      realname: realname,
      setor: matchedSetor || 'Operational General',
      centro_custo: cc
    };
  }).filter(u => u.name && u.name !== 'Colaborador GLPI');
}

function filterGlpiUsers(list, term) {
  if (!term) return list;
  return list.filter(u =>
    u.name.toLowerCase().includes(term) ||
    u.username.toLowerCase().includes(term) ||
    u.firstname.toLowerCase().includes(term) ||
    u.realname.toLowerCase().includes(term) ||
    u.setor.toLowerCase().includes(term)
  );
}

function saveGlpiUsersToCache(users) {
  try {
    if (Array.isArray(users) && users.length > 0) {
      localStorage.setItem(STORAGE_KEYS.GLPI_CACHE, JSON.stringify(users));
    }
  } catch (e) {
    console.warn("Aviso ao salvar cache local do GLPI:", e);
  }
}

function getGlpiUsersFromCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GLPI_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Aviso ao carregar cache local do GLPI:", e);
  }
  return [];
}

function findMatchingSetor(rawName) {
  if (!rawName) return '';
  const lower = String(rawName).toLowerCase();
  for (const setorName of Object.keys(SETOR_TO_CENTRO_CUSTO)) {
    if (lower.includes(setorName.toLowerCase()) || setorName.toLowerCase().includes(lower)) {
      return setorName;
    }
  }
  return '';
}

let glpiDebounceTimer = null;
let editGlpiDebounceTimer = null;

function handleGlpiUserSearch(e) {
  const query = e ? e.target.value : '';
  const dropdown = document.getElementById('glpiUserResults');
  if (!dropdown) return;

  if (glpiDebounceTimer) clearTimeout(glpiDebounceTimer);

  glpiDebounceTimer = setTimeout(async () => {
    const resultObj = await fetchGlpiUsersViaGet(query);
    renderGlpiUserDropdown(resultObj, dropdown, (selectedUser) => {
      selectGlpiUserForMainForm(selectedUser);
    });
  }, query ? 250 : 0);
}

function handleEditGlpiUserSearch(e) {
  const query = e ? e.target.value : '';
  const dropdown = document.getElementById('editGlpiUserResults');
  if (!dropdown) return;

  if (editGlpiDebounceTimer) clearTimeout(editGlpiDebounceTimer);

  editGlpiDebounceTimer = setTimeout(async () => {
    const resultObj = await fetchGlpiUsersViaGet(query);
    renderGlpiUserDropdown(resultObj, dropdown, (selectedUser) => {
      selectGlpiUserForEditForm(selectedUser);
    });
  }, query ? 250 : 0);
}

function renderGlpiUserDropdown(resultObj, dropdownEl, onSelectCallback) {
  const isObject = resultObj && typeof resultObj === 'object' && !Array.isArray(resultObj);
  const results = isObject ? (resultObj.data || []) : (Array.isArray(resultObj) ? resultObj : []);
  const isCached = isObject ? !!resultObj.isCached : false;

  const isEdit = dropdownEl.id === 'editGlpiUserResults';
  const inputField = isEdit ? document.getElementById('editCampoNome') : document.getElementById('campoNome');
  const queryInput = inputField ? inputField.value.trim() : '';

  let htmlContent = '';

  if (isCached && results.length > 0) {
    htmlContent += '<div class="autocomplete-cache-badge">⚡ GLPI offline — exibindo última lista salva em cache</div>';
  }

  if (!results || results.length === 0) {
    if (queryInput) {
      dropdownEl.innerHTML = `
        <div class="autocomplete-item" onclick='selectGlpiUserItem(${JSON.stringify({
          name: queryInput,
          setor: "Operational General",
          centro_custo: "CC.004.000.000",
          isCustom: true
        }).replace(/'/g, "&apos;")}, this)'>
          <div class="autocomplete-item-title">✏️ Usar nome digitado: <strong>${escapeHtml(queryInput)}</strong></div>
          <div class="autocomplete-item-subtitle"><span>Definir manualmente</span></div>
        </div>
      `;
      dropdownEl._onSelect = onSelectCallback;
      dropdownEl.style.display = 'flex';
      return;
    }
    dropdownEl.innerHTML = '<div class="autocomplete-empty">Nenhum colaborador encontrado no GLPI.</div>';
    dropdownEl.style.display = 'flex';
    return;
  }

  htmlContent += results.map(u => `
    <div class="autocomplete-item" onclick='selectGlpiUserItem(${JSON.stringify(u).replace(/'/g, "&apos;")}, this)'>
      <div class="autocomplete-item-title">${escapeHtml(u.name)}</div>
      <div class="autocomplete-item-subtitle">
        <span>🏢 ${escapeHtml(u.setor)}</span>
        <span>• ${escapeHtml(u.centro_custo)}</span>
      </div>
    </div>
  `).join('');

  dropdownEl.innerHTML = htmlContent;
  dropdownEl._onSelect = onSelectCallback;
  dropdownEl.style.display = 'flex';
}

function selectGlpiUserItem(userObj, el) {
  const dropdownEl = el.closest('.autocomplete-dropdown');
  if (dropdownEl && typeof dropdownEl._onSelect === 'function') {
    dropdownEl._onSelect(userObj);
    dropdownEl.style.display = 'none';
  }
}

function selectGlpiUserForMainForm(user) {
  if (!user) return;
  if (campoNome) campoNome.value = user.name;
  if (campoSetor) {
    campoSetor.value = user.setor;
    if (user.isCustom) {
      campoSetor.classList.remove('field-locked');
    } else {
      campoSetor.classList.add('field-locked');
    }
  }
  if (campoCentroCusto) {
    campoCentroCusto.value = user.centro_custo;
    if (user.isCustom) {
      campoCentroCusto.classList.remove('field-locked');
    } else {
      campoCentroCusto.classList.add('field-locked');
    }
  }
}

function selectGlpiUserForEditForm(user) {
  if (!user) return;
  if (editCampoNome) editCampoNome.value = user.name;
  if (editCampoSetor) {
    editCampoSetor.value = user.setor;
    if (user.isCustom) {
      editCampoSetor.classList.remove('field-locked');
    } else {
      editCampoSetor.classList.add('field-locked');
    }
  }
  if (editCampoCentroCusto) {
    editCampoCentroCusto.value = user.centro_custo;
    if (user.isCustom) {
      editCampoCentroCusto.classList.remove('field-locked');
    } else {
      editCampoCentroCusto.classList.add('field-locked');
    }
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.autocomplete-input-wrapper') && !e.target.closest('.autocomplete-dropdown')) {
    const drop1 = document.getElementById('glpiUserResults');
    const drop2 = document.getElementById('editGlpiUserResults');
    if (drop1) drop1.style.display = 'none';
    if (drop2) drop2.style.display = 'none';
  }
});

function toggleOutraTransportadora() {
  const isOutra = campoTransportadora && (campoTransportadora.value === 'Outra' || campoTransportadora.value === 'OUTRA');
  if (containerOutraTransportadora) {
    containerOutraTransportadora.style.display = isOutra ? 'block' : 'none';
  }
  if (campoOutraTransportadora) {
    campoOutraTransportadora.required = isOutra;
    if (!isOutra) campoOutraTransportadora.value = '';
  }
}

function toggleEditOutraTransportadora() {
  const isOutra = editCampoTransportadora && (editCampoTransportadora.value === 'Outra' || editCampoTransportadora.value === 'OUTRA');
  if (editContainerOutraTransportadora) {
    editContainerOutraTransportadora.style.display = isOutra ? 'block' : 'none';
  }
  if (editCampoOutraTransportadora) {
    editCampoOutraTransportadora.required = isOutra;
    if (!isOutra) editCampoOutraTransportadora.value = '';
  }
}

/* ==========================================================================
   MÁSCARA DE MOEDA EM REAIS (R$)
   ========================================================================== */
function formatBRLValue(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  let digitsOnly = String(value).replace(/\D/g, '');
  if (!digitsOnly) return '';

  let numberValue = parseInt(digitsOnly, 10) / 100;
  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function parseCurrencyFloat(valString) {
  if (!valString) return 0;
  if (typeof valString === 'number') return valString;
  const cleanStr = String(valString).replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanStr) || 0;
}

function handleCurrencyMask(e) {
  const input = e.target;
  if (!input) return;
  input.value = formatBRLValue(input.value);
}

function handleCurrencyBlur(e) {
  const input = e.target;
  if (!input || !input.value.trim()) return;
  input.value = formatBRLValue(input.value);
}

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx', '.xls', '.xlsx'];
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.js', '.vbs', '.html', '.htm', '.svg', '.jar', '.apk', '.bin', '.msi', '.dll', '.scr', '.ps1'];

function isAllowedFile(file) {
  if (!file || !file.name) return false;
  const lowerName = file.name.toLowerCase();

  for (const ext of BLOCKED_EXTENSIONS) {
    if (lowerName.endsWith(ext)) return false;
  }

  return ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^(javascript:|vbscript:|data:text\/html)/i.test(trimmed)) {
    return '';
  }
  if (/^(https?:\/\/|blob:|\/)/i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

function sanitizeLinkCard(rawLink) {
  if (!rawLink || typeof rawLink !== 'string') return { isUrl: false, text: '', href: '' };
  const trimmed = rawLink.trim();
  if (!trimmed) return { isUrl: false, text: '', href: '' };

  if (/^(javascript:|vbscript:|data:)/i.test(trimmed)) {
    return { isUrl: false, text: trimmed, href: '' };
  }

  const isUrl = /^https?:\/\//i.test(trimmed) || trimmed.startsWith('www.') || (trimmed.includes('.') && trimmed.includes('/'));
  if (isUrl) {
    const href = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    return { isUrl: true, text: trimmed, href: href };
  }

  return { isUrl: false, text: trimmed, href: '' };
}

function setupFileUploadEvents() {
  if (!fileDropZone || !campoArquivo) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    fileDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    fileDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropZone.classList.remove('dragover');
    });
  });

  fileDropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesSelected(files);
    }
  });

  campoArquivo.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
  });

  if (btnAddMoreFiles) {
    btnAddMoreFiles.addEventListener('click', () => {
      campoArquivo.click();
    });
  }

  if (btnClearAllFiles) {
    btnClearAllFiles.addEventListener('click', () => {
      clearAllSelectedFiles();
    });
  }
}

function handleFilesSelected(filesList) {
  if (!filesList || filesList.length === 0) return;

  const oversizedFiles = [];
  const rejectedFiles = [];

  Array.from(filesList).forEach(file => {
    if (!isAllowedFile(file)) {
      rejectedFiles.push(file.name);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      oversizedFiles.push(`${file.name} (${formatBytes(file.size)})`);
      return;
    }

    const alreadyExists = selectedFiles.some(f =>
      f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      selectedFiles.push(file);
    }
  });

  if (rejectedFiles.length > 0) {
    alert(`⚠️ Atenção: O(s) arquivo(s) a seguir possuem formato não permitido por segurança:\n\n• ${rejectedFiles.join('\n• ')}\n\nFormatos aceitos: PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX.`);
  }

  if (oversizedFiles.length > 0) {
    alert(`⚠️ Atenção: O(s) seguinte(s) arquivo(s) ultrapassam o limite máximo de 10MB por arquivo e não foram adicionados:\n\n• ${oversizedFiles.join('\n• ')}`);
  }

  renderSelectedFilesList();
  campoArquivo.value = '';
}

function renderSelectedFilesList() {
  if (!filesSelectedContainer || !selectedFilesList) return;

  if (selectedFiles.length === 0) {
    filesSelectedContainer.style.display = 'none';
    selectedFilesList.innerHTML = '';
    return;
  }

  filesSelectedContainer.style.display = 'flex';
  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const countLabel = selectedFiles.length === 1 ? '1 arquivo selecionado' : `${selectedFiles.length} arquivos selecionados`;
  filesCountSummary.textContent = `${countLabel} (${formatBytes(totalSize)})`;

  selectedFilesList.innerHTML = selectedFiles.map((file, index) => {
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const iconType = isImage ? 'image' : (isPdf ? 'pdf' : 'doc');

    let iconContent = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
    `;
    if (isImage) {
      const thumbUrl = URL.createObjectURL(file);
      iconContent = `<img src="${thumbUrl}" alt="Preview" class="file-thumb-img">`;
    }

    return `
      <div class="selected-file-item">
        <div class="selected-file-info">
          <div class="selected-file-icon ${iconType}">
            ${iconContent}
          </div>
          <div class="selected-file-details">
            <span class="selected-file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
            <span class="selected-file-size">${formatBytes(file.size)}</span>
          </div>
        </div>
        <button type="button" class="btn-remove-single-file" onclick="removeSelectedFile(${index})" title="Remover este arquivo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

function removeSelectedFile(index) {
  selectedFiles.splice(index, 1);
  renderSelectedFilesList();
}

function clearAllSelectedFiles() {
  selectedFiles = [];
  if (campoArquivo) campoArquivo.value = '';
  renderSelectedFilesList();
}

function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function parseTripAttachments(trip) {
  if (!trip) return [];
  if (Array.isArray(trip.anexos)) return trip.anexos;
  if (!trip.arquivo_url) return [];

  const rawUrl = String(trip.arquivo_url).trim();
  if (!rawUrl) return [];

  if (rawUrl.startsWith('[') && rawUrl.endsWith(']')) {
    try {
      const parsed = JSON.parse(rawUrl);
      if (Array.isArray(parsed)) {
        return parsed.map(item => {
          if (typeof item === 'string') return { url: item, name: 'Comprovante' };
          return {
            url: item.url,
            name: item.name || item.nome || 'Comprovante',
            size: item.size || null
          };
        });
      }
    } catch (e) {
      console.warn("Erro ao fazer parse dos anexos:", e);
    }
  }

  return [{
    url: rawUrl,
    name: trip.arquivo_nome || 'Comprovante'
  }];
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (!supabaseClient) {
    showFeedback('error', '⚠️ Supabase não conectado. Verifique a URL e a Anon Key no arquivo script.js.');
    return;
  }

  setLoadingState(true);
  hideFeedback();

  try {
    const uploadedAttachments = [];

    if (selectedFiles && selectedFiles.length > 0) {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `anexos/${Date.now()}_${i}_${sanitizedFileName}`;

        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('anexos_viagens')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Erro ao fazer upload do arquivo "${file.name}": ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabaseClient.storage
          .from('anexos_viagens')
          .getPublicUrl(filePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          uploadedAttachments.push({
            url: publicUrlData.publicUrl,
            name: file.name,
            size: file.size
          });
        }
      }
    }

    let finalArquivoUrl = null;
    let finalArquivoNome = null;

    if (uploadedAttachments.length === 1) {
      finalArquivoUrl = uploadedAttachments[0].url;
      finalArquivoNome = uploadedAttachments[0].name;
    } else if (uploadedAttachments.length > 1) {
      finalArquivoUrl = JSON.stringify(uploadedAttachments);
      finalArquivoNome = `${uploadedAttachments.length} arquivos anexados`;
    }

    let finalOperador = (campoOperador && campoOperador.value) || null;
    if (finalOperador === 'Outro' && campoOutroOperador && campoOutroOperador.value.trim()) {
      finalOperador = campoOutroOperador.value.trim();
    }

    let finalTransportadora = (campoTransportadora && campoTransportadora.value.trim()) || null;
    if ((finalTransportadora === 'Outra' || finalTransportadora === 'OUTRA') && campoOutraTransportadora && campoOutraTransportadora.value.trim()) {
      finalTransportadora = campoOutraTransportadora.value.trim();
    }

    let finalCentroCusto = (campoCentroCusto && campoCentroCusto.value.trim()) || null;
    let finalSetor = (campoSetor && campoSetor.value.trim()) || null;

    const newTrip = {
      data: campoData.value,
      operador: finalOperador,
      nome_completo: campoNome.value.trim(),
      equipamento: (campoEquipamento && campoEquipamento.value.trim()) || null,
      status: campoStatus.value,
      tipo_movimentacao: (campoTipoMovimentacao && campoTipoMovimentacao.value) || null,
      modalidade_pagamento: (campoModalidadePagamento && campoModalidadePagamento.value) || 'Pós-pago',
      transportadora: finalTransportadora,
      codigo_rastreio: (campoCodigoRastreio && campoCodigoRastreio.value.trim()) || null,
      valor: parseCurrencyFloat(campoValor.value),
      centro_custo: finalCentroCusto,
      setor: finalSetor,
      link_card: campoLinkCard.value.trim() || null,
      arquivo_url: finalArquivoUrl,
      arquivo_nome: finalArquivoNome
    };

    const { data: insertData, error: insertError } = await supabaseClient
      .from('viagens')
      .insert([newTrip])
      .select();

    if (insertError) {
      throw new Error(`Erro ao salvar no banco: ${insertError.message}`);
    }

    showFeedback('success', `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>Viagem registrada com sucesso!</span>
    `);

    form.reset();
    clearAllSelectedFiles();
    if (containerOutroOperador) containerOutroOperador.style.display = 'none';
    if (containerOutraTransportadora) containerOutraTransportadora.style.display = 'none';
    if (containerOutroCentroCusto) containerOutroCentroCusto.style.display = 'none';
    if (campoData) {
      campoData.valueAsDate = new Date();
    }

    if (feedbackTimeoutId) clearTimeout(feedbackTimeoutId);
    feedbackTimeoutId = setTimeout(() => {
      hideFeedback();
    }, 5000);

  } catch (err) {
    console.error("Erro na gravação:", err);
    showFeedback('error', `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${escapeHtml(err.message || 'Ocorreu um erro ao salvar o registro.')}</span>
    `);
  } finally {
    setLoadingState(false);
  }
});

async function fetchTrips() {
  if (!supabaseClient) {
    tripsTableBody.innerHTML = `
      <tr>
        <td colspan="14">
          <div class="table-empty-state">
            <p>⚠️ Supabase não conectado. Verifique a URL e a Anon Key no arquivo script.js.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  btnRefreshHistory.classList.add('loading');
  tripsTableBody.innerHTML = `
    <tr>
      <td colspan="14">
        <div class="table-empty-state">
          <p>Carregando registros de viagens...</p>
        </div>
      </td>
    </tr>
  `;

  try {
    const { data, error } = await supabaseClient
      .from('viagens')
      .select('*')
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    allTrips = data || [];
    renderTripsTable(allTrips);
    updateKPIs(allTrips);
    renderDashboard(allTrips);

  } catch (err) {
    console.error("Erro ao buscar viagens:", err);
    tripsTableBody.innerHTML = `
      <tr>
        <td colspan="14">
          <div class="table-empty-state" style="color: #F87171;">
            <p>Erro ao consultar o Supabase: ${escapeHtml(err.message || 'Falha na comunicação')}</p>
            <p style="font-size:0.75rem; margin-top:4px; color:var(--text-muted);">Verifique se você executou o script <code>supabase_setup.sql</code> no seu projeto.</p>
          </div>
        </td>
      </tr>
    `;
  } finally {
    btnRefreshHistory.classList.remove('loading');
  }
}

/* ==========================================================================
   LÓGICA E RENDERIZAÇÃO DO DASHBOARD ANALÍTICO
   ========================================================================== */

let dashCharts = {
  monthly: null,
  status: null,
  carrier: null,
  sector: null
};

function onDashPeriodChange() {
  renderDashboard(allTrips);
}

function filterTripsByDashPeriod(trips, period) {
  if (!period || period === 'all') return trips;
  const now = new Date();

  if (period === 'month') {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return trips.filter(t => {
      if (!t.data) return false;
      const d = new Date(t.data + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }

  if (period === 'last30') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return trips.filter(t => {
      if (!t.data) return false;
      const d = new Date(t.data + 'T00:00:00');
      return d >= cutoff;
    });
  }

  if (period === 'year') {
    const currentYear = now.getFullYear();
    return trips.filter(t => {
      if (!t.data) return false;
      const d = new Date(t.data + 'T00:00:00');
      return d.getFullYear() === currentYear;
    });
  }

  return trips;
}

function renderDashboard(trips) {
  const periodSelect = document.getElementById('dashPeriodSelect');
  const selectedPeriod = periodSelect ? periodSelect.value : 'all';
  const filtered = filterTripsByDashPeriod(trips, selectedPeriod);

  // 1. Métricas KPIs
  const totalSpent = filtered.reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  const totalCount = filtered.length;
  const enviosFiltered = filtered.filter(t => t.status === 'Envio');
  const recolhimentosFiltered = filtered.filter(t => t.status === 'Recolhimento');

  const enviosCount = enviosFiltered.length;
  const recolhimentosCount = recolhimentosFiltered.length;
  const enviosSpent = enviosFiltered.reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  const recolhimentosSpent = recolhimentosFiltered.reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  const avgTicket = totalCount > 0 ? (totalSpent / totalCount) : 0;

  // Transportadoras
  const carrierCounts = {};
  const carrierSpent = {};
  filtered.forEach(t => {
    const c = t.transportadora || 'Outra';
    carrierCounts[c] = (carrierCounts[c] || 0) + 1;
    carrierSpent[c] = (carrierSpent[c] || 0) + (Number(t.valor) || 0);
  });

  let topCarrier = '-';
  let maxCarrierCount = 0;
  Object.keys(carrierCounts).forEach(c => {
    if (carrierCounts[c] > maxCarrierCount) {
      maxCarrierCount = carrierCounts[c];
      topCarrier = c;
    }
  });

  // Setores
  const sectorSpent = {};
  filtered.forEach(t => {
    const s = t.setor || 'Não especificado';
    sectorSpent[s] = (sectorSpent[s] || 0) + (Number(t.valor) || 0);
  });

  let topSector = '-';
  let maxSectorSpent = 0;
  Object.keys(sectorSpent).forEach(s => {
    if (sectorSpent[s] > maxSectorSpent) {
      maxSectorSpent = sectorSpent[s];
      topSector = s;
    }
  });

  // Atualizar elementos no DOM
  const elTotalSpent = document.getElementById('dashKpiTotalSpent');
  const elTotalCount = document.getElementById('dashKpiTotalCount');
  const elRatio = document.getElementById('dashKpiRatio');
  const elAvgTicket = document.getElementById('dashKpiAvgTicket');
  const elTopCarrier = document.getElementById('dashKpiTopCarrier');
  const elTopCarrierSub = document.getElementById('dashKpiTopCarrierSub');
  const elTopSector = document.getElementById('dashKpiTopSector');
  const elTopSectorSub = document.getElementById('dashKpiTopSectorSub');

  if (elTotalSpent) elTotalSpent.textContent = formatCurrencyBRL(totalSpent);
  if (elTotalCount) elTotalCount.textContent = totalCount;
  if (elRatio) elRatio.textContent = `${enviosCount} Envios • ${recolhimentosCount} Recolhimentos`;
  if (elAvgTicket) elAvgTicket.textContent = formatCurrencyBRL(avgTicket);

  if (elTopCarrier) elTopCarrier.textContent = topCarrier;
  if (elTopCarrierSub) elTopCarrierSub.textContent = topCarrier !== '-' ? `${maxCarrierCount} operações (${formatCurrencyBRL(carrierSpent[topCarrier] || 0)})` : 'Sem dados';

  if (elTopSector) {
    elTopSector.textContent = topSector.length > 22 ? topSector.substring(0, 20) + '...' : topSector;
    elTopSector.title = topSector;
  }
  if (elTopSectorSub) elTopSectorSub.textContent = topSector !== '-' ? `${formatCurrencyBRL(maxSectorSpent)} acumulados` : 'Sem dados';

  // Renderizar Gráficos (se Chart.js estiver carregado)
  if (typeof Chart !== 'undefined') {
    renderChartMonthlySpent(filtered);
    renderChartStatusRatio(enviosCount, recolhimentosCount, enviosSpent, recolhimentosSpent);
    renderChartCarrierSpent(carrierSpent);
    renderChartSectorSpent(sectorSpent);
  }

  // Tabela de atividades recentes
  renderDashRecentTable(trips.slice(0, 5));
}

function renderChartMonthlySpent(trips) {
  const canvas = document.getElementById('chartMonthlySpent');
  if (!canvas) return;

  const monthlyData = {};
  trips.forEach(t => {
    if (!t.data) return;
    const ymd = t.data.substring(0, 7);
    monthlyData[ymd] = (monthlyData[ymd] || 0) + (Number(t.valor) || 0);
  });

  const sortedKeys = Object.keys(monthlyData).sort();
  const labels = sortedKeys.map(key => {
    const [y, m] = key.split('-');
    const dateObj = new Date(y, m - 1, 1);
    return dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
  });
  const dataValues = sortedKeys.map(k => monthlyData[k]);

  if (dashCharts.monthly) {
    dashCharts.monthly.destroy();
  }

  dashCharts.monthly = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['Sem dados'],
      datasets: [{
        label: 'Gasto Mensal (R$)',
        data: dataValues.length ? dataValues : [0],
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#818CF8',
        pointBorderColor: '#0F172A',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ' Gasto: ' + formatCurrencyBRL(ctx.raw);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94A3B8',
            font: { family: 'Inter', size: 11 },
            callback: function(v) { return 'R$ ' + v; }
          }
        }
      }
    }
  });
}

function renderChartStatusRatio(envios, recolhimentos, enviosSpent = 0, recolhimentosSpent = 0) {
  const canvas = document.getElementById('chartStatusRatio');
  if (!canvas) return;

  if (dashCharts.status) {
    dashCharts.status.destroy();
  }

  dashCharts.status = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Envios', 'Recolhimentos'],
      datasets: [{
        data: [envios, recolhimentos],
        backgroundColor: ['#6366F1', '#F59E0B'],
        borderWidth: 2,
        borderColor: '#1E293B',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const val = ctx.raw;
              const spent = ctx.dataIndex === 0 ? enviosSpent : recolhimentosSpent;
              return ` ${ctx.label}: ${val} oper. (${formatCurrencyBRL(spent)})`;
            }
          }
        }
      },
      cutout: '68%'
    }
  });

  const breakdownContainer = document.getElementById('statusRatioBreakdown');
  if (breakdownContainer) {
    const totalSpent = enviosSpent + recolhimentosSpent;
    const enviosPct = totalSpent > 0 ? ((enviosSpent / totalSpent) * 100).toFixed(1) : '0';
    const recolhimentosPct = totalSpent > 0 ? ((recolhimentosSpent / totalSpent) * 100).toFixed(1) : '0';

    breakdownContainer.innerHTML = `
      <div class="breakdown-row">
        <div class="breakdown-left">
          <span class="breakdown-dot" style="background:#6366F1;"></span>
          <span class="breakdown-name">Envios (${envios} oper.)</span>
        </div>
        <div class="breakdown-right">
          <span class="breakdown-amount">${formatCurrencyBRL(enviosSpent)}</span>
          <span class="breakdown-pill">${enviosPct}%</span>
        </div>
      </div>
      <div class="breakdown-row">
        <div class="breakdown-left">
          <span class="breakdown-dot" style="background:#F59E0B;"></span>
          <span class="breakdown-name">Recolhimentos (${recolhimentos} oper.)</span>
        </div>
        <div class="breakdown-right">
          <span class="breakdown-amount">${formatCurrencyBRL(recolhimentosSpent)}</span>
          <span class="breakdown-pill">${recolhimentosPct}%</span>
        </div>
      </div>
    `;
  }
}

function renderChartCarrierSpent(carrierSpentObj) {
  const canvas = document.getElementById('chartCarrierSpent');
  if (!canvas) return;

  const sortedCarriers = Object.entries(carrierSpentObj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const labels = sortedCarriers.map(item => item[0]);
  const values = sortedCarriers.map(item => item[1]);

  if (dashCharts.carrier) {
    dashCharts.carrier.destroy();
  }

  dashCharts.carrier = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['Sem dados'],
      datasets: [{
        label: 'Gasto Total (R$)',
        data: values.length ? values : [0],
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) { return ' Total: ' + formatCurrencyBRL(ctx.raw); }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#E2E8F0', font: { family: 'Inter', size: 11 } }
        }
      }
    }
  });
}

function renderChartSectorSpent(sectorSpentObj) {
  const canvas = document.getElementById('chartSectorSpent');
  if (!canvas) return;

  const sortedSectors = Object.entries(sectorSpentObj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const labels = sortedSectors.map(item => item[0].length > 18 ? item[0].substring(0, 16) + '...' : item[0]);
  const values = sortedSectors.map(item => item[1]);
  const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#64748B'];

  if (dashCharts.sector) {
    dashCharts.sector.destroy();
  }

  dashCharts.sector = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: labels.length ? labels : ['Sem dados'],
      datasets: [{
        data: values.length ? values : [1],
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#1E293B'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(ctx) { return ' Gasto: ' + formatCurrencyBRL(ctx.raw); }
          }
        }
      }
    }
  });

  const breakdownContainer = document.getElementById('sectorSpentBreakdown');
  if (breakdownContainer) {
    const totalSectorSpent = Object.values(sectorSpentObj).reduce((acc, v) => acc + (Number(v) || 0), 0);

    if (sortedSectors.length === 0 || totalSectorSpent === 0) {
      breakdownContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.78rem; padding:6px;">Nenhum dado de setor registrado no período.</div>`;
    } else {
      breakdownContainer.innerHTML = sortedSectors.map(([sectorName, amount], idx) => {
        const color = colors[idx % colors.length];
        const pct = totalSectorSpent > 0 ? ((amount / totalSectorSpent) * 100).toFixed(1) : '0';
        const nameShort = sectorName.length > 22 ? sectorName.substring(0, 20) + '...' : sectorName;

        return `
          <div class="breakdown-row" title="${escapeHtml(sectorName)}: ${formatCurrencyBRL(amount)} (${pct}%)">
            <div class="breakdown-left">
              <span class="breakdown-dot" style="background:${color};"></span>
              <span class="breakdown-name">${escapeHtml(nameShort)}</span>
            </div>
            <div class="breakdown-right">
              <span class="breakdown-amount">${formatCurrencyBRL(amount)}</span>
              <span class="breakdown-pill">${pct}%</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function renderDashRecentTable(recentTrips) {
  const container = document.getElementById('dashRecentTableBody');
  if (!container) return;

  if (!recentTrips || recentTrips.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          Nenhum registro encontrado.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = recentTrips.map(trip => {
    const formattedDate = formatDateBR(trip.data);
    const formattedValue = formatCurrencyBRL(trip.valor);
    const statusClass = trip.status === 'Envio' ? 'badge-envio' : 'badge-recolhimento';

    return `
      <tr>
        <td><strong>${escapeHtml(formattedDate)}</strong></td>
        <td>${escapeHtml(trip.nome_completo || '-')}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(trip.status || '-')}</span></td>
        <td>${escapeHtml(trip.transportadora || '-')}</td>
        <td>${escapeHtml(trip.setor || '-')}</td>
        <td style="font-weight:700; color: #818CF8;">${escapeHtml(formattedValue)}</td>
      </tr>
    `;
  }).join('');
}

function formatCarrierName(carrier) {
  if (!carrier) return '';
  const trimmed = String(carrier).trim();
  if (trimmed.toLowerCase().includes('frota pr') || trimmed === 'Frota Própria / Motoboy' || trimmed === 'Motoboy / UBER ' || trimmed === 'Motoboy / Uber') {
    return 'Motoboy / UBER';
  }
  return trimmed;
}

function renderTripsTable(trips) {
  if (!trips || trips.length === 0) {
    tripsTableBody.innerHTML = `
      <tr>
        <td colspan="14">
          <div class="table-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <p>Nenhuma viagem encontrada com os filtros aplicados.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const rowsHtml = trips.map(trip => {
    const statusClass = trip.status === 'Envio' ? 'envio' : 'recolhimento';
    const formattedDate = formatDateBR(trip.data);
    const formattedValue = formatCurrencyBRL(trip.valor);

    // Operador Responsável
    const operadorHtml = trip.operador
      ? `<span class="badge-operador"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>${escapeHtml(trip.operador)}</span>`
      : '<span style="color:var(--text-muted); font-size:0.8rem;">-</span>';

    // Movimentação
    let movimentacaoHtml = '<span style="color:var(--text-muted);">-</span>';
    if (trip.tipo_movimentacao) {
      let movClass = 'troca';
      if (trip.tipo_movimentacao === 'Desligamento') movClass = 'desligamento';
      else if (trip.tipo_movimentacao === 'Admissão') movClass = 'admissao';
      movimentacaoHtml = `<span class="badge-movimentacao ${movClass}">${escapeHtml(trip.tipo_movimentacao)}</span>`;
    }

    // Modalidade
    const modalidade = trip.modalidade_pagamento || 'Pós-pago';
    const modClass = modalidade === 'Pré-pago' ? 'pre-pago' : 'pos-pago';
    const modalidadeHtml = `<span class="badge-modalidade ${modClass}">${escapeHtml(modalidade)}</span>`;

    const carrierName = formatCarrierName(trip.transportadora);
    let carrierHtml = '<span style="color:var(--text-muted);">-</span>';
    if (carrierName) {
      carrierHtml = `<span class="badge-carrier">${escapeHtml(carrierName)}</span>`;
    }

    // Código de Rastreio
    let rastreioHtml = '<span style="color:var(--text-muted); font-size:0.8rem;">-</span>';
    if (trip.codigo_rastreio) {
      const rawCode = String(trip.codigo_rastreio).trim();
      if (rawCode) {
        const codeEscaped = escapeHtml(rawCode);
        let trackUrl = '';
        if (/^https?:\/\//i.test(rawCode)) {
          trackUrl = rawCode;
        } else {
          const carrier = (trip.transportadora || '').toLowerCase();
          if (carrier.includes('correios') || /^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(rawCode)) {
            trackUrl = `https://rastreamento.correios.com.br/app/index.php?codigo=${encodeURIComponent(rawCode)}`;
          } else if (carrier.includes('jadlog')) {
            trackUrl = `https://www.jadlog.com.br/jadlog/home`;
          } else if (carrier.includes('dhl')) {
            trackUrl = `https://www.dhl.com/br-pt/home/tracking.html?tracking-id=${encodeURIComponent(rawCode)}`;
          } else if (carrier.includes('fedex')) {
            trackUrl = `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(rawCode)}`;
          } else if (carrier.includes('loggi')) {
            trackUrl = `https://www.loggi.com/rastreador/`;
          } else if (carrier.includes('total express')) {
            trackUrl = `https://tracking.totalexpress.com.br/`;
          } else if (carrier.includes('azul cargo')) {
            trackUrl = `https://www.azulcargoexpress.com.br/Rastreio/Rastreio`;
          } else if (carrier.includes('j&t')) {
            trackUrl = `https://www.jtexpress.com.br/trajectoryQuery?bills=${encodeURIComponent(rawCode)}`;
          }
        }

        const copyBtnHtml = `
          <button type="button" class="btn-copy-tracking" onclick="copyTrackingCode(event, '${codeEscaped}')" title="Copiar código de rastreio">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copiar
          </button>
        `;

        if (trackUrl) {
          rastreioHtml = `
            <div style="display:inline-flex; align-items:center;">
              <a href="${escapeHtml(trackUrl)}" target="_blank" rel="noopener noreferrer" class="badge-rastreio-link" title="Rastrear objeto em nova aba">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px; height:12px; flex-shrink:0;">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${codeEscaped}
              </a>
              ${copyBtnHtml}
            </div>
          `;
        } else {
          rastreioHtml = `
            <div style="display:inline-flex; align-items:center;">
              <span class="badge-rastreio" title="Código de Rastreio: ${codeEscaped}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px; height:12px; flex-shrink:0; opacity:0.8;">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                ${codeEscaped}
              </span>
              ${copyBtnHtml}
            </div>
          `;
        }
      }
    }

    let cardHtml = '<span style="color:var(--text-muted);">-</span>';
    if (trip.link_card) {
      const linkInfo = sanitizeLinkCard(trip.link_card);
      if (linkInfo.isUrl && linkInfo.href) {
        cardHtml = `
          <a href="${escapeHtml(linkInfo.href)}" target="_blank" rel="noopener noreferrer" class="btn-table-action" title="Abrir Link do Card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Card
          </a>
        `;
      } else if (linkInfo.text) {
        cardHtml = `<span style="font-size:0.75rem; font-family:monospace; color:#A5B4FC; max-width:85px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(linkInfo.text)}">#${escapeHtml(linkInfo.text)}</span>`;
      }
    }

    const attachments = parseTripAttachments(trip);
    let anexoHtml = '<span style="color:var(--text-muted);">-</span>';
    if (attachments.length === 1) {
      anexoHtml = `
        <button type="button" class="btn-table-action" onclick="openAttachmentModalById('${trip.id}')" title="Visualizar Comprovante">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
          Anexo
        </button>
      `;
    } else if (attachments.length > 1) {
      anexoHtml = `
        <button type="button" class="btn-table-action" onclick="openAttachmentModalById('${trip.id}')" title="Visualizar ${attachments.length} Comprovantes" style="color:#818CF8; border-color:rgba(99, 102, 241, 0.4); background:rgba(99, 102, 241, 0.12);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
          ${attachments.length} Anexos
        </button>
      `;
    }

    return `
      <tr>
        <td style="font-weight:600; color:#F8FAFC;">${formattedDate}</td>
        <td>${operadorHtml}</td>
        <td style="font-weight:500;">${escapeHtml(trip.nome_completo)}</td>
        <td style="font-size:0.82rem; color:#E2E8F0;">${escapeHtml(trip.equipamento || '-')}</td>
        <td>
          <span class="badge-status ${statusClass}">
            ${escapeHtml(trip.status)}
          </span>
        </td>
        <td>${movimentacaoHtml}</td>
        <td>${modalidadeHtml}</td>
        <td>${carrierHtml}</td>
        <td>${rastreioHtml}</td>
        <td>
          <div style="font-size:0.82rem; font-weight:600; color:var(--text-body);">${escapeHtml(trip.centro_custo || '-')}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(trip.setor || '-')}</div>
        </td>
        <td>
          <span class="badge-valor">${formattedValue}</span>
        </td>
        <td>${cardHtml}</td>
        <td>${anexoHtml}</td>
        <td>
          <div class="actions-cell">
            <button type="button" class="btn-action-edit" onclick="openEditTripModal('${trip.id}')" title="Editar Lançamento">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar
            </button>
            <button type="button" class="btn-action-delete" onclick="openConfirmDeleteModal('${trip.id}')" title="Excluir Lançamento">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Excluir
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tripsTableBody.innerHTML = rowsHtml;
}

function updateKPIs(trips) {
  const totalCount = trips.length;
  const totalAmount = trips.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const enviosCount = trips.filter(t => t.status === 'Envio').length;
  const recolhimentosCount = trips.filter(t => t.status === 'Recolhimento').length;

  kpiTotalTrips.textContent = totalCount;
  kpiTotalSpent.textContent = formatCurrencyBRL(totalAmount);
  kpiStatusCount.textContent = `${enviosCount} / ${recolhimentosCount}`;
}

let currentPeriodFilter = 'all';

const periodPills = document.getElementById('periodPills');
const customDateRangeContainer = document.getElementById('customDateRangeContainer');
const filterStartDate = document.getElementById('filterStartDate');
const filterEndDate = document.getElementById('filterEndDate');

const statementModal = document.getElementById('statementModal');
const modalPeriodSelect = document.getElementById('modalPeriodSelect');
const modalCustomDateGroup = document.getElementById('modalCustomDateGroup');
const modalStartDate = document.getElementById('modalStartDate');
const modalEndDate = document.getElementById('modalEndDate');
const modalStatusFilter = document.getElementById('modalStatusFilter');
const modalCarrierFilter = document.getElementById('modalCarrierFilter');
const statementPrintArea = document.getElementById('statementPrintArea');
const btnDownloadPdf = document.getElementById('btnDownloadPdf');
const btnDownloadPdfText = document.getElementById('btnDownloadPdfText');

function getDateBoundsForPeriod(period, customStart, customEnd) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (period === 'daily') {
    return { start: todayStr, end: todayStr, label: `Diário • ${formatDateBR(todayStr)}` };
  }

  if (period === 'weekly') {
    const past7 = new Date(now);
    past7.setDate(now.getDate() - 6);
    const startStr = `${past7.getFullYear()}-${String(past7.getMonth() + 1).padStart(2, '0')}-${String(past7.getDate()).padStart(2, '0')}`;
    return { start: startStr, end: todayStr, label: `Semanal • ${formatDateBR(startStr)} até ${formatDateBR(todayStr)}` };
  }

  if (period === 'biweekly') {
    const past15 = new Date(now);
    past15.setDate(now.getDate() - 14);
    const startStr = `${past15.getFullYear()}-${String(past15.getMonth() + 1).padStart(2, '0')}-${String(past15.getDate()).padStart(2, '0')}`;
    return { start: startStr, end: todayStr, label: `Quinzenal • ${formatDateBR(startStr)} até ${formatDateBR(todayStr)}` };
  }

  if (period === 'monthly') {
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return { start: startStr, end: endStr, label: `Mensal • ${monthNames[month]} de ${year}` };
  }

  if (period === 'yearly') {
    return { start: `${year}-01-01`, end: `${year}-12-31`, label: `Anual • Exercício ${year}` };
  }

  if (period === 'custom') {
    const s = customStart || '';
    const e = customEnd || '';
    const label = (s && e)
      ? `Personalizado • ${formatDateBR(s)} até ${formatDateBR(e)}`
      : (s ? `A partir de ${formatDateBR(s)}` : (e ? `Até ${formatDateBR(e)}` : 'Período Personalizado'));
    return { start: s, end: e, label };
  }

  return { start: '', end: '', label: 'Todo o Histórico Registrado' };
}

function selectPeriodFilter(period) {
  currentPeriodFilter = period;

  const pills = document.querySelectorAll('.period-pill');
  pills.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-period') === period);
  });

  if (customDateRangeContainer) {
    customDateRangeContainer.style.display = (period === 'custom') ? 'flex' : 'none';
  }

  applyFilters();
}

function applyFilters() {
  const searchTerm = (filterSearch.value || '').toLowerCase().trim();
  const statusTerm = filterStatus.value;
  const carrierTerm = filterTransportadora ? filterTransportadora.value : '';
  const dateTerm = filterDate.value;

  const customStart = filterStartDate ? filterStartDate.value : '';
  const customEnd = filterEndDate ? filterEndDate.value : '';
  const bounds = getDateBoundsForPeriod(currentPeriodFilter, customStart, customEnd);

  const filtered = allTrips.filter(item => {
    const itemCarrier = formatCarrierName(item.transportadora);

    const matchesSearch = !searchTerm ||
      (item.operador && item.operador.toLowerCase().includes(searchTerm)) ||
      (item.nome_completo && item.nome_completo.toLowerCase().includes(searchTerm)) ||
      (item.equipamento && item.equipamento.toLowerCase().includes(searchTerm)) ||
      (item.tipo_movimentacao && item.tipo_movimentacao.toLowerCase().includes(searchTerm)) ||
      (item.modalidade_pagamento && item.modalidade_pagamento.toLowerCase().includes(searchTerm)) ||
      (itemCarrier && itemCarrier.toLowerCase().includes(searchTerm)) ||
      (item.codigo_rastreio && item.codigo_rastreio.toLowerCase().includes(searchTerm)) ||
      (item.centro_custo && item.centro_custo.toLowerCase().includes(searchTerm)) ||
      (item.setor && item.setor.toLowerCase().includes(searchTerm));

    const matchesStatus = !statusTerm || item.status === statusTerm;
    const matchesCarrier = !carrierTerm || itemCarrier === carrierTerm;
    const matchesDate = !dateTerm || item.data === dateTerm;

    let matchesPeriod = true;
    if (bounds.start && item.data < bounds.start) matchesPeriod = false;
    if (bounds.end && item.data > bounds.end) matchesPeriod = false;

    return matchesSearch && matchesStatus && matchesCarrier && matchesDate && matchesPeriod;
  });

  renderTripsTable(filtered);
  updateKPIs(filtered);
}

function clearFilters() {
  filterSearch.value = '';
  filterStatus.value = '';
  if (filterTransportadora) filterTransportadora.value = '';
  filterDate.value = '';
  if (filterStartDate) filterStartDate.value = '';
  if (filterEndDate) filterEndDate.value = '';
  selectPeriodFilter('all');
}

function openPdfStatementModal(initialPeriod) {
  if (initialPeriod) {
    modalPeriodSelect.value = initialPeriod;
  } else if (currentPeriodFilter !== 'all') {
    modalPeriodSelect.value = currentPeriodFilter;
  } else {
    modalPeriodSelect.value = 'monthly';
  }

  onModalPeriodChange();
  statementModal.classList.add('active');
}

function closePdfStatementModal() {
  statementModal.classList.remove('active');
}

function onModalPeriodChange() {
  const period = modalPeriodSelect.value;
  if (modalCustomDateGroup) {
    modalCustomDateGroup.style.display = (period === 'custom') ? 'flex' : 'none';
  }
  updatePdfPreview();
}

function getFilteredTripsForReport() {
  const period = modalPeriodSelect ? modalPeriodSelect.value : currentPeriodFilter;
  const statusFilter = modalStatusFilter ? modalStatusFilter.value : '';
  const carrierFilter = modalCarrierFilter ? modalCarrierFilter.value : '';
  const customStart = modalStartDate ? modalStartDate.value : (filterStartDate ? filterStartDate.value : '');
  const customEnd = modalEndDate ? modalEndDate.value : (filterEndDate ? filterEndDate.value : '');

  const bounds = getDateBoundsForPeriod(period, customStart, customEnd);

  const statementTrips = allTrips.filter(item => {
    const itemCarrier = formatCarrierName(item.transportadora);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesCarrier = !carrierFilter || itemCarrier === carrierFilter;
    let matchesPeriod = true;
    if (bounds.start && item.data < bounds.start) matchesPeriod = false;
    if (bounds.end && item.data > bounds.end) matchesPeriod = false;
    return matchesStatus && matchesCarrier && matchesPeriod;
  });

  statementTrips.sort((a, b) => new Date(b.data) - new Date(a.data));
  return { trips: statementTrips, bounds };
}

function updatePdfPreview() {
  const { trips: statementTrips, bounds } = getFilteredTripsForReport();

  const totalCount = statementTrips.length;
  const totalSpent = statementTrips.reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  const avgSpent = totalCount > 0 ? (totalSpent / totalCount) : 0;
  const countEnvios = statementTrips.filter(t => t.status === 'Envio').length;
  const countRecolhimentos = statementTrips.filter(t => t.status === 'Recolhimento').length;

  const now = new Date();
  const emissionDateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const reportCode = `EXT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  let tableRowsHtml = '';
  if (statementTrips.length === 0) {
    tableRowsHtml = `
      <tr>
        <td colspan="10" style="text-align:center; padding:2rem; color:#64748B;">
          Nenhum registro de viagem encontrado para o período e filtros selecionados.
        </td>
      </tr>
    `;
  } else {
    tableRowsHtml = statementTrips.map((item, index) => {
      const statusBadge = item.status === 'Envio'
        ? '<span class="doc-badge-status envio">Envio</span>'
        : '<span class="doc-badge-status recolhimento">Recolhimento</span>';

      let cardRef = '-';
      if (item.link_card) {
        const linkStr = String(item.link_card).trim();
        if (linkStr.startsWith('http://') || linkStr.startsWith('https://')) {
          const parts = linkStr.split('/').filter(Boolean);
          const lastPart = parts[parts.length - 1] || 'Link';
          const label = lastPart.length > 20 ? `${lastPart.substring(0, 18)}...` : lastPart;
          cardRef = `<a href="${escapeHtml(linkStr)}" target="_blank" style="color:#0284C7; text-decoration:none; font-weight:600;">#${escapeHtml(label)}</a>`;
        } else {
          cardRef = escapeHtml(linkStr);
        }
      }

      const carrierName = formatCarrierName(item.transportadora);
      const carrierDisplay = carrierName
        ? `<span style="font-weight:600; color:#0284C7; white-space:nowrap;">${escapeHtml(carrierName)}</span>`
        : '<span style="color:#94A3B8;">-</span>';

      return `
        <tr>
          <td style="font-weight:600; white-space:nowrap;">${formatDateBR(item.data)}</td>
          <td style="font-weight:600; color:#4F46E5; white-space:nowrap;">${escapeHtml(item.operador || '-')}</td>
          <td style="font-weight:600; min-width:110px;">${escapeHtml(item.nome_completo)}</td>
          <td style="font-size:0.75rem; color:#475569; min-width:100px;">${escapeHtml(item.equipamento || '-')}</td>
          <td style="white-space:nowrap;">${statusBadge}</td>
          <td style="white-space:nowrap;"><span style="font-size:0.75rem; color:#64748B;">${escapeHtml(item.tipo_movimentacao || '-')}</span></td>
          <td style="white-space:nowrap;"><span style="font-size:0.75rem; color:#64748B;">${escapeHtml(item.modalidade_pagamento || 'Pós-pago')}</span></td>
          <td style="white-space:nowrap;">${carrierDisplay}</td>
          <td style="font-size:0.72rem; font-weight:600; color:#7E22CE; white-space:nowrap;">${escapeHtml(item.codigo_rastreio || '-')}</td>
          <td style="font-size:0.7rem; color:#334155; min-width:130px;">${escapeHtml(item.centro_custo || '-')} / ${escapeHtml(item.setor || '-')}</td>
          <td style="text-align:right; font-weight:700; white-space:nowrap;">${formatCurrencyBRL(item.valor)}</td>
          <td style="font-size:0.7rem; white-space:nowrap;">${cardRef}</td>
        </tr>
      `;
    }).join('');
  }

  statementPrintArea.innerHTML = `
    <div class="doc-header">
      <div class="doc-brand">
        <img src="logo.svg" alt="Logo OctoLogis" class="doc-logo">
        <div class="doc-brand-text">
          <h1>OCTOLOGIS</h1>
          <span>Gestão & Logística Operacional</span>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Código:</strong> ${reportCode}</div>
        <div><strong>Emissão:</strong> ${emissionDateStr}</div>
        <div class="doc-badge-period">${escapeHtml(bounds.label)}</div>
      </div>
    </div>

    <div class="doc-title-bar">
      <h2>Extrato Consolidado de Viagens & Despesas</h2>
      <p>Relatório analítico e discriminado de viagens operacionais cadastradas no sistema.</p>
    </div>

    <div class="doc-kpi-row">
      <div class="doc-kpi-box">
        <div class="label">Total de Viagens</div>
        <div class="val">${totalCount}</div>
      </div>
      <div class="doc-kpi-box">
        <div class="label">Valor Total</div>
        <div class="val highlight">${formatCurrencyBRL(totalSpent)}</div>
      </div>
      <div class="doc-kpi-box">
        <div class="label">Média / Viagem</div>
        <div class="val">${formatCurrencyBRL(avgSpent)}</div>
      </div>
      <div class="doc-kpi-box">
        <div class="label">Envios / Recolh.</div>
        <div class="val">${countEnvios} / ${countRecolhimentos}</div>
      </div>
    </div>

    <table class="doc-table">
      <thead>
        <tr>
          <th style="white-space:nowrap;">Data</th>
          <th style="white-space:nowrap;">Operador</th>
          <th>Colaborador</th>
          <th>Equipamento</th>
          <th style="white-space:nowrap;">Tipo</th>
          <th style="white-space:nowrap;">Movimentação</th>
          <th style="white-space:nowrap;">Modalidade</th>
          <th style="white-space:nowrap;">Transportadora</th>
          <th style="white-space:nowrap;">Rastreio</th>
          <th>Centro / Setor</th>
          <th style="text-align:right; white-space:nowrap;">Valor</th>
          <th style="white-space:nowrap;">Ref. Card</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
      ${statementTrips.length > 0 ? `
        <tfoot>
          <tr class="doc-total-row">
            <td colspan="10" style="text-align:right; white-space:nowrap;">TOTAL DO PERÍODO (${totalCount} itens):</td>
            <td style="text-align:right; white-space:nowrap;">${formatCurrencyBRL(totalSpent)}</td>
            <td></td>
          </tr>
        </tfoot>
      ` : ''}
    </table>

    <div class="doc-footer">
      <div>
        <p style="margin-bottom:3px;"><strong>OCTOLOGIS LOGÍSTICA & TRANSPORTE</strong></p>
        <p>Documento gerado automaticamente pelo sistema de gestão.</p>
      </div>
      <div class="doc-signature-line">
        Assinatura / Responsável
      </div>
    </div>
  `;
}

/* ==========================================================================
   MOTOR DE GERAÇÃO E DOWNLOAD DIRETO DO RELATÓRIO PDF (A4 SEM CORTES)
   ========================================================================== */

function downloadPdfStatement() {
  if (btnDownloadPdf && btnDownloadPdfText) {
    btnDownloadPdf.disabled = true;
    btnDownloadPdfText.textContent = 'Processando PDF...';
  }

  try {
    const { trips: statementTrips, bounds } = getFilteredTripsForReport();
    const period = modalPeriodSelect ? modalPeriodSelect.value : currentPeriodFilter;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const fileName = `relatorio_octologis_${period}_${dateStr}.pdf`;

    const totalCount = statementTrips.length;
    const totalSpent = statementTrips.reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    const avgSpent = totalCount > 0 ? (totalSpent / totalCount) : 0;
    const countEnvios = statementTrips.filter(t => t.status === 'Envio').length;
    const countRecolhimentos = statementTrips.filter(t => t.status === 'Recolhimento').length;

    const emissionDateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const reportCode = `EXT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Top Brand Header Banner
      doc.setFillColor(15, 23, 42); // #0F172A Dark Slate
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setFillColor(99, 102, 241); // #6366F1 Accent
      doc.rect(0, 27.2, pageWidth, 0.8, 'F');

      // Brand Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(248, 250, 252);
      doc.text('OCTOLOGIS', 14, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(165, 180, 252);
      doc.text('SISTEMA DE GESTÃO LOGÍSTICA & CONTROLE OPERACIONAL', 14, 18);

      // Report Header Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text('Extrato de Viagens & Despesas', pageWidth - 14, 11, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(203, 213, 225);
      doc.text(`Código: ${reportCode}  |  Emissão: ${emissionDateStr}`, pageWidth - 14, 17, { align: 'right' });
      doc.text(`Filtro de Período: ${bounds.label}`, pageWidth - 14, 22, { align: 'right' });

      // KPI Boxes row
      const kpiY = 33;
      const kpiHeight = 16;
      const kpiGap = 5;
      const kpiWidth = (pageWidth - 28 - (3 * kpiGap)) / 4;

      const kpis = [
        { label: 'TOTAL DE VIAGENS', val: String(totalCount), color: [99, 102, 241] },
        { label: 'VALOR TOTAL', val: formatCurrencyBRL(totalSpent), color: [16, 185, 129] },
        { label: 'MÉDIA POR VIAGEM', val: formatCurrencyBRL(avgSpent), color: [59, 130, 246] },
        { label: 'ENVIOS / RECOLHIMENTOS', val: `${countEnvios} / ${countRecolhimentos}`, color: [245, 158, 11] }
      ];

      kpis.forEach((kpi, idx) => {
        const kX = 14 + (idx * (kpiWidth + kpiGap));
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(kX, kpiY, kpiWidth, kpiHeight, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(kX, kpiY, kpiWidth, kpiHeight, 2, 2, 'S');

        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.rect(kX, kpiY, 2.5, kpiHeight, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, kX + 6, kpiY + 5.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(kpi.val, kX + 6, kpiY + 12);
      });

      // Table Data
      const tableHeaders = [
        ['Data', 'Operador', 'Colaborador', 'Equipamento', 'Tipo', 'Movimentação', 'Modalidade', 'Transportadora', 'Rastreio', 'Centro / Setor', 'Valor', 'Ref. Card']
      ];

      const tableData = statementTrips.map(item => {
        const cName = formatCarrierName(item.transportadora) || '-';
        const cardRef = item.link_card ? String(item.link_card).slice(0, 25) : '-';
        const sectorStr = (item.setor || item.centro_custo || '-');
        const sectorShort = sectorStr.length > 25 ? sectorStr.substring(0, 23) + '...' : sectorStr;

        return [
          formatDateBR(item.data),
          item.operador || '-',
          item.nome_completo || '-',
          item.equipamento || '-',
          item.status || '-',
          item.tipo_movimentacao || '-',
          item.modalidade_pagamento || 'Pós-pago',
          cName,
          item.codigo_rastreio || '-',
          sectorShort,
          formatCurrencyBRL(item.valor),
          cardRef
        ];
      });

      doc.autoTable({
        head: tableHeaders,
        body: tableData,
        startY: 53,
        margin: { left: 14, right: 14, bottom: 18, top: 32 },
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59], // #1E293B
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'left',
          cellPadding: 2
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8,
          overflow: 'linebreak',
          textColor: [30, 41, 59],
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 18, fontStyle: 'bold' },
          1: { cellWidth: 24, fontStyle: 'bold' },
          2: { cellWidth: 32 },
          3: { cellWidth: 28 },
          4: { cellWidth: 16 },
          5: { cellWidth: 22 },
          6: { cellWidth: 20 },
          7: { cellWidth: 22 },
          8: { cellWidth: 22, fontStyle: 'bold', textColor: [126, 34, 206] },
          9: { cellWidth: 26, fontSize: 6.5, overflow: 'ellipsize' },
          10: { cellWidth: 23, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
          11: { cellWidth: 16, fontSize: 6.5 }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        showFoot: 'lastPage',
        foot: statementTrips.length > 0 ? [
          [
            { content: `TOTAL DO PERÍODO (${totalCount} viagens):`, colSpan: 10, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
            { content: formatCurrencyBRL(totalSpent), styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: [16, 185, 129] } },
            { content: '' }
          ]
        ] : [],
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42]
        },
        didDrawPage: function (data) {
          // Page Footer
          const pageCount = doc.internal.getNumberOfPages();
          const curPage = data.pageNumber;

          doc.setDrawColor(226, 232, 240);
          doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text('OCTOLOGIS LOGÍSTICA & TRANSPORTE • Relatório Gerencial Automatizado', 14, pageHeight - 7);
          doc.text(`Página ${curPage} de ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
        }
      });

      // Direct download without print
      doc.save(fileName);

    } else {
      // Fallback html2pdf direct save
      const element = document.getElementById('statementPrintArea');
      const opt = {
        margin: [8, 8, 8, 8],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      html2pdf().set(opt).from(element).save();
    }

  } catch (err) {
    console.error("Erro na geração do PDF:", err);
    alert(`Erro ao gerar PDF: ${err.message}`);
  } finally {
    if (btnDownloadPdf && btnDownloadPdfText) {
      btnDownloadPdf.disabled = false;
      btnDownloadPdfText.textContent = 'Baixar Relatório (PDF)';
    }
  }
}

let currentModalAttachments = [];
let currentActiveAttachmentIndex = 0;

function openAttachmentModalById(tripId) {
  const trip = allTrips.find(t => t.id === tripId);
  if (!trip) return;

  const attachments = parseTripAttachments(trip);
  const title = attachments.length > 1
    ? `${attachments.length} Comprovantes (${escapeHtml(trip.nome_completo)})`
    : (attachments[0]?.name || `Comprovante (${escapeHtml(trip.nome_completo)})`);

  openAttachmentModal(attachments, title);
}

function openAttachmentModal(attachmentsOrUrl, customTitle) {
  if (Array.isArray(attachmentsOrUrl)) {
    currentModalAttachments = attachmentsOrUrl;
  } else if (typeof attachmentsOrUrl === 'string') {
    currentModalAttachments = [{ url: attachmentsOrUrl, name: customTitle || 'Comprovante' }];
  } else {
    currentModalAttachments = [];
  }

  currentActiveAttachmentIndex = 0;
  attachmentModalTitle.textContent = customTitle || 'Comprovantes Anexados';

  if (currentModalAttachments.length === 0) {
    attachmentModalBody.innerHTML = `
      <div style="text-align:center; padding:2rem; color:var(--text-muted);">
        <p>Nenhum anexo encontrado.</p>
      </div>
    `;
    attachmentModal.classList.add('active');
    return;
  }

  renderAttachmentModalContent();
  attachmentModal.classList.add('active');
}

function renderAttachmentModalContent() {
  if (currentModalAttachments.length === 0) return;

  const total = currentModalAttachments.length;
  const current = currentModalAttachments[currentActiveAttachmentIndex] || currentModalAttachments[0];
  const rawUrl = current.url;
  const url = sanitizeUrl(rawUrl) || rawUrl;
  const fileName = current.name || `Anexo ${currentActiveAttachmentIndex + 1}`;
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName);

  let tabsHtml = '';
  if (total > 1) {
    tabsHtml = `
      <div class="attachment-gallery-header">
        ${currentModalAttachments.map((att, idx) => {
      const isActive = idx === currentActiveAttachmentIndex;
      const isImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.url) || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.name);
      const iconSvg = isImg
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;

      return `
            <button type="button" class="attachment-tab-pill ${isActive ? 'active' : ''}" onclick="selectModalAttachment(${idx})">
              ${iconSvg}
              <span>${escapeHtml(att.name || `Arquivo ${idx + 1}`)}</span>
            </button>
          `;
    }).join('')}
      </div>
    `;
  }

  let previewBodyHtml = '';
  if (isImage) {
    previewBodyHtml = `
      <div class="attachment-view-card">
        <img src="${escapeHtml(url)}" alt="${escapeHtml(fileName)}" class="attachment-img-preview">
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%; flex-wrap:wrap; gap:10px; border-top:1px solid var(--card-border); padding-top:0.75rem;">
          <span style="font-size:0.82rem; color:var(--text-title); font-weight:600; max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${escapeHtml(fileName)} ${total > 1 ? `(${currentActiveAttachmentIndex + 1} de ${total})` : ''}
          </span>
          <div style="display:flex; gap:8px;">
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="btn-table-action" style="padding:5px 12px; font-size:0.78rem;">
              Abrir em Nova Aba
            </a>
            <a href="${escapeHtml(url)}" download="${escapeHtml(fileName)}" target="_blank" rel="noopener noreferrer" class="btn-submit" style="width:auto; margin:0; padding:5px 12px; font-size:0.78rem; text-decoration:none;">
              Baixar
            </a>
          </div>
        </div>
      </div>
    `;
  } else {
    previewBodyHtml = `
      <div class="attachment-view-card" style="padding:2rem 1.5rem; text-align:center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#818CF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:56px; height:56px; margin-bottom:1rem;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <p style="font-size:1.05rem; font-weight:700; color:#F8FAFC; margin-bottom:0.4rem;">
          ${escapeHtml(fileName)}
        </p>
        <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:1.5rem;">
          ${total > 1 ? `Arquivo ${currentActiveAttachmentIndex + 1} de ${total} anexado a esta viagem.` : 'Documento / Arquivo anexado a esta viagem.'}
        </p>
        <div style="display:flex; gap:10px; justify-content:center;">
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="btn-submit" style="text-decoration:none; width:auto; padding:0.6rem 1.4rem;">
            Baixar / Abrir Documento
          </a>
        </div>
      </div>
    `;
  }

  attachmentModalBody.innerHTML = `
    ${tabsHtml}
    ${previewBodyHtml}
  `;
}

function selectModalAttachment(index) {
  currentActiveAttachmentIndex = index;
  renderAttachmentModalContent();
}

function closeAttachmentModal() {
  attachmentModal.classList.remove('active');
  currentModalAttachments = [];
}

function openEditExistingAttachmentModal(index) {
  const att = editExistingAttachments[index];
  if (!att) return;
  openAttachmentModal(att.url, att.name || 'Comprovante');
}

const editTripModal = document.getElementById('editTripModal');
const editTripForm = document.getElementById('editTripForm');
const editTripId = document.getElementById('editTripId');
const editCampoData = document.getElementById('editCampoData');
const editCampoOperador = document.getElementById('editCampoOperador');
const editContainerOutroOperador = document.getElementById('editContainerOutroOperador');
const editCampoOutroOperador = document.getElementById('editCampoOutroOperador');
const editCampoNome = document.getElementById('editCampoNome');
const editCampoEquipamento = document.getElementById('editCampoEquipamento');
const editCampoStatus = document.getElementById('editCampoStatus');
const editCampoTipoMovimentacao = document.getElementById('editCampoTipoMovimentacao');
const editCampoModalidadePagamento = document.getElementById('editCampoModalidadePagamento');
const editCampoTransportadora = document.getElementById('editCampoTransportadora');
const editContainerOutraTransportadora = document.getElementById('editContainerOutraTransportadora');
const editCampoOutraTransportadora = document.getElementById('editCampoOutraTransportadora');
const editCampoCodigoRastreio = document.getElementById('editCampoCodigoRastreio');
const editCampoValor = document.getElementById('editCampoValor');
const editCampoCentroCusto = document.getElementById('editCampoCentroCusto');
const editContainerOutroCentroCusto = document.getElementById('editContainerOutroCentroCusto');
const editCampoOutroCentroCusto = document.getElementById('editCampoOutroCentroCusto');
const editCampoSetor = document.getElementById('editCampoSetor');
const editCampoLinkCard = document.getElementById('editCampoLinkCard');
const editCampoArquivo = document.getElementById('editCampoArquivo');
const editCurrentAttachmentArea = document.getElementById('editCurrentAttachmentArea');
const editNewFilesList = document.getElementById('editNewFilesList');
const btnSaveEdit = document.getElementById('btnSaveEdit');
const btnSaveEditText = document.getElementById('btnSaveEditText');
const editFeedbackMessage = document.getElementById('editFeedbackMessage');

let editExistingAttachments = [];
let editNewSelectedFiles = [];

const STANDARD_CARRIERS = ['Correios', 'LOGGI', 'Jadlog', 'DHL', 'DHL Express', 'FedEx', 'Braspress', 'Total Express', 'Azul Cargo', 'Azul Cargo Express', 'Lalamove', 'J&T Express', 'Mercado Envios', 'Flash Courier', 'Motoboy / UBER'];
const STANDARD_CENTROS_CUSTO = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'Teste 1', 'Teste 2', 'Teste 3', 'Teste 4'];

function openEditTripModal(id) {
  const trip = allTrips.find(t => String(t.id) === String(id));
  if (!trip) {
    console.error("Viagem não encontrada para o ID:", id);
    alert("Não foi possível encontrar este registro para edição.");
    return;
  }

  editTripId.value = trip.id;
  editCampoData.value = trip.data || '';

  // Operador
  const op = trip.operador ? String(trip.operador).trim() : '';
  if (editCampoOperador) {
    if (op === 'Marcos Brunoso' || op === 'Sarah Soares') {
      editCampoOperador.value = op;
      if (editContainerOutroOperador) editContainerOutroOperador.style.display = 'none';
      if (editCampoOutroOperador) editCampoOutroOperador.value = '';
    } else if (op) {
      editCampoOperador.value = 'Outro';
      if (editContainerOutroOperador) editContainerOutroOperador.style.display = 'block';
      if (editCampoOutroOperador) editCampoOutroOperador.value = op;
    } else {
      editCampoOperador.value = 'Marcos Brunoso';
      if (editContainerOutroOperador) editContainerOutroOperador.style.display = 'none';
      if (editCampoOutroOperador) editCampoOutroOperador.value = '';
    }
  }

  editCampoNome.value = trip.nome_completo || '';
  if (editCampoEquipamento) editCampoEquipamento.value = trip.equipamento || '';
  editCampoStatus.value = trip.status || 'Envio';
  if (editCampoTipoMovimentacao) editCampoTipoMovimentacao.value = trip.tipo_movimentacao || 'Desligamento';
  if (editCampoModalidadePagamento) editCampoModalidadePagamento.value = trip.modalidade_pagamento || 'Pós-pago';

  // Setor & Centro de Custo handling
  if (editCampoSetor) editCampoSetor.value = trip.setor || '';
  if (editCampoCentroCusto) {
    if (trip.setor && SETOR_TO_CENTRO_CUSTO[trip.setor]) {
      editCampoCentroCusto.value = SETOR_TO_CENTRO_CUSTO[trip.setor];
    } else {
      editCampoCentroCusto.value = trip.centro_custo || '';
    }
  }
  editCampoValor.value = trip.valor ? formatBRLValue(trip.valor) : '';
  editCampoLinkCard.value = trip.link_card || '';
  if (editCampoCodigoRastreio) editCampoCodigoRastreio.value = trip.codigo_rastreio || '';

  // Carrier handling
  const rawCarrier = trip.transportadora ? String(trip.transportadora).trim() : '';
  if (editCampoTransportadora) {
    const isStandard = STANDARD_CARRIERS.some(c => c.toLowerCase() === rawCarrier.toLowerCase());
    if (isStandard) {
      editCampoTransportadora.value = formatCarrierName(rawCarrier);
      if (editContainerOutraTransportadora) editContainerOutraTransportadora.style.display = 'none';
      if (editCampoOutraTransportadora) editCampoOutraTransportadora.value = '';
    } else if (rawCarrier) {
      editCampoTransportadora.value = 'Outra';
      if (editContainerOutraTransportadora) editContainerOutraTransportadora.style.display = 'block';
      if (editCampoOutraTransportadora) editCampoOutraTransportadora.value = rawCarrier;
    } else {
      editCampoTransportadora.value = '';
      if (editContainerOutraTransportadora) editContainerOutraTransportadora.style.display = 'none';
      if (editCampoOutraTransportadora) editCampoOutraTransportadora.value = '';
    }
  }

  if (editCampoArquivo) editCampoArquivo.value = '';
  editNewSelectedFiles = [];
  editExistingAttachments = parseTripAttachments(trip);

  renderEditExistingAttachments();
  renderEditNewSelectedFiles();

  if (editFeedbackMessage) editFeedbackMessage.style.display = 'none';
  editTripModal.classList.add('active');
}

function renderEditExistingAttachments() {
  if (!editCurrentAttachmentArea) return;

  if (editExistingAttachments.length === 0) {
    editCurrentAttachmentArea.innerHTML = '<span style="color:var(--text-muted); font-size:0.78rem;">Nenhum comprovante anexado atualmente.</span>';
    return;
  }

  editCurrentAttachmentArea.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:5px;">
      ${editExistingAttachments.map((att, index) => `
        <div class="edit-attachment-row">
          <div class="edit-attachment-info">
            <span style="font-size:0.75rem;">📎</span>
            <span class="edit-attachment-name" title="${escapeHtml(att.name || 'Comprovante')}">
              ${escapeHtml(att.name || `Comprovante ${index + 1}`)}
            </span>
          </div>
          <div class="edit-attachment-actions">
            <button type="button" class="btn-table-action" onclick="openEditExistingAttachmentModal(${index})" style="padding:2px 7px; font-size:0.7rem;">
              Ver
            </button>
            <button type="button" class="btn-remove-existing-file" onclick="removeExistingAttachmentFromEdit(${index})" title="Remover este comprovante">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Excluir
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function removeExistingAttachmentFromEdit(index) {
  editExistingAttachments.splice(index, 1);
  renderEditExistingAttachments();
}

if (editCampoArquivo) {
  editCampoArquivo.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const oversized = [];
      const rejected = [];
      Array.from(e.target.files).forEach(file => {
        if (!isAllowedFile(file)) {
          rejected.push(file.name);
          return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          oversized.push(`${file.name} (${formatBytes(file.size)})`);
          return;
        }
        const exists = editNewSelectedFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
          editNewSelectedFiles.push(file);
        }
      });

      if (rejected.length > 0) {
        alert(`⚠️ Atenção: O(s) arquivo(s) a seguir possuem formato não permitido por segurança:\n\n• ${rejected.join('\n• ')}\n\nFormatos aceitos: PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX.`);
      }

      if (oversized.length > 0) {
        alert(`⚠️ Atenção: O(s) seguinte(s) arquivo(s) ultrapassam o limite máximo de 10MB por arquivo e não foram adicionados:\n\n• ${oversized.join('\n• ')}`);
      }

      renderEditNewSelectedFiles();
      editCampoArquivo.value = '';
    }
  });
}

function renderEditNewSelectedFiles() {
  if (!editNewFilesList) return;

  if (editNewSelectedFiles.length === 0) {
    editNewFilesList.innerHTML = '';
    return;
  }

  editNewFilesList.innerHTML = editNewSelectedFiles.map((file, index) => `
    <div class="selected-file-item" style="padding:0.35rem 0.6rem;">
      <div class="selected-file-info">
        <span style="font-size:0.75rem; color:#34D399;">➕</span>
        <div class="selected-file-details">
          <span class="selected-file-name" style="font-size:0.75rem;">${escapeHtml(file.name)}</span>
          <span class="selected-file-size" style="font-size:0.65rem;">${formatBytes(file.size)}</span>
        </div>
      </div>
      <button type="button" class="btn-remove-single-file" onclick="removeEditNewFile(${index})" title="Remover">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join('');
}

function removeEditNewFile(index) {
  editNewSelectedFiles.splice(index, 1);
  renderEditNewSelectedFiles();
}

function closeEditTripModal() {
  editTripModal.classList.remove('active');
  editNewSelectedFiles = [];
  editExistingAttachments = [];
}

async function handleEditTripSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  if (!supabaseClient) {
    alert("Supabase não conectado. Verifique o arquivo script.js.");
    return;
  }

  const id = editTripId ? editTripId.value : null;
  if (!id) {
    alert("ID de viagem inválido ou ausente.");
    return;
  }

  const tripIndex = allTrips.findIndex(t => String(t.id) === String(id));
  if (tripIndex === -1) {
    console.error("Viagem não encontrada no estado local para o ID:", id);
    alert(`Não foi possível localizar o registro de ID "${id}" na lista local.`);
    return;
  }

  btnSaveEdit.disabled = true;
  btnSaveEditText.textContent = 'Salvando alterações...';

  try {
    const finalAttachments = [...editExistingAttachments];

    if (editNewSelectedFiles && editNewSelectedFiles.length > 0) {
      for (let i = 0; i < editNewSelectedFiles.length; i++) {
        const file = editNewSelectedFiles[i];
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFilePath = `anexos/${Date.now()}_edit_${i}_${sanitizedFileName}`;

        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('anexos_viagens')
          .upload(uniqueFilePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Falha no upload do anexo "${file.name}": ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabaseClient.storage
          .from('anexos_viagens')
          .getPublicUrl(uniqueFilePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          finalAttachments.push({
            url: publicUrlData.publicUrl,
            name: file.name,
            size: file.size
          });
        }
      }
    }

    let finalArquivoUrl = null;
    let finalArquivoNome = null;

    if (finalAttachments.length === 1) {
      finalArquivoUrl = finalAttachments[0].url;
      finalArquivoNome = finalAttachments[0].name;
    } else if (finalAttachments.length > 1) {
      finalArquivoUrl = JSON.stringify(finalAttachments);
      finalArquivoNome = `${finalAttachments.length} arquivos anexados`;
    }

    let editFinalOperador = (editCampoOperador && editCampoOperador.value) || null;
    if (editFinalOperador === 'Outro' && editCampoOutroOperador && editCampoOutroOperador.value.trim()) {
      editFinalOperador = editCampoOutroOperador.value.trim();
    }

    let editFinalTransportadora = (editCampoTransportadora && editCampoTransportadora.value.trim()) || null;
    if ((editFinalTransportadora === 'Outra' || editFinalTransportadora === 'OUTRA') && editCampoOutraTransportadora && editCampoOutraTransportadora.value.trim()) {
      editFinalTransportadora = editCampoOutraTransportadora.value.trim();
    }

    let editFinalCentroCusto = (editCampoCentroCusto && editCampoCentroCusto.value.trim()) || null;
    let editFinalSetor = (editCampoSetor && editCampoSetor.value.trim()) || null;

    const updatedData = {
      data: editCampoData.value,
      operador: editFinalOperador,
      nome_completo: editCampoNome.value.trim(),
      equipamento: (editCampoEquipamento && editCampoEquipamento.value.trim()) || null,
      status: editCampoStatus.value,
      tipo_movimentacao: (editCampoTipoMovimentacao && editCampoTipoMovimentacao.value) || null,
      modalidade_pagamento: (editCampoModalidadePagamento && editCampoModalidadePagamento.value) || 'Pós-pago',
      transportadora: editFinalTransportadora,
      codigo_rastreio: (editCampoCodigoRastreio && editCampoCodigoRastreio.value.trim()) || null,
      valor: parseCurrencyFloat(editCampoValor.value),
      centro_custo: editFinalCentroCusto,
      setor: editFinalSetor,
      link_card: editCampoLinkCard ? editCampoLinkCard.value.trim() : null,
      arquivo_url: finalArquivoUrl,
      arquivo_nome: finalArquivoNome
    };

    const targetId = isNaN(Number(id)) ? id : Number(id);

    const { error } = await supabaseClient
      .from('viagens')
      .update(updatedData)
      .eq('id', targetId);

    if (error) {
      throw error;
    }

    allTrips[tripIndex] = { ...allTrips[tripIndex], ...updatedData };

    closeEditTripModal();
    applyFilters();

    showFeedback('success', `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;flex-shrink:0;">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>Viagem atualizada com sucesso no banco de dados!</span>
    `);
    setTimeout(() => hideFeedback(), 4000);

  } catch (err) {
    console.error("Erro ao atualizar viagem:", err);
    alert(`Erro ao salvar alterações: ${err.message}`);
  } finally {
    btnSaveEdit.disabled = false;
    btnSaveEditText.textContent = 'Salvar Alterações';
  }
}

if (editTripForm) {
  editTripForm.addEventListener('submit', handleEditTripSubmit);
}

const confirmModal = document.getElementById('confirmModal');
const confirmDetailName = document.getElementById('confirmDetailName');
const confirmDetailDate = document.getElementById('confirmDetailDate');
const confirmDetailCarrier = document.getElementById('confirmDetailCarrier');
const confirmDetailValue = document.getElementById('confirmDetailValue');
const confirmDetailStatus = document.getElementById('confirmDetailStatus');
const btnConfirmCancel = document.getElementById('btnConfirmCancel');
const btnConfirmAccept = document.getElementById('btnConfirmAccept');
const btnConfirmSpinner = document.getElementById('btnConfirmSpinner');
const btnConfirmAcceptText = document.getElementById('btnConfirmAcceptText');

let pendingDeleteTripId = null;

function openConfirmDeleteModal(id) {
  const trip = allTrips.find(t => t.id === id);
  if (!trip) return;

  pendingDeleteTripId = id;
  if (confirmDetailName) confirmDetailName.textContent = trip.nome_completo || '-';
  if (confirmDetailDate) confirmDetailDate.textContent = formatDateBR(trip.data);
  if (confirmDetailCarrier) confirmDetailCarrier.textContent = formatCarrierName(trip.transportadora) || '-';
  if (confirmDetailValue) confirmDetailValue.textContent = formatCurrencyBRL(trip.valor);
  if (confirmDetailStatus) confirmDetailStatus.textContent = trip.status || '-';

  if (btnConfirmAccept) btnConfirmAccept.disabled = false;
  if (btnConfirmSpinner) btnConfirmSpinner.style.display = 'none';
  if (btnConfirmAcceptText) btnConfirmAcceptText.textContent = 'Sim, Excluir';

  if (confirmModal) confirmModal.classList.add('active');
}

function closeConfirmModal() {
  if (confirmModal) confirmModal.classList.remove('active');
  pendingDeleteTripId = null;
}

if (btnConfirmCancel) {
  btnConfirmCancel.addEventListener('click', closeConfirmModal);
}

if (btnConfirmAccept) {
  btnConfirmAccept.addEventListener('click', async () => {
    if (!pendingDeleteTripId) return;
    const id = pendingDeleteTripId;

    if (!supabaseClient) {
      alert("Supabase não conectado. Verifique o arquivo script.js.");
      return;
    }

    btnConfirmAccept.disabled = true;
    if (btnConfirmSpinner) btnConfirmSpinner.style.display = 'inline-block';
    if (btnConfirmAcceptText) btnConfirmAcceptText.textContent = 'Excluindo...';

    try {
      const { error } = await supabaseClient
        .from('viagens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      allTrips = allTrips.filter(t => t.id !== id);
      applyFilters();
      closeConfirmModal();

      showFeedback('success', `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;flex-shrink:0;">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Lançamento excluído com sucesso do banco de dados!</span>
      `);
      setTimeout(() => hideFeedback(), 4000);

    } catch (err) {
      console.error("Erro ao excluir viagem:", err);
      alert(`Erro ao excluir viagem: ${err.message}`);
      btnConfirmAccept.disabled = false;
      if (btnConfirmSpinner) btnConfirmSpinner.style.display = 'none';
      if (btnConfirmAcceptText) btnConfirmAcceptText.textContent = 'Sim, Excluir';
    }
  });
}

window.addEventListener('click', (e) => {
  if (e.target === attachmentModal) closeAttachmentModal();
  if (e.target === statementModal) closePdfStatementModal();
  if (e.target === editTripModal) closeEditTripModal();
  if (e.target === confirmModal) closeConfirmModal();
});

function setLoadingState(isLoading) {
  if (isLoading) {
    btnSubmit.disabled = true;
    btnSpinner.style.display = 'inline-block';
    btnText.textContent = 'Enviando ...';
  } else {
    btnSubmit.disabled = false;
    btnSpinner.style.display = 'none';
    btnText.textContent = 'Salvar Viagem';
  }
}

/* ==========================================================================
   SISTEMA DE NOTIFICAÇÕES TOAST & UTILITÁRIOS
   ========================================================================== */

function showToast(type = 'info', title = '', message = '', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-card ${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
    <button type="button" class="toast-close" onclick="closeToast(this.parentElement)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
    <div class="toast-progress" style="animation: toastProgress ${duration}ms linear forwards;"></div>
  `;

  container.appendChild(toast);

  const timeoutId = setTimeout(() => {
    closeToast(toast);
  }, duration);

  toast.dataset.timeoutId = timeoutId;
}

function closeToast(toastElement) {
  if (!toastElement || toastElement.classList.contains('toast-closing')) return;
  if (toastElement.dataset.timeoutId) {
    clearTimeout(Number(toastElement.dataset.timeoutId));
  }
  toastElement.classList.add('toast-closing');
  setTimeout(() => {
    if (toastElement.parentNode) {
      toastElement.parentNode.removeChild(toastElement);
    }
  }, 300);
}

function showFeedback(type, contentHtml) {
  const isSuccess = type === 'success';
  const title = isSuccess ? 'Sucesso!' : 'Atenção';

  let toastMessage = contentHtml;
  if (typeof contentHtml === 'string' && contentHtml.includes('<')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    const textNode = tempDiv.querySelector('span, p') || tempDiv;
    toastMessage = textNode.textContent || textNode.innerText || contentHtml;
  }

  showToast(type, title, String(toastMessage).trim(), 4500);

  if (feedbackMessage) {
    feedbackMessage.className = `feedback-message ${type}`;
    feedbackMessage.innerHTML = contentHtml;
    feedbackMessage.style.display = 'flex';
  }
}

function hideFeedback() {
  if (feedbackMessage) {
    feedbackMessage.style.display = 'none';
    feedbackMessage.innerHTML = '';
  }
}

function copyTrackingCode(event, code) {
  if (event) event.stopPropagation();
  if (!code) return;

  const btn = event ? event.currentTarget : null;

  navigator.clipboard.writeText(code).then(() => {
    showToast('success', 'Código Copiado!', `Rastreio <strong>${escapeHtml(code)}</strong> copiado com sucesso.`);

    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copiado!`;

      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = originalHtml;
      }, 1800);
    }
  }).catch(err => {
    console.error("Erro ao copiar código:", err);
    showToast('error', 'Erro ao Copiar', 'Não foi possível copiar o código.');
  });
}

function exportFilteredTripsCSV() {
  let tripsToExport = allTrips || [];

  const searchTerm = filterSearch ? filterSearch.value.trim().toLowerCase() : '';
  const statusFilterVal = filterStatus ? filterStatus.value : '';
  const carrierFilterVal = filterTransportadora ? filterTransportadora.value : '';
  const dateFilterVal = filterDate ? filterDate.value : '';

  tripsToExport = tripsToExport.filter(trip => {
    if (searchTerm) {
      const matchName = String(trip.nome_completo || '').toLowerCase().includes(searchTerm);
      const matchCarrier = String(trip.transportadora || '').toLowerCase().includes(searchTerm);
      const matchSetor = String(trip.setor || '').toLowerCase().includes(searchTerm);
      const matchCostCenter = String(trip.centro_custo || '').toLowerCase().includes(searchTerm);
      if (!matchName && !matchCarrier && !matchSetor && !matchCostCenter) return false;
    }

    if (statusFilterVal && trip.status !== statusFilterVal) return false;
    if (carrierFilterVal && trip.transportadora !== carrierFilterVal) return false;
    if (dateFilterVal && trip.data !== dateFilterVal) return false;

    if (currentPeriodFilter && currentPeriodFilter !== 'all') {
      if (!trip.data) return false;
      const tripDate = new Date(trip.data + 'T00:00:00');
      const now = new Date();

      if (currentPeriodFilter === 'daily') {
        const todayStr = now.toISOString().split('T')[0];
        if (trip.data !== todayStr) return false;
      } else if (currentPeriodFilter === 'weekly') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        if (tripDate < sevenDaysAgo) return false;
      } else if (currentPeriodFilter === 'biweekly') {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(now.getDate() - 15);
        if (tripDate < fifteenDaysAgo) return false;
      } else if (currentPeriodFilter === 'monthly') {
        if (tripDate.getMonth() !== now.getMonth() || tripDate.getFullYear() !== now.getFullYear()) return false;
      } else if (currentPeriodFilter === 'yearly') {
        if (tripDate.getFullYear() !== now.getFullYear()) return false;
      } else if (currentPeriodFilter === 'custom') {
        if (filterStartDate && filterStartDate.value && trip.data < filterStartDate.value) return false;
        if (filterEndDate && filterEndDate.value && trip.data > filterEndDate.value) return false;
      }
    }

    return true;
  });

  if (tripsToExport.length === 0) {
    showToast('info', 'Sem Dados', 'Nenhum registro encontrado para exportar com os filtros atuais.');
    return;
  }

  const headers = [
    'Data',
    'Operador Responsavel',
    'Colaborador',
    'Equipamento',
    'Tipo de Atividade',
    'Tipo de Movimentacao',
    'Modalidade de Pagamento',
    'Transportadora',
    'Codigo de Rastreio',
    'Setor',
    'Centro de Custo',
    'Valor (R$)',
    'Link do Card'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [];
  csvRows.push(headers.map(escapeCSV).join(';'));

  tripsToExport.forEach(trip => {
    const row = [
      formatDateBR(trip.data),
      trip.operador || '',
      trip.nome_completo || '',
      trip.equipamento || '',
      trip.status || '',
      trip.tipo_movimentacao || '',
      trip.modalidade_pagamento || '',
      trip.transportadora || '',
      trip.codigo_rastreio || '',
      trip.setor || '',
      trip.centro_custo || '',
      (Number(trip.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      trip.link_card || ''
    ];
    csvRows.push(row.map(escapeCSV).join(';'));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `OctaLogi_Relatorio_Viagens_${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('success', 'Relatório Gerado!', `Relatório CSV com ${tripsToExport.length} registros foi baixado.`);
}

function formatDateBR(dateString) {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

function formatCurrencyBRL(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  const campoNome = document.getElementById('campoNome');
  const editCampoNome = document.getElementById('editCampoNome');

  if (campoNome) {
    campoNome.addEventListener('input', handleGlpiUserSearch);
    campoNome.addEventListener('focus', handleGlpiUserSearch);
  }
  if (editCampoNome) {
    editCampoNome.addEventListener('input', handleEditGlpiUserSearch);
    editCampoNome.addEventListener('focus', handleEditGlpiUserSearch);
  }
});
