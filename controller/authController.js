const db = require('../db/db.js');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

// // Função para HASHAR a senha antes de salvar
//const bcrypt = require('bcryptjs');
// const hashSenha = async (senhaEmTextoPuro) => {
//     const saltRounds = await bcrypt.genSalt(); 
//     const hash = await bcrypt.hash(senhaEmTextoPuro, saltRounds);
//     return hash;
// };

// class novasenha{
//     static async newsenha(){
//         const senha = 'teste1234';
//         const senhaHash = await hashSenha(senha);
//         console.log(senhaHash)
//     }
// }
// novasenha.newsenha();


const maxAge = 60 * 60 * 24; // Definido o tempo de ação do JWT em segundos (1 dia)


const createToken = (id_funcionario, tipo_funcionario) => { // Mudança aqui: recebe ID e tipo
    return jwt.sign(
        { 
            id: id_funcionario,          // Inclui o ID do funcionário no token
            tipo: tipo_funcionario       // Inclui o tipo (papel) do funcionário
            // Você pode adicionar mais dados que sejam úteis, mas cuidado para não deixar o token muito grande
            // Ex: email: email_funcionario,
        }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: maxAge // Tempo de expiração em segundos
        }
    );
};


// module.exports.dashboard_adm = (req, res) => {
//     res.sendFile(path.join(__dirname, "../public/dashboard-adm.html"));
// }

module.exports.login_get = (req, res) => {
    res.sendFile(path.join(__dirname, "../public/login.html"));

};

module.exports.login_post = async (req, res) => {
    try {
        const { email, senha } = req.body; 

        // Validação de campos vazios
        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                mensagem: "Email e senha são obrigatórios."
            });
        }

        // Busca o funcionário
        const funcionario = await db.buscarFuncionarioPorEmail(email);

        // 1. Verifica se o funcionário existe
        if (!funcionario) {
            return res.status(401).json({
                success: false,
                mensagem: "Credenciais inválidas! Email e/ou senha incorretos."
            });
        }


        if (funcionario.ativo === 0 || funcionario.ativo === false) {
            return res.status(403).json({
                success: false,
                mensagem: "Acesso negado. Seu cadastro foi desativado ou você foi desligado da empresa."
            });
        }
    

        // 3. Verifica a senha
        const senhaCorreta = await bcrypt.compare(senha, funcionario.senha_funcionario_funcionario); 
        
        if (senhaCorreta) {

            await db.registrarLogin(funcionario.id_funcionario_funcionario);
            
            let papelDoUsuario = funcionario.tipo_funcionario_funcionario === 2 
                ? 'administrador' 
                : 'operario';

            const token = createToken(
                funcionario.id_funcionario_funcionario, 
                funcionario.tipo_funcionario_funcionario
            );

            res.cookie('jwt', token, {
                httpOnly: true, 
                maxAge: maxAge * 1000
            });

            // Resposta de sucesso
            return res.status(200).json({
                success: true,
                message: "Login realizado com sucesso!",
                user: {
                    id: funcionario.id_funcionario_funcionario,
                    nome: funcionario.nome_funcionario_funcionario,
                    email: funcionario.email_funcionario_funcionario,
                    cargo: papelDoUsuario
                }
            });

        } else {
            // Senha incorreta
            return res.status(401).json({ 
                success: false, 
                message: "Credenciais inválidas! Email e/ou senha incorretos." 
            });
        }

    } catch (error) {
        console.error("Erro no processo de login: ", error); 
        return res.status(500).json({ 
            success: false, 
            message: "Erro interno do servidor." 
        });
    }
};


