const mongoose = require('mongoose');

const alunoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome do aluno é obrigatório.']
    },
    RA: {
        type: String,
        required: [true, 'O RA do aluno é obrigatório.'],
        unique: true // Garante que não haverá dois alunos com o mesmo RA
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Aluno', alunoSchema);