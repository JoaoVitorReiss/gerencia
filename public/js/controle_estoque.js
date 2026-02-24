class status_cores{
    static show_hidden(){
        document.getElementById('codi_show').addEventListener('click', function() {
            const info = document.getElementById('codigo');
            info.style.display = info.style.display === 'none' ? 'block' : 'none';
        });
    };
};

class ModalEstoque {
    static abrir(config = { titulo: "Novo Item", dados: null, callback: null, tipo: 0 }) {
     
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
                        <label for="valitem">Validade (Opcional):</label>
                        <input type="date" id="valitem" value="${config.dados?.validade || ''}">
                    </div>
                    <div class="modal-footer">
                        
                        <button type="button" class="btn-cancelar" id="btn-cancelar">Cancelar</button>
                        <button id="btn_excluir" class="hidden">Excluir item</button>
                        <button type="submit" class="btn-finalizar">Finalizar</button>
                        
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(overlay);

        if(config.tipo == 1){
           const btn_excluir = document.getElementById('btn_excluir')
           btn_excluir.classList.remove("hidden")
        }

        // --- EVENTOS ---

        const fechar = () => overlay.remove();
        
        document.getElementById('fechar-modal').onclick = fechar;
        document.getElementById('btn-cancelar').onclick = fechar;

        // Fechar ao clicar fora do modal
        overlay.onclick = (e) => { if(e.target === overlay) fechar(); };

        // Submissão do Formulário
        document.getElementById('form-estoque').onsubmit = (e) => {
            e.preventDefault();
            const payload = {
                nome: document.getElementById('nomeitem').value,
                preco: document.getElementById('valorItem').value,
                qtd: document.getElementById('qtditem').value,
                validade: document.getElementById('valitem').value
            };
            
            if (config.callback) config.callback(payload);
            fechar();
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
                console.log( btn.id);
                ModalEstoque.abrir({ titulo: 'Edita item', tipo: 1});
                 
                
            }
        });

        } else {
            console.warn("Nenhum dado encontrado para a tabela.");
        };

    };

    static criarNewitem(){
       const btn_add = document.getElementById("add_novoitem");
       btn_add.addEventListener("click", evt => {
            evt.preventDefault();
            ModalEstoque.abrir();
        })
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