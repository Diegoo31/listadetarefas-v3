class CustomPopup {
    static show(message, type = 'info') {
        // Remover popup anterior se existir
        const existingPopup = document.querySelector('.custom-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Criar elementos do popup
        const popup = document.createElement('div');
        popup.className = `custom-popup ${type}`;

        // Definir ícone baseado no tipo
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            delete: '🗑️'
        };

        // Criar conteúdo do popup
        popup.innerHTML = `
            <div class="popup-content">
                <span class="popup-icon">${icons[type] || icons.info}</span>
                <p class="popup-message">${message}</p>
            </div>
            <div class="popup-progress"></div>
        `;

        // Adicionar ao DOM
        document.body.appendChild(popup);

        // Animar entrada
        requestAnimationFrame(() => {
            popup.classList.add('show');
        });

        // Remover após 3 segundos
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        }, 3000);
    }

    static async confirm(message) {
        return new Promise((resolve) => {
            // Remover popup anterior se existir
            const existingPopup = document.querySelector('.custom-popup-confirm');
            if (existingPopup) {
                existingPopup.remove();
            }

            // Criar elementos do popup
            const popup = document.createElement('div');
            popup.className = 'custom-popup-confirm';

            // Criar conteúdo do popup
            popup.innerHTML = `
                <div class="popup-confirm-content">
                    <span class="popup-icon">🤔</span>
                    <p class="popup-message">${message}</p>
                    <div class="popup-buttons">
                        <button class="confirm-yes">Sim</button>
                        <button class="confirm-no">Não</button>
                    </div>
                </div>
            `;

            // Adicionar ao DOM
            document.body.appendChild(popup);

            // Animar entrada
            requestAnimationFrame(() => {
                popup.classList.add('show');
            });

            // Adicionar eventos aos botões
            const yesButton = popup.querySelector('.confirm-yes');
            const noButton = popup.querySelector('.confirm-no');

            const closePopup = (result) => {
                popup.classList.remove('show');
                setTimeout(() => {
                    popup.remove();
                    resolve(result);
                }, 300);
            };

            yesButton.addEventListener('click', () => closePopup(true));
            noButton.addEventListener('click', () => closePopup(false));
        });
    }
}

// Função global para mostrar popup
function showPopup(message, type = 'info') {
    CustomPopup.show(message, type);
}

// Função global para confirmação
function confirmPopup(message) {
    return CustomPopup.confirm(message);
} 