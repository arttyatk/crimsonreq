$(document).ready(function () {
  // ==============================================
  // Configuração dos elementos de notificação
  // ==============================================
  
  // Adiciona o HTML do alerta centralizado (para erros/avisos)
  $('body').append(`
    <div id="centerAlert" class="center-alert">
      <div class="alert-box">
        <div class="alert-icon">
          <img src="CRIMSON LOGO TRANSPARENTE.png" alt="Logo" class="alert-logo">
        </div>
        <div class="alert-message"></div>
      </div>
    </div>
  `);

  // Adiciona o HTML da animação de sucesso
  $('body').append(`
    <div id="successAnimation" class="success-animation">
      <div class="animation-box">
        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
          <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
        <div class="success-message"></div>
      </div>
    </div>
  `);

  // ==============================================
  // Estilos para as notificações
  // ==============================================
  
  $('<style>')
    .text(`
      /* Estilos para o alerta centralizado */
      .center-alert {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.4s ease;
      }
      
      .center-alert.show {
        opacity: 1;
        visibility: visible;
      }
      
      .alert-box {
        background: #000000;
        border: 2px solid #ff0000;
        border-radius: 12px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        transform: scale(0.7);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
      }
      
      .center-alert.show .alert-box {
        transform: scale(1);
        opacity: 1;
      }
      
      .alert-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
      }
      
      .alert-logo {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .alert-message {
        color: #ffffff;
        font-size: 18px;
        line-height: 1.5;
      }
      
      /* Estilos para a animação de sucesso */
      .success-animation {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.4s ease;
      }
      
      .success-animation.show {
        opacity: 1;
        visibility: visible;
      }
      
      .animation-box {
        text-align: center;
        transform: scale(0.8);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .success-animation.show .animation-box {
        transform: scale(1);
        opacity: 1;
      }
      
      .checkmark {
        width: 100px;
        height: 100px;
        margin: 0 auto;
      }
      
      .checkmark-circle {
        stroke: #ff0000;
        stroke-width: 2;
        stroke-linecap: round;
        fill: none;
        animation: stroke-scale 0.6s ease-in-out;
      }
      
      .checkmark-check {
        stroke: #ff5555;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
        animation: stroke-draw 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
      }
      
      .success-message {
        color: #ffffff;
        font-size: 24px;
        margin-top: 30px;
        text-transform: uppercase;
        letter-spacing: 1px;
        background: linear-gradient(to right, #ff5555, #ff0000);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        font-weight: bold;
      }
      
      @keyframes stroke-draw {
        100% {
          stroke-dashoffset: 0;
        }
      }
      
      @keyframes stroke-scale {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }
    `)
    .appendTo('head');

  // ==============================================
  // Funções de exibição de notificações
  // ==============================================
  
  function showCenterAlert(message, isError = true) {
    const alert = $('#centerAlert');
    $('.alert-message', alert).text(message);
    
    alert.addClass('show');
    
    setTimeout(() => {
      alert.removeClass('show');
    }, 3000);
  }

  function showSuccessAnimation(message) {
    const animation = $('#successAnimation');
    $('.success-message', animation).text(message);
    
    animation.addClass('show');
    
    setTimeout(() => {
      animation.removeClass('show');
    }, 2500);
  }

  // ==============================================
  // Lógica da função do cookie
  // ==============================================
  function getCookie(nome) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const c = cookies[i].trim();
        if (c.indexOf(nome + "=") === 0) {
            return c.substring((nome + "=").length, c.length);
        }
    }
    return null;
  }

  // ==============================================
  // Lógica do formulário de login
  // ==============================================
  
  $('#loginForm').on('submit', function (e) {
    e.preventDefault();

    // Limpa mensagens anteriores
    $('#emailGroup, #passwordGroup').removeClass('error');
    $('#emailError, #passwordError, #successMessage').hide();

    const email = $('#email').val().trim();
    const password = $('#password').val().trim();

    // Validação simples
    if (!email || !password || password.length < 8) {
      if (!email) {
        $('#emailGroup').addClass('error');
        $('#emailError').text('Por favor, insira seu e-mail').show();
        showCenterAlert('Por favor, verifique seu e-mail');
      }
      if (!password || password.length < 8) {
        $('#passwordGroup').addClass('error');
        $('#passwordError').text('A senha deve ter pelo menos 8 caracteres').show();
        showCenterAlert('A senha deve ter pelo menos 8 caracteres');
      }
      return;
    }

    // Validação de formato de e-mail
    if (!email.includes('@')) {
      showCenterAlert('Por favor, verifique seu e-mail. Formato inválido.');
      $('#emailGroup').addClass('error');
      $('#emailError').text('Formato de e-mail inválido').show();
      return;
    }

    $.ajax({
      url: 'http://localhost:8000/api/login',
      method: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({ email, password }),
      success: function (response) {
        if (response.acess_token) {
          showSuccessAnimation('Login realizado com sucesso!');
          
          // Salva o token e o ID do usuário em cookies, conforme o retorno da sua API
          document.cookie = "token=" + response.acess_token + "; path=/; max-age=3600";
          document.cookie = "user_id=" + response.user.id + "; path=/; max-age=3600";

          // Exibe no console para confirmação
          console.log("Resposta da API:", response);
          console.log("Token recebido e salvo: ", response.acess_token);
          console.log("ID do usuário recebido e salvo: ", response.user.id);

          // Redireciona após a animação
          setTimeout(() => {
            window.location.href = 'inicial.html';
          }, 2500);
        } else {
          showCenterAlert('Resposta inesperada da API.');
        }
      },
      error: function (xhr) {
        const res = xhr.responseJSON;
        if (xhr.status === 401) {
          showCenterAlert('E-mail ou senha incorretos. Por favor, verifique suas credenciais.');
        } else if (xhr.status === 403) {
          showCenterAlert('Por favor, verifique seu e-mail para ativar sua conta.');
        } else {
          showCenterAlert(res?.message || 'Erro ao fazer login. Tente novamente mais tarde.');
        }
      }
    });
  });

  // ==============================================
  // Botão mostrar/ocultar senha
  // ==============================================
  
  $('.toggle-password').on('click', function () {
    const passwordField = $('#password');
    const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
    passwordField.attr('type', type);
    $(this).text(type === 'password' ? '👁️' : '🙈');
  });
});