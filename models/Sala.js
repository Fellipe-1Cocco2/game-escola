const mongoose = require('mongoose');

// Schema para uma tarefa individual dentro de uma sala
const tarefaSchema = new mongoose.Schema({
    descricao: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Schema para um aluno individual dentro de uma sala
const alunoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome do aluno é obrigatório.']
    },
    RA: {
        type: String,
        required: [true, 'O RA do aluno é obrigatório.']
    }
}, { _id: false });

// --- Modelo Principal da Sala ---
const salaSchema = new mongoose.Schema({
    num_serie: {
        type: String,
        required: [true, 'O número/série da sala é obrigatório.'],
        unique: true // Garante que não possam existir duas salas com o mesmo nome.
    },
    criador: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Professor' // Referência ao professor que criou a sala
    },
    editoresConvidados: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor' // Array de IDs de professores que podem editar
    }],
    tarefas: [tarefaSchema],
    alunos: [alunoSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Sala', salaSchema);

