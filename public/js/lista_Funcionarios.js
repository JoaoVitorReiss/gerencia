// lista-funcionarios.js  (VERSÃO ATUALIZADA E CORRIGIDA)

class GetLista {
    static async lista_funcionarios() {
        try {
            const resposta = await fetch("/lista_Cfuncionarios", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status}`);
            }

            const dados = await resposta.json();

            //console.log("📥 Dados recebidos do servidor:", dados);

            // Extrai o array corretamente (está dentro de "lista")
            let funcionarios = [];

            if (dados && Array.isArray(dados.lista)) {
                funcionarios = dados.lista;
            } 
            else if (Array.isArray(dados)) {
                funcionarios = dados; // caso mude no futuro
            } 
            else {
                console.error("Formato inesperado:", dados);
                alert("Erro: Formato de dados inválido recebido do servidor.");
                return;
            }

            this.renderizarTabela(funcionarios);

        } catch (error) {
            console.error("Erro ao obter lista de funcionários:", error);
            alert("Não foi possível carregar a lista de funcionários.\nVerifique o console (F12).");
        }
    }

    static calcularStatus(ultimaAtividade) {
        if (!ultimaAtividade) return { status: "offline", texto: "Offline" };

        const agora = new Date();
        const ultima = new Date(ultimaAtividade);
        const minutos = (agora - ultima) / (1000 * 60);

        if (minutos < 5) {
            return { status: "online", texto: "Online" };
        } else if (minutos < 15) {
            return { status: "ausente", texto: "Ausente" };
        } else {
            return { status: "offline", texto: "Offline" };
        }
    }

    static renderizarTabela(funcionarios) {
        const tbody = document.getElementById('tbody-funcionarios');
        tbody.innerHTML = '';

        if (!funcionarios || funcionarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: #666;">
                        Nenhum funcionário encontrado.
                    </td>
                </tr>`;
            return;
        }

        funcionarios.forEach(func => {
            const statusInfo = this.calcularStatus(func.ultima_atividade);

            const nivelTexto = func.tipo_funcionario_funcionario == 2 ? 'Admin' : 'Vendedor';

            const row = document.createElement('tr');

            row.innerHTML = `
                <td class="foto-cell">
                    ${func.foto_url 
                        ? `<img src="${func.foto_url}" alt="Foto de ${func.nome_funcionario_funcionario}">`
                        : `<div class="placeholder">👤</div>`
                    }
                </td>
                <td><strong>${func.nome_funcionario_funcionario}</strong></td>
                <td>${func.email_funcionario_funcionario}</td>
                <td>${func.telefone_funcionario 
                        ? func.telefone_funcionario.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
                        : '-'}</td>
                <td>${nivelTexto}</td>
                <td>R$ ${parseFloat(func.salario_funcionario || 0).toFixed(2)}</td>
                <td>
                    <span class="status ${statusInfo.status}">
                        ${statusInfo.status === 'online' ? '🟢' : statusInfo.status === 'ausente' ? '🟠' : '🔴'}
                        ${statusInfo.texto}
                    </span>
                </td>
                <td>
                    ${func.ultima_atividade 
                        ? new Date(func.ultima_atividade).toLocaleString('pt-BR')
                        : 'Nunca'
                    }
                </td>
                <td class="acoes">
                    <button class="btn-ver" onclick="verFuncionario(${func.id_funcionario_funcionario})">Ver</button>
                    <button class="btn-edit" onclick="editarFuncionario(${func.id_funcionario_funcionario})">Editar</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    static init() {
        this.lista_funcionarios();
    }
}

// ====================== FUNÇÕES GLOBAIS ======================
window.verFuncionario = (id) => {
    alert(`Visualizar funcionário ID: ${id}\n\n(Em breve integraremos o modal aqui)`);
};

window.editarFuncionario = (id) => {
    alert(`Editar funcionário ID: ${id}`);
};

window.excluirFuncionario = (id) => {
    if (confirm(`Tem certeza que deseja excluir o funcionário ID ${id}?`)) {
        alert(`Funcionário ${id} excluído (simulação)`);
    }
};

function filtrarTabela() {
    const busca = document.getElementById('busca').value.toLowerCase().trim();
    const filtroStatus = document.getElementById('filtro-status').value.toLowerCase();
    const rows = document.querySelectorAll('#tbody-funcionarios tr');

    rows.forEach(row => {
        const nome = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const statusText = row.cells[6].textContent.toLowerCase();

        const matchBusca = !busca || nome.includes(busca) || email.includes(busca);
        const matchStatus = !filtroStatus || statusText.includes(filtroStatus);

        row.style.display = (matchBusca && matchStatus) ? '' : 'none';
    });
}

// Inicializar página
GetLista.init();