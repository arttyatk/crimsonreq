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
        removerTodosCookies();
        alert('Você foi desconectado.');
        window.location.href = 'login.html';
    }

    // ================= LÓGICA PRINCIPAL =================
    if (!verificarAutenticacao()) return;

    const token = obterCookie('token');

    // ✅ Adiciona evento de clique no botão de sair
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
        }
    });

    // Submeter atribuição
    $("#exclusivo-form").submit(function(e) {
        e.preventDefault();

        // envia como formulário normal
        $.ajax({
            url: 'http://localhost:8000/api/atribuir-exclusivo',
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + token
            },
            data: {
                banner_id: $("#banner_id").val(),
                item_id: $("#item_id").val()
            },
            success: function(res) {
                alert(res.message);
                console.log(res.banner);
            },
            error: function(err) {
                console.log(err.responseJSON);
                alert("Erro ao atribuir exclusividade.");
            }
        });

    });
});
