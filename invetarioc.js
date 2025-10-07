/* ---------- CONFIG/SETUP AJAX ---------- */
// Variáveis Globais 
let inventoryData = [];
let currentIndex = 0;
let autoplay = false;
let autoplayInterval = null;
const AUTOPLAY_DELAY = 3000;

// Mapeamento das cores de raridade para o CSS
const RARIDADE_CORES = {
    'comum': '#5c5c5c',      // Cinza
    'incomum': '#90ee90',    // Verde Claro
    'raro': '#32a852',       // Verde Forte
    'epico': '#8a2be2',      // Roxo
    'legendario': '#ffd700'  // Amarelo Dourado
};

/* ---------------------------------------------------- */
/* ---------- FUNÇÕES AUXILIARES DE AUTENTICAÇÃO ---------- */
/* ---------------------------------------------------- */

// Função para obter o cookie (essencial para autenticação)
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

/* ---------------------------------------------------- */
/* ---------- FUNÇÕES AUXILIARES DE IMAGEM ---------- */
/* ---------------------------------------------------- */

function getFullImageUrl(relativePath) {
    if (relativePath && !relativePath.startsWith('http')) {
        return `http://127.0.0.1:8000/storage/${relativePath}`;
    }
    return relativePath;
}

/* ---------- DOM refs ---------- */
const coverflow = document.getElementById('coverflow');
const wrapper = document.getElementById('wrapper');
const dotsContainer = document.getElementById('dots');
const autoplayBtn = document.getElementById('autoplayBtn');
const titleEl = document.getElementById('current-title');
const descEl = document.getElementById('current-description');
let items = [];

/* ---------------------------------------------------- */
/* ---------- FUNÇÃO PRINCIPAL: CARREGAR INVENTÁRIO ---------- */
/* ---------------------------------------------------- */

function loadInventory() {
    // Inicia a verificação de autenticação
    if (!verificarAutenticacao()) {
        return;
    }

    const userId = obterCookie('user_id'); 
    const token = obterCookie('token');     
    
    if (!userId || !token) {
        console.error("Erro: ID de usuário ou token de autenticação não encontrado.");
        buildCards([{ title: "Erro de Login", desc: "Faça login para ver seu inventário.", raridade: 'comum' }]);
        return;
    }

    // Requisição AJAX
    $.ajax({
        url: `http://127.0.0.1:8000/api/inventario/${userId}`, 
        type: 'GET',
        headers: { 
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        success: function(response) {
            
            // Verifica se a resposta tem a estrutura esperada
            if (!response || response.length === 0) {
                inventoryData = [{ 
                    title: "Inventário Vazio", 
                    desc: "Gire a roleta para adicionar itens!", 
                    raridade: 'comum' 
                }];
                buildCards();
                return;
            }

            const mappedData = response.map(item => {
                // Verifica se item_info existe
                if (!item.item_info) {
                    console.warn("Item sem item_info:", item);
                    return null;
                }

                return {
                    id: item.gacha_item_id,
                    title: item.item_info.nome, 
                    desc: `Quantidade: ${item.quantidade} | Tipo: ${item.item_info.tipo} | Raridade: ${item.item_info.raridade}`,
                    imageUrl: getFullImageUrl(item.item_info.imagem_url), 
                    raridade: item.item_info.raridade,
                    tipo: item.item_info.tipo,
                    quantidade: item.quantidade,
                    // Novos campos para habilidades e passivas
                    habilidades: item.item_info.habilidades || [],
                    passivas: item.item_info.passivas || []
                };
            }).filter(item => item !== null); // Remove itens nulos

            if (mappedData.length === 0) {
                inventoryData = [{ 
                    title: "Inventário Vazio", 
                    desc: "Gire a roleta para adicionar itens!", 
                    raridade: 'comum' 
                }];
            } else {
                inventoryData = mappedData;
            }

            buildCards();
        },
        error: function(xhr) {
            console.error("Erro ao carregar inventário:", xhr.responseText);
            
            if (xhr.status === 401 || xhr.status === 403) {
                verificarAutenticacao();
                return;
            }
            
            let errorMessage = "Falha ao buscar dados do servidor.";
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }
            
            inventoryData = [{ 
                title: "Erro", 
                desc: errorMessage, 
                raridade: 'comum' 
            }];
            buildCards();
        }
    });
}

/* ---------------------------------------------------- */
/* ---------- build cards (renderização de HTML) ---------- */
/* ---------------------------------------------------- */
/* ---------------------------------------------------- */
/* ---------- build cards (renderização de HTML) ---------- */
/* ---------------------------------------------------- */

function buildCards() {
    if (!coverflow) {
        console.error("Elemento coverflow não encontrado!");
        return;
    }
    
    coverflow.innerHTML = '';
    
    const dataToUse = inventoryData;

    dataToUse.forEach((d, i) => {
        const item = document.createElement('div');
        item.className = 'coverflow-item';
        item.dataset.index = i;

        // 1. Lógica de Conteúdo Visual (Imagem/Ícone)
        let figureContent = '';
        if (d.imageUrl) {
             figureContent = `<img src="${d.imageUrl}" alt="${d.title}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
        } else if (d.tipo === 'personagem') {
             figureContent = `<i class="fas fa-user-alt" style="font-size:3rem;"></i>`;
        } else if (d.tipo === 'item') {
             figureContent = `<i class="fas fa-box-open" style="font-size:3rem;"></i>`;
        } else {
             figureContent = `<i class="fas fa-info-circle" style="font-size:3rem;"></i>`;
        }

        // 2. Lógica de Cor de Raridade (Fundo e Destaques)
        const raridade = d.raridade ? d.raridade.toLowerCase() : 'comum';
        const baseColor = RARIDADE_CORES[raridade] || RARIDADE_CORES['comum'];
        
        // Aplica o fundo suave no card-figure (transparente)
        const cardFigureStyle = `
            background: linear-gradient(135deg, ${baseColor}33, ${baseColor}11); 
            border: 1px solid ${baseColor}44;
            color: ${baseColor};
            display: flex;
            align-items: center;
            justify-content: center;
            height: 220px;  /* Aumentei de 180px para 220px */
            flex-shrink: 0;
        `;

        // 3. Conteúdo das Habilidades e Passivas para o card
        let habilidadesContent = '';
        if (d.habilidades && d.habilidades.length > 0) {
            habilidadesContent = `
                <div class="skills-section">
                    <div style="color:${baseColor}; font-size:0.85rem; font-weight:bold; margin-bottom:10px; display:flex; align-items:center;">
                        <i class="fas fa-fire" style="margin-right:8px; font-size:0.8rem;"></i>Habilidades
                    </div>
                    <div style="font-size:0.8rem; color:#e0e0e0; line-height:1.4;">
                        ${d.habilidades.map(skill => 
                            `<div style="margin-bottom:8px; padding:6px 8px; background:${baseColor}15; border-radius:5px; border-left: 3px solid ${baseColor};">
                                • ${skill}
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        let passivasContent = '';
        if (d.passivas && d.passivas.length > 0) {
            passivasContent = `
                <div class="passives-section" style="margin-top: 20px;">
                    <div style="color:${baseColor}; font-size:0.85rem; font-weight:bold; margin-bottom:10px; display:flex; align-items:center;">
                        <i class="fas fa-shield-alt" style="margin-right:8px; font-size:0.8rem;"></i>Passivas
                    </div>
                    <div style="font-size:0.8rem; color:#e0e0e0; line-height:1.4;">
                        ${d.passivas.map(passive => 
                            `<div style="margin-bottom:8px; padding:6px 8px; background:${baseColor}15; border-radius:5px; border-left: 3px solid ${baseColor};">
                                • ${passive}
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        // Aplica o sombreamento na DIV principal
        item.style.boxShadow = `0 18px 40px ${baseColor}44`;

        item.innerHTML = `
            <div class="card" style="height: 520px; display: flex; flex-direction: column; overflow: hidden;">
                <div class="card-figure" style="${cardFigureStyle}">
                    ${figureContent}
                </div>
                
                <div class="card-details" style="padding: 0 12px; flex-grow: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; background:transparent;">
                    
                    <div style="flex-shrink: 0; padding: 15px 0; border-bottom: 1px solid ${baseColor}15;">
                        <h3 style="color:${baseColor}; margin:0; font-size:1.2rem; text-align:center; font-weight:bold;">
                            ${d.title}
                        </h3>
                    </div>
                    
                    <div class="scrollable-wrapper" style="flex: 1; overflow: hidden;">
                        <div class="scrollable-content" style="
                            height: 100%; 
                            overflow-y: auto; 
                            padding: 15px 8px 60px 0;
                        ">
                            ${habilidadesContent}
                            ${passivasContent}
                        </div>
                    </div>
                </div>
            </div>
        `;
        item.addEventListener('click', ()=> goTo(i));
        coverflow.appendChild(item);
    });

    items = Array.from(document.querySelectorAll('.coverflow-item'));
    currentIndex = 0; 
    createDots();
    updateCoverflow();
}

/* ---------------------------------------------------- */
/* ---------- FUNÇÕES DE NAVEGAÇÃO E ANIMAÇÃO ---------- */
/* ---------------------------------------------------- */

function createDots(){
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    inventoryData.forEach((_,i)=>{
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (i === currentIndex) dot.classList.add('active');
        dot.addEventListener('click', ()=> goTo(i));
        dotsContainer.appendChild(dot);
    });
}

function updateCoverflow(){
    if (!items.length) return;
    
    const itemW = items[0].offsetWidth;
    const gap = Math.min(280, itemW * 1.1); 
    const depth = Math.round(itemW * 0.45);
    const angle = 32;
    const maxVisible = 3; 
    const totalItems = inventoryData.length;

    items.forEach((item, idx) => {
        const offset = idx - currentIndex;
        
        let adjustedOffset = offset;
        if (offset > totalItems / 2) adjustedOffset = offset - totalItems;
        if (offset < -totalItems / 2) adjustedOffset = offset + totalItems;

        const absOffset = Math.abs(adjustedOffset);

        if (absOffset > maxVisible) {
            item.style.opacity = '0';
            item.style.pointerEvents = 'none';
            return;
        }

        const tx = adjustedOffset * gap;
        const tz = -absOffset * depth;
        const rotateY = adjustedOffset * -angle;
        const scale = Math.max(0.55, 1 - absOffset * 0.12);
        const opacity = Math.max(0.12, 1 - absOffset * 0.26);

        item.style.transform = `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${rotateY}deg) scale(${scale})`;
        item.style.zIndex = 1000 - absOffset;
        item.style.opacity = opacity;
        item.style.pointerEvents = absOffset > 2 ? 'none' : 'auto';
        item.style.visibility = 'visible';
    });

    updateDotsAndInfo();
}

function updateDotsAndInfo(){
    // Atualiza dots
    if (dotsContainer) {
        Array.from(dotsContainer.children).forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }
    
    // Atualiza informações do item atual (EM CIMA: Nome, Quantidade, Tipo, Raridade)
    const activeData = inventoryData[currentIndex];
    if (activeData && titleEl && descEl) {
        titleEl.textContent = activeData.title;
        
        const raridade = activeData.raridade ? activeData.raridade.toLowerCase() : 'comum';
        const baseColor = RARIDADE_CORES[raridade] || RARIDADE_CORES['comum'];
        titleEl.style.color = baseColor;
        
        // MANTÉM EM CIMA: Quantidade, Tipo e Raridade
        descEl.textContent = `Quantidade: ${activeData.quantidade} | Tipo: ${activeData.tipo} | Raridade: ${activeData.raridade}`;
    }
}

/* ---------- navigation ---------- */
function prev(){
    currentIndex = (currentIndex - 1 + inventoryData.length) % inventoryData.length;
    updateCoverflow();
    resetAutoplayIfOn();
}

function next(){
    currentIndex = (currentIndex + 1) % inventoryData.length;
    updateCoverflow();
    resetAutoplayIfOn();
}

function goTo(index){
    currentIndex = (index + inventoryData.length) % inventoryData.length;
    updateCoverflow();
    resetAutoplayIfOn();
}

/* ---------------------------------------------------- */
/* ---------- FUNÇÕES AUTOPLAY/CONTROLES/EVENTOS ---------- */
/* ---------------------------------------------------- */

function startAutoplay(){
    if (autoplayInterval) clearInterval(autoplayInterval);
    autoplayInterval = setInterval(() => next(), AUTOPLAY_DELAY);
    if (autoplayBtn) autoplayBtn.classList.add('active');
    autoplay = true;
}

function stopAutoplay(){
    if (autoplayInterval) clearInterval(autoplayInterval);
    autoplayInterval = null;
    if (autoplayBtn) autoplayBtn.classList.remove('active');
    autoplay = false;
}

function toggleAutoplay(){
    if (autoplay) {
        stopAutoplay();
    } else {
        startAutoplay();
    }
}

function resetAutoplayIfOn(){
    if (autoplay) {
        stopAutoplay();
        startAutoplay();
    }
}

/* ---------- touch/swipe ---------- */
let startX = 0;
let currentX = 0;

if (wrapper) {
    wrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        currentX = startX;
    });

    wrapper.addEventListener('touchmove', (e) => {
        currentX = e.touches[0].clientX;
    });

    wrapper.addEventListener('touchend', () => {
        const diff = currentX - startX;
        const threshold = 50;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                prev();
            } else {
                next();
            }
        }
    });

    /* ---------- keyboard ---------- */
    wrapper.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                prev();
                break;
            case 'ArrowRight':
                e.preventDefault();
                next();
                break;
            case ' ':
            case 'Spacebar':
                e.preventDefault();
                toggleAutoplay();
                break;
        }
    });

    // Foca no wrapper para capturar eventos de teclado
    wrapper.addEventListener('click', () => {
        wrapper.focus();
    });
}

/* ---------- resize ---------- */
window.addEventListener('resize', () => {
    updateCoverflow();
});

/* ---------- controls ---------- */
if (autoplayBtn) {
    autoplayBtn.addEventListener('click', toggleAutoplay);
}

/* ---------- init: COMEÇA AQUI ---------- */
$(document).ready(function() {
    // Inicia a verificação de autenticação
    if (!verificarAutenticacao()) {
        return;
    }
    
    // Carrega o inventário
    loadInventory();
    
    // Foca no wrapper para capturar eventos de teclado
    if (wrapper) {
        wrapper.focus();
    }
    
    document.body.style.overflowX = 'hidden';
});

// Adiciona event listeners para navegação por botões se existirem
$(document).on('click', '.prev-btn', function() {
    prev();
});

$(document).on('click', '.next-btn', function() {
    next();
});

// Event listener para logout
$(document).on('click', '#logoutBtn', function() {
    removerTodosCookies();
    window.location.href = 'login.html';
});

// Adiciona CSS personalizado para a scrollbar
const style = document.createElement('style');
style.textContent = `
    .scrollable-content {
        scrollbar-width: thin;
        scrollbar-color: rgba(192, 192, 192, 0.5) transparent;
    }
    
    .scrollable-content::-webkit-scrollbar {
        width: 8px;
    }
    
    .scrollable-content::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 4px;
    }
    
    .scrollable-content::-webkit-scrollbar-thumb {
        background: rgba(192, 192, 192, 0.5);
        border-radius: 4px;
    }
    
    .scrollable-content::-webkit-scrollbar-thumb:hover {
        background: rgba(160, 160, 160, 0.7);
    }
    
    /* Melhorias no design das habilidades e passivas */
    .skills-section, .passives-section {
        margin-bottom: 15px;
    }
    
    .card-details {
        background: transparent !important;
    }
    
    /* Garante que o card tenha altura suficiente */
    .coverflow-item .card {
        min-height: 520px;
    }
    
    /* Garante que o scroll funcione corretamente */
    .card {
        overflow: hidden !important;
    }
    
    .card-details {
        overflow: hidden !important;
    }
    
    /* Melhor espaçamento geral */
    .scrollable-content {
        padding-right: 10px;
    }
`;
document.head.appendChild(style);