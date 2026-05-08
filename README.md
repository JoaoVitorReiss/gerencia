# 🚀 Sistema de Gerenciamento de Vendas e Estoque

Um sistema robusto de PDV (Ponto de Venda) e gerenciamento de estoque desenvolvido com Node.js, Express e MySQL. Possui chat em tempo real para comunicação interna e dashboards detalhados para administradores e vendedores.

## ✨ Funcionalidades

- **🛒 Ponto de Venda (PDV)**: Realização de vendas simples e vendas em sacola com baixa automática de estoque.
- **📦 Gestão de Estoque**: Controle de produtos, logs de movimentação (quem alterou o quê e quando) e alertas de estoque baixo.
- **💬 Chat Interno**: Comunicação em tempo real entre funcionários utilizando Socket.io.
- **📊 Dashboards**: 
  - **ADM**: Visão geral de faturamento, gráficos de vendas e gestão de funcionários.
  - **Vendedor**: Interface focada em agilidade para vendas e consulta de produtos.
- **🔐 Segurança**: Autenticação via JWT, gerenciamento de sessões e criptografia de senhas com Bcrypt.
- **📝 Relatórios**: Balanços financeiros detalhados por período e métodos de pagamento.

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js, Express
- **Banco de Dados**: MySQL (com transações seguras)
- **Real-time**: Socket.io
- **Autenticação**: JWT (JSON Web Token), Passport.js
- **Segurança**: Bcryptjs
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)

## ⚙️ Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado.
- [MySQL](https://www.mysql.com/) rodando localmente ou em servidor.

### Passo a Passo

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/seu-usuario/gerencia.git
   cd gerencia
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**
   - Renomeie o arquivo `.env.example` para `.env`.
   - Preencha com as suas credenciais do MySQL e chaves secretas.

4. **Configurar o Banco de Dados**
   - Execute os scripts de criação de tabelas no seu MySQL utilizando o arquivo `db/database.sql`.

5. **Iniciar o servidor**
   ```bash
   # Para produção
   npm start
   
   # Para desenvolvimento (requer nodemon)
   npm run dev
   ```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---
Desenvolvido por [Joao Vitor](https://github.com/JoaoVitorReiss)
