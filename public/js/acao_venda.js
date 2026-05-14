const qtdInput = document.getElementById('qtd_pro');
const pagamentoSelect = document.getElementById('pagamento');
const dinheiroSection = document.getElementById('dinheiro-section');
const mDinheiro = document.getElementById('m_dinheiro');
const troco = document.getElementById('troco');
const valorTotal = document.getElementById('valor-total');
const nomeProduto = document.getElementById("nome_produto");
const precoProduto = document.getElementById("preco_produto");
const btn_qtdPlus = document.getElementById("btn-plus");
const btn_minus = document.getElementById("btn-minus");
const qtd_disponivel = document.getElementById("valor_qtd");
const btn_finalizar = document.getElementById("finalizar");

const subtotal_info  = document.getElementById("subtotal");
const infoFinal = document.getElementById('info_final'); 

const containerSacola = document.getElementById('container-sacola'); 


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




// Class para pegar dados relacionados ao  dia
class metadadosCompra {
    static get_horaCompra() {
        const dataAtual  = new Date();
        const hora = String(dataAtual.getHours()).padStart(2, '0');
        const minutos = String(dataAtual.getMinutes()).padStart(2, '0');
        const segundos = String(dataAtual.getSeconds()).padStart(2, '0');
        return `${hora}:${minutos}:${segundos}`;
    }

    static get_dataCompra() {
        const dataAtual  = new Date();
        const diaSemana = dataAtual.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dia = String(dataAtual.getDate()).padStart(2, '0');
        const mes = String(dataAtual.getMonth() + 1).padStart(2, '0'); 
        const ano = dataAtual.getFullYear();
        let dataFormatada = `${ano}-${mes}-${dia}`;
        let allData = {
            diaSemana: diaSemana,
            data: dataFormatada,
            hora: this.get_horaCompra()
        }
        return allData
    }
}



let valorProduto = 0;
let qtdDisponivel = 0;
let produtoVendaId = 0;
let valorTotalVendaUnica = 0; 
let Valor_troco = 0;

let listaProdutosSacola = []; 


let valorTotalVendaSacola = 0; 

// Tipo de Ação (0: Única | 1: Sacola)
let tipo_botao = Number(localStorage.getItem('tipo_botao'));

const id_vendedor = Number(localStorage.getItem('id_vendedor'));

class acao_Venda {

    static async get_btnVenda() {
        produtoVendaId = localStorage.getItem('produtoVendaId');
        
        if (!produtoVendaId) {
            console.error("ID do produto não encontrado na localStorage.");
            window.location.href = '/dashboard_venda';
            return;
        }
        
        try {
            const acaobtnvender = await fetch("/acao_vender", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id: produtoVendaId })
            });

            if(acaobtnvender.ok) {
                const dados_vindoDB = await acaobtnvender.json();
                const produto = dados_vindoDB.produto[0];
                
                
                valorProduto = Number(produto.preco_produto);
                qtdDisponivel = Number(produto.qtd_produto);
                
                
                nomeProduto.innerHTML = produto.descri_produto;
                precoProduto.innerHTML = `Preço: R$${valorProduto.toFixed(2)}`;
                qtd_disponivel.innerHTML = `${qtdDisponivel}`;
                subtotal_info.innerHTML = `Subtotal: <strong>R$ ${valorProduto.toFixed(2)}</strong>`;      

                
                // Define o valor inicial do total (1 unidade)
                valorTotalVendaUnica = valorProduto;
                valorTotal.innerHTML = `Valor Total: R$ ${valorTotalVendaUnica.toFixed(2)}`;
                
            } else {
                console.error("Erro ao acessar os dados vindos do servidor.");
            }
        } catch(erro) {
            console.error("Erro ao acessar os dados vindos do servidor:", erro);
        }
    }

    static get_Quantidade() {
        // Lógica de quantidade para VENDA ÚNICA
        btn_qtdPlus.addEventListener("click", (evt) => {
            let somaInput = Number(qtdInput.value) + 1;
            const subtotalUnico = valorProduto.toFixed(2) * somaInput;
            subtotal_info.innerHTML = `Subtotal: <strong>R$ ${subtotalUnico.toFixed(2)}</strong>`;      

            if (somaInput <= qtdDisponivel) {
                valorTotalVendaUnica = valorProduto * somaInput;
                valorTotal.innerHTML = `Valor Total: R$ ${valorTotalVendaUnica.toFixed(2)}`;
                qtdInput.setAttribute("value", `${somaInput}`);
                this.atualizarCalculoTroco(); 
            } 
            
            if (somaInput >= qtdDisponivel) {
                btn_qtdPlus.setAttribute("disabled", "disabled");
            }
        });
        
        btn_minus.addEventListener("click", (evt) => {
            if (Number(qtdInput.value) > 1) {
                let somaInputmin = Number(qtdInput.value) - 1;
                
                valorTotalVendaUnica = valorProduto * somaInputmin;
                
                valorTotal.innerHTML = `Valor Total: R$ ${valorTotalVendaUnica.toFixed(2)}`;
                qtdInput.setAttribute("value", `${somaInputmin}`);
                
                btn_qtdPlus.removeAttribute("disabled");
                this.atualizarCalculoTroco(); 
            }
        });

    }

    static async get_vendaSacola() {
        const stringDoLocalStorage = localStorage.getItem('lista_proutosVendaId');
        if (!stringDoLocalStorage) {
            console.error("IDs dos produtos não encontrados na localStorage.");
            window.location.href = '/dashboard_venda';
            return;
        }

        const listaIds = stringDoLocalStorage.split(',').map(item => Number(item.trim()));

        try {
            const acaobtnvenderSacola = await fetch("/acao_vendersacola", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                // CORREÇÃO: Enviamos a lista de IDs na chave 'id' para casar com o servidor
                body: JSON.stringify({ id: listaIds }) 
            });

            if (acaobtnvenderSacola.ok) {
                const dadosDoServidor = await acaobtnvenderSacola.json();
                
                listaProdutosSacola = dadosDoServidor.produto.map(produto => ({ 
                    ...produto,
                    qtdSelecionada: 1, 
                    preco_produto: Number(produto.preco_produto),
                    qtd_produto: Number(produto.qtd_produto),
                    // Garantimos que o ID do produto é mapeado corretamente
                    id: produto.id_produto_produto || produto.id 
                }));
                
                this.renderizarSacola(); 
                
                this.configurarListenersQuantidadeSacola();

            } else {
                console.error("Erro ao acessar os dados vindos do servidor.");
            }
        } catch (erro) {
            console.error("Erro ao acessar os dados vindos do servidor:", erro);
        }
    }

    static renderizarSacola() {
        containerSacola.innerHTML = ''; // Limpa o container
        valorTotalVendaSacola = 0; // Reinicia o total

        listaProdutosSacola.forEach(produto => {
            const precoUnitario = produto.preco_produto;
            const qtdDisponivel = produto.qtd_produto;
            const subtotal = precoUnitario * produto.qtdSelecionada;

            valorTotalVendaSacola += subtotal; // Soma ao Total Global

            // Criação do HTML (usando Classes e data-id)
            const produtoDiv = document.createElement('div');
            // 'item-sacola-wrapper' deve ser a classe que seu CSS estiliza
            produtoDiv.className = 'item-sacola-wrapper'; 
            produtoDiv.innerHTML = `
                <br>
                <h3 class="produto-nome" id="nome_produto${produto.id}">${produto.descri_produto}<span class="icon btn_edit_sacola" title="Editar Sacola"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></span></h3>        

                <p class="produto-preco" id="preco_produto${produto.id}">R$${precoUnitario.toFixed(2)}</p>
                
                <p data-id="${produto.id}" class="controle-quantidade"> 
                    Quantidade: 
                    <span class="quantity-control">
                        <button class="btn-quantity btn-minus-sacola" type="button" ${produto.qtdSelecionada <= 1 ? 'disabled' : ''}>-</button>
                        <input type="number" class="qtd-pro-input" value="${produto.qtdSelecionada}" readonly>
                        <button class="btn-quantity btn-plus-sacola" type="button" ${produto.qtdSelecionada >= qtdDisponivel ? 'disabled' : ''}>+</button>
                    </span>
                    
                </p>
                
                <p>Subtotal: <strong>R$${subtotal.toFixed(2)}</strong></p>
                <p class="q_disponivel">Quantidade disponivel:<span id="valor_qtd${produto.id}">${qtdDisponivel}</span></p>

            `;
            
            const btn_editSacola = produtoDiv.querySelector(".btn_edit_sacola");

            if(btn_editSacola){
                btn_editSacola.addEventListener("click", (evt) => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    console.log("Botão de edição clicado");
                    localStorage.setItem('abrir_sacola', 'true');
                    window.location.href = '/dashboard_venda';
                })
            }
                
            containerSacola.appendChild(produtoDiv);
        });

        // Atualiza o valor total no elemento HTML
        valorTotal.innerHTML = `Valor Total: R$ ${valorTotalVendaSacola.toFixed(2)}`;

        this.atualizarCalculoTroco();
    }

    static configurarListenersQuantidadeSacola() {
        if (containerSacola) {
            containerSacola.addEventListener("click", this._handleQuantidadeClick.bind(this));
        }
    }

    static _handleQuantidadeClick(evt) {
        const btn = evt.target;
        // Verifica se o clique foi em um dos botões de controle de sacola
        if (btn.classList.contains('btn-plus-sacola') || btn.classList.contains('btn-minus-sacola')) {

            
            const produtoContainer = btn.closest('.controle-quantidade');
            if (!produtoContainer) return;

            const produtoId = produtoContainer.dataset.id;
            // Encontra o produto no array de ESTADO CENTRAL
            const produto = listaProdutosSacola.find(p => String(p.id) === produtoId);
            
            if (!produto) return;

            let novaQtd = produto.qtdSelecionada;

            if (btn.classList.contains('btn-plus-sacola')) {
                if (novaQtd < produto.qtd_produto) {
                    novaQtd++;
                }
            } else if (btn.classList.contains('btn-minus-sacola')) {
                if (novaQtd > 1) {

                    novaQtd--;
                }
            }

            if (produto.qtdSelecionada !== novaQtd) {
                produto.qtdSelecionada = novaQtd;
                this.renderizarSacola(); 
            }
        }
    }


    static atualizarCalculoTroco() {
        // Determina qual total usar com base no modo de venda
        let totalDaVenda = (tipo_botao === 0) ? valorTotalVendaUnica : valorTotalVendaSacola;
        
        if (dinheiroSection) {
            const valorRecebido = Number(mDinheiro.value);
            const valorTroco = valorRecebido - totalDaVenda 
            const troco_zerado = valorRecebido - valorRecebido;
            
            if (valorTroco >= 0) {
                troco.innerHTML = `Troco: R$${valorTroco.toFixed(2)}`;
                return valorTroco;
            } else {
                troco.innerHTML = `Troco: R$0.00`; 
                return troco_zerado;
            }
        }
    }

    static get_Pagamento(){
        pagamentoSelect.addEventListener("change", () => {
            if(pagamentoSelect.value != "Dinheiro"){
                dinheiroSection.style.display = "none";

            } else {
                dinheiroSection.style.display = "block";
                this.atualizarCalculoTroco(); 
            }
        });
        
        mDinheiro.addEventListener("input", () => {
            this.atualizarCalculoTroco(); 
        });
    }

    //  Enviando os dados da venda simples para o servidor
    static async get_DadosVendas(){  
        const dadosVenda = {
                id_vendedor: id_vendedor,
                tipo_venda: tipo_botao,
                iten: Number(produtoVendaId),
                quantidade: Number(qtdInput.value),
                metodo: pagamentoSelect.value,
                total_venda: Number(valorTotalVendaUnica),
                valor_recebido: Number(mDinheiro.value),
                troco: Number(this.atualizarCalculoTroco()).toFixed(2),
                data: metadadosCompra.get_dataCompra()
            };
            try {
                const finalizar_venda = await fetch("/finalizar_venda", {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(dadosVenda)
                })                    
                const finalizar_venda_json = await finalizar_venda.json();


                //console.log(finalizar_venda_json.redirectUrl);
                
                if(finalizar_venda.ok === false){
                    console.log("erro");
                
                    mostrarMensagem(finalizar_venda_json.mensagem, "erro");

                }else {
                    localStorage.setItem('redirecionar', finalizar_venda_json.redirectUrl)
                    
                    mostrarMensagem(finalizar_venda_json.mensagem, "sucesso"); 
     
                }

            } catch (err) {
                console.log("Erro ao enviar os ddados para finalizar a venda: " + err);
            }

    }
    static get_btnCancelar(){
        const btn_cancelar = document.getElementById("btn_cancelar");
        btn_cancelar.addEventListener("click", (evt) => {
            evt.preventDefault();
            localStorage.removeItem("produtoVendaId");
            localStorage.removeItem("lista_proutosVendaId"); // Limpa IDs da sacola
            window.location.href = '/dashboard_venda';
        });
    };

    static async finalizarVendaSacola() {
        // 1. Mapear e Extrair ID e Quantidade Selecionada
        const itensParaVenda = listaProdutosSacola.map(produto => ({
            id: produto.id,
            quantidade: produto.qtdSelecionada,

        }));

        
        const metodoPagamento = pagamentoSelect.value;
        const valorRecebido = (metodoPagamento === 'Dinheiro') ? Number(mDinheiro.value) : valorTotalVendaSacola;
        
        //Montar o Objeto de Dados Completo
        const dadosVendaSacola = {
            id_vendedor: id_vendedor,
            tipo_venda: tipo_botao,
            metodo: pagamentoSelect.value,
            itens: itensParaVenda, // Objeto com IDs e Quantidades
            metodo: metodoPagamento,
            total_venda: Number(valorTotalVendaSacola.toFixed(2)),
            valor_recebido: Number(valorRecebido).toFixed(2),
            troco: Number(valorRecebido - valorTotalVendaSacola).toFixed(2),
            data: metadadosCompra.get_dataCompra()
        };
        try {
            const finalizar_venda = await fetch("/finalizar_vendasacola", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(dadosVendaSacola)
            })

            const finalizar_vendaSacola_json = await finalizar_venda.json();
            
            if(!finalizar_venda.ok){
                console.log("erro")
                mostrarMensagem(finalizar_vendaSacola_json.mensagem, "erro");
            }else{
                mostrarMensagem(finalizar_vendaSacola_json.mensagem, "sucesso");
                console.log("Teste") 
                console.log(finalizar_vendaSacola_json.redirectUrlS);
                localStorage.setItem('redirecionarS', finalizar_vendaSacola_json.redirectUrlS);
            };

        } catch (err) {
            console.log("Erro ao enviar os ddados para finalizar a venda: " + err);
        }
        
        // Verificação de segurança antes de enviar
        if (itensParaVenda.length === 0) {
            console.error("A sacola está vazia.");
            return;
        }
    }

}

document.addEventListener('DOMContentLoaded', () => {
    
    let vendaEmAndamento = false;

    if (infoFinal) infoFinal.style.display = 'none'; 
    if (containerSacola) containerSacola.style.display = 'none'; 

    if (tipo_botao === 0) {
        if (infoFinal) infoFinal.style.display = 'block';

        acao_Venda.get_btnVenda();
        acao_Venda.get_Quantidade();

        btn_finalizar.addEventListener("click", async (evt) => {
            evt.preventDefault();

            if (vendaEmAndamento) return;

            vendaEmAndamento = true; 
            btn_finalizar.disabled = true; 
            btn_finalizar.innerText = "Processando...";

            try {
                await acao_Venda.get_DadosVendas();
                
                const redirecionaritem = localStorage.getItem('redirecionar');
                
                if (redirecionaritem) {
                    localStorage.removeItem('produtoVendaId');
                    localStorage.removeItem('lista_proutosVendaId');
                    window.location.href = redirecionaritem;
                    localStorage.removeItem('redirecionar');
                } else {
                    console.log("erro ao finalizar a venda");
                    vendaEmAndamento = false;
                    btn_finalizar.disabled = false;
                    btn_finalizar.innerText = "Finalizar";
                }
            } catch (err) {
                vendaEmAndamento = false;
                btn_finalizar.disabled = false;
                btn_finalizar.innerText = "Finalizar";
            }
        });

    } else if (tipo_botao === 1) {

        if (containerSacola) containerSacola.style.display = 'block';
        acao_Venda.get_vendaSacola();

        btn_finalizar.addEventListener("click", async (evt) => {
            evt.preventDefault();

            if (vendaEmAndamento) return;

            vendaEmAndamento = true;
            btn_finalizar.disabled = true;
            btn_finalizar.innerText = "Processando...";

            try {
                await acao_Venda.finalizarVendaSacola();
                
                const redirecionaritemS = localStorage.getItem('redirecionarS');

                if (redirecionaritemS) {
                    localStorage.removeItem('produtoVendaId');
                    localStorage.removeItem('lista_proutosVendaId');
                    window.location.href = redirecionaritemS;
                    localStorage.removeItem('redirecionarS');
                } else {
                    console.log("erro ao finalizar a venda");
                    vendaEmAndamento = false;
                    btn_finalizar.disabled = false;
                    btn_finalizar.innerText = "Finalizar";
                }
            } catch (err) {
                vendaEmAndamento = false;
                btn_finalizar.disabled = false;
                btn_finalizar.innerText = "Finalizar";
            }
        });
        
    } else {
        console.log("Botão de venda não definido. Verifique a localStorage.");
    }
    
    acao_Venda.get_btnCancelar();
    acao_Venda.get_Pagamento();
});
