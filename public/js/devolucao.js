export class DevolucaoModal {

    static renderHome() {
        // Dados simulados para visualização do layout preenchido
        const mockData = {
            // id: "TRX-987654321",
            // vendedor: "Carlos Silva",
            // data: "28/04/2026",
            // hora: "14:30",
            // pagamento: "Cartão de Crédito",
            // total: "R$ 150,00"
        };
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

                    /* Grid de Informações (Reaproveitado do seu CSS) */
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
                        background: #fff5f5; /* Fundo levemente avermelhado/alerta */
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

                </style>

                <div class="dev-header">
                    <h2>Trocas e Reembolsos</h2>
                    <p>Busque a transação para iniciar o processo de devolução, troca ou cancelamento de itens.</p>
                </div>

                <div class="dev-search-box">
                    <div>
                        <label for="pesq_id">Buscar por ID da Transação ou CPF:</label>
                        <input type="search" name="pesq_id" id="pesq_id" placeholder="Ex: TRX-987654321">
                    </div>
                    <button type="button">Buscar Transação</button>
                </div>

                <div class="dev-result-card">
                    <h3 class="dev-result-title">Informações da Venda (${mockData.id})</h3> 
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Vendedor</span>
                            <span class="value highlight">${mockData.vendedor}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Data / Hora</span>
                            <span class="value">${mockData.data} às ${mockData.hora}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Pagamento</span>
                            <span class="value highlight">${mockData.pagamento}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Valor Total</span>
                            <span class="value">${mockData.total}</span>
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
                            <tr>
                                <td><input type="checkbox" class="item-checkbox"></td>
                                <td>Ração Golden Especial Cães Adultos 15kg</td>
                                <td>1</td>
                                <td>R$ 130,00</td>
                                <td>R$ 130,00</td>
                            </tr>
                            <tr>
                                <td><input type="checkbox" class="item-checkbox"></td>
                                <td>Shampoo Pet Clean 500ml</td>
                                <td>1</td>
                                <td>R$ 20,00</td>
                                <td>R$ 20,00</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="dev-action-area">
                        <h3 class="dev-result-title" style="border-bottom-color: #fed7d7;">Ação a ser realizada</h3>
                        
                        <div class="dev-form-group">
                            <label for="tipo_acao">O que você deseja fazer com os itens selecionados?</label>
                            <select name="tipo_acao" id="tipo_acao" class="dev-select">
                                <option value="" disabled selected>Selecione uma ação...</option>
                                <option value="trocar">Trocar item(ns) por outro igual ou de mesmo valor</option>
                                <option value="substituir">Devolver o item(ns) e solicitar o reembolso do valor</option>
                            </select>
                        </div>

                        <div class="dev-form-group">
                            <label>Qual o motivo desta ação?</label>
                            <div class="dev-radios">
                                <label class="dev-radio-item">
                                    <input type="radio" name="motivo" value="defeito"> Item com defeito ou vencido
                                </label>
                                <label class="dev-radio-item">
                                    <input type="radio" name="motivo" value="desistencia"> Desistência ou arrependimento
                                </label>
                                <label class="dev-radio-item">
                                    <input type="radio" name="motivo" value="erro_sistema"> Erro no sistema ou na operação
                                </label>
                                <label class="dev-radio-item">
                                    <input type="radio" name="motivo" value="outro"> 
                                    <span>Outro:</span>
                                    <input type="text" name="motivo_outro" placeholder="Especifique...">
                                </label>
                            </div>
                        </div>

                        <button class="btn-submit-action">Confirmar Operação</button>
                    </div>

                </div>

            </div>
        `;

        return modal;

    }

}