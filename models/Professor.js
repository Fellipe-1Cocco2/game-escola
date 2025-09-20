const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- Subdocumentos ---

// Schema para uma Tarefa individual dentro de uma sala
const tarefaSchema = new mongoose.Schema({
    texto: {
        type: String,
        required: true
    },
    concluida: {
        type: Boolean,
        default: false
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

// Schema para uma sala de aula individual
const salaSchema = new mongoose.Schema({
    num_serie: {
        type: String,
        required: [true, 'O número/série da sala é obrigatório.']
    },
    // ATUALIZADO: Usando o novo schema de tarefas
    tarefas: [tarefaSchema],
    alunos: [alunoSchema]
});


// --- Modelo Principal ---

const professorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Por favor, adicione um nome']
    },
    email: {
        type: String,
        required: [true, 'Por favor, adicione um email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Por favor, adicione um email válido'
        ]
    },
    password: {
        type: String,
        required: [true, 'Por favor, adicione uma senha'],
        minlength: 6,
        select: false
    },
    salas: [salaSchema]
}, {
    timestamps: true
});

// --- Métodos e Hooks ---

// Hook para criptografar a senha antes de salvar
professorSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar a senha digitada com a senha no banco
professorSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('Professor', professorSchema);

