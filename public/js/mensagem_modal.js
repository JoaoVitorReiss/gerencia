let socket;
export class MensagemModal {
    static io_socket() {
        if (!socket) {
            socket = io(); 
            console.log("Socket iniciado");

            // MUDANÇA AQUI: Usando Arrow Function (dados) => { ... }
            socket.on('receber_mensagem', (dados) => {
                console.log("Mensagem recebida:", dados);
                
                // Agora o 'this' funciona porque a Arrow Function não cria um novo escopo
                this.renderizarNovaBolha(dados);
            });
        }
        return socket;
    }
    static mensagemHome() {
                const modal = `
            <div class="msg-container">
                <style>
                    /* Variáveis de cor fornecidas por você + algumas auxiliares */
                    .msg-container {
                        --primary-vendas: #3498db;
                        --vendas-dark: #1E3C72;
                        --vendas-success: #27ae60;
                        --bg-body: #f0f2f5;
                        --white: #ffffff;
                        --shadow: 0 8px 30px rgba(0,0,0,0.08);
                        
                        /* Cores auxiliares para bordas e textos secundários */
                        --gray-light: #e1e4e8;
                        --gray-text: #666666;
                        
                        font-family: inherit;
                        width: 100%;
                        height: 100%;
                        padding: 20px;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                        background-color: transparent;
                    }

                    /* Cabeçalho da página */
                    .msg-header h2 {
                        color: var(--vendas-dark);
                        margin: 0 0 8px 0;
                        font-size: 24px;
                    }
                    .msg-header p {
                        color: var(--gray-text);
                        margin: 0;
                        font-size: 14px;
                    }

                    /* Container Principal do Chat (Estilo Card) */
                    .msg-app-box {
                        display: flex;
                        background-color: var(--white);
                        border-radius: 12px;
                        box-shadow: var(--shadow);
                        overflow: hidden;
                        height: 70vh; /* Altura responsiva baseada na tela */
                        min-height: 500px;
                    }

                    /* --- Coluna da Esquerda: Lista de Contatos --- */
                    .msg-sidebar {
                        width: 320px;
                        border-right: 1px solid var(--gray-light);
                        display: flex;
                        flex-direction: column;
                        background-color: var(--white);
                    }

                    .msg-search {
                        padding: 16px;
                        border-bottom: 1px solid var(--gray-light);
                    }

                    .msg-search input {
                        width: 100%;
                        padding: 10px 15px;
                        border: 1px solid var(--gray-light);
                        border-radius: 20px;
                        outline: none;
                        background-color: var(--bg-body);
                        color: var(--vendas-dark);
                    }

                    .msg-list {
                        flex: 1;
                        overflow-y: auto;
                    }

                    .msg-item {
                        display: flex;
                        padding: 16px;
                        border-bottom: 1px solid var(--bg-body);
                        cursor: pointer;
                        transition: background 0.3s;
                    }

                    .msg-item:hover, .msg-item.active {
                        background-color: var(--bg-body);
                        border-left: 4px solid var(--primary-vendas);
                    }

                    .msg-avatar {
                        width: 45px;
                        height: 45px;
                        border-radius: 50%;
                        background-color: var(--primary-vendas);
                        color: var(--white);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 18px;
                        margin-right: 12px;
                        flex-shrink: 0;
                    }

                    .msg-item-content {
                        flex: 1;
                        overflow: hidden;
                    }

                    .msg-item-top {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 4px;
                    }

                    .msg-item-name {
                        margin: 0;
                        color: var(--vendas-dark);
                        font-size: 15px;
                        font-weight: 600;
                    }

                    .msg-item-time {
                        font-size: 12px;
                        color: var(--gray-text);
                    }

                    .msg-item-preview {
                        margin: 0;
                        font-size: 13px;
                        color: var(--gray-text);
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    /* --- Coluna da Direita: Área da Conversa --- */
                    .msg-chat-area {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        background-color: #f8f9fa; /* Fundo do chat levemente diferente */
                    }

                    .msg-chat-header {
                        padding: 16px 24px;
                        background-color: var(--white);
                        border-bottom: 1px solid var(--gray-light);
                        display: flex;
                        align-items: center;
                    }

                    .msg-chat-header-info h3 {
                        margin: 0 0 4px 0;
                        color: var(--vendas-dark);
                        font-size: 16px;
                    }

                    .msg-status {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        color: var(--vendas-success);
                        font-size: 13px;
                    }

                    .msg-status-dot {
                        width: 8px;
                        height: 8px;
                        background-color: var(--vendas-success);
                        border-radius: 50%;
                    }

                    .msg-history {
                        flex: 1;
                        padding: 24px;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    .msg-bubble {
                        max-width: 65%;
                        padding: 12px 16px;
                        border-radius: 16px;
                        font-size: 14px;
                        line-height: 1.5;
                        position: relative;
                    }

                    .msg-bubble.received {
                        align-self: flex-start;
                        background-color: var(--white);
                        color: var(--vendas-dark);
                        border: 1px solid var(--gray-light);
                        border-bottom-left-radius: 4px;
                    }

                    .msg-bubble.sent {
                        align-self: flex-end;
                        background-color: var(--primary-vendas);
                        color: var(--white);
                        border-bottom-right-radius: 4px;
                    }

                    .msg-bubble-time {
                        display: block;
                        font-size: 11px;
                        margin-top: 6px;
                        text-align: right;
                        opacity: 0.8;
                    }

                    .msg-input-area {
                        padding: 16px 24px;
                        background-color: var(--white);
                        border-top: 1px solid var(--gray-light);
                        display: flex;
                        gap: 12px;
                    }

                    .msg-input-area input {
                        flex: 1;
                        padding: 14px 16px;
                        border: 1px solid var(--gray-light);
                        border-radius: 24px;
                        outline: none;
                        background-color: var(--bg-body);
                    }

                    .msg-input-area button {
                        background-color: var(--primary-vendas);
                        color: var(--white);
                        border: none;
                        padding: 0 24px;
                        border-radius: 24px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: opacity 0.2s;
                    }

                    .msg-input-area button:hover {
                        opacity: 0.9;
                    }
                </style>

                <div class="msg-header">
                    <h2>Área de mensagens</h2>
                    <p>Aqui você pode visualizar as mensagens recebidas dos clientes e responder a elas.</p>
                </div>

                <div class="msg-app-box">
                    
                    <div class="msg-sidebar">
                        <div class="msg-search">
                            <input type="text" placeholder="Buscar cliente ou mensagem...">
                        </div>
                        
                        <div class="msg-list">
                            <div class="msg-item active">
                                <div class="msg-avatar">JL</div>
                                <div class="msg-item-content">
                                    <div class="msg-item-top">
                                        <h4 class="msg-item-name">João Lucas</h4>
                                        <span class="msg-item-time">10:45</span>
                                    </div>
                                    <p class="msg-item-preview">Gostaria de saber sobre o meu pedido.</p>
                                </div>
                            </div>
                            
                            <div class="msg-item">
                                <div class="msg-avatar" style="background-color: var(--vendas-dark);">MF</div>
                                <div class="msg-item-content">
                                    <div class="msg-item-top">
                                        <h4 class="msg-item-name">Maria Fernandes</h4>
                                        <span class="msg-item-time">Ontem</span>
                                    </div>
                                    <p class="msg-item-preview">Obrigada pelo excelente atendimento!</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="msg-chat-area">
                        
                        <div class="msg-chat-header">
                            <div class="msg-avatar">JL</div>
                            <div class="msg-chat-header-info">
                                <h3>João Lucas</h3>
                                <div class="msg-status">
                                    <div class="msg-status-dot"></div> Online
                                </div>
                            </div>
                        </div>

                        <div class="msg-history">
                            <div class="msg-bubble received">
                                Olá! Fiz uma compra ontem, gostaria de saber se o meu pedido já foi enviado.
                                <span class="msg-bubble-time">10:42</span>
                            </div>
                            
                            <div class="msg-bubble sent">
                                Bom dia, João! Tudo bem? Deixe-me verificar o status do seu pedido agora mesmo. Só um instante.
                                <span class="msg-bubble-time">10:44</span>
                            </div>

                            <div class="msg-bubble received">
                                Perfeito, fico no aguardo.
                                <span class="msg-bubble-time">10:45</span>
                            </div>
                        </div>

                        <div class="msg-input-area">
                            <input type="text" id="msg-input" placeholder="Digite sua mensagem aqui...">
                            <button id="btn-enviar-msg">Enviar</button>
                        </div>

                    </div>
                </div>
            </div>
        `;
        return modal;
    }
    static configurarEventos() {
        const btn = document.getElementById('btn-enviar-msg');
        const input = document.getElementById('msg-input');

        const dispararEnvio = () => {
            const texto = input.value;
            if (texto.trim() !== "") {
                // 1. Enviamos via Socket (Usando o ID 10 como teste por enquanto)
                this.enviarMensagem(10, texto);
                
                // 2. Limpamos o input
                input.value = "";
                input.focus();
            }
        };

        if (btn) btn.addEventListener('click', dispararEnvio);
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') dispararEnvio();
            });
        }
    }

    static enviarMensagem(idDestinatario, texto) {
        const socket = this.io_socket(); // Garante que temos a conexão
        
        const dados = {
            destinatario_id: idDestinatario,
            texto: texto,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        socket.emit('enviar_mensagem', dados);

        // Renderiza a nossa própria bolha (lado direito - sent)
        this.renderizarBolha(dados, 'sent');
    }

    static renderizarNovaBolha(dados) {
        const history = document.querySelector('.msg-history');
        if (history) {
            // Criamos a estrutura da bolha recebida
            const div = document.createElement('div');
            div.className = 'msg-bubble received';
            div.innerHTML = `
                ${dados.texto}
                <span class="msg-bubble-time">${dados.timestamp || 'agora'}</span>
            `;
            
            history.appendChild(div);
            history.scrollTop = history.scrollHeight; // Scroll para o final
        }
    }

}