const mongoose = require('mongoose');

const perguntaSchema = new mongoose.Schema({
    texto: {
        type: String,
        required: [true, 'O texto da pergunta é obrigatório.']
    },
    opcoes: {
        type: [String],
        required: true,
        validate: [
            val => val.length === 4,
            'A pergunta deve ter exatamente 4 opções.'
        ]
    },
    // Guarda o índice (0, 1, 2, ou 3) da opção correta no array de opções
    opcaoCorreta: {
        type: Number,
        required: [true, 'É necessário definir a opção correta.'],
        min: 0,
        max: 3
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Pergunta', perguntaSchema);

