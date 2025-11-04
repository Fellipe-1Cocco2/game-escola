// script/jogo-mat-alf.js (Matemática - Alfabetização) - CONTEÚDO AMPLIADO

const numerosDropEl = document.getElementById('numeros-container-drop');
const numerosOrigemEl = document.getElementById('numeros-origem');
const verificarBtn = document.getElementById('verificar-btn');
const feedbackEl = document.getElementById('feedback');
const placarEl = document.getElementById('placar-ordem');

let arrayCorreto = [];
let pontuacao = 0;
let dificuldadeAtual = 0;

// NOVO: Função para determinar o nível de dificuldade
function getNivel() {
    let max = 10;
    let range = 20; // Números entre 1 e 20
    let tamanho = 3;
    let pts = 10;

    if (pontuacao >= 150) { // Nível Avançado
        max = 30; // 5-8 números
        range = 1000; // Números até 1000
        tamanho = Math.floor(Math.random() * 4) + 5; // 5 a 8 números
        pts = 30;
    } else if (pontuacao >= 50) { // Nível Intermediário
        max = 20; // 4-6 números
        range = 100; // Números até 100
        tamanho = Math.floor(Math.random() * 3) + 4; // 4 a 6 números
        pts = 20;
    } else { // Nível Iniciante
        tamanho = Math.floor(Math.random() * 3) + 3; // 3 a 5 números
        pts = 10;
    }
    
    dificuldadeAtual = pts; // Salva o valor da pontuação para exibir

    return { tamanho, range, pts };
}

function gerarProblema() {
    const { tamanho, range } = getNivel();
    let numeros = [];
    
    for (let i = 0; i < tamanho; i++) {
        let novoNumero;
        do {
            // Gera números baseados no range de dificuldade
            novoNumero = Math.floor(Math.random() * range) + 1; 
        } while (numeros.includes(novoNumero) || novoNumero <= 0); 
        numeros.push(novoNumero);
    }
    
    arrayCorreto = [...numeros].sort((a, b) => a - b);
    return numeros; 
}

function iniciarJogo() {
    const numerosParaArrastar = gerarProblema();
    
    numerosDropEl.innerHTML = '';
    numerosOrigemEl.innerHTML = '';
    feedbackEl.textContent = `Arraste e coloque os ${arrayCorreto.length} números em ordem crescente. Vale ${dificuldadeAtual} pontos!`;
    feedbackEl.className = 'feedback-message';
    verificarBtn.textContent = 'Verificar Ordem';
    verificarBtn.onclick = verificarResposta;
    placarEl.textContent = `Pontos: ${pontuacao}`;

    // Cria os slots de drop
    for (let i = 0; i < arrayCorreto.length; i++) {
        const dropSlot = document.createElement('div');
        dropSlot.className = 'numero-drop-slot';
        dropSlot.setAttribute('data-index', i);
        numerosDropEl.appendChild(dropSlot);
    }

    // Cria os números arrastáveis
    numerosParaArrastar.forEach((numero, index) => {
        const numeroDiv = document.createElement('div');
        numeroDiv.className = 'numero-arrastavel';
        numeroDiv.draggable = true;
        numeroDiv.textContent = numero;
        numeroDiv.id = `numero-${index}`;
        numerosOrigemEl.appendChild(numeroDiv);
    });

    adicionarEventosDragDropNumeros();
}

function adicionarEventosDragDropNumeros() {
    // ... (lógica de drag and drop permanece a mesma) ...
    const numeros = document.querySelectorAll('.numero-arrastavel');
    const dropSlots = document.querySelectorAll('.numero-drop-slot');

    numeros.forEach(numero => {
        numero.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/id', e.target.id);
            e.target.classList.add('arrastando');
        });
        numero.addEventListener('dragend', (e) => {
            e.target.classList.remove('arrastando');
        });
    });

    dropSlots.forEach(slot => {
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            slot.classList.add('hover');
        });
        slot.addEventListener('dragleave', () => {
            slot.classList.remove('hover');
        });
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('hover');
            
            const idNumero = e.dataTransfer.getData('text/id');
            const numeroArrastado = document.getElementById(idNumero);

            if (!numeroArrastado) return;

            const numeroExistente = slot.querySelector('.numero-arrastavel');
            if (numeroExistente) {
                numerosOrigemEl.appendChild(numeroExistente);
            }
            
            slot.appendChild(numeroArrastado);
        });
    });

    numerosOrigemEl.addEventListener('dragover', (e) => { e.preventDefault(); numerosOrigemEl.classList.add('hover-return'); });
    numerosOrigemEl.addEventListener('dragleave', () => { numerosOrigemEl.classList.remove('hover-return'); });
    numerosOrigemEl.addEventListener('drop', (e) => {
        e.preventDefault();
        numerosOrigemEl.classList.remove('hover-return');
        const idNumero = e.dataTransfer.getData('text/id');
        const numeroArrastado = document.getElementById(idNumero);
        
        if (numeroArrastado) {
            numerosOrigemEl.appendChild(numeroArrastado);
        }
    });
}

function verificarResposta() {
    const dropSlots = document.querySelectorAll('.numero-drop-slot');
    let respostaDoAluno = [];
    let todosSlotsPreenchidos = true;
    
    dropSlots.forEach(slot => {
        const numeroEl = slot.querySelector('.numero-arrastavel');
        if (numeroEl) {
            respostaDoAluno.push(parseInt(numeroEl.textContent));
        } else {
            todosSlotsPreenchidos = false;
        }
    });

    if (!todosSlotsPreenchidos) {
        feedbackEl.textContent = `Atenção: Preencha todos os ${arrayCorreto.length} espaços!`;
        feedbackEl.className = 'feedback-message info';
        return;
    }

    const acertou = arrayCorreto.every((val, index) => val === respostaDoAluno[index]);

    if (acertou) {
        feedbackEl.textContent = `🎉 Perfeito! A ordem está correta! Você ganhou ${dificuldadeAtual} pontos!`;
        feedbackEl.className = 'feedback-message success';
        pontuacao += dificuldadeAtual;
        placarEl.textContent = `Pontos: ${pontuacao}`;
        verificarBtn.textContent = 'Próximo Desafio';
        verificarBtn.onclick = iniciarJogo;
    } else {
        feedbackEl.textContent = `Ops! A ordem não está correta. Tente de novo!`;
        feedbackEl.className = 'feedback-message error';
    }
}

iniciarJogo();