const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- Subdocumentos ---

// Schema para um aluno individual dentro de uma sala
const alunoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome do aluno é obrigatório.']
    },
    RA: { // Registro do Aluno
        type: String,
        required: [true, 'O RA do aluno é obrigatório.']
    }
}, { _id: false }); // _id: false para não criar IDs para cada aluno, a menos que seja necessário

// Schema para uma sala de aula individual
const salaSchema = new mongoose.Schema({
    // O id_sala é gerado automaticamente pelo MongoDB como '_id'
    num_serie: {
        type: String,
        required: [true, 'O número/série da sala é obrigatório.']
    },
    perguntas: [{
        type: String // Um array simples de perguntas
    }],
    alunos: [alunoSchema] // Um array de alunos aninhados
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
        select: false // Não retorna a senha em buscas por padrão
    },
    salas: [salaSchema] // Um professor pode ter um array de salas
}, {
    timestamps: true // Adiciona os campos createdAt e updatedAt
});

// Hook (middleware) que criptografa a senha antes de salvar o documento
professorSchema.pre('save', async function(next) {
    // Apenas criptografa a senha se ela foi modificada (ou é nova)
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('Professor', professorSchema);

