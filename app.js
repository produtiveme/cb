// --- APP CORE: Funções e Configurações Compartilhadas ---

// --- 1. CONFIGURAÇÃO ---
const APP_VERSION = '0.5.0';

// Paleta de Cores (Baseada na Identidade Visual)
const COLORS = {
  orange: '#FF4E00',
  fawn: '#FFC280',
  black: '#1D1C1B',
  blue: '#6B9E83', // Renomeado de 'green' para 'blue' conforme uso
  azure: '#D4E7E6',
  shell: '#FFF9F3'
};

// URLs dos Webhooks do N8N (Corrigidas)
const N8N_URLS = {
  // *** CORREÇÃO AQUI: BASE_URL sem /curral-burguer ***
  BASE_URL: "https://work.produ-cloud.com/webhook",
  loadProducts: "/curral-burguer_carrega_produtos",
  loadSuppliers: "/curral-burguer_carrega_todo_fornecedor", // Corrigido nome fornecedor
  loadProductSuppliers: "/curral-burguer_carrega_produto_fornecedor", // Corrigido nome produto_fornecedor
  loadQuotes: "/curral-burguer_carrega_todo_cotacao", // Corrigido nome cotacao
  loadQuoteItems: "/curral-burguer_carrega_item_cotacao", // Corrigido nome item_cotacao
  loadStockHistory: "/curral-burguer_carrega_historico_estoque", // Corrigido nome historico_estoque
  createQuote: "/curral-burguer_cria_cotacao"
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
       // Tenta ler a resposta de erro, se houver
      let errorBody = `Status: ${response.status}`;
      try {
        const errorJson = await response.json();
        errorBody = errorJson.message || JSON.stringify(errorJson);
      } catch (e) {
         try {
           errorBody = await response.text();
         } catch(e2) { /* Ignora se não conseguir ler */}
      }
      throw new Error(`Erro de rede: ${response.statusText}. ${errorBody} (URL: ${url})`);
    }
    // Verifica se a resposta está vazia antes de tentar fazer o parse
    const textResponse = await response.text();
    if (!textResponse) {
        console.warn(`Resposta vazia recebida de [GET] ${url}`);
        return []; // Retorna array vazio ou null, dependendo do esperado
    }
    try {
        return JSON.parse(textResponse); // Tenta fazer o parse do texto como JSON
    } catch(e) {
        console.error(`Falha ao fazer parse do JSON da resposta [GET] ${url}:`, textResponse);
        throw new Error(`Resposta inválida recebida do servidor.`);
    }
  } catch (error) {
    console.error(`Falha na chamada API [GET] ${url}:`, error);
    // Remove a URL da mensagem de erro para o usuário final
    const userFriendlyMessage = error.message.includes('(URL:')
        ? error.message.split('(URL:')[0].trim()
        : error.message;
    throw new Error(userFriendlyMessage);
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

    // Lê a resposta como texto primeiro para verificar se está vazia
    const textResponse = await response.text();
    let responseBody = {}; // Objeto padrão caso a resposta seja vazia
     if (textResponse) {
        try {
            responseBody = JSON.parse(textResponse); // Tenta fazer o parse
        } catch(e) {
             console.error(`Falha ao fazer parse do JSON da resposta [POST] ${url}:`, textResponse);
             throw new Error(`Resposta inválida recebida do servidor.`);
        }
    } else {
        console.warn(`Resposta vazia recebida de [POST] ${url}`);
        // Se a resposta for vazia mas o status for OK, considera sucesso
        if (!response.ok) {
           throw new Error(`Erro de rede: ${response.statusText} (Status: ${response.status})`);
        }
    }


    if (!response.ok) {
      // Tenta extrair a mensagem de erro do N8N, se houver
      const errorMessage = responseBody.message || response.statusText;
      throw new Error(errorMessage);
    }

    return responseBody; // Retorna a resposta de sucesso (ex: { message: "..." })
  } catch (error) {
    console.error(`Falha na chamada API [POST] ${url}:`, error);
    // Repassa a mensagem de erro específica do N8N (se existir)
    const userFriendlyMessage = error.message.includes('(URL:')
        ? error.message.split('(URL:')[0].trim()
        : error.message;
    throw new Error(userFriendlyMessage || 'Erro de rede ao enviar dados.');
  }
}

// --- 3. GESTÃO DE DADOS (localStorage) ---

const APP_DATA_KEY = 'curralBurguerAppData';
const AUTH_KEY = 'isAuthenticated'; // <-- Chave de autenticação

/**
 * Salva todos os dados da aplicação no localStorage
 * @param {object} appData O objeto de estado completo da aplicação
 */
function saveAppData(appData) {
  try {
    localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
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
    const data = localStorage.getItem(APP_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Falha ao ler dados do localStorage:", error);
    showError("Erro crítico: Não foi possível ler os dados da sessão.");
    localStorage.removeItem(APP_DATA_KEY); // Limpa dados corrompidos
    localStorage.removeItem(AUTH_KEY); // Desloga o usuário
    return null;
  }
}

/**
 * Limpa todos os dados da sessão (Logout)
 */
function clearAppData() {
  localStorage.removeItem(APP_DATA_KEY);
  localStorage.removeItem(AUTH_KEY); // Limpa também a flag de autenticação
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
    console.warn(`Tentativa de buscar item por ID em dados inexistentes: tipo=${type}, id=${id}`);
    return undefined;
  }
   // Adiciona verificação se appData[type] é um array
   if (!Array.isArray(appData[type])) {
       console.error(`Os dados para "${type}" não são um array. Verifique o carregamento inicial.`);
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
    if (!productId) return 'Produto inválido'; // Verifica se productId é válido
    const product = getProductById(productId);
    return product ? product.property_nome : 'Produto não encontrado';
}

/**
 * Obtém o nome de um fornecedor pelo seu ID
 * @param {string} supplierId O ID do fornecedor
 * @returns {string} O nome do fornecedor ou "Fornecedor não encontrado"
 */
function getSupplierName(supplierId) {
   if (!supplierId) return 'Fornecedor inválido'; // Verifica se supplierId é válido
  const supplier = getSupplierById(supplierId);
  return supplier ? supplier.property_nome : 'Fornecedor não encontrado';
}


// --- 4. AUTENTICAÇÃO E NAVEGAÇÃO ---

/**
 * Verifica se o usuário está autenticado (localStorage)
 * Redireciona para o login se não estiver.
 * @returns {boolean} True se autenticado, false se não
 */
function checkAuth() {
  // *** CORREÇÃO AQUI: Verifica a flag 'isAuthenticated' ***
  if (localStorage.getItem(AUTH_KEY) !== 'true') {
    console.log("checkAuth falhou, redirecionando para login."); // Debug
    window.location.href = 'login.html';
    return false;
  }
  // Adicional: Verifica se os dados existem, mas não redireciona se não existirem ainda
   const appData = getAppData();
   if (!appData) {
       console.warn("Usuário autenticado, mas dados da aplicação não encontrados no localStorage.");
       // Não redireciona aqui, a página pode estar a carregar os dados
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
  } else {
     console.error("Container para renderLoading não encontrado.");
  }
}

/**
 * Renderiza o cabeçalho padrão das páginas
 * @param {string} title Título da página
 * @param {string} subtitle Subtítulo (opcional)
 * @param {string} children HTML extra para a direita do cabeçalho (ex: botões)
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
  if (!container) {
     console.error("Container da sidebar não encontrado.");
     return;
  }


  const menuItems = [
    { slug: 'estoque', name: 'Estoque', href: 'estoque.html', icon: 'M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M16 11V3H8v8m-4 0h16' }, // Ícone Caixa
    { slug: 'cotacoes', name: 'Cotações', href: 'cotacoes.html', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }, // Ícone Documento
    { slug: 'produtos', name: 'Produtos', href: 'produtos.html', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' }, // Ícone Sacola
    { slug: 'fornecedores', name: 'Fornecedores', href: 'fornecedores.html', icon: 'M17 20h5v-2a3 3 0 00-5.356-2.238M4 20h5v-2a3 3 0 00-5.356-2.238M12 11a4 4 0 100-8 4 4 0 000 8zm0 11h.01M12 6a1 1 0 100-2 1 1 0 000 2z' } // Ícone Grupo
  ];

  // Classe base para os links
  const baseClass = "flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150";
  // Classe específica para o link ativo
  const activeClass = `text-white`; // Cor de texto branca
  // Classe específica para o link inativo
  const inactiveClass = `text-gray-700 hover:bg-gray-200`; // Cinza escuro no hover

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
            <svg class="h-5 w-5 mr-3 flex-shrink-0 ${item.slug === activePage ? 'text-white' : 'text-gray-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path>
            </svg>
            ${item.name}
          </a>
        `).join('')}
      </nav>
      <!-- Logout Button -->
      <div class="mt-auto pt-6"> <!-- Adiciona padding superior para separar -->
        <button id="logout-button" class="${baseClass} ${inactiveClass} w-full">
          <svg class="h-5 w-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Sair
        </button>
      </div>
    </aside>
  `;

  // Adiciona o evento de clique ao botão de logout
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
     logoutButton.addEventListener('click', () => {
        clearAppData(); // Usa a função de logout correta
        window.location.href = 'login.html'; // Redireciona
     });
  } else {
     console.error("Botão de logout não encontrado.");
  }
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
  } else {
    console.error("Container do footer não encontrado.");
  }
}

// --- 6. COMPONENTES DE UI (Alertas e Modais) ---

/**
 * Exibe uma mensagem de feedback (toast) no canto da tela
 * @param {string} message A mensagem
 * @param {'error' | 'success'} type O tipo de mensagem ('error' ou 'success')
 */
function showFeedback(message, type = 'error') {
  const container = document.getElementById('error-container'); // Reutiliza o container
  if (!container) return;

  const feedbackId = `feedback-${Date.now()}`;
  const element = document.createElement('div');
  element.id = feedbackId;

  let bgColor, textColor, title;
  if (type === 'success') {
    bgColor = 'bg-green-500'; // Verde para sucesso
    textColor = 'text-white';
    title = 'Sucesso';
  } else {
    bgColor = 'bg-red-500'; // Vermelho para erro
    textColor = 'text-white';
    title = 'Erro';
  }

  element.className = `${bgColor} ${textColor} p-4 rounded-lg shadow-lg mb-2 opacity-0 transition-opacity duration-300`;
  element.innerHTML = `<span class="font-bold">${title}:</span> ${message}`;

  container.appendChild(element);

  // Animação de fade-in
  requestAnimationFrame(() => {
    element.classList.remove('opacity-0');
  });

  // Remove a mensagem após 5 segundos com fade-out
  setTimeout(() => {
    element.classList.add('opacity-0');
    setTimeout(() => element.remove(), 300); // Remove após a transição
  }, 5000);
}

// Mantém showError como um atalho para feedback de erro
const showError = (message) => showFeedback(message, 'error');


/**
 * Exibe um modal de confirmação.
 * @param {object} options
 * @param {string} options.title - O título do modal.
 * @param {string} options.messageHtml - O conteúdo HTML da mensagem.
 * @param {string} options.confirmText - O texto do botão de confirmação (ex: "Confirmar").
 * @param {string} options.cancelText - O texto do botão de cancelar (ex: "Cancelar").
 * @param {Function} options.asyncAction - A FUNÇÃO (assíncrona) a ser executada ao confirmar. Deve retornar Promise.
 */
function showConfirmationModal({ title, messageHtml, confirmText, cancelText, asyncAction }) {
  const container = document.getElementById('modal-container');
  if (!container) {
    console.error("Container do modal não encontrado.");
    return;
  }

   // Remove modal anterior, se existir
   const existingModal = document.getElementById('dynamic-confirmation-modal');
   if (existingModal) existingModal.remove();

  const modalElement = document.createElement('div');
  modalElement.id = 'dynamic-confirmation-modal'; // ID único
  modalElement.className = "fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4";
  modalElement.innerHTML = `
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
  `;

  container.appendChild(modalElement); // Adiciona o modal ao container
  container.classList.remove('hidden'); // Mostra o container

  const modalSpinner = modalElement.querySelector('#modal-spinner');
  const modalActions = modalElement.querySelector('#modal-actions');
  const confirmBtn = modalElement.querySelector('#modal-confirm-btn');
  const cancelBtn = modalElement.querySelector('#modal-cancel-btn');

  const closeModal = () => {
    container.classList.add('hidden'); // Esconde o container
    modalElement.remove(); // Remove o modal específico
  };

  cancelBtn.addEventListener('click', closeModal);

  confirmBtn.addEventListener('click', async () => {
    // 1. Mostrar spinner e desativar botões
    if (modalSpinner) modalSpinner.classList.remove('hidden');
    if (modalActions) modalActions.classList.add('hidden');

    try {
      // 2. Executar a ação assíncrona (ex: chamar N8N)
      if (typeof asyncAction === 'function') {
         await asyncAction(); // Espera a Promise resolver
      } else {
         console.warn("asyncAction não é uma função.");
      }

      // 3. Se deu certo, fechar o modal
      closeModal();

    } catch (error) {
      // 4. Se deu erro, esconder o spinner e mostrar botões novamente
      if (modalSpinner) modalSpinner.classList.add('hidden');
      if (modalActions) modalActions.classList.remove('hidden');

      // 5. Mostrar o erro (o modal não fecha)
      console.error("Falha na ação do modal:", error);
      showError(error.message || "Ocorreu um erro desconhecido.");
    }
  });
}


// --- 7. UTILITÁRIOS DE FORMATAÇÃO ---

/**
 * Formata uma data (string ISO ou objeto Date) para dd/mm/aaaa
 * @param {string | Date} dateInput A data
 * @returns {string} A data formatada ou 'Data inválida'
 */
function formatDate(dateInput) {
  if (!dateInput) return "Data inválida"; // Verifica se a entrada é válida

  try {
    const date = new Date(dateInput);
    // Verifica se a data é válida após a conversão
    if (isNaN(date.getTime())) {
        throw new Error("Data inválida após conversão");
    }

    // Adiciona o fuso horário para evitar problemas de "um dia antes"
    // CUIDADO: Isso assume que o input é UTC. Se for local, remover isso.
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);

    // Verifica novamente após correção do fuso horário
    if (isNaN(correctedDate.getTime())) {
       throw new Error("Data inválida após correção de fuso horário");
    }


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
  postApi,
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
  showFeedback, // Exporta o feedback genérico também
  showConfirmationModal,
  // Formato
  formatDate
};