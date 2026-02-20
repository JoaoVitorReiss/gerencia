class status_cores{
    static show_hidden(){
        document.getElementById('codi_show').addEventListener('click', function() {
            const info = document.getElementById('codigo');
            info.style.display = info.style.display === 'none' ? 'block' : 'none';
        });
    };
};


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
            tbody.innerHTML = ``;

            dados_tabela.forEach(item => {
                const tr = document.createElement("tr");
                tr.setAttribute("id", `${item.Id}`)
                tr.innerHTML = `
                    <td>${item.Id}</td>
                    <td>${item.nome_do_Produto}</td>
                    <td>R$ ${Number(item.Preço).toFixed(2)}</td>
                    <td>${item.Estoque_Atual}</td>
                    <td>${item.Qtd_vendidas}</td>
                    <td>${this.status_info(item)}</td>
                    <td>
                        <button class="edt_itemFalta">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#3498db">
                                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
                            </svg>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

        } else {
            console.warn("Nenhum dado encontrado para a tabela.");
        };

    };

    static acao_edt(){
        const btn_edt = document.querySelectorAll(".edt_itemFalta");
        btn_edt.forEach((item) => {
            item.addEventListener("click", (evt) =>{
                console.log(evt.target)
            })
        })
    }
};


class start{
    static init(){
        status_cores.show_hidden();
        estoque.criar_tabela();
        estoque.acao_edt();
    };
};


start.init();