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

        btnReplayAudio.classList.add('hidden');
        speechSynthesis.cancel();

        // Baixa o volume da música para a narração
        if (audioEl) audioEl.volume = 0.2;

        const textoParaFalar = [
            question.texto,
            `Alternativa A: ${question.opcoes[0]}`,
            `Alternativa B: ${question.opcoes[1]}`,
            `Alternativa C: ${question.opcoes[2]}`,
            `Alternativa D: ${question.opcoes[3]}`
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
        currentTask = JSON.parse(taskString);

        if (!currentTask.perguntas || currentTask.perguntas.length === 0 || !currentTask.perguntas[0].pergunta) {
            alert('Erro: Esta tarefa não tem perguntas válidas. Avise o professor.');
            window.location.href = '/tarefas'; 
            return;
        }
        
        // ... (lógica de progresso) ...
        const progresso = currentTask.progressos ? currentTask.progressos.find(p => p.alunoId === alunoId) : null;
        if (progresso) {
            score = progresso.pontuacao || 0;
            currentQuestionIndex = progresso.respostas.length; 
            scoreDisplayEl.textContent = score;
        }
        
        if (progresso && progresso.status === 'concluido') {
            alert('Você já concluiu esta tarefa!');
            window.location.href = '/tarefas';
            return;
        }

        // --- INICIA MÚSICA (se selecionada) ---
        if (musicaSelecionada !== 'nenhuma' && audioEl) {
            audioEl.src = musicPaths[musicaSelecionada];
            // Tenta tocar a música (pode falhar por política de autoplay do browser)
            audioEl.play().catch(e => console.warn("Autoplay da música bloqueado pelo navegador."));
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
        const question = item.pergunta;
        currentQuestionObject = question;

        taskTitleEl.textContent = currentTask.titulo;
        questionCounterEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentTask.perguntas.length}`;
        questionTextEl.textContent = question.texto;
        
        answerButtons.forEach((button, index) => {
            button.querySelector('.answer-text').textContent = question.opcoes[index];
        });
        
        setTimeout(() => narrarPergunta(question), 250);
    }

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
        const question = item.pergunta; 
        
        const correctIndex = question.opcaoCorreta;
        const acertou = selectedIndex === correctIndex;

        answerButtons.forEach(btn => btn.disabled = true);

        if (acertou) {
            selectedButton.classList.add('correct');
            score += 100;
            scoreDisplayEl.textContent = score;
            
            // --- ADICIONADO ---
            correctSound.play(); 

        } else {
            selectedButton.classList.add('incorrect');
            answerButtons[correctIndex].classList.add('correct');

            // --- ADICIONADO ---
            incorrectSound.play();
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
        const correctAnswers = score / 100;

        let finalMessage = "";
        if (correctAnswers === totalQuestions) {
            finalMessage = "Incrível! Você acertou todas!";
        } else if (correctAnswers > totalQuestions / 2) {
            finalMessage = `Muito bem! Você acertou ${correctAnswers} de ${totalQuestions}.`;
        } else {
            finalMessage = `Continue tentando! Você acertou ${correctAnswers} de ${totalQuestions}.`;
        }
        finalMessageEl.textContent = finalMessage;
        
        // Narra o resultado final (se ativado)
        if (narracaoAtivada) {
            const utterance = new SpeechSynthesisUtterance(`Fim de jogo! Sua pontuação final foi ${score}. ${finalMessage}`);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9;
            const vozPreferida = vozesPt.find(v => v.lang === 'pt-BR');
            if (vozPreferida) utterance.voice = vozPreferida;
            speechSynthesis.speak(utterance);
        }
    }

    async function salvarProgressoNoBackend(perguntaId, respostaIndex, acertou, pontuacaoAtual) {
        const salaIdDoAluno = currentTask.salaId; 
        if (!salaIdDoAluno) {
            console.error("ERRO CRÍTICO: salaId não encontrado.");
            return;
        }

        try {
            const response = await fetch(`/api/game/salas/${salaIdDoAluno}/tarefas/${currentTask._id}/progresso`, {
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
            if (!response.ok) throw new Error('Falha ao salvar o progresso.');
            console.log("Progresso salvo!");
        } catch (error) {
            console.error("Erro ao salvar o progresso:", error);
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
        narrarPergunta(currentQuestionObject);
    });

    // Inicia o Jogo
    startGame();
});