const mongoose = require('mongoose');

const alunoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome do aluno é obrigatório.']
    },
    RA: {
        type: String,
        required: [true, 'O RA do aluno é obrigatório.'],
        // unique: true // <-- REMOVA OU COMENTE ESTA LINHA
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Aluno', alunoSchema);