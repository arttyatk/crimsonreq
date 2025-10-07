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

function obterUserId() {
    return obterCookie('user_id'); // Certifique-se de que este cookie é setado no login
}

$(document).ready(function() {
    // Verificar autenticação
    if (!verificarAutenticacao()) {
        return;
    }

    const userId = obterUserId();
    if (!userId) {
        alert('ID do usuário não encontrado. Faça login novamente.');
        window.location.href = 'login.html';
        return;
    }

    // Configuração do AJAX
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            'Authorization': 'Bearer ' + obterCookie('token')
        }
    });

    let currentUserData = {};
    let originalData = {};

    // Carregar dados do perfil do usuário
    function loadUserProfile() {
        $.ajax({
            url: `http://127.0.0.1:8000/api/profile/${userId}`,
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    currentUserData = response.user;
                    originalData = {...response.user};
                    populateProfileData(response.user);
                    console.log('Perfil carregado com sucesso!');
                }
            },
            error: function(xhr) {
                console.error('Erro ao carregar perfil:', xhr);
                if (xhr.status === 401) {
                    alert('Sessão expirada. Faça login novamente.');
                    window.location.href = 'login.html';
                } else {
                    alert('Erro ao carregar dados do perfil. Tente novamente.');
                }
            }
        });
    }

    // Preencher os campos do formulário com dados do usuário
    function populateProfileData(user) {
        // Informações básicas
        $('#name').val(user.name || '');
        $('#username').val(user.username || '');
        $('#email').val(user.email || '');
        $('#phone').val(user.phone || '');
        $('#birthdate').val(user.birthdate || '');
        $('#location').val(user.location || '');
        $('#bio').val(user.bio || '');

        // Redes sociais
        $('#website').val(user.discord || '');
        $('#twitter').val(user.twitter || '');
        $('#instagram').val(user.instagram || '');
        $('#linkedin').val(user.tiktok || '');
        $('#github').val(user.snapchat || '');

        // Atualizar header
        $('.profile-name').text(user.name || 'Nome do Usuário');
        $('.profile-bio').text(user.bio || 'Biografia não informada');

        // Atualizar imagens se existirem
        if (user.avatarpf) {
            $('.profile-image').attr('src', user.avatarpf);
        }
        if (user.coverp) {
            $('.cover-photo').attr('src', user.coverp);
        }
    }

    // Coletar dados do formulário de informações
    function getInfoFormData() {
        return {
            name: $('#name').val().trim(),
            username: $('#username').val().trim(),
            email: $('#email').val().trim(),
            phone: $('#phone').val().trim(),
            birthdate: $('#birthdate').val(),
            location: $('#location').val().trim(),
            bio: $('#bio').val().trim()
        };
    }

    // Coletar dados do formulário de redes sociais
    function getSocialFormData() {
        return {
            discord: $('#website').val().trim(),
            twitter: $('#twitter').val().trim(),
            instagram: $('#instagram').val().trim(),
            tiktok: $('#linkedin').val().trim(),
            snapchat: $('#github').val().trim()
        };
    }

    // Verificar se houve mudanças nos dados
    function hasChanges(newData, tab) {
        if (tab === 'info') {
            return (
                newData.name !== originalData.name ||
                newData.username !== originalData.username ||
                newData.email !== originalData.email ||
                newData.phone !== originalData.phone ||
                newData.birthdate !== originalData.birthdate ||
                newData.location !== originalData.location ||
                newData.bio !== originalData.bio
            );
        } else if (tab === 'social') {
            return (
                newData.discord !== originalData.discord ||
                newData.twitter !== originalData.twitter ||
                newData.instagram !== originalData.instagram ||
                newData.tiktok !== originalData.tiktok ||
                newData.snapchat !== originalData.snapchat
            );
        }
        return false;
    }

    // Atualizar perfil
    function updateProfile(formData, tab) {
        // Verifica se há mudanças antes de enviar
        if (!hasChanges(formData, tab)) {
            alert('Nenhuma alteração foi feita.');
            return;
        }

        // Mostrar loading no botão
        const submitBtn = $(`#${tab} .btn-primary`);
        const originalText = submitBtn.html();
        submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
        submitBtn.prop('disabled', true);

        $.ajax({
            url: `http://127.0.0.1:8000/api/profile/${userId}`,
            method: 'PUT',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    // Atualiza os dados originais
                    originalData = {...originalData, ...formData};
                    currentUserData = response.user;
                    
                    // Atualiza o header se for aba de informações
                    if (tab === 'info') {
                        $('.profile-name').text(response.user.name);
                        $('.profile-bio').text(response.user.bio || '');
                    }
                    
                    alert('Perfil atualizado com sucesso!');
                }
            },
            error: function(xhr) {
                console.error('Erro ao atualizar perfil:', xhr);
                
                if (xhr.status === 401) {
                    alert('Sessão expirada. Faça login novamente.');
                    window.location.href = 'login.html';
                } else if (xhr.status === 422) {
                    const errors = xhr.responseJSON.errors;
                    let errorMessage = 'Erro de validação:\n';
                    for (const field in errors) {
                        errorMessage += `• ${errors[field][0]}\n`;
                    }
                    alert(errorMessage);
                } else {
                    alert('Erro ao atualizar perfil: ' + (xhr.responseJSON?.message || 'Tente novamente.'));
                }
            },
            complete: function() {
                submitBtn.html(originalText);
                submitBtn.prop('disabled', false);
            }
        });
    }

    // Resetar formulário para dados originais
    function resetForm(tab) {
        if (confirm('Descartar todas as alterações?')) {
            if (tab === 'info') {
                populateProfileData(originalData);
            } else if (tab === 'social') {
                $('#website').val(originalData.discord || '');
                $('#twitter').val(originalData.twitter || '');
                $('#instagram').val(originalData.instagram || '');
                $('#linkedin').val(originalData.tiktok || '');
                $('#github').val(originalData.snapchat || '');
            }
        }
    }

    // Sistema de abas
    function initTabs() {
        $('.tab').on('click', function() {
            const tabId = $(this).data('tab');
            
            $('.tab').removeClass('active');
            $(this).addClass('active');
            
            $('.tab-content').removeClass('active');
            $(`#${tabId}`).addClass('active');
        });
    }

    // Event Listeners
    function initEventListeners() {
        // Formulário de Informações
        $('#info .btn-primary').on('click', function() {
            const formData = getInfoFormData();
            updateProfile(formData, 'info');
        });

        // Formulário de Redes Sociais
        $('#social .btn-primary').on('click', function() {
            const formData = getSocialFormData();
            updateProfile(formData, 'social');
        });

        // Botões Cancelar
        $('#info .btn-outline').on('click', function() {
            resetForm('info');
        });

        $('#social .btn-outline').on('click', function() {
            resetForm('social');
        });

        // Enter nos campos de input
        $('.form-control').on('keypress', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                const activeTab = $('.tab.active').data('tab');
                if (activeTab === 'info') {
                    const formData = getInfoFormData();
                    updateProfile(formData, 'info');
                } else if (activeTab === 'social') {
                    const formData = getSocialFormData();
                    updateProfile(formData, 'social');
                }
            }
        });
    }

    // Upload de imagens
    function initImageUpload() {
        $('.change-photo').on('click', function() {
            alert('Funcionalidade de upload de imagem será implementada em breve!');
        });
    }

    // Inicialização
    function init() {
        initTabs();
        initEventListeners();
        initImageUpload();
        loadUserProfile();
    }

    // Iniciar tudo quando documento estiver pronto
    init();
});