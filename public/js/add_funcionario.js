const configValidacao = false;

function processarTelefone(telefone, validarReal = configValidacao) {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length < 10 || numeros.length > 11) {
    return "Erro: Telefone deve ter 10 ou 11 dígitos (com DDD).";
  }
  if (!validarReal) return numeros;
  const ddd = parseInt(numeros.substring(0, 2));
  if (ddd < 11 || ddd > 99) return "Erro: DDD inválido.";
  if (numeros.length === 11 && numeros[2] !== '9') return "Erro: Celular deve começar com 9.";
  if (/^(\d)\1{9,10}$/.test(numeros)) return "Erro: Número de telefone inválido.";
  return numeros;
}

function processarCPF(cpf, validarReal = configValidacao) {
  const numerosApenas = cpf.replace(/\D/g, '');
  if (numerosApenas.length !== 11) return "Erro: CPF deve conter 11 dígitos.";
  if (!validarReal) return numerosApenas;
  if (/^(\d)\1{10}$/.test(numerosApenas)) return "Erro: CPF com dígitos repetidos é inválido.";
  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(numerosApenas.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(numerosApenas.substring(9, 10))) return "Erro: CPF matematicamente inválido.";
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(numerosApenas.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(numerosApenas.substring(10, 11))) return "Erro: CPF matematicamente inválido.";
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

// Máscara para CPF: 000.000.000-00
CPF_funcionario.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

// Máscara para Telefone: (00) 00000-0000
tel_funcionario.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 10) {
        // Celular: (00) 90000-0000
        value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 5) {
        // Fixo: (00) 0000-0000
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (value.length > 0) {
        value = value.replace(/^(\d*)/, '($1');
    }
    e.target.value = value;
});

btn_salvar.addEventListener("click", (evt) => {
    evt.preventDefault(); // Impede o recarregamento da página

    // Validações
    const cpfLimpo = processarCPF(CPF_funcionario.value);
    if (cpfLimpo.startsWith("Erro")) {
        alert(cpfLimpo);
        CPF_funcionario.focus();
        return;
    }

    const telLimpo = processarTelefone(tel_funcionario.value);
    if (telLimpo.startsWith("Erro")) {
        alert(telLimpo);
        tel_funcionario.focus();
        return;
    }

    // 1. Validação básica de senha ainda no Front (opcional, mas bom)
    if (senha_funcionario.value !== confSenha_funcionario.value) {
        erroPass.forEach(err => err.classList.add("erro"));
        alert("As senhas não coincidem!");
        return; // Para a execução aqui
    }

    if (!salario_funcionario.value || parseFloat(salario_funcionario.value) <= 0) {
        alert("Por favor, insira um salário válido.");
        salario_funcionario.focus();
        return;
    }

    // 2. Criar o "Envelope" FormData
    const formData = new FormData();

    // 3. Adicionar os campos de texto
    formData.append("nome", nome_funcionario.value);
    formData.append("email", email_funcionario.value);
    formData.append("cpf", cpfLimpo); // Enviamos o CPF limpo (apenas números)
    formData.append("telefone", telLimpo); // Enviamos o telefone limpo
    formData.append("tipo", tipo_funcionario.value);
    formData.append("senha", senha_funcionario.value);
    formData.append("salario", salario_funcionario.value);
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
        if (data.mensagem.includes("Erro") || data.mensagem.includes("já cadastrado")) {
            alert(data.mensagem);
        } else {
            console.log("Sucesso:", data);
            alert("Funcionário cadastrado com sucesso!");
            window.location.reload();
        }
    })
    .catch(erro => {
        console.error("Erro ao enviar:", erro);
        alert("Erro ao cadastrar funcionário. Verifique o console.");
    });
});
