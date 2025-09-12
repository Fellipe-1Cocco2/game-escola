        const gameCodeInput = document.getElementById('gameCodeInput');
        const joinGameBtn = document.getElementById('joinGameBtn');

        gameCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            if (e.target.value.trim()) {
                joinGameBtn.disabled = false;
            } else {
                joinGameBtn.disabled = true;
            }
        });

        joinGameBtn.addEventListener('click', () => {
            const gameCode = gameCodeInput.value;
            if (gameCode.trim()) {
                alert(`Entrando no jogo com código: ${gameCode}`);
            }
        });