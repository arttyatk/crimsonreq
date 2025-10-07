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

function deslogarUsuario() {
    removerTodosCookies();
    Swal.fire({
        title: 'Desconectado!',
        text: 'Você foi desconectado com sucesso.',
        icon: 'info',
        background: 'linear-gradient(135deg, var(--dark-charcoal) 0%, var(--black) 100%)',
        color: 'var(--text-light)',
        confirmButtonText: 'OK'
    }).then(() => {
        window.location.href = 'login.html';
    });
}

// ================= VARIÁVEIS GLOBAIS =================
let tabelaCrimsonInstance;

document.addEventListener('DOMContentLoaded', function() {
    if (!verificarAutenticacao()) {
        return;
    }

    // Inicializar partículas.js
    particlesJS('particles-js', {
        "particles": {
            "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#DC143C" },
            "shape": { "type": "circle", "stroke": { "width": 0, "color": "#DC143C" } },
            "opacity": { "value": 0.5, "random": false, "anim": { "enable": false } },
            "size": { "value": 3, "random": true, "anim": { "enable": false } },
            "line_linked": { "enable": true, "distance": 150, "color": "#8B0000", "opacity": 0.4, "width": 1 },
            "move": { "enable": true, "speed": 2 }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": { "enable": true, "mode": "grab" },
                "onclick": { "enable": true, "mode": "push" },
                "resize": true
            }
        },
        "retina_detect": true
    });

    // Inicializar DataTable
    tabelaCrimsonInstance = initDataTable();
    setupDeleteEvent(tabelaCrimsonInstance);
    setupEditEvent(tabelaCrimsonInstance);
});

// ================= INICIALIZAÇÃO DATATABLE =================
function initDataTable() {
    const userToken = obterCookie('token');
    
    if (!userToken) {
        console.error("Token de autenticação não encontrado.");
        return null;
    }

    const tabelaCrimson = $('#tabela_crimson').DataTable({
        processing: true,
        serverSide: false,
        responsive: true,
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.20/i18n/Portuguese-Brasil.json"
        },
        dom: '<"top-controls"lf>rt<"bottom-controls"ip>',
        ajax: {
            url: 'http://localhost:8000/api/retorna_itens',
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`
            },
            data: function (d) {
                d.user_id = obterCookie('user_id') || $("#user_id").val();
            },
            dataSrc: 'data'
        },
        columns: [
            { data: 'id', title: 'ID' },
            { data: 'nome', title: 'Nome' },
            { data: 'titulo', title: 'Título' },
            { 
                data: 'imagem', title: 'Imagem',
                render: function(data, type, row) {
                    // Corrigido: Garante que data não é nulo antes de usar startswith
                    const safeData = data || ''; 
                    let imagemUrl = safeData;
                    if (safeData && !safeData.startsWith('http')) {
                        imagemUrl = `http://localhost:8000/storage/${safeData}`;
                    }
                    return `<img src="${imagemUrl}" alt="Imagem do Item" style="max-height: 60px; max-width: 60px; border-radius: 8px; border: 1px solid var(--crimson); box-shadow: 0 0 10px rgba(220, 20, 60, 0.3);">`;
                }
            },
            { 
                data: 'raridade', title: 'Raridade',
                // ... código inalterado
            },
            { 
                data: 'descricao', title: 'Descrição',
                render: function(data, type, row) {
                    // Correção principal: Usa 'data || ""' para garantir que é uma string
                    const safeData = data || '';
                    return safeData.length > 50 ? safeData.substring(0, 50) + '...' : safeData;
                }
            },
            { 
                data: 'passivas', title: 'Passivas',
                render: function(data, type, row) {
                    // Correção principal: Usa 'data || ""'
                    const safeData = data || '';
                    return safeData.length > 30 ? safeData.substring(0, 30) + '...' : safeData;
                }
            },
            { 
                data: 'habilidades', title: 'Habilidades',
                render: function(data, type, row) {
                    // Correção principal: Usa 'data || ""'
                    const safeData = data || '';
                    return safeData.length > 30 ? safeData.substring(0, 30) + '...' : safeData;
                }
            },
            { 
                data: 'status', title: 'Status',
                render: function(data, type, row) {
                    const statusClass = data === 'Ativo' ? 'success' : 'secondary';
                    return `<span class="badge bg-${statusClass}">${data}</span>`;
                }
            },
            { 
                data: 'taxa_drop', title: 'Taxa de Drop',
                render: function(data, type, row) {
                    return `
                    <div class="progress" style="height: 20px; border-radius: 10px; background: var(--dark-gray);">
                        <div class="progress-bar bg-danger" role="progressbar" style="width: ${data}%; background: linear-gradient(90deg, var(--crimson-dark), var(--crimson)) !important;" aria-valuenow="${data}" aria-valuemin="0" aria-valuemax="100">
                            ${data}%
                        </div>
                    </div>`;
                }
            },
            { 
                data: 'id', title: 'Ações',
                render: function (data, type, row) {
                    const rowDataBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(row))));
                    return `
                    <div class="d-grid gap-2">
                        <button class="btn-action btn-edit alterar" data-id="${data}" data-row-b64="${rowDataBase64}">
                            <i class="bi bi-pencil-square"></i> Editar
                        </button>
                        <button class="btn-action btn-delete deletar" data-id="${data}">
                            <i class="bi bi-trash"></i> Excluir
                        </button>
                    </div>`;
                }
            }
        ],
        initComplete: function() {
            $('#tabela_crimson').fadeIn(1000);
            $('.top-controls').append($('.dataTables_length')).append($('.dataTables_filter'));
            $('.bottom-controls').append($('.dataTables_info')).append($('.dataTables_paginate'));
            applyFilters(tabelaCrimson);
        },
        drawCallback: function() {
            $('tbody tr').each(function(i) {
                $(this).delay(i * 100).fadeIn(500);
            });
        }
    });

    function applyFilters(tabela) {
        tabela.draw();
    }
    
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        return true;
    });
    
    $('#filter-rarity, #filter-status').on('change', function() {
        applyFilters(tabelaCrimson);
    });
    
    $('#filter-drop').on('input', function() {
        $('#drop-value').text($(this).val() + '%');
        applyFilters(tabelaCrimson);
    });
    
    return tabelaCrimson;
}

// ================= FUNÇÃO DE EXCLUSÃO =================
function setupDeleteEvent(tabela) {
    $('#tabela_crimson').on('click', '.deletar', function(e) {
        e.preventDefault();
        const itemId = $(this).data('id');
        const userToken = obterCookie('token');

        if (!userToken) {
            Swal.fire({
                title: 'Erro de Autenticação!',
                text: 'Token não encontrado. Faça login novamente.',
                icon: 'error',
                background: 'linear-gradient(135deg, var(--dark-charcoal) 0%, var(--black) 100%)',
                color: 'var(--text-light)',
                confirmButtonText: 'Entendi'
            });
            return;
        }

        Swal.fire({
            title: 'Tem certeza?',
            text: 'Esta ação não pode ser desfeita!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            background: 'linear-gradient(135deg, var(--dark-charcoal) 0%, var(--black) 100%)',
            color: 'var(--text-light)',
            customClass: {
                confirmButton: 'swal2-confirm',
                cancelButton: 'swal2-cancel'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `http://localhost:8000/api/gacha-items/${itemId}`,
                    type: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${userToken}`,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    },
                    success: function(response) {
                        Swal.fire({
                            title: 'Excluído!',
                            text: 'Item excluído com sucesso.',
                            icon: 'success',
                            background: 'linear-gradient(135deg, var(--dark-charcoal) 0%, var(--black) 100%)',
                            color: 'var(--text-light)',
                            confirmButtonText: 'OK',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        tabela.ajax.reload(null, false);
                    },
                    error: function(xhr, status, error) {
                        console.error('Erro no DELETE direto:', xhr);
                        
                        if (xhr.status === 405) {
                            $.ajax({
                                url: `http://localhost:8000/api/gacha-items/${itemId}`,
                                type: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${userToken}`,
                                    'Content-Type': 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'Accept': 'application/json'
                                },
                                data: JSON.stringify({
                                    _method: 'DELETE'
                                }),
                                success: function(response) {
                                    Swal.fire({
                                        title: 'Excluído!',
                                        text: 'Item excluído com sucesso.',
                                        icon: 'success',
                                        background: 'linear-gradient(135deg, var(--dark-charcoal) 0%, var(--black) 100%)',
                                        color: 'var(--text-light)',
                                        confirmButtonText: 'OK',
                                        timer: 2000,
                                        showConfirmButton: false
                                    });
                                    tabela.ajax.reload(null, false);
                                },
                                error: function(xhr2, status2, error2) {
                                    console.error('Erro no método alternativo:', xhr2);
                                    mostrarErroExclusao(xhr2);
                                }
                            });
                        } else {
                            mostrarErroExclusao(xhr);
                        }
                    }
                });
            }
        });
    });

    function mostrarErroExclusao(xhr) {
        let errorMessage = 'Não foi possível excluir o item.';
        
        if (xhr.status === 0) {
            errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
        } else if (xhr.status === 401) {
            errorMessage = 'Token de autenticação inválido ou expirado.';
        } else if (xhr.status === 403) {
            errorMessage = 'Acesso negado. Verifique suas permissões.';
        } else if (xhr.status === 404) {
            errorMessage = 'Item não encontrado.';
        } else if (xhr.responseJSON && xhr.responseJSON.message) {
            errorMessage = xhr.responseJSON.message;
        } else if (xhr.responseText) {
            errorMessage = xhr.responseText;
        }
        
        Swal.fire({
            title: 'Erro!',
            text: errorMessage,
            icon: 'error',
            background: 'linear-gradient(135deg, var(--dark-charcoal) 0%, var(--black) 100%)',
            color: 'var(--text-light)',
            confirmButtonText: 'Entendi'
        });
    }
}

// ================= FUNÇÃO DE EDIÇÃO =================
function setupEditEvent(tabela) {
    $('#tabela_crimson').on('click', '.alterar', function(e) {
        e.preventDefault();
        
        const rowDataBase64 = $(this).data('row-b64');
        let rowData;
       
        try {
            const jsonString = decodeURIComponent(escape(atob(rowDataBase64)));
            rowData = JSON.parse(jsonString);
        } catch (error) {
            console.error('Erro ao decodificar dados da linha:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível carregar os dados do item.',
                icon: 'error',
                background: 'linear-gradient(135deg, var(--dark-charcoal) 0%, var(--black) 100%)',
                color: 'var(--text-light)',
                confirmButtonText: 'Entendi'
            });
            return;
        }

        const userToken = obterCookie('token');
        if (!userToken) {
            Swal.fire({
                title: 'Erro de Autenticação!',
                text: 'Token não encontrado. Faça login novamente.',
                icon: 'error',
                background: 'linear-gradient(135deg, var(--dark-charcoal) 0%, var(--black) 100%)',
                color: 'var(--text-light)',
                confirmButtonText: 'Entendi'
            });
            return;
        }

        const safeValue = (value) => {
            if (value === null || value === undefined) return '';
            return String(value).replace(/"/g, '&quot;');
        };

        const formValues = {
            id: rowData.id || '',
            nome: rowData.nome || '',
            titulo: rowData.titulo || '',
            descricao: rowData.descricao || '',
            raridade: rowData.raridade || 'comum',
            passivas: rowData.passivas || '',
            habilidades: rowData.habilidades || '',
            status: rowData.status || 'Ativo',
            taxa_drop: rowData.taxa_drop || 0
        };

        const statusBoolean = formValues.status === 'Ativo';

        Swal.fire({
            title: 'Editar Item',
            html: `
                <form id="form-editar" class="swal2-form">
                    <input type="hidden" id="edit-id" value="${safeValue(formValues.id)}">
                    <div class="form-group mb-3">
                        <label for="edit-nome" class="form-label">Nome</label>
                        <input type="text" id="edit-nome" class="form-control" value="${safeValue(formValues.nome)}" required>
                    </div>
                    <div class="form-group mb-3">
                        <label for="edit-titulo" class="form-label">Título</label>
                        <input type="text" id="edit-titulo" class="form-control" value="${safeValue(formValues.titulo)}" required>
                    </div>
                    <div class="form-group mb-3">
                        <label for="edit-descricao" class="form-label">Descrição</label>
                        <textarea id="edit-descricao" class="form-control" rows="3" required>${safeValue(formValues.descricao)}</textarea>
                    </div>
                    <div class="form-group mb-3">
                        <label for="edit-raridade" class="form-label">Raridade</label>
                        <select id="edit-raridade" class="form-control" required>
                            <option value="comum" ${formValues.raridade === 'comum' ? 'selected' : ''}>comum</option>
                            <option value="incomum" ${formValues.raridade === 'incomum' ? 'selected' : ''}>incomum</option>
                            <option value="raro" ${formValues.raridade === 'raro' ? 'selected' : ''}>raro</option>
                            <option value="epico" ${formValues.raridade === 'epico' ? 'selected' : ''}>epico</option>
                            <option value="legendario" ${formValues.raridade === 'legendario' ? 'selected' : ''}>legendario</option>
                        </select>
                    </div>
                    <div class="form-group mb-3">
                        <label for="edit-passivas" class="form-label">Passivas (separadas por vírgula)</label>
                        <textarea id="edit-passivas" class="form-control" rows="2" placeholder="Ex: Corte Rápido, Regeneração, Velocidade">${safeValue(formValues.passivas)}</textarea>
                        <small class="form-text text-muted">Separe cada passiva por vírgula</small>
                    </div>
                    <div class="form-group mb-3">
                        <label for="edit-habilidades" class="form-label">Habilidades (separadas por vírgula)</label>
                        <textarea id="edit-habilidades" class="form-control" rows="2" placeholder="Ex: Fúria Dracônica, Golpe Flamejante">${safeValue(formValues.habilidades)}</textarea>
                        <small class="form-text text-muted">Separe cada habilidade por vírgula</small>
                    </div>
                    <div class="form-group mb-3">
                        <label for="edit-status" class="form-label">Status</label>
                        <select id="edit-status" class="form-control" required>
                            <option value="true" ${statusBoolean ? 'selected' : ''}>Ativo</option>
                            <option value="false" ${!statusBoolean ? 'selected' : ''}>Inativo</option>
                        </select>
                    </div>
                    <div class="form-group mb-3">
                        <label for="edit-taxa-drop" class="form-label">Taxa de Drop (%)</label>
                        <input type="number" id="edit-taxa-drop" class="form-control" value="${formValues.taxa_drop}" min="0" max="100" step="0.1" required>
                    </div>
                </form>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar Alterações',
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            reverseButtons: true,
            background: 'linear-gradient(135deg, var(--dark-charcoal) 0%, var(--black) 100%)',
            color: 'var(--text-light)',
            customClass: {
                confirmButton: 'swal2-confirm',
                cancelButton: 'swal2-cancel',
                container: 'swal2-container'
            },
            preConfirm: () => {
                return new Promise((resolve, reject) => {
                    const id = $('#edit-id').val();
                    const nome = $('#edit-nome').val();
                    const titulo = $('#edit-titulo').val();
                    const descricao = $('#edit-descricao').val();
                    const raridade = $('#edit-raridade').val();
                    const passivasInput = $('#edit-passivas').val();
                    const habilidadesInput = $('#edit-habilidades').val();
                    const status = $('#edit-status').val();
                    const taxa_drop = parseFloat($('#edit-taxa-drop').val());

                    if (!nome || !titulo || !descricao || !raridade || !status || isNaN(taxa_drop)) {
                        Swal.showValidationMessage('Por favor, preencha todos os campos corretamente.');
                        reject(new Error('Campos obrigatórios não preenchidos'));
                        return;
                    }

                    if (taxa_drop < 0 || taxa_drop > 100) {
                        Swal.showValidationMessage('A taxa de drop deve estar entre 0 e 100%.');
                        reject(new Error('Taxa de drop inválida'));
                        return;
                    }

                    const processarArray = (input) => {
                        if (!input || input.trim() === '') return [];
                        return input.split(',')
                            .map(item => item.trim())
                            .filter(item => item !== '');
                    };

                    const passivas = processarArray(passivasInput);
                    const habilidades = processarArray(habilidadesInput);
                    const statusBoolean = status === 'true';

                    $.ajax({
                        url: `http://localhost:8000/api/gacha-items/${id}`,
                        type: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userToken}`,
                            'X-Requested-With': 'XMLHttpRequest',
                            'Accept': 'application/json'
                        },
                        data: JSON.stringify({
                            _method: 'PUT',
                            nome: nome,
                            titulo: titulo,
                            descricao: descricao,
                            raridade: raridade,
                            passivas: passivas,
                            habilidades: habilidades,
                            status: statusBoolean,
                            taxa_drop: taxa_drop
                        }),
                        success: function(response) {
                            resolve(response);
                        },
                        error: function(xhr, status, error) {
                            console.error('Erro completo na requisição:', xhr);
                            let errorMessage = 'Erro ao salvar as alterações.';
                            
                            if (xhr.status === 0) {
                                errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
                            } else if (xhr.responseJSON && xhr.responseJSON.message) {
                                errorMessage = xhr.responseJSON.message;
                            } else if (xhr.responseJSON && xhr.responseJSON.errors) {
                                const errors = xhr.responseJSON.errors;
                                errorMessage = 'Erros de validação:<br>';
                                for (const field in errors) {
                                    errorMessage += `- ${errors[field].join(', ')}<br>`;
                                }
                            } else if (xhr.responseText) {
                                errorMessage = xhr.responseText;
                            }
                            
                            Swal.showValidationMessage(errorMessage);
                            reject(new Error(errorMessage));
                        }
                    });
                });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Sucesso!',
                    text: 'Item atualizado com sucesso.',
                    icon: 'success',
                    background: 'linear-gradient(135deg, var(--dark-charcoal) 0%, var(--black) 100%)',
                    color: 'var(--text-light)',
                    confirmButtonText: 'OK',
                    timer: 2000,
                    showConfirmButton: false
                });
                tabela.ajax.reload(null, false);
            }
        }).catch((error) => {
            console.log('Edição cancelada ou falhou:', error.message);
        });
    });
}