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
$(document).on('click', '#logoutBtn', function() {
    removerToken();
    window.location.href = 'login.html';
});

// ================= FUNÇÃO DE NOTIFICAÇÃO ANIMADA =================
function mostrarNotificacao(mensagem, tipo) {
    const $notificacao = $('#notificacao-animada');

    let corFundo = '#FF1493'; // Rosa vibrante para sucesso e edição
    let corTexto = '#000000'; // Preto para o texto
    let icone = 'fa-check-circle';

    if (tipo === 'sucesso' || tipo === 'edicao') {
        corFundo = '#FF1493'; // Rosa vibrante
        corTexto = '#000000'; // Preto
        icone = 'fa-check-circle';
    } else if (tipo === 'exclusao') {
        corFundo = '#000000'; // Preto para exclusão
        corTexto = '#FF1493'; // Rosa vibrante para o texto
        icone = 'fa-trash-alt';
    } else if (tipo === 'erro') {
        corFundo = '#dc3545'; // Vermelho para erro
        corTexto = '#FFFFFF'; // Branco para o texto de erro
        icone = 'fa-times-circle';
    }

    $notificacao
        .stop(true, true)
        .css({
            'background-color': corFundo,
            'color': corTexto
        })
        .html(`<i class="fas ${icone}"></i> ${mensagem}`)
        .removeClass('ocultar')
        .addClass('mostrar');

    setTimeout(() => {
        $notificacao
            .removeClass('mostrar')
            .addClass('ocultar');
    }, 3000);
}

// ================= VERIFICA AUTENTICAÇÃO AO CARREGAR =================
$(document).ready(function() {
    if (!verificarAutenticacao()) return;

    atualizarInformacoesUsuario();

    const form = $("#animeForm");
    const tableBody = $("#animeTable tbody");
    const imagePreview = $('#imagePreview'); // Seleciona o div de prévia

    // Pré-visualização da imagem
    $('#cover_image').on('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.html(`<img src="${e.target.result}" alt="Capa do Anime">`);
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.empty(); // Limpa a prévia se nenhum arquivo for selecionado
        }
    });

    // ================= FUNÇÃO ÚNICA PARA SUBMIT =================
    form.on("submit", function(e) {
        e.preventDefault();

        const isEditMode = $(this).data('edit-mode');
        const animeId = $(this).data('edit-id');
        const formData = new FormData(this); // FormData automaticamente inclui o arquivo
        const token = obterToken();

        let url, method;

        if (isEditMode) {
            url = `http://127.0.0.1:8000/api/animes/${animeId}`;
            method = "POST"; // Use POST para FormData, mesmo com PUT no Laravel
            formData.append('_method', 'PUT'); // Adicione o método PUT para o Laravel
        } else {
            url = "http://127.0.0.1:8000/api/animes";
            method = "POST";
        }

        $.ajax({
            url: url,
            type: method,
            headers: {
                'Authorization': `Bearer ${token}`
                // Não defina 'Content-Type' aqui; o jQuery/FormData fará isso corretamente com boundary
            },
            data: formData,
            processData: false, // Necessário para não processar os dados da FormData
            contentType: false, // Necessário para não definir o Content-Type manualmente
            success: function(response) {
                mostrarNotificacao(
                    isEditMode ? "Anime atualizado com sucesso!" : "Anime cadastrado com sucesso!",
                    isEditMode ? 'edicao' : 'sucesso'
                );

                form[0].reset();
                imagePreview.empty(); // Limpa a prévia da imagem após o envio

                // Se estava em modo de edição, volta para modo de cadastro
                if (isEditMode) {
                    form.removeData('edit-mode').removeData('edit-id');
                    $('.submit-btn .btn-text').text('Cadastrar Anime');
                    $('h1').text('Cadastrar Novo Anime');
                    $('.btn-cancelar').remove();
                }

                // Recarrega a tabela
                tableBody.empty();
                carregarAnimes();
            },
            error: function(xhr) {
                console.error("Erro:", xhr);
                if (xhr.status === 401) {
                    removerToken();
                    window.location.href = 'login.html';
                } else {
                    mostrarNotificacao(
                        xhr.responseJSON?.message || "Erro ao salvar anime.",
                        'erro'
                    );
                }
            }
        });
    });

    // ================= CARREGAR ANIMES =================
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
            success: function(response) {
                tableBody.empty(); // Limpa a tabela antes de adicionar novos dados
                response.forEach(anime => adicionarAnimeNaTabela(anime));
            },
            error: function(xhr) {
                console.error("Erro ao carregar animes:", xhr);
                if (xhr.status === 401) {
                    removerToken();
                    window.location.href = 'login.html';
                } else {
                    mostrarNotificacao(
                        xhr.responseJSON?.message || "Erro ao carregar lista de animes.",
                        'erro'
                    );
                }
            }
        });
    }

    // ================= EXCLUIR ANIME =================
    $(document).on('click', '.btn-excluir', function() {
        const animeId = $(this).data('id');
        const token = obterToken();
        const linha = $(this).closest('tr');

        $.ajax({
            url: `http://127.0.0.1:8000/api/animes/${animeId}`,
            type: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            success: function(response) {
                linha.fadeOut(400, function() {
                    $(this).remove();
                });
                mostrarNotificacao(
                    response.success || "Anime excluído com sucesso!",
                    'exclusao'
                );
            },
            error: function(xhr) {
                console.error("Erro ao excluir anime:", xhr);
                mostrarNotificacao(
                    xhr.responseJSON?.message || "Erro ao excluir anime.",
                    'erro'
                );
            }
        });
    });

    // ================= EDITAR ANIME =================
    $(document).on('click', '.btn-editar', function() {
        const animeId = $(this).data('id');
        const token = obterToken();

        $.ajax({
            url: `http://127.0.0.1:8000/api/animes/${animeId}`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            success: function(anime) {
                // Preenche o formulário com os dados do anime
                $('#nome').val(anime.nome);
                $('#titulo_alternativo').val(anime.titulo_alternativo);
                $('#nota').val(anime.nota);
                $('#popularidade').val(anime.popularidade);
                $('#generos').val(anime.generos);
                $('#autor').val(anime.autor);
                $('#estudio').val(anime.estudio);
                $('#ano_lancamento').val(anime.ano_lancamento);
                $('#episodios').val(anime.episodios);
                $('#descricao').val(anime.descricao);

                // Preenche a prévia da imagem se houver uma capa existente
                if (anime.cover_image) {
                    imagePreview.html(`<img src="http://127.0.0.1:8000/${anime.cover_image}" alt="Capa do Anime">`);
                } else {
                    imagePreview.empty();
                }
                // Limpa o input de arquivo para evitar envio de arquivo antigo acidentalmente
                $('#cover_image').val('');


                // Altera o formulário para modo de edição
                form.data('edit-mode', true).data('edit-id', animeId);
                $('.submit-btn .btn-text').text('Atualizar Anime');
                $('h1').text('Editar Anime');

                // Adiciona botão de cancelar se não existir
                if ($('.btn-cancelar').length === 0) {
                    $('.submit-btn').after('<button type="button" class="btn-cancelar">Cancelar</button>');
                }
            },
            error: function(xhr) {
                console.error("Erro ao carregar anime:", xhr);
                mostrarNotificacao(
                    xhr.responseJSON?.message || "Erro ao carregar dados do anime.",
                    'erro'
                );
            }
        });
    });

    // ================= CANCELAR EDIÇÃO =================
    $(document).on('click', '.btn-cancelar', function() {
        form[0].reset();
        imagePreview.empty(); // Limpa a prévia da imagem ao cancelar
        form.removeData('edit-mode').removeData('edit-id');
        $('.submit-btn .btn-text').text('Cadastrar Anime');
        $('h1').text('Cadastrar Novo Anime');
        $(this).remove();
    });

    // Carrega os animes
    if (tableBody.length) {
        carregarAnimes();
    }

    document.getElementById('searchInput').addEventListener('input', function() {
        const filtro = this.value.toLowerCase();
        const linhas = document.querySelectorAll('#animeTable tbody tr');

        linhas.forEach(linha => {
            const titulo = linha.querySelector('td:nth-child(2)').textContent.toLowerCase();
            if (titulo.includes(filtro)) {
                linha.style.display = '';
            } else {
                linha.style.display = 'none';
            }
        });
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
            // Se houver uma photo_url, exiba-a; caso contrário, exiba a inicial
            if (userData.photo_url) {
                $('#userAvatar').html(`<img src="http://127.0.0.1:8000/${userData.photo_url}" alt="Avatar do Usuário" class="avatar-img">`);
            } else {
                $('#userAvatar').text(userData.name ? userData.name.charAt(0).toUpperCase() : 'U');
            }
        },
        error: function(xhr) {
            console.error("Erro ao obter dados do usuário:", xhr);
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
                <button class="btn-editar action-btn edit-btn" data-id="${anime.id}"><i class="fas fa-edit"></i></button>
                <button class="btn-excluir action-btn delete-btn" data-id="${anime.id}"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `;

    tableBody.append(linha);
}

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

// Seu ponto de chamada para carregar os dados do usuário, já presente e correto
// loadUserData(); // Removido pois já está no $(document).ready

// Lidar com o botão de logout
// $(document).on('click', '#logoutBtn', function() { ... }); // Já presente no topo e correto