const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
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
        select: false // Não retorna a senha por padrão nas buscas
    },
    // Futuramente, pode-se adicionar roles (superadmin, etc.)
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hook para criptografar a senha antes de salvar (igual ao Professor)
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar a senha digitada com a senha no banco (igual ao Professor)
adminSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
