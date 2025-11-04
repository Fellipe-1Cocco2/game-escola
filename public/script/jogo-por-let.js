// script/jogo-por-let.js (Português - Letramento) - CONTEÚDO AMPLIADO

const imagensContainer = document.getElementById('imagens-container');
const palavrasContainer = document.getElementById('palavras-container');
const verificarBtn = document.getElementById('verificar-btn');
const feedbackEl = document.getElementById('feedback');
const placarEl = document.getElementById('placar-por');

let pontuacao = 0;
let itensAtuais = []; // Para armazenar o subconjunto do jogo

// --- BANCO DE DADOS AMPLIADO (30 ITENS) ---
const BANCO_COMPLETO = [
    { imagem: '🐈', palavra: 'GATO' },
    { imagem: '☀️', palavra: 'SOL' },
    { imagem: '🍎', palavra: 'MAÇÃ' },
    { imagem: '⚽', palavra: 'BOLA' },
    { imagem: '💻', palavra: 'NOTEBOOK' },
    { imagem: '🚗', palavra: 'CARRO' },
    { imagem: '🌳', palavra: 'ÁRVORE' },
    { imagem: '🏠', palavra: 'CASA' },
    { imagem: '🌊', palavra: 'MAR' },
    { imagem: '🌙', palavra: 'LUA' },
    { imagem: '⭐', palavra: 'ESTRELA' },
    { imagem: '⏰', palavra: 'RELÓGIO' },
    { imagem: '📱', palavra: 'CELULAR' },
    { imagem: '🔑', palavra: 'CHAVE' },
    { imagem: '📘', palavra: 'LIVRO' },
    { imagem: '🧀', palavra: 'QUEIJO' },
    { imagem: '🍄', palavra: 'COGUMELO' },
    { imagem: '🚲', palavra: 'BICICLETA' },
    { imagem: '👑', palavra: 'COROA' },
    { imagem: '✉️', palavra: 'CARTA' },
    { imagem: '🧊', palavra: 'GELO' },
    { imagem: '🦒', palavra: 'GIRAFA' },
    { imagem: '🍇', palavra: 'UVA' },
    { imagem: '🎸', palavra: 'VIOLÃO' },
    { imagem: '🎈', palavra: 'BALÃO' },
    { imagem: '☔', palavra: 'GUARDA-CHUVA' },
    { imagem: '🖱️', palavra: 'MOUSE' },
    { imagem: '🪑', palavra: 'CADEIRA' },
    { imagem: '🍕', palavra: 'PIZZA' },
    { imagem: '🔥', palavra: 'FOGO' },
    { imagem: '🚪', palavra: 'PORTA' },
    { imagem: '🪟', palavra: 'JANELA' },
    { imagem: '🧦', palavra: 'MEIA' },
    { imagem: '🧤', palavra: 'LUVA' },
    { imagem: '🧣', palavra: 'CACHECOL' },
    { imagem: '🎩', palavra: 'CHAPÉU' },
    { imagem: '👓', palavra: 'ÓCULOS' },
    { imagem: '👟', palavra: 'TÊNIS' },
    { imagem: '🩳', palavra: 'SHORTS' },
    { imagem: '👕', palavra: 'CAMISA' },
    { imagem: '👖', palavra: 'CALÇA' },
    { imagem: '👗', palavra: 'VESTIDO' },
    { imagem: '🧥', palavra: 'CASACO' },
    { imagem: '🧳', palavra: 'MALA' },
    { imagem: '☂️', palavra: 'SOMBRINHA' },
    { imagem: '🧱', palavra: 'TIJOLO' },
    { imagem: '🪜', palavra: 'ESCADA' },
    { imagem: '💡', palavra: 'LÂMPADA' },
    { imagem: '🔌', palavra: 'TOMADA' },
    { imagem: '🚽', palavra: 'VASO' },
    { imagem: '🚿', palavra: 'CHUVEIRO' },
    { imagem: '🛁', palavra: 'BANHEIRA' },
    { imagem: '🧼', palavra: 'SABÃO' },
    { imagem: '🪥', palavra: 'ESCOVA' },
    { imagem: '🧺', palavra: 'CESTA' },
    { imagem: '✂️', palavra: 'TESOURA' },
    { imagem: '📌', palavra: 'ALFINETE' },
    { imagem: '🪡', palavra: 'AGULHA' },
    { imagem: '🧵', palavra: 'LINHA' },
    { imagem: '🖼️', palavra: 'QUADRO' },
    { imagem: '🧱', palavra: 'PAREDE' },
    { imagem: '🛏️', palavra: 'CAMA' },
    { imagem: '🧺', palavra: 'ROUPA' },
    { imagem: '🧴', palavra: 'SHAMPOO' },
    { imagem: '🪞', palavra: 'ESPELHO' },
    { imagem: '🪑', palavra: 'BANCO' },
    { imagem: '🖊️', palavra: 'CANETA' },
    { imagem: '✏️', palavra: 'LÁPIS' },
    { imagem: '🖍️', palavra: 'GIZ' },
    { imagem: '📏', palavra: 'RÉGUA' },
    { imagem: '📐', palavra: 'ESQUADRO' },
    { imagem: '📦', palavra: 'CAIXA' },
    { imagem: '🪙', palavra: 'MOEDA' },
    { imagem: '💎', palavra: 'DIAMANTE' },
    { imagem: '🔔', palavra: 'SINO' },
    { imagem: '🎁', palavra: 'PRESENTE' },
    { imagem: '💡', palavra: 'IDEIA' },
];

function embaralhar(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// NOVO: Seleciona um subconjunto de 8 a 12 itens
function selecionarItens(maxItens) {
    const numItens = Math.min(BANCO_COMPLETO.length, Math.floor(Math.random() * (maxItens - 8 + 1)) + 8);

    // Embaralha o banco completo e pega os primeiros 'numItens'
    return embaralhar([...BANCO_COMPLETO]).slice(0, numItens);
}

function iniciarJogo() {
    itensAtuais = selecionarItens(12);

    feedbackEl.textContent = `Associe as palavras: Arraste ou Clique para mover. (${itensAtuais.length} pares)`;
    feedbackEl.className = 'feedback-message';
    imagensContainer.innerHTML = '';
    palavrasContainer.innerHTML = '';
    verificarBtn.textContent = 'Verificar';
    verificarBtn.onclick = verificarResposta;
    
    placarEl.textContent = `Pontos: ${pontuacao}`;
    elementoSelecionado = null;

    const dadosEmbaralhados = embaralhar([...itensAtuais]);
    const palavrasEmbaralhadas = embaralhar([...itensAtuais]);
    
    dadosEmbaralhados.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-imagem';
        itemDiv.innerHTML = `
            <div class="imagem">${item.imagem}</div>
            <div class="zona-drop" data-palavra-correta="${item.palavra}">
                <p class="placeholder">Solte aqui</p>
            </div>
        `;
        imagensContainer.appendChild(itemDiv);
    });

    palavrasEmbaralhadas.forEach(item => {
        const palavraDiv = document.createElement('div');
        palavraDiv.className = 'palavra';
        // É essencial que ele seja arrastável (para o Drag-and-Drop)
        palavraDiv.draggable = true; 
        palavraDiv.textContent = item.palavra;
        palavraDiv.id = `palavra-${item.palavra}`;
        palavrasContainer.appendChild(palavraDiv);
    });
    
    adicionarEventosHibridos(); // Chama a lógica híbrida
}

// ------------------------------------------------------------------
// LÓGICA DE EVENTOS HÍBRIDOS (ARRSTAR + CLICAR)
// ------------------------------------------------------------------
function adicionarEventosHibridos() {
    const palavras = document.querySelectorAll('.palavra');
    const zonasDrop = document.querySelectorAll('.zona-drop');

    // 1. Lógica de CLIQUE/ARRASAR na Palavra (Origem)
    palavras.forEach(palavra => {
        // Evento de CLIQUE para Seleção.
        palavra.addEventListener('click', (e) => {
            if (elementoSelecionado) {
                elementoSelecionado.classList.remove('selecionada');
            }
            if (elementoSelecionado === e.currentTarget) {
                elementoSelecionado = null;
                return;
            }
            elementoSelecionado = e.currentTarget;
            elementoSelecionado.classList.add('selecionada');
        });

        // Evento Drag-and-Drop: Início do Arrastar
        palavra.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/id', e.target.id);
            e.target.classList.add('arrastando');
            // Desseleciona ao arrastar para não confundir
            if (elementoSelecionado === e.target) {
                 elementoSelecionado.classList.remove('selecionada');
                 elementoSelecionado = null;
            }
        });
        palavra.addEventListener('dragend', (e) => {
            e.target.classList.remove('arrastando');
        });
    });

    // 2. Lógica de DROP e CLIQUE-PARA-SOLTAR na Zona Alvo
    zonasDrop.forEach(zona => {
        // Evento de CLIQUE para Soltar.
        zona.addEventListener('click', (e) => {
            if (elementoSelecionado) {
                const zonaTarget = e.currentTarget;

                // Move palavra existente (se houver) de volta para o container
                const palavraExistente = zonaTarget.querySelector('.palavra');
                if (palavraExistente) {
                    palavraExistente.classList.remove('acerto', 'erro');
                    palavrasContainer.appendChild(palavraExistente);
                }

                const placeholder = zonaTarget.querySelector('.placeholder');
                if(placeholder) placeholder.remove();
                
                zonaTarget.appendChild(elementoSelecionado);
                elementoSelecionado.classList.remove('selecionada');
                elementoSelecionado = null;
            } else if (e.currentTarget.querySelector('.palavra')) {
                // Permite selecionar a palavra que já está na zona
                e.currentTarget.querySelector('.palavra').click();
            }
        });
        
        // Eventos Drag-and-Drop: Drag Over e Drop (Permanece)
        zona.addEventListener('dragover', (e) => {
            e.preventDefault();
            zona.classList.add('hover');
        });
        zona.addEventListener('dragleave', () => {
            zona.classList.remove('hover');
        });
        zona.addEventListener('drop', (e) => {
            e.preventDefault();
            zona.classList.remove('hover');
            
            const idPalavra = e.dataTransfer.getData('text/id');
            const palavraArrastada = document.getElementById(idPalavra);
            if (!palavraArrastada) return;

            // Se o Drag-and-Drop for usado, o clique é ignorado aqui, mas o elemento é movido
            const palavraExistente = zona.querySelector('.palavra');
            if (palavraExistente) {
                palavrasContainer.appendChild(palavraExistente);
            }
            const placeholder = zona.querySelector('.placeholder');
            if(placeholder) placeholder.remove();
            zona.appendChild(palavraArrastada);
        });
    });

    // 3. Lógica de CLIQUE no Container de Origem (Para devolver itens)
    palavrasContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('palavra')) return; 

        if (elementoSelecionado) {
            elementoSelecionado.classList.remove('acerto', 'erro');
            elementoSelecionado.classList.remove('selecionada');
            palavrasContainer.appendChild(elementoSelecionado);
            elementoSelecionado = null;
        }
    });
}

function verificarResposta() {
    const zonasDrop = document.querySelectorAll('.zona-drop');
    let acertos = 0;
    // ... (restante da lógica de verificação e pontuação permanece igual) ...

    zonasDrop.forEach(zona => {
        const palavraCorreta = zona.getAttribute('data-palavra-correta');
        const palavraNaZona = zona.querySelector('.palavra');
        
        if (palavraNaZona) {
            palavraNaZona.classList.remove('acerto', 'erro', 'selecionada'); // Remove a seleção
        }

        if (palavraNaZona && palavraNaZona.textContent === palavraCorreta) {
            acertos++;
            palavraNaZona.classList.add('acerto'); 
        } else if (palavraNaZona) {
             palavraNaZona.classList.add('erro'); 
        }
    });

    if (acertos === itensAtuais.length) {
        feedbackEl.textContent = `🥳 Perfeito! Você acertou todos os ${itensAtuais.length} pares!`;
        feedbackEl.className = 'feedback-message success';
        pontuacao += itensAtuais.length * 2; 
        placarEl.textContent = `Pontos: ${pontuacao}`;
        verificarBtn.textContent = 'Próximo Desafio';
        verificarBtn.onclick = iniciarJogo;
    } else {
        feedbackEl.textContent = `🤔 Você acertou ${acertos} de ${itensAtuais.length}. Tente de novo!`;
        feedbackEl.className = 'feedback-message error';
    }
}

iniciarJogo();