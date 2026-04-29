// index.js
require("dotenv").config();
const express = require('express');
const app = express();
const path = require('path');
const authRoutes = require("./routes/authRoutes.js");
const db = require('./db/db.js');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken"); 
const { authenticateJWT, requireOperario, requireAdm } = require('./middleware/authMiddleware'); 
const { json } = require("stream/consumers");
const { notEqual, strictEqual } = require("assert");
//const { session } = require("passport");
const session = require('express-session');
const fs = require('fs').promises;

 
const crypto = require('crypto'); 

app.use(session({
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 1000000}
}));


const porta = process.env.PORT;
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.json()); 
app.use(cookieParser());


const http = require('http');
const { Server } = require('socket.io');
const cookie = require('cookie'); 
const server = http.createServer(app);
const io = new Server(server);


io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    
    if (!cookies) return next(new Error("Autenticação necessária"));

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.jwt; 

    if (!token) return next(new Error("Token não encontrado"));

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) return next(new Error("Token inválido"));

        socket.user = decodedToken; 
        next();
    });
});

io.on('connection', (socket) => {
    console.log(`Funcionário ${socket.user.id} conectado ao chat`);

    // Cada funcionário entra em uma sala única baseada no ID dele
    socket.join(`user_${socket.user.id}`);

    socket.broadcast.emit('usuario_status', {
        id: socket.user.id,
        status: 'online',
        timestamp: new Date().toISOString()
    });

    // Evento de envio de mensagem privada
    socket.on('enviar_mensagem', async (dados) => {
        const { destinatario_id, texto } = dados;

        if (!destinatario_id || !texto || !texto.trim()) return;

        const remetente_id = socket.user.id;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const mensagemCompleta = {
            remetente_id,
            destinatario_id,
            texto: texto.trim(),
            timestamp
        };

        // Salvar no banco de dados
        let id_mensagem = null;
        try {
            const result = await db.salvarMensagem(remetente_id, destinatario_id, texto.trim());
            id_mensagem = result.insertId;
        } catch (err) {
            console.error('Erro ao salvar mensagem no DB:', err);
            return;
        }

        mensagemCompleta.id_mensagem = id_mensagem;

        io.to(`user_${destinatario_id}`).emit('receber_mensagem', mensagemCompleta);
        
        if (dados.temp_id) {
            socket.emit('mensagem_enviada_ok', { temp_id: dados.temp_id, id_mensagem, timestamp: mensagemCompleta.timestamp });
        }
    });

    // Evento de exclusão de mensagem
    socket.on('excluir_mensagem', async (dados) => {
        const { id_mensagem, id_destinatario } = dados;
        if (!id_mensagem) return;

        const remetente_id = socket.user.id;
        try {
            const excluiu = await db.excluirMensagem(id_mensagem, remetente_id);
            if (excluiu) {
                // Remove da tela do remetente
                socket.emit('mensagem_apagada', { id_mensagem });
                // Remove da tela do destinatário se ele estiver conectado
                if (id_destinatario) {
                    io.to(`user_${id_destinatario}`).emit('mensagem_apagada', { id_mensagem });
                }
            }
        } catch (err) {
            console.error('Erro ao excluir mensagem via socket:', err);
        }
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('usuario_status', {
            id: socket.user.id,
            status: 'offline',
            timestamp: new Date().toISOString()
        });
    });
});



// Rota Raiz: Redireciona se autenticado, serve login caso contrário
app.get("/", (req, res, next) => {
    authenticateJWT(req, res, () => {
        if (req.user) {
            if (req.user.tipo === 2) {
                return res.redirect("/dashboard_adm");
            } else if (req.user.tipo === 1) {
                return res.redirect("/dashboard_venda");
            }
        }
        res.sendFile(path.join(__dirname, "public", "index.html"));
    });
});




app.get("/dashboard_adm", authenticateJWT, requireAdm, async (req, res) => {
    try {
        // 1. Lê o conteúdo do arquivo HTML
        let html = await fs.readFile(path.join(__dirname, "views", "dashboard-adm.html"), 'utf8');

        // 2. Cria um objeto com os dados do usuário
        const usuario = {
            id: req.user.id,
            tipo: req.user.tipo
            // Você pode adicionar mais dados se tiver colocado no JWT
            // ex: email: req.user.email
        };

        // 3. Cria um script que injeta os dados no HTML
        const scriptInjecao = `<script>window.usuarioLogado = ${JSON.stringify(usuario)};</script>`;

        // 4. Encontra um lugar no HTML para injetar o script (ex: antes da tag de fechamento do head)
        // E envia a resposta com o HTML modificado
        html = html.replace('</head>', `${scriptInjecao}</head>`);
        res.send(html);

    } catch (error) {
        console.error("Erro ao servir dashboard-adm:", error);
        res.status(500).send("Erro interno do servidor.");
    }
});

// Faça o mesmo para a dashboard de Operário
app.get("/dashboard_venda", authenticateJWT, requireOperario, async (req, res) => {
    try {
        let html = await fs.readFile(path.join(__dirname, "views", "dashboard-venda.html"), 'utf8');
        const usuario = {
            id: req.user.id,
            tipo: req.user.tipo
        };
        const scriptInjecao = `<script>window.usuarioLogado = ${JSON.stringify(usuario)};</script>`;
        html = html.replace('</head>', `${scriptInjecao}</head>`);
        res.send(html);
    } catch (error) {
        console.error("Erro ao servir dashboard-venda:", error);
        res.status(500).send("Erro interno do servidor.");
    }
});

app.get("/lista_prdts", authenticateJWT, requireOperario,  async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    try {

        const allprdts = await db.todosProdutos();
        
        // 3. Retorna os produtos em formato JSON.
        res.json(allprdts);

    } catch (error) {
        console.error("Erro ao buscar produtos paginados:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
})


app.post("/produto_pesquisado", authenticateJWT, requireOperario, async (req, res) => {
    try {
        const termoBusca = req.body.nome_prdt; 
        if (!termoBusca || termoBusca.length < 1) {
            return res.status(400).json({ mensagem: "Insira o nome ou ID do produto." });
        }

        const todosProdutos = await db.todos_nomeProdutos();
        
        // 1. Tentar busca por ID EXATO primeiro
        const buscaPorId = todosProdutos.filter(p => p.id_produto_produto.toString() === termoBusca);

        if (buscaPorId.length > 0) {
            return res.status(200).json({ produtos: buscaPorId });
        }


        const stringSimilarity = require('string-similarity');
        
        const resultadosFiltrados = todosProdutos.filter(produto => {
            const similaridade = stringSimilarity.compareTwoStrings(termoBusca.toLowerCase(), produto.descri_produto.toLowerCase());
            return similaridade > 0.2; 
        });

        // Ordenação por similaridade
        resultadosFiltrados.sort((a, b) => {
            const simA = stringSimilarity.compareTwoStrings(termoBusca, a.descri_produto);
            const simB = stringSimilarity.compareTwoStrings(termoBusca, b.descri_produto);
            return simB - simA;
        });

        if (resultadosFiltrados.length > 0) {
            res.status(200).json({ produtos: resultadosFiltrados });
        } else {
            res.status(404).json({ mensagem: "Nenhum produto encontrado." });
        }

    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
});

app.post("/dados_user", authenticateJWT, requireOperario, async (req, res) => {
    console.log("rota de dados do usuário acessada, com os dados: ", req.body)
    try {
        const id_userLogado =req.body.id;
        const nome_usuario = await db.info_user(id_userLogado);
        if(id_userLogado){
            res.status(200).json({
                nome: nome_usuario.nome_funcionario_funcionario,
                id: id_userLogado,
                foto_url: nome_usuario.foto_url || null
            })
        }
    }catch(erro){
        console.error("Não foi possivel encontrar o user: " + erro)
        res.status(404).json({
            mensagem: "Não foi possivel fazer a busca"
        });
    };
});

app.get("/pagina_venda", authenticateJWT, requireOperario,  async(req, res) => {
    try{
        let html = await fs.readFile(path.join(__dirname, "views", "finalizar-compra.html"), 'utf8');
        res.send(html);
    }catch(erro) {
        console.log("Não foi possivel acessar a página de venda " + erro)
        res.status(400).json()({
            mensagem: "Não foi possivel carregar a página de venda"
        })
    }
})


app.post("/acao_vender", authenticateJWT, requireOperario, async (req, res) => {
    try {
        const id_produtoclicado = req.body.id;
        const info_produto = await db.produto_pesquisadoID(id_produtoclicado);

        if(id_produtoclicado) {
            // console.log(info_produto);

            res.status(200).json({
                produto: info_produto,
                controle: true
            });
        };
    } catch(erro) {
        console.log("Erro ao buscar o produto no estoque: " + erro);
        res.status(400).json({
            mensagem: "Não foi possivel fazer a busca do produto"
        });
    };
});


app.post("/acao_vendersacola", authenticateJWT, requireOperario, async (req, res) => {
    try {
        // A variável 'id_produtoclicado' AGORA É UM ARRAY DE IDS
        const listaDeIds = req.body.id; 
        
        // A função produto_pesquisadoID irá gerar a consulta com o IN (?)
        const info_produto = await db.produto_pesquisadoID(listaDeIds); 

        if(info_produto.length > 0) {
            res.status(200).json({
                produto: info_produto, // Mantemos 'produto' pois o JS robusto ajusta o nome no mapeamento
                controle: true
            });
            return;
        };
        
        res.status(404).json({ mensagem: "Produtos da sacola não encontrados no DB." });

    } catch(erro) {
        console.error("Erro ao buscar os produtos da sacola: " + erro);
        res.status(500).json({
            mensagem: "Erro interno ao processar a busca de produtos da sacola."
        });
    };
});
app.post("/lista_prdtsSacola", authenticateJWT, requireOperario, async (req, res) => {
    try {
        const array_id = req.body;
        const info_produtosacola = await db.produto_pesquisadoID(array_id);

        if(info_produtosacola) {
            console.log(array_id);

            res.status(200).json(
                info_produtosacola
            );
        };
    } catch(erro) {
        console.log("Erro ao buscar o produto no estoque: " + erro);
        res.status(400).json({
            mensagem: "Não foi possivel fazer a busca do produto"
        });
    }; 
});


app.post("/finalizar_venda", authenticateJWT, requireOperario, async (req, res) => {
    try {
        const dados_venda = req.body;
        const { tipo_venda, iten, quantidade, metodo, total_venda, valor_recebido, troco, data, id_vendedor } = dados_venda;
        //console.log(tipo_venda, iten, quantidade, metodo, total_venda, valor_recebido, troco, data.hora, id_vendedor)


    if (tipo_venda == 0) {


        
        // --- VALIDAÇÃO DE PRESENÇA E TIPO (Venda Simples) ---

        if (!iten || typeof iten !== 'number' || iten <= 0) {
            return res.status(400).json({ mensagem: "ID do produto inválido." });
        }
        
        if (!quantidade || typeof quantidade !== 'number' || quantidade <= 0) {
            return res.status(400).json({ mensagem: "Quantidade inválida." });
        }
        
        // Simplesmente garante que o campo está presente (você pode expandir esta validação)
        if (!metodo || !total_venda || !data) {
            return res.status(400).json({ mensagem: "Campos obrigatórios de pagamento ou data ausentes." });
        }

        //VALIDAÇÃO LÓGICA (Regras de Negócio) ---
        // VALIDAÇÃO DE ESTOQUE 
    
        try {
            //Buscar o produto real no DB para obter o preço e estoque atual
            const produtoDB = await db.produto_pesquisadoID(iten); 
            const estoqueDisponivel = produtoDB[0]?.qtd_produto;
            const precoUnitarioDB = produtoDB[0]?.preco_produto;
            
            if (!produtoDB || produtoDB.length === 0) {
                return res.status(404).json({ mensagem: "Produto não encontrado no estoque." });
            }

            if (quantidade > estoqueDisponivel) {
                return res.status(400).json({ mensagem: `Estoque insuficiente. Disponível: ${estoqueDisponivel}.` });
            }

            //VALIDAÇÃO DE PREÇO 
            const totalCalculado = precoUnitarioDB * quantidade;
            
            // Aceitar uma pequena margem de erro por causa de arredondamento
            if (Math.abs(totalCalculado - total_venda) > 0.02) {
                console.warn(`Alerta de preço: Frontend: ${total_venda}, Servidor: ${totalCalculado}`);
                return res.status(400).json({ mensagem: "Inconsistência no valor total da venda." });
            }
            
            //VALIDAÇÃO DE PAGAMENTO (Se for Dinheiro)
            if (metodo === 'Dinheiro') {
                const total = Number(total_venda);
                const recebido = Number(valor_recebido);
                if (recebido < total) {
                    return res.status(400).json({ mensagem: "Valor recebido inferior ao total da venda." });
                    
                }
            }
            
            // --- 3. EXECUÇÃO (Atualizar DB e Registrar Venda) --
            const transactionId = crypto.randomUUID();
            //console.log(transactionId);

            let dados_unitario = await db.produto_pesquisadoID(dados_venda.iten);
            let nome_produto = dados_unitario[0].descri_produto;
            let preco_unitario = Number(dados_unitario[0].preco_produto);

            // Preparar item para transação
            let itensVendaArr = [{
                quantidade_item: dados_venda.quantidade,
                id_produto: dados_venda.iten,
                id_vendedor: id_vendedor,
                data: data['data'],
                dia_semana: data['diaSemana'],
                metodo: dados_venda.metodo,
                valor_total: dados_venda.total_venda,
                troco: dados_venda.troco,
                hora: data['hora'],
                valor_recebido: dados_venda.valor_recebido,
                id_transacao: transactionId,
                preco_unitario: preco_unitario
            }];

            // registrar a venda na tabela de vendas junto com subtração de estoque em transação
            await db.registrarVendaTransacao(itensVendaArr);

            const vendedorInfo = await db.info_user(id_vendedor); // Buscando o nome do funcionario para enviar no resumo para o frntend
            console.log(dados_venda.metodo);
            let valor_recebidoTot = 0;
            if(dados_venda.metodo !== "Dinheiro"){

                valor_recebidoTot = dados_venda.total_venda;
            }

            const dadosfinal_venda = { 
                nome_vendedor: vendedorInfo.nome_funcionario_funcionario,
                iten_nome: nome_produto,
                qtd: dados_venda.quantidade, 
                mtd_pagamento: dados_venda.metodo, 
                tot_venda: dados_venda.total_venda,
                valor_unt: preco_unitario,
                val_res: dados_venda.valor_recebido,
                troco: dados_venda.troco,
                data_diaSemana: dados_venda.data.diaSemana,
                data_hora: dados_venda.data.hora,
                data: data['data'],
                id_transation: transactionId,
                valor_resPxcard: valor_recebidoTot
                
            }; // dados finais da venda para enviar ao frontenf;

            req.session.dadosVenda_simples = dadosfinal_venda;
            req.session.save(); //garante que a sessão foi salva antes de responder
  
            

            return res.status(200).json({
                mensagem: "Venda finalizada com sucesso!",
                resumo_nota: dadosfinal_venda,
                redirectUrl: "/nota"
                // Aqui você pode retornar o troco calculado pelo servidor, se for o caso
            });
            

        } catch (erro) {
            console.error("Erro no processamento da Venda Simples:", erro);
            return res.status(500).json({ mensagem: "Erro interno do servidor ao processar a venda.", redirectUrl: undefined });
        }
        
    } else {
        // Lógica de Venda Sacola (tipo_venda == 1)
        console.log("Chegou o botão clicado de venda sacola. PRÓXIMA VALIDAÇÃO!");
    }
    } catch(err) {
        console.log("Erro ao finalizar a venda: " + err)
    } 
    
})


app.post("/finalizar_vendasacola", authenticateJWT, requireOperario, async (req, res) => {
    var dadosfinalVenda_sacola = [];
    const dados_venda = req.body;
    const { tipo_venda, itens, metodo, total_venda, valor_recebido, troco, data, id_vendedor } = dados_venda;

    if (tipo_venda == 1) {
        const { metodo, itens, total_venda, valor_recebido, troco, data, id_vendedor } = dados_venda;

    // 1. VALIDAÇÃO DE PRESENÇA E TIPO (Dados Gerais)
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ mensagem: "A sacola de compras está vazia ou os dados dos itens estão inválidos." });
    }
    
    // Simplesmente garante que os campos estão presentes (expanda se necessário)
    if (!metodo || !total_venda || !data) {
        return res.status(400).json({ mensagem: "Campos obrigatórios de pagamento ou data ausentes." });
    }

    // 2. VALIDAÇÃO LÓGICA (Regras de Negócio por Item)
    try {
        let totalCalculadoServidor = 0;
        const itensValidados = []; // Para armazenar os dados reais do DB (preço, etc.)

        // A. Itera sobre cada item da sacola
        for (const itemVenda of itens) {
            const { id: itenId, quantidade } = itemVenda;

            // Validação de formato de cada item
            if (!itenId || typeof itenId !== 'number' || itenId <= 0 || 
                !quantidade || typeof quantidade !== 'number' || quantidade <= 0) {
                return res.status(400).json({ mensagem: "ID do produto ou Quantidade de um item na sacola está inválido." });
            }

            // B. Busca o produto no DB
            const produtoDB = await db.produto_pesquisadoID(itenId);
            
            if (!produtoDB || produtoDB.length === 0) {
                return res.status(404).json({ mensagem: `Produto com ID ${itenId} não encontrado no estoque.` });
            }

            const estoqueDisponivel = produtoDB[0]?.qtd_produto;
            const precoUnitarioDB = produtoDB[0]?.preco_produto;
            
            // C. Validação de Estoque
            if (quantidade > estoqueDisponivel) {
                return res.status(400).json({ mensagem: `Estoque insuficiente para o produto ID ${itenId}. Disponível: ${estoqueDisponivel}.` });
            }
            
            // D. Cálculo e Acúmulo do Total
            const subtotalCalculado = precoUnitarioDB * quantidade;
            totalCalculadoServidor += subtotalCalculado;
            
            itensValidados.push({
                ...itemVenda, // id e quantidade
                preco_unitario: precoUnitarioDB,
                subtotal: subtotalCalculado
            });
        }
        
        // 3. VALIDAÇÃO GERAL (Preço e Pagamento)
        
        // A. Validação de Preço Total
        // Aceitar uma pequena margem de erro por causa de arredondamento
        if (Math.abs(totalCalculadoServidor - total_venda) > 0.02) {
            console.warn(`Alerta de preço (Sacola): Frontend: ${total_venda}, Servidor: ${totalCalculadoServidor}`);
            return res.status(400).json({ mensagem: "Inconsistência no valor total da venda da sacola." });
        }
        
        // B. Validação de Pagamento (Se for Dinheiro)
        if (metodo === 'Dinheiro') {
            const total = Number(total_venda);
            const recebido = Number(valor_recebido);
            if (recebido < total) {
                return res.status(400).json({ mensagem: "Valor recebido inferior ao total da venda." });
            }
        }

            const itens_sacola = dados_venda.itens;
            const transactionIdSacola = crypto.randomUUID();
            const itensTransacaoArr = []; // Array para agrupar todas as vendas da sacola

            for (let c in itens_sacola) {

            // A. Capturar dados do item
            const id_produto_item = itens_sacola[c].id;
            let produtoCompleto = await db.produto_pesquisadoID(id_produto_item);
            const nome_produtoNota = produtoCompleto[0].descri_produto;


            let nomecompletoVendedor = await db.info_user(id_vendedor);
            const nome_vendedor = nomecompletoVendedor.nome_funcionario_funcionario;


            const quantidade_item = itens_sacola[c].quantidade;

            let dados_unitario = await db.produto_pesquisadoID(id_produto_item); 
            let preco_unitario = Number(dados_unitario[0].preco_produto); 

            
            const valor_total_item = preco_unitario * quantidade_item;


            dadosfinalVenda_sacola.push([
                "itens", nome_produtoNota,
                "nome_vendedor", nome_vendedor,
                "data", dados_venda['data'].data,
                "data_diaSemana", dados_venda['data'].diaSemana,
                "mtd_pagamento", metodo,
                "tot_venda", valor_total_item,
                "troco", troco,
                "valor_resPxcard", valor_total_item,
                "data_hora", dados_venda['data'].hora,
                "val_res", valor_recebido,
                "qtd_itens", quantidade_item,
                "id_transation", transactionIdSacola,
                "preco_unitario", preco_unitario
            ]);           
            // Agrupar itens no formato que a nova transação espera
            itensTransacaoArr.push({
                quantidade_item: quantidade_item,
                id_produto: id_produto_item,
                id_vendedor: id_vendedor,
                data: dados_venda['data'].data,
                dia_semana: dados_venda['data'].diaSemana,
                metodo: metodo,
                valor_total: valor_total_item,
                troco: troco,
                hora: dados_venda['data'].hora,
                valor_recebido: valor_recebido,
                id_transacao: transactionIdSacola,
                preco_unitario: preco_unitario
            });

        }
        
        // Chamada da Função de Registro Unificada em Transação
        try {
            await db.registrarVendaTransacao(itensTransacaoArr);
        } catch (error) {
            console.error("Falha ao registrar a sacola usando transação única.", error);
            throw error; 
        }
        console.log(dadosfinalVenda_sacola.length);
        

        req.session.dadosSacolaNota = [...dadosfinalVenda_sacola];
        // console.log(req.session.dadosSacolaNota);
        return res.status(200).json({ 
            mensagem: "Venda da sacola finalizada com sucesso!",
             //detalhes_itens: itensValidados, Opcional: retornar dados validados
            redirectUrlS: "/nota"
        });

    } catch (erro) {
        console.error("Erro no processamento da Venda Sacola:", erro);
        return res.status(500).json({ mensagem: "Erro interno do servidor ao processar a venda da sacola.", redirectUrlS: undefined });
    }
    } else {
        // Caso tipo_venda não seja 0 (Simples) nem 1 (Sacola)
        return res.status(400).json({ mensagem: "Tipo de venda inválido." });
    }
})



app.get("/nota", authenticateJWT, requireOperario, async (req, res) => {
    try {
        let html = await fs.readFile(path.join(__dirname, "views", "nota.html"), "utf-8");
        res.status(200).send(html);

    }catch (erro) {
        console.error("Erro ao carregar a nota de venda: " + erro);
        res.status(500).json({
            mensagem: "Erro interno ao carregar a nota de venda."
        })
    }
})

app.get("/nota_simples", authenticateJWT, requireOperario, async (req, res) => {
    try {
        const dadosDaSessao = req.session.dadosVenda_simples;
        if(dadosDaSessao){
            res.status(200).json({
                mensagem: "Nota gerada com sucesso!",
                dados:  dadosDaSessao
            });
        };

    }catch (error) {
        return res.status(500).json({
            mensagem: "Erro interno ao gerar dados da nota."
        })
    }
});

app.get("/nota_sacola", authenticateJWT, requireOperario, async (req, res) => {
    const dadosFinalnota_dadosSacola = req.session.dadosSacolaNota
    try {
        if(req.session.dadosSacolaNota){
            res.status(200).json({
                mensagem: "Nota gerada com sucesso!",
                dados: dadosFinalnota_dadosSacola
            });;
        };
    }catch (error) {
        return res.status(500).json({
            mensagem: "Erro interno ao gerar dados da nota."
        });
    }
});



app.get("/relatorio", authenticateJWT, requireAdm, async (req, res) => {
    try {
        let html = await fs.readFile(path.join(__dirname, "views", "relatorio.html"), "utf-8");
        res.status(200).send(html);

    }catch (erro) {
        console.error("Erro ao carregar a página de relatório: " + erro);
        res.status(500).json({
            mensagem: "Erro interno ao carregar a página de relatório."
        })
    }
})



app.get("/estoque", authenticateJWT, requireAdm, async (req, res) => {
    try {
        let html = await fs.readFile(path.join(__dirname, "views", "estoque.html"), "utf-8");
        res.status(200).send(html);

    }catch (erro) {
        console.error("Erro ao carregar a página de controle de estoque: " + erro);
        res.status(500).json({
            mensagem: "Erro interno ao carregar a página de controle de estoque."
        })
    }
})

// rotas para a dashboard de Adiministração:



//Rota para passar o balanco financeiro simples das ultimas 24 horas
app.get("/balanco", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const dados_balancoDB = await db.balancoVendas();
        //console.log(dados_balancoDB)

        if(dados_balancoDB) {
            res.status(200).json({
                mensagem: "Balanço financeiro das últimas 24 horas obtido com sucesso!",
                dados: dados_balancoDB
            })
        }
    }catch (error) {
        console.log("Erro ao tentar obter o balanço financeito: " + error)
        res.status(500).json(({
            mensagem: "Erro interno ao tentar obter o balanço finaceir: " + error
        }))
    }
})



//Rota para passar o balanco financeiro completo com datas variáveis:
app.post("/relatorio_balanco", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const { inicio, fim } = req.body;

        const dInicio = new Date(inicio);
        const dFim = new Date(fim);

        const diffMs = dFim - dInicio;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

        const dFimAnterior = new Date(dInicio);
        dFimAnterior.setDate(dFimAnterior.getDate() - 1);

        const dInicioAnterior = new Date(dFimAnterior);
        dInicioAnterior.setDate(dInicioAnterior.getDate() - (diffDays - 1));

        const f = (d) => d.toISOString().split('T')[0];
        const [atual, anterior, dadosGrafico, dadosPagamento, dadosgraficoAnterior, produtosTop] = await Promise.all([
            db.balancoPorData(f(dInicio), f(dFim)),
            db.balancoPorData(f(dInicioAnterior), f(dFimAnterior)),
            db.faturamentoGrafico(f(dInicio), f(dFim)),
            db.pagamentosGrafico(f(dInicio), f(dFim)),
            db.faturamentoGrafico(f(dInicioAnterior), f(dFimAnterior)),
            db.topProdutos(f(dInicio), f(dFim))
            
        ]);

        res.status(200).json({
            dados: { 
                datas: {
                    data_inicio: dInicio,
                    data_fim: dFim
                },
                atual, 
                anterior, 
                graficoFaturamento: {
                    atual: dadosGrafico,
                    anterior: dadosgraficoAnterior
                },
                graficoPagamento: dadosPagamento,
                produtosTop: produtosTop
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
});


// Rota para passar o resumo do volume de vendas das últimas 24h
app.get("/resumo_qtdVendas", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const dados_resumoVendas= await db.resumoVolumeVendas24h();

        if(dados_resumoVendas) {
            res.status(200).json({
                mensagem: "Resumo de volume de vendas resgistradas últimas 24 horas obtido com sucesso!",
                dados: dados_resumoVendas
            })
        }
    }catch (error) {
        console.log("Erro ao tentar obter o resumo de vendas : " + error)
        res.status(500).json(({
            mensagem: "Erro interno ao tentar obter o erro ao obter o resumo de vendas: " + error
        }))
    }
})

// Rota para alertar os itens com estoque baixo:
app.get("/estoque_baixo", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const itens_estoqueBaixo= await db.produtosEstoqueBaixo();

        if(itens_estoqueBaixo) {
            res.status(200).json({
                mensagem: "resumo simples de itens com estoque baixo obtido com sucesso!",
                dados: itens_estoqueBaixo
            })
        }
    }catch (error) {
        console.log("Erro ao tentar obter o resumo de itens com estoque baixo: " + error)
        res.status(500).json(({
            mensagem: "Erro interno ao tentar obter o erro ao obter o resumo de itens com estoque baixo: " + error
        }))
    }
})



// Rota para a página de: Controle de estoque:
app.get("/contro_estoque", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const nome_itens = await db.produtosEstoqueBaixoDetalhado();

        if(nome_itens) {
            res.status(200).json({
                mensagem:"Dados completos dos itens com estoque baixo",
                dados: nome_itens
            })
        }


    }catch(error) {
        console.log("Eu ao obter os itens com estoque baixo: " + error);
        res.status(500).json({
            mensagem: "Erro interno ao tentar obter os itens com estoque baixo"
        });
    };
});


// ROta para página de controle de estoque: Rota para buscar  dados dos itens clicados
app.post("/buscar_info", authenticateJWT, requireAdm, async (req, res) => {
    try{
        const id_item = req.body;
        dados = await db.itemEstoque_pesquisadoID(id_item.id);

        //console.log(dados)

        res.status(200).json({
            item: dados,
            mensagem: "Dados obtidos com sucesso!"
        })


    }catch(error){
        console.log("Erro ao buscar dados dos itens clicados no Banco de Dados: " + error)
        res.status(500).json({
            mensagem: "Erro interno ao busca dados do item clicado!"
        })
    }
})


// ROta para página de controle de estoque: Rota para buscar  dados dos itens clicados também os itens "excluidos"
app.post("/buscar_infoAll", authenticateJWT, requireAdm, async (req, res) => {
    try{
        const id_item = req.body;
        dados = await db.item_lista(id_item.id);

        //console.log(dados)

        res.status(200).json({
            item: dados,
            mensagem: "Dados obtidos com sucesso!"
        })


    }catch(error){
        console.log("Erro ao buscar dados dos itens clicados no Banco de Dados: " + error)
        res.status(500).json({
            mensagem: "Erro interno ao busca dados do item clicado!"
        })
    }
})


// Rota para buscar o histórico de edições
app.post("/historico_edicoes", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const { inicio, fim } = req.body;
        const dadosLog = await db.buscarHistoricoEdicoes(inicio, fim);
        res.status(200).json({ dados: dadosLog, mensagem: "Histórico carregado com sucesso" });
    } catch(err) {
        res.status(500).json({ mensagem: "Erro ao buscar histórico: " + err });
    }
});

app.post("/historico_deletados", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const { inicio, fim } = req.body;
        const dadosLog = await db.buscarHistoricoDeletados(inicio, fim);
        res.status(200).json({ dados: dadosLog, mensagem: "Histórico carregado com sucesso" });
    } catch(err) {
        res.status(500).json({ mensagem: "Erro ao buscar deletados físicos: " + err });
    }
});

// Rota para Restaurar item excluido
app.post("/restaurar_item", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const { id } = req.body;
        await db.restaurar_item(id, req.user.id);
        res.status(200).json({ mensagem: "Item restaurado com sucesso!" });
    } catch(err) {
        res.status(500).json({ mensagem: "Erro ao restaurar item." });
    }
});

// Rota para Excluir definitivamente
app.post("/exclusao_definitiva", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const { id } = req.body;
        await db.exclusaoDefinitiva(id, req.user.id);
        res.status(200).json({ mensagem: "Item excluído definitivamente!" });
    } catch(err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            res.status(400).json({ mensagem: "Bloqueado: O item já possui vendas ou relatórios no banco. Mantenha-o apenas no Modo Inativado!" });
        } else {
            res.status(500).json({ mensagem: "Erro interno crítico na exclusão." });
        }
    }
});

// Rota para listagem de produtos com filtros de data e ordenação
app.post("/dados_lista", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const { inicio, fim, ordenacao } = req.body;
        const dados = await db.rankingVendasCompletoDatas(inicio, fim, ordenacao || 'mais_vendidos');
        res.status(200).json({ itens: { dados }, mensagem: "Listagem carregada com sucesso." });
    } catch(err) {
        res.status(500).json({ mensagem: "Erro ao buscar listagem: " + err });
    }
});


// Rota de pesquisa global de produtos por nome (sem filtros de data)
app.post("/pesquisar_produto", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const { termo } = req.body;
        if (!termo || termo.trim() === '') {
            return res.status(400).json({ mensagem: "Termo de pesquisa obrigatório." });
        }
        const dados = await db.pesquisarProdutos(termo.trim());
        res.status(200).json({ itens: { dados }, mensagem: "Pesquisa concluída." });
    } catch(err) {
        res.status(500).json({ mensagem: "Erro na pesquisa: " + err });
    }
});


// ----------------------------------------------
app.post("/dell_item", authenticateJWT, requireAdm, async (req, res) => {
    try{

        const  id_item  = req.body;
        const dell = await db.dell_item(id_item.id, req.user.id);

        res.status(200).json({ mensagem: "Item inativado com sucesso." });

    }catch(error){
        return  res.status(500).json({
            mensagem: "Erro interno ao tentar excluir o item: " + error
        })   
    }
});


// Rota para atualizar item e adicionar dados no estoque_log
app.post("/atualiza_item", authenticateJWT, requireAdm,  async (req, res) => {
    try{
        const dados = { ...req.body, id_usuario: req.user.id };
        const atualiza_comLog = await db.atualizarComLog(dados);

        res.status(200).json({
                mensagem: "Dados adicionado/editado com logs realizado com sucesso!!"
            })
        
    }catch(error){
        return  res.status(500).json({
            mensagem: "Erro interno ao adicionar/atualizar dados: " + error
        });
    };
});


// Rota para adicionar um novo item, caso esse itém ja exixta, "atualizar" o preço ou o estouque e adicionado dados no estoque_log
app.post("/additem", authenticateJWT, requireAdm, async (req, res) => {
    try{
        const payload = { ...req.body, id_user: req.user.id };
        const add_item = db.adicionarOuReporComLog(payload)

        res.status(200).json({
            mensagem: "Item adicionado com sucesso!"
        })

    }catch(error){
        return res.status(500).json({
            mensagem: "Erro interno oa adicionar novo item: " + error
        })
    }
})


// Rota para listagem por data selecionada e por filtro
app.post("/dados_lista", authenticateJWT, requireAdm, async (req, res) => {
    try{
        
        const { inicio, fim } = req.body;
        

        if(inicio == 0) {
            //console.log("Devo fazer aqui uma  rota que satisfaça o dados de forma geral, sem limite de data inicial, pegando todo o perildo")
            const [rankingGeral] = await Promise.all([
                db.rankingVendasCompleto(fim)
            ]);
            res.status(200).json({
                itens: {
                    dados: rankingGeral,
                    //mensagem: "Busca feita com sucesso!"
                }
            })

        }else{
            const dInicio = new Date(inicio);
            const dFim = new Date(fim);
            const f = (d) => d.toISOString().split('T')[0];

            const [rankingPordata] = await Promise.all([
                db.rankingVendasCompletoDatas(f(dInicio), f(dFim))
            ])
            //console.log(rankingPordata);


            res.status(200).json({
                itens: {
                    dados: rankingPordata,
                    //mennsagem: "Ranking de itens por data acessado com sucesso!"
                }
                
            })
        }


    }catch(error){
        return res.status(500).json({
            mensagem: "Erro iterno ao buscar item: " + error
        })
    }
    
})


// Parte para a criação das lógicas envolvendo a adição de novos  funcionarios.
app.get("/novofuncionario", authenticateJWT, requireAdm, async (req, res) => {
    try {
        let html = await fs.readFile(path.join(__dirname, "views", "add_funcionario.html"), "utf-8");
        res.status(200).send(html);

    }catch (erro) {
        console.error("Erro ao carregar a página de controle de estoque: " + erro);
        res.status(500).json({
            mensagem: "Erro interno ao carregar a página de controle de estoque."
        })
    }
})


// Rota para validar e salvar os dados dos novos funcionarios no banco de dados
const multer = require('multer');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/funcionarios');
    },
    filename: (req, file, cb) => {
        // Nome único para evitar sobrescrever arquivos
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 2. A Rota Corrigida
const bcrypt = require('bcryptjs');

app.post("/cadastrar-funcionario", authenticateJWT, requireAdm, upload.single("foto_funcionario"), async (req, res) => {
    try {
        const { nome, email, cpf, tipo, senha, data_admissao, salario, telefone } = req.body;

        // 1. Validação de Campos Obrigatórios
        if (!nome || !email || !cpf || !senha) {
            return res.status(400).json({ mensagem: "Campos obrigatórios faltando!" });
        }

        // 2. Validação de CPF (Mínimo de caracteres)
        if (cpf.length < 11) {
            return res.status(400).json({ mensagem: "CPF inválido!" });
        }

        // 3. Criptografia da Senha 
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        // 4. Preparação do caminho da foto
        const foto_url = req.file ? `/img/funcionarios/${req.file.filename}` : '/img/funcionarios/default.png';

        // 5. Chamar a função do Banco de Dados (que vamos criar abaixo)
        const resultado = await db.cadastrarFuncionario({
            nome,
            email,
            cpf,
            tipo,
            senha: senhaCriptografada, // Enviamos o HASH, não a senha pura
            data_admissao,
            salario: salario || 0,
            telefone,
            foto_url
        });

        res.status(201).json({ mensagem: "Funcionário cadastrado com sucesso!", id: resultado.insertId });

    } catch (error) {
        // Tratar erro de duplicidade (CPF ou Email já cadastrados)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensagem: "E-mail ou CPF já cadastrado no sistema!" });
        }
        
        console.error("Erro no cadastro:", error);
        res.status(500).json({ mensagem: "Erro interno ao cadastrar funcionário." });
    }
});



// Parte para a criação das lógicas para lista de funcionarios.
app.get("/funcionarios", authenticateJWT, requireAdm, async (req, res) => {
    try {
        let html = await fs.readFile(path.join(__dirname, "views", "lista_funcionario.html"), "utf-8");
        res.status(200).send(html);

    }catch (erro) {
        console.error("Erro ao carregar a página de controle de estoque: " + erro);
        res.status(500).json({
            mensagem: "Erro interno ao carregar a página de controle de estoque."
        })
    }
})





// Rota para exibir os dados do usuario logado (para a dashboard de perfil)
app.post("/dadosUserLogado", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const id = req.body.id_usuario
        if(id){
            const dadosUser = await db.buscarFuncionarioLogado(id);
            res.status(200).json({
                dados: dadosUser
            })
        }else {
            res.status(400).json({
                mensagem: "ID do usuário não informado"
            })
        }
        
    }catch (error) {
        res.status(500).json({
            mensagem: "Erro interno ao buscar dados do usuário."
        })
    }
})

// Rota para pegar a lista completa de funcionarios
app.get("/lista_Cfuncionarios", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const list_funcionarios = await db.lista_funcioarios();

        //console.log(list_funcionarios);
        
        if(list_funcionarios) {
            res.status(200).json({
                mensagem: "Lista de funcionários obtida com sucesso!",
                lista: list_funcionarios
            })       
        }else {
            res.status(404).json({
                mensagem: "Nenhum funcionário encontrado"
            })
        }
    }catch(error) {
        res.status(500).json({
            mensagem: "Erro interno ao obter a lista de funcionários."
        })
    }
})


// Rota para exibir os dados detalhados do funcionário clicado:
app.post("/dados_detalhados", authenticateJWT, requireAdm,  async (req, res) => {
    try {
        const id = req.body.id;
        if(id) {
            const dados_funcionario = await db.historicoFuncionario(id);
            res.status(200).json(dados_funcionario)
        }else {
            res.status(400).json({
                mensagem: "ID do funcionário não informado"
            })
        }
    }catch  (error) {
        res.status(500).json({
            mensagem: "Erro interno ao obter os dados detalhados do funcionário: " + error
        })
    }
})


//Rota para enviar as informações do funcionário clicado para edição:
app.post("/editar_dados", authenticateJWT, requireAdm,  async (req, res) => {
    try {
        const id = req.body.id;
        if(id) {
            const dados_funcionario = await db.getFuncionarioParaEditar(id);
            res.status(200).json(dados_funcionario)
        }else {
            res.status(400).json({
                mensagem: "ID do funcionário não informado"
            })
        }
    }catch  (error) {
        res.status(500).json({
            mensagem: "Erro interno ao obter os dados e realizar a edição: " + error
        })
    }
})


// rota para atualizar/editar os dados do funcionário clicado:
app.put("/editar-funcionario/:id", authenticateJWT, requireAdm, upload.single("foto_funcionario"), async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nome, email, cpf, id_cargo, nova_senha, 
            data_admissao, salario, telefone 
        } = req.body;

        if (!id || !nome || !email || !cpf || !id_cargo) {
            return res.status(400).json({ mensagem: "Campos obrigatórios faltando!" });
        }

        if (cpf.length < 11) {
            return res.status(400).json({ mensagem: "CPF inválido!" });
        }

        let foto_url = null;

        if (req.file) {
            foto_url = `/img/funcionarios/${req.file.filename}`;
        } else {
            const dadosAtuais = await db.getFuncionarioParaEditar(id);
            if (dadosAtuais) {
                foto_url = dadosAtuais.foto_url;
            }
        }

        const dadosAtualizacao = {
            nome: nome.trim(),
            email: email.trim(),
            cpf: cpf.trim(),
            tipo: parseInt(id_cargo),
            data_admissao: data_admissao || null,
            salario: parseFloat(salario) || 0,
            telefone: telefone ? telefone.trim() : null,
            foto_url
        };


        if (nova_senha && nova_senha.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            dadosAtualizacao.senha = await bcrypt.hash(nova_senha.trim(), salt);
        }

        const resultado = await db.atualizarFuncionario(
            id, 
            dadosAtualizacao, 
            req.user?.id || req.usuario?.id,
            "Atualização de dados do funcionário"
        );

        if (resultado) {
            res.status(200).json({ 
                mensagem: "Funcionário atualizado com sucesso!", 
                id: parseInt(id) 
            });
        } else {
            res.status(404).json({ mensagem: "Funcionário não encontrado!" });
        }

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                mensagem: "E-mail ou CPF já cadastrado por outro funcionário!" 
            });
        }
        
        console.error("Erro ao atualizar funcionário:", error);
        res.status(500).json({ mensagem: "Erro interno ao atualizar funcionário." });
    }
});


// Funçãoo para desativar um  ficionário, deixar ele inativo/demitido
app.post("/desligar-funcionario", authenticateJWT, requireAdm, async (req, res) => {
    try {
        const { id, motivo } = req.body;

        if (!id || !motivo) {
            return res.status(400).json({ mensagem: "ID e motivo são obrigatórios" });
        }

        const sucesso = await db.desligarFuncionario(
            id, 
            motivo, 
            req.user?.id || req.usuario?.id   // ID do admin que está desligando
        );

        if (sucesso) {
            res.status(200).json({ 
                mensagem: "Funcionário desligado com sucesso!",
                id 
            });
        } else {
            res.status(404).json({ mensagem: "Funcionário não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao desligar funcionário:", error);
        res.status(500).json({ mensagem: "Erro interno ao desligar funcionário" });
    }
});


// Função para listar os funcinarios desligados/demitidos
app.get("/ex-funcionarios", authenticateJWT, requireAdm, async (req, res) => {
    try{
        const lista_exFuncionarios = await db.lista_funcionarios_demitidos();
        if(lista_exFuncionarios){
            //console.log(lista_exFuncionarios);
            res.status(200).json(lista_exFuncionarios);
        }else{
            res.status(404).json({ mensagem: "Nenhum funcionário desligado encontrado" });
        }
    }catch(error){
        console.error("Erro ao lista os funcionários desligados: " + error);
        res.status(500).json({ mensagem: "Erro interno ao listar os funcionários desligados" });
    }
});


// Funções para exibir e realizar as ações de reemboso:
app.get("/busca_idtransacao", authenticateJWT, requireOperario, async (req, res) => {
    try {
        const id_transacao = req.id;

        if(id_transacao) {
            console.log(id_transacao)
        }
    }catch (error){
       console.error("Erro ao buscar transação:", error);
        res.status(500).json({ mensagem: "Erro interno ao buscar dados." }); 
    }
})

// Inclui suas rotas de autenticação (ex: POST /login)
app.use(authRoutes);




// Retorna a lista de contatos (funcionários ativos) com prévia da última mensagem
app.get("/contatos_msg", authenticateJWT, async (req, res) => {
    try {
        const contatos = await db.buscarContatosAtivos(req.user.id);
        res.status(200).json({ contatos });
    } catch (error) {
        console.error("Erro ao buscar contatos:", error);
        res.status(500).json({ mensagem: "Erro interno ao buscar contatos." });
    }
});

// Retorna o histórico de mensagens entre o usuário logado e outro funcionário
app.get("/conversa/:id_contato", authenticateJWT, async (req, res) => {
    try {
        const id_contato = parseInt(req.params.id_contato);
        if (!id_contato) return res.status(400).json({ mensagem: "ID inválido." });

        // Marcar como lidas as mensagens recebidas deste contato
        await db.marcarComoLida(id_contato, req.user.id);
        
        // Avisar o contato que suas mensagens foram lidas
        io.to(`user_${id_contato}`).emit('mensagens_lidas', { by_user: req.user.id });

        const mensagens = await db.buscarConversa(req.user.id, id_contato);
        res.status(200).json({ mensagens });
    } catch (error) {
        console.error("Erro ao buscar conversa:", error);
        res.status(500).json({ mensagem: "Erro interno ao buscar conversa." });
    }
});

// Marca as mensagens de um remetente como lidas
app.post("/msg_lida", authenticateJWT, async (req, res) => {
    try {
        const { id_remetente } = req.body;
        if (!id_remetente) return res.status(400).json({ mensagem: "ID do remetente obrigatório." });
        await db.marcarComoLida(id_remetente, req.user.id);
        
        // Avisar o remetente que suas mensagens foram lidas
        io.to(`user_${id_remetente}`).emit('mensagens_lidas', { by_user: req.user.id });

        res.status(200).json({ mensagem: "Mensagens marcadas como lidas." });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno." });
    }
});




// ROTAS DO MÓDULO DE DEVOLUÇÃO/AUDITORIA 
app.get("/api/vendas/:id_transacao", authenticateJWT, async (req, res) => {
    try {
        const idTransacao = req.params.id_transacao;
        if (!idTransacao) {
            return res.status(400).json({ mensagem: "ID da transação não fornecido." });
        }

        const transacao = await db.buscarVendaPorTransacao(idTransacao);
        if (!transacao || transacao.length === 0) {
            return res.status(404).json({ mensagem: "Transação não encontrada." });
        }

        res.status(200).json({ transacao });
    } catch (error) {
        console.error("Erro ao buscar transação (API):", error);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
});

app.post("/api/auditoria", authenticateJWT, async (req, res) => {
    try {
        const payload = req.body;
        if (!payload.id_transacao_ref || !payload.tipo_acao || !payload.motivo) {
            return res.status(400).json({ mensagem: "Dados obrigatórios da auditoria incompletos." });
        }

        const idUsuarioLogado = req.user.id; 

        await db.salvarAuditoria(payload, idUsuarioLogado);
        res.status(200).json({ mensagem: "Operação registrada com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar auditoria (API):", error);
        res.status(500).json({ mensagem: "Erro interno do servidor ao processar a operação." });
    }
});





server.listen(porta, () => {
    console.log(`Servidor rodando com Chat na porta ${porta}`);
});

// Rota para exibir a página de login (diretamente)
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});


app.delete("/dell_session", authenticateJWT, requireOperario, async (req, res) => {
    try {
        req.session.dadosSacolaNota = [];
        req.session.dadosSacolaNota = null;
        req.session.save((err) => {
            if (err) {
                throw new Error("Erro ao salvar a sessão");
            }
            return res.status(200).json({
                dados_session: req.session.dadosSacolaNota,
                mensagem: "Sessão de venda limpa com sucesso!"
            });
        });
    }catch (error) {
        return  res.status(500).json({
            mensagem: "Erro interno ao limpar a sessão de venda."
        })
    }
})


// Rota de Logout
app.post("/logout", (req, res) => {
    const idUser = req.body.id;
    db.logoutoffline(idUser);
    res.cookie('jwt', '', { maxAge: 1 }); // Expira o cookie imediatamente (1 milissegundo)
    res.redirect('/login'); // Redireciona para a página de login
    
});
