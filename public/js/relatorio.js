let instanciaGrafico;
let instanciaRosca;

class DataSelect {
    static currentInicio = null;
    static currentFim = null;
    static autoRefreshInterval = null;

    static async enviarParaServidor(inicio, fim) {
        try {
            const resposta = await fetch("/relatorio_balanco", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inicio, fim })
            });

            const res = await resposta.json();

            if (resposta.ok) {
                this.currentInicio = inicio;
                this.currentFim = fim;
                this.updateLastUpdated();

                this.atualizaCard(res.dados);
                await this.buscarAuditoria(inicio, fim, res.dados.atual.faturamento_total);

                this.desenharGrafico(res.dados.graficoFaturamento);
                this.desenharGraficoPagamento(res.dados.graficoPagamento);
                this.renderizarTabelaProdutos(res.dados.produtosTop, res.dados.atual.faturamento_total);
                this.preencherInsights(res.dados);
                this.gerarRelatorioEscrito(res.dados);
            }
        } catch (error) {
            console.error("Erro na comunicação com o servidor:", error);
        }
    }

    static async buscarAuditoria(inicio, fim, faturamentoReferencia) {
        try {
            const resposta = await fetch("/api/relatorio_auditoria", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inicio, fim })
            });
            const res = await resposta.json();
            if (resposta.ok) {
                this.renderizarTabelaAuditoria(res.auditoria, faturamentoReferencia);
            }
        } catch (error) {
            console.error("Erro ao buscar auditoria:", error);
        }
    }

    static renderizarTabelaAuditoria(auditoria, faturamentoReferencia) {
        const corpoTabela = document.getElementById("corpo-tabela-auditoria");
        if (!corpoTabela) return;
        
        corpoTabela.innerHTML = "";

        if (!auditoria || auditoria.length === 0) {
            corpoTabela.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Nenhum registro de estorno encontrado no período.</td></tr>';
            this.preencherResumoEstorno([], 0);
            return;
        }

        auditoria.forEach(item => {
            const linha = `
                <tr>
                    <td>${item.data_formatada}</td>
                    <td><strong style="color: #325088;">${item.id_transacao_ref}</strong></td>
                    <td><span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold; background: #fef2f2; color: #ef4444;">${item.tipo_acao}</span></td>
                    <td style="font-weight: bold; color: #ef4444;">R$ ${Number(item.valor_estornado).toFixed(2)}</td>
                    <td>${item.auditor}</td>
                    <td style="font-size: 0.9em; color: #475569;">${item.motivo}</td>
                </tr>
            `;
            corpoTabela.innerHTML += linha;
        });

        this.preencherResumoEstorno(auditoria, faturamentoReferencia);
    }

    static preencherResumoEstorno(auditoria, faturamentoTotal) {
        const elTipo = document.getElementById("estorno-tipo-comum");
        const elMotivo = document.getElementById("estorno-motivo-principal");
        const elTaxa = document.getElementById("estorno-taxa");
        const elAlerta = document.getElementById("estorno-alerta");

        if (!auditoria || auditoria.length === 0) {
            if(elTipo) elTipo.innerText = "Nenhum";
            if(elMotivo) elMotivo.innerText = "Nenhum";
            if(elTaxa) elTaxa.innerText = "0.0%";
            if(elAlerta) {
                elAlerta.innerHTML = "✅ <strong>Operação Estável:</strong> Sem estornos ou devoluções no período.";
                elAlerta.style.background = "#f0fdf4";
                elAlerta.style.color = "#166534";
            }
            return;
        }

        const tipos = auditoria.reduce((acc, item) => {
            acc[item.tipo_acao] = (acc[item.tipo_acao] || 0) + 1;
            return acc;
        }, {});
        const tipoComum = Object.keys(tipos).reduce((a, b) => tipos[a] > tipos[b] ? a : b);

        const motivos = auditoria.reduce((acc, item) => {
            acc[item.motivo] = (acc[item.motivo] || 0) + 1;
            return acc;
        }, {});
        const motivoPrincipal = Object.keys(motivos).reduce((a, b) => motivos[a] > motivos[b] ? a : b);

        const totalEstornado = auditoria.reduce((acc, item) => acc + Number(item.valor_estornado), 0);
        const taxa = faturamentoTotal > 0 ? (totalEstornado / faturamentoTotal * 100).toFixed(1) : "0.0";

        if(elTipo) elTipo.innerText = tipoComum;
        if(elMotivo) elMotivo.innerText = motivoPrincipal;
        if(elTaxa) elTaxa.innerText = `${taxa}%`;

        if(elAlerta) {
            if (Number(taxa) > 10) {
                elAlerta.innerHTML = "⚠️ <strong>Atenção:</strong> Índice de estorno elevado. Verifique os motivos principais.";
                elAlerta.style.background = "#fff1f2"; 
                elAlerta.style.color = "#991b1b";
            } else {
                elAlerta.innerHTML = "✅ <strong>Saudável:</strong> Taxa de estorno dentro do limite operacional.";
                elAlerta.style.background = "#f0fdf4"; 
                elAlerta.style.color = "#166534";
            }
        }
    }

    static updateLastUpdated() {
        const el = document.getElementById("last-updated");
        if (el) {
            const agora = new Date();
            el.textContent = `Última atualização: ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }
    }

    static startAutoRefresh() {
        this.stopAutoRefresh();
        this.autoRefreshInterval = setInterval(() => {
            if (this.currentInicio && this.currentFim) {
                this.enviarParaServidor(this.currentInicio, this.currentFim);
            }
        }, 3 * 60 * 1000);
    }

    static stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    static async data_selecionada() {
        const formatarData = (data) => data.toISOString().split('T')[0];

        const botoes = document.querySelectorAll(".btn-filtro");
        const inputInicio = document.getElementById("data_inicio");
        const inputFim = document.getElementById("data_fim");
        const btnBuscaManual = document.getElementById("btn_buscar_custom");

        botoes.forEach(botao => {
            botao.addEventListener("click", () => {
                botoes.forEach(b => b.classList.remove("active"));
                botao.classList.add("active");
                const dias = Number(botao.value);
                const hoje = new Date();
                const dataInicio = new Date();
                dataInicio.setDate(hoje.getDate() - dias);
                this.enviarParaServidor(formatarData(dataInicio), formatarData(hoje));
            });
        });

        if(btnBuscaManual) {
            btnBuscaManual.addEventListener("click", () => {
                const inicio = inputInicio.value;
                const fim = inputFim.value;
                if (inicio && fim) {
                    this.enviarParaServidor(inicio, fim);
                } else {
                    alert("Por favor, selecione as duas datas.");
                }
            });
        }

        const hojeStr = formatarData(new Date());
        await this.enviarParaServidor(hojeStr, hojeStr);

        const toggle = document.getElementById("auto-refresh-toggle");
        if (toggle) {
            toggle.addEventListener("change", () => {
                toggle.checked ? this.startAutoRefresh() : this.stopAutoRefresh();
            });
            if (toggle.checked) this.startAutoRefresh();
        }
    }

    static atualizaCard(dados) {
        const calcularVariacao = (atual, anterior) => {
            const a = Number(atual) || 0;
            const ant = Number(anterior) || 0;
            if(ant === 0) return a > 0 ? 100 : 0;
            return ((a - ant) / ant) * 100;
        };

        const formatarStatus = (elementoId, variacao) => {
            const elemento = document.getElementById(elementoId);
            if (!elemento) return;
            const cor = variacao >= 0 ? "green" : "red";
            const seta = variacao >= 0 ? "↑" : "↓";
            elemento.innerHTML = `<span style="color: ${cor}">${seta} ${Math.abs(variacao).toFixed(2)}%</span>`;
        };

        const faturamento = Number(dados.atual.faturamento_total || 0);
        document.getElementById("fatu_total").innerHTML = `R$ ${faturamento.toFixed(2)}`;
        formatarStatus("faturamento_status", calcularVariacao(faturamento, dados.anterior.faturamento_total));

        document.getElementById("vendas_total").innerHTML = dados.atual.qtd_vendas || 0;
        formatarStatus("vendas_status", calcularVariacao(dados.atual.qtd_vendas, dados.anterior.qtd_vendas));

        document.getElementById("ticket_total").innerHTML = `R$ ${Number(dados.atual.ticket_medio || 0).toFixed(2)}`;
        formatarStatus("ticket_status", calcularVariacao(dados.atual.ticket_medio, dados.anterior.ticket_medio));

        const estornadoValor = document.getElementById("estornado_total");
        if (estornadoValor) {
            const estAtual = Number(dados.atual.valor_estornado) || 0;
            estornadoValor.innerHTML = `R$ ${estAtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
            const varEst = calcularVariacao(estAtual, Number(dados.anterior.valor_estornado || 0));
            const statusEst = document.getElementById("estornado_status");
            if (statusEst) {
                const cor = varEst >= 0 ? "red" : "green";
                statusEst.innerHTML = `<span style="color: ${cor}">${varEst >= 0 ? "↑" : "↓"} ${Math.abs(varEst).toFixed(2)}% vs anterior</span>`;
            }
        }
    }

    static desenharGrafico(dadosGrafico) {
        const ctxEl = document.getElementById('meuGraficoLinha');
        if (!ctxEl) return;
        const ctx = ctxEl.getContext('2d');
        if (instanciaGrafico) instanciaGrafico.destroy();
        
        const atual = dadosGrafico?.atual || [];
        if (atual.length === 0) return;

        const datas = atual.map(d => d.data).sort();
        const mapDados = new Map(atual.map(item => [item.data, item.total]));
        const mapEstorno = new Map(atual.map(item => [item.data, item.total_estornado || 0]));

        const labels = [];
        const valoresFatu = [];
        const valoresEst = [];
        
        let d = new Date(datas[0]);
        const fim = new Date(datas[datas.length - 1]);

        while (d <= fim) {
            const str = d.toISOString().split('T')[0];
            labels.push(new Date(str + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
            valoresFatu.push(mapDados.get(str) || 0);
            valoresEst.push(mapEstorno.get(str) || 0);
            d.setDate(d.getDate() + 1);
        }

        instanciaGrafico = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Faturamento', data: valoresFatu, borderColor: '#325088', tension: 0.3, fill: false },
                    { label: 'Estornos', data: valoresEst, borderColor: '#ef4444', tension: 0.3, fill: false }
                ]
            },
            options: { 
                responsive: true,
                plugins: { 
                    tooltip: { 
                        callbacks: { 
                            label: (c) => `R$ ${c.parsed.y.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` 
                        } 
                    } 
                } 
            }
        });
    }

    static desenharGraficoPagamento(dadosPagamento) {
        const ctxEl = document.getElementById('meuGraficoRosca');
        if (!ctxEl) return;
        const ctx = ctxEl.getContext('2d');
        if (instanciaRosca) instanciaRosca.destroy();

        instanciaRosca = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dadosPagamento.map(i => i.metodo),
                datasets: [{ 
                    data: dadosPagamento.map(i => i.total), 
                    backgroundColor: ['#325088', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6'] 
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
    }

static renderizarTabelaProdutos(produtos, faturamentoTotal) {
        const corpo = document.getElementById("corpo-tabela-produtos");
        if (!corpo) return;
        corpo.innerHTML = "";

        if (!produtos || produtos.length === 0) {
            corpo.innerHTML = '<tr><td colspan="4" style="text-align:center">Sem movimentação no período</td></tr>';
            return;
        }

        // Usa o faturamento TOTAL do período (vem do backend)
        const totalGeral = Number(faturamentoTotal) || produtos.reduce((acc, p) => acc + Number(p.faturamento), 0);

        produtos.forEach(item => {
            const faturamentoProduto = Number(item.faturamento);
            const participacao = totalGeral > 0 
                ? (faturamentoProduto / totalGeral * 100).toFixed(1) 
                : 0;

            corpo.innerHTML += `<tr>
                <td>${item.produto}</td>
                <td>${item.qtd}</td>
                <td>R$ ${faturamentoProduto.toFixed(2)}</td>
                <td><strong>${participacao}%</strong></td>
            </tr>`;
        });
    }
    static preencherInsights(dados) {
        const setTexto = (id, texto) => {
            const el = document.getElementById(id);
            if (el) el.innerText = texto;
        };

        const setHTML = (id, html) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        };

        const atual = dados.graficoFaturamento?.atual || [];
        if (atual.length > 0) {
            const melhor = [...atual].sort((a, b) => b.total - a.total)[0];
            const dataFormatada = new Date(melhor.data + 'T00:00:00')
                .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            setTexto("melhor-dia", dataFormatada);
        } else {
            setTexto("melhor-dia", "—");
        }

        const qtdVendas = Math.max(1, Number(dados.atual?.qtd_vendas || 0));
        const itensPorVenda = (Number(dados.atual?.total_itens_vendidos || 0) / qtdVendas).toFixed(1);
        setTexto("itens-por-venda", itensPorVenda);


        const fatAtual = Number(dados.atual?.faturamento_total || 0);
        const fatAnterior = Number(dados.anterior?.faturamento_total || 0);
        
        let textoComparativo = "—";

        if (fatAnterior > 0) {
            const perc = ((fatAtual - fatAnterior) / fatAnterior) * 100;
            const cor = perc >= 0 ? "#166534" : "#991b1b";
            const seta = perc >= 0 ? "↑" : "↓";
            textoComparativo = `<span style="color:${cor}; font-weight: 600;">${seta} ${Math.abs(perc).toFixed(1)}%</span>`;
        } else if (fatAtual > 0) {
            textoComparativo = `<span style="color:#166534; font-weight: 600;">↑ Novo período</span>`;
        }

        setHTML("comparativo-periodo", textoComparativo);

        const pgs = dados.graficoPagamento || [];
        if (pgs.length > 0) {
            const top = [...pgs].sort((a, b) => b.total - a.total)[0];
            // Se quiser mostrar em algum lugar, use setTexto("metodo-top", top.metodo);
        }
    }

    static gerarRelatorioEscrito(dados) {
        const elFatu = document.getElementById("relatorio-faturamento-texto");
        const elMix = document.getElementById("relatorio-mix-texto");
        const elOperacional = document.getElementById("relatorio-operacional-texto");
        const elEstorno = document.getElementById("relatorio-estorno-texto");
        const elConclusao = document.getElementById("relatorio-conclusao-texto");
        const elPeriodo = document.getElementById("periodo-relatorio");

        // === Usar dados vindos do backend quando disponíveis ===
        const faturamentoAtual = Number(dados.atual?.faturamento_total || 0);
        const variacaoBackend = Number(dados.atual?.variacao_percentual || 0); // se o backend enviar

        const atual = dados.graficoFaturamento?.atual || [];
        const anterior = dados.graficoFaturamento?.anterior || [];
        const totalAtual = atual.reduce((acc, i) => acc + Number(i.total), 0);
        const totalAnt = anterior.reduce((acc, i) => acc + Number(i.total), 0);
        
        // Prioriza variação vinda do backend, senão calcula
        const varPerc = variacaoBackend || (totalAnt > 0 ? (((totalAtual - totalAnt) / totalAnt) * 100).toFixed(1) : 0);

        if (elPeriodo) {
            elPeriodo.innerHTML = `Período: <strong>${dados.datas.data_inicio.split('T')[0]}</strong> até <strong>${dados.datas.data_fim.split('T')[0]}</strong>`;
        }

        if (elFatu) {
            elFatu.innerHTML = `O faturamento consolidado fechou em <strong>R$ ${faturamentoAtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>. Isso indica uma variação de <strong>${varPerc}%</strong> em relação ao período anterior.`;
        }

        if (elMix) {
            const pPrincipal = (dados.produtosTop || []).length > 0 ? dados.produtosTop[0].produto : "Nenhum";
            const ticket = Number(dados.atual?.ticket_medio || 0).toFixed(2);
            const itensPorVenda = document.getElementById("itens-por-venda")?.innerText || "2.0";
            
            elMix.innerHTML = `O produto <strong>"${pPrincipal}"</strong> liderou as vendas no período. O ticket médio ficou em <strong>R$ ${ticket}</strong>, com uma média de <strong>${itensPorVenda}</strong> itens por pedido.`;
        }

        if (elOperacional) {
            const pgs = dados.graficoPagamento || [];
            if (pgs.length > 0) {
                const top = [...pgs].sort((a, b) => b.total - a.total)[0];
                elOperacional.innerHTML = `A análise de fluxo indica que o método <strong>${top.metodo}</strong> foi o principal meio de pagamento. Recomenda-se monitorar as taxas associadas a essa modalidade.`;
            } else {
                elOperacional.innerText = "Não há dados suficientes de meios de pagamento para análise.";
            }
        }

        if (elEstorno) {
            const estValor = Number(dados.atual?.valor_estornado || 0);
            const taxaE = document.getElementById("estorno-taxa")?.innerText || "0.0%";
            
            if (estValor > 0) {
                elEstorno.innerHTML = `Identificamos <strong>R$ ${estValor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong> em estornos (${taxaE} da receita). Recomendamos monitorar os motivos para reduzir perdas operacionais.`;
            } else {
                elEstorno.innerHTML = `Excelente desempenho operacional: <strong>nenhum estorno</strong> registrado no período.`;
            }
        }

        if (elConclusao) {
            if (faturamentoAtual <= 0) {
                elConclusao.innerHTML = "Aguardando novos registros de venda para gerar diagnóstico.";
            } else if (varPerc >= 15) {
                elConclusao.innerHTML = `Os indicadores mostram um <strong>crescimento saudável</strong> (+${varPerc}%). O mix de produtos demonstra boa retenção e equilíbrio comercial.`;
            } else if (varPerc >= 0) {
                elConclusao.innerHTML = `Os indicadores apontam <strong>estabilidade</strong> no período, com bom desempenho do mix de produtos.`;
            } else {
                elConclusao.innerHTML = `Houve uma <strong>retração</strong> no faturamento (${varPerc}%). Recomenda-se revisar a política de preços, estoque dos produtos líderes e fatores externos.`;
            }
        }
    }

    static init() {
        this.data_selecionada();
    }
}

// Inicialização
DataSelect.init();