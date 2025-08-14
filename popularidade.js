// ================= FUNÇÕES DE TOKEN =================
function salvarToken(token) {
    localStorage.setItem('jwt', token);
}

function obterToken() {
    return localStorage.getItem('jwt');
}

function removerToken() {
    localStorage.clear();
}

// ================= FUNÇÕES DE AUTENTICAÇÃO =================
function verificarAutenticacao() {
    const token = obterToken();
    if (!token || token === "undefined" || token === null) {
        removerToken();
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ================= LOGOUT =================
$(document).on('click', '#logoutBtn', function () {
    removerToken();
    window.location.href = 'login.html';
});

// ================= ADICIONAR ANIME NA TABELA =================
function adicionarAnimeNaTabela(anime) {
    // Certifique-se de que está selecionando o tbody correto.
    // Se o seu tbody tem o ID `animeTableBody` (como nos exemplos anteriores), use `#animeTableBody`.
    // Se for o tbody dentro de uma tabela com ID `animeTable`, use `#animeTable tbody`.
    const tableBody = $("#animeTableBody"); // OU $("#animeTable tbody");

    const capa = anime.cover_image ?
        `http://127.0.0.1:8000/${anime.cover_image}` :
        "https://via.placeholder.com/60x90?text=Sem+Capa";

    const generosFormatados = anime.generos ?
        anime.generos.split(',').map(g => `<span class="genre-tag">${g.trim()}</span>`).join(' ') :
        'N/A';

    const linha = `
        <tr data-id="${anime.id}">
            <td><img src="${capa}" alt="Capa do Anime" class="anime-cover"></td>
            <td>${anime.nome || "-"}</td>
            <td>${anime.nota !== null ? anime.nota.toFixed(1) : "N/A"}</td>
            <td>${anime.popularidade !== null ? anime.popularidade : "N/A"}</td>
            <td>${anime.ano_lancamento || "N/A"}</td>
            <td>${generosFormatados}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${anime.id}" title="Editar Anime"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${anime.id}" title="Excluir Anime"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `;
    tableBody.append(linha);
}

// ================= ATUALIZAR TABELA =================
function atualizarTabela(animes) {
    const tbody = $('#animeTableBody'); // OU $("#animeTable tbody");
    tbody.empty(); // Limpa a tabela

    if (animes.length === 0) {
        tbody.append('<tr><td colspan="7">Nenhum anime encontrado com este critério.</td></tr>');
        return;
    }

    animes.forEach(anime => {
        adicionarAnimeNaTabela(anime);
    });
}

// ================= CARREGAR E FILTRAR ANIMES (UNIFICADO) =================
// Esta função agora será responsável por:
// 1. Buscar TODOS os animes da API (ou com filtro de pesquisa se houver).
// 2. Aplicar o filtro de popularidade MÍNIMA e MÁXIMA no CLIENTE (JavaScript).
// 3. Atualizar a tabela.
function loadAnimes() {
    const token = obterToken();
    const searchTerm = $('#searchInput').val();
    const popuMin = parseFloat($('#popuMin').val());
    const popuMax = parseFloat($('#popuMax').val());

    let apiUrl = "http://127.0.0.1:8000/api/animes"; // Sempre busca todos os animes da rota principal

    // Adiciona o termo de pesquisa se houver
    if (searchTerm) {
        apiUrl += `?search=${encodeURIComponent(searchTerm)}`;
    }

    console.log("Requisição API:", apiUrl); // Para depuração
    $.ajax({
        url: apiUrl,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        success: function (animes) {
            let animesFiltrados = animes;

            // Aplica o filtro de popularidade mínima no CLIENTE
            if (!isNaN(popuMin)) {
                animesFiltrados = animesFiltrados.filter(anime => 
                    anime.popularidade !== null && anime.popularidade >= popuMin
                );
                console.log(`Filtrando por popularidade mínima >= ${popuMin}. Animes após filtro: ${animesFiltrados.length}`);
            }

            // Aplica o filtro de popularidade máxima no CLIENTE
            if (!isNaN(popuMax)) {
                animesFiltrados = animesFiltrados.filter(anime => 
                    anime.popularidade !== null && anime.popularidade <= popuMax
                );
                console.log(`Filtrando por popularidade máxima <= ${popuMax}. Animes após filtro: ${animesFiltrados.length}`);
            }

            // Ordena os animes resultantes por popularidade (descendente) no CLIENTE
            animesFiltrados.sort((a, b) => (b.popularidade || 0) - (a.popularidade || 0));
            
            atualizarTabela(animesFiltrados);
        },
        error: function (xhr) {
            console.error("Erro ao carregar ou filtrar animes:", xhr);
            if (xhr.status === 401 || xhr.status === 403) {
                removerToken();
                window.location.href = 'login.html';
            } else {
                alert(xhr.responseJSON ? xhr.responseJSON.message : 'Erro ao carregar animes.');
            }
        }
    });
}

// ================= INICIALIZAÇÃO E EVENTOS =================
$(document).ready(function () {
    if (!verificarAutenticacao()) return;

    atualizarInformacoesUsuario();

    // Remove as referências ao 'animeForm' e 'imagePreview' se eles não existirem nesta página
    // Eles parecem ser de um contexto de adicionar/editar, não de listagem/filtro.

    // Carrega e filtra os animes ao iniciar a página (aplicando filtros se já estiverem preenchidos)
    loadAnimes();

    // Evento para a barra de pesquisa
    let searchTimeout;
    $('#searchInput').on('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadAnimes, 300); // Chama loadAnimes
    });

    // Evento para o formulário de filtro de popularidade
    $('#popularityFilterForm').on('submit', function(e) {
        e.preventDefault(); // Impede o envio padrão do formulário
        loadAnimes(); // Chama loadAnimes para aplicar os filtros de popularidade
    });

    // Evento para o botão de editar (delegação de evento)
    $(document).on('click', '.edit-btn', function() {
        const animeId = $(this).data('id');
        window.location.href = `editar_anime.html?id=${animeId}`;
    });

    // Evento para o botão de excluir (delegação de evento)
    $(document).on('click', '.delete-btn', function() {
        const animeId = $(this).data('id');
        if (confirm(`Tem certeza que deseja excluir o anime com ID: ${animeId}?`)) {
            const token = obterToken();
            $.ajax({
                url: `http://127.0.0.1:8000/api/animes/${animeId}`,
                type: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                success: function(response) {
                    alert(response.message || 'Anime excluído com sucesso!');
                    loadAnimes(); // Recarrega a lista após a exclusão com os filtros atuais
                },
                error: function(xhr) {
                    console.error("Erro ao excluir anime:", xhr);
                    alert(xhr.responseJSON ? xhr.responseJSON.message : 'Erro ao excluir o anime.');
                    if (xhr.status === 401 || xhr.status === 403) {
                        removerToken();
                        window.location.href = 'login.html';
                    }
                }
            });
        }
    });

    // Botão para limpar os filtros
    // Certifique-se de ter um botão com id="clearFiltersBtn" no seu HTML
    $('#clearFiltersBtn').on('click', function() {
        $('#popuMin').val('');
        $('#popuMax').val('');
        $('#searchInput').val('');
        loadAnimes(); // Recarrega com os inputs de filtro agora vazios
    });
});

// ================= ATUALIZAR INFORMAÇÕES DO USUÁRIO =================
function atualizarInformacoesUsuario() {
    const token = obterToken();
    if (!token) return;

    $.ajax({
        url: "http://127.0.0.1:8000/api/user",
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        success: function(userData) {
            $('#userName').text(userData.name || 'Usuário');
            $('#userEmail').text(userData.email || 'Bem-vindo');
            if (userData.avatar) {
                $('#userAvatar').html(`<img src="http://127.0.0.1:8000/${userData.avatar}" alt="Avatar do Usuário" class="avatar-img">`);
            } else {
                $('#userAvatar').text(userData.name ? userData.name.charAt(0).toUpperCase() : 'U');
            }
        },
        error: function(xhr) {
            console.error("Erro ao obter dados do usuário:", xhr);
            if (xhr.status === 401 || xhr.status === 403) {
                removerToken();
                window.location.href = 'login.html';
            }
        }
    });
}