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

// ================== PERFIL + CARREGAR ANIMES =================
$(document).ready(function () {
  if (!verificarAutenticacao()) return;

  atualizarInformacoesUsuario();
  carregarAnimes(); // <<< CHAMADA IMPORTANTE
});

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
    success: function (userData) {
      $('#userName').text(userData.name || 'Usuário');
      $('#userEmail').text(userData.email || 'Bem-vindo');
      $('#userAvatar').text(userData.name ? userData.name.charAt(0).toUpperCase() : 'U');
    },
    error: function (xhr) {
      console.error("Erro ao obter dados do usuário:", xhr);
    }
  });
}

function carregarAnimes() {
  const token = obterToken();

  $.ajax({
    url: "http://127.0.0.1:8000/api/animes",
    type: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    success: function (response) {
      exibirAnimes(response); // <<< usa a função que limpa e adiciona
    },
    error: function (xhr) {
      console.error("Erro ao carregar animes:", xhr);
      if (xhr.status === 401) {
        removerToken();
        window.location.href = 'login.html';
      } else {
        alert(xhr.responseJSON?.message || "Erro ao carregar lista de animes.");
      }
    }
  });
}

// ================== FUNÇÃO EXIBIR ANIMES =================
function exibirAnimes(lista) {
  const tableBody = $("#animeTable tbody");
  tableBody.empty(); // limpa a tabela

  lista.forEach(anime => {
    adicionarAnimeNaTabela(anime);
  });
}

// ================== FILTRO DE NOTA (INTERVALO) =================
function aplicarFiltroNota() {
  if (!verificarAutenticacao()) return;

  const notaMin = parseFloat($('#notaMin').val());
  const notaMax = parseFloat($('#notaMax').val());
  const token = obterToken();

  let url = `http://127.0.0.1:8000/api/animes`;
  const params = [];

  if (!isNaN(notaMin)) {
    params.push(`nota_min=${notaMin}`);
  }

  if (!isNaN(notaMax)) {
    params.push(`nota_max=${notaMax}`);
  }

  if (params.length > 0) {
    url += '?' + params.join('&');
  }

  $.ajax({
    url: url,
    type: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    success: function (response) {
      exibirAnimes(response);
    },
    error: function (xhr) {
      console.error("Erro ao filtrar por nota:", xhr.responseText);
      if (xhr.status === 401) {
        removerToken();
        window.location.href = 'login.html';
      }
    }
  });
}

function filtrarPorNotaMaiorParaMenor() {
  if (!verificarAutenticacao()) return;

  const token = obterToken();

  $.ajax({
    url: `http://127.0.0.1:8000/api/animes?ordenar_por=nota&ordenar_direcao=desc`,
    type: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    success: function (response) {
      exibirAnimes(response);
    },
    error: function (xhr) {
      console.error("Erro ao ordenar animes por nota:", xhr.responseText);
    }
  });
}


// ================= ADICIONAR ANIME NA TABELA (Função Unificada e Corrigida) =================
function adicionarAnimeNaTabela(anime) {
    const tableBody = $("#animeTable tbody");

    // Construção do caminho da capa:
    // Se anime.cover_image existir, use a URL completa da API para a imagem.
    // Caso contrário, use a imagem placeholder.
    const capa = anime.cover_image ?
        `http://127.0.0.1:8000/${anime.cover_image}` :
        "https://via.placeholder.com/60x90?text=Sem+Capa";

    // Formata os gêneros com a classe 'genre-tag' para estilização consistente
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

$(document).ready(function() {
        // Evento para checkboxes de gênero
        // Quando qualquer checkbox com a classe 'genre-checkbox' muda, recarrega os animes
        $('.genre-checkbox').on('change', function() {
            loadAnimes();
        });

        // Evento para a barra de pesquisa
        // Use debounce para evitar muitas requisições AJAX
        let searchTimeout;
        $('#searchInput').on('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(loadAnimes, 300); // Espera 300ms após a última digitação
        });

        // Evento para o botão de editar (delegação de evento)
        $(document).on('click', '.edit-btn', function() {
            const animeId = $(this).data('id');
            window.location.href = `editar_anime.html?id=${animeId}`; // Ajuste para sua rota real de edição
        });

        // Evento para o botão de excluir (delegação de evento)
        $(document).on('click', '.delete-btn', function() {
            const animeId = $(this).data('id');
            if (confirm(`Tem certeza que deseja excluir o anime com ID: ${animeId}?`)) {
                const token = obterToken();
                $.ajax({
                    url: `http://127.0.0.1:8000/api/animes/${animeId}`, // URL da sua API para deletar
                    type: 'DELETE', // Método HTTP DELETE
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json' // Laravel espera isso para requisições DELETE
                    },
                    success: function(response) {
                        alert(response.message || 'Anime excluído com sucesso!');
                        loadAnimes(); // Recarrega a lista após a exclusão
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
            // Se houver um avatar, exiba-o; caso contrário, exiba a inicial
            if (userData.avatar) { // <--- MUDANÇA AQUI: de 'photo_url' para 'avatar'
                $('#userAvatar').html(`<img src="http://127.0.0.1:8000/${userData.avatar}" alt="Avatar do Usuário" class="avatar-img">`);
            } else {
                $('#userAvatar').text(userData.name ? userData.name.charAt(0).toUpperCase() : 'U');
            }
        },
        error: function(xhr) {
            console.error("Erro ao obter dados do usuário:", xhr);
        }
    });
}