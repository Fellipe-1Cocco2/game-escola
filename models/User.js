const mongoose = require('mongoose');

// Definindo o esquema do usuário
const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Nome do usuário, obrigatório
    email: { type: String, required: true, unique: true }, // Email do usuário, obrigatório e único
    password: { type: String, required: true }, // Senha do usuário, obrigatória
});

// Criando o modelo User a partir do esquema definido
const User = mongoose.model('User', userSchema);

// Exportando o modelo User para ser utilizado em outras partes da aplicação
module.exports = User;