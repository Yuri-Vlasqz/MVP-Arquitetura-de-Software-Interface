// === Variáveis de controle da autenticação ===
let auth0Config = {};
let auth0Client = null;
let isAuthenticated = false;
let accessToken = '';
let userProfile = null;

// === Variável de acesso a API ===
let API_BASE_URL = '';
initAPIBaseURL();
// inicializar a url base da API
async function initAPIBaseURL() {
    fetch('/config')
    .then(response => response.json())
    .then(data => {
        API_BASE_URL = data.api_base_url + '/api';
        // console.log('API no endereço:', data.api_base_url);
    })
    .catch(error => console.error("Erro ao carregar url da API:", error));
} 


// Inicializar o SDK do Auth0
async function initAuth0() {
    fetch('/config')
    .then(response => response.json())
    .then(async data => {
        auth0Config = {
            domain: data.domain,
            clientId: data.clientId,
            audience: data.audience,
            cacheLocation: 'localstorage'
        }

        try {
        auth0Client = await auth0.createAuth0Client({
            domain: auth0Config.domain,
            clientId: auth0Config.clientId,
            authorizationParams: {
                audience: auth0Config.audience,
                redirect_uri: window.location.origin,
                scope: 'openid profile email'
            },
            cacheLocation: auth0Config.cacheLocation
        });

        // Verificar se o usuário foi redirecionado após o login
        if (window.location.search.includes('code=') &&
            window.location.search.includes('state=')) {

            // Processar o resultado da autenticação
            await auth0Client.handleRedirectCallback();

            // Limpar a URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Verificar se o usuário já está autenticado
        isAuthenticated = await auth0Client.isAuthenticated();

        if (isAuthenticated) {
            await updateAuthState();
        }
    } catch (error) {
        console.error(`Erro ao inicializar Auth0: ${error.message}`, true);
    }
    })
    .catch(error => console.error("Erro ao carregar /config:", error));
}

// Atualizar o estado de autenticação
async function updateAuthState() {
    if (isAuthenticated) {
        try {
            // Obter o token de acesso
            accessToken = await auth0Client.getTokenSilently({
                audience: auth0Config.audience
            });

            // Obter o perfil do usuário
            userProfile = await auth0Client.getUser();

        } catch (error) {
            console.error(`Erro ao obter informações do usuário: ${error.message}`);
        }
    }
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', initAuth0);

/**
 * Função para chamar endpoints protegidas da API .
 * @param {string} apiRoute - rota da API ('/usuarios', '/listas', etc.)
 * @param {string} apiMethod - metodo da rota ('GET', 'POST', 'PUT', 'DELETE')
 * @param {Object} params - Opcional: parametros da URL
 * @param {Object} body - Opcional: corpo de requisição para metodos POST/PUT.
 * @returns {Promise} - Promessa da resposta da API
 */
async function callProtectedAPI(apiRoute, apiMethod, params = null, body = null) {
    if (!accessToken) {
        // console.log('Você precisa fazer login primeiro!');
        return null;
    }
    const url = new URL(`${API_BASE_URL}${apiRoute}`);
    const options = {
        method: apiMethod.toUpperCase(),
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
    };

    // Query da requisição para GET/DELETE
    if (params !== null && ['GET', 'DELETE'].includes(options.method)) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }
    // Corpo da requisição para POST/PUT
    if (body !== null && ['POST', 'PUT'].includes(options.method)) {
        const formData = new FormData();
        Object.entries(body).forEach(([key, value]) => {
            formData.append(key, value);
        });
        options.body = formData;
    }

    try {
        console.log('Enviando requisição para a API protegida...');
        const response = await fetch(url, options);
        const data = await response.json();
    
        if (!response.ok) {
            throw new Error(data.mensagem || 'Erro ao chamar a API protegida');
        }
    
        // console.log(`Resposta da API: ${response.status}`, data);  
        return data;

    } catch (error) {
        console.error(`Erro: ${error.message}`);
        return null;
    }
}


/**
 * Função para chamar endpoints publicas da API, (somente metodos GET).
 * @param {string} apiRoute - rota da API ('/search' e '/details')
 * @param {Object} apiParams - parametros da URL
 * @returns {Promise} - Promessa da resposta da API
 */
async function callAPI(apiRoute, apiParams = null) {
    const url = new URL(`${API_BASE_URL}${apiRoute}`);
    if (apiParams !== null) {
        Object.entries(apiParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }

    try {
        console.log('Enviando requisição para a API...');
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao chamar a API');
        }
    
        // console.log(`Resposta da API: ${response.status}`, data);
        return data;

    } catch (error) {
        console.error(`Erro: ${error.message}`);
        return null;
    }
}