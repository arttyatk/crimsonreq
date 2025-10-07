// ================= FUNÇÕES DE COOKIE =================
function obterCookie(nome) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Verifica se o cookie começa com o nome desejado e retorna seu valor
        if (cookie.startsWith(nome + '=')) {
            return cookie.substring(nome.length + 1);
        }
    }
    return null; // Retorna null se o cookie não for encontrado
}

function removerTodosCookies() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const nome = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        // Define a data de expiração para o passado para remover o cookie
        document.cookie = nome + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
}

// ================= FUNÇÕES DE AUTENTICAÇÃO E LOGOUT =================
function verificarAutenticacao() {
    const token = obterCookie('token'); // Usa a função de cookie
    if (!token || token === "undefined" || token === null) {
        removerTodosCookies(); // Limpa todos os cookies
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Função para deslogar o usuário
function deslogarUsuario() {
    removerTodosCookies(); // Usa a função de cookie
    alert('Você foi desconectado.');
    window.location.href = 'login.html';
}

// ================= LÓGICA PRINCIPAL =================
$(document).ready(function() {
    // Verifica autenticação ao carregar a página
    if (!verificarAutenticacao()) {
        return; // Redireciona para login se não estiver autenticado
    }

    // ✅ Adiciona um ouvinte de clique ao botão de logout
    $('#logoutBtn').on('click', function(e) {
        e.preventDefault(); // Impede o comportamento padrão do link
        deslogarUsuario();
    });

    $('#character-form').on('submit', function(e) {
        e.preventDefault();

        // Verifica autenticação novamente antes de enviar
        if (!verificarAutenticacao()) {
            return;
        }

        let formData = new FormData(this);
        const token = obterCookie('token'); // Usa a função de cookie

        // Remove os campos de texto do FormData para recriá-los
        formData.delete('passivas');
        formData.delete('habilidades');
        formData.delete('descricao');

        // Pega os valores e converte para arrays, separando por linha
        let passivas = $('#passivas').val().split('\n').filter(Boolean);
        let habilidades = $('#habilidades').val().split('\n').filter(Boolean);
        let descricao = $('#descricao').val();

        // Adiciona cada item do array no FormData
        passivas.forEach((passiva, index) => {
            formData.append(`passivas[${index}]`, passiva.trim());
        });

        habilidades.forEach((habilidade, index) => {
            formData.append(`habilidades[${index}]`, habilidade.trim());
        });
        
        formData.append('descricao', descricao);

        // Se a imagem não for obrigatória
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
                'Authorization': 'Bearer ' + token // Adiciona o token no header
            },
            success: function(resp){
                alert('Cadastro realizado com sucesso!');
                console.log(resp);
                $('#character-form')[0].reset();
            },
            error: function(err){
                console.log('Erro completo:', err);
                
                if (err.status === 401) {
                    alert('Sessão expirada. Faça login novamente.');
                    deslogarUsuario(); // Usa a função de deslogar
                } else if (err.status === 403) {
                    alert('Acesso negado. Você não tem permissão.');
                } else {
                    alert('Erro ao cadastrar. Verifique o console.');
                    console.log('Detalhes do erro:', err.responseText);
                }
            }
        });
    });
});