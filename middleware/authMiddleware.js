// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const db = require('../db/db.js');
const path = require('path')
// const fs = require('fs');


// Middleware de AUTENTICAÇÃO: Verifica a validade do JWT e anexa o usuário ao req
const authenticateJWT = (req, res, next) => { 
    const token = req.cookies.jwt;

    if (!token) { 
        console.log("Token JWT não encontrado. Redirecionando para login.");
        return res.redirect('/login'); // return para encerrar a execução
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            console.error("Erro de verificação do JWT:", err.message);
            // Se o token for inválido ou expirado, redireciona para login
            return res.redirect('/login');
        } else {
            // CRUCIAL: Anexa os dados decodificados do token ao objeto req.user
            // Assim, outros middlewares e rotas podem acessar req.user.id, req.user.tipo, etc.
            req.user = decodedToken; 
            console.log("JWT válido. Usuário decodificado:", req.user.id, "Tipo:", req.user.tipo);
            db.atualizarAtividade(req.user.id);
            next(); // Continua para o próximo middleware ou rota

        }
    });
};

// Middleware de AUTORIZAÇÃO: Verifica se o usuário tem o papel necessário
// Recebe o papel esperado (ex: 1 para operário/funcionario, 2 para admin)
const requireRole = (papelNecessario) => {
    return (req, res, next) => {
        // Este middleware assume que authenticateJWT já foi executado
        // e, portanto, req.user já está populado.
        
        if (!req.user || req.user.tipo !== papelNecessario) {
     
            console.log(`Acesso negado: Usuário com tipo ${req.user ? req.user.tipo : 'N/A'} tentou acessar rota de tipo ${papelNecessario}.`);

            // Se não tiver o papel necessário, envia 403 Forbidden
            return res.status(403).sendFile(path.join(__dirname, '../views', '403.html'));
        }
        
        console.log(`Autorizado: Usuário (ID: ${req.user.id}) é do tipo ${papelNecessario}.`);
        next(); // Usuário tem o papel necessário, prossegue
    };
};

// Funções de middleware específicas para cada papel, usando requireRole
const requireOperario = requireRole(1); // tipo 1 para Operário/Funcionario
const requireAdm = requireRole(2);     // tipo 2 para Administrador

module.exports = { 
    authenticateJWT,      // Middleware de autenticação JWT principal
    requireRole,          // O gerador de middleware para papéis
    requireOperario,      // Middleware para proteger rotas de operário/Funcionario
    requireAdm            // Middleware para proteger rotas de administrador
};