let idFuncionario_clicado = null;
class GetLista {
    static async lista_funcionarios() {
        try {
            
            const resposta = await fetch(`/lista_Cfuncionarios?t=${new Date().getTime()}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status}`);
            }

            const dados = await resposta.json();
            //console.log("📥 Dados atualizados:", dados);

            let funcionarios = Array.isArray(dados.lista) ? dados.lista : [];
            this.renderizarTabela(funcionarios);

        } catch (error) {
            console.error("Erro ao obter lista:", error);
        }
    }

    static calcularStatus(func) {
        if (func.status_online === 0 || func.status_online === "0" || func.status_online === false) {
            return { status: "offline", texto: "Offline", cor: "🔴" };
        }

        // Se não houver registro de atividade, tratamos como offline
        if (!func.ultima_atividade) {
            return { status: "offline", texto: "Offline", cor: "🔴" };
        }

        const agora = new Date();
        const ultima = new Date(func.ultima_atividade);
        const milissegundos = agora - ultima;
        const minutos = milissegundos / (1000 * 60);

        if (minutos < 5) {
            // Ativo nos últimos 5 minutos
            return { status: "online", texto: "Online", cor: "🟢" };
        } else if (minutos < 15) {
            // Entre 5 e 15 minutos sem atividade
            return { status: "ausente", texto: "Ausente", cor: "🟠" };
        } else {
            // Mais de 15 minutos sem atividade
            return { status: "offline", texto: "Inativo", cor: "🔴" };
        }
    }

    static renderizarTabela(funcionarios) {
        const tbody = document.getElementById('tbody-funcionarios');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!funcionarios || funcionarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px;">Nenhum funcionário encontrado.</td></tr>`;
            return;
        }

        funcionarios.forEach(func => {
            const statusInfo = this.calcularStatus(func);
            const nivelTexto = func.tipo_funcionario_funcionario == 2 ? 'Admin' : 'Vendedor';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="foto-cell">
                    ${func.foto_url ? `<img src="${func.foto_url}" alt="Foto">` : `<div class="placeholder">👤</div>`}
                </td>
                <td><strong>${func.nome_funcionario_funcionario || 'Sem nome'}</strong></td>
                <td>${func.email_funcionario_funcionario || '-'}</td>
                <td>${func.telefone_funcionario || '-'}</td>
                <td>${nivelTexto}</td>
                <td>R$ ${parseFloat(func.salario_funcionario || 0).toFixed(2)}</td>
                <td><span class="status ${statusInfo.status}">${statusInfo.cor} ${statusInfo.texto}</span></td>
                <td>${func.ultima_atividade ? new Date(func.ultima_atividade).toLocaleString('pt-BR') : 'Nunca'}</td>
                <td class="acoes">
                    <button class="btn-ver"  id=${func.id_funcionario_funcionario}">Ver</button>
                    <button class="btn-edit" id=${func.id_funcionario_funcionario}>Editar</button>
                    <!-- <button class="btn-excluir" onclick="excluirFuncionario(${func.id_funcionario_funcionario})">Excluir</button> -->
                </td>
            `;
            tbody.appendChild(row);
        });

        filtrarTabela();
        acaverInfo();
        acaoEditar();

    }

    static init() {
        this.lista_funcionarios(); 

        setInterval(() => {
            if (!document.hidden) {
                this.lista_funcionarios();
            }
        }, 5000); 
    }
}

class ModalDetalhesFuncionario {

    static abrir(dados) {
        if (!dados) return;

        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay-detalhes';

        const statusInfo = this.getStatusInfo(dados);

        overlay.innerHTML = `
            <div id="modal-detalhes-container">
                <div class="modal-header">
                    <h2>Detalhes do Funcionário</h2>
                    <button id="fechar-modal-detalhes">&times;</button>
                </div>

                <div class="modal-body">
                    <!-- Foto -->
                    <div class="foto-perfil-container">
                        <div class="foto-perfil">
                            ${dados.foto_url 
                                ? `<img src="${dados.foto_url}" alt="${dados.nome}">`
                                : `<span class="placeholder">👤</span>`
                            }
                        </div>
                    </div>

                    <div class="info-principal">
                        <h3>${dados.nome || 'Nome não informado'}</h3>
                        <p class="email">${dados.email || '-'}</p>
                    </div>

                    <div class="status-atual">
                        <span class="status ${statusInfo.status}">
                            ${statusInfo.cor} ${statusInfo.texto}
                        </span>
                    </div>

                    <div class="detalhes-grid">
                        <div class="info-item">
                            <label>ID</label>
                            <p>${dados.id_funcionario}</p>
                        </div>
                        <div class="info-item">
                            <label>Tipo</label>
                            <p>${dados.tipo_funcionario || 'Funcionário'}</p>
                        </div>
                        <div class="info-item">
                            <label>Telefone</label>
                            <p>${dados.telefone || 'Não informado'}</p>
                        </div>
                        <div class="info-item">
                            <label>Salário</label>
                            <p>${dados.salario ? `R$ ${parseFloat(dados.salario).toFixed(2)}` : 'Não definido'}</p>
                        </div>

                        <!-- Vendas -->
                        <div class="info-item">
                            <label>Total de Vendas</label>
                            <p><strong>${dados.total_vendas_realizadas}</strong></p>
                        </div>
                        <div class="info-item">
                            <label>Valor Total Vendido</label>
                            <p><strong>R$ ${parseFloat(dados.valor_total_vendido || 0).toFixed(2)}</strong></p>
                        </div>
                        <div class="info-item">
                            <label>Ticket Médio</label>
                            <p>R$ ${parseFloat(dados.ticket_medio || 0).toFixed(2)}</p>
                        </div>
                        <div class="info-item">
                            <label>Itens Vendidos</label>
                            <p>${dados.quantidade_itens_vendidos}</p>
                        </div>

                        <!-- Datas -->
                        <div class="info-item">
                            <label>Última Venda</label>
                            <p>${dados.data_ultima_venda 
                                ? new Date(dados.data_ultima_venda).toLocaleDateString('pt-BR') + ' às ' + dados.hora_ultima_venda 
                                : 'Nenhuma venda registrada'}</p>
                        </div>
                        <div class="info-item">
                            <label>Último Login</label>
                            <p>${dados.ultimo_login 
                                ? new Date(dados.ultimo_login).toLocaleString('pt-BR') 
                                : 'Nunca'}</p>
                        </div>
                        <div class="info-item">
                            <label>Última Atividade</label>
                            <p>${dados.ultima_atividade 
                                ? new Date(dados.ultima_atividade).toLocaleString('pt-BR') 
                                : 'Nunca'}</p>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-fechar" id="btn-fechar-detalhes">Fechar</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Eventos
        const fechar = () => overlay.remove();

        document.getElementById('fechar-modal-detalhes').onclick = fechar;
        document.getElementById('btn-fechar-detalhes').onclick = fechar;

        overlay.onclick = (e) => {
            if (e.target === overlay) fechar();
        };
    }

    static getStatusInfo(dados) {
        if (dados.status_online == 1) {
            return { status: "online", texto: "Online", cor: "🟢" };
        } else {
            // Fallback para tempo quando offline
            if (!dados.ultima_atividade) {
                return { status: "offline", texto: "Offline", cor: "🔴" };
            }

            const minutos = (new Date() - new Date(dados.ultima_atividade)) / (1000 * 60);

            if (minutos < 5) return { status: "online", texto: "Online", cor: "🟢" };
            if (minutos < 15) return { status: "ausente", texto: "Ausente", cor: "🟠" };
            return { status: "offline", texto: "Offline", cor: "🔴" };
        }
    }
}

// class ModalEditarFuncionario {

//     static abrir(dados) {
//         if (!dados) {
//             alert("Erro: Nenhum dado recebido para edição.");
//             return;
//         }

//         const overlay = document.createElement('div');
//         overlay.id = 'modal-overlay-editar';

//         overlay.innerHTML = `
//             <div id="modal-editar-container">
//                 <div class="modal-header">
//                     <h2>Editar Funcionário</h2>
//                     <button id="fechar-modal-editar">&times;</button>
//                 </div>

//                 <div class="modal-body">
//                     <form id="form-editar-funcionario">

//                         <!-- Foto -->
//                         <div class="foto-container">
//                             <div class="foto-preview" id="foto-preview-edit">
//                                 ${dados.foto_url 
//                                     ? `<img src="${dados.foto_url}" alt="Foto atual">`
//                                     : `<span class="placeholder">👤</span>`
//                                 }
//                             </div>
//                             <div>
//                                 <label for="foto-edit">Alterar foto (opcional)</label>
//                                 <input type="file" id="foto-edit" accept="image/*">
//                                 <input type="hidden" id="foto_url_atual" value="${dados.foto_url || ''}">
//                             </div>
//                         </div>

//                         <div class="campo-grupo">
//                             <label for="nome-edit">Nome Completo *</label>
//                             <input type="text" id="nome-edit" value="${dados.nome || ''}" required>
//                         </div>

//                         <div class="linha-dupla">
//                             <div class="campo-grupo">
//                                 <label for="email-edit">E-mail *</label>
//                                 <input type="email" id="email-edit" value="${dados.email || ''}" required>
//                             </div>
//                             <div class="campo-grupo">
//                                 <label for="telefone-edit">Telefone</label>
//                                 <input type="tel" id="telefone-edit" value="${dados.telefone || ''}">
//                             </div>
//                         </div>

//                         <div class="linha-dupla">
//                             <div class="campo-grupo">
//                                 <label for="cpf-edit">CPF</label>
//                                 <input type="text" id="cpf-edit" value="${dados.cpf || ''}" maxlength="14">
//                             </div>
//                             <div class="campo-grupo">
//                                 <label for="salario-edit">Salário (R$)</label>
//                                 <input type="number" id="salario-edit" step="0.01" value="${dados.salario || ''}">
//                             </div>
//                         </div>

//                         <div class="campo-grupo">
//                             <label for="cargo-edit">Cargo / Nível</label>
//                             <select id="cargo-edit">
//                                 <option value="2" ${dados.id_cargo == 2 ? 'selected' : ''}>Administrador</option>
//                                 <option value="1" ${dados.id_cargo == 1 ? 'selected' : ''}>Vendedor</option>
//                             </select>
//                         </div>

//                         <!-- Troca de Senha -->
//                         <div class="campo-grupo">
//                             <label>Nova Senha (deixe em branco se não quiser alterar)</label>
//                             <input type="password" id="nova-senha" placeholder="Digite a nova senha">
//                         </div>

//                         <div class="modal-footer">
//                             <button type="button" class="btn-cancelar" id="btn-cancelar-edit">Cancelar</button>
//                             <button type="button" class="btn-salvar" id="btn-salvar-edit">Salvar Alterações</button>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         `;

//         document.body.appendChild(overlay);

//         // Eventos
//         const fechar = () => overlay.remove();

//         document.getElementById('fechar-modal-editar').onclick = fechar;
//         document.getElementById('btn-cancelar-edit').onclick = fechar;

//         // Salvar
//         document.getElementById('btn-salvar-edit').onclick = () => {
//             this.salvarAlteracoes(dados.id_funcionario, fechar);
//         };

//         // Fechar ao clicar fora
//         overlay.onclick = (e) => {
//             if (e.target === overlay) fechar();
//         };
//     }

//    static async salvarAlteracoes(id, fecharCallback) {
//     const payload = {
//         nome: document.getElementById('nome-edit').value.trim(),
//         email: document.getElementById('email-edit').value.trim(),
//         telefone: document.getElementById('telefone-edit').value.trim() || null,
//         cpf: document.getElementById('cpf-edit').value.trim(),
//         salario: parseFloat(document.getElementById('salario-edit').value) || 0,
//         id_cargo: parseInt(document.getElementById('cargo-edit').value),
//         nova_senha: document.getElementById('nova-senha').value.trim() || null
//         // foto_url NÃO vai aqui (é enviada via FormData se houver upload)
//     };

//     // Validação básica
//     if (!payload.nome || !payload.email || !payload.cpf) {
//         alert("Nome, E-mail e CPF são obrigatórios!");
//         return;
//     }

//     if (isNaN(payload.id_cargo) || payload.id_cargo <= 0) {
//         alert("Selecione um cargo válido!");
//         return;
//     }

//     try {
//         // Se você NÃO estiver enviando foto, pode usar JSON normal:
//         const response = await fetch(`/editar-funcionario/${id}`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(payload)
//         });

//         const resultado = await response.json();

//         if (response.ok) {
//             alert("✅ Funcionário atualizado com sucesso!");
//             GetLista.lista_funcionarios();   // Atualiza a lista
//             if (fecharCallback) fecharCallback();
//         }
//     } catch (error) {
//         console.error("Erro na requisição:", error);
//         alert("Erro de conexão ao salvar as alterações.");
//     }
// }
// }





// ====================== FUNÇÕES GLOBAIS ======================

function filtrarTabela() {
    const buscaInput = document.getElementById('busca');
    const filtroStatusInput = document.getElementById('filtro-status');
    
    if (!buscaInput || !filtroStatusInput) return;

    const busca = buscaInput.value.toLowerCase().trim();
    const filtroStatus = filtroStatusInput.value.toLowerCase();
    const rows = document.querySelectorAll('#tbody-funcionarios tr');

    rows.forEach(row => {
        if (row.cells.length < 7) return; 

        const nome = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const statusText = row.cells[6].textContent.toLowerCase();

        const matchBusca = !busca || nome.includes(busca) || email.includes(busca);
        const matchStatus = !filtroStatus || statusText.includes(filtroStatus);

        row.style.display = (matchBusca && matchStatus) ? '' : 'none';
    });
}

function acaverInfo(){
    const bntsVer = document.querySelectorAll(".btn-ver");
    bntsVer.forEach(btn => {
        btn.addEventListener("click", async(evt) => {
            const id = Number(evt.target.id.split('"')[0]);
            console.log(id)
            try {
                const enviarID = await fetch("/dados_detalhados", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ id: id })
                });

                const resposta = await enviarID.json();

                if(enviarID.ok){
                    //console.log(resposta)
                    ModalDetalhesFuncionario.abrir(resposta);
                }else {
                    console.error("Erro ao obter dados vindo do servidor: " + resposta)
                }
            } catch (error) {
                console.error("Erro ao buscar dados detalhados:", error);
            }
        })
    })
}


// function acaoEditar() {
//     const bntsVer = document.querySelectorAll(".btn-edit");
//     bntsVer.forEach(btn => {
//         btn.addEventListener("click", async(evt) => {
//             const id = Number(evt.target.id.split('"')[0]);
//             console.log(id)
//             try {
//                 const enviarID = await fetch("/editar_dados", {
//                     method: "POST",
//                     headers: {"Content-Type": "application/json"},
//                     body: JSON.stringify({ id: id })
//                 });

//                 const resposta = await enviarID.json();

//                 if(enviarID.ok){
//                     //console.log(resposta)
//                     ModalEditarFuncionario.abrir(resposta);
//                 }else {
//                     console.error("Erro ao obter dados vindo do servidor: " + resposta)
//                 }
//             } catch (error) {
//                 console.error("Erro ao buscar dados para edição:", error);
//             }
//         })
//     })
// }


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GetLista.init());
} else {
    GetLista.init();
}

window.ModalDetalhesFuncionario = ModalDetalhesFuncionario;
// window.ModalEditarFuncionario = ModalEditarFuncionario;