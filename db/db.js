const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs')



const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Máximo de conexões simultâneas
    queueLimit: 0
});

const conecta_banco = async () => {
    return pool; 
};


// const verifica_tipo = async(dados) => {
//     try {
//         const conectar = await conecta_banco();
//         const sql = "select senha_funcionario_funcionario, email_funcionario_funcionario, tipo_funcionario_funcionario, nome_funcionario_funcionario, id_funcionario_funcionario from funcionarios where senha_funcionario_funcionario = ? and email_funcionario_funcionario = ?";
//         const [rows] = await conectar.query(sql, dados);
//         return rows; 
        
//     }catch (erro) {
//         console.log("Erro ao verificar credenciais! ERRO: " + erro);

//     }
// }



// Esta função agora APENAS busca o funcionário pelo e-mail
const buscarFuncionarioPorEmail = async (email) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                id_funcionario_funcionario,
                nome_funcionario_funcionario,
                email_funcionario_funcionario,
                senha_funcionario_funcionario,
                tipo_funcionario_funcionario,
                ativo,                    -- ← ESSA COLUNA É IMPORTANTE
                data_demissao
            FROM funcionarios 
            WHERE email_funcionario_funcionario = ?;
        `;

        const [linhas] = await conectar.query(sql, [email]);
        return linhas[0];   // retorna o funcionário ou undefined
    } catch (erro) {
        console.error("Erro ao buscar funcionário por email:", erro);
        throw erro;
    }
};
// Função para atualizar o "pulso" de atividade do funcionário
const atualizarAtividade = async (id) => {
    try {
        const conectar = await conecta_banco();
        const sql = "UPDATE funcionarios SET ultima_atividade = NOW() WHERE id_funcionario_funcionario = ?";
        await conectar.query(sql, [id]);
    } catch (erro) {
        console.error("Erro ao atualizar atividade no DB:", erro);
        // Não lançamos o erro (throw) para não travar a navegação do usuário 
        // caso o log de atividade falhe por algum motivo momentâneo
    }
};
// Função para registrar o  ultimo login do funcionário
const registrarLogin = async (id) => {
    try {
        const conectar = await conecta_banco();
        // Atualizamos o login e também a atividade inicial
        const sql = "UPDATE funcionarios SET ultimo_login = NOW(), ultima_atividade = NOW(), status_online = 1 WHERE id_funcionario_funcionario = ?";
        await conectar.query(sql, [id]);
    } catch (erro) {
        console.error("Erro ao registrar data de login:", erro);
    }
};

// Função para deixar o funcionario ofline após o logout;
const logoutoffline = async (id) => {
    try {
        const conectar = await conecta_banco();
        const sql = "UPDATE funcionarios SET status_online = 0 WHERE id_funcionario_funcionario = ?";
        await conectar.query(sql, [id]);

    }catch (erro) {
        console.error("Erro ao deixar o funcionario offline: " + erro);
    }
}

// esta função busca o funcionário pelo ID
const buscarFuncionarioPorId = async (id) => {
    try {
        const conectar = await conecta_banco();
        const sql = "SELECT id_funcionario_funcionario, nome_funcionario_funcionario, email_funcionario_funcionario, senha_funcionario_funcionario, tipo_funcionario_funcionario FROM funcionarios WHERE id_funcionario_funcionario = ?";
        const [rows] = await conectar.query(sql, [id]);
        const funcionario = rows[0]; // Pegar o primeiro resultado
        console.log("Resultado de buscarFuncionarioPorId para ID:", id, "->", funcionario); // Logar o resultado
        return funcionario; 
    } catch (erro) {
        console.error("Erro ao buscar funcionário por ID! ERRO: ", erro);
        throw erro;
    }
};

// Esta função Retornar a lista de todos os Produtos
const todosProdutos = async () => {
    try {
        const conectar = await conecta_banco();
        const [linhas] = await conectar.query("SELECT id_produto_produto, descri_produto, preco_produto, qtd_produto FROM produtos WHERE qtd_produto > 0 and  ativo = 1");

        return linhas
    }
    catch (erro) {
        console.error("Erro ao buscar lista de produtos! ERRO: ", erro);
        throw erro;
    };
}

// Esta função retorna os dados do produto pesquisado
const produto_pesquisadodb = async (nomeProduto) => {
    try {
        const conectar = await conecta_banco();
        const sql = "SELECT id_produto_produto, descri_produto, preco_produto, qtd_produto FROM produtos WHERE (descri_produto = ? OR descri_produto = ?) AND qtd_produto > 0 AND ativo = 1";
        const [rows] = await conectar.query(sql, [nomeProduto]);
        return rows; // Retorna as linhas encontradas
    } catch (error) {
        console.log("Erro ao buscar produto no banco de dados! ERRO: " + error)
    };
};

// Esta função retorna os dados dos produtos pesquisados pelo ID
const produto_pesquisadoID = async (idProdutos) => {
    try {
        const conectar = await conecta_banco();
        
        const sql = "SELECT id_produto_produto, descri_produto, preco_produto, qtd_produto FROM produtos WHERE id_produto_produto IN (?) AND qtd_produto > 0 AND ativo = 1";
        
        const [rows] = await conectar.query(sql, [idProdutos]);
        
        return rows;
    } catch (error) {
        console.log("Erro ao buscar produto no banco de dados! ERRO: " + error);
        throw error;
    }
};




// Esta função Retornar a lista de todos os Produtos
const todos_nomeProdutos = async () => {
    try {
        const conectar = await conecta_banco();
        const sql = "SELECT id_produto_produto, descri_produto, preco_produto, qtd_produto FROM produtos WHERE qtd_produto > 0 AND ativo = 1"; 
        const [rows] = await conectar.query(sql);
        return rows;
    } catch (error) {
        console.error("Erro ao buscar todos os produtos! ERRO: " + error);
        throw error;
    }
};


const info_user = async (id) => {
    try {
        const conectar = await conecta_banco();
        const sql = "SELECT nome_funcionario_funcionario, foto_url FROM funcionarios WHERE id_funcionario_funcionario = ?";
        const [rows] = await conectar.query(sql, [id]);
        const funcionario = rows[0]; // Pegar o primeiro resultado
        return funcionario; 
    } catch (erro) {
        console.error("Erro ao buscar funcionário por ID! ERRO: ", erro);
        throw erro;
    }
};

// Esta função registra a venda e subtrai o estoque de forma transacional, garantindo que ambos os passos ocorram juntos ou nenhum ocorra em caso de erro
const registrarVendaTransacao = async (itensVenda) => {
    const pool = await conecta_banco();
    const conexao = await pool.getConnection();
    try {
        
        await conexao.beginTransaction();
        // Para cada item dentro do nosso carrinho (ou item único)
        for (const item of itensVenda) {
    
            //ubtrair o Estoque
            const sqlEstoque = "UPDATE produtos SET qtd_produto = qtd_produto - ? WHERE id_produto_produto = ?";
            await conexao.query(sqlEstoque, [item.quantidade_item, item.id_produto]);
            // inserir o registro da Venda daquele item
            const sqlVenda = `INSERT INTO vendas (id_produto_venda, id_vendedor_venda, data_venda, data_venda_dia, venda_metodo_paga, venda_valor, venda_troco, venda_data_hora, venda_valor_receb, venda_quantidade_itens, id_transacao, venda_preco_unitario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                
            await conexao.query(sqlVenda, [
                item.id_produto,
                item.id_vendedor,
                item.data,
                item.dia_semana,
                item.metodo,
                item.valor_total,
                item.troco,
                item.hora,
                item.valor_recebido,
                item.quantidade_item,
                item.id_transacao,
                item.preco_unitario
            ]);
        }
        // Se passar sem erro, confirmamos tudo de uma vez
        await conexao.commit();
        return { sucesso: true };
    } catch (erro) {
        // Se qualquer etapa do loop der erro, refazemos tudo que estava pendente nessa transação
        if (conexao) await conexao.rollback();
        console.error("Transação de venda abortada. Fazendo Rollback! Erro:", erro);
        throw erro;
    } finally {
        // Devolve a conexão principal para a piscina de conexões
        if (conexao) conexao.release();
    }
};

const  subtrair_estoque = async (quantidade_vendidos, id_produto) => {
    try {
        const conectar = await conecta_banco();
        const sql = "UPDATE produtos SET qtd_produto = qtd_produto - ? WHERE id_produto_produto = ?";
        const [resultado] = await conectar.query(sql, [quantidade_vendidos, id_produto]);
        return resultado;
    } catch (erro) {
        console.error("Erro ao subtrair estoque! ERRO: ", erro);
        throw erro;
    }
}

const dados_vendaADD = async (id_produto_venda, id_vendedor_venda, data_venda, data_venda_dia, venda_metodo_paga, venda_valor, venda_troco,  venda_data_hora, venda_valor_receb, venda_quantidade_itens, id_transacao, preco_unitario) => {
    try {
        const conecta =   await conecta_banco();
        const sql =  "INSERT INTO vendas (id_produto_venda, id_vendedor_venda, data_venda, data_venda_dia, venda_metodo_paga, venda_valor, venda_troco, venda_data_hora, venda_valor_receb, venda_quantidade_itens, id_transacao, venda_preco_unitario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const [rows] = await conecta.query(sql, [id_produto_venda, id_vendedor_venda, data_venda, data_venda_dia, venda_metodo_paga, venda_valor, venda_troco,  venda_data_hora, venda_valor_receb, venda_quantidade_itens, id_transacao,preco_unitario]);
        return rows;
    } catch (erro) {
        console.error("Erro ao buscas os dados da venda! ERRO: ", erro);
        throw erro;
    }
}



// FUNÇÕES PARA A DASHBOARD ADIMINISTRAÇÃO

// Esta função retorna o balanço financeiro agrupado por método de pagamento
const balancoVendas = async (dia = 1) => {
    try {
        const conectar = await conecta_banco();
        
        // A query utiliza TIMESTAMP para unir data e hora e o parâmetro de horas para o intervalo
        const sql = `
            SELECT 
                venda_metodo_paga AS metodo,
                SUM(venda_valor) AS subtotal,
                COUNT(DISTINCT id_transacao) AS total_vendas
            FROM vendas
            WHERE TIMESTAMP(data_venda, venda_data_hora) >= NOW() - INTERVAL ? DAY
            GROUP BY venda_metodo_paga
        `;

        const [linhas] = await conectar.query(sql, [dia]);
        return linhas;
    }
    catch (erro) {
        console.error("Erro ao gerar balanço de vendas! ERRO: ", erro);
        throw erro;
    }
}


// Esta função retorna um resumo do volume de vendas nas últimas 24h
const resumoVolumeVendas24h = async () => {
    try {
        const conectar = await conecta_banco();
        
        const sql = `
            SELECT 
                COUNT(DISTINCT id_transacao) AS qtd_vendas,
                COUNT(*) AS qtd_itens_total
            FROM vendas
            WHERE TIMESTAMP(data_venda, venda_data_hora) >= NOW() - INTERVAL 1 DAY
        `;

        const [linhas] = await conectar.query(sql);
        return linhas[0]; 
    }
    catch (erro) {
        console.error("Erro ao buscar resumo de volume de vendas! ERRO: ", erro);
        throw erro;
    };
}


// Esta função retorna os produtos que estão com estoque abaixo de 20 unidades
const produtosEstoqueBaixo = async () => {
    try {
        const conectar = await conecta_banco();
        
        const sql = `
            SELECT 
                qtd_produto AS qtd_produtos, 
                descri_produto AS nome_item 
            FROM produtos 
            WHERE qtd_produto < 25 AND ativo = 1
        `;

        const [linhas] = await conectar.query(sql);
        
        return linhas; 
    }
    catch (erro) {
        console.error("Erro ao buscar produtos com estoque baixo! ERRO: ", erro);
        throw erro;
    };
};



// Esta função retorna o balanço (vendas, itens e faturamento) a partir de uma data específica
const balancoPorData = async (dataInicio, dataFim) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                COUNT(DISTINCT id_transacao) AS qtd_vendas,
                SUM(venda_valor) AS faturamento_total,
                SUM(venda_quantidade_itens) AS total_itens_vendidos,
                IFNULL(SUM(venda_valor) / NULLIF(COUNT(DISTINCT id_transacao), 0), 0) AS ticket_medio
            FROM vendas
            WHERE data_venda BETWEEN ? AND ?`;

        const [linhas] = await conectar.query(sql, [dataInicio, dataFim]);
        return linhas[0]; 
    } catch (erro) {
        console.error("Erro ao buscar balanço no DB:", erro);
        throw erro;
    }
};


// Esta função retorna o balanço (vendas, itens e faturamento) a partir de uma data específica para alimentar os gráficos
const faturamentoGrafico = async (dataInicio, dataFim) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                DATE_FORMAT(data_venda, '%Y-%m-%d') AS data, 
                SUM(venda_valor) AS total 
                FROM vendas 
                WHERE data_venda BETWEEN ? AND ?
                GROUP BY DATE_FORMAT(data_venda, '%Y-%m-%d')
            ORDER BY data ASC;`;
        const [linhas] = await conectar.query(sql, [dataInicio, dataFim]);
        return linhas;
    } catch (erro) {
        console.error("Erro ao buscar dados do gráfico:", erro);
        throw erro;
    }
};

// Esta função retorna os meios de pagameneto mais comuns
const pagamentosGrafico = async (dataInicio, dataFim) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                venda_metodo_paga AS metodo, 
                COUNT(*) AS qtd,
                SUM(venda_valor) AS total
                    FROM vendas 
                    WHERE data_venda BETWEEN ? AND ?
                GROUP BY venda_metodo_paga;`

        const [linhas] = await conectar.query(sql, [dataInicio, dataFim]);
        return linhas; 
    } catch (erro) {
        console.error("Erro ao buscar meios de pagamento:", erro);
        throw erro;
    }
};


// Esta função retorna os itens mais vendidos em um perildo de tempo determinado

const topProdutos = async (dataInicio, dataFim) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                p.descri_produto AS produto, 
                SUM(v.venda_quantidade_itens) AS qtd, 
                SUM(v.venda_valor) AS faturamento
            FROM vendas v
            INNER JOIN produtos p ON v.id_produto_venda = p.id_produto_produto
            WHERE v.data_venda BETWEEN ? AND ?
            GROUP BY v.id_produto_venda
            ORDER BY faturamento DESC
            LIMIT 5;`;

        const [linhas] = await conectar.query(sql, [dataInicio, dataFim]);
        return linhas;
    } catch (erro) {
        console.error("Erro ao buscar top produtos:", erro);
        throw erro;
    }
};



// Esta função retorna os dados detalhados dos produtos com estoque abaixo de 25, 
// incluindo o total de unidades já vendidas de cada um.
const produtosEstoqueBaixoDetalhado = async () => {
    try {
        const conectar = await conecta_banco();
        
        const sql = `
            SELECT 
                p.id_produto_produto AS Id,
                p.descri_produto AS nome_do_Produto,
                p.preco_produto AS Preço,
                p.qtd_produto AS estoque_atual,
                COALESCE(SUM(v.venda_quantidade_itens), 0) AS Qtd_vendidas
            FROM produtos p
                LEFT JOIN vendas v ON p.id_produto_produto = v.id_produto_venda
                WHERE p.qtd_produto < 25 AND ativo = 1
                GROUP BY p.id_produto_produto, p.descri_produto, p.preco_produto, p.qtd_produto
                ORDER BY p.qtd_produto ASC;
        `;

        const [linhas] = await conectar.query(sql);
        return linhas;
    }
    catch (erro) {
        console.error("Erro ao buscar relatório de estoque crítico! ERRO: ", erro);
        throw erro;
    };
}





// Esta função retorna os dados dos produtos pesquisados pelo ID e retorna também a validade
const itemEstoque_pesquisadoID = async (idProdutos) => {
    try {
        const conectar = await conecta_banco();
        
        const sql = "SELECT id_produto_produto, descri_produto, preco_produto, qtd_produto, validade FROM produtos WHERE id_produto_produto IN (?) AND qtd_produto > 0 AND ativo = 1";
        
        const [rows] = await conectar.query(sql, [idProdutos]);
        
        return rows;
    } catch (error) {
        console.log("Erro ao buscar produto no banco de dados! ERRO: " + error);
        throw error;
    }
};


// esta função exclui um item da tabela com base no ID:
const dell_item = async (idItem, idUsuario) => {
    const pool = await conecta_banco();
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const [produto] = await conexao.query("SELECT descri_produto FROM produtos WHERE id_produto_produto = ?", [idItem]);
        
        await conexao.query(
            "INSERT INTO estoque_logs (id_produto_log, id_usuario_log, anterior, novo, motivo, data_hora) VALUES (?, ?, ?, ?, ?, NOW())",
            [idItem, idUsuario, produto[0].descri_produto, 'DESATIVADO', 'Soft Delete realizado',]
        );

        // 3. EM VEZ DE DELETAR, DESATIVA
        const sqlDesativar = "UPDATE produtos SET ativo = 0 WHERE id_produto_produto = ?;";
        await conexao.query(sqlDesativar, [idItem]);

        await conexao.commit();
        return { sucesso: true };

    } catch (error) {
        if (conexao) await conexao.rollback();
        throw error;
    } finally {
        if (conexao) conexao.release();
    }
};


// Essa função desativa os item, mas não os excluem e adiciona um log para audições futuras
const atualizarComLog = async (dados) => {
    const pool = await conecta_banco();
    
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        // 1. Atualizamos o produto
        const sqlUpdate = `
            UPDATE produtos 
            SET descri_produto = ?, 
                preco_produto = ?, 
                qtd_produto = ?, 
                validade = ? 
            WHERE id_produto_produto = ?`;
            
        await conexao.query(sqlUpdate, [
            dados.nome, 
            dados.preco, 
            dados.qtd_nova, 
            dados.validade, 
            dados.id_produto
        ]);

        // 2. Inserimos o log
        const logAnterior = `Qtd: ${dados.qtd_anterior}, Nome: ${dados.nome_anterio}, Preço: ${dados.preco_anterior}`;
        const logNovo = `Qtd: ${dados.qtd_nova}, Nome: ${dados.nome}, Preço: ${dados.preco}`;

        const sqlLog = `
            INSERT INTO estoque_logs (id_produto_log, id_usuario_log, anterior, novo, motivo, data_hora) 
            VALUES (?, ?, ?, ?, ?, NOW())`;

        await conexao.query(sqlLog, [
            dados.id_produto, 
            dados.id_usuario, 
            logAnterior, 
            logNovo, 
            dados.motivo
        ]);

        await conexao.commit();
        console.log("Transação concluída!");
        return { sucesso: true };

    } catch (erro) {
        if (conexao) await conexao.rollback();
        console.error("Erro na transação:", erro);
        throw erro;

    } finally {
    
        if (conexao) conexao.release();
    }
};


// essa função adiciona novo item, mas caso ele já exista ela atualizas as informções. Além de registrar os dados no estoque_logs
const adicionarOuReporComLog = async (payload) => {
    const pool = await conecta_banco();
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const [existente] = await conexao.query(
            "SELECT id_produto_produto, qtd_produto, preco_produto FROM produtos WHERE descri_produto = ?",
            [payload.nome_item.trim()]
        );

        let qtdAnterior = 0;
        let precoAnterior = 0;
        let acaoLog = "CADASTRO NOVO";

        if (existente.length > 0) {
            qtdAnterior = existente[0].qtd_produto;
            precoAnterior = existente[0].preco_produto;
            acaoLog = "REPOSIÇÃO/SOMA";
        }

        const sqlUpsert = `
            INSERT INTO produtos (descri_produto, preco_produto, qtd_produto, validade, ativo)
            VALUES (?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE 
                qtd_produto = qtd_produto + VALUES(qtd_produto),
                preco_produto = VALUES(preco_produto),
                validade = VALUES(validade),
                ativo = 1`; // Garante que se estava desativado, ele volta a ser ativo

        const [resUpsert] = await conexao.query(sqlUpsert, [
            payload.nome_item.trim(),
            payload.preco,
            payload.qtd_item,
            payload.validade
        ]);

        // Pegamos o ID do produto (ou o existente ou o recém-criado)
        const idFinal = existente.length > 0 ? existente[0].id_produto_produto : resUpsert.insertId;


        const anteriorStr = `Qtd: ${qtdAnterior}, Preço: ${precoAnterior}`;
        const novoStr = `Adicionado: ${payload.qtd_item}, Novo Preço: ${payload.preco}`;

        const sqlLog = `
            INSERT INTO estoque_logs (id_produto_log, id_usuario_log, anterior, novo, motivo, data_hora) 
            VALUES (?, ?, ?, ?, ?, NOW())`;

        await conexao.query(sqlLog, [
            idFinal,
            payload.id_user,
            anteriorStr,
            novoStr,
            `${acaoLog}: ${payload.motivo}`
        ]);

        await conexao.commit();
        return { sucesso: true, tipo: acaoLog };

    } catch (error) {
        if (conexao) await conexao.rollback();
        console.error("Erro ao adicionar/repor produto: ", error);
        throw error;
    } finally {
        if (conexao) conexao.release();
    }
};


// Essa função retorna para mim os 50 itens mais vendido geral, sem limites de data
const rankingVendasCompleto = async (dataFim) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                p.id_produto_produto AS id,
            
                p.descri_produto AS nome_produto,
                p.preco_produto AS preco_atual,
                p.qtd_produto AS estoque_atual,
                SUM(v.venda_quantidade_itens) AS total_vendido,
                p.ativo as ativo
            FROM vendas v
            INNER JOIN produtos p ON v.id_produto_venda = p.id_produto_produto
            WHERE v.data_venda BETWEEN (SELECT MIN(data_venda) FROM vendas) AND ?
            GROUP BY 
                p.id_produto_produto, 
                p.descri_produto, 
                p.preco_produto, 
                p.qtd_produto,
                p.ativo
            ORDER BY total_vendido DESC
            LIMIT 25
        `;

        const [linhas] = await conectar.query(sql, dataFim);
        return linhas;
    } catch (erro) {
        console.error("Erro ao buscar ranking de vendas! ERRO: ", erro);
        throw erro; 
    }
};

// Função unificada de listagem de produtos com suporte a ordenação e filtro de datas
// Modos de ordenação:
//   'mais_vendidos'     -> SUM(vendas) DESC (padrão)
//   'menos_vendidos'    -> SUM(vendas) ASC
//   'maior_estoque'     -> qtd_produto DESC
//   'vencimento_prox'   -> validade ASC (produtos com validade, null por último)
const rankingVendasCompletoDatas = async (dataInicio, dataFim, ordenacao = 'mais_vendidos') => {
    try {
        const conectar = await conecta_banco();

        // Mapeamento seguro: nunca interpolamos string vinda do usuário diretamente
        const ordenacaoMap = {
            mais_vendidos:  'total_vendido DESC',
            menos_vendidos: 'total_vendido ASC',
            maior_estoque:  'p.qtd_produto DESC',
            vencimento_prox: 'p.validade IS NULL ASC, p.validade ASC'
        };
        const orderByClause = ordenacaoMap[ordenacao] || ordenacaoMap['mais_vendidos'];

        let sql;
        let params;

        if (dataInicio === 0 || dataInicio === '0') {
            // Modo GERAL: sem filtro de data, inclui todos os produtos mesmo sem vendas
            sql = `
                SELECT 
                    p.id_produto_produto AS id,
                    p.descri_produto AS nome_produto,
                    p.preco_produto AS preco_atual,
                    p.qtd_produto AS estoque_atual,
                    p.validade AS validade,
                    COALESCE(SUM(v.venda_quantidade_itens), 0) AS total_vendido,
                    p.ativo
                FROM produtos p
                LEFT JOIN vendas v ON v.id_produto_venda = p.id_produto_produto
                GROUP BY p.id_produto_produto, p.descri_produto, p.preco_produto, p.qtd_produto, p.ativo, p.validade
                ORDER BY ${orderByClause}
                LIMIT 50
            `;
            params = [];
        } else {
            // Modo DATAS: filtra vendas pelo período passado
            sql = `
                SELECT 
                    p.id_produto_produto AS id,
                    p.descri_produto AS nome_produto,
                    p.preco_produto AS preco_atual,
                    p.qtd_produto AS estoque_atual,
                    p.validade AS validade,
                    COALESCE(SUM(v.venda_quantidade_itens), 0) AS total_vendido,
                    p.ativo
                FROM produtos p
                LEFT JOIN vendas v ON v.id_produto_venda = p.id_produto_produto
                    AND v.data_venda BETWEEN ? AND ?
                GROUP BY p.id_produto_produto, p.descri_produto, p.preco_produto, p.qtd_produto, p.ativo, p.validade
                ORDER BY ${orderByClause}
                LIMIT 50
            `;
            params = [dataInicio, dataFim];
        }

        const [linhas] = await conectar.query(sql, params);
        return linhas;
    } catch (erro) {
        console.error('Erro ao buscar listagem de produtos:', erro);
        throw erro;
    }
};





// Esta função retorna os dados dos produtos pesquisados pelo ID e retorna também a validade e inclui os itens desativados na resposta
const item_lista = async (idProdutos) => {
    try {
        const conectar = await conecta_banco();
        
        const sql = "SELECT id_produto_produto, descri_produto, preco_produto, qtd_produto, validade FROM produtos WHERE id_produto_produto IN (?)";
        
        const [rows] = await conectar.query(sql, [idProdutos]);
        
        return rows;
    } catch (error) {
        console.log("Erro ao buscar produto no banco de dados! ERRO: " + error);
        throw error;
    }
};

// Pesquisa global de produtos por nome (ignora filtros de data, busca em TODOS os produtos)
const pesquisarProdutos = async (termo) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                p.id_produto_produto AS id,
                p.descri_produto AS nome_produto,
                p.preco_produto AS preco_atual,
                p.qtd_produto AS estoque_atual,
                p.validade,
                COALESCE(SUM(v.venda_quantidade_itens), 0) AS total_vendido,
                p.ativo
            FROM produtos p
            LEFT JOIN vendas v ON v.id_produto_venda = p.id_produto_produto
            WHERE p.descri_produto LIKE ?
            GROUP BY p.id_produto_produto, p.descri_produto, p.preco_produto, p.qtd_produto, p.ativo, p.validade
            ORDER BY p.descri_produto ASC
            LIMIT 50
        `;
        const [linhas] = await conectar.query(sql, [`%${termo}%`]);
        return linhas;
    } catch (erro) {
        console.error('Erro ao pesquisar produtos:', erro);
        throw erro;
    }
};

// Essa função retorna para mim o histórico de edições dos produtos
const buscarHistoricoEdicoes = async (dataInicio, dataFim) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                l.id_log,
                p.id_produto_produto AS id_produto,
                p.descri_produto AS produto,
                p.ativo AS ativo_atual,
                f.nome_funcionario_funcionario AS usuario,
                l.anterior,
                l.novo,
                l.motivo,
                DATE_FORMAT(l.data_hora, '%d/%m/%Y %H:%i') AS data_formatada,
                l.data_hora
            FROM estoque_logs l
            JOIN produtos p ON l.id_produto_log = p.id_produto_produto
            JOIN funcionarios f ON l.id_usuario_log = f.id_funcionario_funcionario
            WHERE l.data_hora >= ? AND l.data_hora <= CONCAT(?, ' 23:59:59')
            ORDER BY l.data_hora DESC;
        `;

        const [linhas] = await conectar.query(sql, [dataInicio, dataFim]);
        return linhas;
    } catch (erro) {
        console.error("Erro ao buscar logs de auditoria:", erro);
        throw erro;
    }
};

// Esta função retorna os itens apagados definitivamente (apenas lendo a flag no log sem dar JOIN no produto que já não existe mais)
const buscarHistoricoDeletados = async (dataInicio, dataFim) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                l.id_log,
                l.anterior AS produto, -- Como o produto sumiu, usamos a string do registro 
                f.nome_funcionario_funcionario AS usuario,
                l.motivo,
                DATE_FORMAT(l.data_hora, '%d/%m/%Y %H:%i') AS data_formatada,
                l.data_hora
            FROM estoque_logs l
            JOIN funcionarios f ON l.id_usuario_log = f.id_funcionario_funcionario
            WHERE l.novo = 'DELETADO FÍSICO' 
            AND l.data_hora >= ? AND l.data_hora <= CONCAT(?, ' 23:59:59')
            ORDER BY l.data_hora DESC;
        `;
        const [linhas] = await conectar.query(sql, [dataInicio, dataFim]);
        return linhas;
    } catch (erro) {
        console.error("Erro ao buscar logs de exclusão física:", erro);
        throw erro;
    }
};

// Essa função realiza a exclusão definitiva e garante o log de auditoria
const exclusaoDefinitiva = async (idItem, idUsuario) => {
    let conexao;
    try {
        const pool = await conecta_banco();
        conexao = await pool.getConnection();

        await conexao.beginTransaction();

        // 1. Buscamos as informações antes de apagar (para o log)
        // Note que usamos [rows] para desestruturar o resultado do mysql2
        const [rows] = await conexao.query(
            "SELECT descri_produto FROM produtos WHERE id_produto_produto = ?", 
            [idItem]
        );

        if (rows.length === 0) {
            throw new Error("Produto não encontrado para exclusão.");
        }

        const nomeProduto = rows[0].descri_produto;

        // 2. ATENÇÃO: Para deletar um produto, PRECISARMOS apagar as referências dele nas tabelas com Foreign Key
        // Apagamos todo o histórico de logs atrelado a ele primeiro:
        await conexao.query("DELETE FROM estoque_logs WHERE id_produto_log = ?", [idItem]);

        // 3. O golpe final: Deletar o produto fisicamente
        const [resultado] = await conexao.query(
            "DELETE FROM produtos WHERE id_produto_produto = ?", 
            [idItem]
        );

        // 4. (Opcional) Log de exclusão - como o id_produto não existe mais, não podemos linkar o log.
        // Se a sua tabela aceitar NULL em id_produto_log, podemos registrar:
        try {
            await conexao.query(
                `INSERT INTO estoque_logs 
                (id_produto_log, id_usuario_log, anterior, novo, motivo, data_hora) 
                VALUES (NULL, ?, ?, ?, ?, NOW())`,
                [idUsuario, nomeProduto, 'DELETADO FÍSICO', 'Exclusão permanente']
            );
        } catch (e) {
            console.log("Aviso: Tabela estoque_logs não aceita id_produto_log NULL, log físico descartado.");
        }

        await conexao.commit();
        return resultado;

    } catch (error) {
        if (conexao) await conexao.rollback();
        console.error("Erro crítico na exclusão definitiva:", error.message);
        throw error;
    } finally {
        if (conexao) conexao.release();
    }
};

const restaurar_item = async (idItem, idUsuario) => {
    const pool = await conecta_banco();
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const [produto] = await conexao.query("SELECT descri_produto FROM produtos WHERE id_produto_produto = ?", [idItem]);
        
        await conexao.query(
            "INSERT INTO estoque_logs (id_produto_log, id_usuario_log, anterior, novo, motivo, data_hora) VALUES (?, ?, ?, ?, ?, NOW())",
            [idItem, idUsuario, produto[0].descri_produto, 'ATIVO', 'Restaurado do status excluido']
        );

        const sqlRestaurar = "UPDATE produtos SET ativo = 1 WHERE id_produto_produto = ?;";
        await conexao.query(sqlRestaurar, [idItem]);

        await conexao.commit();
        return { sucesso: true };

    } catch (error) {
        if (conexao) await conexao.rollback();
        throw error;
    } finally {
        if (conexao) conexao.release();
    }
};



// Essa função é para adcionar novos usuarios no nosso base dados
const cadastrarFuncionario = async (dados) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            INSERT INTO funcionarios (
                nome_funcionario_funcionario, 
                email_funcionario_funcionario, 
                senha_funcionario_funcionario, 
                tipo_funcionario_funcionario, 
                cpf_funcionario, 
                salario_funcionario, 
                telefone_funcionario,
                data_admissao, 
                foto_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [resultado] = await conectar.query(sql, [
            dados.nome,
            dados.email,
            dados.senha, // Aqui entra o Hash do bcrypt
            dados.tipo,
            dados.cpf,
            dados.salario,
            dados.telefone,
            dados.data_admissao,
            dados.foto_url
        ]);

        return resultado;
    } catch (erro) {
        console.error("Erro na Query de Cadastro:", erro);
        throw erro; // Lançamos para a rota tratar o erro (como o ER_DUP_ENTRY)
    }
};


// Essa função busca os dados do usuário logado, dados como: Nome, E=mail, CPF...etc
const buscarFuncionarioLogado = async (id) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                nome_funcionario_funcionario AS nome_funcionario,
                email_funcionario_funcionario AS email_funcionario,
                cpf_funcionario AS cpf_funcionario,
                telefone_funcionario AS telefone_funcionario,
                salario_funcionario AS salario_funcionario,
                DATE_FORMAT(data_admissao, '%Y-%m-%d') AS data_admissao,
                foto_url
            FROM funcionarios
            WHERE id_funcionario_funcionario = ?;
        `;

        const [linhas] = await conectar.query(sql, [id]);

        // Retorna o primeiro funcionário encontrado ou null se não existir
        return linhas.length > 0 ? linhas[0] : null;

    } catch (erro) {
        console.error("Erro ao buscar detalhes do funcionário:", erro);
        throw erro;
    }
};


// Essa função retorna a lista de todos os funcionários cadastrados, caso eles estejam ativos.
const lista_funcioarios = async() => {
    try  {
        const conectar = await conecta_banco();
        const sql = "SELECT id_funcionario_funcionario, nome_funcionario_funcionario, email_funcionario_funcionario, tipo_funcionario_funcionario, cpf_funcionario, salario_funcionario, data_admissao, data_demissao, telefone_funcionario, foto_url, ultimo_login, ultima_atividade, status_online FROM funcionarios where ativo = 1";
        const [linhas] = await conectar.query(sql);
        return linhas;

    }catch (error) {
        console.error("Erro ao buscar a lista de funcionários: " + error);
        throw error
    }
}


// Essa função pega o Hitórico/dados detalhado do funcionáario
const historicoFuncionario = async (idFuncionario) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                f.id_funcionario_funcionario AS id_funcionario,
                f.nome_funcionario_funcionario AS nome,
                f.email_funcionario_funcionario AS email,
                f.telefone_funcionario AS telefone,
                f.cpf_funcionario AS cpf,
                f.salario_funcionario AS salario,
                f.data_admissao,
                f.data_demissao,
                f.ultimo_login,
                f.ultima_atividade,
                f.status_online,
                f.foto_url,
                
                t.descricao_tiposervico AS tipo_funcionario,

                -- Estatísticas de vendas
                COALESCE(SUM(v.venda_quantidade_itens), 0) AS quantidade_itens_vendidos,
                COUNT(DISTINCT v.id_transacao) AS total_vendas_realizadas,
                COALESCE(SUM(v.venda_valor), 0) AS valor_total_vendido,
                MAX(v.data_venda) AS data_ultima_venda,
                MAX(v.venda_data_hora) AS hora_ultima_venda,

                ROUND(
                    COALESCE(SUM(v.venda_valor) / NULLIF(COUNT(DISTINCT v.id_transacao), 0), 0), 
                    2
                ) AS ticket_medio

            FROM funcionarios f
            LEFT JOIN tiposervico t 
                ON t.tipo_tiposervico = f.tipo_funcionario_funcionario
            LEFT JOIN vendas v 
                ON v.id_vendedor_venda = f.id_funcionario_funcionario

            WHERE f.id_funcionario_funcionario = ?
            
            GROUP BY 
                f.id_funcionario_funcionario,
                f.nome_funcionario_funcionario,
                f.email_funcionario_funcionario,
                f.telefone_funcionario,
                f.cpf_funcionario,
                f.salario_funcionario,
                f.data_admissao,
                f.data_demissao,
                f.ultimo_login,
                f.ultima_atividade,
                f.status_online,
                f.foto_url,
                t.descricao_tiposervico;
        `;

        const [linhas] = await conectar.query(sql, [idFuncionario]);
        return linhas[0];   // Retorna apenas 1 objeto (um funcionário)
        
    } catch (erro) {
        console.error("Erro ao buscar histórico do funcionário! ERRO: ", erro);
        throw erro; 
    }
};


// Função para eddição de dados do funcionário

const getFuncionarioParaEditar = async (idFuncionario) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                f.id_funcionario_funcionario AS id_funcionario,
                f.nome_funcionario_funcionario AS nome,
                f.email_funcionario_funcionario AS email,
                f.telefone_funcionario AS telefone,
                f.cpf_funcionario AS cpf,
                f.salario_funcionario AS salario,
                f.tipo_funcionario_funcionario AS id_cargo,         
                t.descricao_tiposervico AS cargo_atual,
                f.data_admissao,
                f.foto_url
            FROM funcionarios f
            LEFT JOIN tiposervico t 
                ON t.tipo_tiposervico = f.tipo_funcionario_funcionario
            WHERE f.id_funcionario_funcionario = ?;
        `;

        const [linhas] = await conectar.query(sql, [idFuncionario]);
        return linhas[0];
    } catch (erro) {
        console.error("Erro ao buscar funcionário para edição! ERRO: ", erro);
        throw erro;
    }
};


//Rota para atualizar os dados do funcionário
const atualizarFuncionario = async (idFuncionario, dados, idUsuarioResponsavel, motivo = "Atualização de dados") => {
    try {
        const conectar = await conecta_banco();

        const [dadosAntigosArray] = await conectar.query(
            `SELECT nome_funcionario_funcionario, email_funcionario_funcionario, telefone_funcionario,
                    cpf_funcionario, salario_funcionario, tipo_funcionario_funcionario, foto_url
             FROM funcionarios WHERE id_funcionario_funcionario = ?`,
            [idFuncionario]
        );

        if (dadosAntigosArray.length === 0) return false;

        const anterior = dadosAntigosArray[0];

        const sqlUpdate = `
            UPDATE funcionarios 
            SET 
                nome_funcionario_funcionario = ?,
                email_funcionario_funcionario = ?,
                telefone_funcionario = ?,
                cpf_funcionario = ?,
                salario_funcionario = ?,
                tipo_funcionario_funcionario = ?,
                foto_url = ?,
                senha_funcionario_funcionario = COALESCE(?, senha_funcionario_funcionario)
            WHERE id_funcionario_funcionario = ?;
        `;

        const valores = [
            dados.nome,
            dados.email,
            dados.telefone,
            dados.cpf,
            dados.salario,
            dados.tipo,
            dados.foto_url,
            dados.senha || null,
            idFuncionario
        ];

        const [resultado] = await conectar.query(sqlUpdate, valores);

        if (resultado.affectedRows > 0) {
            await registrarLogFuncionario(idFuncionario, idUsuarioResponsavel, anterior, dados, motivo);
            return true;
        }
        return false;
    } catch (erro) {
        console.error("Erro ao atualizar funcionário:", erro);
        throw erro;
    }
};


const registrarLogFuncionario = async (idFuncionario, idUsuarioResponsavel, anterior, novo, motivo) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            INSERT INTO funcionario_logs 
                (id_funcionario_log, id_usuario_log, anterior, novo, motivo)
            VALUES (?, ?, ?, ?, ?);
        `;

        const valores = [
            idFuncionario,
            idUsuarioResponsavel,
            JSON.stringify(anterior),  
            JSON.stringify(novo),
            motivo
        ];

        await conectar.query(sql, valores);
    } catch (erro) {
        console.error("Erro ao registrar log de funcionário:", erro);
    }
};

//Essa irá desativar/demitir um funcionário, mas sem excluir os dados dele do banco, apenas dando um UPDATE na data_demissão e no status_online
const desligarFuncionario = async (idFuncionario, motivo, idUsuarioResponsavel) => {
    try {
        const conectar = await conecta_banco();

        // Atualiza o funcionário (desliga)
        const sqlUpdate = `
            UPDATE funcionarios 
            SET 
                ativo = 0,
                data_demissao = CURRENT_DATE(),
                status_online = 0,
                ultimo_login = NULL
            WHERE id_funcionario_funcionario = ? 
              AND ativo = 1;   -- evita desligar duas vezes
        `;

        const [resultado] = await conectar.query(sqlUpdate, [idFuncionario]);

        if (resultado.affectedRows > 0) {
            // Registra o log de demissão (simplificado)
            const sqlLog = `
                INSERT INTO funcionario_logs 
                    (id_funcionario_log, id_usuario_log, anterior, novo, motivo)
                VALUES (?, ?, ?, ?, ?);
            `;

            await conectar.query(sqlLog, [
                idFuncionario,
                idUsuarioResponsavel,
                "Funcionário estava ativo",           // anterior
                "Funcionário desligado (ativo = 0)",  // novo
                `Desligamento: ${motivo}`             // motivo
            ]);

            return true;
        }
        return false; // funcionário não encontrado ou já estava desligado
    } catch (erro) {
        console.error("Erro ao desligar funcionário:", erro);
        throw erro;
    }
};


//Essa funcão restanar a lista de todos funcionários que foram desativados, ou seja demitidos;
const lista_funcionarios_demitidos = async() => {
    try{
        const conectar = await conecta_banco();
                const sql = `
            SELECT 
                f.id_funcionario_funcionario, 
                f.nome_funcionario_funcionario, 
                f.email_funcionario_funcionario, 
                f.tipo_funcionario_funcionario, 
                f.cpf_funcionario, 
                f.salario_funcionario, 
                f.data_admissao, 
                f.data_demissao, 
                f.telefone_funcionario, 
                f.foto_url,
                l.motivo AS motivo_desligamento,
                resp.nome_funcionario_funcionario AS usuario_responsavel
            FROM funcionarios f
            -- Fazemos o JOIN nos logs onde a ação foi especificamente a de desligamento
            LEFT JOIN funcionario_logs l 
                ON f.id_funcionario_funcionario = l.id_funcionario_log 
               AND l.novo = 'Funcionário desligado (ativo = 0)'
            -- Fazemos outro JOIN para descobrir _quem_ foi o responsável pelo desligamento
            LEFT JOIN funcionarios resp 
                ON l.id_usuario_log = resp.id_funcionario_funcionario
            WHERE f.ativo = 0
            ORDER BY f.data_demissao DESC
        `;
        
        const [linhas] = await conectar.query(sql);
        return linhas;
    } catch (error) {
        console.error("Erro ao buscar a lista de funcionários demitidos: " + error);
        throw error;
    }
}

// ─── Mensagens

// Salva uma mensagem na tabela mensagens
const salvarMensagem = async (id_remetente, id_destinatario, mensagem_texto) => {
    try {
        const conectar = await conecta_banco();
        const sql = `INSERT INTO mensagens (id_remetente, id_destinatario, mensagem_texto, data_envio, lida)
                     VALUES (?, ?, ?, NOW(), 0)`;
        const [resultado] = await conectar.query(sql, [id_remetente, id_destinatario, mensagem_texto]);
        return resultado;
    } catch (erro) {
        console.error('Erro ao salvar mensagem:', erro);
        throw erro;
    }
};

// Busca todas as mensagens trocadas entre dois usuários
const buscarConversa = async (id_usuario_a, id_usuario_b) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT 
                id_mensagem,
                id_remetente,
                id_destinatario,
                mensagem_texto,
                DATE_FORMAT(data_envio, '%H:%i') AS hora,
                data_envio,
                lida
            FROM mensagens
            WHERE (id_remetente = ? AND id_destinatario = ?)
               OR (id_remetente = ? AND id_destinatario = ?)
            ORDER BY data_envio ASC
            LIMIT 100
        `;
        const [linhas] = await conectar.query(sql, [id_usuario_a, id_usuario_b, id_usuario_b, id_usuario_a]);
        return linhas;
    } catch (erro) {
        console.error('Erro ao buscar conversa:', erro);
        throw erro;
    }
};

// Busca todos os funcionários ativos para listar como contatos, com a última mensagem trocada com o usuário atual
const buscarContatosAtivos = async (id_usuario_atual) => {
    try {
        const conectar = await conecta_banco();
        const sql = `
            SELECT
                f.id_funcionario_funcionario AS id,
                f.nome_funcionario_funcionario AS nome,
                f.foto_url,
                f.status_online,
                f.ultima_atividade,
                (
                    SELECT m.mensagem_texto
                    FROM mensagens m
                    WHERE (m.id_remetente = f.id_funcionario_funcionario AND m.id_destinatario = ?)
                       OR (m.id_remetente = ? AND m.id_destinatario = f.id_funcionario_funcionario)
                    ORDER BY m.data_envio DESC
                    LIMIT 1
                ) AS ultima_mensagem,
                (
                    SELECT m.data_envio
                    FROM mensagens m
                    WHERE (m.id_remetente = f.id_funcionario_funcionario AND m.id_destinatario = ?)
                       OR (m.id_remetente = ? AND m.id_destinatario = f.id_funcionario_funcionario)
                    ORDER BY m.data_envio DESC
                    LIMIT 1
                ) AS data_ultima_msg,
                (
                    SELECT COUNT(*)
                    FROM mensagens m
                    WHERE m.id_remetente = f.id_funcionario_funcionario
                      AND m.id_destinatario = ?
                      AND m.lida = 0
                ) AS nao_lidas
            FROM funcionarios f
            WHERE f.id_funcionario_funcionario != ? AND f.ativo = 1
            ORDER BY data_ultima_msg DESC, f.nome_funcionario_funcionario ASC
        `;
        const [linhas] = await conectar.query(sql, [
            id_usuario_atual, id_usuario_atual,
            id_usuario_atual, id_usuario_atual,
            id_usuario_atual,
            id_usuario_atual
        ]);
        return linhas;
    } catch (erro) {
        console.error('Erro ao buscar contatos:', erro);
        throw erro;
    }
};

// Marca como lidas todas as mensagens recebidas de um remetente específico
const marcarComoLida = async (id_remetente, id_destinatario) => {
    try {
        const conectar = await conecta_banco();
        const sql = `UPDATE mensagens SET lida = 1
                     WHERE id_remetente = ? AND id_destinatario = ? AND lida = 0`;
        await conectar.query(sql, [id_remetente, id_destinatario]);
    } catch (erro) {
        console.error('Erro ao marcar mensagens como lidas:', erro);
        throw erro;
    }
};

module.exports = {
    buscarFuncionarioPorEmail,
    buscarFuncionarioPorId,
    todosProdutos,
    produto_pesquisadodb,
    produto_pesquisadoID,
    todos_nomeProdutos,
    info_user,
    subtrair_estoque,
    dados_vendaADD,
    balancoVendas,
    resumoVolumeVendas24h,
    produtosEstoqueBaixo,
    balancoPorData,
    faturamentoGrafico,
    pagamentosGrafico,
    topProdutos,
    produtosEstoqueBaixoDetalhado,
    itemEstoque_pesquisadoID,
    dell_item,
    atualizarComLog,
    adicionarOuReporComLog,
    rankingVendasCompleto,
    rankingVendasCompletoDatas,
    item_lista,
    buscarHistoricoEdicoes,
    buscarHistoricoDeletados,
    exclusaoDefinitiva,
    restaurar_item,
    pesquisarProdutos,
    cadastrarFuncionario,
    buscarFuncionarioLogado,
    atualizarAtividade,
    registrarLogin,
    lista_funcioarios,
    logoutoffline,
    registrarVendaTransacao,
    historicoFuncionario,
    getFuncionarioParaEditar,
    atualizarFuncionario,
    desligarFuncionario,
    lista_funcionarios_demitidos,
    salvarMensagem,
    buscarConversa,
    buscarContatosAtivos,
    marcarComoLida
};
