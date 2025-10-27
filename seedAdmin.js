// --- seedAdmin.js ---
// ATENÇÃO: Rode este script APENAS UMA VEZ manualmente
// para criar o primeiro administrador no seu banco de dados.
// Comando para rodar: node seedAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // Ajuste o caminho se necessário
require('dotenv').config(); // Para carregar a DATABASE_URL do .env

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Conectado para seeding...');
    } catch (error) {
        console.error(`Erro ao conectar com MongoDB para seeding: ${error.message}`);
        process.exit(1);
    }
};

const seedAdminUser = async () => {
    await connectDB();

    try {
        const adminEmail = 'aparecidofellipe905@gmail.com';
        const adminPassword = '12345678'; // Senha em texto plano

        // Verifica se o admin já existe
        const existingAdmin = await Admin.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin já existe. Saindo...');
            mongoose.connection.close();
            return;
        }

        // Cria o novo admin (o hook pre('save') no modelo vai hashear a senha)
        const newAdmin = new Admin({
            name: 'Admin Principal', // Ou seu nome
            email: adminEmail,
            password: adminPassword, // Passa a senha em texto plano
        });

        await newAdmin.save();

        console.log('Usuário admin criado com sucesso!');

    } catch (error) {
        console.error('Erro ao criar usuário admin:', error);
    } finally {
        mongoose.connection.close();
        console.log('Conexão com MongoDB fechada.');
    }
};

seedAdminUser();
