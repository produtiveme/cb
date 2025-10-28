/**
 * App Core - Curral Burguer Gestão
 * Contém toda a lógica compartilhada, helpers e configurações.
 */

// --- CONFIGURAÇÃO ---

// **CORREÇÃO MAIOR**: Ajustando a BASE_URL e todos os caminhos das rotinas
// com base no documento "Detalhes_Tecnicos.pdf" (Página 5).
const BASE_URL = 'https://work.produ-cloud.com/webhook';

export const N8N_URLS = {
  loadProducts: `${BASE_URL}/curral-burguer_carrega_produtos`,
  loadSuppliers: `${BASE_URL}/curral-burguer_carrega_todo_fornecedor`,
  loadProductSuppliers: `${BASE_URL}/curral-burguer_carrega_produto_fornecedor`,
  loadQuotes: `${BASE_URL}/curral-burguer_carrega_todo_cotacao`,
  loadQuoteItems: `${BASE_URL}/curral-burguer_carrega_item_cotacao`,
  loadStockHistory: `${BASE_URL}/curral-burguer_carrega_historico_estoque`,
  // Adicionar futuras URLs de escrita (POST) aqui
};

export const COLORS = {
  orange: '#FF4E00', // Aerospace Orange (Destaque)
  fawn: '#FFC280', // Fawn (Destaque Suave)
  black: '#1D1C1B', // Eerie Black (Texto)
  green: '#6B9E83', // Cambridge Blue (Sucesso, Sidebar)
  azure: '#D4E7E6', // Azure Web (Fundo Tabela Head)
  background: '#FFF9F3', // Sea Shell (Fundo principal)
};
const APP_VERSION = '0.5.0'; // Atualizar a cada nova versão

// --- HELPERS DE DADOS (localStorage) ---
/**
 * Salva o objeto de dados completo no localStorage.
 * @param {object} appData - O objeto com products, suppliers, etc.
 */
export const saveAppData = (appData) => {
  localStorage.setItem('appData', JSON.stringify(appData));
};

/**
 * Recupera o objeto de dados completo do localStorage.
 * @returns {object | null} O objeto de dados ou null se não existir.
 */
export const getAppData = () => {
  const data = localStorage.getItem('appData');
  return data ? JSON.parse(data) : null;
};
// --- AUTENTICAÇÃO ---

/**
 * Verifica se o usuário está autenticado.
 * Se não estiver, redireciona para a página de login.
 * @returns {boolean} True se autenticado, False caso contrário.
 */
export const checkAuth = () => {
  if (localStorage.getItem('isAuthenticated') !== 'true') {
    window.location.href = 'login.html';
    return false;
  }
  return true;
};
/**
 * Faz o logout do usuário, limpando o localStorage e redirecionando para o login.
 */
export const logout = () => {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('appData');
  window.location.href = 'login.html';
};
// --- HELPERS DE API ---

/**
 * Wrapper de Fetch para chamadas de API (GET).
 * @param {string} url - A URL completa da API.
 * @returns {Promise<object>} Os dados da resposta em JSON.
 */
export const fetchApi = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Tenta ler a resposta de erro, se houver
      let errorBody = 'Erro desconhecido';
      try {
        errorBody = await response.text();
      } catch (e) {
        // Ignora se não conseguir ler o corpo
      }
      throw new Error(`Erro de rede: ${response.statusText} (${response.status}) - ${errorBody} (URL: ${url})`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Falha na API: ${error.message}`);
    throw error; // Propaga o erro para o chamador (ex: tela de login)
  }
};
// --- COMPONENTES DE UI COMPARTILHADOS ---

/**
 * Renderiza o cabeçalho padrão das telas.
 * @param {string} title - O título da página.
 * @param {string} subtitle - O subtítulo da página.
 * @returns {string} O HTML do cabeçalho.
 */
export const renderScreenHeader = (title, subtitle) => {
  return `
    <div class="mb-4">
      <h1 class="text-3xl font-bold font-heading" style="color: ${COLORS.black};">${title}</h1>
      <p class="text-gray-600">${subtitle}</p>
    </div>
  `;
};
/**
 * Renderiza a barra de navegação lateral.
 * @param {string} activePage - O ID da página ativa (ex: 'estoque', 'cotacoes').
 */
export const renderSidebarNav = (activePage) => {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const getLinkClass = (page) => {
    return activePage === page
      ? 'text-white' // Ativo
      : 'text-gray-300 hover:text-white'; // Inativo
  };

  container.innerHTML = `
    <nav class="flex flex-col h-full p-4" style="background-color: ${COLORS.green}; width: 220px;">
      <div class="text-center mb-8 mt-4">
        <h1 class="text-2xl font-bold text-white font-heading">Curral Gestão</h1>
        <p class="text-sm" style="color: ${COLORS.azure};">Gestão de Cotação</p>
      </div>
      
      <ul class="flex flex-col space-y-2">
        <li>
          <a href="estoque.html" class="flex items-center px-3 py-2 rounded-md font-medium ${getLinkClass('estoque')}">
            <!-- Ícone SVG para Estoque (Exemplo) -->
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M16 11V3H8v8m-4 0h16"></path></svg>
            Estoque
          </a>
        </li>
        <li>
          <a href="cotacoes.html" class="flex items-center px-3 py-2 rounded-md font-medium ${getLinkClass('cotacoes')}">
            <!-- Ícone SVG para Cotações -->
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Cotações
          </a>
        </li>
        <li>
          <a href="produtos.html" class="flex items-center px-3 py-2 rounded-md font-medium ${getLinkClass('produtos')}">
            <!-- Ícone SVG para Produtos -->
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            Produtos
          </a>
        </li>
        <li>
          <a href="fornecedores.html" class="flex items-center px-3 py-2 rounded-md font-medium ${getLinkClass('fornecedores')}">
            <!-- Ícone SVG para Fornecedores -->
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-2.238M4 20h5v-2a3 3 0 00-5.356-2.238M12 11a4 4 0 100-8 4 4 0 000 8zm0 11h.01M12 6a1 1 0 100-2 1 1 0 000 2z"></path></svg>
            Fornecedores
          </a>
        </li>
      </ul>
      
      <div class="mt-auto">
        <a href="#" id="logout-btn" class="flex items-center px-3 py-2 rounded-md font-medium text-gray-300 hover:text-white">
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Sair
        </a>
      </div>
    </nav>
  `;

  // Adiciona o evento de logout
  document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
};

/**
 * Renderiza o rodapé padrão.
 */
export const renderFooter = () => {
  const container = document.getElementById('footer-container');
  if (!container) return;
  
  container.innerHTML = `
    <footer class="p-4 text-center text-sm text-gray-500" style="background-color: ${COLORS.background};">
      Desenvolvido pelo ProdutiveMe. Versão ${APP_VERSION}
    </footer>
  `;
};

/**
 * Renderiza um estado de carregamento dentro de um container.
 * @param {HTMLElement} container - O elemento onde o loading será injetado.
 * @param {string} message - A mensagem de carregamento.
 */
export const renderLoading = (container, message) => {
  if (!container) return;
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full min-h-[300px]">
      <svg class="animate-spin h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="mt-4 text-lg font-medium text-gray-700">${message}</p>
    </div>
  `;
};

// --- COMPONENTES DE FEEDBACK (Alertas e Modais) ---

/**
 * Mostra uma mensagem de erro (toast) no canto da tela.
 * @param {string} message - A mensagem de erro.
 */
export const showError = (message) => {
  const container = document.getElementById('error-container');
  if (!container) return;

  const errorId = `err-${Date.now()}`;
  const errorEl = document.createElement('div');
  errorEl.id = errorId;
  errorEl.className = 'bg-red-600 text-white p-4 rounded-lg shadow-lg mb-2 animate-pulse';
  errorEl.innerHTML = `
    <span class="font-bold">Erro:</span> ${message}
  `;
  
  container.appendChild(errorEl);

  // Remove a animação e depois remove o elemento
  setTimeout(() => {
    errorEl.classList.remove('animate-pulse');
  }, 1000);

  setTimeout(() => {
    errorEl.remove();
  }, 5000); // Remove o toast após 5 segundos
};

/**
 * Mostra um modal de confirmação.
 * @param {string} title - O título do modal.
 * @param {string} htmlMessage - A mensagem (pode ser HTML).
 * @param {function} onConfirm - Callback a ser executado se o usuário confirmar.
 */
export const showConfirmationModal = (title, htmlMessage, onConfirm) => {
  // Remove qualquer modal antigo
  const oldModal = document.getElementById('confirmation-modal');
  if (oldModal) oldModal.remove();

  // Cria o HTML do modal
  const modal = document.createElement('div');
  modal.id = 'confirmation-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <!-- Overlay -->
    <div class="fixed inset-0 bg-black opacity-50" id="modal-overlay"></div>
    
    <!-- Conteúdo do Modal -->
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg z-10 p-6">
      <h3 class="text-xl font-bold font-heading mb-4" style="color: ${COLORS.black};">${title}</h3>
      <div class="text-gray-700 mb-6">
        ${htmlMessage}
      </div>
      
      <!-- Botões -->
      <div class="flex justify-end space-x-3">
        <button id="modal-btn-cancel"
          class="px-4 py-2 rounded-md font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300">
          Cancelar
        </button>
        <button id="modal-btn-confirm"
          class="px-4 py-2 rounded-md font-medium text-white"
          style="background-color: ${COLORS.orange};">
          Confirmar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);

  // Lógica de fechamento
  const closeModal = () => modal.remove();
  
  document.getElementById('modal-overlay').addEventListener('click', closeModal);
  document.getElementById('modal-btn-cancel').addEventListener('click', closeModal);
  
  // Lógica de confirmação
  document.getElementById('modal-btn-confirm').addEventListener('click', () => {
    onConfirm();
    closeModal();
  });
};

// --- HELPERS GERAIS ---

/**
 * Formata uma data ISO (ex: "2025-10-27T16:58:00.000Z") para dd/mm/aaaa.
 * @param {string} isoString - A data em formato ISO.
 * @returns {string} A data formatada.
 */
export const formatISODate = (isoString) => {
  if (!isoString) return 'N/D';
  try {
    const date = new Date(isoString);
    // Adiciona o fuso horário para corrigir a data (comum em ISO)
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);
    
    const day = String(correctedDate.getDate()).padStart(2, '0');
    const month = String(correctedDate.getMonth() + 1).padStart(2, '0'); // Meses são 0-indexados
    const year = correctedDate.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return 'Data inválida';
  }
};