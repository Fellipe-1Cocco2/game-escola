const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    }
}, {
    timestamps: true
});

// Hook para criptografar a senha
professorSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar senhas
professorSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Professor', professorSchema);

