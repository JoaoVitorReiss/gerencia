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


const verifica_tipo = async(dados) => {
    try {
        const conectar = await conecta_banco();
        const sql = "select senha_funcionario_funcionario, email_funcionario_funcionario, tipo_funcionario_funcionario, nome_funcionario_funcionario, id_funcionario_funcionario from funcionarios where senha_funcionario_funcionario = ? and email_funcionario_funcionario = ?";
        const [rows] = await conectar.query(sql, dados);
        return rows; // Retorna as linhas encontradas
        
    }catch (erro) {
        console.log("Erro ao verificar credenciais! ERRO: " + erro);

    }
}



// Esta função agora APENAS busca o funcionário pelo e-mail
const buscarFuncionarioPorEmail = async (email) => {
    try {
        const conectar = await conecta_banco();
        // Selecione TODAS as colunas necessárias, incluindo a senha hash e o tipo/papel
        const sql = "SELECT id_funcionario_funcionario, nome_funcionario_funcionario, email_funcionario_funcionario, senha_funcionario_funcionario, tipo_funcionario_funcionario FROM funcionarios WHERE email_funcionario_funcionario = ?";
        const [rows] = await conectar.query(sql, [email]);
        return rows[0]; // Retorna o primeiro (e único) funcionário encontrado, ou undefined
    } catch (erro) {
        console.error("Erro ao buscar funcionário por email! ERRO: ", erro);
        //throw erro; // Lança o erro para ser tratado na rota
    }
};

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
        const [linhas] = await conectar.query("SELECT id_produto_produto, descri_produto, preco_produto, qtd_produto FROM produtos WHERE qtd_produto > 0 LIMIT 100");
        console.log("--- DEBUG ESTOQUE ---");
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
        const sql = "SELECT id_produto_produto, descri_produto, preco_produto, qtd_produto FROM produtos WHERE (descri_produto = ? OR descri_produto = ?) AND qtd_produto > 0";
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
        
        const sql = "SELECT id_produto_produto, descri_produto, preco_produto, qtd_produto FROM produtos WHERE id_produto_produto IN (?) AND qtd_produto > 0";
        
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
        // Incluindo preco_produto e qtd_produto na query
        const sql = "SELECT id_produto_produto, descri_produto, preco_produto, qtd_produto FROM produtos todos_nomeProdutos WHERE qtd_produto > 0 LIMIT 100"; 
        const [rows] = await conectar.query(sql);
        return rows;
    } catch (error) {
        console.error("Erro ao buscar todos os produtos! ERRO: " + error);
    }
};



const info_user = async (id) => {
    try {
        const conectar = await conecta_banco();
        const sql = "SELECT nome_funcionario_funcionario FROM funcionarios WHERE id_funcionario_funcionario = ?";
        const [rows] = await conectar.query(sql, [id]);
        const funcionario = rows[0]; // Pegar o primeiro resultado
        return funcionario; 
    } catch (erro) {
        console.error("Erro ao buscar funcionário por ID! ERRO: ", erro);
        throw erro;
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
            WHERE qtd_produto < 25
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
            WHERE data_venda BETWEEN ? AND ?;`;

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
                p.qtd_produto AS Estoque_Atual,
                COALESCE(SUM(v.venda_quantidade_itens), 0) AS Qtd_vendidas
            FROM produtos p
                LEFT JOIN vendas v ON p.id_produto_produto = v.id_produto_venda
                WHERE p.qtd_produto < 25
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

module.exports = { 
    verifica_tipo, 
    buscarFuncionarioPorEmail, 
    buscarFuncionarioPorId,
    todosProdutos,
    todos_nomeProdutos,
    produto_pesquisadodb,
    info_user,
    produto_pesquisadoID,
    subtrair_estoque,
    dados_vendaADD,
    balancoVendas,
    resumoVolumeVendas24h,
    produtosEstoqueBaixo,
    balancoPorData,
    faturamentoGrafico,
    pagamentosGrafico,
    topProdutos,
    produtosEstoqueBaixoDetalhado
    //dados_vendedor
  };


