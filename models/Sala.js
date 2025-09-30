const mongoose = require('mongoose');

// Schema para um resultado de um aluno numa tarefa
const resultadoSchema = new mongoose.Schema({
    alunoId: { type: mongoose.Schema.Types.ObjectId, required: true },
    alunoNome: { type: String, required: true },
    pontuacao: { type: Number, required: true },
    totalPerguntas: { type: Number, required: true },
    dataConclusao: { type: Date, default: Date.now }
}, { _id: false });

// Schema para uma pergunta associada a uma tarefa
const perguntaDaTarefaSchema = new mongoose.Schema({
    pergunta: { type: mongoose.Schema.Types.ObjectId, ref: 'Pergunta', required: true }
}, { _id: false });

// Schema para uma tarefa individual
const tarefaSchema = new mongoose.Schema({
    titulo: { type: String, required: [true, 'O título da tarefa é obrigatório.'] },
    dataFechamento: { type: Date },
    horaFechamento: { type: String },
    perguntas: [perguntaDaTarefaSchema],
    resultados: [resultadoSchema] // NOVO CAMPO PARA GUARDAR OS RESULTADOS
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

