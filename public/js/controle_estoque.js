
const dados_user = localStorage.getItem('id_vendedor');




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
    static async item(id){
        try{

            const delet_item =  await fetch("/deletar_item", {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(id)
            })

            this.fechar()
        }catch(erro){
            console.log("Erro ao tentar excluir item")
        }
    }
}
class ModalEstoque {
    static modelConfirm(callbackExcluir){
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
                </div>
            `;

            document.body.appendChild(overlay);

            // Eventos
            const fechar = () => overlay.remove();

            document.getElementById('btn-cancelar-confirm').onclick = fechar;

            document.getElementById('btn-confirmar-excluir').onclick = () => {
                if (typeof callbackExcluir === 'function') {
                    callbackExcluir();
                }
                fechar();
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
    static async abrir(config = { titulo: "Novo Item", dados: null, callback: null, tipo: 0, id: null }) {
     
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
                        <button type="submit" class="btn-finalizar">Finalizar</button>
                        
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
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
            btn_excluir.addEventListener("click", () => {
        
                ModalEstoque.modelConfirm( async () => {
                    console.log("Excluindo...")
                    const dados = {
                        id: config.id,
                        id_user: dados_user
                    }
                    Delet.item(dados)
                    await fetch(`/deletar_item/${config.id}`, { method: 'DELETE' });
                    fechar();
                    mostrarMensagem("Item excluido com sucesso!", "sucesso");
                    setTimeout(function() {
                        location.reload(); // Recarrega para atualizar a tabela
                    }, 500)
                });
            });


        async function buscar_dados() {
            try {
                const id_itemclicado = {
                    id: config.id
                };
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
    }

        // --- EVENTOS ---

        const fechar = () => overlay.remove();
        
        document.getElementById('fechar-modal').onclick = fechar;
        document.getElementById('btn-cancelar').onclick = fechar;
        

        // Fechar ao clicar fora do modal
        overlay.onclick = (e) => { if(e.target === overlay) fechar(); };

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
        const status = item.Estoque_Atual < 15 ? `<div class="alerta" title="Alerta! Poucoa itens em estoque"></div>` : item.Estoque_Atual < 25 ? `<div class="atencao"  title="Atenção! Item em baixa no estoque"></div>` : `<div class="normal" title="nível de itens normal no estoque"></div>`;
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
                    <td>${item.Estoque_Atual}</td>
                    <td>${item.Qtd_vendidas}</td>
                    <td>${this.status_info(item)}</td>
                    <td class="acoes"></td> 
                `;


                tr.querySelector(".acoes").appendChild(button);

                tbody.appendChild(tr);

                
            });
        
        tbody.addEventListener("click", evt => {
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
                }, 500);
            };
            
        });
    };

};


class start{
    static init(){
        status_cores.show_hidden();
        estoque.criar_tabela();
        estoque.criarNewitem();
    };
};


start.init();