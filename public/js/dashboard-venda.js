// Variáveis e seletores globais
import { MensagemModal } from "./mensagem_modal.js";
const section = document.getElementById("section-produtos");
const containerCards = document.getElementById("container-cards");
const inputPesquisa = document.getElementById("pesquisa");
const home = document.getElementById("home");
const icon_voltar = document.querySelector("span.icon");
// const section_conte = document.getElementById("section-produtos");
const numIntens_sacola = document.getElementById("num_itens");
const sacola = document.getElementById("sacola");
const conteiner_pesquisa = document.getElementById("controla_oculta");
const btn_mensagem = document.getElementById("btn_mensagem");






home.style.background = "#325088ff";
// Array que armazena os IDs dos itens clicados
let array_itensClic = [];

// Função JavaScript atualizada para mostrar a mensagem
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
    }, 10); // Pequeno delay para ativar a 
    
    
    // Esconde após 3 segundos com fade-out
    setTimeout(() => {
        feedbackMensagem.classList.remove('visible');
        setTimeout(() => {
            feedbackMensagem.style.display = 'none';
        }, 500); // Tempo para completar a transição
    }, 3000);
}

// Classe para gerenciar a exibição e busca de produtos
class selecao_produto {
    static async lista_prdts() {
        try {
            const lista_prdts = await fetch("/lista_prdts");
            const lista_proutos = await lista_prdts.json();

            if(lista_prdts.ok){
                return lista_proutos;
            } else {
                console.error("Erro na resposta ao buscar lista de produtos: " + lista_prdts.statusText);
            }
        } 
        catch (erro) {
            console.error("Erro ao buscar lista de produtos: " + erro);
        }
        return [];
    }

    static async refatorarLista(produtos) {
        return produtos.map(produto => ({
            id: produto.id_produto_produto,
            nome: produto.descri_produto,
            preco: produto.preco_produto,
            quantidade: produto.qtd_produto
        }));
    }

    static criarElementos(nome_produto, preco_produto, qtd_produto, id_produto) {
        const produtoCard = document.createElement("div");
        produtoCard.className = "produto-card";
        produtoCard.setAttribute("id", `${id_produto}`);

        produtoCard.innerHTML = `
            <div class="produto-info">
                <h3 class="produto-nome">${nome_produto}</h3>
                <p class="produto-preco"><u>R$ ${preco_produto.toFixed(2)}</u></p>
                <p class="produto-estoque">Quantidade em estoque: ${qtd_produto}</p>
            </div>
            <div class="produto-actions">
                <button class="btn-vender">Vender</button>
                <button class="btn-add-sacola">Adicionar à Sacola</button>
            </div>
        `;
        return produtoCard;
    }

    static async exibirProdutos() {
        // Limpa a seção antes de exibir os produtos
        section.innerHTML = ''; 
        
        const produtos = await this.lista_prdts();
        const produtosRefatorados = await this.refatorarLista(produtos);

        const div_pai = document.createElement("div");
        div_pai.className = "div_pai";

        for (const produto of produtosRefatorados) {
            const produtoCard = this.criarElementos(produto.nome, produto.preco, produto.quantidade, produto.id);
            div_pai.appendChild(produtoCard);
        }
        section.appendChild(div_pai);
    }
}

//Função para carregar somente uma vez os Cards na ação de voltar na barra de pesquisa
let jaCarregou = false;
function carregarUmaVez() {
    if (jaCarregou) return; 
    
    selecao_produto.exibirProdutos();
    jaCarregou = true; 
}



// Classe para gerenciar a busca de produtos
class buscar_produto {
    static async refatorar_pesquisa(produto_pesq){
        return produto_pesq.map(produto => ({
            id: produto.id_produto_produto,
            nome: produto.descri_produto,
            preco: produto.preco_produto,
            quantidade: produto.qtd_produto
        }));
    }

    static async buscar(){
        try{
            const dado = {
                nome_prdt: inputPesquisa.value
            };

            const busca = await fetch("/produto_pesquisado", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(dado)
            });
            
            if(busca.ok){
                section.innerHTML = '';
                console.log("OK")
                const resultado = await busca.json();
                const produto_pesq = resultado.produtos;
                const produtosRefatorados = await this.refatorar_pesquisa(produto_pesq);

                
                const div_pai = document.createElement("div");
                div_pai.className = "div_pai";

                for (let produto of produtosRefatorados) {
                    const produtoCard = selecao_produto.criarElementos(produto.nome, produto.preco, produto.quantidade, produto.id);
                    div_pai.appendChild(produtoCard);
                }
                section.appendChild(div_pai);

                icon_voltar.classList.remove("oculto");
                icon_voltar.addEventListener("click", async () => {
                    section.innerText = "";
                    jaCarregou = false;
                    carregarUmaVez();
                    icon_voltar.classList.add("oculto")
                    inputPesquisa.value = "";

                }, { once: true }); // Adicionado { once: true } para evitar múltiplos listeners
            } else {
                const resultado = await busca.json();
                mostrarMensagem(resultado.mensagem, 'erro');
            }
        } catch(error) {
            console.error("Erro ao buscar Produto: " + error);
        }
    }
}
// Classe para gerenciar ações de venda e sacola
class acao_venda {
    static acao_btnVender() {
    let processando = false; // Trava local

    section.addEventListener("click", async (evt) => {
        if (evt.target.matches('.btn-vender')) {
            if (processando) return; // Se já estiver enviando, ignora o clique
            
            processando = true; 
            evt.target.innerText = "Aguarde..."; // Feedback visual

            const produtoCard = evt.target.closest('.produto-card');
            const id_produto = produtoCard.getAttribute('id');
            const id_clicado = { id: id_produto };

            try {
                const fetch_btnvender = await fetch("/acao_vender", {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(id_clicado)
                });
                const dados_vindoDB = await fetch_btnvender.json();

                if(fetch_btnvender.ok && dados_vindoDB.controle) {
                    localStorage.setItem('tipo_botao', 0);
                    localStorage.setItem('produtoVendaId', id_produto);
                    window.location.href = '/pagina_venda';
                }
            } catch (erro) {
                console.log("Erro na venda");
            } finally {
                processando = false; // Libera a trava
            }
        }
    });
}

    static acao_btnAdd() {
        section.addEventListener("click", (evt) => {
            if (evt.target.matches('.btn-add-sacola')) {
                const produtoCard = evt.target.closest('.produto-card');
                const id_produto = Number(produtoCard.getAttribute('id'));

                // Adiciona o ID apenas se ele não estiver no array
                if (!array_itensClic.includes(id_produto)) {
                    array_itensClic.push(id_produto);
                }
                
                numIntens_sacola.innerHTML = array_itensClic.length;
                //console.log("Itens na sacola:", array_itensClic);
            }
        });
    }
}


class SacolaManager {
    static async get_sacola() {
        if (array_itensClic.length > 0) {
            sacola.style.background = "#325088ff";
            try {
                const lista_sacola = await fetch("/lista_prdtsSacola", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(array_itensClic)
                });
                const lista_sacolaadd = await lista_sacola.json();
                if (lista_sacola.ok) {
                    return lista_sacolaadd;
                } else {
                    console.error("Erro na resposta ao buscar lista de produtos: " + lista_sacola.statusText);
                }
            } catch (erro) {
                console.error("Erro ao buscar lista de produtos: " + erro);
            }
        }
        return [];
    }

    static async refatoraSacola() {
        const produtos = await this.get_sacola();
        if (!produtos || !Array.isArray(produtos)) {
            console.error("Resposta da API não é um array válido.");
            return [];
        }
        return produtos.map(produto => ({
            id: produto.id_produto_produto,
            nome: produto.descri_produto,
            preco: produto.preco_produto,
            quantidade: produto.qtd_produto
        }));
    }

    static criarElementos(nome, preco, quantidade, id) {

        const produtoCard = document.createElement("div");
        produtoCard.className = "produto-sacola-card";
        produtoCard.innerHTML = `
            <h3 class="produto-nome">${nome}</h3>
            <p class="produto-preco">Preço: <u>R$ ${preco.toFixed(2)}</u></p>
            <button id="${id}" class="btn_removeSacola" title="Remover item">Remover</button>
        `;
        return produtoCard;
    }

    static async exibirProdutosSacola() {
        section.innerHTML = '';
        const produtos = await this.refatoraSacola();

        if (produtos.length === 0) {
            home.style.background = "none";
            //sacola.style.background = "#325088ff";
            section.innerHTML = '<p>A sacola está vazia.</p>';
            sacola.style.background = ""; // Reseta a cor de fundo
            numIntens_sacola.innerHTML = "0"; // Atualiza o contador
            return;
        }

        const div_pai_sacola = document.createElement("div");
        const titulo_pgSacola = document.createElement("h2");
        titulo_pgSacola.className = "produto-nome"
        titulo_pgSacola.innerHTML = "Sacola";
        div_pai_sacola.appendChild(titulo_pgSacola);

        for (const produto of produtos) {
            const produtoCard = this.criarElementos(produto.nome, produto.preco, produto.quantidade, produto.id);
            produtoCard.className = "produto-card";
            div_pai_sacola.appendChild(produtoCard);
        }
        section.appendChild(div_pai_sacola);
        numIntens_sacola.innerHTML = array_itensClic.length; // Atualiza o contador
        div_pai_sacola.className = "div_pai_sacola";
        const btn_finalizar = document.createElement("button");
        btn_finalizar.setAttribute("class", "btn_finalizarSacola");
        btn_finalizar.innerHTML = "Finalizar";
        div_pai_sacola.appendChild(btn_finalizar);

        // Fazer o envio dos produtos para o servidor e redirecionar para finalliza e pagar
        btn_finalizar.addEventListener("click", async (evt) => {

            try {            
                const fetch_btnvenderSacola = await fetch("/acao_vendersacola", {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({id: array_itensClic})
                });
                console.log(array_itensClic)

                const dados_vindoDBSacola = await fetch_btnvenderSacola.json();

                if(fetch_btnvenderSacola.ok && dados_vindoDBSacola.controle) {
                        localStorage.setItem('lista_proutosVendaId', [array_itensClic]);
                        localStorage.setItem('tipo_botao', 1); // 1 para indicar o botão de venda na sacola
                        window.location.href = '/pagina_venda';
                }
            } catch (erro) {
                console.log("Não foi possivel verificar os itens no banco dados");
            }
        })

    }
    static numItem() {
        numIntens_sacola.innerHTML = array_itensClic.length; // Atualiza o contador

        if(array_itensClic.length < 1) {

            home.style.background = "#325088ff";
            sacola.style.background = "none";
            section.innerHTML = "";
            conteiner_pesquisa.removeAttribute("id", "econde")
                // Inicialização

            selecao_produto.exibirProdutos();
    
        }

    }


    static configurarRemoverElementoSacola() {
        // Remove qualquer listener anterior para evitar duplicatas
        section.removeEventListener("click", this.handleRemoverElemento);
        section.addEventListener("click", this.handleRemoverElemento.bind(this));
        
    }

    static async handleRemoverElemento(evt) {
        if (evt.target.matches('.btn_removeSacola')) {
            const produtoCard_s = evt.target.closest('.produto-card');
            const elemento_filho = produtoCard_s.querySelector('.btn_removeSacola');
            const id_btnRemover = Number(elemento_filho.getAttribute("id"));

            // Remove o ID do array_itensClic
            const index = array_itensClic.indexOf(id_btnRemover);
            if (index !== -1) {
                array_itensClic.splice(index, 1);
            }

            // Remove o card do DOM
            produtoCard_s.remove();

            // Reexibe a sacola para refletir as mudanças
            //await this.exibirProdutosSacola();
            this.numItem();

            
            //console.log("Array atualizado:", array_itensClic);
        }
    }
};

const esconder_barraPesquisa = document.getElementsByClassName("search-container");
const btn_buscar = document.getElementById("btn_buscar");

inputPesquisa.addEventListener("input", async (evt) => {
    evt.preventDefault();
    await buscar_produto.buscar();
})
btn_buscar.addEventListener("click", async(evt) => {
    evt.preventDefault();
    await buscar_produto.buscar();

});

// Event Listeners
sacola.addEventListener("click", async () => {
    home.style.background = "none";
    btn_mensagem.style.background = "none";
    conteiner_pesquisa.setAttribute("id", "esconde");
    await SacolaManager.exibirProdutosSacola();
    SacolaManager.configurarRemoverElementoSacola();

});


home.addEventListener("click", (evt) =>{
    home.style.background = "#325088ff";
    sacola.style.background = "none";
    btn_mensagem.style.background = "none";
    section.innerHTML = "";
    conteiner_pesquisa.removeAttribute("id", "econde");
    conteiner_pesquisa.setAttribute("style", "display: block;");
    
    selecao_produto.exibirProdutos();
});


class mensagem{
    static modalMensagem() {
        btn_mensagem.addEventListener("click", async () => {
            btn_mensagem.style.background = "#325088ff";
            home.style.background = "none";
            sacola.style.background = "none";
            conteiner_pesquisa.setAttribute("style", "display: none;");
            section.innerHTML = MensagemModal.mensagemHome();
            MensagemModal.io_socket(); // Inicia o socket antes de carregar contatos
            await MensagemModal.configurarEventos(); // Carrega contatos e configura busca
        });
    }
}

// Inicialização
acao_venda.acao_btnVender();
acao_venda.acao_btnAdd();
selecao_produto.exibirProdutos();
mensagem.modalMensagem();
MensagemModal.inicializarNotificacoesGlobais();
