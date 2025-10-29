// --- APP CORE: Funções e Configurações Compartilhadas ---

// --- 1. CONFIGURAÇÃO ---
const APP_VERSION = '0.5.0';

// Paleta de Cores (Baseada na Identidade Visual)
const COLORS = {
  orange: '#FF4E00',
  fawn: '#FFC280',
  black: '#1D1C1B',
  blue: '#6B9E83',
  azure: '#D4E7E6',
  shell: '#FFF9F3'
};

// URLs dos Webhooks do N8N (Corrigidas)
const N8N_URLS = {
  BASE_URL: "https://work.produ-cloud.com/webhook/curral-burguer",
  loadProducts: "/curral-burguer_carrega_produtos",
  loadSuppliers: "/curral-burguer_carrega_fornecedores",
  loadProductSuppliers: "/curral-burguer_carrega_produtos_fornecedores",
  loadQuotes: "/curral-burguer_carrega_cotacoes",
  loadQuoteItems: "/curral-burguer_carrega_itens_cotacao",
  loadStockHistory: "/curral-burguer_carrega_historico_estoque",
  createQuote: "/curral-burguer_cria_cotacao" // <-- NOVO WEBHOOK
};

// --- 2. UTILITÁRIOS DE API ---

/**
 * Wrapper de Fetch para chamadas GET ao N8N
 * @param {string} endpoint O caminho do endpoint (ex: /curral-burguer_carrega_produtos)
 * @returns {Promise<object>} Os dados da resposta em JSON
 */
async function fetchApi(endpoint) {
  const url = `${N8N_URLS.BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro de rede: ${response.statusText} (URL: ${url})`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Falha na chamada API [GET] ${url}:`, error);
    throw error;
  }
}

/**
 * Wrapper de Fetch para chamadas POST ao N8N
 * @param {string} endpoint O caminho do endpoint (ex: /curral-burguer_cria_cotacao)
 * @param {object} body O corpo (payload) da requisição em JSON
 * @returns {Promise<object>} A resposta em JSON
 */
async function postApi(endpoint, body) {
  const url = `${N8N_URLS.BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const responseBody = await response.json();

    if (!response.ok) {
      // Tenta extrair a mensagem de erro do N8N, se houver
      const errorMessage = responseBody.message || response.statusText;
      throw new Error(errorMessage);
    }
    
    return responseBody; // Retorna a resposta de sucesso (ex: { message: "..." })
  } catch (error) {
    console.error(`Falha na chamada API [POST] ${url}:`, error);
    // Repassa a mensagem de erro específica do N8N (se existir)
    throw new Error(error.message || 'Erro de rede ao enviar dados.');
  }
}

// --- 3. GESTÃO DE DADOS (localStorage) ---

/**
 * Salva todos os dados da aplicação no localStorage
 * @param {object} appData O objeto de estado completo da aplicação
 */
function saveAppData(appData) {
  try {
    localStorage.setItem('curralBurguerAppData', JSON.stringify(appData));
  } catch (error) {
    console.error("Falha ao salvar dados no localStorage:", error);
    showError("Erro crítico: Não foi possível salvar os dados da sessão.");
  }
}

/**
 * Obtém todos os dados da aplicação do localStorage
 * @returns {object | null} O objeto de estado da aplicação ou null se não existir
 */
function getAppData() {
  try {
    const data = localStorage.getItem('curralBurguerAppData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Falha ao ler dados do localStorage:", error);
    showError("Erro crítico: Não foi possível ler os dados da sessão.");
    return null;
  }
}

/**
 * Limpa todos os dados da sessão (Logout)
 */
function clearAppData() {
  localStorage.removeItem('curralBurguerAppData');
}

/**
 * Obtém um item específico (produto, fornecedor) pelo ID
 * @param {string} type 'products', 'suppliers', 'productSuppliers', 'quotes', 'quoteItems', 'stockHistory'
 * @param {string} id O ID do item
 * @returns {object | undefined} O item encontrado ou undefined
 */
function getItemById(type, id) {
  const appData = getAppData();
  if (!appData || !appData[type]) {
    return undefined;
  }
  return appData[type].find(item => item.id === id);
}

// Funções "Helpers" para facilitar a busca (Evita repetição)
function getProductById(id) {
  return getItemById('products', id);
}
function getSupplierById(id) {
  return getItemById('suppliers', id);
}
function getQuoteById(id) {
  return getItemById('quotes', id);
}

/**
 * Obtém o nome de um produto pelo seu ID
 * @param {string} productId O ID do produto
 * @returns {string} O nome do produto ou "Produto não encontrado"
 */
function getProductName(productId) {
  const product = getProductById(productId);
  return product ? product.property_nome : 'Produto não encontrado';
}

/**
 * Obtém o nome de um fornecedor pelo seu ID
 * @param {string} supplierId O ID do fornecedor
 * @returns {string} O nome do fornecedor ou "Fornecedor não encontrado"
 */
function getSupplierName(supplierId) {
  const supplier = getSupplierById(supplierId);
  return supplier ? supplier.property_nome : 'Fornecedor não encontrado';
}


// --- 4. AUTENTICAÇÃO E NAVEGAÇÃO ---

/**
 * Verifica se o usuário está autenticado (dados no localStorage)
 * Redireciona para o login se não estiver.
 * @returns {boolean} True se autenticado, false se não
 */
function checkAuth() {
  const appData = getAppData();
  if (!appData) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/**
 * Obtém parâmetros da URL (ex: ?id=...)
 * @param {string} param O nome do parâmetro
 * @returns {string | null} O valor do parâmetro ou null
 */
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// --- 5. COMPONENTES DE UI COMPARTILHADOS ---

/**
 * Renderiza o spinner de carregamento
 * @param {HTMLElement} container O elemento onde o spinner será inserido
 * @param {string} text O texto a ser exibido (ex: "Carregando dados...")
 */
function renderLoading(container, text = "Carregando...") {
  if (container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-center">
        <svg class="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-lg font-medium text-gray-600">${text}</p>
      </div>
    `;
  }
}

/**
 * Renderiza o cabeçalho padrão das páginas
 * @param {string} title Título da página
 * @param {string} subtitle Subtítulo (opcional)
 * @returns {string} O HTML do cabeçalho
 */
function renderScreenHeader(title, subtitle = '', children = '') {
  return `
    <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-bold font-heading" style="color: ${COLORS.black};">${title}</h1>
        ${subtitle ? `<p class="mt-1 text-base text-gray-500">${subtitle}</p>` : ''}
      </div>
      <div class="mt-4 md:mt-0">
        ${children}
      </div>
    </div>
  `;
}

/**
 * Renderiza o menu lateral (Sidebar)
 * @param {string} activePage O slug da página ativa (ex: 'estoque', 'cotacoes')
 */
function renderSidebarNav(activePage = 'estoque') {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const menuItems = [
    { slug: 'estoque', name: 'Estoque', href: 'estoque.html' },
    { slug: 'cotacoes', name: 'Cotações', href: 'cotacoes.html' },
    { slug: 'produtos', name: 'Produtos', href: 'produtos.html' },
    { slug: 'fornecedores', name: 'Fornecedores', href: 'fornecedores.html' }
  ];

  // Classe base para os links
  const baseClass = "flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150";
  // Classe específica para o link ativo
  const activeClass = `text-white`; // Cor de texto branca
  // Classe específica para o link inativo
  const inactiveClass = `text-gray-700 hover:bg-gray-200`;

  container.innerHTML = `
    <aside class="w-full md:w-64 bg-white md:min-h-screen p-4 border-b md:border-b-0 md:border-r" style="border-color: ${COLORS.azure};">
      <div class="flex items-center justify-center md:justify-start mb-6">
        <h1 class="text-2xl font-bold font-heading" style="color: ${COLORS.orange};">
          Curral<span style="color: ${COLORS.black};">Burguer</span>
        </h1>
      </div>
      <nav class="space-y-2">
        ${menuItems.map(item => `
          <a 
            href="${item.href}" 
            class="${baseClass} ${item.slug === activePage ? activeClass : inactiveClass}"
            ${item.slug === activePage ? `style="background-color: ${COLORS.orange};"` : ''}
          >
            <!-- Ícone (placeholder) -->
            <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            ${item.name}
          </a>
        `).join('')}
      </nav>
      <!-- Logout Button -->
      <div class="mt-6">
        <button id="logout-button" class="${baseClass} ${inactiveClass} w-full">
          <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Sair
        </button>
      </div>
    </aside>
  `;

  // Adiciona o evento de clique ao botão de logout
  document.getElementById('logout-button').addEventListener('click', () => {
    clearAppData();
    window.location.href = 'login.html';
  });
}

/**
 * Renderiza o rodapé padrão
 */
function renderFooter() {
  const container = document.getElementById('footer-container');
  if (container) {
    container.innerHTML = `
      <footer class="p-4 text-center text-sm text-gray-500 border-t" style="border-color: ${COLORS.azure};">
        Desenvolvido pelo ProdutiveMe. Versão ${APP_VERSION}
      </footer>
    `;
  }
}

// --- 6. COMPONENTES DE UI (Alertas e Modais) ---

/**
 * Exibe uma mensagem de erro (toast) no canto da tela
 * @param {string} message A mensagem de erro
 */
function showError(message) {
  const container = document.getElementById('error-container');
  if (!container) return;

  const errorId = `error-${Date.now()}`;
  const errorElement = document.createElement('div');
  errorElement.id = errorId;
  errorElement.className = "bg-red-500 text-white p-4 rounded-lg shadow-lg animate-pulse";
  errorElement.innerHTML = `
    <span class="font-bold">Erro:</span> ${message}
  `;

  container.appendChild(errorElement);

  // Remove a mensagem após 5 segundos
  setTimeout(() => {
    const el = document.getElementById(errorId);
    if (el) {
      el.classList.remove('animate-pulse');
      el.classList.add('transition-opacity', 'duration-500', 'opacity-0');
      setTimeout(() => el.remove(), 500);
    }
  }, 5000);
}

/**
 * Exibe um modal de confirmação.
 * @param {object} options
 * @param {string} options.title - O título do modal.
 * @param {string} options.messageHtml - O conteúdo HTML da mensagem.
 * @param {string} options.confirmText - O texto do botão de confirmação (ex: "Confirmar").
 * @param {string} options.cancelText - O texto do botão de cancelar (ex: "Cancelar").
 * @param {Function} options.asyncAction - A FUNÇÃO (assíncrona) a ser executada ao confirmar.
 */
function showConfirmationModal({ title, messageHtml, confirmText, cancelText, asyncAction }) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <!-- Cabeçalho -->
        <div class="p-6 border-b">
          <h3 class="text-xl font-bold font-heading" style="color: ${COLORS.black};">${title}</h3>
        </div>
        
        <!-- Corpo -->
        <div class="p-6 space-y-4">
          ${messageHtml}
        </div>

        <!-- Spinner (oculto por padrão) -->
        <div id="modal-spinner" class="hidden p-6 text-center">
          <svg class="animate-spin h-6 w-6 text-gray-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-sm text-gray-500">A processar...</p>
        </div>
        
        <!-- Rodapé (Botões) -->
        <div id="modal-actions" class="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button id="modal-cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition">
            ${cancelText}
          </button>
          <button 
            id="modal-confirm-btn" 
            class="px-4 py-2 text-white rounded-md font-medium transition"
            style="background-color: ${COLORS.orange};"
          >
            ${confirmText}
          </button>
        </div>
      </div>
    </div>
  `;

  container.classList.remove('hidden');

  const modalSpinner = document.getElementById('modal-spinner');
  const modalActions = document.getElementById('modal-actions');
  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  const closeModal = () => {
    container.classList.add('hidden');
    container.innerHTML = '';
  };

  cancelBtn.addEventListener('click', closeModal);

  confirmBtn.addEventListener('click', async () => {
    // 1. Mostrar spinner e desativar botões
    modalSpinner.classList.remove('hidden');
    modalActions.classList.add('hidden');

    try {
      // 2. Executar a ação assíncrona (ex: chamar N8N)
      await asyncAction();
      
      // 3. Se deu certo, fechar o modal
      closeModal();

    } catch (error) {
      // 4. Se deu erro, esconder o spinner e mostrar botões novamente
      modalSpinner.classList.add('hidden');
      modalActions.classList.remove('hidden');
      
      // 5. Mostrar o erro (o modal não fecha)
      // (a função `asyncAction` é responsável por chamar `showError` se necessário)
      console.error("Falha na ação do modal:", error);
      // Podemos também mostrar o erro dentro do modal, mas `showError` (toast) é melhor
      showError(error.message || "Ocorreu um erro desconhecido.");
    }
  });
}


// --- 7. UTILITÁRIOS DE FORMATAÇÃO ---

/**
 * Formata uma data (string ISO ou objeto Date) para dd/mm/aaaa
 * @param {string | Date} dateInput A data
 * @returns {string} A data formatada
 */
function formatDate(dateInput) {
  try {
    const date = new Date(dateInput);
    // Adiciona o fuso horário para evitar problemas de "um dia antes"
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);

    const d = correctedDate.getDate().toString().padStart(2, '0');
    const m = (correctedDate.getMonth() + 1).toString().padStart(2, '0'); // Mês é base 0
    const y = correctedDate.getFullYear();
    return `${d}/${m}/${y}`;
  } catch (error) {
    console.warn("Falha ao formatar data:", dateInput, error);
    return "Data inválida";
  }
}

// --- 8. EXPORTAÇÕES ---
// Exporta tudo o que as páginas individuais precisam
export {
  // Config
  APP_VERSION,
  COLORS,
  N8N_URLS,
  // API
  fetchApi,
  postApi, // <-- Exporta a nova função
  // Dados
  saveAppData,
  getAppData,
  clearAppData,
  getItemById,
  getProductById,
  getSupplierById,
  getQuoteById,
  getProductName,
  getSupplierName,
  // UI
  checkAuth,
  getUrlParam,
  renderLoading,
  renderScreenHeader,
  renderSidebarNav,
  renderFooter,
  showError,
  showConfirmationModal, // <-- Exporta o modal melhorado
  // Formato
  formatDate
};