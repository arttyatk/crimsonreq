$(document).ready(function() {
    // Mostrar a tela de introdução imediatamente
    $('#introScreen').removeClass('fade-out'); // Garante que a tela de intro esteja visível ao carregar

    // Definir um timeout para ocultar a tela de introdução e então carregar o conteúdo do dashboard
    setTimeout(function() {
        $('#introScreen').addClass('fade-out'); // Aciona a animação de fade-out

        // Após a transição de fade-out ser concluída, remover ou esconder a tela de introdução
        // e então carregar o conteúdo principal do dashboard.
        $('#introScreen').on('transitionend', function() {
            $(this).remove(); // Remove a div da intro do DOM após a animação
            // Agora, inicialize o dashboard
            initializeDashboard();
        });
    }, 3000); // Exibe a intro por 3 segundos antes de começar o fade-out (ajuste o tempo se desejar)


    // ----------------------------------------------------------------------
    // Função para inicializar o dashboard após a intro
    function initializeDashboard() {
        // Configuração do token CSRF
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });

        // Suas funções de carregamento existentes
        loadDashboardStats(); // Esta função agora também iniciará a animação dos números
        loadGenreDistribution();
        loadMonthlyActivity();
        loadLatestAnimes();
        loadAnimes(); // Certifique-se de que a tabela de animes seja carregada no início

        // Atualiza os dados a cada 5 minutos (opcional)
        setInterval(function() {
            loadDashboardStats();
            loadLatestAnimes();
        }, 300000); // 300000 ms = 5 minutos
    }
    // ----------------------------------------------------------------------

    // ================= FUNÇÃO PARA ANIMAR OS NÚMEROS =================
    function animateNumbers() {
        // Itera sobre cada elemento com a classe 'stat-number'
        $('.stat-number').each(function() {
            const $this = $(this);
            // Pega o valor final do HTML. É crucial que o texto já esteja preenchido pelo AJAX.
            const endValue = parseFloat($this.text());

            // Define o texto inicial do elemento para '0' antes de iniciar a animação
            // É importante fazer isso para que a animação comece do zero.
            $this.text('0');

            // Anima um objeto temporário de 0 até o valor final
            $({ Counter: 0 }).animate({ Counter: endValue }, {
                duration: 1500, // Duração da animação em milissegundos (1.5 segundos)
                easing: 'swing', // Efeito de easing (pode ser 'linear' ou outros, 'swing' é um bom padrão)
                step: function(now) {
                    // Durante a animação, atualiza o texto do elemento
                    if ($this.attr('id') === 'mediaNotas') {
                        // Para a média de notas, formata com uma casa decimal
                        $this.text(now.toFixed(1));
                    } else {
                        // Para os outros, arredonda para o número inteiro mais próximo
                        $this.text(Math.ceil(now));
                    }
                },
                complete: function() {
                    // Garante que o valor final seja exatamente o esperado,
                    // corrigindo possíveis imprecisões de arredondamento ou do Math.ceil
                    if ($this.attr('id') === 'mediaNotas') {
                        $this.text(endValue.toFixed(1));
                    } else {
                        $this.text(endValue);
                    }
                }
            });
        });
    }

    // ================= 1. Carrega as estatísticas gerais =================
    function loadDashboardStats() {
        $.ajax({
            url: 'http://127.0.0.1:8000/api/dashboard/stats',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                // Preenche os cards de estatísticas com os dados obtidos
                $('#totalAnimes').text(data.total_animes || 0);
                $('#totalUsers').text(data.total_users || 0);
                $('#episodios').text(data.total_episodes || 0);
                $('#mediaNotas').text((data.average_rating || 0.0).toFixed(1));

                // CHAMA A FUNÇÃO DE ANIMAÇÃO AQUI!
                animateNumbers();
            },
            error: function(error) {
                console.error('Erro ao carregar estatísticas:', error);
                $('#totalAnimes, #totalUsers, #episodios, #mediaNotas').html('<i class="fas fa-exclamation-circle"></i>');
            }
        });
    }

    // ================= 2. Carrega a distribuição de gêneros para o gráfico =================
    function loadGenreDistribution() {
        $.ajax({
            url: 'http://127.0.0.1:8000/api/dashboard/genre-distribution',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                // Remove o placeholder antes de criar o gráfico
                $('#graficoGeneros').parent().find('.chart-placeholder').remove();
                $('#graficoGeneros').css('display', 'block');
                createGenreChart(data);
            },
            error: function(error) {
                console.error('Erro ao carregar distribuição de gêneros:', error);
                $('#graficoGeneros').parent().html('<p class="error-chart">Erro ao carregar gráfico</p>');
            }
        });
    }

    // ================= 3. Carrega a atividade mensal para o gráfico =================
    function loadMonthlyActivity() {
        $.ajax({
            url: 'http://127.0.0.1:8000/api/dashboard/monthly-activity',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                // Remove o placeholder antes de criar o gráfico
                $('#graficoAtividade').parent().find('.chart-placeholder').remove();
                $('#graficoAtividade').css('display', 'block');
                createActivityChart(data);
            },
            error: function(error) {
                console.error('Erro ao carregar atividade mensal:', error);
                $('#graficoAtividade').parent().html('<p class="error-chart">Erro ao carregar gráfico</p>');
            }
        });
    }

    // ================= 4. Carrega os últimos animes adicionados =================
    function loadLatestAnimes() {
        $.ajax({
            url: 'http://127.0.0.1:8000/api/dashboard/stats', // Reutiliza a mesma rota que já retorna os animes
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                const container = $('#ultimosAnimes'); // Onde os animes serão inseridos
                container.empty(); // Limpa o conteúdo existente

                if (data.latest_animes && data.latest_animes.length > 0) {
                    data.latest_animes.forEach(anime => {
                        const capa = anime.full_cover_image_url
                            ? anime.full_cover_image_url
                            : "https://via.placeholder.com/180x240?text=Sem+Capa"; // Fallback se não houver imagem

                        container.append(`
                            <div class="anime-item">
                                <img src="${capa}"
                                     alt="${anime.nome}"
                                     class="anime-cover"
                                     onerror="this.src='https://via.placeholder.com/180x240?text=Imagem+Não+Disponível'">
                                <div class="anime-info">
                                    <div class="anime-name">${anime.nome || 'Nome não disponível'}</div>
                                    <div class="anime-meta">Nota: ${anime.nota ? anime.nota.toFixed(1) : 'N/A'} • Episódios: ${anime.episodios || 'N/A'}</div>
                                </div>
                            </div>
                        `);
                    });
                } else {
                    container.html('<div class="no-animes">Nenhum anime recente encontrado</div>');
                }
            },
            error: function(error) {
                console.error('Erro ao carregar últimos animes:', error);
                $('#ultimosAnimes').html('<div class="error-animes"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar animes</div>');
            }
        });
    }

    // ================= Funções de Gráfico (sem alterações) =================
    // Função para criar o gráfico de gêneros
    function createGenreChart(data) {
        const ctx = document.getElementById('graficoGeneros').getContext('2d');
        if (window.genreChartInstance) {
            window.genreChartInstance.destroy();
        }
        window.genreChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: [
                        '#ff2d70', '#ff8fab', '#d41a55',
                        '#ff6b9d', '#ff3d7f', '#ff9fbb',
                        '#ff4d88', '#ff7fa7', '#e61a5f'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#f0f0f0',
                            font: {
                                family: 'Poppins'
                            }
                        }
                    }
                }
            }
        });
    }

    // Função para criar o gráfico de atividade
    function createActivityChart(data) {
        const ctx = document.getElementById('graficoAtividade').getContext('2d');
        if (window.activityChartInstance) {
            window.activityChartInstance.destroy();
        }
        window.activityChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Animes Adicionados',
                    data: data.data,
                    backgroundColor: '#ff2d70',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#f0f0f0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#f0f0f0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#f0f0f0',
                            font: {
                                family: 'Poppins'
                            }
                        }
                    }
                }
            }
        });
    }

    // ================= Nova Lógica para Upload de Imagem e Envio do Formulário =================

    // **Pré-visualização da imagem ao selecionar um arquivo**
    $('#cover_image').on('change', function(event) {
        const [file] = event.target.files;
        if (file) {
            $('#imagePreview').attr('src', URL.createObjectURL(file)).show();
        } else {
            $('#imagePreview').hide().attr('src', '#'); // Esconde e reseta a pré-visualização se nenhum arquivo for selecionado
        }
    });

    // **Manipulador de envio do formulário de cadastro de anime**
    $('#animeForm').on('submit', function(e) {
        e.preventDefault(); // Impede o envio padrão do formulário

        const form = $(this)[0]; // Obtém o elemento DOM do formulário
        const formData = new FormData(form); // Cria um objeto FormData com todos os campos, incluindo o arquivo

        // Se você tiver o CSRF token, adicione-o ao FormData
        // (Geralmente o ajaxSetup já cuida do header, mas adicionar ao FormData é uma boa prática para multipart/form-data)
        const csrfToken = $('meta[name="csrf-token"]').attr('content');
        if (csrfToken) {
            formData.append('_token', csrfToken);
        }

        // URL da sua API no Laravel para armazenar o anime (ajuste se for diferente!)
        const apiUrl = 'http://127.0.0.1:8000/api/animes'; // Exemplo de rota

        $.ajax({
            url: apiUrl,
            type: 'POST',
            data: formData,
            processData: false, // IMPORTANTE: Não processar os dados (para FormData)
            contentType: false, // IMPORTANTE: Não definir o tipo de conteúdo (para FormData)
            success: function(response) {
                console.log('Anime cadastrado com sucesso!', response);
                mostrarNotificacao('Anime cadastrado com sucesso!', 'success');
                $('#animeForm')[0].reset(); // Limpa o formulário
                $('#imagePreview').hide().attr('src', '#'); // Esconde e reseta a pré-visualização da imagem

                // Recarrega a tabela de animes para mostrar o novo item
                loadAnimes();
                // Opcional: recarrega outras estatísticas se o novo anime impactar os gráficos
                loadDashboardStats();
                loadLatestAnimes();
            },
            error: function(xhr, status, error) {
                console.error('Erro ao cadastrar anime:', xhr.responseText);
                let errorMessage = 'Erro ao cadastrar anime.';
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    if (errorData.errors) {
                        errorMessage += '<br><ul>';
                        for (const key in errorData.errors) {
                            errorMessage += `<li>${errorData.errors[key][0]}</li>`;
                        }
                        errorMessage += '</ul>';
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    console.error('Erro ao parsear JSON de erro:', e);
                }
                mostrarNotificacao(errorMessage, 'error');
            }
        });
    });

    // Função para mostrar notificações (se ainda não tiver)
    function mostrarNotificacao(mensagem, tipo) {
        const notificacao = $('#notificacao-animada');
        notificacao.removeClass('ocultar success error').html(mensagem);
        notificacao.addClass(tipo);

        // Força o reflow para garantir que a transição ocorra
        void notificacao[0].offsetWidth;

        notificacao.css('opacity', '1').css('transform', 'translateY(0)');

        setTimeout(() => {
            notificacao.css('opacity', '0').css('transform', 'translateY(-20px)');
            setTimeout(() => {
                notificacao.addClass('ocultar');
            }, 500); // Tempo para a transição de fade-out
        }, 5000); // Tempo que a notificação fica visível (5 segundos)
    }

    // ================= Função para Carregar a Tabela de Animes (completa) =================
    // É crucial ter esta função para que a tabela seja atualizada após o cadastro
    function loadAnimes() {
        $.ajax({
            url: 'http://127.0.0.1:8000/api/animes', // Ajuste para a URL que lista todos os animes
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                const tbody = $('#animeTable tbody');
                tbody.empty(); // Limpa as linhas existentes

                if (data.length > 0) {
                    data.forEach(anime => {
                        // Certifique-se de que o backend envia `full_cover_image_url` ou ajuste esta lógica
                        const imageUrl = anime.full_cover_image_url
                            ? anime.full_cover_image_url
                            : (anime.cover_image ? `http://127.0.0.1:8000/${anime.cover_image}` : 'https://via.placeholder.com/60x80?text=Sem+Capa');

                        tbody.append(`
                            <tr>
                                <td><img src="${imageUrl}" alt="${anime.nome}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://via.placeholder.com/60x80?text=Img+Err'"></td>
                                <td>${anime.nome || 'N/A'}</td>
                                <td>${anime.nota ? anime.nota.toFixed(1) : 'N/A'}</td>
                                <td>${anime.popularidade || 'N/A'}</td>
                                <td>${anime.ano_lancamento || 'N/A'}</td>
                                <td>${anime.generos || 'N/A'}</td>
                                <td>
                                    <button class="action-btn edit-btn" data-id="${anime.id}" title="Editar Anime"><i class="fas fa-edit"></i></button>
                                    <button class="action-btn delete-btn" data-id="${anime.id}" title="Excluir Anime"><i class="fas fa-trash-alt"></i></button>
                                </td>
                            </tr>
                        `);
                    });
                } else {
                    tbody.append('<tr><td colspan="7" class="no-data">Nenhum anime cadastrado.</td></tr>');
                }
            },
            error: function(error) {
                console.error('Erro ao carregar animes para a tabela:', error);
                $('#animeTable tbody').html('<tr><td colspan="7" class="error-data">Erro ao carregar animes.</td></tr>');
            }
        });
    }

    // Chame a função para carregar animes ao inicializar o dashboard, ou onde for apropriado
    // (já adicionei uma chamada a loadAnimes() dentro de initializeDashboard())


    // ================= Implementação dos botões de ação (exemplo) =================
    // Estes são exemplos de como você pode manipular os botões de edição/exclusão.
    // Você precisará de funções correspondentes no seu backend (Laravel).

    // Evento de clique para o botão de editar
    $(document).on('click', '.edit-btn', function() {
        const animeId = $(this).data('id');
        console.log('Editar anime com ID:', animeId);
        // Implemente a lógica de edição aqui, por exemplo, preencher o formulário com os dados do anime
        // ou redirecionar para uma página de edição.
        // Ex: fetchAnimeForEdit(animeId);
    });

    // Evento de clique para o botão de excluir
    $(document).on('click', '.delete-btn', function() {
        const animeId = $(this).data('id');
        console.log('Excluir anime com ID:', animeId);
        if (confirm('Tem certeza que deseja excluir este anime?')) {
            $.ajax({
                url: `http://127.0.0.1:8000/api/animes/${animeId}`, // Ajuste para a URL de exclusão
                type: 'DELETE',
                success: function(response) {
                    console.log('Anime excluído com sucesso!', response);
                    mostrarNotificacao('Anime excluído com sucesso!', 'success');
                    loadAnimes(); // Recarrega a tabela após a exclusão
                    loadDashboardStats(); // Atualiza as estatísticas
                    loadLatestAnimes(); // Atualiza a lista de últimos animes
                },
                error: function(xhr, status, error) {
                    console.error('Erro ao excluir anime:', xhr.responseText);
                    mostrarNotificacao('Erro ao excluir anime.', 'error');
                }
            });
        }
    });

    // ================= Lógica da barra de pesquisa =================
    $('#searchInput').on('keyup', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('#animeTable tbody tr').each(function() {
            const rowText = $(this).text().toLowerCase();
            if (rowText.includes(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    // ================= Lógica do menu mobile (se for relevante para este arquivo) =================
    $('#mobileMenuToggle').on('click', function() {
        $('aside.layout-sidebar').toggleClass('active');
    });

    // Ocultar o menu mobile ao clicar fora dele (opcional)
    $(document).on('click', function(event) {
        if (!$(event.target).closest('aside.layout-sidebar').length && !$(event.target).closest('#mobileMenuToggle').length) {
            $('aside.layout-sidebar').removeClass('active');
        }
    });

});