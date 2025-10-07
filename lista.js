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
$(document).on('click', '#logoutBtn', function() {
    removerTodosCookies();
    window.location.href = 'login.html';
});

$(document).ready(function () {
    
    // Inicia a verificação de autenticação ao carregar a página
    if (!verificarAutenticacao()) {
        return;
    }

    const $grid = $(".character-grid");
    $grid.empty();

    // Requisição AJAX para LISTAR ITENS
    $.ajax({
        url: "http://localhost:8000/api/gacha-items",
        method: "GET",
        dataType: "json",
        headers: {
            'Authorization': 'Bearer ' + obterCookie('token') // Usa a função de cookie
        },
        success: function (data) {
            if (data.length === 0) {
                $grid.append("<p>Nenhum personagem ou item cadastrado ainda.</p>");
                return;
            }
            data.forEach(item => {
                const imageUrl = item.imagem_url;
                let imageContent;
                if (imageUrl) {
                    imageContent = `<img src="${imageUrl}" alt="${item.nome}" style="max-width:100%; height:180px; object-fit: cover;">`;
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
                                <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
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
                 verificarAutenticacao(); // Força a verificação e o redirecionamento
            }
            $grid.append("<p>Erro ao carregar os dados da API.</p>");
        }
    });

    // Requisição AJAX para DELETAR ITEM (requer token)
    $(document).on("click", ".delete-btn", function () {
        const token = obterCookie('token'); // Usa a função de cookie
        if (!token) {
            alert("Você precisa estar logado para realizar esta ação.");
            return;
        }

        const id = $(this).closest(".character-card").data("id");
        if (confirm("Tem certeza que deseja excluir este item?")) {
            $.ajax({
                url: `http://localhost:8000/api/gacha-items/${id}`,
                method: "DELETE",
                headers: {
                    'Authorization': 'Bearer ' + obterCookie('token') // Usa a função de cookie
                },
                success: function () {
                    $(`.character-card[data-id='${id}']`).remove();
                    alert("Item deletado com sucesso!");
                },
                error: function (jqXHR) {
                    if (jqXHR.status === 401) {
                        alert("Sessão expirada. Por favor, faça login novamente.");
                        removerTodosCookies(); // Usa a função de cookie
                        window.location.href = 'login.html';
                    } else {
                        alert("Erro ao deletar item. Verifique se você tem permissão.");
                    }
                }
            });
        }
    });

    // Event listener para edição (também requer token)
    $(document).on("click", ".edit-btn", function () {
        const token = obterCookie('token'); // Usa a função de cookie
        if (!token) {
            alert("Você precisa estar logado para realizar esta ação.");
            return;
        }
        const id = $(this).closest(".character-card").data("id");
        alert(`Aqui você pode abrir um modal para editar o item ID: ${id}`);
    });
});