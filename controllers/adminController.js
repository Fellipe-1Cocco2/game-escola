const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Biblioteca para tokens de autenticação (precisa ser instalada)

const prisma = new PrismaClient();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const admin = await prisma.admin.findUnique({ where: { email } });

        if (admin && (await bcrypt.compare(password, admin.password))) {
            const token = generateToken(admin.id);
            res.status(200).json({ message: 'Login de administrador bem-sucedido.', token });
        } else {
            res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor.' });
    }
};

module.exports = {
    adminLogin
};