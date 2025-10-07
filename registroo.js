$(document).ready(function () {
    // Configuração do AJAX para incluir o token CSRF (se necessário)
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

    // O seletor do formulário mudou para '#registerForm'
    $('#registerForm').on('submit', function (e) {
        e.preventDefault();

        // Limpa mensagens anteriores
        $('.input-group').removeClass('error');
        $('.error-message').hide();
        $('#successMessage').hide();

        // Obtém os valores dos campos
        const name = $('#name').val().trim();
        const username = $('#username').val().trim(); // Novo campo
        const email = $('#email').val().trim();
        const password = $('#password').val().trim();
        const confirmPassword = $('#confirmPassword').val().trim();

        // Validação client-side
        let isValid = true;

        if (!name) {
            $('#nameGroup').addClass('error');
            $('#nameError').show();
            isValid = false;
        }

        // Validação do username
        if (!username) {
            $('#usernameGroup').addClass('error');
            $('#usernameError').text('Por favor, insira um username').show();
            isValid = false;
        } else if (username.length < 3) {
            $('#usernameGroup').addClass('error');
            $('#usernameError').text('O username deve ter pelo menos 3 caracteres').show();
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            $('#usernameGroup').addClass('error');
            $('#usernameError').text('O username só pode conter letras, números e underline').show();
            isValid = false;
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            $('#emailGroup').addClass('error');
            $('#emailError').text('Por favor, insira um e-mail válido').show();
            isValid = false;
        }

        if (!password || password.length < 8) {
            $('#passwordGroup').addClass('error');
            $('#passwordError').text('A senha deve ter pelo menos 8 caracteres').show();
            isValid = false;
        }

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
            url: 'http://localhost:8000/api/registrar',
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                name: name,
                username: username, // Novo campo
                email: email,
                password: password,
                password_confirmation: confirmPassword
            }),
            success: function (response) {
                // Restaura o botão
                submitBtn.text(originalBtnText).prop('disabled', false);

                if (response.message === "Sucesso" || response.message === "Usuário registrado com sucesso") {
                    $('#successMessage')
                        .text('Cadastro realizado com sucesso! Redirecionando para login...')
                        .css('display', 'block');

                    // Limpa o formulário
                    $('#registerForm')[0].reset();

                    // Redireciona para a página de login após 2 segundos
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
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
                    if (response.errors.username) {
                        $('#usernameError').text(response.errors.username[0]).show();
                        $('#usernameGroup').addClass('error');
                    }
                    if (response.errors.email) {
                        $('#emailError').text(response.errors.email[0]).show();
                        $('#emailGroup').addClass('error');
                    }
                    if (response.errors.password) {
                        $('#passwordError').text(response.errors.password[0]).show();
                        $('#passwordGroup').addClass('error');
                    }
                    if (response.errors.password_confirmation) {
                        $('#confirmPasswordError').text(response.errors.password_confirmation[0]).show();
                        $('#confirmPasswordGroup').addClass('error');
                    }
                } else {
                    alert(response?.message || 'Erro ao cadastrar. Por favor, tente novamente.');
                }
            }
        });
    });

    // Botões mostrar/ocultar senha
    $('.toggle-password').on('click', function () {
        const passwordInput = $(this).siblings('input');
        const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
        
        passwordInput.attr('type', type);
        
        // Altera o ícone
        if (type === 'password') {
            $(this).removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            $(this).removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });

    // Validação em tempo real para o campo Nome
    $('#name').on('input', function() {
        if ($(this).val().trim()) {
            $('#nameGroup').removeClass('error');
            $('#nameError').hide();
        }
    });

    // Validação em tempo real para o campo Username
    $('#username').on('input', function() {
        const username = $(this).val().trim();
        
        if (username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)) {
            $('#usernameGroup').removeClass('error');
            $('#usernameError').hide();
        } else if (username.length > 0) {
            $('#usernameGroup').addClass('error');
            if (username.length < 3) {
                $('#usernameError').text('O username deve ter pelo menos 3 caracteres').show();
            } else {
                $('#usernameError').text('O username só pode conter letras, números e underline').show();
            }
        } else {
            $('#usernameGroup').removeClass('error');
            $('#usernameError').hide();
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
        if ($(this).val().length >= 8) {
            $('#passwordGroup').removeClass('error');
            $('#passwordError').hide();
        } else if ($(this).val().length > 0) {
            $('#passwordGroup').addClass('error');
            $('#passwordError').text('A senha deve ter pelo menos 8 caracteres').show();
        } else {
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