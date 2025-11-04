// script/jogo-mat-let.js (Matemática - Letramento) - CONTEÚDO AMPLIADO

const campoInicial = document.getElementById('campo-inicial');
const campoFinal = document.getElementById('campo-final');
const problemaEl = document.getElementById('problema');
const verificarBtn = document.getElementById('verificar-btn');
const feedbackEl = document.getElementById('feedback');
const placarEl = document.getElementById('placar-capivara');
const capivarasContadorEl = document.getElementById('numero-capivaras');

let respostaCerta = 0;
let pontuacao = 0;
let ptsGanhos = 0; // Pontos ganhos na rodada

// NOVO: Função para determinar o tipo de operação e a dificuldade
function getNivelDificuldade() {
    let max = 5;
    let operacao = '+'; // Padrão é Soma
    let pts = 10;

    if (pontuacao >= 150) { // Nível Avançado (Multiplicação ou Soma Grande)
        if (Math.random() < 0.5) {
            operacao = 'x'; // 50% chance de Multiplicação
            max = 5; // Max 5 x 5
            pts = 30;
        } else {
            max = 12; // Soma até 12 + 12
            operacao = '+';
            pts = 25;
        }
    } else if (pontuacao >= 50) { // Nível Intermediário (Subtração)
        operacao = '-'; // Subtração
        max = 10;
        pts = 20;
    } else { // Nível Iniciante (Soma simples)
        operacao = '+';
        max = 8;
        pts = 10;
    }

    return { max, operacao, pts };
}

function novoProblema() {
    const { max, operacao, pts } = getNivelDificuldade();
    ptsGanhos = pts;

    campoInicial.innerHTML = '';
    campoFinal.innerHTML = '';
    feedbackEl.textContent = `Arraste o número de capivaras que corresponde à resposta. Vale ${pts} pontos!`;
    feedbackEl.className = 'feedback-message';
    verificarBtn.disabled = false;
    
    let num1, num2;

    switch (operacao) {
        case '+':
            num1 = Math.floor(Math.random() * max) + 1;
            num2 = Math.floor(Math.random() * max) + 1;
            respostaCerta = num1 + num2;
            problemaEl.textContent = `${num1} + ${num2} = ?`;
            break;
        case '-':
            num1 = Math.floor(Math.random() * max) + 1;
            num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // Garante que a resposta seja > 0
            respostaCerta = num1 - num2;
            problemaEl.textContent = `${num1} - ${num2} = ?`;
            break;
        case 'x':
            num1 = Math.floor(Math.random() * (max - 2)) + 2; // 2 a max
            num2 = Math.floor(Math.random() * (max - 2)) + 2;
            respostaCerta = num1 * num2;
            problemaEl.textContent = `${num1} x ${num2} = ?`;
            break;
    }

    if (respostaCerta <= 0) return novoProblema(); 

    placarEl.textContent = `Pontos: ${pontuacao}`;
    capivarasContadorEl.textContent = '0';

    // O total de capivaras é o maior possível para a resposta.
    const maxCapivaras = (operacao === 'x') ? 25 : 20; // Limite capivara sprite
    const totalCapivaras = Math.max(respostaCerta + 5, maxCapivaras); 
    
    for (let i = 0; i < totalCapivaras; i++) {
        const capivara = document.createElement('div');
        capivara.classList.add('capivara-sprite'); 
        capivara.draggable = true;
        capivara.id = 'capivara-' + i;
        campoInicial.appendChild(capivara);
    }
    
    adicionarEventosDragDropCapivaras();
}

function atualizarContador() {
    capivarasContadorEl.textContent = campoFinal.children.length;
}

function adicionarEventosDragDropCapivaras() {
    // ... (lógica de drag and drop permanece a mesma) ...
    const capivaras = document.querySelectorAll('.capivara-sprite');
    const zonasDrop = document.querySelectorAll('.zona-drop-mat');

    capivaras.forEach(capivara => {
        capivara.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.id);
            e.target.classList.add('arrastando');
        });
        
        capivara.addEventListener('dragend', (e) => {
            e.target.classList.remove('arrastando');
        });
    });

    zonasDrop.forEach(zona => {
        zona.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            zona.classList.add('hover-drop');
        });

        zona.addEventListener('dragleave', (e) => {
            zona.classList.remove('hover-drop');
        });

        zona.addEventListener('drop', (e) => {
            e.preventDefault();
            zona.classList.remove('hover-drop');
            const id = e.dataTransfer.getData('text/plain'); 
            const elementoArrastado = document.getElementById(id);
            
            if(elementoArrastado && elementoArrastado.classList.contains('capivara-sprite')) {
               zona.appendChild(elementoArrastado);
               atualizarContador();
            }
        });
    });
}

verificarBtn.addEventListener('click', () => {
    verificarBtn.disabled = true;
    const numeroDeCapivarasNoFinal = campoFinal.children.length;

    if (numeroDeCapivarasNoFinal === respostaCerta) {
        feedbackEl.textContent = `🎉 Correto! Você ganhou ${ptsGanhos} pontos!`;
        feedbackEl.className = 'feedback-message success';
        
        pontuacao += ptsGanhos;
        placarEl.textContent = `Pontos: ${pontuacao}`;
        
        campoFinal.classList.add('acerto');
        setTimeout(() => campoFinal.classList.remove('acerto'), 1000);

        verificarBtn.textContent = 'Próximo Desafio';
        verificarBtn.onclick = novoProblema;
        verificarBtn.disabled = false;
    } else {
        feedbackEl.textContent = `❌ Ops! Você colocou ${numeroDeCapivarasNoFinal}, tente de novo.`;
        feedbackEl.className = 'feedback-message error';
        
        campoFinal.classList.add('erro');
        setTimeout(() => campoFinal.classList.remove('erro'), 500);
        verificarBtn.disabled = false;
    }
});


novoProblema();