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
            window.location.href = 'login.html'; // Redirecione para sua página de login
            return false;
        }
        return true;
    }

    // ================= LOGOUT =================
    $(document).on('click', '#logoutBtn', function() {
        removerToken();
        window.location.href = 'login.html'; // Redirecione para sua página de login
    });

    // ================== PERFIL =================
    $(document).ready(function() {
        if (!verificarAutenticacao()) return;

        // Adiciona um pequeno atraso para que a página renderize antes de carregar os animes,
        // garantindo que os elementos do DOM estejam prontos.
        setTimeout(function() {
            atualizarInformacoesUsuario();
            loadAnimes(); // Carrega a lista de animes assim que a página estiver pronta
        }, 100); // 100ms de atraso
    });

    function atualizarInformacoesUsuario() {
        const token = obterToken();
        if (!token) return;

        $.ajax({
            url: "http://127.0.0.1:8000/api/user", // URL da sua API de usuário
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
                if (userData.avatar) {
                    $('#userAvatar').html(`<img src="http://127.0.0.1:8000/${userData.avatar}" alt="Avatar do Usuário" class="avatar-img">`);
                } else {
                    $('#userAvatar').text(userData.name ? userData.name.charAt(0).toUpperCase() : 'U');
                }
            },
            error: function(xhr) {
                console.error("Erro ao obter dados do usuário:", xhr);
                // Lidar com erros de autenticação aqui, se necessário (ex: token expirado)
                if (xhr.status === 401 || xhr.status === 403) {
                    removerToken();
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // ================== CARREGAMENTO E FILTRAGEM DE ANIMES ==================

    // Função para renderizar uma linha da tabela para um anime
    function renderAnimeRow(anime) {
        const coverImage = anime.cover_image ? `http://127.0.0.1:8000/${anime.cover_image}` : 'https://via.placeholder.com/60x90?text=Sem+Capa';
        // Certifique-se de que anime.generos seja uma string antes de chamar split
        const generos = anime.generos ? anime.generos.split(',').map(g => `<span class="genre-tag">${g.trim()}</span>`).join(' ') : 'N/A';

        return `
            <tr data-anime-id="${anime.id}" data-genres="${anime.generos ? anime.generos.toLowerCase() : ''}">
                <td><img src="${coverImage}" alt="${anime.nome}" class="anime-cover"></td>
                <td>${anime.nome || 'N/A'}</td>
                <td>${anime.nota !== null ? anime.nota.toFixed(1) : 'N/A'}</td>
                <td>${anime.popularidade !== null ? anime.popularidade : 'N/A'}</td>
                <td>${anime.ano_lancamento || 'N/A'}</td>
                <td>${generos}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${anime.id}" title="Editar Anime"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${anime.id}" title="Excluir Anime"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }

    // Função para carregar e exibir animes via AJAX
    function loadAnimes() {
        const token = obterToken();
        if (!token) {
            console.error("Token de autenticação não encontrado para carregar animes.");
            return;
        }

        const searchTerm = $('#searchInput').val().trim().toLowerCase(); // Termo de busca em minúsculas
        const selectedGenres = [];
        // Coleta os valores dos checkboxes marcados
        $('.genre-checkbox:checked').each(function() {
            selectedGenres.push($(this).val());
        });

        const animeTableBody = $('#animeTableBody');
        animeTableBody.empty(); // Limpa a tabela existente

        // Aqui, como você quer o filtro apenas no front-end,
        // vamos simular uma lista de animes completa e depois filtrá-la.
        // No seu código original, `loadAnimes` já faz uma chamada à API.
        // Se a sua API já suporta a passagem de 'generos' e 'search'
        // como parâmetros, a lógica do backend já está cuidando da filtragem.
        // Se não, você precisará carregar TODOS os animes primeiro
        // e então aplicar o filtro no JavaScript.

        // Supondo que sua API retorna a lista *completa* de animes
        // e que a filtragem por 'generos' e 'search' ainda não está implementada no backend.
        // SE SUA API JÁ FILTRA POR 'generos' E 'search' na URL:
        // A lógica abaixo da API não precisa ser alterada,
        // pois o `params.append` já está enviando os filtros.
        // A lógica de `filteredAnimes` (após o sucesso da API) será o que você precisa.

        // Construir os parâmetros da URL, caso sua API já suporte esses filtros.
        // Caso contrário, estes parâmetros serão ignorados pela API, e você terá que
        // filtrar os animes no JavaScript.
        const params = new URLSearchParams();
        if (selectedGenres.length > 0) {
            params.append('generos', selectedGenres.join(',')); // Envia os gêneros como uma string separada por vírgulas
        }
        if (searchTerm) {
            params.append('search', searchTerm);
        }

        // Monta a URL da API com os parâmetros de consulta
        const apiUrl = `http://127.0.0.1:8000/api/animes?${params.toString()}`;

        $.ajax({
            url: apiUrl,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            success: function(animes) {
                // Se a API já retorna os animes filtrados, você pode pular a etapa de filtragem JavaScript.
                // Mas, para garantir que o filtro de gênero funcione no front-end se a API não o fizer:
                let filteredAnimes = animes;

                // Filtrar por termo de pesquisa (se searchTerm não for vazio)
                if (searchTerm) {
                    filteredAnimes = filteredAnimes.filter(anime =>
                        anime.nome && anime.nome.toLowerCase().includes(searchTerm)
                    );
                }

                // Filtrar por gênero (se algum gênero foi selecionado)
                if (selectedGenres.length > 0) {
                    filteredAnimes = filteredAnimes.filter(anime => {
                        // Converte a string de gêneros do anime para um array de strings minúsculas
                        const animeGenres = anime.generos ? anime.generos.toLowerCase().split(',').map(g => g.trim()) : [];
                        // Verifica se TODOS os gêneros selecionados estão presentes nos gêneros do anime
                        return selectedGenres.every(selectedGenre =>
                            animeGenres.includes(selectedGenre.toLowerCase())
                        );
                    });
                }

                if (filteredAnimes.length === 0) {
                    animeTableBody.html('<tr><td colspan="7" style="text-align: center; color: #ccc;">Nenhum anime encontrado com os filtros selecionados.</td></tr>');
                    return;
                }

                filteredAnimes.forEach(anime => {
                    animeTableBody.append(renderAnimeRow(anime));
                });
            },
            error: function(xhr, status, error) {
                console.error("Erro ao carregar animes:", status, error, xhr);
                $('#animeTableBody').html('<tr><td colspan="7" style="text-align: center; color: #dc3545;">Erro ao carregar animes. Tente novamente mais tarde.</td></tr>');
                if (xhr.status === 401 || xhr.status === 403) {
                    removerToken();
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // ================= EVENT LISTENERS =================

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

        // Toggle para menu mobile (se você tiver um CSS para isso)
        $('#mobileMenuToggle').on('click', function() {
            $('.layout-sidebar').toggleClass('active');
            $('body').toggleClass('sidebar-open'); // Adicione uma classe ao body para ajustar o layout
        });
    });