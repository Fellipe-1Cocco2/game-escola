document.addEventListener('DOMContentLoaded', () => {

    // --- SELETORES DE TELA ---
    const loadingScreen = document.getElementById('loading-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultsScreen = document.getElementById('results-screen');

    // --- SELEtores DO JOGO ---
    const taskTitleEl = document.getElementById('task-title');
    const questionCounterEl = document.getElementById('question-counter');
    const scoreDisplayEl = document.getElementById('score-display');
    const questionTextEl = document.getElementById('question-text');
    const answerButtons = document.querySelectorAll('.answer-btn');
    const btnVoltar = document.getElementById('btn-voltar');
    const btnReplayAudio = document.getElementById('btn-replay-audio');

    // --- SELETORES DOS RESULTADOS ---
    const finalScoreEl = document.getElementById('final-score');
    const finalMessageEl = document.getElementById('final-message');
    const btnVoltarTarefas = document.getElementById('btn-voltar-tarefas');

    // --- SELETOR DE ÁUDIO ---
    const audioEl = document.getElementById('game-music');

    // --- NOVOS: EFEITOS SONOROS ---
    const correctSound = new Audio('/audio/acerto.mp3');
    const incorrectSound = new Audio('/audio/erro.mp3');
    correctSound.volume = 0.5; // Ajuste o volume conforme necessário
    incorrectSound.volume = 0.5;

    // --- ESTADO DO JOGO ---
    let currentTask = null;
    let currentQuestionIndex = 0;
    let score = 0;
    const alunoId = sessionStorage.getItem('aluno_id');
    const salaId = sessionStorage.getItem('sala_id_atual');

    // --- ESTADO DA NARRAÇÃO ---
    let currentQuestionObject = null;
    let vozesPt = [];

    // --- CONFIGURAÇÕES (LIDAS DO LOCALSTORAGE) ---
    const musicaSelecionada = localStorage.getItem('config_musica') || 'musica1';
    const narracaoAtivada = localStorage.getItem('config_narracao') !== 'false'; // Padrão é true
    const musicPaths = {
        'musica1': '/audio/musica1.mp3', // Coloque sua música animada aqui
        'musica2': '/audio/musica2.mp3'  // Coloque sua música calma aqui
    };

    // --- INICIALIZAÇÃO DA SÍNTESE DE VOZ ---
    function carregarVozes() {
        if (!narracaoAtivada) return;
        vozesPt = speechSynthesis.getVoices().filter(voz => voz.lang.startsWith('pt'));
    }
    carregarVozes();
    if (narracaoAtivada && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = carregarVozes;
    }

    /**
     * Função principal de narração
     */
    function narrarPergunta(question) {
        // Só executa se a narração estiver ATIVADA
        if (!narracaoAtivada || !question) return;

        // --- ADICIONADO: Verifica se 'opcoes' existe antes de narrar ---
        if (!question.opcoes || question.opcoes.length < (question.tipo === 'vf' ? 2 : 4)) {
            console.warn("Narração pulada: pergunta sem opções válidas.", question);
            return;
        }
        // --- FIM ADIÇÃO ---

        btnReplayAudio.classList.add('hidden');
        speechSynthesis.cancel();

        // Baixa o volume da música para a narração
        if (audioEl) audioEl.volume = 0.2;

        const textoParaFalar = [
            question.texto,
            `Alternativa A: ${question.opcoes[0]}`,
            `Alternativa B: ${question.opcoes[1]}`,
            // Só narra C e D se for múltipla escolha
            ...(question.tipo !== 'vf' ? [
                 `Alternativa C: ${question.opcoes[2]}`,
                 `Alternativa D: ${question.opcoes[3]}`
            ] : [])
        ].join('. ... ');


        const utterance = new SpeechSynthesisUtterance(textoParaFalar);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;

        const vozPreferida = vozesPt.find(v => v.lang === 'pt-BR');
        if (vozPreferida) utterance.voice = vozPreferida;

        utterance.onend = () => {
            btnReplayAudio.classList.remove('hidden');
            // Restaura o volume da música
            if (audioEl) audioEl.volume = 1.0;
        };

        // Em caso de erro (ex: janela minimizada), restaura o volume
        utterance.onerror = () => {
            if (audioEl) audioEl.volume = 1.0;
        }

        speechSynthesis.speak(utterance);
    }


    function startGame() {
        const taskString = sessionStorage.getItem('tarefa_atual');
        // ... (validações de tarefa e aluno) ...
        if (!taskString || !alunoId) {
            alert('Nenhuma tarefa ou aluno selecionado!');
            window.location.href = '/tarefas';
            return;
        }
        try {
            currentTask = JSON.parse(taskString);
        } catch (e) {
             alert('Erro ao carregar dados da tarefa. Tente novamente.');
             console.error("Erro ao parsear tarefa_atual:", e);
             window.location.href = '/tarefas';
             return;
        }


        if (!currentTask.perguntas || currentTask.perguntas.length === 0 ) {
             // Removida a verificação || !currentTask.perguntas[0].pergunta que pode dar erro se perguntas for vazio
            alert('Erro: Esta tarefa não tem perguntas válidas. Avise o professor.');
            window.location.href = '/tarefas';
            return;
        }

        // ... (lógica de progresso) ...
        const progresso = currentTask.progressos ? currentTask.progressos.find(p => p.alunoId === alunoId) : null;
        if (progresso) {
            score = progresso.pontuacao || 0;
            // Garante que respostas existe antes de pegar length
            currentQuestionIndex = (progresso.respostas && Array.isArray(progresso.respostas)) ? progresso.respostas.length : 0;
            scoreDisplayEl.textContent = score;
        } else {
             currentQuestionIndex = 0; // Garante que começa do 0 se não houver progresso
             score = 0;
             scoreDisplayEl.textContent = score;
        }


        if (progresso && progresso.status === 'concluido') {
            alert('Você já concluiu esta tarefa!');
            window.location.href = '/tarefas';
            return;
        }

        // --- INICIA MÚSICA (se selecionada) ---
        if (musicaSelecionada !== 'nenhuma' && audioEl && musicPaths[musicaSelecionada]) { // Verifica se path existe
            audioEl.src = musicPaths[musicaSelecionada];
            // Tenta tocar a música (pode falhar por política de autoplay do browser)
            audioEl.play().catch(e => console.warn("Autoplay da música bloqueado pelo navegador."));
        } else if (musicaSelecionada !== 'nenhuma') {
             console.warn(`Caminho da música não encontrado para: ${musicaSelecionada}`);
        }


        // Mostra o jogo (que esconde o loader)
        // Damos um pequeno delay para a música começar a carregar
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            displayQuestion();
        }, 500); // 0.5s de delay
    }

    function displayQuestion() {
        if (currentQuestionIndex >= currentTask.perguntas.length) {
            showResults();
            return;
        }

        speechSynthesis.cancel();
        btnReplayAudio.classList.add('hidden');
        // Restaura o volume caso a pergunta anterior tenha sido pulada
        if (narracaoAtivada && audioEl) audioEl.volume = 1.0;

        answerButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });

        const item = currentTask.perguntas[currentQuestionIndex];
        // --- VERIFICAÇÃO ADICIONADA ---
        if (!item || !item.pergunta) {
            console.error("Erro: Pergunta inválida ou não encontrada no índice:", currentQuestionIndex, item);
            showErrorAndSkip("Erro ao carregar pergunta. Pulando para a próxima...");
            return; // Pula para a próxima iteração
        }
        const question = item.pergunta;
        currentQuestionObject = question;

         // --- VERIFICAÇÃO CRUCIAL PARA 'opcoes' ---
        if (!question.opcoes || !Array.isArray(question.opcoes) || question.opcoes.length < (question.tipo === 'vf' ? 2 : 4)) {
             console.error("Erro: Pergunta com 'opcoes' inválidas:", question);
             showErrorAndSkip("Pergunta mal formatada. Pulando para a próxima...");
             return; // Pula para a próxima iteração
        }
         // --- FIM DA VERIFICAÇÃO ---


        taskTitleEl.textContent = currentTask.titulo;
        questionCounterEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentTask.perguntas.length}`;
        questionTextEl.textContent = question.texto;

        // --- LÓGICA ATUALIZADA PARA MOSTRAR 2 OU 4 BOTÕES ---
        if (question.tipo === 'vf') {
            // É Verdadeiro/Falso
            answerButtons.forEach((button, index) => {
                const answerTextEl = button.querySelector('.answer-text');
                if (index === 0) {
                    if (answerTextEl) answerTextEl.textContent = question.opcoes[0] || "Verdadeiro"; // Usa opção ou fallback
                    button.style.display = 'flex'; // Garante que está visível
                } else if (index === 1) {
                    if (answerTextEl) answerTextEl.textContent = question.opcoes[1] || "Falso"; // Usa opção ou fallback
                    button.style.display = 'flex'; // Garante que está visível
                } else {
                    // Esconde os botões C e D
                    button.style.display = 'none';
                }
            });
        } else {
            // É Múltipla Escolha (comportamento padrão)
            answerButtons.forEach((button, index) => {
                const answerTextEl = button.querySelector('.answer-text');
                // Adiciona verificação se answerTextEl existe
                if (answerTextEl) {
                    // Usa a opção OU um texto de placeholder se a opção específica estiver faltando
                    answerTextEl.textContent = question.opcoes[index] !== undefined ? question.opcoes[index] : `Opção ${index + 1}?`;
                }
                button.style.display = 'flex'; // Garante que todos estão visíveis
            });
        }
        // --- FIM DA LÓGICA ATUALIZADA ---

        setTimeout(() => narrarPergunta(question), 250);
    }

     // --- NOVA FUNÇÃO AUXILIAR ---
     function showErrorAndSkip(message) {
         // Idealmente, mostraria isso em um toast ou modal
         console.error(message);
         // alert(message); // Evitar alert se possível, mas pode usar para debug
         currentQuestionIndex++; // Pula a pergunta atual
         // Atraso antes de tentar mostrar a próxima, para o usuário (ou dev) ver o erro
         setTimeout(displayQuestion, 1500);
     }
     // --- FIM NOVA FUNÇÃO ---


    async function handleAnswerClick(e) {
        if (narracaoAtivada) {
            speechSynthesis.cancel();
            btnReplayAudio.classList.add('hidden');
            // Restaura o volume da música
            if (audioEl) audioEl.volume = 1.0;
        }

        const selectedButton = e.currentTarget;
        const selectedIndex = parseInt(selectedButton.dataset.index);

        const item = currentTask.perguntas[currentQuestionIndex];
         // Adiciona verificação extra aqui também, embora displayQuestion já verifique
         if (!item || !item.pergunta || item.pergunta.opcaoCorreta === undefined) {
             console.error("Erro crítico ao processar resposta: dados da pergunta inválidos.", item);
             showErrorAndSkip("Erro ao processar sua resposta. Pulando pergunta...");
             return;
         }
        const question = item.pergunta;

        const correctIndex = question.opcaoCorreta;
        const acertou = selectedIndex === correctIndex;

        answerButtons.forEach(btn => btn.disabled = true);

        if (acertou) {
            selectedButton.classList.add('correct');
            score += 100;
            scoreDisplayEl.textContent = score;

            // --- ADICIONADO ---
            correctSound.play().catch(e => console.warn("Não foi possível tocar som de acerto:", e));


        } else {
            selectedButton.classList.add('incorrect');
            // Garante que o botão correto existe antes de adicionar a classe
            if (answerButtons[correctIndex]) {
                 answerButtons[correctIndex].classList.add('correct');
            }


            // --- ADICIONADO ---
            incorrectSound.play().catch(e => console.warn("Não foi possível tocar som de erro:", e));

        }

        await salvarProgressoNoBackend(question._id, selectedIndex, acertou, score);

        setTimeout(nextQuestion, 2000);
    }

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentTask.perguntas.length) {
            displayQuestion();
        } else {
            showResults();
        }
    }

    function showResults() {
        speechSynthesis.cancel();
        // Para a música de fundo
        if (audioEl) audioEl.pause();

        gameScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');

        finalScoreEl.textContent = score;
        const totalQuestions = currentTask.perguntas.length;
        // Calcula acertos com base na pontuação (mais robusto que contar respostas certas)
        const correctAnswers = Math.max(0, Math.floor(score / 100)); // Evita negativos


        let finalMessage = "";
        if (totalQuestions === 0) { // Caso não haja perguntas
             finalMessage = "Esta tarefa não tinha perguntas!";
        } else if (correctAnswers === totalQuestions) {
            finalMessage = "Incrível! Você acertou todas!";
        } else if (correctAnswers >= Math.ceil(totalQuestions / 2)) { // >= metade arredondada pra cima
            finalMessage = `Muito bem! Você acertou ${correctAnswers} de ${totalQuestions}.`;
        } else {
            finalMessage = `Continue tentando! Você acertou ${correctAnswers} de ${totalQuestions}.`;
        }
        finalMessageEl.textContent = finalMessage;

        // Narra o resultado final (se ativado)
        if (narracaoAtivada) {
             const textoResultado = `Fim de jogo! Sua pontuação final foi ${score}. ${finalMessage}`;
             // Checa se já não está falando antes de iniciar nova narração
             if (!speechSynthesis.speaking) {
                const utterance = new SpeechSynthesisUtterance(textoResultado);
                utterance.lang = 'pt-BR';
                utterance.rate = 0.9;
                const vozPreferida = vozesPt.find(v => v.lang === 'pt-BR');
                if (vozPreferida) utterance.voice = vozPreferida;
                speechSynthesis.speak(utterance);
             }
        }
    }

    async function salvarProgressoNoBackend(perguntaId, respostaIndex, acertou, pontuacaoAtual) {
        // Usa salaId global, não mais da tarefa (que pode não ter)
        if (!salaId) {
            console.error("ERRO CRÍTICO: salaId não encontrado para salvar progresso.");
            return;
        }

        try {
            const response = await fetch(`/api/game/salas/${salaId}/tarefas/${currentTask._id}/progresso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alunoId,
                    perguntaId,
                    respostaIndex,
                    acertou,
                    pontuacaoAtual
                })
            });
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({})); // Tenta pegar erro do backend
                 throw new Error(errorData.message || `Falha ao salvar o progresso (Status: ${response.status}).`);
            }
            console.log("Progresso salvo!");
        } catch (error) {
            console.error("Erro ao salvar o progresso:", error);
            // Poderia mostrar um toast para o usuário aqui
        }
    }

    // --- EVENT LISTENERS ---
    answerButtons.forEach(button => button.addEventListener('click', handleAnswerClick));
    btnVoltarTarefas.addEventListener('click', () => window.location.href = '/tarefas');

    // ATUALIZADO: Listener do botão Voltar (sem o confirm)
    btnVoltar.addEventListener('click', () => {
        speechSynthesis.cancel();
        if (audioEl) audioEl.pause();
        window.location.href = '/tarefas';
    });

    btnReplayAudio.addEventListener('click', () => {
        // Verifica se currentQuestionObject é válido antes de narrar
        if (currentQuestionObject) {
            narrarPergunta(currentQuestionObject);
        } else {
             console.warn("Tentativa de renarrar pergunta nula.");
        }
    });

    // --- INICIALIZAÇÃO ---
    // Adiciona try...catch em volta do startGame para pegar erros iniciais
    try {
        startGame();
    } catch (e) {
        console.error("Erro fatal ao iniciar o jogo:", e);
        alert("Ocorreu um erro inesperado ao carregar o jogo. Tente novamente mais tarde.");
        // Redireciona para a página anterior ou de tarefas
        window.location.href = '/tarefas';
    }

});
