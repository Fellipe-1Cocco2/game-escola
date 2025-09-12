const joinGame = async (req, res) => {
    try {
        const { gameCode } = req.body;
        // Lógica para verificar se o código do jogo existe e se o aluno pode entrar
        // Por enquanto, vamos simular uma resposta
        if (gameCode === '12345') {
            res.status(200).json({ message: 'Conectado ao jogo com sucesso.' });
        } else {
            res.status(404).json({ error: 'Código do jogo inválido.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor.' });
    }
};

module.exports = {
    joinGame
};