const mongoose = require('mongoose');

// Schema para uma pergunta associada a uma tarefa
const perguntaDaTarefaSchema = new mongoose.Schema({
    pergunta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pergunta',
        required: true
    }
}, { _id: false });

// Schema para uma tarefa individual dentro de uma sala
const tarefaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'O título da tarefa é obrigatório.']
    },
    dataFechamento: {
        type: Date
    },
    horaFechamento: {
        type: String
    },
    perguntas: [perguntaDaTarefaSchema]
}, { timestamps: true });

// Schema para um aluno individual
const alunoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    RA: { type: String, required: true }
});

// Modelo Principal da Sala
const salaSchema = new mongoose.Schema({
    num_serie: { type: String, required: true, unique: true },
    criador: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Professor' },
    editoresConvidados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Professor' }],
    tarefas: [tarefaSchema],
    alunos: [alunoSchema]
}, { timestamps: true });

module.exports = mongoose.model('Sala', salaSchema);

