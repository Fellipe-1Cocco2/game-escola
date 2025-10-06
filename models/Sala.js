const mongoose = require('mongoose');

// Schema para um resultado de um aluno numa tarefa
const respostaSchema = new mongoose.Schema({
    perguntaId: { type: mongoose.Schema.Types.ObjectId, required: true },
    respostaIndex: { type: Number, required: true }, // O índice da opção que o aluno marcou (0-3)
    acertou: { type: Boolean, required: true }
}, { _id: false });

const progressoSchema = new mongoose.Schema({
    alunoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Aluno', required: true },
    status: {
        type: String,
        enum: ['nao-iniciado', 'em-andamento', 'concluido'],
        default: 'nao-iniciado'
    },
    pontuacao: { type: Number, default: 0 },
    respostas: [respostaSchema], // Array com as respostas dadas
    dataConclusao: { type: Date }
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
    // A linha abaixo foi corrigida para usar o schema correto
    perguntas: [perguntaDaTarefaSchema],
    progressos: [progressoSchema]
}, { timestamps: true });


// Modelo Principal da Sala
const salaSchema = new mongoose.Schema({
    num_serie: { type: String, required: true, unique: true },
    criador: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Professor' },
    editoresConvidados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Professor' }],
    tarefas: [tarefaSchema],
    // A linha abaixo foi alterada para referenciar o novo modelo 'Aluno'
    alunos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Aluno' }]
}, { timestamps: true });


module.exports = mongoose.model('Sala', salaSchema);

