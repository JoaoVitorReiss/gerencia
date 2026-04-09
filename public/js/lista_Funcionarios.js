class GetLista {
    static async lista_funcionarios() {
        try {
            
            const resposta = await fetch(`/lista_Cfuncionarios?t=${new Date().getTime()}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status}`);
            }

            const dados = await resposta.json();
            console.log("📥 Dados atualizados:", dados);

            let funcionarios = Array.isArray(dados.lista) ? dados.lista : [];
            this.renderizarTabela(funcionarios);

        } catch (error) {
            console.error("Erro ao obter lista:", error);
        }
    }

    static calcularStatus(func) {
        if (func.status_online === 0 || func.status_online === "0" || func.status_online === false) {
            return { status: "offline", texto: "Offline", cor: "🔴" };
        }

        // Se não houver registro de atividade, tratamos como offline
        if (!func.ultima_atividade) {
            return { status: "offline", texto: "Offline", cor: "🔴" };
        }

        const agora = new Date();
        const ultima = new Date(func.ultima_atividade);
        const milissegundos = agora - ultima;
        const minutos = milissegundos / (1000 * 60);

        if (minutos < 5) {
            // Ativo nos últimos 5 minutos
            return { status: "online", texto: "Online", cor: "🟢" };
        } else if (minutos < 15) {
            // Entre 5 e 15 minutos sem atividade
            return { status: "ausente", texto: "Ausente", cor: "🟠" };
        } else {
            // Mais de 15 minutos sem atividade
            return { status: "offline", texto: "Inativo", cor: "🔴" };
        }
    }

    static renderizarTabela(funcionarios) {
        const tbody = document.getElementById('tbody-funcionarios');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!funcionarios || funcionarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px;">Nenhum funcionário encontrado.</td></tr>`;
            return;
        }

        funcionarios.forEach(func => {
            const statusInfo = this.calcularStatus(func);
            const nivelTexto = func.tipo_funcionario_funcionario == 2 ? 'Admin' : 'Vendedor';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="foto-cell">
                    ${func.foto_url ? `<img src="${func.foto_url}" alt="Foto">` : `<div class="placeholder">👤</div>`}
                </td>
                <td><strong>${func.nome_funcionario_funcionario || 'Sem nome'}</strong></td>
                <td>${func.email_funcionario_funcionario || '-'}</td>
                <td>${func.telefone_funcionario || '-'}</td>
                <td>${nivelTexto}</td>
                <td>R$ ${parseFloat(func.salario_funcionario || 0).toFixed(2)}</td>
                <td><span class="status ${statusInfo.status}">${statusInfo.cor} ${statusInfo.texto}</span></td>
                <td>${func.ultima_atividade ? new Date(func.ultima_atividade).toLocaleString('pt-BR') : 'Nunca'}</td>
                <td class="acoes">
                    <button class="btn-ver" onclick="verFuncionario(${func.id_funcionario_funcionario})">Ver</button>
                    <button class="btn-edit" onclick="editarFuncionario(${func.id_funcionario_funcionario})">Editar</button>
                    <button class="btn-excluir" onclick="excluirFuncionario(${func.id_funcionario_funcionario})">Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        filtrarTabela();
    }

    static init() {
        this.lista_funcionarios(); 

        setInterval(() => {
            if (!document.hidden) {
                this.lista_funcionarios();
            }
        }, 5000); 
    }
}

// ====================== FUNÇÕES GLOBAIS ======================

function filtrarTabela() {
    const buscaInput = document.getElementById('busca');
    const filtroStatusInput = document.getElementById('filtro-status');
    
    if (!buscaInput || !filtroStatusInput) return;

    const busca = buscaInput.value.toLowerCase().trim();
    const filtroStatus = filtroStatusInput.value.toLowerCase();
    const rows = document.querySelectorAll('#tbody-funcionarios tr');

    rows.forEach(row => {
        if (row.cells.length < 7) return; 

        const nome = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const statusText = row.cells[6].textContent.toLowerCase();

        const matchBusca = !busca || nome.includes(busca) || email.includes(busca);
        const matchStatus = !filtroStatus || statusText.includes(filtroStatus);

        row.style.display = (matchBusca && matchStatus) ? '' : 'none';
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GetLista.init());
} else {
    GetLista.init();
}