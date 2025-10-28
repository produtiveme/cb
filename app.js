// --- ATUALIZAR AQUI A CADA NOVA VERSÃO ---
const APP_VERSION = '0.6.0'; // Versão atualizada para refletir a refatoração
// -----------------------------------------

// --- Constantes de Identidade Visual ---
export const COLORS = {
  orange: '#FF4E00',
  fawn: '#FFC280',
  black: '#1D1C1B',
  blue: '#6B9E83',
  azure: '#D4E7E6',
  shell: '#FFF9F3',
};

// --- URLs dos Webhooks ---
export const N8N_URLS = {
  login: 'https://work.produ-cloud.com/webhook/curral-burguer_login', // Placeholder
  loadProducts: 'https://work.produ-cloud.com/webhook/curral-burguer_carrega_produtos',
  loadSuppliers: 'https://work.produ-cloud.com/webhook/curral-burguer_carrega_todo_fornecedor',
  loadProductSuppliers: 'https://work.produ-cloud.com/webhook/curral-burguer_carrega_produto_fornecedor',
  loadStockHistory: 'https://work.produ-cloud.com/webhook/curral-burguer_carrega_historico_estoque',
  loadQuotes: 'https://work.produ-cloud.com/webhook/curral-burguer_carrega_todo_cotacao',
  loadQuoteItems: 'https://work.produ-cloud.com/webhook/curral-burguer_carrega_item_cotacao',
  createQuote: 'https://work.produ-cloud.com/webhook/curral-burguer_create_cotacao', 
  updateQuoteItem: 'https://work.produ-cloud.com/webhook/curral-burguer_update_item_cotacao',
};

// --- Mock Data (Fallback) ---
// ... (O MOCK_DATA que tínhamos antes)
export const MOCK_DATA = { /* ... Mocks completos aqui ... */ };

// --- Gerenciamento de Dados (LocalStorage) ---

const APP_DATA_KEY = 'curralBurguerAppData';

/**
 * Salva todo o estado da aplicação no LocalStorage
 * @param {object} data O objeto de estado completo (products, quotes, etc.)
 */
export const saveAppData = (data) => {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
};

/**
 * Carrega o estado da aplicação do LocalStorage
 * @returns {object | null} O objeto de estado ou null se não existir
 */
export const getAppData = () => {
  const data = localStorage.getItem(APP_DATA_KEY);
  return data ? JSON.parse(data) : null;
};

/**
 * Limpa todos os dados da aplicação do LocalStorage (Logout)
 */
export const clearAppData = () => {
  localStorage.removeItem(APP_DATA_KEY);
  // Também limpa o usuário
  localStorage.removeItem('curralUser');
};

/**
 * Salva a informação do usuário logado
 */
export const saveUser = (user) => {
  localStorage.setItem('curralUser', JSON.stringify(user));
};

/**
 * Verifica se o usuário está logado
 * @returns {object | null} O objeto do usuário ou null
 */
export const getActiveUser = () => {
  const user = localStorage.getItem('curralUser');
  return user ? JSON.parse(user) : null;
};

/**
 * Verifica se o usuário está logado e redireciona se não estiver
 */
export const checkAuth = () => {
  if (!getActiveUser()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
};

// --- Funções de API ---

/**
 * Função genérica para buscar dados da API
 * @param {string} endpoint A URL do webhook
 * @param {object | null} payload O corpo da requisição (para POST)
 * @returns {Promise<any>} Os dados da resposta
 */
export const fetchApi = async (endpoint, payload = null) => {
  console.log(`Chamando API: ${endpoint}`, payload);
  
  try {
    const response = await fetch(endpoint, {
      method: payload ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : null
    });

    if (!response.ok) {
      throw new Error(`Erro na rede: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (typeof data === 'object' && data !== null) return data;

    console.warn("Resposta da API não era um array:", data);
    return [];
  } catch (err) {
    console.error("Falha ao buscar dados:", err);
    // TODO: Implementar fallback para MOCK_DATA se necessário
    return []; 
  }
};

// --- Helpers de Formatação e Mapeamento ---

/**
 * Formata uma string de data para dd/mm/aaaa
 * @param {string} dateString A string de data (ISO)
 * @returns {string} Data formatada
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Data desconhecida';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

/**
 * Busca o nome de um produto pelo ID
 * @param {string} id ID do produto
 * @returns {string} Nome do produto
 */
export const getProductName = (id) => {
  const data = getAppData();
  if (!data || !data.products) return 'Produto...';
  return data.products.find(p => p.id === id)?.property_nome || 'Produto desconhecido';
};

/**
 * Busca o nome de um fornecedor pelo ID
 * @param {string} id ID do fornecedor
 * @returns {string} Nome do fornecedor
 */
export const getSupplierName = (id) => {
  const data = getAppData();
  if (!data || !data.suppliers) return 'Fornecedor...';
  return data.suppliers.find(s => s.id === id)?.property_nome || 'Fornecedor desconhecido';
};

// --- Renderização de Componentes Comuns ---

/**
 * Renderiza o menu lateral (Sidebar)
 * @param {string} activeViewId O ID da view ativa (ex: 'estoque')
 */
export const renderSidebarNav = (activeViewId) => {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const navItems = [
    { id: 'estoque', label: 'Estoque', href: 'estoque.html' },
    { id: 'cotacao', label: 'Cotações', href: 'cotacoes.html' },
    { id: 'produtos', label: 'Produtos', href: 'produtos.html' },
    { id: 'fornecedores', label: 'Fornecedores', href: 'fornecedores.html' },
  ];

  const itemsHtml = navItems.map(item => {
    const isActive = activeViewId.startsWith(item.id);
    return `
      <a
        href="${item.href}"
        class="nav-link w-full text-left px-3 py-3 rounded-md transition-all duration-200 block
        ${isActive ? 'font-semibold text-white' : 'text-gray-700 hover:bg-gray-200'}
        ${isActive && item.id === 'estoque' ? 'font-heading' : ''}"
        style="background-color: ${isActive ? COLORS.orange : 'transparent'};
               font-family: ${isActive ? "'Bricolage Grotesque', sans-serif" : "'Inter', sans-serif"};"
      >
        ${item.label}
      </a>
    `;
  }).join('');

  container.innerHTML = `
    <nav class="w-full md:w-64 p-4 space-y-2 bg-white shadow-lg md:min-h-screen">
      <h2 class="text-2xl font-bold px-2 pb-4 font-heading" style="color: ${COLORS.black};">
        Curral
        <span style="color: ${COLORS.orange};"> Gestão</span>
      </h2>
      ${itemsHtml}
      <div class="pt-4 border-t mt-4">
        <button id="logout-button" class="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200">
          Sair
        </button>
      </div>
    </nav>
  `;

  // Adiciona evento de logout
  document.getElementById('logout-button')?.addEventListener('click', () => {
    clearAppData();
    window.location.href = 'login.html';
  });
};

/**
 * Renderiza o rodapé
 */
export const renderFooter = () => {
  const container = document.getElementById('footer-container');
  if (!container) return;
  container.innerHTML = `
    <footer class="p-4 text-center text-sm text-gray-600 bg-gray-50 border-t border-gray-200">
      Desenvolvido pelo ProdutiveMe. Versão ${APP_VERSION}
    </footer>
  `;
};

/**
 * Renderiza o cabeçalho padrão das telas
 */
export const renderScreenHeader = (title, subtitle, buttonsHtml = '') => {
  return `
    <div class="mb-6">
      <div class="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold font-heading" style="color: ${COLORS.black};">
            ${title}
          </h1>
          <p class="text-gray-600 mt-1">${subtitle}</p>
        </div>
        <div class="space-x-2 flex-shrink-0">${buttonsHtml}</div>
      </div>
      <hr class="mt-4" />
    </div>
  `;
};

/**
 * Renderiza um estado de loading dentro de um container
 * @param {HTMLElement} container O elemento onde o loading será inserido
 * @param {string} text Texto opcional (ex: "Carregando produtos...")
 */
export const renderLoading = (container, text = "Carregando...") => {
  if (!container) return;
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full p-8">
      <h2 class="text-2xl font-semibold font-heading" style="color: ${COLORS.black};">${text}</h2>
      <div class="mt-8 w-16 h-16 border-4 border-t-4 rounded-full animate-spin" 
           style="border-color: ${COLORS.azure}; border-top-color: ${COLORS.orange};">
      </div>
    </div>
  `;
};

/**
 * Exibe uma mensagem de erro global
 */
export const showError = (message) => {
  let container = document.getElementById('error-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'error-container';
    container.className = "fixed top-4 right-4 z-50";
    document.body.appendChild(container);
  }
  
  const errorId = `err-${Math.random()}`;
  const errorDiv = document.createElement('div');
  errorDiv.id = errorId;
  errorDiv.className = "p-4 mb-2 text-red-800 bg-red-100 border border-red-300 rounded-md shadow-lg animate-pulse";
  errorDiv.innerHTML = `<span>${message}</span><button data-err-id="${errorId}" class="ml-4 font-bold">&times;</button>`;
  
  container.appendChild(errorDiv);

  const closeBtn = errorDiv.querySelector('button');
  closeBtn?.addEventListener('click', () => {
    errorDiv.remove();
  });

  // Auto-remove
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
};