// == Variáveis de controle da UI ===
let isStored = false;
let currentResults = {
    filmes: [],
    series: []
};
let currentFilter = 'movie';
let currentProgram = null;
let currentUser = null;


// === Elementos DOM ===
// header
const searchTab = document.getElementById('tab-pesquisa');
const detailsTab = document.getElementById('tab-detalhes');
const listsTab = document.getElementById('tab-listas');
const profileContainer = document.getElementById('user-container');
// Abas dependentes de login
const loginDependentTabs = ['tab-listas'];
// Seções de abas
const tabPanels = document.querySelectorAll('.tabpanel');

// botoes
const tabButtons = document.querySelectorAll('.tab-btn, .logo-btn, .user-btn');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

// inputs
const searchInput = document.getElementById('search-input');

// pesquisa
const searchButton = document.getElementById('search-button');
const filterButtons = document.querySelectorAll('.filter-btn');
const resultsContainer = document.getElementById('results-container');
const moviesCount = document.getElementById('movies-count');
const seriesCount = document.getElementById('series-count');
const loading = document.getElementById('loading');

// detalhes
const detailsLoading = document.getElementById('details-loading');
const detailsContent = document.getElementById('details-content');
const countrySelect = document.getElementById('country-select');
const providersContainer = document.getElementById('providers-container');
const detailsEmpty = document.getElementById('details-empty');
const detailsType = document.getElementById('details-type');

// listas
const createListButton = document.getElementById('create-list-button');
const createListInput = document.getElementById('create-list-input');


// Inicialização da UI
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    selectTab(searchTab);
    updateUIBasedOnLoginState();
    if (currentProgram === null) {
        hideElement(detailsContent);
    }
});

// === Gerenciamento de abas baseada na sessão de usuario ===
function updateUIBasedOnLoginState() {
    if (isAuthenticated && isStored) {
        // Usuário logado e achado no database: mostra todas as abas e o botão de logout
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        profileContainer.style.display = 'flex';
        logoutBtn.style.display = 'block';
        const profileName = document.getElementById('username');
        profileName.innerHTML = `${userProfile.name || userProfile.nickname || userProfile.email}`;
        const profileImage = document.getElementById('auth-user-icon');
        profileImage.src = userProfile.picture || "https://cdn-icons-png.flaticon.com/128/1144/1144760.png";

        // Mostrar todas as abas que dependem de login
        loginDependentTabs.forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) tab.style.display = 'flex';
        });

        if (currentProgram !== null) {
            loadProgramDetails(currentProgram.tmdb_id, currentProgram.tipo);
        }
        renderLists();

        
        
    } else {
        // Usuário deslogado: mostra apenas pesquisa e detalhes, e botão de login
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        profileContainer.style.display = 'none';
        
        // Esconder abas que dependem de login
        loginDependentTabs.forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) tab.style.display = 'none';
            
            // Se uma aba escondida estiver ativa, mudar para a aba início
            if (tab && tab.getAttribute('aria-selected') === 'true') {
                selectTab(searchTab);
            }
        });
    }
}

// Função para selecionar uma aba
function selectTab(selectedTab) {
    // Selecionar a aba
    tabButtons.forEach(button => {
        const isSelected = button.id === selectedTab.id;
        button.setAttribute('aria-selected', isSelected);
    });
    
    // Esconder outras abas
    tabPanels.forEach(panel => {
        const panelId = panel.id;
        const correspondingTabId = panelId.replace('panel-', 'tab-');
        panel.setAttribute('aria-hidden', correspondingTabId !== selectedTab.id);
    });
};

// Adicionar event listeners para os botões das abas
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const thisTab = this;
        
        // Verificar se o usuário tem permissão para acessar esta aba
        if (!isAuthenticated && loginDependentTabs.includes(thisTab.id)) {
            alert('Faça login para acessar esta funcionalidade.');
            return;
        }
        
        selectTab(thisTab);
    });
});

// Event listener para o botão de login
loginBtn.addEventListener('click', async () => {
    try {
        await auth0Client.loginWithPopup({
            authorizationParams: {
                audience: auth0Config.audience
            }
        });

        isAuthenticated = await auth0Client.isAuthenticated();

        if (isAuthenticated) {
            await updateAuthState();
            usuario = await callProtectedAPI('/usuario', 'GET', {'email': userProfile.email});
            if (usuario === null) {
                openNotificationModal('Erro ao buscar usuario. Tente cadastrar.');
                return;
            }
            isStored = true;
            currentUser = usuario
            openNotificationModal(`Login realizado com sucesso!`)
            updateUIBasedOnLoginState();
        }
    } catch (error) {
        console.error(`Erro durante o login: ${error.message}`);
        openNotificationModal(`Erro durante o login: ${error.message}`);
    } finally {
        // showLoader(false);
    }
});


// Event listener para o botão de signup
signupBtn.addEventListener('click', async function() {
    try {
        await auth0Client.loginWithPopup({
            authorizationParams: {
                audience: auth0Config.audience,
                screen_hint: 'signup'
            }
        });

        isAuthenticated = await auth0Client.isAuthenticated();

        if (isAuthenticated) {
            await updateAuthState();
            // criar usuario no database da API
            nome_usuario = userProfile.name || userProfile.nickname || userProfile.email;
            mensagem = await callProtectedAPI('/usuario', 'POST', {}, {'nome': nome_usuario, 'email': userProfile.email});
            if (mensagem !== null) {
                // isStored = true;
                // updateUIBasedOnLoginState();
                openNotificationModal(`Cadastro realizado com sucesso! Faça login para entrar.`);
            }  else {
                openNotificationModal(`Erro ao realizar o cadastro. Tente fazer login.`);
            }

        }
    } catch (error) {
        console.error(`Erro durante o cadastro: ${error.message}`);
        openNotificationModal(`Erro durante o cadastro: ${error.message}`);
    }
});


// Event listener para o botão de logout
logoutBtn.addEventListener('click', async () => {
    try {
        const result = await openConfirmationModal('Deseja realmente fazer logout?');
        if (result) {
            await auth0Client.logout({
                logoutParams: {
                    returnTo: window.location.origin
                }
            });
            isAuthenticated = false;
            isStored = false;
            updateUIBasedOnLoginState();
            // TODO: BUG, fechamento abrupto por updateUIBasedOnLoginState()
            // openNotificationModal('Logout realizado com sucesso!', 500); 
        } else {
            openNotificationModal('Logout cancelado.');
        }

    } catch (error) {
        console.error(`Erro durante o logout: ${error.message}`);
        openNotificationModal(`Erro durante o logout: ${error.message}`);
    }
});
// === Fim do Gerenciamento de abas ===

// === Eventos de elementos estaticos ===
function setupEventListeners() {
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveFilter(button.dataset.filter);
        });
    });
    
    countrySelect.addEventListener('change', updateProvidersDisplay);

    createListButton.addEventListener('click', createList);
    createListInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createList();
    });
}

// == Funcionalidade de busca ===
async function handleSearch() {
    const searchQuery = searchInput.value.trim();
    if (!searchQuery) {
        openNotificationModal('Campo de busca vazio!');
        return;
    };
    // Limpar resultados anteriores e mostrar loading
    resultsContainer.innerHTML = '';
    showElement(loading);
    
    const data = await callAPI('/search', {'nome': searchQuery});
    if (data === null) {
        hideElement(loading);
        console.error('Erro na busca:');
        openNotificationModal(`Erro na busca, tente novamente.`);
        return;
    } 
    currentResults = data;
    moviesCount.textContent = currentResults.numero_filmes;
    seriesCount.textContent = currentResults.numero_series;
    hideElement(loading);
    filterAndRenderResults();
}

function filterAndRenderResults() {
    resultsContainer.innerHTML = '';
    let results = [];

    if (currentFilter === 'movie') {
        results = results.concat(currentResults.filmes);
    }
    if (currentFilter === 'tv') {
        results = results.concat(currentResults.series);
    }
    if (results.length === 0) {
        openNotificationModal('Nenhum resultado encontrado.');
        return;
    }
    
    results.forEach(item => {
        resultsContainer.appendChild(createResultCard(item));
    });
}

function createResultCard(item) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.dataset.id = item.tmdb_id;
    card.dataset.type = item.tipo;
    let posterHtml;
    if (item.url_poster) {
        posterHtml = `<img src="https://image.tmdb.org/t/p/w342${item.url_poster}" alt="${item.titulo}" class="card-poster">`;
    } else {
        posterHtml = `<div class="no-poster"><i class="fas fa-image"></i></div>`;
    }
    
    const typeLabel = item.tipo === 'movie' ? 'Filme' : 'Série';
    const typeClass = item.tipo === 'movie' ? 'movie-type' : 'tv-type';
    
    let releaseDate = 'Data desconhecida';
    if (item.lancamento) {
        const date = new Date(item.lancamento);
        releaseDate = date.toLocaleDateString('pt-BR');
    }
    
    card.innerHTML = `
        ${posterHtml}
        <div class="card-info">
            <span class="card-type ${typeClass}">${typeLabel}</span>
            <h3 class="card-title">${item.titulo}</h3>
            <p class="card-date">${releaseDate}</p>
            <p class="card-overview">${item.resumo || 'Nenhuma descrição disponível.'}</p>
        </div>
    `;
    
    card.addEventListener('click', () => {
        loadProgramDetails(item.tmdb_id, item.tipo);
    });
    
    return card;
}

// === Funcionalidade de detalhes ===
async function loadProgramDetails(tmdbId, type) {
    selectTab(detailsTab);
    hideElement(detailsEmpty);
    hideElement(detailsContent);
    showElement(detailsLoading);
    
    const data = await callAPI('/details', {'tmdb_id': tmdbId, 'tipo': type});
    if (data === null) {
        hideElement(detailsLoading);
        console.error('Erro na busca:');
        openNotificationModal(`Erro na busca de detalhes, tente novamente.`);
        return;
    }

    currentProgram = data;
        
    // Elementos de detalhes
    document.getElementById('details-title').textContent = data.titulo;
    document.getElementById('details-original-title').textContent = data.titulo_original;
    
    const releaseDate = data.lancamento ? new Date(data.lancamento).toLocaleDateString('pt-BR') : 'Data desconhecida';
    document.getElementById('details-release-date').textContent = `Lançamento: ${releaseDate}`;
    
    const typeLabel = data.tipo === 'movie' ? 'Filme' : 'Série';
    const typeClass = data.tipo === 'movie' ? 'movie-type' : 'tv-type';

    detailsType.innerHTML = `<span class="card-type ${typeClass} details-type">${typeLabel}</span>`;
    // document.getElementById('details-media-type').textContent = `Tipo: ${mediaType}`;
    
    // Duração ou número de temporadas
    let durationText = '';
    if (data.tipo === 'movie') {
        durationText = `Duração: ${data.duracao}`;
    } else {
        durationText = `Temporadas: ${data.duracao}`;
    }
    document.getElementById('details-runtime').textContent = `${durationText}`;
    
    // Pôster
    const posterElem = document.getElementById('details-poster');
    if (data.url_poster) {
        posterElem.src = data.url_poster;
        posterElem.alt = data.titulo;
    } else {
        // placeholder poster
        posterElem.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iI2RiZGJkYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMjI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMThweCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2VtIHDDtHN0ZXI8L3RleHQ+PC9zdmc+';
        posterElem.alt = 'Sem pôster';
    }
    
    if (currentUser !== null) {
        createListSelector(currentProgram, currentUser.listas);
    } else {
        const listsSelector = document.getElementById('list-adder');
        listsSelector.innerHTML = '<div class="no-lists">Faça login para adicionar a suas listas.</div>';

    }
    

    // Gêneros
    const genresContainer = document.getElementById('details-genres');
    genresContainer.innerHTML = '';
    if (data.generos && data.generos.length > 0) {
        data.generos.forEach(genre => {
            const genreTag = document.createElement('span');
            genreTag.className = 'genre-tag';
            genreTag.textContent = genre;
            genresContainer.appendChild(genreTag);
        });
    } else {
        genresContainer.innerHTML = '<span class="no-genres">Sem informações de gênero</span>';
    }
    
    // Tagline e resumo
    const taglineElem = document.getElementById('details-tagline');
    taglineElem.textContent = data.tagline || '';
    
    document.getElementById('details-overview').textContent = data.resumo || 'Nenhuma descrição disponível.';
    
    // Configurar seletor de países para provedores
    setupCountrySelector(data.provedores_mundiais);
    hideElement(detailsLoading);
    showElement(detailsContent);
}


// seletor de listas
function createListSelector(program, userLists) {
    const listsSelector = document.getElementById('list-adder');
    listsSelector.innerHTML = '';

    const movieInLists = [];
    if (userLists) {
        userLists.forEach(list => {
            const found = list.programas && list.programas.some(prog => 
                prog.tmdb_id === program.tmdb_id && prog.tipo === program.tipo
            );
            if (found) {
                movieInLists.push(list);
            }
        });
    }
    // Preparar as opções do dropdown
    const dropdownOptions = userLists.map(list => {
        const isInList = movieInLists.some(l => l.id === list.id);
        return `<option value="${list.id}" ${isInList ? 'class="in-list"' : ''}>${list.nome}${isInList ? ' ✓' : ''}</option>`;
    }).join('');
    
    listsSelector.innerHTML = `
        <select id="list-selector">
            <option value="">Escolha uma lista</option>
            ${dropdownOptions}
        </select>
        <button class="add-to-list-btn" onclick="addToList(${program.tmdb_id}, '${program.tipo}', '${program.titulo}', '${program.lancamento}', '${program.url_poster}')">Adicionar</button>
    `;
}


// Função para adicionar filme a uma lista
async function addToList(tmdb_id, tipo, titulo, lancamento, url_poster) {
    const select = document.getElementById('list-selector');
    const listId = parseInt(select.value);
    
    if (!listId) {
        openNotificationModal('Por favor, selecione uma lista');
        return;
    }
    console.log('selected list:', select.value);
    if (select.className === 'in-list') {
        openNotificationModal('O filme já esta na lista selecionada.');
        return;
    }

    mensagem = await callProtectedAPI('/programa-lista', 'POST', {}, {
        id_lista: listId,
        tmdb_id: tmdb_id,
        tipo: tipo,
        titulo: titulo,
        lancamento: lancamento,
        url_poster: url_poster
    })
    if (mensagem === null) {
        openNotificationModal('Filme já associado, selecione outra lista.');
        return;
    }
    
    reload = await reloadUser();
    if (!reload) {
        return;
    }
    renderLists();
    loadProgramDetails(currentProgram.tmdb_id, currentProgram.tipo);
    openNotificationModal('Filme adicionado à lista com sucesso!');
}

// Recarregamento de dados do usuário
async function reloadUser() {    
    usuario = await callProtectedAPI('/usuario', 'GET', {'email': userProfile.email});
    if (usuario === null) {
        openNotificationModal('Erro ao recarregar informações do usuario.');
        return false;
    }
    currentUser = usuario;
    return true
}


function setupCountrySelector(providers) {
    countrySelect.innerHTML = '';
    const countries = Object.keys(providers);
    let inBR = false
    if (countries.length === 0) {
        countrySelect.innerHTML = '<option value="">Sem países disponíveis</option>';
        providersContainer.innerHTML = '<p class="no-providers">Nenhum provedor disponível.</p>';
        return;
    }
    
    // Sigla para nomes do país em pt-BR
    const regionNames = new Intl.DisplayNames(['br'], { type: 'region' });
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        // Selecão padrão do Brasil (se disponível)
        if (country === 'BR') {
            option.selected = true;
            inBR = true
        }
        option.textContent = regionNames.of(country);
        countrySelect.appendChild(option);
    });
    
    if (!inBR) {
        // Brasil indisponível
        countrySelect.innerHTML += '<option value="BR">Brasil</option>';
        countrySelect.value = 'BR';
        providersContainer.innerHTML = '<p class="no-providers">Nenhum provedor disponível no Brasil.</p>';
    }
    
    updateProvidersDisplay();
}

function updateProvidersDisplay() {
    const selectedCountry = countrySelect.value;
    providersContainer.innerHTML = '';
    
    if (!currentProgram || !currentProgram.provedores_mundiais || !currentProgram.provedores_mundiais[selectedCountry] || currentProgram.provedores_mundiais[selectedCountry].length === 0) {
        providersContainer.innerHTML = '<p class="no-providers">Nenhum provedor disponível para este país.</p>';
        return;
    }
    const providers = currentProgram.provedores_mundiais[selectedCountry];
    providers.forEach(provider => {
        const providerCard = document.createElement('div');
        providerCard.className = 'provider-card';
        let logoHtml;
        if (provider.url_logo) {
            logoHtml = `<img src="${provider.url_logo}" alt="${provider.nome}" class="provider-logo" title="${provider.nome}">`;
        } else {
            logoHtml = `<div class="provider-logo no-logo">${provider.nome.charAt(0)}</div>`;
        }
        providerCard.innerHTML = `${logoHtml}`;
        providersContainer.appendChild(providerCard);
    });
}


// === Funcionalidades de listas ===
async function createList() {
    const listName = createListInput.value.trim();
    if (!listName) {
        openNotificationModal('Por favor, insira um nome para a nova lista.');
        return;
    }
    createListInput.value = '';
    const userId = currentUser.id;
    const response = await callProtectedAPI('/lista', 'POST', {}, {nome: listName, usuario_id: userId});
    if (response === null) {
        openNotificationModal('Erro ao criar nova lista.');
        return;
    }
    openNotificationModal('Lista criada com sucesso!');

    reload = await reloadUser();
    if (!reload) {
        return;
    }
    if (currentProgram !== null) {
        loadProgramDetails(currentProgram.tmdb_id, currentProgram.tipo);
        selectTab(listsTab);
    }
    renderLists();
}


// Função para renderizar as listas
function renderLists() {
    const listsContainer = document.getElementById('listsContainer');
    listsContainer.innerHTML = '';
    const userLists = currentUser.listas;
    if (!userLists || userLists.length === 0) {
        listsContainer.innerHTML = '<p class="empty-list">Nenhuma lista encontrada.</p>';
        return;
    }
    
    userLists.forEach(list => {
        const listElement = document.createElement('div');
        listElement.className = 'list';
        const programsList = list.programas || [];
        let programsHtml = '';
        
        if (programsList.length === 0) {
            programsHtml = '<p class="empty-list">Nenhum programa adicionado ainda.</p>';
        } else {
            programsList.forEach(program => {
                programsHtml += `${createListCard(program, list.id)}`;
            });
        }
        listElement.innerHTML = `
            <div class="list-header">
                <h2 onclick="toggleList(${list.id})">
                    <span class="collapse-icon">▶</span>
                    ${list.nome}
                    <span class="list-count">${programsList.length}</span>
                </h2>
                <div class="list-actions">
                    <button class="edit-list-btn" title="Editar nome da lista" onclick="editList(${list.id}, '${list.nome}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-list-btn" title="Deletar lista" onclick="deleteList(${list.id})">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </div>
            <div class="list-content" id="list-content-${list.id}">
                ${programsHtml}
            </div>
        `;
        
        listsContainer.appendChild(listElement);
    });
    
    // Primeiro lista expandida
    userLists.forEach((list, index) => {
        const isExpanded = index === 0; 
        toggleList(list.id, isExpanded);
    });
}

function createListCard(program, listId) {
    let posterHtml;
    if (program.url_poster) {
        posterHtml = `<img src="https://image.tmdb.org/t/p/w342${program.url_poster}" alt="${program.titulo}" class="card-poster">`;
    } else {
        posterHtml = `<div class="no-poster"><i class="fas fa-image"></i></div>`;
    }
    const typeLabel = program.tipo === 'movie' ? 'Filme' : 'Série';
    const typeClass = program.tipo === 'movie' ? 'movie-type' : 'tv-type';
    let releaseDate = 'Data desconhecida';
    if (program.lancamento) {
        const date = new Date(program.lancamento);
        releaseDate = date.toLocaleDateString('pt-BR');
    }

    return `
        <div class="list-card">
            ${posterHtml}
            <div class="remove-btn" title="Excluir programa" onclick="removeFromList(${listId}, ${program.id})">
                <i class="fa-regular fa-trash-can"></i>
            </div>
            <div class="card-info">
                <div class="list-info-type">
                    <span class="card-type ${typeClass}">${typeLabel}</span>
                    <span class="info-btn" title="Detalhes do programa" onclick="loadProgramDetails(${program.tmdb_id}, '${program.tipo}')">
                        <i class="fa-solid fa-circle-info"></i>
                    </span>
                </div>
                <h3 class="card-title">${program.titulo}</h3>
                <p class="card-date">${releaseDate}</p>
            </div>
        </div>
    `;
}

// Função para alternar a visibilidade de uma lista
function toggleList(listId, forceState) {
    const contentElement = document.getElementById(`list-content-${listId}`);
    const headerElement = contentElement.previousElementSibling;
    const iconElement = headerElement.querySelector('.collapse-icon');
    
    if (forceState !== undefined) {
        if (forceState) {
            contentElement.classList.add('expanded');
            iconElement.classList.add('rotate');
        } else {
            contentElement.classList.remove('expanded');
            iconElement.classList.remove('rotate');
        }
    } else {
        contentElement.classList.toggle('expanded');
        iconElement.classList.toggle('rotate');
    }
}

// Função para editar o nome de uma lista
async function editList(listId, nomeAtual) {
    const novoNome = await openUpdateModal('Escreva o novo nome da lista', nomeAtual);
    if (novoNome === null) {
        return;
    }
    
    mensagem = await callProtectedAPI('/lista', 'PUT', {}, {
        id: listId,
        novo_nome: novoNome
    });
    if (mensagem === null) {
        openNotificationModal('Erro ao editar lista.');
        return;
    }
    
    openNotificationModal('Lista editada com sucesso!');
    reload = await reloadUser();
    if (!reload) {
        return;
    }
    if (currentProgram !== null) {
        loadProgramDetails(currentProgram.tmdb_id, currentProgram.tipo);
        selectTab(listsTab);
    }
    renderLists();
}

// Função para excluir uma lista
async function deleteList(listId) {
    const result = await openConfirmationModal('Tem certeza que deseja excluir esta lista?');
    if (!result) {
        return;
    }
    
    mensagem = await callProtectedAPI('/lista', 'DELETE', {
        id: listId
    });
    if (mensagem === null) {
        openNotificationModal('Erro ao excluir lista.');
        return;
    }
    
    openNotificationModal('Lista excluida com sucesso!');
    reload = await reloadUser();
    if (!reload) {
        return;
    }
    if (currentProgram !== null) {
        loadProgramDetails(currentProgram.tmdb_id, currentProgram.tipo);
        selectTab(listsTab);
    }
    renderLists();
}


// Função para remover filme de uma lista
async function removeFromList(listId, programId) {
    const result = await openConfirmationModal('Tem certeza que deseja remover este filme da lista?');
    if (!result) {
        return;
    }
    
    mensagem = await callProtectedAPI('/programa-lista', 'DELETE', {
        id_lista: listId,
        id_programa: programId
    });
    if (mensagem === null) {
        openNotificationModal('Erro: filme ja removido da lista.');
        return;
    }
    
    openNotificationModal('Filme removido da lista com sucesso!');
    reload = await reloadUser();
    if (!reload) {
        return;
    }
    renderLists();
    if (currentProgram.id === programId) {
        loadProgramDetails(currentProgram.tmdb_id, currentProgram.tipo);
        selectTab(listsTab);
    }
}


// === Seletores dos elementos dos modais ===
const notificationOverlay = document.querySelector('.notification-overlay');
const timerBar = document.querySelector('.notification-timer');
const acceptButton = document.querySelector('.btn-accept');

const confirmationOverlay = document.querySelector('.confirmation-overlay');
const confirmButton = document.querySelector('.btn-confirm');
const cancelButton = document.querySelector('.btn-cancel');

const updateOverlay = document.querySelector('.update-overlay');
const updateInput = document.getElementById('update-input');
const errorMessage = document.getElementById('errorMessage');
const editConfirmButton = document.querySelector('.btn-edit-confirm');
const editCancelButton = document.querySelector('.btn-edit-cancel');

let notificationTimer; // Para armazenar o ID do timeout

// Função para abrir modal de notificação
function openNotificationModal(message, ms_duration = 4000) {
    document.getElementById('notification-message').textContent = message;
	notificationOverlay.classList.add('active');
	
	// Animar a barra de tempo
	timerBar.style.transition = `transform ${parseInt(ms_duration/1000)}s linear`;
	timerBar.style.transform = 'scaleX(0)';
	
	// Fechar automaticamente
	notificationTimer = setTimeout(() => {
		closeModal(notificationOverlay);
	}, ms_duration);

    // OK do modal de notificação
    acceptButton.onclick = function() {
        closeModal(notificationOverlay);
    };
}


// Função para abrir modal de confirmação
function openConfirmationModal(message) {
    // Retornar uma Promise que será resolvida quando o usuário tomar uma decisão
    return new Promise((resolve) => {
        // confirmationResolve = resolve;

        document.getElementById('confirmation-message').textContent = message;
        confirmationOverlay.classList.add('active');
        // Previne o scroll quando o modal está aberto
        document.body.style.overflow = 'hidden';
    
        confirmButton.onclick = function() {
            closeModal(confirmationOverlay);
            resolve(true);
        };
    
        cancelButton.onclick = function() {
            closeModal(confirmationOverlay);
            resolve(false);
        };
    });
}


// Função para abrir modal de edição
function openUpdateModal(message, valorAtual) {
    return new Promise((resolve) => {
        // confirmationResolve = resolve;

        document.getElementById('update-message').textContent = message;
        let novoValor;
        updateInput.value = valorAtual;
        errorMessage.style.display = 'none';
        updateOverlay.classList.add('active');
        // Previne o scroll quando o modal está aberto
        document.body.style.overflow = 'hidden';

        const validateEdit = () => {
            novoValor = updateInput.value.trim();
            if (novoValor === valorAtual.toString()) {
                errorMessage.style.display = 'block';
                return;
            }
            closeModal(updateOverlay);
            resolve(novoValor);
        };
        editConfirmButton.onclick = validateEdit;
        // Verificar Enter
        updateInput.onkeydown = (event) => {
            if (event.key === 'Enter') {
                validateEdit();
            }
        };
        
        editCancelButton.onclick = () => {
            closeModal(updateOverlay);
            resolve(null);
        };
    })
}


function closeModal(overlay) {
    overlay.classList.remove('active');
    
    // Se for o modal de notificação, resetar o timer
    if (overlay === notificationOverlay) {
        clearTimeout(notificationTimer);
        timerBar.style.transition = 'none';
        timerBar.style.transform = 'scaleX(1)';
    } else {
        // Restaura o scroll na página (apenas para o modal de confirmação)
        document.body.style.overflow = 'auto';
    }
}


// ===== Funções utilitárias =====
function setActiveFilter(filter) {
    currentFilter = filter;
    // Atualizar classes dos botões
    filterButtons.forEach(button => {
        if (button.dataset.filter === filter) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    if (currentResults.filmes.length === 0 && currentResults.series.length === 0) {
        return;
    }
    
    filterAndRenderResults();
}

function showElement(element) {
    element.style.display = 'flex';
}

function hideElement(element) {
    element.style.display = 'none';
}


// TODO: verificar se e possivel recarregar list selector sem recarregar a pagina de detalhes
// TODO: Extra - Adicionar created_by nas series e production_companies nos filmes