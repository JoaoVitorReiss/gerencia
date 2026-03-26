console.log("Pagina de perfil carregada;")
class dados_userLogado {
    static perfil_logado() {
        console.log("função de perfil_logado chamada")
        window.addEventListener('load', async() => {
            // Acessa os dados do usuário que foram injetados no HTML pelo servidor
            const usuario = window.usuarioLogado;
            if (usuario) {
                try{
                    const resposta = await fetch("/dados_user", {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(usuario)
                    })
                    console.log("Esperando o erro")
                    const resposta_user = await resposta.json()

                    if(resposta.ok) {
                        localStorage.setItem('id_vendedor', resposta_user.id);
                        // Cria o elemento principal do perfil
                        const perfilContainer = document.createElement('div');
                        perfilContainer.classList.add('perfil-container');
                        perfilContainer.style.position = 'fixed';
                        perfilContainer.style.top = '20px';
                        perfilContainer.style.right = '20px';
                        perfilContainer.style.zIndex = '1000';  

                        // Estilo CSS inline como string
                        const estiloCSS = `
                            .perfil-container {
                                background: linear-gradient(135deg, #1e3c72, #2a5298);
                                padding: 20px;
                                border-radius: 15px;
                                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                                color: #fff;
                                display: flex;
                                align-items: center;
                                gap: 15px;
                                max-width: 300px;
                                position: relative;
                                animation: slideIn 0.5s ease-out;
                            }

                            .perfil-close {
                                position: absolute;
                                top: 10px;
                                left: 10px;
                                width: 20px;
                                height: 20px;
                                background: #fff;
                                color: #1e3c72;
                                border: none;
                                border-radius: 50%;
                                cursor: pointer;
                                font-size: 14px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                transition: all 0.3s ease;
                            }

                            .perfil-close:hover {
                                background: #f0f0f0;
                                transform: scale(1.1);
                                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                            }

                            .perfil-imagem {
                                width: 60px;
                                height: 60px;
                                border-radius: 50%;
                                background: #fff; /* Placeholder para imagem */
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 24px;
                                color: #1e3c72;
                                overflow: hidden;
                            }

                            .perfil-imagem img {
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                            }

                            .perfil-info {
                                display: flex;
                                flex-direction: column;
                                gap: 5px;
                            }

                            .perfil-nome {
                                font-size: 1.2rem;
                                font-weight: bold;
                            }

                            .perfil-logout {
                                padding: 8px 15px;
                                background: #fff;
                                color: #1e3c72;
                                border: none;
                                border-radius: 5px;
                                cursor: pointer;
                                font-weight: bold;
                                transition: all 0.3s ease;
                            }

                            .perfil-logout:hover {
                                background: #f0f0f0;
                                transform: translateY(-2px);
                                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                            }

                            @keyframes slideIn {
                                from { opacity: 0; transform: translateX(100px); }
                                to { opacity: 1; transform: translateX(0); }
                            }
                        `;

                        const btn_user = document.getElementById("perfil");

                        //Essa Variável impede que o elemento seja exibido mais de uma vez. Evita erros na exibição
                        var exibir = true;
                        btn_user.addEventListener("click", (evt) => {
                            if(exibir){
                                exibir = false;
                                evt.preventDefault();
                                const styleElement = document.createElement('style');
                                styleElement.textContent = estiloCSS;
                                document.head.appendChild(styleElement);


                                const closeButton = document.createElement('button');
                                closeButton.classList.add('perfil-close');
                                closeButton.textContent = '×';


                                const imagemPerfil = document.createElement('div');
                                imagemPerfil.classList.add('perfil-imagem');
                                if (resposta_user.foto_url) {
                                    const img = document.createElement('img');
                                    img.src = resposta_user.foto_url;
                                    img.alt = resposta_user.nome;
                                    img.onerror = () => {
                                        img.remove();
                                        imagemPerfil.textContent = resposta_user.nome.charAt(0).toUpperCase();
                                    };
                                    imagemPerfil.appendChild(img);
                                } else {
                                    imagemPerfil.textContent = resposta_user.nome.charAt(0).toUpperCase();
                                }

                                // Cria a área de informações
                                const infoPerfil = document.createElement('div');
                                infoPerfil.classList.add('perfil-info');
                                const nomePerfil = document.createElement('div');
                                nomePerfil.classList.add('perfil-nome');
                                nomePerfil.textContent = resposta_user.nome;
                                const btnLogout = document.createElement('button');
                                btnLogout.classList.add('perfil-logout');
                                btnLogout.textContent = 'Sair';

                                // Adiciona elementos ao container
                                infoPerfil.appendChild(nomePerfil);
                                infoPerfil.appendChild(btnLogout);
                                perfilContainer.appendChild(closeButton);
                                perfilContainer.appendChild(imagemPerfil);
                                perfilContainer.appendChild(infoPerfil);
                                document.body.appendChild(perfilContainer);
                                
                        
                                // Evento de fechar o perfil
                                closeButton.addEventListener('click', () => {
                                    perfilContainer.remove();
                                    imagemPerfil.remove();
                                    infoPerfil.remove();
                                    closeButton.remove();
                                    styleElement.remove(); // Remove o estilo ao fechar
                                    exibir = true;

                                });

                                // Evento de logout
                                btnLogout.addEventListener('click', () => {
                                    window.location.href = '/logout';
                                });
                            }
                        });
                       

                    }}catch(erro){
                    console.log("Erro ao requerir o usuário: " + erro)   
                }
            } else {
                console.error("Dados do usuário não encontrados.");
            }
        });
        
    }
}

dados_userLogado.perfil_logado();

