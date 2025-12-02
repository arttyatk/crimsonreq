// ================= FUNÇÕES DE COOKIE =================
function obterCookie(nome) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(nome + '=')) {
            return cookie.substring(nome.length + 1);
        }
    }
    return null;
}

function removerTodosCookies() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const nome = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = nome + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
}

function deslogarUsuario() {
    showAlert('warning', 'ATENÇÃO', 'Sessão finalizada com sucesso.');
    setTimeout(() => {
        removerTodosCookies();
        window.location.href = 'login.html';
    }, 2000);
}

$('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        deslogarUsuario();
    });

// ================= SISTEMA DE ALERTAS =================
function createParticles(container, count = 12) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 4 + 's';
        particle.style.background = `hsl(${Math.random() * 20 + 340}, 80%, 60%)`;
        particle.style.width = Math.random() * 4 + 3 + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

let currentCallback = null;
let currentItemId = null;
let currentItemName = null;

function showConfirm(message, itemId, itemName, callback) {
    const overlay = $('#alertOverlay');
    const container = overlay.find('.alert-container');
    const icon = overlay.find('.alert-icon');
    const title = overlay.find('.alert-title');
    const alertMessage = overlay.find('.alert-message');
    const particles = $('#alertParticles')[0];
    
    // Remove classes anteriores
    container.removeClass('alert-success alert-error alert-confirm');
    container.addClass('alert-confirm');
    
    // Configura conteúdo
    icon.html('<i class="fas fa-exclamation-triangle"></i>');
    title.text('CONFIRMAR EXCLUSÃO');
    alertMessage.html(`<strong>"${itemName}"</strong><br>${message}`);
    
    // Mostra ações, esconde loading
    $('.alert-actions').show();
    $('#deleteLoading').hide();
    
    // Cria partículas
    createParticles(particles);
    
    // Armazena callback e dados
    currentCallback = callback;
    currentItemId = itemId;
    currentItemName = itemName;
    
    // Mostra overlay
    overlay.addClass('show');
}

function showAlert(type, titleText, message) {
    const overlay = $('#alertOverlay');
    const container = overlay.find('.alert-container');
    const icon = overlay.find('.alert-icon');
    const title = overlay.find('.alert-title');
    const alertMessage = overlay.find('.alert-message');
    const particles = $('#alertParticles')[0];
    
    // Remove classes anteriores
    container.removeClass('alert-success alert-error alert-confirm');
    container.addClass(`alert-${type}`);
    
    // Configura ícone e cores baseado no tipo
    switch(type) {
        case 'success':
            icon.html('<i class="fas fa-check-circle"></i>');
            break;
        case 'error':
            icon.html('<i class="fas fa-times-circle"></i>');
            break;
        default:
            icon.html('<i class="fas fa-info-circle"></i>');
    }
    
    title.text(titleText);
    alertMessage.text(message);
    
    // Para alertas simples, mostra apenas botão OK
    $('.alert-actions').html('<button class="alert-btn alert-btn-primary" id="alertConfirm">OK</button>');
    $('#deleteLoading').hide();
    
    // Cria partículas
    createParticles(particles);
    
    // Mostra overlay
    overlay.addClass('show');
}

function hideAlert() {
    const overlay = $('#alertOverlay');
    overlay.removeClass('show');
    
    // Reset para próxima exibição
    setTimeout(() => {
        overlay.find('.alert-container').css({
            'transform': 'scale(0.8) translateY(-50px)',
            'opacity': '0'
        });
        $('.alert-actions').show();
    }, 400);
    
    currentCallback = null;
    currentItemId = null;
    currentItemName = null;
}

function showDeleteLoading() {
    $('.alert-actions').hide();
    $('#deleteLoading').show();
}

// ================= FUNÇÕES DE AUTENTICAÇÃO =================
function verificarAutenticacao() {
    const token = obterCookie('token');
    if (!token || token === "undefined" || token === null) {
        removerTodosCookies();
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ================= LOGOUT =================
$(document).on('click', '#logoutBtn', function(e) {
    e.preventDefault();
    showConfirm('Deseja realmente sair do sistema?', null, null, function() {
        removerTodosCookies();
        window.location.href = 'login.html';
    });
});

// ================= LÓGICA PRINCIPAL =================
$(document).ready(function () {
    // Inicia a verificação de autenticação
    if (!verificarAutenticacao()) {
        return;
    }

    const $grid = $(".character-grid");
    $grid.empty();

    // Configura eventos dos alertas
    $(document).on('click', '#alertConfirm', function() {
        if (currentCallback) {
            // Se é uma confirmação de exclusão
            if (currentItemId) {
                showDeleteLoading();
                // Executa o callback após um delay para mostrar o loading
                setTimeout(currentCallback, 500);
            } else {
                // Se é apenas um alerta OK
                currentCallback();
            }
        } else {
            hideAlert();
        }
    });

    $(document).on('click', '#alertCancel', hideAlert);

    // Fecha alerta clicando fora
    $('#alertOverlay').on('click', function(e) {
        if (e.target === this) {
            hideAlert();
        }
    });

    // Fecha com ESC
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAlert();
        }
    });

    // Requisição AJAX para LISTAR ITENS
    $.ajax({
        url: "http://localhost:8000/api/gacha-items",
        method: "GET",
        dataType: "json",
        headers: {
            'Authorization': 'Bearer ' + obterCookie('token')
        },
        success: function (data) {
            if (data.length === 0) {
                $grid.append('<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e6b0b0;"><i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i><p>Nenhum personagem ou item cadastrado ainda.</p></div>');
                return;
            }
            
            data.forEach(item => {
                const imageUrl = item.imagem_url;
                let imageContent;
                if (imageUrl) {
                    imageContent = `<img src="${imageUrl}" alt="${item.nome}" style="width:100%; height:180px; object-fit: cover;">`;
                } else {
                    let iconClass = "fas fa-question";
                    if (item.tipo === "personagem") iconClass = "fas fa-user";
                    if (item.tipo === "item") iconClass = "fas fa-shield-alt";
                    imageContent = `<i class="${iconClass}" style="font-size:3rem; color:#773333;"></i>`;
                }
                
                const card = `
                    <div class="character-card" data-id="${item.id}">
                        <div class="character-image">
                            ${imageContent}
                        </div>
                        <div class="character-details">
                            <h4 class="character-name">${item.nome}</h4>
                            <div class="character-rarity">${item.raridade} • ${item.tipo}</div>
                            <div class="character-actions">
                                <button class="action-btn edit-btn" title="Editar"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete-btn" title="Excluir"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `;
                $grid.append(card);
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Erro ao carregar os dados da API:", textStatus, errorThrown);
            if (jqXHR.status === 401 || jqXHR.status === 403) {
                showAlert('error', 'ACESSO NEGADO', 'Sua sessão expirou. Redirecionando para login...');
                setTimeout(() => {
                    removerTodosCookies();
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showAlert('error', 'ERRO DE CONEXÃO', 'Não foi possível carregar os dados.');
            }
        }
    });

    // EXCLUSÃO DE ITEM
    $(document).on("click", ".delete-btn", function () {
        const token = obterCookie('token');
        if (!token) {
            showAlert('error', 'ACESSO NEGADO', 'Você precisa estar logado para realizar esta ação.');
            return;
        }

        const $card = $(this).closest(".character-card");
        const id = $card.data("id");
        const nome = $card.find(".character-name").text();

        showConfirm(
            "Esta ação é irreversível e o item será permanentemente excluído do sistema.",
            id,
            nome,
            function() {
                // Callback de confirmação
                $.ajax({
                    url: `http://localhost:8000/api/gacha-items/${id}`,
                    method: "DELETE",
                    headers: {
                        'Authorization': 'Bearer ' + obterCookie('token')
                    },
                    success: function () {
                        // Efeito visual de remoção
                        $card.addClass('removing');
                        setTimeout(() => {
                            $card.remove();
                            hideAlert();
                            showAlert('success', 'EXCLUÍDO!', `"${nome}" foi removido com sucesso.`);
                        }, 300);
                    },
                    error: function (jqXHR) {
                        hideAlert();
                        if (jqXHR.status === 401) {
                            showAlert('error', 'SESSÃO EXPIRADA', 'Sua sessão expirou. Faça login novamente.');
                            setTimeout(() => {
                                removerTodosCookies();
                                window.location.href = 'login.html';
                            }, 2000);
                        } else {
                            showAlert('error', 'ERRO', 'Não foi possível excluir o item. Tente novamente.');
                        }
                    }
                });
            }
        );
    });

    // EDIÇÃO DE ITEM
    $(document).on("click", ".edit-btn", function () {
        const token = obterCookie('token');
        if (!token) {
            showAlert('error', 'ACESSO NEGADO', 'Você precisa estar logado para realizar esta ação.');
            return;
        }
        
        const id = $(this).closest(".character-card").data("id");
        const nome = $(this).closest(".character-card").find(".character-name").text();
        
        showAlert('success', 'EDITAR ITEM', `Redirecionando para edição de: ${nome} (ID: ${id})`);
        // Aqui você pode implementar o redirecionamento para a página de edição
        // window.location.href = `editar.html?id=${id}`;
    });
});

// Estilo para animação de remoção
$('<style>').text(`
    .character-card.removing {
        animation: removeCard 0.3s ease-out forwards;
    }
    @keyframes removeCard {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(0.8); opacity: 0.5; }
        100% { transform: scale(0); opacity: 0; }
    }
`).appendTo('head');