// ================= SISTEMA DE ALERTAS ANIMADOS =================
function createParticles(container, count = 15) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.background = `hsl(${Math.random() * 20 + 340}, 80%, 60%)`;
        container.appendChild(particle);
    }
}

function showAlert(type, title, message) {
    const overlay = $('#alertOverlay');
    const box = overlay.find('.alert-box');
    const icon = overlay.find('.alert-icon');
    const alertTitle = overlay.find('.alert-title');
    const alertMessage = overlay.find('.alert-message');
    const particles = $('#alertParticles')[0];
    
    // Cria partículas
    createParticles(particles);
    
    // Remove todas as classes de tipo anteriores
    box.removeClass('alert-success alert-error alert-warning');
    
    // Configura com base no tipo
    switch(type) {
        case 'success':
            box.addClass('alert-success');
            icon.html('<i class="fas fa-check-circle"></i>');
            break;
        case 'error':
            box.addClass('alert-error');
            icon.html('<i class="fas fa-times-circle"></i>');
            break;
        case 'warning':
            box.addClass('alert-warning');
            icon.html('<i class="fas fa-exclamation-triangle"></i>');
            break;
        default:
            box.addClass('alert-success');
            icon.html('<i class="fas fa-star"></i>');
    }
    
    alertTitle.text(title);
    alertMessage.text(message);
    
    overlay.addClass('show');
    
    // Adiciona efeito sonoro (opcional)
    if (type === 'success') {
        // Você pode adicionar um efeito sonoro aqui se quiser
        console.log('🔊 Sucesso!');
    }
}

function hideAlert() {
    const overlay = $('#alertOverlay');
    overlay.removeClass('show');
    
    // Reset da animação para próxima vez
    setTimeout(() => {
        overlay.find('.alert-box').css('transform', 'scale(0.7) rotateX(-90deg)');
    }, 400);
}

function showLoading() {
    $('#loadingOverlay').addClass('show');
}

function hideLoading() {
    $('#loadingOverlay').removeClass('show');
}

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

// ================= FUNÇÕES DE AUTENTICAÇÃO E LOGOUT =================
function verificarAutenticacao() {
    const token = obterCookie('token');
    if (!token || token === "undefined" || token === null) {
        removerTodosCookies();
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function deslogarUsuario() {
    showAlert('warning', 'ATENÇÃO', 'Sessão finalizada com sucesso.');
    setTimeout(() => {
        removerTodosCookies();
        window.location.href = 'login.html';
    }, 2000);
}

// ================= LÓGICA PRINCIPAL =================
$(document).ready(function() {
    // Verifica autenticação ao carregar a página
    if (!verificarAutenticacao()) {
        return;
    }

    // Configura o evento de clique no botão do alerta
    $('.alert-button').on('click', hideAlert);

    // Fecha o alerta clicando fora da caixa
    $('#alertOverlay').on('click', function(e) {
        if (e.target === this) {
            hideAlert();
        }
    });

    // Fecha o alerta com a tecla ESC
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAlert();
        }
    });

    // ✅ Botão de logout
    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        deslogarUsuario();
    });

    // ✅ Formulário de cadastro (mantido igual, só atualizei as chamadas showAlert)
    $('#character-form').on('submit', function(e) {
        e.preventDefault();

        if (!verificarAutenticacao()) {
            return;
        }

        // Validação básica
        const nome = $('#nome').val().trim();
        const taxaDrop = parseFloat($('#taxa_drop').val());
        
        if (!nome) {
            showAlert('error', 'CAMPO OBRIGATÓRIO', 'O nome do personagem/item é obrigatório.');
            $('#nome').focus();
            return;
        }

        if (isNaN(taxaDrop) || taxaDrop < 0 || taxaDrop > 100) {
            showAlert('error', 'DADO INVÁLIDO', 'A taxa de drop deve ser um número entre 0 e 100.');
            $('#taxa_drop').focus();
            return;
        }

        showLoading();

        let formData = new FormData(this);
        const token = obterCookie('token');

        // Processamento do formulário (mantido igual)
        formData.delete('passivas');
        formData.delete('habilidades');
        formData.delete('descricao');

        let passivas = $('#passivas').val().split('\n').filter(Boolean);
        let habilidades = $('#habilidades').val().split('\n').filter(Boolean);
        let descricao = $('#descricao').val();

        passivas.forEach((passiva, index) => {
            formData.append(`passivas[${index}]`, passiva.trim());
        });

        habilidades.forEach((habilidade, index) => {
            formData.append(`habilidades[${index}]`, habilidade.trim());
        });
        
        formData.append('descricao', descricao);

        if ($('#imagem')[0].files.length === 0) {
            formData.delete('imagem');
        }

        $.ajax({
            url: 'http://localhost:8000/api/gacha-items',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function(resp){
                hideLoading();
                showAlert('success', 'CADASTRO REALIZADO!', 
                    `"${nome}" foi cadastrado com sucesso!\n\n`);
                
                console.log('Resposta do servidor:', resp);
                $('#character-form')[0].reset();
            },
            error: function(err){
                hideLoading();
                console.log('Erro completo:', err);
                
                if (err.status === 401) {
                    showAlert('error', 'SESSÃO EXPIRADA', 'Sua sessão expirou.\nRedirecionando para login...');
                    setTimeout(() => {
                        deslogarUsuario();
                    }, 3000);
                } else if (err.status === 403) {
                    showAlert('error', 'ACESSO NEGADO', 'Você não tem permissão para esta ação.');
                } else if (err.status === 422) {
                    const errors = err.responseJSON?.errors;
                    if (errors) {
                        const firstError = Object.values(errors)[0][0];
                        showAlert('error', 'ERRO DE VALIDAÇÃO', firstError);
                    } else {
                        showAlert('error', 'ERRO NO FORMULÁRIO', 'Verifique os dados informados.');
                    }
                } else if (err.status === 500) {
                    showAlert('error', 'ERRO NO SERVIDOR', 'Erro interno do servidor.\nTente novamente.');
                } else {
                    showAlert('error', 'ERRO DE CONEXÃO', 
                        'Não foi possível conectar ao servidor.\nVerifique sua conexão.');
                }
            }
        });
    });
});