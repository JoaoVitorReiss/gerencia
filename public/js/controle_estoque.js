const AppState = {
    dados_user: localStorage.getItem('id_vendedor'),
    controle: false
};

const Icons = {
    edit: `<svg height="24px" viewBox="0 -960 960 960" width="24px" fill="#3498db">
            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
        </svg>`
};

class EstoqueAPI {
    static async deletarItem(payload) {
        try {
            const res = await fetch("/dell_item", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            if(res.ok) {
                // Removido o window.location.reload() para ficar instantâneo
                return true;
            }
            return false;

        } catch(erro) {
            console.error("Erro ao tentar excluir item", erro);
            return false;
        }
    }

    static async buscarInfo(id, endpoint = "/buscar_info") {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id })
            });
            if(res.ok) {
                return await res.json();
            }
            return null;
        } catch(erro) {
            console.error(`Erro buscando ${endpoint}`, erro);
            return null;
        }
    }

    static async atualizarItem(payload) {
        try {
            const res = await fetch("/atualiza_item", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            if(!res.ok) {
                const erro = await res.json();
                console.error(erro.mensagem);
                return false;
            }
            return true;
        } catch(error) {
            console.error("Erro na atualização:", error);
            return false;
        }
    }

    static async obterEstoqueBaixo() {
        try {
            const res = await fetch("/contro_estoque");
            if(res.ok) {
                const data = await res.json();
                return data.dados || [];
            }
            return [];
        } catch(error) {
            console.error("Erro acesso estoque baixo:", error);
            return [];
        }
    }

    static async adicionarItem(payload) {
        try {
            const res = await fetch("/additem", {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            return res.ok;
        } catch(erro) {
            console.error(erro);
            return false;
        }
    }

    static async buscarListaDados(inicio, fim, ordenacao = 'mais_vendidos') {
        try {
            const res = await fetch("/dados_lista", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inicio, fim, ordenacao })
            });
            if(res.ok) {
                const json = await res.json();
                return json.itens?.dados || [];
            }
            return [];
        } catch(error) {
            console.error(error);
            return [];
        }
    }

    // Novas rotas para Histórico, Exclusão Definitiva e Restauração ->
    static async obterHistorico(inicio, fim) {
        try {
            const res = await fetch("/historico_edicoes", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inicio, fim })
            });
            if(res.ok) {
                const json = await res.json();
                return json.dados || [];
            }
            return [];
        } catch(e) {
            console.error("Erro ao buscar histórico", e);
            return [];
        }
    }

    static async obterDeletados(inicio, fim) {
        try {
            const res = await fetch("/historico_deletados", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inicio, fim })
            });
            if(res.ok) {
                const json = await res.json();
                return json.dados || [];
            }
            return [];
        } catch(e) {
            console.error("Erro ao buscar deletados físicos", e);
            return [];
        }
    }

    static async exclusaoDefinitiva(id, id_user) {
        try {
            const res = await fetch("/exclusao_definitiva", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id, id_user })
            });
            const j = await res.json();
            if(!res.ok) {
                return { sucesso: false, msg: j.mensagem || "Erro na exclusão" };
            }
            return { sucesso: true };
        } catch(e) {
            console.error("Erro exclusão definitiva", e);
            return { sucesso: false, msg: "Falha de conexão." };
        }
    }

    static async restaurarItem(id, id_user) {
        try {
            const res = await fetch("/restaurar_item", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id, id_user })
            });
            return res.ok;
        } catch(e) {
            console.error("Erro ao restaurar item", e);
            return false;
        }
    }

    static async pesquisarGlobal(termo) {
        try {
            const res = await fetch("/pesquisar_produto", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ termo })
            });
            if (res.ok) {
                const json = await res.json();
                return json.itens?.dados || [];
            }
            return [];
        } catch (e) {
            console.error('Erro na pesquisa global:', e);
            return [];
        }
    }
}

class ToastUI {
    static mostrarMensagem(mensagem, tipo = 'erro') {
        const feedback = document.getElementById('mensagem-feedback');
        feedback.textContent = mensagem;
        feedback.classList.remove('success', 'error', 'visible');
        feedback.classList.add(tipo === 'sucesso' ? 'success' : 'error');
        feedback.style.display = 'block';
        
        setTimeout(() => feedback.classList.add('visible'), 10);
        
        setTimeout(() => {
            feedback.classList.remove('visible');
            setTimeout(() => feedback.style.display = 'none', 500);
        }, 3000);
    }
}

class TabelaUI {
    static _statusHtml(estoqueAtual) {
        if (estoqueAtual < 15) return `<div class="alerta" title="Alerta! Poucos itens em estoque"></div>`;
        if (estoqueAtual < 25) return `<div class="atencao" title="Atenção! Item em baixa no estoque"></div>`;
        return `<div class="normal" title="nível de itens normal no estoque"></div>`;
    }

    static async renderizarEstoqueBaixo() {
        const dados = await EstoqueAPI.obterEstoqueBaixo();
        const tbody = document.getElementById("dados_itemFalta");
        tbody.innerHTML = "";
        
        if (dados.length === 0) {
            console.warn("Nenhum dado encontrado.");
            return;
        }

        const html = dados.map(item => `
            <tr id="${item.Id}">
                <td>${item.Id}</td>
                <td>${item.nome_do_Produto}</td>
                <td>R$ ${Number(item.Preço).toFixed(2)}</td>
                <td>${item.estoque_atual}</td>
                <td>${item.Qtd_vendidas}</td>
                <td>${this._statusHtml(item.estoque_atual)}</td>
                <td class="acoes"><button class="edt_itemFalta" id="${item.Id}">${Icons.edit}</button></td>
            </tr>
        `).join('');
        
        tbody.insertAdjacentHTML('beforeend', html);
    }

    static renderizarMaisVendidos(dados) {
        const tbody = document.getElementById("itens_maisVendidos");
        tbody.innerHTML = "";

        if (!dados || dados.length === 0) return;

        const html = dados.map(item => {
            const ativo = item.ativo == 1; // 1 = "Ativo", 0 = "Excluido"
            const situacaoText = ativo ? "Ativo" : "Excluido";
            const corText = ativo ? "#000000" : "#d60707f1";
            
            return `
            <tr id="${item.id}" class="${situacaoText}">
                <td>${item.id}</td>
                <td>${item.nome_produto}</td>
                <td>R$ ${Number(item.preco_atual).toFixed(2)}</td>
                <td>${item.estoque_atual}</td>
                <td>${item.total_vendido}</td>
                <td>${this._statusHtml(item.estoque_atual)}</td>
                <td style="color:${corText}">${situacaoText}</td>
                <td class="acoesD" id="${item.id}">
                    <button class="edt_itemFalta" id="${item.id}">${Icons.edit}</button>
                </td>
            </tr>
            `;
        }).join('');
        
        tbody.insertAdjacentHTML('beforeend', html);
    }
}

class ModalUI {
    static abrirConfirmacaoDel(payloadDel) {
        AppState.controle = false;
        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay-confirm';
        overlay.innerHTML = `
            <div id="modal-confirm-container">
                <div class="modal-header"><h3>Confirmar inativação</h3></div>
                <div class="modal-body"><p>Deseja realmente inativar este item (Mover para a lixeira)?</p></div>
                <div class="modal-footer">
                    <button type="button" class="btn-cancelar" id="btn-cancelar-confirm">Cancelar</button>
                    <button type="button" class="btn-excluir" id="btn-confirmar-excluir">Excluir</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const fechar = () => overlay.remove();
        document.getElementById('btn-cancelar-confirm').onclick = fechar;
        
        document.getElementById('btn-confirmar-excluir').onclick = async () => {
            const sucesso = await EstoqueAPI.deletarItem(payloadDel);
            if (sucesso) {  
                ToastUI.mostrarMensagem("Item inativado!", "sucesso");
                await TabelaUI.renderizarEstoqueBaixo();
                const hoje = new Date();
                const dataFormatada = hoje.toISOString().split('T')[0];
                await EstoqueController.carregarDadosFiltro(0, dataFormatada);
                fechar();
            } else {
                ToastUI.mostrarMensagem("Erro ao inativar item.");
            }
        };

        overlay.onclick = e => { if(e.target === overlay) fechar(); };
        const fecharEsc = e => { if(e.key === 'Escape'){ fechar(); document.removeEventListener('keydown', fecharEsc);}};
        document.addEventListener('keydown', fecharEsc);
    }

    static async abrirEdicaoAdicao(config = { titulo: "Novo Item", tipo: 0, id: null }) {
        let stateOriginal = { qtd: 0, nome: "", preco: 0 };
        const isEdicao = config.tipo === 1 || config.tipo === 2;

        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.innerHTML = `
            <div id="modal-container">
                <div class="modal-header">
                    <h2>${config.titulo}</h2>
                    <button id="fechar-modal">&times;</button>
                </div>
                <form id="form-estoque">
                    <div class="campo-grupo">
                        <label for="nomeitem">Nome do item:</label>
                        <input type="text" id="nomeitem" required>
                    </div>
                    <div class="linha-dupla">
                        <div class="campo-grupo">
                            <label for="valorItem">Preço (Venda) R$:</label>
                            <input type="number" id="valorItem" step="0.01" required>
                        </div>
                        <div class="campo-grupo">
                            <label for="qtditem">Quantidade:</label>
                            <input type="number" id="qtditem" required>
                        </div>
                    </div>
                    <div class="campo-grupo" id="div-valitem">
                        <label for="valitem">Validade (Opcional):</label>
                        <input type="date" id="valitem">
                    </div>
                    <div class="campo-grupo">
                        <label for="motivo">Motivo: </label>
                        <input type="text" id="motivo" value="Novo item" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-cancelar" id="btn-cancelar">Cancelar</button>
                        <button type="button" id="btn_excluir" class="btn-excluir hidden">Excluir item</button>
                        <button type="button" id="btn_excluir_definitivo" class="btn-excluir hidden" style="background-color: #c0392b; color: white;">Excluir definitivamente</button>
                        <button type="submit" class="btn-finalizar" id="btn_finalizar">Finalizar</button>
                        <button type="button" class="btn-resta hidden" id="btn-resta" style="background-color: #27ae60; color: white; margin-left: auto;">Restaurar</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        const form = document.getElementById('form-estoque');
        const fechar = () => overlay.remove();
        
        document.getElementById('fechar-modal').onclick = fechar;
        document.getElementById('btn-cancelar').onclick = fechar;

        const uiElements = {
            nome: document.getElementById('nomeitem'),
            preco: document.getElementById('valorItem'),
            qtd: document.getElementById('qtditem'),
            validade: document.getElementById('valitem'),
            motivo: document.getElementById('motivo'),
            btnExcluir: document.getElementById('btn_excluir'),
            btnExcluirDefinitivo: document.getElementById('btn_excluir_definitivo'),
            btnFinalizar: document.getElementById('btn_finalizar'),
            btnRestaurar: document.getElementById('btn-resta'),
            divValidade: document.getElementById('div-valitem')
        };

        if (isEdicao) {
            uiElements.divValidade.classList.add('hidden');
            
            if (config.tipo === 1) {
                uiElements.btnExcluir.classList.remove('hidden');
                uiElements.btnExcluir.onclick = e => {
                    e.preventDefault();
                    ModalUI.abrirConfirmacaoDel({ id: config.id, id_user: AppState.dados_user });
                    fechar();
                };
            } else if (config.tipo === 2) {
                uiElements.btnFinalizar.classList.add('hidden');
                uiElements.btnRestaurar.classList.remove('hidden');
                uiElements.btnExcluirDefinitivo.classList.remove('hidden');

                uiElements.btnExcluirDefinitivo.onclick = async (e) => {
                    e.preventDefault();
                    if(confirm("Tem certeza? Esta ação removerá o produto permanentemente do banco de dados e não pode ser desfeita.")) {
                        const res = await EstoqueAPI.exclusaoDefinitiva(config.id, AppState.dados_user);
                        if(res.sucesso) {
                            ToastUI.mostrarMensagem("Item deletado de forma permanente.", "sucesso");
                            fechar();
                            TabelaUI.renderizarEstoqueBaixo();
                            const dtIso = new Date().toISOString().split('T')[0];
                            EstoqueController.carregarDadosFiltro(0, dtIso);
                        } else {
                            ToastUI.mostrarMensagem(res.msg, "erro");
                        }
                    }
                };

                uiElements.btnRestaurar.onclick = async (e) => {
                    e.preventDefault();
                    const suc = await EstoqueAPI.restaurarItem(config.id, AppState.dados_user);
                    if(suc) {
                        ToastUI.mostrarMensagem("O item foi Restaurado aos status ativos!", "sucesso");
                        fechar();
                        TabelaUI.renderizarEstoqueBaixo();
                        const dtIso = new Date().toISOString().split('T')[0];
                        EstoqueController.carregarDadosFiltro(0, dtIso);
                    } else {
                        ToastUI.mostrarMensagem("Erro na restauração.", "erro");
                    }
                };
            }

            const endpoint = config.tipo === 1 ? "/buscar_info" : "/buscar_infoAll";
            const jsonData = await EstoqueAPI.buscarInfo(config.id, endpoint);
            
            if (jsonData && jsonData.item && jsonData.item[0]) {
                const item = jsonData.item[0];
                stateOriginal.qtd = item.qtd_produto;
                stateOriginal.nome = item.descri_produto;
                stateOriginal.preco = item.preco_produto;

                uiElements.nome.value = item.descri_produto;
                uiElements.preco.value = item.preco_produto;
                uiElements.qtd.value = item.qtd_produto;
                
                const dataValidade = item.validade ? item.validade.split('T')[0] : "";
                uiElements.validade.value = dataValidade;
                uiElements.motivo.value = config.tipo === 2 ? "Exibindo dados do item excluído" : "Adicione o motivo";
            }
        }

        form.onsubmit = async e => {
            e.preventDefault();
            if (isEdicao) {
                const payloadAtualiza = {
                    id_produto: config.id,
                    id_usuario: AppState.dados_user,
                    qtd_anterior: stateOriginal.qtd,
                    nome_anterio: stateOriginal.nome,
                    preco_anterior: stateOriginal.preco,
                    qtd_nova: Number(uiElements.qtd.value),
                    nome: uiElements.nome.value,
                    preco: Number(uiElements.preco.value),
                    motivo: uiElements.motivo.value,
                    validade: uiElements.validade.value || null
                };
                const sucesso = await EstoqueAPI.atualizarItem(payloadAtualiza);
                if(sucesso) {
                    fechar();
                    ToastUI.mostrarMensagem("Atualizado com sucesso!", "sucesso");
                    setTimeout(() => location.reload(), 700);
                }
            } else {
                const payloadAdd = {
                    validade: uiElements.validade.value || null,
                    motivo: uiElements.motivo.value,
                    qtd_item: uiElements.qtd.value,
                    preco: uiElements.preco.value,
                    nome_item: uiElements.nome.value,
                    id_user: AppState.dados_user
                };
                const sucesso = await EstoqueAPI.adicionarItem(payloadAdd);
                if(sucesso) {
                    fechar();
                    ToastUI.mostrarMensagem("Item adicionado com sucesso!", "sucesso");
                    setTimeout(() => location.reload(), 200);
                } else {
                    ToastUI.mostrarMensagem("Erro ao adicionar o item", "erro");
                }
            }
        };
    }

    static abrirHistorico() {
        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay-historico';
        overlay.innerHTML = `
            <div id="modal-historico-container" style="max-width: 900px; width: 95%; background: white; margin: 40px auto; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #ccc; padding-bottom:10px; margin-bottom: 20px;">
                    <h2 style="margin:0;">Histórico de Edições</h2>
                    <button id="fechar-historico" style="background:none; border:none; font-size:24px; cursor:pointer;">&times;</button>
                </div>
                
                <div style="margin-bottom: 20px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <button class="btn-filtro hist-filtro active" value="0">Hoje</button>
                    <button class="btn-filtro hist-filtro" value="7">Últimos 7 dias</button>
                    <button class="btn-filtro hist-filtro" value="30">Últimos 30 dias</button>
                    <button id="btn-hist-deletados" class="btn-filtro" style="background:#c0392b; color:white; margin-left: 15px;">🗑 Lixeira Permanente</button> <!-- NEW -->
                    <span style="flex-grow:1"></span>
                    <input type="date" id="hist-inicio" class="input-data" style="padding: 5px;">
                    <span style="font-weight:bold;">à</span>
                    <input type="date" id="hist-fim" class="input-data" style="padding: 5px;">
                    <button id="hist-buscar" style="padding: 5px 15px; cursor:pointer;" class="btn-filtro">Buscar</button>
                </div>

                <div style="max-height: 400px; overflow-y: auto;">
                    <table style="width:100%; border-collapse: collapse; text-align: left;">
                        <thead style="background: #f1f1f1;">
                            <tr>
                                <th style="padding:10px; border-bottom:1px solid #ddd;">Data/Hora</th>
                                <th style="padding:10px; border-bottom:1px solid #ddd;">Usuário</th>
                                <th style="padding:10px; border-bottom:1px solid #ddd;">Produto</th>
                                <th style="padding:10px; border-bottom:1px solid #ddd;">Ação / Motivo</th>
                                <th style="padding:10px; border-bottom:1px solid #ddd;">De</th>
                                <th style="padding:10px; border-bottom:1px solid #ddd;">Para</th>
                            </tr>
                        </thead>
                        <tbody id="hist-tbody">
                            <!-- Injeção dos logs -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Modal overlay styling directly
        overlay.style.position = 'fixed';
        overlay.style.top = '0'; overlay.style.left = '0';
        overlay.style.width = '100%'; overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        
        document.body.appendChild(overlay);

        const tbody = document.getElementById('hist-tbody');
        let isApagadosFisicos = false;

        const loadLogs = async (dias, inicioMan, fimMan) => {
            const hoje = new Date();
            let dInicio = new Date();
            let dataInicioStr, dataFimStr;

            if (inicioMan && fimMan) {
                dataInicioStr = inicioMan;
                dataFimStr = fimMan;
            } else {
                dInicio.setDate(hoje.getDate() - dias);
                dataInicioStr = dInicio.toISOString().split('T')[0];
                dataFimStr = hoje.toISOString().split('T')[0];
            }

            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Carregando histórico...</td></tr>';
            
            const logs = isApagadosFisicos 
                ? await EstoqueAPI.obterDeletados(dataInicioStr, dataFimStr)
                : await EstoqueAPI.obterHistorico(dataInicioStr, dataFimStr);

            if (!logs || logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Nenhum registro encontrado neste período.</td></tr>';
                return;
            }

            tbody.innerHTML = logs.map(l => {
                const dataFormatada = l.data_formatada || new Date(l.data_hora).toLocaleString('pt-BR');
                let botoesExcluido = '';
                let trClassEStyle = 'style="border-bottom: 1px solid #eee;"';
                
                if((l.novo === 'DESATIVADO' || String(l.motivo).includes('Soft Delete')) && l.ativo_atual === 0) {
                    trClassEStyle = 'style="border-bottom: 1px solid #eee; background-color: #ffe0e0;"';
                    botoesExcluido = `
                        <div style="margin-top: 5px; display:flex; gap: 5px;">
                            <button class="btn-restaurar-hist" data-id="${l.id_produto}" style="background:#27ae60; color:#fff; border:none; border-radius:3px; padding:3px 6px; cursor:pointer; font-size:0.8em;">Restaurar</button>
                            <button class="btn-excluirdef-hist" data-id="${l.id_produto}" style="background:#c0392b; color:#fff; border:none; border-radius:3px; padding:3px 6px; cursor:pointer; font-size:0.8em;">Excluir Físico</button>
                        </div>
                    `;
                }

                return `
                <tr ${trClassEStyle}>
                    <td style="padding:10px;">${dataFormatada}</td>
                    <td style="padding:10px; font-weight:bold;">${l.usuario}</td>
                    <td style="padding:10px;">
                        ${l.produto}
                        ${botoesExcluido}
                    </td>
                    <td style="padding:10px; color:#e67e22;">${l.motivo}</td>
                    <td style="padding:10px; font-size:0.85em; max-width:150px;">${l.anterior}</td>
                    <td style="padding:10px; font-size:0.85em; max-width:150px; font-weight:bold; color: ${l.novo === 'DESATIVADO' ? '#d60707' : '#000'}">${l.novo}</td>
                </tr>
                `;
            }).join('');

            // Adiciona eventos aos botões que acabaram de ser renderizados
            document.querySelectorAll('.btn-restaurar-hist').forEach(b => {
                b.onclick = async () => {
                   const idProd = b.getAttribute('data-id');
                   const suc = await EstoqueAPI.restaurarItem(idProd, AppState.dados_user);
                   if(suc) {
                       ToastUI.mostrarMensagem("Item restaurado com sucesso!", "sucesso");
                       // Extrai o valor do filtro ativo hoje/7/30 e recarrega
                       let valFiltro = 0;
                       document.querySelectorAll('.hist-filtro').forEach(f => {
                           if(f.classList.contains('active')) valFiltro = f.value;
                       });
                       loadLogs(Number(valFiltro));
                       TabelaUI.renderizarEstoqueBaixo();
                       EstoqueController.carregarDadosFiltro(0, new Date().toISOString().split('T')[0]);
                   }
                };
            });

            document.querySelectorAll('.btn-excluirdef-hist').forEach(b => {
                b.onclick = async () => {
                   if(confirm('Tem certeza? Essa ação vai excluir o produto permanentemente do banco.')) {
                       const idProd = b.getAttribute('data-id');
                       const res = await EstoqueAPI.exclusaoDefinitiva(idProd, AppState.dados_user);
                       if(res.sucesso) {
                           ToastUI.mostrarMensagem("Item excluído em definitivo!", "sucesso");
                           let valFiltro = 0;
                           document.querySelectorAll('.hist-filtro').forEach(f => {
                               if(f.classList.contains('active')) valFiltro = f.value;
                           });
                           loadLogs(Number(valFiltro));
                           TabelaUI.renderizarEstoqueBaixo();
                           EstoqueController.carregarDadosFiltro(0, new Date().toISOString().split('T')[0]);
                       } else {
                           ToastUI.mostrarMensagem(res.msg, "erro");
                       }
                   }
                };
            });
        };

        // Eventos
        document.getElementById('fechar-historico').onclick = () => overlay.remove();
        overlay.onclick = e => { if(e.target === overlay) overlay.remove(); };
        
        document.getElementById('btn-hist-deletados').onclick = () => {
            isApagadosFisicos = !isApagadosFisicos;
            const btnDel = document.getElementById('btn-hist-deletados');
            if (isApagadosFisicos) {
                btnDel.style.background = '#800000';
                btnDel.textContent = 'Ver Cadastros Ativos/Inativados';
            } else {
                btnDel.style.background = '#c0392b';
                btnDel.textContent = '🗑 Lixeira Permanente';
            }
            
            let valFiltro = 0;
            document.querySelectorAll('.hist-filtro').forEach(f => {
                 if(f.classList.contains('active')) valFiltro = f.value;
            });
            loadLogs(Number(valFiltro));
        };

        const btns = document.querySelectorAll('.hist-filtro');
        btns.forEach(b => b.onclick = (e) => {
            btns.forEach(bt => bt.classList.remove('active'));
            b.classList.add('active');
            loadLogs(Number(b.value));
        });

        document.getElementById('hist-buscar').onclick = () => {
            const ini = document.getElementById('hist-inicio').value;
            const fim = document.getElementById('hist-fim').value;
            if(!ini || !fim) {
                ToastUI.mostrarMensagem("Por favor escolha a data inicial e final", "erro");
                return;
            }
            loadLogs(0, ini, fim);
        };

        // Inicia com filtro "Hoje"
        loadLogs(0);
    }
}

class EstoqueController {
    static init() {
        this.bindAcoesGlobais();
        this.initFiltrosDeData();
        TabelaUI.renderizarEstoqueBaixo();
        
        // Delegação de eventos
        document.getElementById("dados_itemFalta").addEventListener("click", evt => {
            const btn = evt.target.closest('.edt_itemFalta');
            if (btn) ModalUI.abrirEdicaoAdicao({ titulo: 'Edita item', tipo: 1, id: btn.id });
        });

        document.getElementById("itens_maisVendidos").addEventListener("click", evt => {
            const btn = evt.target.closest('.edt_itemFalta');
            if (btn) {
                const tr = btn.closest('tr');
                const isExcluido = tr && tr.classList.contains('Excluido');
                const tipoModal = isExcluido ? 2 : 1;
                const tituloModal = isExcluido ? 'Item Excluído' : 'Edita item';
                
                ModalUI.abrirEdicaoAdicao({ titulo: tituloModal, tipo: tipoModal, id: btn.id });
            }
        });

        // Pesquisa GLOBAL: ignora filtros de data e ordenação, consulta o backend
        const inputPesquisa = document.getElementById('item_pesquisado');
        const tabelaBody = document.getElementById('itens_maisVendidos');
        let debounceTimer = null;

        const executarPesquisa = async () => {
            const termo = inputPesquisa.value.trim();
            if (termo === '') {
                // Campo limpo: restaura a view normal com os filtros ativos
                const botaoAtivo = document.querySelector('#interval_time .btn-filtro.active');
                if (botaoAtivo) botaoAtivo.click();
                else this.carregarDadosFiltro(0, new Date().toISOString().split('T')[0]);
                return;
            }
            tabelaBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Pesquisando...</td></tr>';
            const resultados = await EstoqueAPI.pesquisarGlobal(termo);
            TabelaUI.renderizarMaisVendidos(resultados);
        };

        if (inputPesquisa) {
            // Debounce: espera 400ms sem digitar para disparar
            inputPesquisa.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(executarPesquisa, 400);
            });
            const btnBusca = inputPesquisa.nextElementSibling;
            if (btnBusca) btnBusca.addEventListener('click', executarPesquisa);
        }
    }

    static bindAcoesGlobais() {
        document.getElementById('codi_show').addEventListener('click', () => {
            const info = document.getElementById('codigo');
            info.style.display = info.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById("add_novoitem").addEventListener("click", e => {
            e.preventDefault();
            ModalUI.abrirEdicaoAdicao({ titulo: "Novo Item", tipo: 0 });
        });

        // Evento para abrir Modal de Histórico
        const btnHistorico = document.getElementById('historico');
        if (btnHistorico) {
            btnHistorico.addEventListener('click', () => {
                ModalUI.abrirHistorico();
            });
        }
    }

    static async carregarDadosFiltro(inicio, fim) {
        // Mapeamento dos valores do option HTML para as chaves do backend
        const mapaOrdenacao = {
            'volvo':    'mais_vendidos',
            'saab':     'vencimento_prox',
            'mercedes': 'maior_estoque',
            'audi':     'menos_vendidos'
        };
        const seletor = document.getElementById('selecionar');
        const ordenacao = seletor ? (mapaOrdenacao[seletor.value] || 'mais_vendidos') : 'mais_vendidos';

        const dados = await EstoqueAPI.buscarListaDados(inicio, fim, ordenacao);
        TabelaUI.renderizarMaisVendidos(dados);
    }

    static initFiltrosDeData() {
        const formatarData = data => data.toISOString().split('T')[0];
        const botoes = document.querySelectorAll(".btn-filtro:not(.hist-filtro):not(#hist-buscar)");
        const btnBuscaManual = document.getElementById("btn_buscar_custom");
        const inputInicio = document.getElementById("data_inicio");
        const inputFim = document.getElementById("data_fim");
        const hoje = new Date();

        if(botoes) {
            botoes.forEach(botao => {
                botao.addEventListener("click", e => {
                    e.preventDefault();
                    botoes.forEach(b => b.classList.remove("active"));
                    botao.classList.add("active");

                    const dias = Number(botao.value);
                    const hojeAtualizado = new Date();
                    
                    if (dias === 0) {
                        this.carregarDadosFiltro(0, formatarData(hojeAtualizado));
                        return;
                    }
                    
                    const dataInicio = new Date();
                    dataInicio.setDate(hojeAtualizado.getDate() - dias);
                    this.carregarDadosFiltro(formatarData(dataInicio), formatarData(hojeAtualizado));
                });
            });
        }

        if(btnBuscaManual) {
            btnBuscaManual.addEventListener("click", e => {
                e.preventDefault();
                const inicio = inputInicio.value;
                const fim = inputFim.value;
                if (inicio && fim) {
                    this.carregarDadosFiltro(inicio, fim);
                } else {
                    ToastUI.mostrarMensagem("Por favor, selecione as duas datas.", "erro");
                }
            });
        }

        // Ouvir mudança no seletor de ordenação
        const seletor = document.getElementById('selecionar');
        if (seletor) {
            seletor.addEventListener('change', () => {
                const botaoAtivo = document.querySelector('.btn-filtro.active');
                if (botaoAtivo) botaoAtivo.click();
                else this.carregarDadosFiltro(0, formatarData(hoje));
            });
        }

        // Loop inicial principal da tabela
        this.carregarDadosFiltro(0, formatarData(hoje));
    }
}

// Substitua o final do arquivo por isso:
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EstoqueController.init());
} else {
    // Se o DOM já estiver pronto, inicia direto
    EstoqueController.init();
}