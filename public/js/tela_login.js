// No início do seu tela_login.js, fora do event listener
const feedbackMensagem = document.getElementById('mensagem-feedback');

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
    }, 10); // Pequeno delay para ativar a transição
    
    // Esconde após 3 segundos com fade-out
    setTimeout(() => {
        feedbackMensagem.classList.remove('visible');
        setTimeout(() => {
            feedbackMensagem.style.display = 'none';
        }, 500); // Tempo para completar a transição
    }, 3000);
}


class login {
    static tela_log() {
        const estilocss = `
            .fundoLogin {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100vh;
                position: fixed;
                top: 0;
                left: 0;
                background: linear-gradient(135deg, #b4ceff7c 0%, #b7d1ff41 100%);

                backdrop-filter: blur(5px);
                box-sizing: border-box;
            }

            .baseLogin {
                display: flex;
                justify-content: center;
                align-items: stretch;
                width: 600px;
                max-width: 90%;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                border-radius: 15px;
                overflow: hidden;
                box-sizing: inherit;
            }

            .elementosLogin {
                display: flex;
                justify-content: center;
                align-items: flex-start;
                flex-direction: column;
                width: 50%;
                background: #ffffff;
                padding: 30px;
                border-radius: 15px 0 0 15px;
                box-sizing: inherit;
            }

            .logoLogin {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 50%;
                background: linear-gradient(45deg,  #2a5298, #1e3c72);
                padding: 20px;
                border-radius: 0 15px 15px 0;
                box-sizing: inherit;
            }

            .logoLogin img {
                width: 70%;
                max-width: 200px;
                transition: transform 0.3s ease;
            }

            .logoLogin img:hover {
                transform: scale(1.1);
            }

            .campoLogin {
                display: flex;
                justify-content: flex-start;
                align-items: flex-start;
                flex-direction: column;
                margin-bottom: 20px;
                width: 100%;
                box-sizing: inherit;
            }

            .campoLogin label {
                font-size: 16px;
                font-weight: 600;
                color: #333;
                margin-bottom: 8px;
            }

            .campoLogin input {
                font-size: 16px;
                padding: 12px;
                width: 100%;
                background-color: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 8px;
                transition: border-color 0.3s ease, box-shadow 0.3s ease;
            }

            .campoLogin input:focus {
                outline: none;
                border-color: #2a5298;
                box-shadow: 0 0 8px rgba(42, 82, 152, 0.3);
            }

            .botoesLogin {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                margin-top: 20px;
            }

            .botoesLogin button {
                cursor: pointer;
                background: linear-gradient(90deg, #2a5298, #1e3c72);
                color: #fff;
                border: none;
                border-radius: 8px;
                margin-right: 10px;
                padding: 12px;
                width: 120px;
                font-size: 16px;
                font-weight: 500;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                box-sizing: inherit;
            }

            .botoesLogin button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            #btn_logG {
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            background: #ffffff;
            color: #333;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            width: 100%;
            max-width: 250px;
            font-size: 16px;
            font-weight: 500;
            margin: 20px auto 0;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-sizing: inherit;
        }

            #btn_logG:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                background: #f8f9fa;
            }

            `;
        const estyleEstilo = document.createElement("style");
        estyleEstilo.setAttribute("id", "id_estilologin")
        estyleEstilo.setAttribute("rel", "stylesheet");
        estyleEstilo.setAttribute("type", "text/css");
        estyleEstilo.innerHTML = estilocss;

        document.head.appendChild(estyleEstilo)

        const fundoLogin = document.createElement("div");
        fundoLogin.setAttribute("id", "fundoLogin");
        fundoLogin.setAttribute("class", "fundoLogin");
        document.body.appendChild(fundoLogin); // Mudei de prepend() para appendChild()
        // document.body.prepend(fundoLogin);


        const baseLogin = document.createElement("div");
        baseLogin.setAttribute("id", "baseLogin");
        baseLogin.setAttribute("class", "baseLogin");
        fundoLogin.appendChild(baseLogin);

        const elementosLogin = document.createElement("div");
        elementosLogin.setAttribute("id", "elementosLogin");
        elementosLogin.setAttribute("class", "elementosLogin");
        baseLogin.appendChild(elementosLogin);

        const campoLogin = document.createElement("div");
        campoLogin.setAttribute("class", "campoLogin");
        campoLogin.setAttribute("id", "campoLogin");
        elementosLogin.appendChild(campoLogin);

        const labelUsername = document.createElement("label");
        labelUsername.setAttribute("for", "f_username");
        labelUsername.innerText = "Email";
        campoLogin.appendChild(labelUsername);

        const inputUsername = document.createElement("input");
        inputUsername.setAttribute("type", "email");
        inputUsername.setAttribute("name", "f_username");
        inputUsername.setAttribute("id", "f_username");
        inputUsername.setAttribute("required", "required");
        inputUsername.setAttribute("placeholder", "Digite seu e-mail");
        inputUsername.setAttribute("title", "Digite um e-mail válido (ex.: exemplo@dominio.com)");
        // inputUsername.setAttribute("pattern", "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$");
        campoLogin.appendChild(inputUsername);

        const SenhacampoLogin = document.createElement("div");
        SenhacampoLogin.setAttribute("class", "campoLogin");
        SenhacampoLogin.setAttribute("id", "campoLogin");
        elementosLogin.appendChild(SenhacampoLogin);

        const labelsenha = document.createElement("label");
        labelsenha.setAttribute("for", "f_senha")
        labelsenha.innerText = "Senha";
        SenhacampoLogin.appendChild(labelsenha);

        const inputSenha = document.createElement("input");
        inputSenha.setAttribute("type", "password");
        inputSenha.setAttribute("name", "f_senha");
        inputSenha.setAttribute("id", "f_senha");
        inputSenha.setAttribute("required", "required");
        inputSenha.setAttribute("placeholder", "Digite sua senha");
        inputSenha.setAttribute("title", "Digite sua senha");
        SenhacampoLogin.appendChild(inputSenha);


        const botoesLogin = document.createElement("div");
        botoesLogin.setAttribute("class", "botoesLogin");
        elementosLogin.appendChild(botoesLogin);

        const btn_login = document.createElement("button");
        btn_login.setAttribute("id", "btn_login");
        btn_login.innerHTML = "Login";
        botoesLogin.appendChild(btn_login);

        const btn_cancelar = document.createElement("button");
        btn_cancelar.setAttribute("id", "btn_cancelar");
        btn_cancelar.innerHTML = "Cancelar";
        botoesLogin.appendChild(btn_cancelar);

        const logoLogin = document.createElement("div");
        logoLogin.setAttribute("id", "logoLogin");
        logoLogin.setAttribute("class", "logoLogin");
        baseLogin.appendChild(logoLogin);

        const imglogoLogin = document.createElement("img");
        imglogoLogin.setAttribute("src", "./img/logo.png");
        imglogoLogin.setAttribute("alt", "Imagem Logo");
        imglogoLogin.setAttribute("title", "Login");
        logoLogin.appendChild(imglogoLogin);

            
            btn_login.addEventListener("click", async(evt) => {
            evt.preventDefault();
            const dados_login = {
                senha: inputSenha.value,
                email: inputUsername.value
            };
            if (inputSenha.value.length < 1 || inputUsername.value.length < 1) {
                // Substituído alert()
                mostrarMensagem("Os campos não podem ser vazios!", "erro"); 
                return; 
            }
            else {
                try{
                const resposta = await fetch("/login", {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(dados_login)
                });

                const dadosResposta = await resposta.json()

                if (resposta.ok && dadosResposta.success) { 

                    // Mensagem de sucesso ANTES do redirecionamento
                    mostrarMensagem(dadosResposta.message, "sucesso"); 

                    // Pequeno atraso para o usuário ver a mensagem antes de redirecionar
                    setTimeout(() => {
                        if (dadosResposta.user.cargo === 'administrador') {
                            location.assign('/dashboard_adm');
                        } else if (dadosResposta.user.cargo === 'operario') {
                            location.assign('/dashboard_venda');
                        }
                    }, 1000); // Redireciona após 1 segundo
                } else {
                    console.log("Erro no login:", dadosResposta.message || "Erro desconhecido.");
                    // Substituído alert()
                    mostrarMensagem(dadosResposta.message || "Credenciais inválidas. Tente novamente.", "erro"); 
                }
            }catch (error) {
                console.error("Erro ao enviar os dados de login para o servidor! ERRO: ", error); // Use console.error para erros
                // Substituído console.log por mostrarMensagem
                mostrarMensagem("Não foi possível conectar ao servidor. Tente novamente mais tarde.", "erro"); 
            }
            }
        })
        
    btn_cancelar.addEventListener("click", (evt) => {
        fundoLogin.remove();
        location.assign('/');
    })

        // const btn_logGoogle = document.createElement("button");
        // btn_logGoogle.setAttribute("id", "btn_logG");
        // btn_logGoogle.innerHTML = "Continuar com Google";// Não irei implemnetar essa função agora...quem sabe futuramente
        // botoesLogin.appendChild(btn_logGoogle);
    }
}

export { login }