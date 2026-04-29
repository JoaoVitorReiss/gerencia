export class DevolucaoModal {

    static renderHome() {
        const modal = `
            <div class="devolucao-container">
                <style>
                    .devolucao-container {
                        /* Variáveis baseadas no seu estilo de nota */
                        --primary-dark: #1e3c72;
                        --primary-medium: #2a5298;
                        --light-bg: #f8fafc;
                        --card-bg: #ffffff;
                        --text-primary: #1e293b;
                        --text-secondary: #475569;
                        --text-light: #64748b;
                        --border: #e2e8f0;
                        --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.06);
                        --danger: #ef4444;
                        --success: #10b981;

                        font-family: 'Inter', sans-serif;
                        width: 100%;
                        height: 100%;
                        padding: 24px;
                        box-sizing: border-box;
                        overflow-y: auto;
                        color: var(--text-primary);
                    }

                    /* Cabeçalho da Seção */
                    .dev-header {
                        margin-bottom: 24px;
                    }
                    .dev-header h2 {
                        color: var(--primary-dark);
                        margin: 0 0 8px 0;
                        font-size: 24px;
                    }
                    .dev-header p {
                        color: var(--text-secondary);
                        margin: 0;
                    }

                    /* Barra de Pesquisa */
                    .dev-search-box {
                        background: var(--card-bg);
                        padding: 20px;
                        border-radius: 12px;
                        box-shadow: var(--shadow-sm);
                        display: flex;
                        gap: 12px;
                        align-items: flex-end;
                        margin-bottom: 24px;
                    }
                    .dev-search-box div {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .dev-search-box label {
                        font-weight: 600;
                        color: var(--text-secondary);
                        font-size: 14px;
                    }
                    .dev-search-box input {
                        padding: 12px 16px;
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        outline: none;
                        font-size: 16px;
                    }
                    .dev-search-box input:focus {
                        border-color: var(--primary-medium);
                    }
                    .dev-search-box button {
                        background: var(--primary-dark);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 16px;
                        transition: background 0.3s;
                    }
                    .dev-search-box button:hover {
                        background: var(--primary-medium);
                    }
                    .dev-search-box button:disabled {
                        background: var(--text-light);
                        cursor: not-allowed;
                    }

                    /* Área de Resultados (Nota) */
                    .dev-result-card {
                        background: var(--card-bg);
                        border-radius: 14px;
                        padding: 24px;
                        box-shadow: var(--shadow-sm);
                        margin-bottom: 24px;
                        border: 1px solid var(--border);
                    }
                    
                    .dev-result-title {
                        font-size: 18px;
                        color: var(--primary-dark);
                        margin-bottom: 16px;
                        border-bottom: 1px solid var(--border);
                        padding-bottom: 8px;
                    }

                    /* Grid de Informações */
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 16px;
                        background: var(--light-bg);
                        padding: 16px;
                        border-radius: 10px;
                        margin-bottom: 20px;
                    }
                    .info-item .label {
                        display: block;
                        font-size: 0.85rem;
                        color: var(--text-light);
                        margin-bottom: 4px;
                    }
                    .info-item .value {
                        font-weight: 600;
                        color: var(--text-primary);
                        font-size: 1rem;
                    }
                    .highlight { color: var(--primary-dark); font-weight: 700; }

                    /* Tabela de Produtos */
                    .dev-products {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 24px;
                    }
                    .dev-products th, .dev-products td {
                        padding: 12px 16px;
                        text-align: left;
                        border-bottom: 1px solid var(--border);
                    }
                    .dev-products th {
                        background: rgba(30, 60, 114, 0.05);
                        font-weight: 600;
                        color: var(--text-secondary);
                        font-size: 14px;
                    }
                    .dev-products td { font-size: 15px; }
                    .item-checkbox { cursor: pointer; transform: scale(1.2); }

                    /* Formulário de Ação */
                    .dev-action-area {
                        background: #fff5f5;
                        border: 1px solid #fed7d7;
                        border-radius: 12px;
                        padding: 20px;
                    }
                    
                    .dev-form-group {
                        margin-bottom: 20px;
                    }
                    .dev-form-group > label {
                        display: block;
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: var(--text-primary);
                    }
                    
                    .dev-select {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        background: var(--card-bg);
                        font-size: 15px;
                        color: var(--text-primary);
                    }

                    .dev-radios {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                    }
                    .dev-radio-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: var(--card-bg);
                        padding: 12px;
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        cursor: pointer;
                    }
                    .dev-radio-item input[type="text"] {
                        border: none;
                        border-bottom: 1px solid var(--border);
                        outline: none;
                        width: 100%;
                        background: transparent;
                    }

                    .btn-submit-action {
                        width: 100%;
                        background: var(--danger);
                        color: white;
                        border: none;
                        padding: 14px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-top: 10px;
                        transition: opacity 0.2s;
                    }
                    .btn-submit-action:hover { opacity: 0.9; }
                    .btn-submit-action:disabled { background: var(--text-light); cursor: not-allowed; }

                </style>

                <div class="dev-header">
                    <h2>Auditoria: Trocas e Reembolsos</h2>
                    <p>Busque a transação para iniciar o processo de devolução, troca ou cancelamento de itens.</p>
                </div>

                <div class="dev-search-box">
                    <div>
                        <label for="pesq_id">Buscar por ID da Transação:</label>
                        <input type="search" name="pesq_id" id="pesq_id" placeholder="Ex: TRX-987654321">
                    </div>
                    <button type="button" id="btn-buscar-transacao">Buscar Transação</button>
                </div>

                <!-- Container Dinâmico -->
                <div id="dev-result-container"></div>
                
            </div>
        `;

        return modal;

    }

    static attachEvents() {
        const btnBuscar = document.getElementById('btn-buscar-transacao');
        const inputBusca = document.getElementById('pesq_id');
        const resultContainer = document.getElementById('dev-result-container');

        if (btnBuscar) {
            btnBuscar.addEventListener('click', async () => {
                const idTransacao = inputBusca.value.trim();
                if (!idTransacao) return alert("Por favor, digite o ID da transação.");

                btnBuscar.innerText = "Buscando...";
                btnBuscar.disabled = true;

                try {
                    const res = await fetch(`/api/vendas/${idTransacao}`);
                    const data = await res.json();

                    if (!res.ok) {
                        alert(data.mensagem || "Erro ao buscar transação.");
                        resultContainer.innerHTML = '';
                        return;
                    }

                    DevolucaoModal.renderResultCard(data.transacao, idTransacao);
                } catch (err) {
                    console.error(err);
                    alert("Erro de conexão ao buscar transação.");
                } finally {
                    btnBuscar.innerText = "Buscar Transação";
                    btnBuscar.disabled = false;
                }
            });
        }
    }

    static renderResultCard(transacaoArray, idTransacao) {
        const resultContainer = document.getElementById('dev-result-container');
        
        const info = transacaoArray[0];
        const totalCalculado = transacaoArray.reduce((acc, item) => acc + (item.qtd_item * item.venda_preco_unitario), 0);

        let tableRows = transacaoArray.map(item => {
            const jaEstornado = item.status_venda !== 'concluida';
            const disableAttr = jaEstornado ? 'disabled' : '';
            const statusBadge = jaEstornado ? `<span style="font-size: 0.75em; color: var(--danger); display: block; margin-top: 2px;">JÁ ESTORNADO (${item.status_venda.toUpperCase()})</span>` : '';
            
            return `
                <tr ${jaEstornado ? 'style="opacity: 0.6; background-color: #f9f9f9;"' : ''}>
                    <td><input type="checkbox" class="item-checkbox" ${disableAttr} data-price="${item.qtd_item * item.venda_preco_unitario}" data-id="${item.id_produto}" data-qtd="${item.qtd_item}"></td>
                    <td>${item.nome_produto} ${statusBadge}</td>
                    <td>${item.qtd_item}</td>
                    <td>R$ ${Number(item.venda_preco_unitario).toFixed(2)}</td>
                    <td>R$ ${(item.qtd_item * item.venda_preco_unitario).toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <div class="dev-result-card">
                <h3 class="dev-result-title">Informações da Venda (${idTransacao})</h3> 
                
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Vendedor</span>
                        <span class="value highlight">${info.vendedor_nome}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Data / Hora</span>
                        <span class="value">${info.data_venda} às ${info.venda_data_hora}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Pagamento</span>
                        <span class="value highlight">${info.venda_metodo_paga}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Valor Total</span>
                        <span class="value">R$ ${totalCalculado.toFixed(2)}</span>
                    </div>
                </div>

                <h3 class="dev-result-title">Itens da Venda (Selecione os itens)</h3>
                <table class="dev-products">
                    <thead>
                        <tr>
                            <th width="50">Sel.</th>
                            <th>Produto</th>
                            <th>Qtd.</th>
                            <th>Valor Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>

                <div class="dev-action-area">
                    <h3 class="dev-result-title" style="border-bottom-color: #fed7d7;">Configurar Ação (${idTransacao})</h3>
                    
                    <div class="dev-form-group">
                        <label for="tipo_acao">Tipo de Operação (Requerido pelo Banco)</label>
                        <select name="tipo_acao" id="tipo_acao" class="dev-select">
                            <option value="" disabled selected>Selecione uma ação...</option>
                            <option value="TROCA">Troca (Substituição por item de mesmo valor)</option>
                            <option value="DEVOLUCAO">Devolução (Item volta pro estoque, gera crédito)</option>
                            <option value="REEMBOLSO">Reembolso (Devolução com estorno financeiro)</option>
                            <option value="CANCELAMENTO">Cancelamento Total (Anula toda a venda)</option>
                        </select>
                    </div>

                    <div class="dev-form-group" style="background: white; padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
                        <label for="valor_estornado" style="color: var(--danger);">Valor Total a Estornar (R$)</label>
                        <input type="number" id="valor_estornado" class="dev-select" step="0.01" min="0" placeholder="0.00" style="font-size: 18px; font-weight: bold; color: var(--danger);" readonly>
                        <small style="color: var(--text-light); margin-top: 5px; display: block;">*O valor é calculado automaticamente ao selecionar os itens acima.</small>
                    </div>

                    <div class="dev-form-group">
                        <label>Qual o motivo desta ação?</label>
                        <div class="dev-radios">
                            <label class="dev-radio-item">
                                <input type="radio" name="motivo" value="Produto com defeito ou vencido"> Defeito ou Vencimento
                            </label>
                            <label class="dev-radio-item">
                                <input type="radio" name="motivo" value="Desistência ou arrependimento do cliente"> Desistência do Cliente
                            </label>
                            <label class="dev-radio-item">
                                <input type="radio" name="motivo" value="Erro no sistema operacional / Lançamento incorreto"> Erro de Sistema/Operador
                            </label>
                            <label class="dev-radio-item" style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
                                <div style="display: flex; gap: 8px;">
                                    <input type="radio" name="motivo" value="outro"> Outro Motivo:
                                </div>
                                <input type="text" id="motivo_outro_texto" name="motivo_outro" placeholder="Especifique com detalhes..." style="margin-top: 5px; width: 100%;">
                            </label>
                        </div>
                    </div>

                    <button type="button" class="btn-submit-action">Registrar Auditoria</button>
                </div>
            </div>
        `;

        resultContainer.innerHTML = html;
        DevolucaoModal.attachActionEvents(idTransacao);
    }

    static attachActionEvents(idTransacao) {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        const inputEstorno = document.getElementById('valor_estornado');
        const selectAcao = document.getElementById('tipo_acao');
        const btnSubmit = document.querySelector('.btn-submit-action');

        const calcularEstorno = () => {
            let total = 0;
            checkboxes.forEach(chk => {
                if(chk.checked) {
                    total += parseFloat(chk.dataset.price || 0);
                }
            });
            if(inputEstorno) inputEstorno.value = total.toFixed(2);
        };

        checkboxes.forEach(chk => {
            chk.addEventListener('change', calcularEstorno);
        });

        if (selectAcao) {
            selectAcao.addEventListener('change', (e) => {
                if(e.target.value === 'CANCELAMENTO') {
                    checkboxes.forEach(chk => {
                        if (!chk.disabled) chk.checked = true;
                    });
                    calcularEstorno();
                } else {
                    checkboxes.forEach(chk => {
                        if (!chk.disabled) chk.checked = false;
                    });
                    calcularEstorno();
                }
            });
        }

        if (btnSubmit) {
            btnSubmit.addEventListener('click', async () => {
                const acao = selectAcao ? selectAcao.value : null;
                if (!acao) return alert("Por favor, selecione o Tipo de Operação.");

                const motivoSelecionado = document.querySelector('input[name="motivo"]:checked');
                if(!motivoSelecionado) return alert("Por favor, selecione um motivo!");

                const motivoTexto = motivoSelecionado.value === 'outro' 
                    ? document.getElementById('motivo_outro_texto').value 
                    : motivoSelecionado.value;
                
                if (motivoSelecionado.value === 'outro' && !motivoTexto.trim()) {
                    return alert("Por favor, especifique o outro motivo.");
                }

                const itensSelecionados = Array.from(checkboxes)
                    .filter(chk => chk.checked)
                    .map(chk => Number(chk.dataset.id)); 

                if (itensSelecionados.length === 0) {
                    return alert("Selecione pelo menos um item para prosseguir.");
                }

                const payload = {
                    id_transacao_ref: idTransacao,
                    tipo_acao: acao,
                    valor_estornado: parseFloat(inputEstorno ? inputEstorno.value : 0),
                    motivo: motivoTexto,
                    itens: itensSelecionados
                };

                btnSubmit.innerText = "Processando...";
                btnSubmit.disabled = true;

                try {
                    const res = await fetch('/api/auditoria', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();

                    if (res.ok) {
                        alert(data.mensagem || "Operação registrada com sucesso!");
                        document.getElementById('dev-result-container').innerHTML = '';
                        document.getElementById('pesq_id').value = '';
                    } else {
                        alert(data.mensagem || "Erro ao registrar auditoria.");
                    }
                } catch (err) {
                    console.error("Erro na requisição POST:", err);
                    alert("Erro de conexão ao registrar auditoria.");
                } finally {
                    btnSubmit.innerText = "Registrar Auditoria";
                    btnSubmit.disabled = false;
                }
            });
        }
    }
}