let instaciaGrafico;
let instanciaRosca;
class DataSelect {
    static async data_selecionada() {
        const formatarData = (data) => data.toISOString().split('T')[0];

        const enviarParaServidor = async (inicio, fim) => {
            try {
                const resposta = await fetch("/relatorio_balanco", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inicio, fim })
                });
                const res = await resposta.json();
                if (resposta.ok) {

                    this.atualizaCard(res.dados);
                    this.desenharGrafico(res.dados.graficoFaturamento);
                    this.desenharGraficoPagamento(res.dados.graficoPagamento);
                    this.renderizarTabelaProdutos(res.dados.produtosTop);
                    this.preencherInsights(res.dados);
                    this.gerarRelatorioEscrito(res.dados)

                }
            } catch (error) {
                console.error("Erro no fetch:", error);
            };
        };

        // Seletores
        const botoes = document.querySelectorAll(".btn-filtro");
        const inputInicio = document.getElementById("data_inicio");
        const inputFim = document.getElementById("data_fim");
        const btnBuscaManual = document.getElementById("btn_buscar_custom");



        // Lógica dos Botões Rápidos (Hoje, 7d, 30d)
        botoes.forEach(botao => {
            botao.addEventListener("click", () => {
                botoes.forEach(b => b.classList.remove("active"));
                botao.classList.add("active");
                const dias = Number(botao.value);
                const hoje = new Date();
                const dataInicio = new Date();
                dataInicio.setDate(hoje.getDate() - dias);
                enviarParaServidor(formatarData(dataInicio), formatarData(hoje));
            });
        });

        // Lógica da Busca Manual (Período Customizado)
        btnBuscaManual.addEventListener("click", () => {
            const inicio = inputInicio.value;
            const fim = inputFim.value;

            if (inicio && fim) {
                enviarParaServidor(inicio, fim);
            } else {
                alert("Por favor, selecione as duas datas.");
            }
        });

        const hojeStr = formatarData(new Date());
        enviarParaServidor(hojeStr, hojeStr);
    }
    
    static atualizaCard(dados) {
        const calcularVariacao = (atual, anterior) => {
            const a = Number(atual) || 0;
            const ant = Number(anterior) || 0;
            if(ant === 0) return a > 0 ? 100 : 0;
            return ((a - ant) * 100);
        };

        const formatarStatus = (elemento, variacao) => {
            const cor = variacao >= 0 ? "green" : "red";
            const seta = variacao >= 0 ? "↑" : "↓";
            elemento.innerHTML = `<span style="color: ${cor}">${seta} ${Math.abs(variacao).toFixed(2)}%</span>`;
        };

        const fatValor = document.getElementById("fatu_total");
        const fatStatus = document.getElementById("faturamento_status");
        fatValor.innerHTML = `R$ ${Number(dados.atual.faturamento_total).toFixed(2)}`;
        formatarStatus(fatStatus, calcularVariacao(dados.atual.faturamento_total, dados.anterior.faturamento_total));

        
        const vendasValor = document.getElementById("vendas_total");
        const vendasStatus = document.getElementById("vendas_status");
        vendasValor.innerHTML = dados.atual.qtd_vendas;
        formatarStatus(vendasStatus, calcularVariacao(dados.atual.qtd_vendas, dados.anterior.qtd_vendas));


        const ticketValor = document.getElementById("ticket_total");
        const ticketStatus = document.getElementById("ticket_status");
        ticketValor.innerHTML = `R$ ${Number(dados.atual.ticket_medio).toFixed(2)}`;
        formatarStatus(ticketStatus, calcularVariacao(dados.atual.ticket_medio, dados.anterior.ticket_medio));
    };

    static desenharGrafico(dadosGrafico) {

        const { atual, anterior } = dadosGrafico;
        //console.log(anterior)
        const ctx = document.getElementById('meuGraficoLinha').getContext('2d');
        if (!dadosGrafico || dadosGrafico.length === 0) {
            console.warn("Nenhum dado encontrado para o gráfico.");
            if (instaciaGrafico) instaciaGrafico.destroy();
            return;
        }
        if (instaciaGrafico) {
            instaciaGrafico.destroy();

        }

        const labels = atual.map(item => {
            const dataObj = new Date(item.data + 'T00:00:00'); 
            return dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        });
        const valores = atual.map(item => item.total);

        const mapDados = new Map(atual.map(item => [item.data, item.total]));

        const datas = atual.map(d => d.data).sort();
        const inicio = new Date(datas[0] || new Date());
        const fim    = new Date(datas[datas.length - 1] || new Date());

        const labelsCompletos = [];
        const valoresCompletos = [];
        
        let dataAtual = new Date(inicio);
        while (dataAtual <= fim) {
            const str = dataAtual.toISOString().split('T')[0];
            labelsCompletos.push(str);
            valoresCompletos.push(mapDados.get(str) || 0);
            dataAtual.setDate(dataAtual.getDate() + 1);
        };


        instaciaGrafico = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: labelsCompletos,
                    data: valoresCompletos,
                    borderColor: '#325088',
                    backgroundColor: 'rgba(50, 80, 136, 0.1)', 
                    borderWidth: 3,
                    tension: 0.3, 
                    fill: false,
                    pointRadius: 5
                    
                }]
            },

            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `R$ ${context.parsed.y.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
                        }
                    }
                }
            }
        });
    }

    static desenharGraficoPagamento(dadosPagamento) {
        const ctx = document.getElementById('meuGraficoRosca').getContext('2d');
        
        if (instanciaRosca) instanciaRosca.destroy();

        const labels = dadosPagamento.map(item => item.metodo);
        const valores = dadosPagamento.map(item => item.total);

        instanciaRosca = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: valores,
                    backgroundColor: ['#325088', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' } 
                }
            }
        });
    };
    static renderizarTabelaProdutos(produtos) {
        const corpoTabela = document.getElementById("corpo-tabela-produtos");
        corpoTabela.innerHTML = ""; // Limpa a tabela anterior

        if (!produtos || produtos.length === 0) {
            corpoTabela.innerHTML = '<tr><td colspan="4" style="text-align:center">Sem vendas no período</td></tr>';
            return;
        }

        const faturamentoTotalPeriodo = produtos.reduce((acc, p) => acc + Number(p.faturamento), 0);

        produtos.forEach(item => {
            const participacao = ((item.faturamento / faturamentoTotalPeriodo) * 100).toFixed(1);
            
            const linha = `
                <tr>
                    <td>${item.produto}</td>
                    <td>${item.qtd}</td>
                    <td>R$ ${Number(item.faturamento).toFixed(2)}</td>
                    <td><strong>${participacao}%</strong></td>
                </tr>
            `;
            corpoTabela.innerHTML += linha;
        });
    };
    static preencherInsights(dados){
    const setTexto = (id, texto) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.innerText = texto;
        } else {
            console.warn(`Aviso: Elemento com ID '${id}' não encontrado no HTML.`);
        }
    };

    const atualArray = dados.graficoFaturamento.atual || [];
    const pagamentosArray = dados.graficoPagamento || [];

    if (atualArray.length > 0) {
        const melhorDiaObj = [...atualArray].sort((a, b) => b.total - a.total)[0];
        const dataFormatada = new Date(melhorDiaObj.data + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
        setTexto("melhor-dia", dataFormatada);
    }

    if (pagamentosArray.length > 0) {
        const topMetodo = [...pagamentosArray].sort((a, b) => b.total - a.total)[0];
        setTexto("metodo-top", topMetodo.metodo || topMetodo.venda_metodo_paga || "N/A");
    }

    const totalItens = Number(dados.atual.total_itens_vendidos) || 0;
    const totalVendas = Number(dados.atual.qtd_vendas) || 1;
    setTexto("itens-por-venda", (totalItens / totalVendas).toFixed(1));


    const campoComp = document.getElementById("comparativo-periodo");
    if (campoComp) {
        const totalAtual = atualArray.reduce((acc, item) => acc + Number(item.total), 0);
        const totalAnterior = (dados.graficoFaturamento.anterior || []).reduce((acc, item) => acc + Number(item.total), 0);

        if (totalAnterior > 0) {
            const variacao = ((totalAtual - totalAnterior) / totalAnterior) * 100;
            campoComp.innerHTML = `<span style="color: ${variacao >= 0 ? 'green' : 'red'}">${variacao >= 0 ? '↑' : '↓'} ${Math.abs(variacao).toFixed(1)}%</span>`;
        } else {
            campoComp.innerText = "Sem histórico";
            }
        }
    }

    static gerarRelatorioEscrito(dados) {
        
        // 1. Captura de dados com valores padrão para evitar erros

        const faturamentoAtual = dados.graficoFaturamento?.atual || [];
        const faturamentoAnterior = dados.graficoFaturamento?.anterior || [];
        const produtos = dados.produtosTop || [];
        const ticketMedio = Number(dados.atual?.ticket_medio) || 0;
        const itensVenda = document.getElementById("itens-por-venda")?.innerText || "0.0";
        const melhorDia = document.getElementById("melhor-dia")?.innerText || "N/A";
        const metodoDominante = document.getElementById("metodo-top")?.innerText || "N/A";

        // 2. Cálculos de Faturamento
        const totalAtual = faturamentoAtual.reduce((acc, i) => acc + Number(i.total), 0);
        const totalAnterior = faturamentoAnterior.reduce((acc, i) => acc + Number(i.total), 0);
        
        let varPerc = 0;
        if (totalAnterior > 0) {
            varPerc = (((totalAtual - totalAnterior) / totalAnterior) * 100).toFixed(1);
        }

        // A. Sumário de Faturamento
        const faturamentoTexto = `O faturamento total consolidado foi de R$ ${totalAtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}. ` +
            (totalAnterior > 0 
                ? `Este valor apresenta uma variação de ${varPerc}% em relação ao período anterior. ` 
                : `Não há dados históricos suficientes para comparação percentual direta. `) +
            `O pico de demanda foi identificado no dia ${melhorDia}.`;
        
        document.getElementById("relatorio-faturamento-texto").innerText = faturamentoTexto;

        // B. Mix de Produtos
        const principalProduto = produtos.length > 0 ? produtos[0].produto : "Nenhum produto listado";
        document.getElementById("relatorio-mix-texto").innerText = 
            `O item "${principalProduto}" destaca-se como o principal motor de receita no período. ` +
            `O ticket médio operacional fixou-se em R$ ${ticketMedio.toFixed(2)}, com uma média de ${itensVenda} produtos por transação.`;

        // C. Eficiência Operacional (Onde estava travado)
        document.getElementById("relatorio-operacional-texto").innerText = 
            metodoDominante !== "N/A" && metodoDominante !== "-"
            ? `A análise de fluxo indica que o método ${metodoDominante} é a principal via de entrada de capital. Recomenda-se monitorar as taxas de liquidação desta modalidade.`
            : `Ainda não há dados consolidados suficientes sobre os métodos de pagamento para uma análise de eficiência operacional.`;

        // D. Conclusão Tectônica (O diagnóstico final)
        const campoConclusao = document.getElementById("relatorio-conclusao-texto");
        if (totalAtual === 0) {
            campoConclusao.innerText = "Operação sem movimentação financeira no período selecionado. Aguardando processamento de vendas para diagnóstico.";
        } else if (varPerc >= 0) {
            campoConclusao.innerText = "Os indicadores apontam uma movimentação tectônica positiva. A manutenção do ticket médio aliada à estabilidade do mix de produtos sugere um cenário de retenção saudável.";
        } else {
            campoConclusao.innerText = "Identificada uma retração nos indicadores de volume. Recomenda-se auditoria no estoque dos produtos líderes e revisão da política de descontos para reverter a tendência de queda.";
        }
    }
    static async init() {
        this.data_selecionada();
    };
}

DataSelect.init();