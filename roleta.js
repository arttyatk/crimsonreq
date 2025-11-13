// ---------------- FUNÇÕES AUXILIARES ----------------
function obterCookie(nome) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${nome}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function verificarAutenticacao() {
    const token = obterCookie('token');
    if (!token) {
        alert("Você precisa estar logado para girar a roleta!");
        return false;
    }
    return true;
}

// ---------------- FUNÇÃO populateRoulette (CORRIGIDA COM LÓGICA DE CONTAINER) ----------------
function populateRoulette(items) {
    const $roulette = $('#roulette');
    $roulette.empty();

    if (!items.length) return;

    const raridadeCores = {
        'comum': '#FFFFFF',
        'incomum': '#90EE90',
        'raro': '#1E90FF',
        'epico': '#670a93ff',
        'legendario': '#fff200ff'
    };

    // Duplicar os itens para roleta longa (MANTIDO)
    const repeatCount = 10;
    let displayItems = [];
    for (let r = 0; r < repeatCount; r++) {
        displayItems = displayItems.concat(items);
    }

    // Criar os itens (MODIFICADO para usar um container e uma classe)
    displayItems.forEach(item => {
        let content;
        
        // Prioriza a imagem
        if (item.imagem_url) {
            // APLICAMOS A LÓGICA: O content agora é a imagem com uma CLASSE, dentro de um container
            content = `
                <div class="item-image-container">
                    <img src="${item.imagem_url}" alt="${item.nome}" class="roulette-item-image">
                </div>
            `;
        } else {
            // Se não houver URL, exibe o ícone padrão. O ícone fica direto no .item.
            let iconClass = "fas fa-question";
            if (item.tipo === "personagem") iconClass = "fas fa-user";
            if (item.tipo === "item") iconClass = "fas fa-shield-alt";
            content = `<i class="${iconClass}" style="font-size:2rem; color:#773333;"></i>`;
        }

        const $itemDiv = $(`
            <div class="item">
                ${content}
            </div>
        `);
        // Adiciona cor da borda baseada na raridade
        $itemDiv.css('border-color', raridadeCores[item.raridade?.toLowerCase()] || '#FFF');
        $roulette.append($itemDiv);
    });

    // ... (restante da função populateRoulette, que permanece inalterado)
    const $spinBtn = $('#spinButton');
    $spinBtn.off('click').on('click', function () {
        if (!verificarAutenticacao()) return;

        // Desabilita o botão para prevenir múltiplos cliques
        $spinBtn.prop('disabled', true).text('GIRANDO...'); 

        const urlParams = new URLSearchParams(window.location.search);
        const bannerId = urlParams.get('bannerId');
        const token = obterCookie('token');

        // --- CHAMADA AJAX PARA O BACK-END FAZER O SORTEIO E SALVAR O ITEM ---
        $.ajax({
            url: `http://127.0.0.1:8000/api/gacha/spin/${bannerId}`, 
            type: 'POST', // Usamos POST como definido na sua rota
            headers: { "Authorization": "Bearer " + token },
            success: function(response) {
                const winnerItem = response.item;
                // **CHAVE AQUI**: Recebe o índice do item sorteado pelo Laravel
                const winnerIndex = response.winnerIndex; 
                
                // Inicia a animação usando o índice retornado pelo servidor
                animateRoulette(items, displayItems, winnerIndex, winnerItem, $roulette, $spinBtn);
            },
            error: function(xhr) {
                alert('Erro ao girar a roleta: ' + (xhr.responseJSON?.message || xhr.responseText));
                $spinBtn.prop('disabled', false).text('GIRAR ROLETA'); // Habilita em caso de erro
            }
        });
    });
}

// ---------------- FUNÇÃO DE ANIMAÇÃO (NOVA) ----------------
function animateRoulette(items, displayItems, winnerIndex, winnerItem, $roulette, $spinBtn) {
    const itemWidth = $('.item').outerWidth(true);
    const visibleWidth = $('.roulette-container').width();

    // Calcula a posição alvo usando o winnerIndex do back-end
    const totalItems = displayItems.length;
    const midCycle = Math.floor(totalItems / 2); 
    const targetIndex = midCycle + winnerIndex; 

    const startPos = 0;
    const targetPos = -(targetIndex * itemWidth - visibleWidth / 2 + itemWidth / 2); 

    // Resetar transform
    $roulette.css('transform', `translateX(${startPos}px)`);

    // Animar roleta
    $roulette.addClass('spinning');
    $({ x: startPos }).animate({ x: targetPos }, {
        duration: 10000, // Duração de 5 segundos para melhor efeito visual
        easing: 'easeOutCubic',
        step: function (now) {
            $roulette.css('transform', `translateX(${now}px)`);
        },
        complete: function () {
            $roulette.removeClass('spinning');
            $spinBtn.prop('disabled', false).text('GIRAR ROLETA'); // Re-habilita o botão
            // Mostra o modal com o item sorteado e salvo pelo back-end
            showRewardModal(winnerItem); 
        }
    });
}


// ----------------- MODAL DE RECOMPENSA (CORRIGIDO) -----------------
function showRewardModal(item) {
    const $rewardImage = $('#rewardImage');
    const $rewardTitle = $('#rewardTitle');
    const $particles = $('#particles');

    // 1. Limpa o elemento antes de começar
    $rewardImage.removeAttr('src').removeAttr('style').removeClass('icon-mode');
    $rewardImage.parent().find('#rewardIcon').remove(); // Remove o ícone se existir

    if (item.imagem_url) {
        // CORREÇÃO AQUI: Apenas define o atributo 'src' na tag <img>
        $rewardImage.attr('src', item.imagem_url);
        // Garante que a imagem é visível e tem o estilo correto
        $rewardImage.css({
            'max-width': '100%',
            'height': '220px', 
            'object-fit': 'contain' // Usa 'contain' como no .item img
        }).show(); 
    } else {
        // Se não houver URL, exibe o ícone de fallback
        let iconClass = "fas fa-question";
        if (item.tipo === "personagem") iconClass = "fas fa-user";
        if (item.tipo === "item") iconClass = "fas fa-shield-alt";
        
        // Esconde a tag <img> e insere um ícone alternativo no container
        $rewardImage.hide(); 
        const $icon = $(`<i id="rewardIcon" class="${iconClass}" style="position:relative; z-index:3; font-size:4rem; color:#773333; margin-top: 65px;"></i>`);
        $('.celebration').prepend($icon);
    }

    $rewardTitle.text(`🎉 Parabéns! Você ganhou: ${item.nome} 🎉`);
    $('#rewardModal').addClass('show');

    // gerar partículas de confete (CÓDIGO ORIGINAL MANTIDO)
    $particles.empty();
    for (let i = 0; i < 30; i++) {
        const sz = Math.random() * 8 + 4;
        const dx = (Math.random() - 0.5) * 200;
        const dy = (Math.random() - 0.5) * 200;
        const rot = Math.random() * 360;
        const col = `hsl(${Math.random() * 360}, 80%, 60%)`;
        const $p = $('<div class="particle"></div>').css({
            '--sz': sz + 'px',
            '--dx': dx + 'px',
            '--dy': dy + 'px',
            '--rot': rot + 'deg',
            '--col': col
        });
        $particles.append($p);
    }
}

// ----------------- FECHAR MODAL (MANTIDO) -----------------
$('#closeModalBtn').on('click', function () {
    $('#rewardModal').removeClass('show');
});

// ----------------- CARREGAR ITENS VIA AJAX (MANTIDO) -----------------
$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const bannerId = urlParams.get('bannerId');
    if (!bannerId) { alert('Banner não especificado!'); return; }

    const token = obterCookie('token');
    $.ajax({
        url: `http://127.0.0.1:8000/api/banners-boxes/${bannerId}`,
        type: 'GET',
        headers: { "Authorization": "Bearer " + token },
        success: function(response) {
            const items = response.exclusivos
                .filter(i => i.tipo && i.tipo.toLowerCase() === 'item')
                .map(i => ({
                    id: i.id,
                    nome: i.nome,
                    imagem_url: i.imagem_url,
                    raridade: i.raridade,
                    tipo: i.tipo,
                    // Garante que o front-end está ciente da taxa de drop, embora o sorteio seja no back-end
                    taxa_drop: i.pivot_taxa_drop 
                }));
            window.allItems = items;
            populateRoulette(items);
        },
        error: function(xhr) {
            alert('Erro ao carregar o banner: ' + xhr.responseText);
        }
    });
});

// ----------------- ANIMAÇÃO EASING CUSTOM (MANTIDO) -----------------
$.easing['easeOutCubic'] = function (x, t, b, c, d) {
    return c*((t=t/d-1)*t*t + 1) + b;
};