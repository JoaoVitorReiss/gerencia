// // Função para HASHAR a senha antes de salvar





const configValidacao = false;
// Função para validar so numeros reais



function processarTelefone(telefone, validarReal = configValidacao) {
  // 1. Limpeza: Remove parênteses, espaços e traços
  const numeros = telefone.replace(/\D/g, '');

  // 2. Validação de tamanho (Fixo: 10, Celular: 11)
  if (numeros.length < 10 || numeros.length > 11) {
    return "Erro: Telefone deve ter 10 ou 11 dígitos (com DDD).";
  }

  // 3. Se for apenas para teste (validarReal = false), retorna os números limpos
  if (!validarReal) {
    return numeros;
  }

  // 4. Validação "Real" básica (DDD e Nono Dígito)
  const ddd = parseInt(numeros.substring(0, 2));
  
  // Lista básica de DDDs válidos no Brasil (11 a 99)
  if (ddd < 11 || ddd > 99) {
    return "Erro: DDD inválido.";
  }

  // Se tiver 11 dígitos, o primeiro dígito após o DDD deve ser 9
  if (numeros.length === 11 && numeros[2] !== '9') {
    return "Erro: Celular deve começar com 9.";
  }

  // Impede sequências óbvias como "1111111111"
  if (/^(\d)\1{9,10}$/.test(numeros)) {
    return "Erro: Número de telefone inválido.";
  }

  return numeros;
}


// Essa funçãválida o telefone
function processarCPF(cpf, validarReal = configValidacao) {

  // 1. Limpeza: Remove tudo que não for número
  const numerosApenas = cpf.replace(/\D/g, '');

  // 2. Validação básica de tamanho (ajuda a filtrar erros grosseiros antes de tudo)
  if (numerosApenas.length !== 11) {
    return "Erro: CPF deve conter 11 dígitos.";
  }

  // 3. Se validarReal for FALSE, apenas retorna os números (já passou no teste de 11 dígitos)
  if (!validarReal) {
    return numerosApenas;
  }

  // 4. Validação Real
  // Bloqueia números repetidos como 111.111.111-11
  if (/^(\d)\1{10}$/.test(numerosApenas)) {
    return "Erro: CPF com dígitos repetidos é inválido.";
  }

  let soma = 0;
  let resto;

  // Cálculo do 1º dígito verificador
  for (let i = 1; i <= 9; i++) soma += parseInt(numerosApenas.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(numerosApenas.substring(9, 10))) return "Erro: CPF matematicamente inválido.";

  // Cálculo do 2º dígito verificador
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(numerosApenas.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(numerosApenas.substring(10, 11))) return "Erro: CPF matematicamente inválido.";

  // Se chegou até aqui e validarReal era true, o CPF é quente!
  return numerosApenas;
}






const nome_funcionario = document.getElementById("nome_funcionario");
const CPF_funcionario = document.getElementById("cpf_funcionario");
const tel_funcionario = document.getElementById("telefone_funcionario");
const email_funcionario = document.getElementById("email_funcionario");
const senha_funcionario = document.getElementById("senha_funcionario");
const confSenha_funcionario = document.getElementById("confirmar_senha");
const tipo_funcionario =  document.getElementById("nivel");
const salario_funcionario =  document.getElementById("salario_funcionario");
const data_admissao_funcionario = document.getElementById("data_admissao");

const btn_salvar = document.getElementById("btn_salvar");

const erroPass = document.querySelectorAll(".senha-wrapper") 

// Senhas
const data_admissaoFun = new Date().toISOString().split('T')[0];
data_admissao_funcionario.value = data_admissaoFun
document.addEventListener('DOMContentLoaded', () => {
    const inputFoto = document.getElementById('foto');
    const containerPreview = document.getElementById('foto-preview');
    const placeholder = containerPreview.querySelector('.placeholder');

    inputFoto.addEventListener('change', function(event) {
        const arquivo = event.target.files[0]; // Pega o primeiro arquivo selecionado

        // Se houver um arquivo e ele for uma imagem
        if (arquivo && arquivo.type.startsWith('image/')) {
            const leitor = new FileReader();

            // O que fazer quando o leitor terminar de carregar o arquivo
            leitor.onload = function(e) {
                // Esconde o placeholder (o bonequinho 👤)
                placeholder.style.display = 'none';

                // Verifica se já existe uma imagem de preview anterior e remove
                const imagemAnterior = containerPreview.querySelector('.img-preview');
                if (imagemAnterior) {
                    imagemAnterior.remove();
                }

                // Cria o elemento de imagem
                const novaImagem = document.createElement('img');
                novaImagem.src = e.target.result; // O resultado da leitura (base64)
                novaImagem.classList.add('img-preview'); // Adiciona a classe para o CSS

                // Adiciona a imagem dentro do container de preview
                containerPreview.appendChild(novaImagem);
            };

            // Inicia a leitura do arquivo como uma URL de dados (base64)
            leitor.readAsDataURL(arquivo);

        } else {
            // Se não for imagem ou não houver arquivo, volta ao estado original
            placeholder.style.display = 'block';
            const imagemAnterior = containerPreview.querySelector('.img-preview');
            if (imagemAnterior) {
                imagemAnterior.remove();
            }
        }
    });
});

btn_salvar.addEventListener("click", (evt) => {
    evt.preventDefault(); // Impede o recarregamento da página

    // 1. Validação básica de senha ainda no Front (opcional, mas bom)
    if (senha_funcionario.value !== confSenha_funcionario.value) {
        erroPass.forEach(err => err.classList.add("erro"));
        console.log("As senhas não coincidem!");
        return; // Para a execução aqui
    }

    // 2. Criar o "Envelope" FormData
    const formData = new FormData();

    // 3. Adicionar os campos de texto
    formData.append("nome", nome_funcionario.value);
    formData.append("email", email_funcionario.value);
    formData.append("cpf", CPF_funcionario.value);
    formData.append("tipo", tipo_funcionario.value);
    formData.append("senha", senha_funcionario.value);
    formData.append("data_admissao", data_admissao_funcionario.value);

    // 4. Adicionar a IMAGEM (O pulo do gato)
    const inputFoto = document.getElementById('foto');
    if (inputFoto.files[0]) {
        // "foto_funcionario" deve ser o mesmo nome que você usará no upload.single() do Multer
        formData.append("foto_funcionario", inputFoto.files[0]);
    }

    // 5. Enviar para o Backend via Fetch API
    fetch("/cadastrar-funcionario", {
        method: "POST",
        body: formData // Note que NÃO usamos JSON.stringify aqui!
    })
    .then(res => res.json())
    .then(data => {
        console.log("Sucesso:", data);
        alert("Funcionário cadastrado!");
        window.location.reload()
    })
    .catch(erro => {
        console.error("Erro ao enviar:", erro);
    });
});

