$(document).ready(function() {
    $('#banner-form').on('submit', function(e) {
        e.preventDefault();

        let formData = new FormData(this);
        
        // Verifica se o campo 'imagem' foi selecionado, pois ele é obrigatório na validação
        if (!formData.get('imagem') || formData.get('imagem').name === '') {
            alert('Por favor, selecione uma imagem para o banner.');
            return;
        }

        // Requisição AJAX para a nova API de banners
        $.ajax({
            url: 'http://localhost:8000/api/banners-boxes',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            // Adicionando o cabeçalho 'Accept' para garantir que a resposta de erro seja JSON
            headers: {
                'Accept': 'application/json'
            },
            success: function(resp) {
                alert('Banner/Box cadastrado com sucesso!');
                console.log(resp);
                $('#banner-form')[0].reset();
            },
            error: function(err) {
                // Em caso de erro, exibe a resposta JSON completa no console
                console.log(err.responseJSON);
                alert('Erro ao cadastrar. Verifique o console.');
            }
        });
    });
});