const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Estabelece a conexão com o banco de dados MongoDB usando a URL do arquivo .env.
 */
const connectDB = async () => {
    try {
        // Adiciona as opções recomendadas para usar o novo motor de conexão do Mongoose
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        const conn = await mongoose.connect(process.env.DATABASE_URL, options);
        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Erro ao conectar com MongoDB: ${error.message}`);
        process.exit(1); // Sai do processo com falha se não conseguir conectar
    }
};

module.exports = connectDB;