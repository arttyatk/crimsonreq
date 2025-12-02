// Função para obter cookie
function obterCookie(nome) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${nome}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
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

// Função para mostrar mensagens de sucesso/erro
function mostrarMensagem(tipo, mensagem) {
    // Remove mensagens anteriores
    $('.alert-message').remove();
    
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-danger';
    const icon = tipo === 'success' ? '✅' : '❌';
    
    const alertDiv = $(`
        <div class="alert-message" style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${tipo === 'success' ? 'linear-gradient(135deg, #006400, #228B22)' : 'linear-gradient(135deg, #8B0000, #B22222)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            border-left: 4px solid ${tipo === 'success' ? '#32CD32' : '#FF4500'};
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        ">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2rem;">${icon}</span>
                <span>${mensagem}</span>
            </div>
        </div>
    `);
    
    $('body').append(alertDiv);
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        alertDiv.animate({opacity: 0, right: '-100%'}, 300, function() {
            $(this).remove();
        });
    }, 5000);
}

// CSS para animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Validação do formulário
function validarFormulario(formData) {
    const nome = formData.get('nome');
    const preco = formData.get('preco');
    const tipo = formData.get('tipo');
    const imagem = formData.get('imagem');
    
    if (!nome || nome.trim() === '') {
        mostrarMensagem('error', 'Por favor, preencha o nome do banner.');
        return false;
    }
    
    if (!preco || preco <= 0) {
        mostrarMensagem('error', 'Por favor, insira um preço válido (maior que 0).');
        return false;
    }
    
    if (!tipo) {
        mostrarMensagem('error', 'Por favor, selecione o tipo do banner.');
        return false;
    }
    
    if (!imagem || imagem.size === 0) {
        mostrarMensagem('error', 'Por favor, selecione uma imagem para o banner.');
        return false;
    }
    
    return true;
}

// Envio do formulário
$(document).ready(function() {
    $('#banner-form').on('submit', function(e) {
        e.preventDefault();
        
        const token = obterCookie('token');
        if (!token) {
            mostrarMensagem('error', 'Você precisa estar logado para cadastrar um banner.');
            return;
        }
        
        const formData = new FormData(this);
        
        // DEBUG: Mostrar dados do FormData no console
        console.log('Dados do formulário:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }
        
        if (!validarFormulario(formData)) {
            return;
        }
        
        // Mostrar loading no botão
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.text();
        submitBtn.prop('disabled', true).text('Cadastrando...');
        
        // CORREÇÃO: URL correta da API
        $.ajax({
            url: 'http://127.0.0.1:8000/api/banners-boxes', // URL CORRIGIDA
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                "Authorization": "Bearer " + token,
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                console.log('Resposta do servidor:', response);
                mostrarMensagem('success', 'Banner cadastrado com sucesso!');
                $('#banner-form')[0].reset();
                
                // Resetar o preço para o valor padrão
                $('#preco').val('150');
                $('#tipo').val('banner');
                $('#status').val('ativo');
            },
            error: function(xhr) {
                console.error('Erro ao cadastrar banner:', xhr);
                let errorMessage = 'Erro ao cadastrar banner.';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                } else if (xhr.status === 422 && xhr.responseJSON.errors) {
                    // Erros de validação do Laravel
                    const errors = xhr.responseJSON.errors;
                    const firstError = Object.values(errors)[0];
                    errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                } else if (xhr.status === 500) {
                    errorMessage = 'Erro interno do servidor. Tente novamente.';
                } else if (xhr.status === 404) {
                    errorMessage = 'Endpoint não encontrado. Verifique a URL da API.';
                }
                
                mostrarMensagem('error', errorMessage);
            },
            complete: function() {
                // Restaurar botão
                submitBtn.prop('disabled', false).text(originalText);
            }
        });
    });
    
    // Validação em tempo real do campo de preço
    $('#preco').on('input', function() {
        const value = $(this).val();
        if (value < 0) {
            $(this).val(0);
        }
    });
    
    // Formatação do preço para exibição mais amigável
    $('#preco').on('blur', function() {
        let value = parseFloat($(this).val());
        if (isNaN(value)) {
            value = 150; // Valor padrão
        }
        $(this).val(Math.max(1, Math.floor(value))); // Garante número inteiro mínimo 1
    });
    
    // Tooltip informativo para o preço
    $('#preco').on('mouseenter', function() {
        $(this).attr('title', 'Valor em Star Coins que os jogadores precisarão pagar para girar este banner');
    });
    
    // Prevenir envio do formulário com Enter em campos individuais
    $('#banner-form').on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
        }
    });
});