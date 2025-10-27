const mongoose = require('mongoose');

const perguntaSchema = new mongoose.Schema({
    texto: {
        type: String,
        required: [true, 'O texto da pergunta é obrigatório.']
    },
    // --- NOVO CAMPO ---
    tipo: {
        type: String,
        enum: ['multipla_escolha', 'vf'], // vf = Verdadeiro/Falso
        default: 'multipla_escolha',
        required: true
    },
    opcoes: {
        type: [String],
        required: true
    // REMOVA A SEÇÃO 'validate: [...]' daqui
    },
    opcaoCorreta: {
        type: Number,
        required: [true, 'É necessário definir a opção correta.'],
        min: 0,
        max: 3 // Mantenha este simplificado
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Pergunta', perguntaSchema);