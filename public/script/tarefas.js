// tarefas.js (CÓDIGO COMPLETO COM CORREÇÕES E COESÃO)

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const nomeAlunoEl = document.getElementById('nome-aluno');
    const subtituloTarefasEl = document.getElementById('subtitulo-tarefas');
    const btnSair = document.getElementById('btn-sair');
    const rankingListaEl = document.getElementById('ranking-lista');

    // NOVOS SELETORES DE TAREFAS:
    const listaTarefasDinamicasEl = document.getElementById('lista-tarefas-dinamicas');
    const listaJogosFixosEl = document.getElementById('lista-jogos-fixos');

    // --- SELETORES PARA O MODAL ---
    const btnConfig = document.getElementById('btn-config');
    const modalConfig = document.getElementById('modal-configuracoes');
    const btnSalvarConfig = document.getElementById('btn-salvar-config');
    const selectMusica = document.getElementById('select-musica');
    const toggleNarracao = document.getElementById('toggle-narracao');
    
    // --- DADOS DA SESSÃO ---
    const nomeAluno = sessionStorage.getItem('aluno_nome');
    const alunoId = sessionStorage.getItem('aluno_id');
    const salaId = sessionStorage.getItem('sala_id_atual');
    
    // --------------------------------------------------------------------------------
    // --- VALIDAÇÃO INICIAL E CARREGAMENTO DO NOME (SOLUÇÃO PARA O BUG DO NOME) ---
    // --------------------------------------------------------------------------------
    if (!nomeAluno || !alunoId || !salaId) {
        // Se faltar dados, assume que a sessão expirou ou não está logada
        alert("Sessão inválida. Por favor, faça o login novamente.");
        window.location.href = '/jogar';
        return;
    }
    
    // O nome é carregado imediatamente após a validação
    nomeAlunoEl.textContent = nomeAluno;
    
    // Validação de Elementos (para evitar erros críticos)
    if (!listaTarefasDinamicasEl || !listaJogosFixosEl || !rankingListaEl) {
         console.error("Erro crítico: Elementos de lista ou ranking não foram encontrados.");
         // Continua executando o que for possível, mas alerta sobre a falha.
    }


    // --- FUNÇÕES DE CONFIGURAÇÃO (MODAL) ---
    function carregarConfiguracoes() {
        const musica = localStorage.getItem('config_musica') || 'musica1';
        const narracao = localStorage.getItem('config_narracao') !== 'false';
        selectMusica.value = musica;
        toggleNarracao.checked = narracao;
    }

    function salvarConfiguracoes() {
        localStorage.setItem('config_musica', selectMusica.value);
        localStorage.setItem('config_narracao', toggleNarracao.checked);
        modalConfig.classList.add('hidden');
    }

    // --- EVENT LISTENERS DO MODAL ---
    btnConfig.addEventListener('click', () => {
        carregarConfiguracoes(); 
        modalConfig.classList.remove('hidden');
    });

    btnSalvarConfig.addEventListener('click', salvarConfiguracoes);

    modalConfig.addEventListener('click', (e) => {
        if (e.target === modalConfig) {
            modalConfig.classList.add('hidden');
        }
    });

    // -------------------------------------------------------------
    // --- RANKING (SOLUÇÃO PARA O BUG DO RANKING) ---
    // -------------------------------------------------------------
    const buscarERenderizarRanking = async () => {
         if (!rankingListaEl) return;
         rankingListaEl.innerHTML = '<p class="loading-message">Carregando ranking...</p>'; // Feedback de carregamento

        try {
            const response = await fetch(`/api/game/salas/${salaId}/ranking`);
            if (!response.ok) {
                // Lança erro caso a API responda com código de falha
                throw new Error(`Falha na API: ${response.status}`);
            }
            const ranking = await response.json();
            renderizarRanking(ranking);
        } catch (error) {
            console.error("Erro ao buscar ranking:", error);
            // Feedback de erro para o aluno
            rankingListaEl.innerHTML = '<p class="erro-api">Erro ao carregar o ranking.</p>';
        }
    };

    const renderizarRanking = (ranking) => {
        if (!rankingListaEl) return;
        rankingListaEl.innerHTML = ''; 

        if (!ranking || ranking.length === 0) {
            rankingListaEl.innerHTML = '<p>Ninguém pontuou ainda!</p>';
            return;
        }
        // ... (lógica de renderização do ranking permanece igual) ...
        ranking.forEach((aluno, index) => {
            const item = document.createElement('div');
            item.className = 'ranking-item';

            if (aluno.alunoId === alunoId) {
                // Estilo do aluno logado (coincide com o tema do CSS)
                item.style.backgroundColor = '#f5f3ff'; 
                item.style.fontWeight = 'bold';
            }

            let posicao = `${index + 1}º`;
            if (index === 0) posicao = '🥇'; 
            else if (index === 1) posicao = '🥈'; 
            else if (index === 2) posicao = '🥉'; 

            item.innerHTML = `
                <span class="ranking-posicao">${posicao}</span>
                <span class="ranking-nome">${aluno.nome || 'Aluno Desconhecido'}</span>
                <span class="ranking-pontos">${aluno.pontuacaoTotal} pts</span>
            `;
            rankingListaEl.appendChild(item);
        });
    };


    // -------------------------------------------------------------
    // --- JOGOS FIXOS E TAREFAS DINÂMICAS (COESÃO) ---
    // -------------------------------------------------------------
    const JOGOS_FIXOS = [
        { titulo: "Capivara Matemática", subtitulo: "Matemática - Letramento", icone: "➕", link: "/jogo-mat-let", tema: "matematica" },
        { titulo: "Ordem Numérica", subtitulo: "Matemática - Alfabetização", icone: "1️⃣2️⃣", link: "/jogo-mat-alf", tema: "matematica" },
        { titulo: "Acerte a Palavra", subtitulo: "Português - Letramento", icone: "📖", link: "/jogo-por-let", tema: "portugues" },
        { titulo: "Forme a Sílaba", subtitulo: "Português - Alfabetização", icone: "🔠", link: "/jogo-por-alf", tema: "portugues" },
    ];

    const renderizarJogosFixos = () => {
        if (!listaJogosFixosEl) return;
        listaJogosFixosEl.innerHTML = '<h2 class="section-title">🎮 Jogos de Aprendizagem (Fixos)</h2>';
        const gridContainer = document.createElement('div');
        gridContainer.className = 'tarefas-grid'; 

        JOGOS_FIXOS.forEach(jogo => {
            const card = document.createElement('a');
            card.href = jogo.link; 
            card.className = `tarefa-card jogo-fixo ${jogo.tema} disponivel`; 
            card.innerHTML = `
                <div class="tarefa-icone">${jogo.icone}</div>
                <div class="tarefa-info">
                    <span class="tarefa-titulo">${jogo.titulo}</span>
                    <span class="tarefa-prazo tag-fixa">${jogo.subtitulo}</span>
                </div>
                <button class="btn-jogar-tarefa fixed-btn">JOGAR!</button>
            `;
            gridContainer.appendChild(card);
        });
        listaJogosFixosEl.appendChild(gridContainer);
    };

    // Função para renderizar as tarefas dinâmicas na tela
    const renderizarTarefas = (tarefas) => {
        if (!listaTarefasDinamicasEl) return;
        listaTarefasDinamicasEl.innerHTML = '<h2 class="section-title">⭐ Tarefas do Professor (Dinâmicas)</h2>';
        const gridContainer = document.createElement('div');
        gridContainer.className = 'tarefas-grid';

        const tarefasComPerguntas = tarefas.filter(tarefa => tarefa.numPerguntas > 0);

        if (subtituloTarefasEl) {
            subtituloTarefasEl.textContent = (tarefasComPerguntas.length > 0) ? "Mostre que você é um Sabidin!" : "Nenhuma tarefa nova!";
        }

        if (tarefasComPerguntas.length === 0) { 
            gridContainer.innerHTML = `<div class="tarefa-card-vazio">Nenhuma tarefa com perguntas disponível no momento!</div>`;
            listaTarefasDinamicasEl.appendChild(gridContainer);
            return;
        }

        tarefasComPerguntas.forEach(tarefa => {
            // ... (Lógica de data e indisponível permanece igual) ...
            const progresso = tarefa.progressos ? tarefa.progressos.find(p => p.alunoId === alunoId) : null;
            const concluida = progresso && progresso.status === 'concluido';

            const agora = new Date();
            let encerrada = false;
            let dataInfo = 'Sem prazo de encerramento';

            if (tarefa.dataFechamento) { 
                const horaEncerramento = tarefa.horaFechamento || '23:59:59';
                const dataParte = tarefa.dataFechamento.split('T')[0];
                const dataEncerramento = new Date(`${dataParte}T${horaEncerramento}`);

                if (!isNaN(dataEncerramento)) { 
                     dataInfo = `Encerra em: ${dataEncerramento.toLocaleDateString('pt-BR')} às ${tarefa.horaFechamento ? dataEncerramento.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : ''}`;
                    if (agora > dataEncerramento) encerrada = true;
                } else {
                     dataInfo = "Data inválida";
                }
            }
            
            const indisponivel = encerrada || concluida;
            
            const tarefaCard = document.createElement('div');
            tarefaCard.className = `tarefa-card dinamica ${indisponivel ? 'encerrada' : 'disponivel'}`;
            let textoBotao = concluida ? 'Concluído' : (encerrada ? 'Encerrado' : 'Jogar!');

            const tarefaJsonString = JSON.stringify(tarefa).replace(/"/g, '&quot;');

            tarefaCard.innerHTML = `
                <div class="tarefa-icone">${indisponivel ? '⏳' : '✅'}</div>
                <div class="tarefa-info">
                    <span class="tarefa-titulo">${tarefa.titulo || 'Tarefa sem título'}</span>
                    <span class="tarefa-prazo">${encerrada ? 'Prazo encerrado' : dataInfo}</span>
                </div>
                <button class="btn-jogar-tarefa" data-tarefa="${tarefaJsonString}" ${indisponivel ? 'disabled' : ''}>
                    ${textoBotao}
                </button>
            `;
            gridContainer.appendChild(tarefaCard);
        });
        listaTarefasDinamicasEl.appendChild(gridContainer);
    };

    // Função principal para buscar os dados atualizados do servidor
    const buscarTarefasAtualizadas = async () => {
        // 1. RENDERIZA OS JOGOS FIXOS
        renderizarJogosFixos();
        
        // 2. ADICIONA FEEDBACK DE CARREGAMENTO PARA TAREFAS DINÂMICAS
        if (listaTarefasDinamicasEl) {
             listaTarefasDinamicasEl.querySelector('.tarefas-grid').innerHTML = '<div class="loading-message">Carregando tarefas do professor...</div>';
        }
        
        try {
            const response = await fetch(`/api/game/salas/${salaId}/tarefas`);
            if (!response.ok) {
                throw new Error(`Falha na API: ${response.status} - Rota inválida.`);
            }
            const tarefas = await response.json();
            renderizarTarefas(tarefas);
        } catch (error) {
            console.error("ERRO AO CARREGAR TAREFAS:", error);
            // 3. ADICIONA FEEDBACK DE ERRO
            if (listaTarefasDinamicasEl) {
                listaTarefasDinamicasEl.querySelector('.tarefas-grid').innerHTML = `
                    <div class="tarefa-card-vazio erro-api">
                        ❌ Erro ao carregar tarefas do professor. <br>
                        <small>Detalhe: ${error.message}</small>
                    </div>`;
            }
        }
    };

    // Event Listeners
    btnSair.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '/jogar';
    });

    listaTarefasDinamicasEl.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.btn-jogar-tarefa');
        
        if (targetButton && !targetButton.classList.contains('fixed-btn')) { 
            const tarefaDataString = targetButton.getAttribute('data-tarefa');
            
            const tarefaSelecionada = JSON.parse(tarefaDataString); 

            if (tarefaSelecionada) {
                sessionStorage.setItem('tarefa_atual', JSON.stringify(tarefaSelecionada));
                window.location.href = `/jogar/tarefa/${tarefaSelecionada._id}`;
            }
        }
    });

    // --- INICIALIZAÇÃO ---
    // Adiciona o container do grid para o JS poder acessá-lo no carregamento
    if (listaTarefasDinamicasEl) {
        listaTarefasDinamicasEl.innerHTML = '<h2 class="section-title">⭐ Tarefas do Professor (Dinâmicas)</h2><div class="tarefas-grid"></div>';
    }
    
    buscarTarefasAtualizadas();
    buscarERenderizarRanking();
});