class closenota{
        static async closeTab() {
        const btnFechar = document.getElementById("fecharNota");
        btnFechar.addEventListener("click", async (evt) =>{
            evt.preventDefault();
             location.assign('/dashboard_venda');
             try {
                const response = await fetch("/dell_session", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });


                if (response.ok) {
                    const resultado = await response.json();
                } else {
                    console.error("Erro na resposta do servidor");
                }
            } catch (error) {
                console.log("Erro ao tentar deletar a sessão: " + error);
            }
            
        })
    }
}
class GerarNota {
    static async notaSimples() {
        try {
            const resposta = await fetch('/nota_simples');
            const { dados, mensagem } = await resposta.json();

            if (!resposta.ok) {
                throw new Error(mensagem || "Erro ao buscar dados");
            }
            // 1. Desestruturação para limpar o código
            const {
                data, data_hora, nome_vendedor, id_transation,
                iten_nome, qtd, valor_unt, tot_venda,
                troco, val_res, mtd_pagamento, valor_resPxcard, data_diaSemana
            } = dados;

            // 2. Seleção de elementos (cache)
            const elInfoVenda = document.getElementById("info_venda");
            const elItensVendidos = document.getElementById("itns_vendidos");
            const elValorTotal = document.getElementById("valor_total");
            const elInfoPagamento = document.getElementById("info_pagamento");
            const elIdTransacao = document.getElementById("id_transacao");
            elItensVendidos.setAttribute("class","product-row");
            

            // 3. Formatação de valores
            const formatarMoeda = (valor) => 
                Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            console.log(dados)
            elInfoVenda.innerHTML = `
                <h3>Informações da Venda</h3> 
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Vendedor</span>
                        <span class="value highlight">${nome_vendedor}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Data</span>
                        <span class="value">${data_diaSemana + " "+data}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Hora</span>
                        <span class="value">${data_hora}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Pagamento</span>
                        <span class="value highlight">${mtd_pagamento}</span>
                    </div>
                </div>`;

            elItensVendidos.innerHTML = `
                <span class="product-name">${iten_nome}</span>
                <span class="qty">${qtd}</span>
                <span class="price">${formatarMoeda(valor_unt)}</span>
                <span class="price">${formatarMoeda(tot_venda)}</span>`;

            elValorTotal.textContent = formatarMoeda(tot_venda);

            if (mtd_pagamento === "Pix" || mtd_pagamento === "Cartão" || mtd_pagamento === "Cartao") {
                elInfoPagamento.innerHTML = `
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Valor Recebido</span>
                        <span class="value">${formatarMoeda(valor_resPxcard)}</span>
                    </div>
                </div>`;

            }else {
                elInfoPagamento.innerHTML = `
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Valor Recebido</span>
                        <span class="value">${formatarMoeda(val_res)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Troco</span>
                        <span class="value" style="display: block">${formatarMoeda(troco)}</span>
                    </div>
                </div>`;
            }

            elIdTransacao.textContent = id_transation;

        } catch (error) {
            console.error("Erro ao gerar dados da nota:", error.message);
        }
    };
}

class gerarNotaSacola {
    static async notaSacola() {
        try {
            const res = await fetch('/nota_sacola');
            const { dados, mensagem } = await res.json();

            if (!res.ok) {
                throw new Error(mensagem || "Erro ao buscar dados");
            }

            // 1. CONVERSÃO: Transformar o Array de Arrays em um Array de Objetos
            const listaProdutos = dados.map(arrayInterno => {
                let obj = {};
                for (let i = 0; i < arrayInterno.length; i += 2) {
                    obj[arrayInterno[i]] = arrayInterno[i + 1];
                }
                return obj;
            });

            // 2. PEGANDO DADOS GERAIS (como vendedor e data são iguais para todos, pegamos do primeiro)
            const primeiraVenda = listaProdutos[0];
            const { nome_vendedor, data_diaSemana, data_hora, mtd_pagamento, val_res, id_transation, troco, valor_resPxcard, data } = primeiraVenda;

            // 3. SELEÇÃO DE ELEMENTOS
            const elInfoVenda = document.getElementById("info_venda");
            const elItensVendidos = document.getElementById("itns_vendidos");
            const elValorTotal = document.getElementById("valor_total");
            const elInfoPagamento = document.getElementById("info_pagamento");
            const elIdTransacao = document.getElementById("id_transacao");
            elItensVendidos.removeAttribute("class", "product-rows");

            const formatarMoeda = (valor) =>
                Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            elInfoVenda.innerHTML = `
                <h3>Informações da Sacola</h3> 
                <div class="info-grid">
                    <div class="info-item"><span class="label">Vendedor:</span> <span class="value">${nome_vendedor}</span></div>
                    <div class="info-item"><span class="label">Dia:</span> <span class="value">${data_diaSemana+ " "+ data}</span></div>
                    <div class="info-item"><span class="label">Hora:</span> <span class="value">${data_hora}</span></div>
                    <div class="info-item"><span class="label">Pagamento:</span> <span class="value">${mtd_pagamento}</span></div>
                </div>`;

           elItensVendidos.innerHTML = listaProdutos.map(item => `
            <div class="product-row">
                <span class="product-name">${item.itens}</span>
                <span class="qty">${item.qtd_itens}</span>
                <span class="price">${formatarMoeda(item.preco_unitario)}</span>
                <span class="price">${formatarMoeda(item.tot_venda)}</span>
            </div>
        `).join('');

            // 6. CALCULAR TOTAL DA SACOLA
            const totalGeral = listaProdutos.reduce((acc, item) => acc + Number(item.tot_venda), 0);
            elValorTotal.textContent = formatarMoeda(totalGeral);

             if (mtd_pagamento === "Pix" || mtd_pagamento === "Cartão" || mtd_pagamento === "Cartao") {
                elInfoPagamento.innerHTML = `
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Valor Recebido</span>
                        <span class="value">${formatarMoeda(valor_resPxcard)}</span>
                    </div>
                </div>`;

            }else if(mtd_pagamento === "Dinheiro") {
                elInfoPagamento.innerHTML = `
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Valor Recebido</span>
                        <span class="value">${formatarMoeda(val_res)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Troco</span>
                        <span class="value" style="display: block">${formatarMoeda(troco)}</span>
                    </div>
                </div>`;
            }

            elIdTransacao.textContent = id_transation;

        } catch (erro) {
            console.error("Erro: " + erro);
        }
    }
}

class ExportarNota {
    static async paraPDF() {
        const btnPDF = document.getElementById("btnGerarPDF");
        
        btnPDF.addEventListener("click", () => {
            const elemento = document.querySelector(".container");
            
            // Configurações do PDF
            const opcoes = {
                margin: [10, 10],
                filename: `nota_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                html2canvas: { 
                scale: 2,          // Aumenta a resolução
                useCORS: true,     // Ajuda a carregar ícones/fontes externas
                logging: false, 
                letterRendering: true 
                }
            };


            // Esconde os botões antes de gerar para não saírem no PDF
            const headerActions = btnPDF.parentElement;
            const fechaNt_btn = document.getElementById("fecharNota");

            headerActions.style.display = 'none';
            fechaNt_btn.style.display = 'none';


            html2pdf().set(opcoes).from(elemento).save().then(() => {
                // Mostra os botões novamente após gerar
                headerActions.style.display = 'flex';
                fechaNt_btn.style.display =  'flex';
            });
        });
    }
};


class AcoesNota {
    static async compartilharPDF() {
        const btnShare = document.getElementById("btnShare");
        const elemento = document.querySelector(".container");

        btnShare.addEventListener("click", async () => {
            //Configurações para gerar o PDF como Blob (na memória)
            const opcoes = {
                margin: [10, 10],
                filename: 'comprovante.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            try {
                // Esconde botões para não saírem
                document.querySelectorAll('.btn-header').forEach(b => b.style.visibility = 'hidden');

                //Gera o PDF e obtém o arquivo como BLOB
                const pdfBlob = await html2pdf().set(opcoes).from(elemento).outputPdf('blob');
                
                // Volta a mostrar os botões
                document.querySelectorAll('.btn-header').forEach(b => b.style.visibility = 'visible');

                //Cria um arquivo real a partir do Blob para o sistema entender
                const arquivo = new File([pdfBlob], "comprovante_venda.pdf", { type: "application/pdf" });

                //erifica se o navegador suporta compartilhamento de arquivos
                if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
                    await navigator.share({
                        files: [arquivo],
                        title: 'Comprovante de Venda',
                        text: 'Olá! Segue o comprovante da sua compra.'
                    });
                } else {
                    const confirmacao = confirm("O compartilhamento nativo não está disponível. Deseja apenas baixar o PDF?");
                    if(confirmacao) {
                        html2pdf().set(opcoes).from(elemento).save();
                    }
                }
            } catch (error) {
                console.error("Erro ao compartilhar:", error);
                alert("Não foi possível processar o compartilhamento.");
            }
        });
    }
}



ExportarNota.paraPDF();
closenota.closeTab();
GerarNota.notaSimples();
gerarNotaSacola.notaSacola();
AcoesNota.compartilharPDF();