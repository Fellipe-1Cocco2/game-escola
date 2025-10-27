const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'O nome da escola é obrigatório.'],
        unique: true, // Garante que não hajam escolas com o mesmo nome
        trim: true
    },
    // Você pode adicionar mais campos aqui no futuro, se necessário
    // Ex: address: String, city: String, etc.
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('School', schoolSchema);