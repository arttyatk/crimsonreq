/* ---------- CONFIG/SETUP AJAX ---------- */
// Variáveis Globais 
let inventoryData = [];
let currentIndex = 0;
let autoplay = false;
let autoplayInterval = null;
const AUTOPLAY_DELAY = 3000;

// Mapeamento das cores de raridade para o CSS
const RARIDADE_CORES = {
    'comum': '#5c5c5c',
    'incomum': '#90ee90',
    'raro': '#32a852',
    'epico': '#8a2be2',
    'legendario': '#ffd700'
};

/* ---------------------------------------------------- */
/* ---------- FUNÇÕES AUXILIARES DE AUTENTICAÇÃO ---------- */
/* ---------------------------------------------------- */

// Função para obter o cookie
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
    console.log('Iniciando carregamento do inventário...');
    
    if (!verificarAutenticacao()) {
        return;
    }

    const userId = obterCookie('user_id'); 
    const token = obterCookie('token');
    
    if (!userId || !token) {
        console.error("Erro: ID de usuário ou token de autenticação não encontrado.");
        inventoryData = [{ 
            title: "Erro de Login", 
            desc: "Faça login para ver seu inventário.", 
            raridade: 'comum',
            tipo: 'erro',
            quantidade: 0
        }];
        buildCards();
        return;
    }

    console.log('Fazendo requisição para API...');
    
    $.ajax({
        url: `http://127.0.0.1:8000/api/inventario/${userId}`, 
        type: 'GET',
        headers: { 
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        success: function(response) {
            console.log('Resposta completa da API:', response);
            
            // CORREÇÃO AQUI: Acessa a propriedade 'inventario' do response
            const inventario = response.inventario;
            console.log('Dados do inventário:', inventario);
            
            if (!inventario || inventario.length === 0) {
                console.log('Inventário vazio');
                inventoryData = [{ 
                    title: "Inventário Vazio", 
                    desc: "Gire a roleta para adicionar itens!", 
                    raridade: 'comum',
                    tipo: 'vazio',
                    quantidade: 0
                }];
                buildCards();
                return;
            }

            // CORREÇÃO: Mapeia o array 'inventario' em vez do 'response'
            const mappedData = inventario.map(item => {
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
                    habilidades: item.item_info.habilidades || [],
                    passivas: item.item_info.passivas || []
                };
            }).filter(item => item !== null);

            console.log('Dados mapeados para exibição:', mappedData);

            if (mappedData.length === 0) {
                inventoryData = [{ 
                    title: "Inventário Vazio", 
                    desc: "Gire a roleta para adicionar itens!", 
                    raridade: 'comum',
                    tipo: 'vazio',
                    quantidade: 0
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
                raridade: 'comum',
                tipo: 'erro',
                quantidade: 0
            }];
            buildCards();
        }
    });
}

/* ---------------------------------------------------- */
/* ---------- build cards (renderização de HTML) ---------- */
/* ---------------------------------------------------- */

function buildCards() {
    console.log('buildCards chamado, dados:', inventoryData);
    
    if (!coverflow) {
        console.error("Elemento coverflow não encontrado!");
        return;
    }
    
    coverflow.innerHTML = '';
    
    const dataToUse = inventoryData;

    if (!dataToUse || dataToUse.length === 0) {
        coverflow.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 4rem; margin-bottom: 20px;">📦</div>
                <h3>Inventário Vazio</h3>
                <p>Gire a roleta para adicionar itens!</p>
            </div>
        `;
        items = [];
        createDots();
        updateCoverflow();
        return;
    }

    dataToUse.forEach((d, i) => {
        const item = document.createElement('div');
        item.className = 'coverflow-item';
        item.dataset.index = i;

        let figureContent = '';
        if (d.imageUrl && d.imageUrl !== 'undefined') {
            figureContent = `<img src="${d.imageUrl}" alt="${d.title}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
        } else {
            const iconClass = d.tipo === 'personagem' ? 'fa-user-alt' : 
                            d.tipo === 'item' ? 'fa-box-open' : 'fa-info-circle';
            figureContent = `<i class="fas ${iconClass}" style="font-size:3rem;"></i>`;
        }

        const raridade = d.raridade ? d.raridade.toLowerCase() : 'comum';
        const baseColor = RARIDADE_CORES[raridade] || RARIDADE_CORES['comum'];
        
        const cardFigureStyle = `
            background: linear-gradient(135deg, ${baseColor}33, ${baseColor}11);
            border: 1px solid ${baseColor}44;
            color: ${baseColor};
            display: flex;
            align-items: center;
            justify-content: center;
            height: 220px;
            flex-shrink: 0;
        `;

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

        item.innerHTML = `
            <div class="card" style="height: 520px; display: flex; flex-direction: column; overflow: hidden;">
                <div class="card-figure" style="${cardFigureStyle}">
                    ${figureContent}
                </div>
                
                <div class="card-details" style="padding: 0 12px; flex-grow: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;">
                    
                    <div style="flex-shrink: 0; padding: 15px 0; border-bottom: 1px solid ${baseColor}15;">
                        <h3 style="color:${baseColor}; margin:0; font-size:1.2rem; text-align:center; font-weight:bold;">
                            ${d.title || 'Item Sem Nome'}
                        </h3>
                    </div>
                    
                    <div class="scrollable-wrapper" style="flex: 1; overflow: hidden;">
                        <div class="scrollable-content" style="height: 100%; overflow-y: auto; padding: 15px 8px 60px 0;">
                            ${habilidadesContent}
                            ${passivasContent}
                            
                            <!-- Informações básicas sempre visíveis -->
                            <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                                <div style="font-size: 0.8rem; color: #e0e0e0;">
                                    <div><strong>Quantidade:</strong> ${d.quantidade || 0}</div>
                                    <div><strong>Tipo:</strong> ${d.tipo || 'N/A'}</div>
                                    <div><strong>Raridade:</strong> ${d.raridade || 'comum'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        item.addEventListener('click', () => goTo(i));
        coverflow.appendChild(item);
    });

    items = Array.from(document.querySelectorAll('.coverflow-item'));
    currentIndex = 0; 
    createDots();
    updateCoverflow();
    
    console.log('Cards construídos:', items.length);
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
    if (dotsContainer) {
        Array.from(dotsContainer.children).forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }
    
    const activeData = inventoryData[currentIndex];
    if (activeData && titleEl && descEl) {
        titleEl.textContent = activeData.title;
        
        const raridade = activeData.raridade ? activeData.raridade.toLowerCase() : 'comum';
        const baseColor = RARIDADE_CORES[raridade] || RARIDADE_CORES['comum'];
        titleEl.style.color = baseColor;
        
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
    console.log('Documento pronto, inicializando...');
    
    if (!verificarAutenticacao()) {
        return;
    }
    
    loadInventory();
    
    if (wrapper) {
        wrapper.focus();
    }
    
    document.body.style.overflowX = 'hidden';
});

// Adiciona event listeners para navegação
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

// Adiciona CSS personalizado para Font Awesome
const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
document.head.appendChild(fontAwesome);