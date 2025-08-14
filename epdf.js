// ================= FUNÇÕES DE TOKEN =================
function salvarToken(token) {
    localStorage.setItem('jwt', token);
}

function obterToken() {
    return localStorage.getItem('jwt');
}

function removerToken() {
    localStorage.clear();
}

// ================= FUNÇÕES DE AUTENTICAÇÃO =================
function verificarAutenticacao() {
    const token = obterToken();
    if (!token || token === "undefined" || token === null) {
        removerToken();
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ================= LOGOUT =================
$(document).on('click', '#logoutBtn', function() {
    removerToken();
    window.location.href = 'login.html';
});

// ================= GERAR E BAIXAR PDF =================
$("#enviar").click(function () { // Mantém o seletor #enviar
    if (!verificarAutenticacao()) {
        console.warn("Usuário não autenticado. Redirecionando para login.");
        return; // Sai da função se não estiver autenticado
    }

    const token = obterToken(); // Obtenha o token aqui
    
    // IMPORTANTE: Você precisa obter o ID do anime ou dado que será usado para gerar o PDF.
    // Vou manter a lógica de pegar o ID de um input #animeIdInput.
    // Ajuste isso se o ID vier de outro lugar (ex: data attribute de um botão, URL, etc.)
    const animeId = $('#animeIdInput').val(); // Exemplo: pega o ID de um input

    if (!animeId) {
        alert("Nenhum ID de anime fornecido para gerar o PDF.");
        console.error("ID do anime é indefinido ou nulo.");
        return;
    }

    // Opcional: Mostrar um indicador de carregamento
    const btn = $(this);
    const originalText = btn.text();
    btn.text('Gerando PDF...').prop('disabled', true);

    $.ajax({
        // A URL deve apontar para a rota no seu backend que **gera o PDF e o retorna como um arquivo**.
        // É comum que esta rota receba um ID na URL para gerar o PDF específico.
        url: `http://127.0.0.1:8000/api/gerapdf/criar/${animeId}`, // Adaptação da URL com o ID
        method: 'GET', // Método comum para baixar arquivos é GET (se não houver envio de dados complexos)
        // Se a API exigir POST para gerar o PDF, mude para 'POST' e adicione o 'data' se necessário.
        
        xhrFields: {
            responseType: 'blob' // ESSENCIAL: Diz ao jQuery para esperar uma resposta binária (blob)
        },
        headers: {
            'Accept': 'application/pdf', // ESSENCIAL: Indica que o cliente aceita PDF
            'Authorization': `Bearer ${token}` // Inclui o token JWT para autenticação
        },
        // Se o método for POST e você precisar enviar dados adicionais (além do ID na URL),
        // descomente e use o `data`:
        // data: JSON.stringify({
        //     algum_dado_extra: 'valor' 
        // }),
        // contentType: 'application/json', // Apenas se estiver enviando JSON com POST
        
        success: function (data) {
            // Restaura o botão
            btn.text(originalText).prop('disabled', false);

            if (data.type === 'application/pdf') { // Verifica se a resposta é de fato um PDF
                var url = window.URL.createObjectURL(data); // Cria um URL temporário para o blob
                
                var a = document.createElement('a'); // Cria um elemento <a> para o download
                a.href = url;
                a.download = `anime_${animeId}.pdf`; // Nome do arquivo a ser baixado
                document.body.appendChild(a); // Adiciona o elemento ao DOM (necessário para Firefox)
                a.click(); // Simula o clique para iniciar o download
                
                document.body.removeChild(a); // Remove o elemento <a>
                window.URL.revokeObjectURL(url); // Libera o URL temporário
            } else {
                // Se a API não retornou um PDF, pode ser um erro JSON ou outro tipo
                // Tenta ler como texto para ver a mensagem de erro
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const errorResponse = JSON.parse(reader.result);
                        alert(errorResponse.message || 'Erro: A API não retornou um PDF válido.');
                        console.error('Resposta não-PDF:', errorResponse);
                    } catch (e) {
                        alert('Erro inesperado: Resposta da API não é PDF e não é JSON.');
                        console.error('Erro ao ler resposta não-PDF:', reader.result, e);
                    }
                };
                reader.readAsText(data);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // Restaura o botão
            btn.text(originalText).prop('disabled', false);

            console.error('Erro ao gerar/baixar PDF:', textStatus, errorThrown, jqXHR);
            // Tenta obter a mensagem de erro do JSON se a API retornar JSON para erros
            if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                alert(jqXHR.responseJSON.message);
            } else if (jqXHR.responseText) {
                // Se não for JSON, exibe o texto da resposta
                alert('Erro: ' + jqXHR.responseText);
            } else {
                alert('Erro ao gerar ou baixar o PDF. Verifique o console para mais detalhes.');
            }
        }
    });
});

// ================= PERFIL =================
// Se você tem funções de perfil e outras abaixo, mantenha-as aqui
// para que o arquivo JS esteja completo.
// ... (Mantenha o resto do seu código JavaScript aqui)