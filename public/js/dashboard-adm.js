class gerir_funcionarios {

    static logout() {
        
    const btn_logout = document.getElementById("btn-logout");

    btn_logout.addEventListener("click", async(evt) => {
        evt.preventDefault();
        try{
            const resposta = await fetch("/logout", {})
            location.assign('/');
        }catch(err){
            alert("Erro ao fazer o logout")
            console.log("Erro ao fazer o logout ERRO: "  + err);
        }
    })
    }
    static logautStyle() {
        
        const btn_perfil = document.getElementById("perfil");
        const btn_arrowPerfil = document.getElementById("iconArrowPerfil");
        const btn_logoutClass = document.getElementsByClassName("btn-primary-vendas");

        btn_perfil.addEventListener("click", (evt) => {
            evt.preventDefault();
            if(btn_logoutClass[0].style.display === "none"){
                btn_arrowPerfil.style.transform = "rotate(180deg)";
                btn_logoutClass[0].style.display = "block";
            }else{
                btn_logoutClass[0].style.display = "none";
                btn_arrowPerfil.style.transform = "rotate(0deg)";
            }

            
        })
    }
    static layout_funcionarios(){
        const elemento_funcionario = document.getElementById("ger_funcionarios");
        const iconArrow = document.getElementById("iconArrow")
        elemento_funcionario.addEventListener("click", (evt) => {
            evt.preventDefault();
            const elemen_filhos = document.getElementsByClassName("lista_filho");

            for(let i = 0; i < elemen_filhos.length; i++){
                if(elemen_filhos[i].style.display === "none"){
                    elemen_filhos[i].style.display = "block";
                    iconArrow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/></svg>`;

                }
                else{
                    elemen_filhos[i].style.display = "none";
                    iconArrow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>`;
                };
            };
        });
    };

    static int() {
        this.layout_funcionarios();
        this.logautStyle();
        this.logout();
    }
};

const sidebar = document.getElementById("sidebar");
sidebar.classList.add("collapsed");

class preview {
    static menuToggle() {
        const btnToggle = document.getElementById("toggle-sidebar");

        btnToggle.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
        });
    }

    static async fetchFaturamento() {
        try {
            const resposta = await fetch("/balanco", {
                method: "GET",
                headers: {"Content-Type": "application/json"}
            })
            if(resposta.ok){
                const dados = await resposta.json();
                return dados;
            };

        }catch(error) {
            console.error("Erro ao buscar dados de faturamento! ERRO: " + error)
        }
    }
    static async previewFaturamento() {
        const cardFaturamento = document.getElementById("faturamento");
        const totalVendaLabel = document.getElementById("totalVenda");
        const previewArea = document.getElementById("info_dados");

        try {
            const resposta = await fetch("/balanco");
            if (resposta.ok) {
                const json = await resposta.json();
                const dados = json.dados;

                const totalGeral = dados.reduce((acc, item) => acc + Number(item.subtotal), 0);
                totalVendaLabel.innerHTML = `R$ ${totalGeral.toFixed(2)}`;

                cardFaturamento.addEventListener("click", (evt) => {
                    evt.preventDefault();
                    
                    const detalhesHTML = dados.map(item => {
                        return `<h4>Vendas via ${item.metodo || 'Outros'}: <strong>${item.total_vendas}</strong> venda(s) - <em>R$ ${Number(item.subtotal).toFixed(2)}</em></h4>`;
                    }).join("");

                    previewArea.innerHTML = `
                        <h2>Faturamento últimas 24h: <a href="#" class="btn_relatorio">Informações detalhadas</a></h2>
                        ${detalhesHTML}
                        <h3>Total: <mark> R$ ${totalGeral.toFixed(2)}</mark></h3>
                    `;
                    sidebarPages.relatorio();
                });
            }
        } catch (error) {
            console.error("Erro ao buscar faturamento:", error);
        }
    }


    static async previewVendasRegistradas() {
        const cardVendasRegistradas = document.getElementById("vendas_registradas");
        const total_vendasRegistradas = document.getElementById("tot_vendasregistradas");
        const preview = document.getElementById("info_dados");

        try{
            const resposta = await fetch("/resumo_qtdVendas", {
                method: "GET",
                headers: {"Content-Type": "application/json"}
            });
            if(resposta.ok){
                const dados = await resposta.json();
                //console.log(dados.dados)

                total_vendasRegistradas.innerHTML = `${dados.dados.qtd_vendas}`
                cardVendasRegistradas.addEventListener("click", (evt) => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    preview.innerHTML = 
                        `<h2>Vendas realizadas últimas 24h: para <a href="#">Informações detalhadas</a></h2>
                        <h4>Total de vendas: <strong>${dados.dados.qtd_vendas}</strong></h4>
                        <h4>Quantidade total de produtos vendidos: <strong>${dados.dados.qtd_itens_total}</strong></h4>`
            })
            }
        }catch(error) {
            console.error("Erro ao buscar dados de vendas registradas! ERRO: " + error);
        }
    };

    static async previewProdutosFalta() {
        const cardProdutoFalta = document.getElementById("produtos_falta");
        const preview = document.getElementById("info_dados");
        const total_itensFalta = document.getElementById("total_itensfalta");
        try{
            const resposta = await fetch("/estoque_baixo", {
                method: "GET",
                headers: {"Content-Type": "application/json"}
            });
            if(resposta.ok) {
                const dados = await resposta.json();                    
                total_itensFalta.innerHTML = `${dados.dados.length}`;

                cardProdutoFalta.addEventListener("click", (evt) => {

                    //console.log(dados.dados)
                    let ArrayProdutos = [];
                    ArrayProdutos.push(dados.dados);
                    // ArrayProdutos[0].map((item) => {
                    //     console.log(item)
                    // })
                    evt.preventDefault();
                    evt.stopPropagation();

                    preview.innerHTML =
                        `<h2>Produtos em falta: para <a href="#">Informações detalhadas</a></h2>
                        <p>Será listados os itens com estoque abaixo de 25 unidades:</p>
                        <ul>
                            ${ArrayProdutos[0].map((item) => {
                                let qtd_item =  item.qtd_produtos;
                                if(qtd_item < 10){
                                    return `<li><u style="text-decoration-color:  #e74c3c;"><strong>${item.nome_item}</strong> - Quantidade em estoque: <em><span style="color: #e74c3c;">${item.qtd_produtos}</span></u></em></li>`
                                }else if(qtd_item <= 15 && qtd_item > 10){
                                    return `<li><u style="text-decoration-color:  #f39c12"><strong>${item.nome_item}</strong> - Quantidade em estoque: <em> <span style="color: #f39c12;">${item.qtd_produtos}</span></u></em></li>`
                                }
                                return `<li><u><strong>${item.nome_item}</strong> - Quantidade em estoque: <em>${item.qtd_produtos}</u></em></li>`
                            }).join("")};
                        </ul>
                    `;
                });
            }
        }catch(error){
            console.error("Erro ao buscar dados de produtos em falta! ERRO: " + error);
        };
    };

    static int() {
        this.menuToggle();
        this.previewFaturamento();
        this.previewVendasRegistradas();
        this.previewProdutosFalta();
    };
};



class sidebarPages {
    static async relatorio() {
        const brtnRelatorio = document.querySelectorAll(".btn_relatorio");
        brtnRelatorio.forEach((btn) => {
            btn.addEventListener("click", (evt) => {
                evt.preventDefault();
                location.assign("/relatorio");
            });
        });
    };

    static int() {
        this.relatorio();
    }
}

gerir_funcionarios.int();
sidebarPages.int();
preview.int();
