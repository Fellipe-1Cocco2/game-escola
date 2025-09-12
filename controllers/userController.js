const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Controlador de usuários
const UserController = {
    // Método para registrar um novo usuário
    registerUser: async (req, res) => {
        try {
            // Extrai os dados do corpo da requisição
            const { name, email, password } = req.body;

            // Criptografa a senha antes de salvar
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Salva o novo usuário no banco de dados usando o Prisma
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                },
            });

            // Retorna uma resposta de sucesso
            res.status(201).json({ message: 'Usuário cadastrado com sucesso.', user: newUser });
        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            // Trata erros e retorna uma resposta de erro
            res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
        }
    }
};

// Exporta o controlador
module.exports = UserController;