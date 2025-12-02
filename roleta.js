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
        showCustomAlert('warning', 'Atenção!', 'Você precisa estar logado para girar a roleta!');
        return false;
    }
    return true;
}

// ---------------- SISTEMA DE ALERTAS PERSONALIZADOS ----------------
function showCustomAlert(type, title, message) {
    const $alert = $('#customAlert');
    const $overlay = $('#alertOverlay');
    const $icon = $('#alertIcon');
    const $alertTitle = $('#alertTitle');
    const $alertMessage = $('#alertMessage');
    
    // Define ícone baseado no tipo
    const icons = {
        'error': '❌',
        'warning': '⚠️',
        'success': '✅',
        'info': 'ℹ️'
    };
    
    // Remove todas as classes de tipo anteriores
    $alert.removeClass('error warning success info');
    // Adiciona a classe do tipo atual
    $alert.addClass(type);
    
    // Define conteúdo
    $icon.text(icons[type] || '⚠️');
    $alertTitle.text(title);
    $alertMessage.text(message);
    
    // Animação com GSAP
    gsap.killTweensOf([$alert[0], $overlay[0]]);
    
    // Mostra overlay e alerta
    gsap.timeline()
        .set($overlay[0], { display: 'block' })
        .set($alert[0], { display: 'block' })
        .to($overlay[0], {
            duration: 0.3,
            opacity: 1,
            ease: "power2.out"
        })
        .to($alert[0], {
            duration: 0.4,
            opacity: 1,
            scale: 1,
            ease: "back.out(1.7)",
            onStart: () => {
                $overlay.addClass('show');
                $alert.addClass('show');
            }
        }, "-=0.2");
}

function hideCustomAlert() {
    const $alert = $('#customAlert');
    const $overlay = $('#alertOverlay');
    
    gsap.timeline()
        .to($alert[0], {
            duration: 0.3,
            opacity: 0,
            scale: 0.8,
            ease: "power2.in"
        })
        .to($overlay[0], {
            duration: 0.3,
            opacity: 0,
            ease: "power2.out",
            onComplete: () => {
                $overlay.removeClass('show');
                $alert.removeClass('show');
                $overlay[0].style.display = 'none';
                $alert[0].style.display = 'none';
            }
        }, "-=0.2");
}

// ---------------- VARIÁVEIS GLOBAIS ----------------
let bannerPreco = 150; // Valor padrão, será atualizado ao carregar o banner
let userStarCoins = 0;

// ---------------- FUNÇÃO PARA CARREGAR MOEDAS DO USUÁRIO ----------------
function carregarMoedasUsuario() {
    const token = obterCookie('token');
    const userId = obterCookie('user_id');
    
    if (!token || !userId) {
        console.log('Usuário não autenticado');
        return;
    }

    $.ajax({
        url: `http://127.0.0.1:8000/api/inventario/${userId}`,
        type: 'GET',
        headers: { "Authorization": "Bearer " + token },
        success: function(response) {
            console.log('Resposta completa do inventário:', response);
            
            const starCoins = response.user_info?.star_coins || 0;
            console.log('Star Coins do usuário:', starCoins);
            
            // Atualiza o display de moedas
            $('#coinAmount').text(starCoins);
            
            // Atualiza o saldo global
            window.userStarCoins = starCoins;
            userStarCoins = starCoins;
            
            // Verifica se tem moedas suficientes e atualiza o botão
            atualizarEstadoBotao(starCoins);
        },
        error: function(xhr) {
            console.error('Erro ao carregar moedas:', xhr.responseText);
            $('#coinAmount').text('Erro');
        }
    });
}

// ---------------- FUNÇÃO PARA ATUALIZAR ESTADO DO BOTÃO ----------------
function atualizarEstadoBotao(starCoins) {
    const $spinBtn = $('#spinButton');
    const custo = bannerPreco;
    
    // Atualiza o display do custo - CORREÇÃO AQUI
    $('.coin-cost').text(`Custo: ${custo}`);
    
    if (starCoins < custo) {
        $spinBtn.prop('disabled', true)
               .text('MOEDAS INSUFICIENTES')
               .css('opacity', '0.6');
        
        $spinBtn.attr('title', `Você precisa de ${custo} Star Coins. Atual: ${starCoins}`);
    } else {
        $spinBtn.prop('disabled', false)
               .text('GIRAR ROLETA')
               .css('opacity', '1')
               .removeAttr('title');
    }
}

// ---------------- FUNÇÃO populateRoulette (ATUALIZADA) ----------------
function populateRoulette(items, bannerData) {
    const $roulette = $('#roulette');
    $roulette.empty();

    if (!items.length) return;

    // ATUALIZA O PREÇO DO BANNER - CORREÇÃO AQUI
    if (bannerData && bannerData.preco) {
        bannerPreco = parseFloat(bannerData.preco);
        console.log('Preço do banner carregado:', bannerPreco);
        
        // ATUALIZA O DISPLAY DO CUSTO IMEDIATAMENTE
        $('.coin-cost').text(`Custo: ${bannerPreco}`);
        
        // Atualiza o estado do botão com o novo preço
        atualizarEstadoBotao(userStarCoins);
    } else {
        console.log('Preço do banner não encontrado, usando padrão:', bannerPreco);
    }

    const raridadeCores = {
        'comum': '#FFFFFF',
        'incomum': '#90EE90',
        'raro': '#1E90FF',
        'epico': '#670a93ff',
        'legendario': '#fff200ff'
    };

    // Duplicar os itens para roleta longa
    const repeatCount = 10;
    let displayItems = [];
    for (let r = 0; r < repeatCount; r++) {
        displayItems = displayItems.concat(items);
    }

    // Criar os itens
    displayItems.forEach(item => {
        let content;
        
        if (item.imagem_url) {
            content = `
                <div class="item-image-container">
                    <img src="${item.imagem_url}" alt="${item.nome}" class="roulette-item-image">
                </div>
            `;
        } else {
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
        $itemDiv.css('border-color', raridadeCores[item.raridade?.toLowerCase()] || '#FFF');
        $roulette.append($itemDiv);
    });

    const $spinBtn = $('#spinButton');
    $spinBtn.off('click').on('click', function () {
        if (!verificarAutenticacao()) return;

        // Verifica saldo novamente antes de girar (AGORA USA O PREÇO DO BANNER)
        if (window.userStarCoins < bannerPreco) {
            showCustomAlert(
                'warning', 
                'Saldo Insuficiente!', 
                `Você precisa de ${bannerPreco} Star Coins.\nSeu saldo: ${window.userStarCoins}`
            );
            return;
        }

        // Desabilita o botão para prevenir múltiplos cliques
        $spinBtn.prop('disabled', true).text('GIRANDO...'); 

        const urlParams = new URLSearchParams(window.location.search);
        const bannerId = urlParams.get('bannerId');
        const token = obterCookie('token');

        $.ajax({
            url: `http://127.0.0.1:8000/api/gacha/spin/${bannerId}`, 
            type: 'POST',
            headers: { "Authorization": "Bearer " + token },
            // NO SUCCESS DO AJAX, ATUALIZE PARA:
            success: function(response) {
                console.log('Resposta do spin:', response);
                
                const winnerItem = response.items && response.items.length > 0 ? response.items[0] : null;
                const winnerIndex = response.winnerIndex || 0;
                
                if (!winnerItem) {
                    showCustomAlert('error', 'Erro!', 'Nenhum item foi sorteado.');
                    $spinBtn.prop('disabled', false).text('GIRAR ROLETA');
                    return;
                }
                
                // ATUALIZA AS MOEDAS COM A RESPOSTA DO SERVIDOR
                if (response.novo_saldo_star_coins !== undefined) {
                    $('#coinAmount').text(response.novo_saldo_star_coins);
                    window.userStarCoins = response.novo_saldo_star_coins;
                    userStarCoins = response.novo_saldo_star_coins;
                    atualizarEstadoBotao(response.novo_saldo_star_coins);
                }
                
                // Inicia a animação
                animateRoulette(items, displayItems, winnerIndex, winnerItem, $roulette, $spinBtn);
                
                // Mostra informações sobre moedas geradas se houver
                if (response.total_moedas_geradas > 0) {
                    console.log(`Total de moedas geradas: ${response.total_moedas_geradas}`);
                }
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON?.message || xhr.responseText;
                showCustomAlert('error', 'Erro!', 'Erro ao girar a roleta: ' + errorMsg);
                
                // Se o erro for por saldo insuficiente, atualiza as moedas
                if (xhr.status === 403 && xhr.responseJSON?.current_coins !== undefined) {
                    $('#coinAmount').text(xhr.responseJSON.current_coins);
                    window.userStarCoins = xhr.responseJSON.current_coins;
                    userStarCoins = xhr.responseJSON.current_coins;
                    atualizarEstadoBotao(xhr.responseJSON.current_coins);
                }
                
                $spinBtn.prop('disabled', false).text('GIRAR ROLETA');
            }
        });
    });
}


// ---------------- FUNÇÃO DE ANIMAÇÃO CORRIGIDA ----------------
function animateRoulette(items, displayItems, winnerIndex, winnerItem, $roulette, $spinBtn) {
    const itemWidth = $('.item').outerWidth(true);
    const visibleWidth = $('.roulette-container').width();

    const totalItems = displayItems.length;
    
    // CORREÇÃO: Calcular a posição de destino baseada no item vencedor
    // Encontrar todas as ocorrências do item vencedor na lista de display
    const winnerPositions = [];
    displayItems.forEach((item, index) => {
        if (item.id === winnerItem.id) {
            winnerPositions.push(index);
        }
    });
    
    // Escolher uma posição que fique bem visível no final da animação
    let targetIndex;
    if (winnerPositions.length > 0) {
        // Escolher uma posição que esteja na segunda metade para dar sensação de rotação completa
        const midPoint = Math.floor(totalItems * 0.7);
        const validPositions = winnerPositions.filter(pos => pos >= midPoint);
        targetIndex = validPositions.length > 0 ? validPositions[0] : winnerPositions[winnerPositions.length - 1];
    } else {
        // Fallback: usar cálculo baseado no índice
        const midCycle = Math.floor(totalItems / 2); 
        targetIndex = midCycle + (winnerIndex % items.length);
    }

    const startPos = 0;
    const targetPos = -(targetIndex * itemWidth - visibleWidth / 2 + itemWidth / 2); 

    console.log('Animação iniciada:', { 
        itemWidth, 
        visibleWidth, 
        totalItems, 
        targetIndex, 
        targetPos,
        winnerItem: winnerItem.nome,
        winnerIndex 
    });

    $roulette.css('transform', `translateX(${startPos}px)`);

    $roulette.addClass('spinning');
    $({ x: startPos }).animate({ x: targetPos }, {
        duration: 4000, // Reduzido para 4 segundos para ser mais responsivo
        easing: 'easeOutCubic',
        step: function (now) {
            $roulette.css('transform', `translateX(${now}px)`);
        },
        complete: function () {
            $roulette.removeClass('spinning');
            $spinBtn.prop('disabled', false).text('GIRAR ROLETA');
            showRewardModal(winnerItem); 
        }
    });
}

// ----------------- MODAL DE RECOMPENSA -----------------
function showRewardModal(item) {
    const $rewardImage = $('#rewardImage');
    const $rewardTitle = $('#rewardTitle');
    const $rewardSubtitle = $('#rewardSubtitle');
    const $particles = $('#particles');

    $rewardImage.removeAttr('src').removeAttr('style').removeClass('icon-mode');
    $rewardImage.parent().find('#rewardIcon').remove();

    // Limpa o subtítulo
    $rewardSubtitle.text('');

    if (item.imagem_url) {
        $rewardImage.attr('src', item.imagem_url);
        $rewardImage.css({
            'max-width': '100%',
            'height': '220px', 
            'object-fit': 'contain'
        }).show(); 
    } else {
        let iconClass = "fas fa-question";
        if (item.tipo === "personagem") iconClass = "fas fa-user";
        if (item.tipo === "item") iconClass = "fas fa-shield-alt";
        
        $rewardImage.hide(); 
        const $icon = $(`<i id="rewardIcon" class="${iconClass}" style="position:relative; z-index:3; font-size:4rem; color:#773333; margin-top: 65px;"></i>`);
        $('.celebration').prepend($icon);
    }

    $rewardTitle.text(`🎉 Parabéns! Você ganhou: ${item.nome} 🎉`);
    $('#rewardModal').addClass('show');

    // gerar partículas de confete
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

// ----------------- FECHAR MODAL -----------------
$('#closeModalBtn').on('click', function () {
    $('#rewardModal').removeClass('show');
    // Limpa o subtítulo quando fecha o modal
    $('#rewardSubtitle').text('');
});

// ----------------- CARREGAR ITENS E MOEDAS AO INICIAR -----------------
$(document).ready(function () {
    // Configura evento do botão do alerta
    $('#alertButton').on('click', hideCustomAlert);
    
    // Fecha alerta ao clicar no overlay
    $('#alertOverlay').on('click', hideCustomAlert);
    
    // Fecha alerta com ESC
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#alertOverlay').hasClass('show')) {
            hideCustomAlert();
        }
    });

    // Primeiro carrega as moedas do usuário
    carregarMoedasUsuario();
    
    // Depois carrega os itens do banner
    const urlParams = new URLSearchParams(window.location.search);
    const bannerId = urlParams.get('bannerId');
    if (!bannerId) { 
        showCustomAlert('error', 'Erro!', 'Banner não especificado!');
        return; 
    }

    const token = obterCookie('token');
    $.ajax({
        url: `http://127.0.0.1:8000/api/banners-boxes/${bannerId}`,
        type: 'GET',
        headers: { "Authorization": "Bearer " + token },
        success: function(response) {
            console.log('Dados completos do banner:', response);
            
            const bannerData = response.banner;
            
            // DEBUG: Verificar a estrutura dos dados
            console.log('Estrutura do banner:', bannerData);
            console.log('Preço do banner:', bannerData?.preco);
            
            // ATUALIZA O CUSTO VISUAL IMEDIATAMENTE - CORREÇÃO AQUI
            if (bannerData && bannerData.preco) {
                bannerPreco = parseFloat(bannerData.preco);
                console.log('Preço atualizado para:', bannerPreco);
                $('.coin-cost').text(`Custo: ${bannerPreco}`);
            } else {
                console.log('Preço não encontrado, usando padrão:', bannerPreco);
            }
            
            const items = response.exclusivos
                .filter(i => i.tipo && i.tipo.toLowerCase() === 'item')
                .map(i => ({
                    id: i.id,
                    nome: i.nome,
                    imagem_url: i.imagem_url,
                    raridade: i.raridade,
                    tipo: i.tipo,
                    taxa_drop: i.pivot_taxa_drop,
                    star_coin_reward: i.star_coin_reward
                }));
            
            console.log('Itens carregados:', items.length);
            window.allItems = items;
            
            // Atualiza o estado do botão com o preço correto
            atualizarEstadoBotao(userStarCoins);
            
            populateRoulette(items, bannerData);
        },
        error: function(xhr) {
            console.error('Erro ao carregar banner:', xhr);
            showCustomAlert('error', 'Erro!', 'Erro ao carregar o banner: ' + xhr.responseText);
        }
    });
});

// ----------------- ANIMAÇÃO EASING CUSTOM -----------------
$.easing['easeOutCubic'] = function (x, t, b, c, d) {
    return c*((t=t/d-1)*t*t + 1) + b;
};

// Adiciona Font Awesome para os ícones
const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
document.head.appendChild(fontAwesome);