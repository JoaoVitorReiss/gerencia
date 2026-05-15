let socket;
let contatoAtivoId = null;

export class MensagemModal {
    //Socket
    static io_socket() {
        if (!socket) {
            socket = io();
            console.log("Socket iniciado");

            socket.on('receber_mensagem', (dados) => {
                console.log("Mensagem recebida:", dados);

                this.tocarSomNotificacao();
                
                let nomeRemetente = "Novo contato";
                if (this._todosContatos) {
                    const c = this._todosContatos.find(x => x.id == dados.remetente_id);
                    if (c) nomeRemetente = c.nome;
                }
                
                // Exibe a notificação de sistema operacional (se permitido e se não estiver com o chat dele aberto/em foco)
                if (contatoAtivoId !== dados.remetente_id || document.hidden) {
                    this.mostrarNotificacaoBrowser(nomeRemetente, dados.texto);
                }

                // Se a mensagem é de quem está na conversa aberta, renderiza direto
                if (contatoAtivoId !== null && dados.remetente_id === contatoAtivoId) {
                    this.renderizarBolha({ texto: dados.texto, timestamp: dados.timestamp }, 'received');
                    // Marcar como lida imediatamente
                    fetch('/msg_lida', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_remetente: dados.remetente_id })
                    }).catch(() => {});
                }

                // Atualiza a prévia na sidebar para o contato remetente
                this.atualizarPreviewSidebar(dados.remetente_id, dados.texto);

                // Se não está na conversa ativa, incrementa as notificações
                if (contatoAtivoId !== dados.remetente_id) {
                    // O incrementarBadge atualiza o visual da sidebar
                    this.incrementarBadge(dados.remetente_id);

                    // Incrementa a notificação global no header
                    this._totalNaoLidas = (this._totalNaoLidas || 0) + 1;
                    this.atualizarBadgeGlobalUI();
                }
            });

            // Escuta a mudança de status (online/offline) dos contatos
            socket.on('usuario_status', (dados) => {
                this.atualizarStatusTempoReal(dados);
            });

            // Escuta mensagens marcadas como lidas
            socket.on('mensagens_lidas', (dados) => {
                if (contatoAtivoId == dados.by_user) {
                    this.marcarMensagensLidasUI();
                }
            });

            // Confirmação de envio (para poder excluir depois)
            socket.on('mensagem_enviada_ok', (dados) => {
                const bubble = document.querySelector(`.msg-bubble.sent[data-temp-id="${dados.temp_id}"]`);
                if (bubble) {
                    bubble.dataset.idMsg = dados.id_mensagem;
                    delete bubble.dataset.tempId;
                }
            });

            // Remove a mensagem apagada da tela
            socket.on('mensagem_apagada', (dados) => {
                const bubble = document.querySelector(`.msg-bubble[data-id-msg="${dados.id_mensagem}"]`);
                if (bubble) bubble.remove();
            });
        }
        return socket;
    }

    static marcarMensagensLidasUI() {
        const history = document.getElementById('msg-history');
        if (!history) return;
        const ticks = history.querySelectorAll('.msg-ticks.unread');
        ticks.forEach(t => {
            t.className = 'msg-ticks read';
            t.innerHTML = '✓✓';
        });
    }

    // Sons 

    static tocarSomNotificacao() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            oscillator.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            console.warn("Áudio bloqueado pelo navegador (requer interação do usuário antes).", e);
        }
    }

    static mostrarNotificacaoBrowser(nomeRemetente, texto) {
        if (!("Notification" in window)) return;

        const titulo = `Nova mensagem de ${nomeRemetente}`;
        const opcoes = {
            body: texto,
            icon: '/img/icon/icon.png' //logo padrão do sistema
        };

        if (Notification.permission === "granted") {
            new Notification(titulo, opcoes);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(titulo, opcoes);
                }
            });
        }
    }

    //  Notificações Globais (fora do chat) 
    
    static async inicializarNotificacoesGlobais() {
        if (this._notificacoesIniciadas) return;
        this._notificacoesIniciadas = true;
        this._totalNaoLidas = 0;

        try {
            const res = await fetch('/contatos_msg');
            if (res.ok) {
                const { contatos } = await res.json();
                this._totalNaoLidas = contatos.reduce((sum, c) => sum + (c.nao_lidas || 0), 0);
                this.atualizarBadgeGlobalUI();
            }
        } catch (e) {
            console.error('Erro buscar notificacoes globais:', e);
        }

        this.io_socket();
    }

    static atualizarBadgeGlobalUI() {
        const botoes = [
            document.getElementById('btn_mensagem'), // Página de Vendas
            document.getElementById('mensagem')      // Página de Adm
        ];

        botoes.forEach(btn => {
            if (!btn) return;
            btn.style.position = 'relative'; 
            
            let badge = btn.querySelector('.global-msg-badge');
            if (this._totalNaoLidas > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'global-msg-badge';
                    badge.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border-radius: 50%; font-size: 11px; font-weight: bold; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; pointer-events: none;';
                    btn.appendChild(badge);
                }
                badge.textContent = this._totalNaoLidas > 99 ? '99+' : this._totalNaoLidas;
            } else if (badge) {
                badge.remove();
            }
        });
    }

    static subtrairNaoLidasGlobais(quantidade) {
        if (!this._totalNaoLidas) this._totalNaoLidas = 0;
        this._totalNaoLidas = Math.max(0, this._totalNaoLidas - quantidade);
        this.atualizarBadgeGlobalUI();
    }

    //  HTML e CSS 
static mensagemHome() {
    return `
        <div class="msg-modal-root">
            <style>
                /* ===== RESET TOTAL DENTRO DO MODAL ===== */
                .msg-modal-root,
                .msg-modal-root *,
                .msg-modal-root *::before,
                .msg-modal-root *::after {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                    font-family: inherit;
                    line-height: 1.4;
                    word-break: break-word;
                }

                .msg-modal-root {
                    all: initial;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: calc(100vh - 120px); /* Força altura limite para habilitar scroll interno */
                    min-height: 400px;
                    background: #f0f2f5;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #1E3C72;
                    overflow: hidden;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                /* Reaplica variáveis */
                .msg-modal-root {
                    --primary: #3498db;
                    --dark: #1E3C72;
                    --success: #27ae60;
                    --bg: #f0f2f5;
                    --white: #ffffff;
                    --shadow: 0 8px 30px rgba(0,0,0,0.08);
                    --border: #e1e4e8;
                    --text-light: #666;
                }

                /* Header */
                .msg-header {
                    padding: 1.25rem 1.5rem 0.75rem;
                    background: var(--white);
                    border-bottom: 1px solid var(--border);
                }
                .msg-header h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--dark);
                    margin-bottom: 0.25rem;
                }
                .msg-header p {
                    font-size: 0.875rem;
                    color: var(--text-light);
                }

                /* App box principal – ocupa o espaço restante */
                .msg-app-box {
                    display: flex;
                    flex: 1;
                    min-height: 0;  /* essencial para scroll interno */
                    background: var(--white);
                    box-shadow: var(--shadow);
                    border-radius: 0;  /* remover se precisar de cantos arredondados só no wrapper */
                }

                /* Sidebar */
                .msg-sidebar {
                    width: 300px;
                    min-width: 260px;
                    max-width: 40%;
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    background: var(--white);
                }
                .msg-search {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid var(--border);
                }
                .msg-search input {
                    width: 100%;
                    padding: 0.6rem 1rem;
                    border: 1px solid var(--border);
                    border-radius: 2rem;
                    outline: none;
                    background: var(--bg);
                    font-size: 0.9rem;
                    color: var(--dark);
                }
                .msg-list {
                    flex: 1;
                    overflow-y: auto;
                    min-height: 0;
                }
                .msg-list-loading {
                    text-align: center;
                    color: var(--text-light);
                    padding: 2rem;
                    font-size: 0.9rem;
                }

                /* Item de contato */
                .msg-item {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid var(--bg);
                    cursor: pointer;
                    transition: background 0.2s;
                    position: relative;
                }
                .msg-item:hover, .msg-item.active {
                    background: var(--bg);
                    border-left: 4px solid var(--primary);
                }
                .msg-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: var(--white);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 1rem;
                    margin-right: 0.75rem;
                    flex-shrink: 0;
                    overflow: hidden;
                }
                .msg-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .msg-online-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #ccc;
                    margin-right: 0.5rem;
                    flex-shrink: 0;
                }
                .msg-online-dot.online { background: var(--success); }
                .msg-item-content {
                    flex: 1;
                    min-width: 0;
                }
                .msg-item-top {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.2rem;
                }
                .msg-item-name {
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: var(--dark);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .msg-item-time {
                    font-size: 0.75rem;
                    color: var(--text-light);
                    white-space: nowrap;
                }
                .msg-item-preview {
                    font-size: 0.8rem;
                    color: var(--text-light);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .msg-badge {
                    position: absolute;
                    right: 0.75rem;
                    bottom: 0.75rem;
                    background: var(--primary);
                    color: #fff;
                    border-radius: 50%;
                    font-size: 0.7rem;
                    font-weight: 700;
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Área de chat */
                .msg-chat-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: #f8f9fa;
                    min-width: 0;
                }
                .msg-chat-placeholder {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-light);
                    font-size: 1rem;
                    text-align: center;
                    padding: 2rem;
                }
                .msg-chat-header {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1.5rem;
                    background: var(--white);
                    border-bottom: 1px solid var(--border);
                }
                .msg-chat-header-info h3 {
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: var(--dark);
                    margin-bottom: 0.2rem;
                }
                .msg-status {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    font-size: 0.8rem;
                    color: var(--success);
                }
                .msg-status.offline { color: var(--text-light); }
                .msg-status-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--success);
                    border-radius: 50%;
                }
                .msg-status-dot.offline { background: #ccccccff; }
                .msg-history {
                    flex: 1;
                    padding: 1.5rem;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    min-height: 0;
                }
                .msg-history-loading {
                    text-align: center;
                    color: var(--text-light);
                    font-size: 0.85rem;
                    padding: 2rem 0;
                }
                .msg-bubble {
                    max-width: 70%;
                    padding: 0.75rem 1rem;
                    border-radius: 1rem;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    word-break: break-word;
                }
                .msg-bubble.received {
                    align-self: flex-start;
                    background: #cee4ffff; //COr do balão ds mensagem recebida
                    color: var(--dark);
                    border: 1px solid var(--border);
                    border-bottom-left-radius: 0.25rem;
                }
                .msg-bubble.sent {
                    align-self: flex-end;
                    background: var(--primary);
                    color: white;
                    border-bottom-right-radius: 0.25rem;
                    position: relative;
                    z-index: 1;
                }
                .msg-bubble.sent:hover {
                    z-index: 999;
                }
                .msg-bubble-time {
                    display: block;
                    font-size: 0.65rem;
                    margin-top: 0.3rem;
                    text-align: right;
                    opacity: 0.7;
                }
                .msg-ticks {
                    display: inline-block;
                    margin-left: 4px;
                    font-size: 1rem;
                    letter-spacing: -1px;
                    text-decoration: underline;
                    text-decoration-style: solid;
                    text-decoration-thickness: 2px;
                }
                .msg-ticks.read {
                    color: lime; /* Verde para lida */
                    text-decoration-color: lime;
                }
                .msg-ticks.unread {
                    color: white; 
                    text-decoration-color: white;
                }
                .msg-options-btn {
                    display: none;
                    cursor: pointer;
                    margin-left: 5px;
                    font-size: 0.9rem;
                    color: rgba(255,255,255,0.7);
                }
                .msg-bubble.sent:hover .msg-options-btn {
                    display: inline-block;
                }
                .msg-options-btn:hover {
                    color: white;
                }
                .msg-options-menu {
                    display: none;
                    position: absolute;
                    right: 0;
                    bottom: -30px;
                    background: white;
                    color: #e74c3c;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 5px 10px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    z-index: 100;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    white-space: nowrap;

                    margin-top: -45px;
                    position: absolute;
                }
                .msg-options-menu:hover {
                    background: #ffffffff;
                }
                .msg-input-area {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--white);
                    border-top: 1px solid var(--border);
                }
                .msg-input-area input {
                    flex: 1;
                    padding: 0.7rem 1rem;
                    border: 1px solid var(--border);
                    border-radius: 2rem;
                    outline: none;
                    background: var(--bg);
                    font-size: 0.9rem;
                }
                .msg-input-area button {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 0 1.5rem;
                    border-radius: 2rem;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: opacity 0.2s;
                    white-space: nowrap;
                }
                .msg-input-area button:hover { opacity: 0.88; }
                .msg-input-area button:disabled { opacity: 0.5; cursor: not-allowed; }
            </style>

            <div class="msg-header">
                <h2>Mensagens</h2>
                <!-- <p>Selecione um contato para iniciar uma conversa.</p> -->
            </div>

            <div class="msg-app-box">
                <div class="msg-sidebar">
                    <div class="msg-search">
                        <input type="text" id="msg-busca" placeholder="Buscar contato..." autocomplete="off">
                    </div>
                    <div class="msg-list" id="msg-lista-contatos">
                        <p class="msg-list-loading">Carregando contatos...</p>
                    </div>
                </div>

                <div class="msg-chat-area" id="msg-chat-area">
                    <div class="msg-chat-placeholder">
                        👈 Selecione um contato para ver a conversa
                    </div>
                </div>
            </div>
        </div>
    `;
}

    // Inicialização após injetar o HTML

    static async configurarEventos() {
        await this.carregarContatos();
        this.configurarBusca();
        
        // Fecha menu de opções ao clicar fora
        document.addEventListener('click', () => {
            document.querySelectorAll('.msg-options-menu').forEach(m => m.style.display = 'none');
        });
    }

    // Cálculo de status (Online / Offline / Visto por último)

    static calcularStatus(contato) {
        let textoOffline = 'Offline';
        if (contato.ultima_atividade) {
            const dataUltima = new Date(contato.ultima_atividade);
            const agora = new Date();
            
            // Zerar horas para comparar apenas os dias
            const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
            const dataAtiv = new Date(dataUltima.getFullYear(), dataUltima.getMonth(), dataUltima.getDate());
            
            const difDias = Math.floor((hoje - dataAtiv) / (1000 * 60 * 60 * 24));
            const hora = dataUltima.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            if (difDias === 0) {
                textoOffline = `Visto por último às ${hora}`;
            } else if (difDias === 1) {
                textoOffline = `Visto por último Ontem às ${hora}`;
            } else {
                const data = dataUltima.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                textoOffline = `Visto por último ${data} às ${hora}`;
            }
        }

        // Se está offline ou não tem registro
        if (!contato.status_online || contato.status_online === 0 || contato.status_online === "0" || contato.status_online === false) {
            return { status: 'offline', texto: textoOffline };
        }

        if (!contato.ultima_atividade) {
            return { status: 'offline', texto: 'Offline' };
        }

        const minutos = (Date.now() - new Date(contato.ultima_atividade)) / 60000;

        if (minutos < 15) {
            // Ativo nos últimos 15 minutos e status_online = 1
            return { status: 'online', texto: 'Online' };
        }
        
        // Passou de 15 minutos, consideramos offline e mostramos a hora
        return { status: 'offline', texto: textoOffline };
    }

    static atualizarStatusTempoReal({ id, status, timestamp }) {
        // Atualiza a cache local para que a busca/renderização posterior mantenha o estado
        if (this._todosContatos) {
            const contato = this._todosContatos.find(c => c.id == id);
            if (contato) {
                contato.status_online = status === 'online' ? 1 : 0;
                contato.ultima_atividade = timestamp;
            }
        }

        // Calcula o estado visual correto
        const mockContato = { 
            status_online: status === 'online' ? 1 : 0, 
            ultima_atividade: timestamp 
        };
        const st = this.calcularStatus(mockContato);

        // Atualiza a bolinha de status
        const itemSidebar = document.querySelector(`.msg-item[data-id="${id}"]`);
        if (itemSidebar) {
            const dot = itemSidebar.querySelector('.msg-online-dot');
            if (dot) dot.className = `msg-online-dot ${st.status}`;
        }

        // Atualiza o texto e a bolinha se o chat desse contato estiver aberto
        if (contatoAtivoId == id) {
            const statusDiv = document.querySelector('.msg-chat-header-info .msg-status');
            if (statusDiv) {
                statusDiv.className = `msg-status ${st.status}`;
                statusDiv.innerHTML = `<div class="msg-status-dot ${st.status}"></div> ${st.texto}`;
            }
        }
    }

    //  Busca e renderiza a lista de contatos

    static async carregarContatos() {
        const lista = document.getElementById('msg-lista-contatos');
        if (!lista) return;

        try {
            const res = await fetch('/contatos_msg');
            if (!res.ok) throw new Error('Falha ao buscar contatos');
            const { contatos } = await res.json();

            this._todosContatos = contatos; 
            this.renderizarListaContatos(contatos);
        } catch (err) {
            lista.innerHTML = '<p class="msg-list-loading">Erro ao carregar contatos.</p>';
            console.error(err);
        }
    }

    static renderizarListaContatos(contatos) {
        const lista = document.getElementById('msg-lista-contatos');
        if (!lista) return;

        if (!contatos || contatos.length === 0) {
            lista.innerHTML = '<p class="msg-list-loading">Nenhum contato encontrado.</p>';
            return;
        }

        lista.innerHTML = '';
        for (const contato of contatos) {
            const item = this.criarItemContato(contato);
            lista.appendChild(item);
        }
    }

    static criarItemContato(contato) {
        const iniciais = contato.nome
            .split(' ')
            .slice(0, 2)
            .map(p => p[0])
            .join('')
            .toUpperCase();

        const st = this.calcularStatus(contato);
        const preview = contato.ultima_mensagem
            ? contato.ultima_mensagem.substring(0, 40) + (contato.ultima_mensagem.length > 40 ? '...' : '')
            : 'Nenhuma mensagem ainda';

        const hora = contato.data_ultima_msg
            ? new Date(contato.data_ultima_msg).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

        const avatarHTML = contato.foto_url
            ? `<img src="${contato.foto_url}" alt="${contato.nome}">`
            : iniciais;

        const item = document.createElement('div');
        item.className = 'msg-item';
        item.dataset.id = contato.id;
        item.dataset.nome = contato.nome;
        item.innerHTML = `
            <div class="msg-avatar">${avatarHTML}</div>
            <div class="msg-online-dot ${st.status}"></div>
            <div class="msg-item-content">
                <div class="msg-item-top">
                    <h4 class="msg-item-name">${contato.nome}</h4>
                    <span class="msg-item-time">${hora}</span>
                </div>
                <p class="msg-item-preview">${preview}</p>
            </div>
            ${contato.nao_lidas > 0 ? `<span class="msg-badge">${contato.nao_lidas}</span>` : ''}
        `;

        item.addEventListener('click', () => this.abrirConversa(contato.id, contato.nome, st, item));
        return item;
    }

    // abre conversa com um contato 

    static async abrirConversa(id_contato, nome, st, itemEl) {
        contatoAtivoId = id_contato;

        // Marca visualmente o item como ativo
        document.querySelectorAll('.msg-item').forEach(i => i.classList.remove('active'));
        if (itemEl) itemEl.classList.add('active');

        // Remove badge da sidebar do modal e subtrai do global
        const badge = itemEl?.querySelector('.msg-badge');
        if (badge) {
            const naoLidasSidebar = parseInt(badge.textContent) || 0;
            if (naoLidasSidebar > 0) this.subtrairNaoLidasGlobais(naoLidasSidebar);
            badge.remove();
        } else if (this._todosContatos) {
            const c = this._todosContatos.find(x => x.id == id_contato);
            if (c && c.nao_lidas > 0) {
                this.subtrairNaoLidasGlobais(c.nao_lidas);
                c.nao_lidas = 0;
            }
        }

        const chatArea = document.getElementById('msg-chat-area');
        if (!chatArea) return;

        const avatarHTML = this.obterAvatarDoItem(itemEl);

        chatArea.innerHTML = `
            <div class="msg-chat-header">
                <div class="msg-avatar" style="margin-right:12px;">${avatarHTML}</div>
                <div class="msg-chat-header-info">
                    <h3 id="msg-chat-nome">${nome}</h3>
                    <div class="msg-status ${st.status}">
                        <div class="msg-status-dot ${st.status}"></div> ${st.texto}
                    </div>
                </div>
            </div>
            <div class="msg-history" id="msg-history">
                <p class="msg-history-loading">Carregando mensagens...</p>
            </div>
            <div class="msg-input-area">
                <input type="text" id="msg-input" placeholder="Digite sua mensagem..." autocomplete="off">
                <button id="btn-enviar-msg">Enviar</button>
            </div>
        `;

        this.configurarEnvio(id_contato);
        await this.carregarHistorico(id_contato);
    }

    static obterAvatarDoItem(itemEl) {
        if (!itemEl) return '?';
        const avatar = itemEl.querySelector('.msg-avatar');
        return avatar ? avatar.innerHTML : '?';
    }

    // Carrega histórico de mensagens

    static async carregarHistorico(id_contato) {
        const history = document.getElementById('msg-history');
        if (!history) return;

        try {
            const res = await fetch(`/conversa/${id_contato}`);
            if (!res.ok) throw new Error('Falha ao buscar histórico');
            const { mensagens } = await res.json();

            history.innerHTML = '';

            if (!mensagens || mensagens.length === 0) {
                history.innerHTML = '<p class="msg-history-loading">Sem mensagens ainda. Seja o primeiro a escrever! 👋</p>';
                return;
            }

            const meuId = window.usuarioLogado?.id;
            for (const msg of mensagens) {
                const tipo = msg.id_remetente === meuId ? 'sent' : 'received';
                this.renderizarBolha({ texto: msg.mensagem_texto, timestamp: msg.hora, lida: msg.lida, id_mensagem: msg.id_mensagem }, tipo);
            }

            history.scrollTop = history.scrollHeight;
        } catch (err) {
            history.innerHTML = '<p class="msg-history-loading">Erro ao carregar mensagens.</p>';
            console.error(err);
        }
    }

    // Configura envio de mensagem 

    static configurarEnvio(id_destinatario) {
        const btn = document.getElementById('btn-enviar-msg');
        const input = document.getElementById('msg-input');
        if (!btn || !input) return;

        const disparar = () => {
            const texto = input.value.trim();
            if (!texto) return;
            this.enviarMensagem(id_destinatario, texto);
            input.value = '';
            input.focus();
        };

        btn.addEventListener('click', disparar);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                disparar();
            }
        });
    }

    // -> Envia mensagem via socket

    static enviarMensagem(idDestinatario, texto) {
        const sock = this.io_socket();
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temp_id = Date.now().toString() + Math.random().toString(36).substr(2, 5);

        const dados = {
            temp_id,
            destinatario_id: idDestinatario,
            texto,
            timestamp
        };

        sock.emit('enviar_mensagem', dados);

        this.renderizarBolha({ texto, timestamp, lida: 0, temp_id }, 'sent');

        this.atualizarPreviewSidebar(idDestinatario, texto);
    }

    // renderiza uma bolha na área de histórico
    static renderizarBolha({ texto, timestamp, lida, id_mensagem, temp_id }, tipo) {
        const history = document.getElementById('msg-history');
        if (!history) return;


        const placeholder = history.querySelector('.msg-history-loading');
        if (placeholder) placeholder.remove();

        let ticksHtml = '';
        let optionsHtml = '';

        if (tipo === 'sent') {
            const isLida = lida === 1 || lida === true;
            const icon = isLida ? '✓✓' : '✓';
            const className = isLida ? 'msg-ticks read' : 'msg-ticks unread';
            ticksHtml = `<span class="${className}">${icon}</span>`;
            
            optionsHtml = `
                <span class="msg-options-btn" title="Opções">⋮</span>
                <div class="msg-options-menu">Excluir mensagem</div>
            `;
        }

        const div = document.createElement('div');
        div.className = `msg-bubble ${tipo}`;
        div.style.position = 'relative'; 
        if (id_mensagem) div.dataset.idMsg = id_mensagem;
        if (temp_id) div.dataset.tempId = temp_id;

        div.innerHTML = `
            ${this.escaparHTML(texto)}
            <span class="msg-bubble-time">${timestamp || 'agora'}${ticksHtml} ${optionsHtml}</span>
        `;

        if (tipo === 'sent') {
            const btn = div.querySelector('.msg-options-btn');
            const menu = div.querySelector('.msg-options-menu');
            if (btn && menu) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = menu.style.display === 'block';
                    document.querySelectorAll('.msg-options-menu').forEach(m => m.style.display = 'none');
                    menu.style.display = isVisible ? 'none' : 'block';
                });
                menu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idMsg = div.dataset.idMsg;
                    if (idMsg) {
                        const socket = this.io_socket();
                        socket.emit('excluir_mensagem', { id_mensagem: idMsg, id_destinatario: contatoAtivoId });
                        menu.style.display = 'none';
                    } else {
                        alert("Aguarde o envio da mensagem para poder excluir.");
                    }
                });
            }
        }

        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    //Utilitários

    static atualizarPreviewSidebar(id_contato, texto) {
        const item = document.querySelector(`.msg-item[data-id="${id_contato}"]`);
        if (!item) return;
        const preview = item.querySelector('.msg-item-preview');
        const time = item.querySelector('.msg-item-time');
        if (preview) preview.textContent = texto.substring(0, 40) + (texto.length > 40 ? '...' : '');
        if (time) time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    static incrementarBadge(id_contato) {
        const item = document.querySelector(`.msg-item[data-id="${id_contato}"]`);
        if (!item) return;
        let badge = item.querySelector('.msg-badge');
        if (badge) {
            badge.textContent = parseInt(badge.textContent) + 1;
        } else {
            badge = document.createElement('span');
            badge.className = 'msg-badge';
            badge.textContent = '1';
            item.appendChild(badge);
        }
    }

    static configurarBusca() {
        const inputBusca = document.getElementById('msg-busca');
        if (!inputBusca) return;
        inputBusca.addEventListener('input', () => {
            const termo = inputBusca.value.toLowerCase().trim();
            const filtrado = (this._todosContatos || []).filter(c =>
                c.nome.toLowerCase().includes(termo)
            );
            this.renderizarListaContatos(filtrado);
        });
    }

    static escaparHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}