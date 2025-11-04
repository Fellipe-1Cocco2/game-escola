// script/jogo-por-alf.js (Português - Alfabetização) - CONTEÚDO AMPLIADO

const palavraAlvoEl = document.getElementById('palavra-alvo');
const silabasDropEl = document.getElementById('silabas-container-drop');
const silabasOrigemEl = document.getElementById('silabas-origem');
const verificarBtn = document.getElementById('verificar-btn');
const feedbackEl = document.getElementById('feedback');
const placarEl = document.getElementById('placar-alf');

let palavraCorreta = '';
let pontuacao = 0;

// --- BANCO DE DADOS AMPLIADO (Organizado por número de sílabas) ---
const BANCO_COMPLETO = {
    nivel2: [ // 2 Sílabas (Iniciante)
        { palavra: 'GATO', silabas: ['GA', 'TO'] },
        { palavra: 'BOLA', silabas: ['BO', 'LA'] },
        { palavra: 'PATO', silabas: ['PA', 'TO'] },
        { palavra: 'FACA', silabas: ['FA', 'CA'] },
        { palavra: 'VACA', silabas: ['VA', 'CA'] },
        { palavra: 'RATO', silabas: ['RA', 'TO'] },
        { palavra: 'COPO', silabas: ['CO', 'PO'] },
        { palavra: 'MESA', silabas: ['ME', 'SA'] },
        { palavra: 'DADO', silabas: ['DA', 'DO'] },
        { palavra: 'LUVA', silabas: ['LU', 'VA'] },
        { palavra: 'BICO', silabas: ['BI', 'CO'] },
        { palavra: 'SAPO', silabas: ['SA', 'PO'] },
        { palavra: 'GELO', silabas: ['GE', 'LO'] },
        { palavra: 'LUAR', silabas: ['LU', 'AR'] },
        { palavra: 'MULA', silabas: ['MU', 'LA'] },
        { palavra: 'PENA', silabas: ['PE', 'NA'] },
        { palavra: 'CAFE', silabas: ['CA', 'FE'] },
        { palavra: 'SUCO', silabas: ['SU', 'CO'] },
        { palavra: 'FOGO', silabas: ['FO', 'GO'] },
        { palavra: 'SELO', silabas: ['SE', 'LO'] },
        { palavra: 'BOTO', silabas: ['BO', 'TO'] },
        { palavra: 'PIPA', silabas: ['PI', 'PA'] },
        { palavra: 'LEAO', silabas: ['LE', 'ÃO'] },
        { palavra: 'VIDA', silabas: ['VI', 'DA'] },
        { palavra: 'MEIO', silabas: ['ME', 'IO'] },
        { palavra: 'VOVO', silabas: ['VO', 'VÓ'] },
        { palavra: 'AVO', silabas: ['A', 'VÔ'] },
        { palavra: 'CHAO', silabas: ['CHÃO', ''] }, // 1 sílaba, mas mantido aqui para simplificar a seleção
        { palavra: 'CHAVE', silabas: ['CHA', 'VE'] },
        { palavra: 'BOLHA', silabas: ['BO', 'LHA'] },
        { palavra: 'PLACA', silabas: ['PLA', 'CA'] },
        { palavra: 'BROA', silabas: ['BRO', 'A'] },
    ],
    nivel3: [ // 3 Sílabas (Intermediário)
        { palavra: 'MACACO', silabas: ['MA', 'CA', 'CO'] },
        { palavra: 'BANANA', silabas: ['BA', 'NA', 'NA'] },
        { palavra: 'PETECA', silabas: ['PE', 'TE', 'CA'] },
        { palavra: 'CANETA', silabas: ['CA', 'NE', 'TA'] },
        { palavra: 'CIDADE', silabas: ['CI', 'DA', 'DE'] },
        { palavra: 'PANELA', silabas: ['PA', 'NE', 'LA'] },
        { palavra: 'JACARÉ', silabas: ['JA', 'CA', 'RÉ'] },
        { palavra: 'TOMADA', silabas: ['TO', 'MA', 'DA'] },
        { palavra: 'JANELA', silabas: ['JA', 'NE', 'LA'] },
        { palavra: 'CADEIRA', silabas: ['CA', 'DEI', 'RA'] },
        { palavra: 'ESCOLA', silabas: ['ES', 'CO', 'LA'] },
        { palavra: 'FLAMINGO', silabas: ['FLA', 'MIN', 'GO'] },
        { palavra: 'GIRASSOL', silabas: ['GI', 'RAS', 'SOL'] },
        { palavra: 'PIRATA', silabas: ['PI', 'RA', 'TA'] },
        { palavra: 'CEBOLA', silabas: ['CE', 'BO', 'LA'] },
        { palavra: 'SAPATO', silabas: ['SA', 'PA', 'TO'] },
        { palavra: 'LAGARTO', silabas: ['LA', 'GAR', 'TO'] },
        { palavra: 'BORRACHA', silabas: ['BOR', 'RA', 'CHA'] },
        { palavra: 'CENOURA', silabas: ['CE', 'NOU', 'RA'] },
        { palavra: 'PRESENTE', silabas: ['PRE', 'SEN', 'TE'] },
        { palavra: 'MOCHILA', silabas: ['MO', 'CHI', 'LA'] },
        { palavra: 'CAMELO', silabas: ['CA', 'ME', 'LO'] },
        { palavra: 'VIOLAO', silabas: ['VI', 'O', 'LÃO'] },
        { palavra: 'RAIOX', silabas: ['RA', 'IO', 'X'] } // Exemplo mais complexo
    ],
    nivel4: [ // 4 Sílabas (Avançado)
        { palavra: 'TELEFONE', silabas: ['TE', 'LE', 'FO', 'NE'] },
        { palavra: 'BORBOLETA', silabas: ['BOR', 'BO', 'LE', 'TA'] },
        { palavra: 'ABACAXI', silabas: ['A', 'BA', 'CA', 'XI'] },
        { palavra: 'BICICLETA', silabas: ['BI', 'CI', 'CLE', 'TA'] },
        { palavra: 'CHOCOLATE', silabas: ['CHO', 'CO', 'LA', 'TE'] },
        { palavra: 'LUMINARIA', silabas: ['LU', 'MI', 'NA', 'RIA'] },
        { palavra: 'PIRULITO', silabas: ['PI', 'RU', 'LI', 'TO'] },
        { palavra: 'ABACATE', silabas: ['A', 'BA', 'CA', 'TE'] }, 
        { palavra: 'TARTARUGA', silabas: ['TAR', 'TA', 'RU', 'GA'] }, 
        { palavra: 'HIPOPOTAMO', silabas: ['HI', 'PO', 'PÓ', 'TA', 'MO'] }, 
        { palavra: 'GELADEIRA', silabas: ['GE', 'LA', 'DEI', 'RA'] },
        { palavra: 'ESCORREGADOR', silabas: ['ES', 'COR', 'RE', 'GA', 'DOR'] }, 
        { palavra: 'COMPUTADOR', silabas: ['COM', 'PU', 'TA', 'DOR'] },
        { palavra: 'PARALELEPIPEDO', silabas: ['PA', 'RA', 'LE', 'LE', 'PÍ', 'PE', 'DO'] }, 
        { palavra: 'DINOSSAURO', silabas: ['DI', 'NOS', 'SAU', 'RO'] },
        { palavra: 'ESTUDANTE', silabas: ['ES', 'TU', 'DAN', 'TE'] },
        { palavra: 'BICAMA', silabas: ['BI', 'CA', 'MA'] }, 
        { palavra: 'TELEVISAO', silabas: ['TE', 'LE', 'VI', 'SÃO'] },
        { palavra: 'AVIAO', silabas: ['A', 'VI', 'ÃO'] },
        { palavra: 'ELEFANTE', silabas: ['E', 'LE', 'FAN', 'TE'] }
    ]
};

function embaralhar(array) {
    return array.sort(() => Math.random() - 0.5);
}

// NOVO: Seleciona o nível com base na pontuação
function selecionarItemPorNivel() {
    let nivel = 'nivel2';
    let pts = 15;

    if (pontuacao >= 100) {
        nivel = 'nivel4';
        pts = 30;
    } else if (pontuacao >= 40) {
        nivel = 'nivel3';
        pts = 20;
    }

    const banco = BANCO_COMPLETO[nivel];
    const item = banco[Math.floor(Math.random() * banco.length)];
    return { item, pts };
}

function iniciarJogo() {
    const { item, pts } = selecionarItemPorNivel();

    silabasDropEl.innerHTML = '';
    silabasOrigemEl.innerHTML = '';
    feedbackEl.textContent = `Forme a palavra (${item.silabas.length} sílabas). Vale ${pts} pontos!`;
    feedbackEl.className = 'feedback-message';
    verificarBtn.textContent = 'Verificar';
    verificarBtn.onclick = verificarResposta;
    placarEl.textContent = `Pontos: ${pontuacao}`;

    palavraCorreta = item.palavra;
    palavraAlvoEl.textContent = palavraCorreta;

    const silabasEmbaralhadas = embaralhar([...item.silabas]);

    // Cria as zonas de drop (uma para cada sílaba)
    for (let i = 0; i < item.silabas.length; i++) {
        const dropSlot = document.createElement('div');
        dropSlot.className = 'drop-slot';
        dropSlot.setAttribute('data-index', i);
        silabasDropEl.appendChild(dropSlot);
    }

    // Cria as sílabas arrastáveis
    silabasEmbaralhadas.forEach((silaba, index) => {
        const silabaDiv = document.createElement('div');
        silabaDiv.className = 'silaba-arrastavel';
        silabaDiv.draggable = true;
        silabaDiv.textContent = silaba;
        silabaDiv.id = `silaba-${index}`;
        silabasOrigemEl.appendChild(silabaDiv);
    });

    adicionarEventosDragDropSilabas();
}

function adicionarEventosDragDropSilabas() {
    // ... (lógica de drag and drop permanece a mesma) ...
    const silabas = document.querySelectorAll('.silaba-arrastavel');
    const dropSlots = document.querySelectorAll('.drop-slot');

    silabas.forEach(silaba => {
        silaba.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/id', e.target.id);
            e.target.classList.add('arrastando');
        });
        silaba.addEventListener('dragend', (e) => {
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

            const idSilaba = e.dataTransfer.getData('text/id');
            const silabaArrastada = document.getElementById(idSilaba);

            if (!silabaArrastada) return;

            const silabaExistente = slot.querySelector('.silaba-arrastavel');
            if (silabaExistente) {
                silabasOrigemEl.appendChild(silabaExistente);
            }

            slot.appendChild(silabaArrastada);
        });
    });

    silabasOrigemEl.addEventListener('dragover', (e) => { e.preventDefault(); silabasOrigemEl.classList.add('hover-return'); });
    silabasOrigemEl.addEventListener('dragleave', () => { silabasOrigemEl.classList.remove('hover-return'); });
    silabasOrigemEl.addEventListener('drop', (e) => {
        e.preventDefault();
        silabasOrigemEl.classList.remove('hover-return');
        const idSilaba = e.dataTransfer.getData('text/id');
        const silabaArrastada = document.getElementById(idSilaba);

        if (silabaArrastada) {
            silabasOrigemEl.appendChild(silabaArrastada);
        }
    });
}

function verificarResposta() {
    const dropSlots = document.querySelectorAll('.drop-slot');
    let respostaDoAluno = '';
    let todosPreenchidos = true;

    dropSlots.forEach(slot => {
        const silaba = slot.querySelector('.silaba-arrastavel');
        if (silaba) {
            respostaDoAluno += silaba.textContent;
        } else {
            todosPreenchidos = false;
        }
    });

    if (!todosPreenchidos) {
        feedbackEl.textContent = `Atenção: Arraste todas as sílabas!`;
        feedbackEl.className = 'feedback-message info';
        return;
    }

    const { pts } = selecionarItemPorNivel();

    if (respostaDoAluno === palavraCorreta) {
        feedbackEl.textContent = `🎉 Parabéns! Você formou a palavra "${palavraCorreta}" e ganhou ${pts} pontos!`;
        feedbackEl.className = 'feedback-message success';
        pontuacao += pts;
        placarEl.textContent = `Pontos: ${pontuacao}`;
        verificarBtn.textContent = 'Próximo Desafio';
        verificarBtn.onclick = iniciarJogo;
    } else {
        feedbackEl.textContent = `Tente de novo! A palavra formada foi "${respostaDoAluno}".`;
        feedbackEl.className = 'feedback-message error';
    }
}

iniciarJogo();