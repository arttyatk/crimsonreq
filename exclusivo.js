$(document).ready(function() {
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

    // ================= SISTEMA DE ALERTAS ÉPICOS =================
    function createEpicParticles(container, count = 20) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Partículas coloridas
            const colors = ['#dc143c', '#ff6b6b', '#b22222', '#ffffff'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.background = color;
            particle.style.width = Math.random() * 8 + 4 + 'px';
            particle.style.height = particle.style.width;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.boxShadow = `0 0 15px ${color}`;
            
            // Algumas partículas são estrelas
            if (Math.random() > 0.7) {
                particle.classList.add('particle-star');
                particle.style.animationDelay = Math.random() * 3 + 's';
            }
            
            container.appendChild(particle);
        }
    }

    function createConfetti() {
        const overlay = document.getElementById('alertOverlay');
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            overlay.appendChild(confetti);
            
            // Remove após animação
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }

    let currentCallback = null;
    let currentData = null;

    function showExclusiveConfirm(bannerName, itemName, callback) {
        const overlay = $('#alertOverlay');
        const container = overlay.find('.alert-container');
        const icon = overlay.find('.alert-icon');
        const title = overlay.find('.alert-title');
        const message = overlay.find('.alert-message');
        const details = $('#alertDetails');
        const particles = $('#alertParticles')[0];
        
        container.removeClass('alert-success alert-error').addClass('alert-confirm');
        
        icon.html('<i class="fas fa-crown"></i>');
        title.text('ATRIBUIR EXCLUSIVIDADE');
        message.html(`Você está prestes a tornar este item <strong>EXCLUSIVO</strong> em um banner especial!`);
        
        details.html(`
            <div class="detail-item">
                <span class="detail-label">Banner:</span>
                <span class="detail-value">${bannerName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Item Exclusivo:</span>
                <span class="detail-value">${itemName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #ff6b6b;">EXCLUSIVO</span>
            </div>
        `);
        
        $('.alert-actions').show();
        $('#exclusiveLoading').hide();
        
        createEpicParticles(particles);
        
        currentCallback = callback;
        currentData = { bannerName, itemName };
        
        overlay.addClass('show');
    }

    function showExclusiveAlert(type, titleText, message, details = null) {
        const overlay = $('#alertOverlay');
        const container = overlay.find('.alert-container');
        const icon = overlay.find('.alert-icon');
        const title = overlay.find('.alert-title');
        const alertMessage = overlay.find('.alert-message');
        const alertDetails = $('#alertDetails');
        const particles = $('#alertParticles')[0];
        
        container.removeClass('alert-success alert-error alert-confirm').addClass(`alert-${type}`);
        
        switch(type) {
            case 'success':
                icon.html('<i class="fas fa-trophy"></i>');
                break;
            case 'error':
                icon.html('<i class="fas fa-skull-crossbones"></i>');
                break;
            default:
                icon.html('<i class="fas fa-info-circle"></i>');
        }
        
        title.text(titleText);
        alertMessage.html(message);
        
        if (details) {
            alertDetails.html(details).show();
        } else {
            alertDetails.hide();
        }
        
        $('.alert-actions').html('<button class="alert-btn alert-btn-primary" id="alertConfirm">CONTINUAR</button>');
        $('#exclusiveLoading').hide();
        
        createEpicParticles(particles);
        
        if (type === 'success') {
            createConfetti();
        }
        
        overlay.addClass('show');
    }

    function hideAlert() {
        const overlay = $('#alertOverlay');
        overlay.removeClass('show');
        
        setTimeout(() => {
            overlay.find('.alert-container').css({
                'transform': 'scale(0.5) rotateY(90deg)',
                'opacity': '0'
            });
            $('.alert-actions').show();
        }, 600);
        
        currentCallback = null;
        currentData = null;
    }

    function showExclusiveLoading() {
        $('.alert-actions').hide();
        $('#exclusiveLoading').show();
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

    function deslogarUsuario() {
        showExclusiveAlert('success', 'ATÉ LOGO!', 'Sessão encerrada com sucesso.', 
            '<div class="detail-item"><span class="detail-label">Status:</span><span class="detail-value">Desconectado</span></div>');
        setTimeout(() => {
            removerTodosCookies();
            window.location.href = 'login.html';
        }, 2000);
    }

    // ================= LÓGICA PRINCIPAL =================
    if (!verificarAutenticacao()) return;

    const token = obterCookie('token');

    // Configura eventos dos alertas
    $(document).on('click', '#alertConfirm', function() {
        if (currentCallback) {
            showExclusiveLoading();
            setTimeout(currentCallback, 800);
        } else {
            hideAlert();
        }
    });

    $(document).on('click', '#alertCancel', hideAlert);

    $('#alertOverlay').on('click', function(e) {
        if (e.target === this) {
            hideAlert();
        }
    });

    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAlert();
        }
    });

    // ✅ Logout com alerta épico
    $(".nav-links li a:contains('Sair')").on('click', function(e) {
        e.preventDefault();
        deslogarUsuario();
    });

    // Carregar banners
    $.ajax({
        url: 'http://localhost:8000/api/banners-boxes',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(data) {
            data.forEach(function(banner) {
                $("#banner_id").append(`<option value="${banner.id}">${banner.nome}</option>`);
            });
        },
        error: function() {
            showExclusiveAlert('error', 'ERRO', 'Não foi possível carregar os banners.');
        }
    });

    // Carregar personagens
    $.ajax({
        url: 'http://localhost:8000/api/gacha-items',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(data) {
            data.forEach(function(item) {
                $("#item_id").append(`<option value="${item.id}">${item.nome}</option>`);
            });
        },
        error: function() {
            showExclusiveAlert('error', 'ERRO', 'Não foi possível carregar os itens.');
        }
    });

    // Submeter atribuição
    $("#exclusivo-form").submit(function(e) {
        e.preventDefault();

        const bannerId = $("#banner_id").val();
        const itemId = $("#item_id").val();
        const bannerName = $("#banner_id option:selected").text();
        const itemName = $("#item_id option:selected").text();

        if (!bannerId || !itemId) {
            showExclusiveAlert('error', 'CAMPOS OBRIGATÓRIOS', 'Selecione um banner e um item para continuar.');
            return;
        }

        showExclusiveConfirm(bannerName, itemName, function() {
            // Callback de confirmação
            $.ajax({
                url: 'http://localhost:8000/api/atribuir-exclusivo',
                method: "POST",
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                data: {
                    banner_id: bannerId,
                    item_id: itemId
                },
                success: function(res) {
                    setTimeout(() => {
                        hideAlert();
                        showExclusiveAlert('success', 'EXCLUSIVIDADE ATRIBUÍDA!', 
                            `O item <strong>"${itemName}"</strong> agora é <strong>EXCLUSIVO</strong> no banner <strong>"${bannerName}"</strong>!`,
                            `<div class="detail-item">
                                <span class="detail-label">Banner:</span>
                                <span class="detail-value">${bannerName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Item Exclusivo:</span>
                                <span class="detail-value">${itemName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value" style="color: #2ECC40;">ATIVADO</span>
                            </div>`);
                        
                        // Limpa o formulário
                        $("#exclusivo-form")[0].reset();
                    }, 1000);
                },
                error: function(err) {
                    setTimeout(() => {
                        hideAlert();
                        const errorMsg = err.responseJSON?.message || 'Erro ao atribuir exclusividade.';
                        showExclusiveAlert('error', 'FALHA NA ATRIBUIÇÃO', errorMsg);
                    }, 1000);
                }
            });
        });
    });
});