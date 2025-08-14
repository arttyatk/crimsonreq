$(document).ready(function () {
    // Configuração do AJAX para incluir o token CSRF (se necessário)
    // Se você estiver usando Laravel ou um framework similar, este meta tag precisa estar no seu HTML:
    // <meta name="csrf-token" content="{{ csrf_token() }}">
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

    // O seletor do formulário mudou para '#registerForm'
    $('#registerForm').on('submit', function (e) {
        e.preventDefault();

        // Limpa mensagens anteriores
        $('.form-group').removeClass('error');
        $('.error-message').hide();
        $('#successMessage').hide();

        // Obtém os valores dos campos
        const name = $('#name').val().trim();
        const email = $('#email').val().trim();
        const password = $('#password').val().trim();
        const confirmPassword = $('#confirmPassword').val().trim(); // Novo campo

        // Validação client-side
        let isValid = true;

        if (!name) {
            $('#nameGroup').addClass('error');
            $('#nameError').show();
            isValid = false;
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            $('#emailGroup').addClass('error');
            $('#emailError').text('Por favor, insira um e-mail válido').show();
            isValid = false;
        }

        // A API pede mínimo 6 caracteres, mas seu HTML está com 8.
        // Vou manter a validação do JS em 8 para consistência com o HTML.
        // Adapte para 6 se a API for a regra final.
        if (!password || password.length < 8) {
            $('#passwordGroup').addClass('error');
            $('#passwordError').text('A senha deve ter pelo menos 8 caracteres').show();
            isValid = false;
        }

        // Validação da confirmação de senha
        if (!confirmPassword || confirmPassword !== password) {
            $('#confirmPasswordGroup').addClass('error');
            $('#confirmPasswordError').text('As senhas não coincidem').show();
            isValid = false;
        }

        if (!isValid) return;

        // Mostra loading no botão
        const submitBtn = $(this).find('button[type="submit"]');
        const originalBtnText = submitBtn.text();
        submitBtn.text('Cadastrando...').prop('disabled', true);

        // Requisição AJAX para a API
        $.ajax({
            url: 'http://localhost:8000/api/registrar', // Endpoint da sua API
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                name: name,
                email: email,
                password: password,
                password_confirmation: confirmPassword // Campo exigido pela API para confirmação
            }),
            success: function (response) {
                // Restaura o botão
                submitBtn.text(originalBtnText).prop('disabled', false);

                if (response.message === "Sucesso" || response.message === "Usuário registrado com sucesso") { // Adapte a mensagem de sucesso da sua API
                    $('#successMessage')
                        .text('Cadastro realizado com sucesso! Redirecionando para login...')
                        .css('display', 'block');

                    // Limpa o formulário
                    $('#registerForm')[0].reset(); // Limpa o formulário com o novo ID

                    // Redireciona para a página de login após 2 segundos
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    // Se a API retornar uma mensagem diferente de "Sucesso" mas sem erros, exiba-a
                    alert('Resposta inesperada da API: ' + (response.message || 'Erro desconhecido'));
                }
            },
            error: function (xhr) {
                // Restaura o botão
                submitBtn.text(originalBtnText).prop('disabled', false);

                const response = xhr.responseJSON;

                // Trata erros de validação do servidor
                if (response && response.errors) {
                    if (response.errors.name) {
                        $('#nameError').text(response.errors.name[0]).show();
                        $('#nameGroup').addClass('error');
                    }
                    if (response.errors.email) {
                        $('#emailError').text(response.errors.email[0]).show();
                        $('#emailGroup').addClass('error');
                    }
                    if (response.errors.password) {
                        // A API pode retornar múltiplos erros para a senha (ex: tamanho, complexidade)
                        // Exiba o primeiro erro ou concatene se preferir
                        $('#passwordError').text(response.errors.password[0]).show();
                        $('#passwordGroup').addClass('error');
                    }
                    // Adicionar tratamento para password_confirmation do servidor
                    if (response.errors.password_confirmation) {
                        $('#confirmPasswordError').text(response.errors.password_confirmation[0]).show();
                        $('#confirmPasswordGroup').addClass('error');
                    }
                } else {
                    // Exibe a mensagem de erro geral ou a do xhr, se disponível
                    alert(response?.message || 'Erro ao cadastrar. Por favor, tente novamente.');
                }
            }
        });
    });

    // Botões mostrar/ocultar senha para AMBOS os campos de senha
    // O seletor foi corrigido para '.toggle-password' e a lógica para encontrar o input é mais robusta
    $('.toggle-password').on('click', function () {
        const passwordInput = $(this).closest('.password-container').find('input[type="password"], input[type="text"]');
        const icon = $(this).find('i');
        const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';

        passwordInput.attr('type', type);

        // Altera o ícone
        if (type === 'password') {
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });

    // Validação em tempo real para o campo Nome
    $('#name').on('input', function() {
        if ($(this).val().trim()) {
            $('#nameGroup').removeClass('error');
            $('#nameError').hide();
        }
    });

    // Validação em tempo real para o campo E-mail
    $('#email').on('input', function() {
        const email = $(this).val().trim();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            $('#emailGroup').removeClass('error');
            $('#emailError').hide();
        } else if (!email) {
            $('#emailGroup').addClass('error');
            $('#emailError').text('Por favor, insira um e-mail válido').show();
        }
    });

    // Validação em tempo real para o campo Senha
    $('#password').on('input', function() {
        if ($(this).val().length >= 8) { // Mantenho 8, conforme HTML
            $('#passwordGroup').removeClass('error');
            $('#passwordError').hide();
        } else if ($(this).val().length > 0) { // Mostra erro se digitou algo mas não alcançou o mínimo
            $('#passwordGroup').addClass('error');
            $('#passwordError').text('A senha deve ter pelo menos 8 caracteres').show();
        } else { // Se o campo estiver vazio
            $('#passwordGroup').removeClass('error');
            $('#passwordError').hide();
        }
        // Dispara a validação da confirmação de senha também
        $('#confirmPassword').trigger('input');
    });

    // Validação em tempo real para o campo Confirmar Senha
    $('#confirmPassword').on('input', function() {
        const password = $('#password').val().trim();
        const confirmPassword = $(this).val().trim();

        if (confirmPassword && confirmPassword === password) {
            $('#confirmPasswordGroup').removeClass('error');
            $('#confirmPasswordError').hide();
        } else if (confirmPassword.length > 0) {
            $('#confirmPasswordGroup').addClass('error');
            $('#confirmPasswordError').text('As senhas não coincidem').show();
        } else {
            $('#confirmPasswordGroup').removeClass('error');
            $('#confirmPasswordError').hide();
        }
    });
});