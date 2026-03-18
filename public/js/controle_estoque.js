const dados_user = localStorage.getItem('id_vendedor');
let situacao;
let cor;

let controle = false;
// Função para mostrar a mensagem vindas do servidor
function mostrarMensagem(mensagem, tipo = 'erro') { // 'erro' ou 'sucesso'
    const feedbackMensagem = document.getElementById('mensagem-feedback');
    
    feedbackMensagem.textContent = mensagem;
    feedbackMensagem.classList.remove('success', 'error', 'visible');
    
    if (tipo === 'sucesso') {
        feedbackMensagem.classList.add('success');
    } else {
        feedbackMensagem.classList.add('error');
    }
    
    // Mostra com animação
    feedbackMensagem.style.display = 'block';
    setTimeout(() => {
        feedbackMensagem.classList.add('visible');
    }, 10); // Pequeno delay para ativar a transição
    
    // Esconde após 3 segundos com fade-out
    setTimeout(() => {
        feedbackMensagem.classList.remove('visible');
        setTimeout(() => {
            feedbackMensagem.style.display = 'none';
        }, 500); // Tempo para completar a transição
    }, 3000);
}


class status_cores{
    static show_hidden(){
        document.getElementById('codi_show').addEventListener('click', function() {
            const info = document.getElementById('codigo');
            info.style.display = info.style.display === 'none' ? 'block' : 'none';
        });
    };
};
class Delet{
    static async item(payload){
        console.log(controle)
        //precisar passar:ID item e o ID user
        try{
            const delet_item =  await fetch("/dell_item", {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            })
            
        }catch(erro){
            console.log("Erro ao tentar excluir item" + erro)
        }
    }
}
class ModalEstoque {
    static modelConfirm(payload){
        controle = false;
        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay-confirm';
        overlay.innerHTML = `
            <div id="modal-confirm-container">
                <div class="modal-header">
                    <h3>Confirmar exclusão</h3>
                </div>
                <div class="modal-body">
                    <p>Deseja realmente excluir este item?</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-cancelar" id="btn-cancelar-confirm">Cancelar</button>
                    <button type="button" class="btn-excluir" id="btn-confirmar-excluir">Excluir</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);

            // Eventos
        const fechar = () => overlay.remove();

        document.getElementById('btn-cancelar-confirm').onclick = fechar;

        document.getElementById('btn-confirmar-excluir').onclick = () => {
            if(Delet.item(payload)){
                setTimeout(function() {
                    fechar();
                    estoque.criar_tabela();
                    dataSelect.dataSelecionada();

                }, 20)

            }
        };

        // Fechar clicando fora
        overlay.onclick = (e) => {
            if (e.target === overlay) fechar();
        };

        //fechar com ESC
        const fecharComEsc = (e) => {
            if (e.key === 'Escape') {
                fechar();
                document.removeEventListener('keydown', fecharComEsc);
            }
        };
        document.addEventListener('keydown', fecharComEsc);
    

    }
    static async abrir(config = { titulo: "Novo Item", dados: null, callback: null, tipo: 0, id: null}) {
     
        let nome = null;
        let preco = null;
        let qtd = null;
        let validade = null;
        let motivo = null;
        



        let qtdAnterior = 0;
        let nomeAnterio = "";
        let precoAnterior = 0;

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
                        <input type="text" id="nomeitem" value="${config.dados?.nome || ''}" required>
                    </div>
                    <div class="linha-dupla">
                        <div class="campo-grupo">
                            <label for="valorItem">Preço (Venda) R$:</label>
                            <input type="number" id="valorItem" step="0.01" value="${config.dados?.preco || ''}" required>
                        </div>
                        <div class="campo-grupo">
                            <label for="qtditem">Quantidade:</label>
                            <input type="number" id="qtditem" value="${config.dados?.qtd || ''}" required>
                        </div>
                    </div>
                    <div class="campo-grupo">
                        <label for="valitem" id="valitemLabel">Validade (Opcional):</label>
                        <input type="date" id="valitem" value="${config.dados?.validade || ''}">
                    </div>

                    <div class="campo-grupo">
                        <label for="motivo">Motivo: </label>
                        <input type="text" id="motivo" value="${config.dados?.motivo || 'Novo item'}" required>
                    </div>
                    <div class="modal-footer">
                        
                        <button type="button" class="btn-cancelar" id="btn-cancelar">Cancelar</button>
                        <button type="button" id="btn_excluir" class="hidden">Excluir item</button>
                        <button type="submit" class="btn-finalizar" id="btn_finalizar">Finalizar</button>
                    
                        <button type="button" class="btn-resta hidden" id="btn-resta">Restaurar iten</button>

                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(overlay);

        const btn_finalizar = document.getElementById("btn_finalizar");
        const btn_restaurar = document.getElementById("btn-resta")
        const label_valitemLabel = document.getElementById("valitemLabel")
        const campo_motivo = document.getElementById("motivo");
        const campo_validade  = document.getElementById("valitem");
        const campo_qtditem = document.getElementById("qtditem");
        const campo_valorItem = document.getElementById("valorItem");
        const campo_nomeitem  =document.getElementById("nomeitem");


        
        if (config.tipo == 1) {
            const btn_excluir = document.getElementById('btn_excluir');
            campo_validade.classList.add("hidden");
            label_valitemLabel.classList.add("hidden");
            btn_excluir.classList.remove("hidden");
            btn_excluir.addEventListener("click", (evt) => {
                evt.stopPropagation();
                evt.preventDefault();
                const payload_delet = {
                    id: config.id,
                    id_user: dados_user
                }
                ModalEstoque.modelConfirm(payload_delet)
                fechar();

            })
            async function buscar_dados() {
                try {
                    const id_itemclicado = {
                        id: config.id
                    };
                    console.group(id_itemclicado)
                const busca = await fetch("/buscar_info", {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(id_itemclicado)
                });

                    // dados_user -> essa variavel contém oo ID do usuario logado
                    if(busca.ok){
                        const resposta = await busca.json();
                        qtdAnterior = resposta.item[0]["qtd_produto"];
                        nomeAnterio = resposta.item[0]["descri_produto"];
                        precoAnterior = resposta.item[0]["preco_produto"]
                        campo_nomeitem.value = resposta.item[0]["descri_produto"];
                        campo_valorItem.value = resposta.item[0]["preco_produto"];
                        campo_qtditem.value = resposta.item[0]["qtd_produto"];
                        if(resposta.item[0]["validade"].split('T')[0] <= 0){
                            campo_validade.value = null;
                        }else {
                            campo_validade.value = resposta.item[0]["validade"].split('T')[0];
                        }

                        campo_motivo.value = "Adicione o motivo"
                    }

                    }catch(erro) {
                        console.log("Erro ao tentar buscar os dados vindo do Banco de dados");
                    };
                }

                buscar_dados();
        }else if(config.tipo == 2){
            const btn_excluir = document.getElementById('btn_excluir');
            campo_validade.classList.add("hidden");
            label_valitemLabel.classList.add("hidden");
            btn_finalizar.classList.add("hidden");
            btn_restaurar.classList.remove("hidden")

            btn_excluir.classList.remove("hidden");
            btn_excluir.addEventListener("click", (evt) => {
                evt.stopPropagation();
                evt.preventDefault();
                const payload_delet = {
                    id: config.id,
                    id_user: dados_user
                }
                ModalEstoque.modelConfirm(payload_delet)
                fechar();

            })
            async function buscar_dados() {
                try {
                    const id_itemclicado = {
                        id: config.id
                    };
                    console.group(id_itemclicado)
                const busca = await fetch("/buscar_infoAll", {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(id_itemclicado)
                });

                    // dados_user -> essa variavel contém oo ID do usuario logado
                    if(busca.ok){
                        const resposta = await busca.json();
                        qtdAnterior = resposta.item[0]["qtd_produto"];
                        nomeAnterio = resposta.item[0]["descri_produto"];
                        precoAnterior = resposta.item[0]["preco_produto"]
                        campo_nomeitem.value = resposta.item[0]["descri_produto"];
                        campo_valorItem.value = resposta.item[0]["preco_produto"];
                        campo_qtditem.value = resposta.item[0]["qtd_produto"];
                        if(resposta.item[0]["validade"].split('T')[0] <= 0){
                            campo_validade.value = null;
                        }else {
                            campo_validade.value = resposta.item[0]["validade"].split('T')[0];
                        }

                        campo_motivo.value = "Item totalamente excluido"
                    }

                    }catch(erro) {
                        console.log("Erro ao tentar buscar os dados vindo do Banco de dados");
                    };
                }

                buscar_dados();
        }

        // --- EVENTOS ---

        const fechar = () => overlay.remove();
        
        document.getElementById('fechar-modal').onclick = fechar;
        document.getElementById('btn-cancelar').onclick = fechar;
        

        // Fechar ao clicar fora do modal
        //overlay.onclick = (e) => { if(e.target === overlay) fechar(); };

        // Submissão do Formulário
        document.getElementById('form-estoque').onsubmit = async (e) => {
        e.preventDefault();

            const payload = {
                id_produto: config.id,
                id_usuario: dados_user, 
                qtd_anterior: qtdAnterior,
                nome_anterio: nomeAnterio,
                preco_anterior: precoAnterior,
                qtd_nova: Number(document.getElementById('qtditem').value),
                nome: document.getElementById('nomeitem').value,
                preco: Number(document.getElementById('valorItem').value),
                motivo: document.getElementById('motivo').value,
                validade: document.getElementById('valitem').value || null
            };
            try {
                const atualiza_dados = await fetch("/atualiza_item", {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)

                })
                if(!atualiza_dados){
                    const dadosErro = await atualiza_dados.json();
                    console.log(dadosErro.mensagem)
                };

                //const dados =  await atualiza_dados.json();
                fechar()
                mostrarMensagem("Atualizado com sucesso!", "sucesso");
                setTimeout(function() {
                    location.reload();
                }, 700)
                
            }catch (error){
                console.log("Erro ao tentar atualizar o item selecionado: " + error)
            }
        };
    }
}



class estoque{
    static async estoque_baixo(){
        try {
            const estoque_baixo = await fetch("/contro_estoque");
            
            if(estoque_baixo.ok) {
                const lista_item = await estoque_baixo.json();
                return lista_item.dados || [];

            }else {
               throw new Error(`Erro HTTP: ${resposta.mensagem}`);
            }
        }catch(error){
            console.error("Erro ao acessar dados de estoque:", error);
            return [];
        };
    };

    static status_info(item){
        const status = item.estoque_atual < 15 ? `<div class="alerta" title="Alerta! Poucoa itens em estoque"></div>` : item.estoque_atual < 25 ? `<div class="atencao"  title="Atenção! Item em baixa no estoque"></div>` : `<div class="normal" title="nível de itens normal no estoque"></div>`;
        return status
    }

    static async criar_tabela(){
        const dados_tabela = await this.estoque_baixo();
        if (dados_tabela.length > 0) {
            const tbody = document.getElementById("dados_itemFalta");
            tbody.innerHTML = ""; // Limpa a tabela

            dados_tabela.forEach(item => {
                const tr = document.createElement("tr");
                tr.setAttribute("id", item.Id);

                const button = document.createElement('button');
                button.classList.add('edt_itemFalta');

                // 2. Criar o SVG
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("height", "24px");
                svg.setAttribute("viewBox", "0 -960 960 960");
                svg.setAttribute("width", "24px");
                svg.setAttribute("fill", "#3498db");

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", "M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z");
                button.setAttribute("id", item.Id);


                svg.appendChild(path);
                button.appendChild(svg);

                // 3. Montar o conteúdo da TR
                tr.innerHTML = `
                    <td>${item.Id}</td>
                    <td>${item.nome_do_Produto}</td>
                    <td>R$ ${Number(item.Preço).toFixed(2)}</td>
                    <td>${item.estoque_atual}</td>
                    <td>${item.Qtd_vendidas}</td>
                    <td>${this.status_info(item)}</td>
                    <td class="acoes"></td> 
                `;


                tr.querySelector(".acoes").appendChild(button);

                tbody.appendChild(tr);

                
            });
        
        tbody.addEventListener("click", evt => {
            evt.stopImmediatePropagation();
            evt.preventDefault();
            const btn = evt.target.closest('.edt_itemFalta');
            
            if (btn) {
                //console.log( btn.id);
                ModalEstoque.abrir({ titulo: 'Edita item', tipo: 1, id: btn.id});
                
            }
        });

        } else {
            console.warn("Nenhum dado encontrado para a tabela.");
        };

    };

    static async criarNewitem(){
        
        const btn_add = document.getElementById("add_novoitem");
        btn_add.addEventListener("click", evt => {
            evt.stopImmediatePropagation();
            evt.preventDefault();
            ModalEstoque.abrir();
            document.getElementById('form-estoque').onsubmit = async (e) => {
                e.preventDefault()            
                
                const campo_motivo = document.getElementById("motivo");
                const campo_validade  = document.getElementById("valitem");
                const campo_qtditem = document.getElementById("qtditem");
                const campo_valorItem = document.getElementById("valorItem");
                const campo_nomeitem  =document.getElementById("nomeitem");


                const payloadADD = {
                    validade: campo_validade.value || null,
                    motivo: campo_motivo.value,
                    qtd_item: campo_qtditem.value,
                    preco: campo_valorItem.value,
                    nome_item: campo_nomeitem.value,
                    id_user: dados_user
                }


                const res = await fetch("/additem", {
                    method: "POST",
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payloadADD)
                })

                if(!res){
                    const dadosErro = await res.json();
                    console.log(dadosErro)
                    mostrarMensagem("Erro ao adicionar o item", "erro");
                }
                
                mostrarMensagem("Item adicionado com sucesso!", "sucesso");
                setTimeout(function() {
                    location.reload();
                }, 200);
            };
            
        });
    };

};


class criar{
    static  tabelaItens(dados){
        const dados_tabela =  dados;
        if (dados_tabela.length > 0) {
            const tbody = document.getElementById("itens_maisVendidos");
            tbody.innerHTML = ""; // Limpa a tabela

            dados_tabela.forEach(item => {
                const tr = document.createElement("tr");
                tr.setAttribute("id", item.Id);

                const button = document.createElement('button');
                button.classList.add('edt_itemFalta');

                // 2. Criar o SVG
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("height", "24px");
                svg.setAttribute("viewBox", "0 -960 960 960");
                svg.setAttribute("width", "24px");
                svg.setAttribute("fill", "#3498db");

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", "M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z");
                button.setAttribute("id", item.Id);

                svg.appendChild(path);
                button.appendChild(svg);
                
                if(item.ativo == 1){
                    situacao = "Ativo";
                    cor= "#000000";
                }else if(item.ativo == 0){
                    situacao = "Excluido";
                    cor="#d60707f1";
                }
                tr.classList.add(`${situacao}`)

                // 3. Montar o conteúdo da TR
                tr.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.nome_produto}</td>
                    <td>R$ ${Number(item.preco_atual).toFixed(2)}</td>
                    <td>${item.estoque_atual}</td>
                    <td>${item.total_vendido}</td>
                    <td>${estoque.status_info(item)}</td>
                    <td style="color:${cor}">${situacao}</td>
                    <td class="acoesD" id="${item.id}"></td> 
                `;

                tr.querySelector(".acoesD").appendChild(button);
                tbody.appendChild(tr);
                
            });
        }}
}



class dataSelect{
    static async dataSelecionada() {

        const enviarParaServidor = async (inicio, fim) => {
            try {
                const resposta = await fetch("/dados_lista", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inicio, fim })
                });
            
                const res = await resposta.json();
                let dd = res.itens.dados; 
                let new_item = [];
                let new_itemEx = [];
                
                if (resposta.ok) {
                    
                    criar.tabelaItens(res.itens.dados)
                    const btn_acoes = document.querySelectorAll(".acoesD");
                        if(btn_acoes){
                            btn_acoes.forEach(item => {
                                item.addEventListener("click", (evt) => {
                                    evt.preventDefault();
                                    evt.stopPropagation();
                                    ModalEstoque.abrir({ titulo: 'Edita item', tipo: 1, id: item.id});
                                })
                            })
                            
                    }
                  
                    //console.log(res.itens.dados)
                }
                
            } catch (error) {
                console.error("Erro no fetch:", error);
            };
        };




        const formatarData = (data) => data.toISOString().split('T')[0];
        const botoes = document.querySelectorAll(".btn-filtro");
        const btn_geral = document.getElementById("geral");
        const inputInicio = document.getElementById("data_inicio");
        const inputFim = document.getElementById("data_fim");
        const btnBuscaManual = document.getElementById("btn_buscar_custom");

        // Lógica dos Botões Rápidos (Hoje, 7d, 30d)
        botoes.forEach(botao => {
            botao.addEventListener("click", (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                botoes.forEach(b => b.classList.remove("active"));
                botao.classList.add("active");

                var dias = Number(botao.value);               

                const hoje = new Date();
                const dataInicio = new Date(); 

                dataInicio.setDate(hoje.getDate() - dias);               
                if (dias ==  0) {
                    enviarParaServidor(0, hoje)
                }
            
                enviarParaServidor(formatarData(dataInicio), formatarData(hoje));
            });
        });



         // Lógica da Busca Manual (Período Customizado)
        btnBuscaManual.addEventListener("click", (evt) => {
            evt.preventDefault();
            evt.stopImmediatePropagation();
            const inicio = inputInicio.value;
            const fim = inputFim.value;

            if (inicio && fim) {
                enviarParaServidor(inicio, fim);
            } else {
                alert("Por favor, selecione as duas datas.");
            }
        });

        const hojeStr = formatarData(new Date());
        enviarParaServidor(0, hojeStr)

    }
    
}




class start{
    static init(){
        dataSelect.dataSelecionada();
        status_cores.show_hidden();
        estoque.criar_tabela();
        estoque.criarNewitem();
    };
};


start.init();