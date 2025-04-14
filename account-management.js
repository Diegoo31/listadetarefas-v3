// Função para exibir popups (caso popup.js não esteja carregado)
function showPopup(message, type = 'info', duration = 3000) {
    // Verificar se a função já existe globalmente
    if (window.showPopup && typeof window.showPopup === 'function') {
        window.showPopup(message, type, duration);
        return;
    }
    
    // Se não existir, implementar uma versão básica
    console.log(`[${type.toUpperCase()}]: ${message}`);
    
    // Criar o elemento de popup
    const popup = document.createElement('div');
    popup.className = `custom-popup ${type}`;
    
    // Determinar o ícone com base no tipo
    let icon = '💬';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';
    
    popup.innerHTML = `
        <div class="popup-content">
            <span class="popup-icon">${icon}</span>
            <p class="popup-message">${message}</p>
        </div>
        <div class="popup-progress"></div>
    `;
    
    // Adicionar ao corpo do documento
    document.body.appendChild(popup);
    
    // Mostrar o popup após um pequeno delay
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
    
    // Remover o popup após o tempo definido
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 300);
    }, duration);
}

// Função para excluir conta do usuário atual
function deleteUserAccount(userEmail) {
    try {
        // Verificar se temos o email do usuário
        if (!userEmail) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (!currentUser || !currentUser.email) {
                showPopup('Não foi possível identificar sua conta para exclusão. Por favor, faça login novamente.', 'error');
                return false;
            }
            userEmail = currentUser.email;
        }
        
        // Normalizar o email para minúsculas para evitar problemas de case-sensitivity
        userEmail = userEmail.toLowerCase();
        
        // Obter lista atual de usuários
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Verificar se é um usuário admin
        const userToDelete = users.find(user => user.email.toLowerCase() === userEmail);
        if (userToDelete && userToDelete.isAdmin) {
            showPopup('Contas de administrador não podem ser excluídas pelo sistema.', 'error');
            return false;
        }
        
        // Verificar se o usuário existe
        if (!userToDelete) {
            console.error('Usuário não encontrado para exclusão:', userEmail);
            return false;
        }
        
        // Filtrar a lista para remover o usuário
        const updatedUsers = users.filter(user => user.email.toLowerCase() !== userEmail);
        
        // Salvar a lista atualizada
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // Atualizar backup no sessionStorage
        sessionStorage.setItem('users_backup', JSON.stringify(updatedUsers));
        
        // Remover todos os dados do usuário
        
        // 1. Remover da sessão atual
        localStorage.removeItem('currentUser');
        
        // 2. Remover do backup de último usuário registrado
        sessionStorage.removeItem('last_registered_user');
        
        // 3. Remover todas as tarefas do usuário
        localStorage.removeItem(`tasks_${userEmail}`);
        
        // 4. Limpar quaisquer outras referências ao usuário
        const userKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes(userEmail) || key.includes(`user_${userEmail}`))) {
                userKeys.push(key);
            }
        }
        
        // Remover todas as chaves relacionadas ao usuário
        userKeys.forEach(key => localStorage.removeItem(key));
        
        // Faça o mesmo para sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes(userEmail) || key.includes(`user_${userEmail}`))) {
                sessionStorage.removeItem(key);
            }
        }
        
        console.log('Conta excluída com sucesso:', userEmail);
        return true;
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        return false;
    }
}

// Adicionar o botão de excluir conta na página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando gerenciamento de conta...');
    
    // Verificar se o usuário está logado
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser || !currentUser.email) return;
    
    // Não mostrar botão para admin
    if (currentUser.isAdmin) return;
    
    console.log('Adicionando botão de excluir conta para:', currentUser.email);
    
    // Criar o botão de excluir conta (menor e mais simples)
    const deleteAccountBtn = document.createElement('button');
    deleteAccountBtn.id = 'delete-account-btn';
    deleteAccountBtn.className = 'delete-account-button';
    deleteAccountBtn.innerHTML = '🗑️ Excluir'; // Texto mais curto
    
    // Inserir o botão junto aos outros controles de ação
    const actionControls = document.querySelector('.action-controls');
    if (actionControls) {
        actionControls.appendChild(deleteAccountBtn);
        console.log('Botão adicionado com sucesso à área de controles');
        
        // Adicionar evento ao botão
        deleteAccountBtn.addEventListener('click', () => {
            console.log('Botão de excluir conta clicado');
            
            // Mostrar popup de confirmação
            const confirmationPopup = document.createElement('div');
            confirmationPopup.className = 'delete-account-popup';
            confirmationPopup.innerHTML = `
                <div class="delete-confirmation">
                    <h3>Excluir conta</h3>
                    <p>Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita!</p>
                    <p>Todos os seus dados e tarefas serão removidos permanentemente.</p>
                    <div class="delete-confirmation-buttons">
                        <button id="confirm-delete" class="confirm-delete-btn">Sim, excluir minha conta</button>
                        <button id="cancel-delete" class="cancel-delete-btn">Não, manter minha conta</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(confirmationPopup);
            
            // Botão de confirmar exclusão
            document.getElementById('confirm-delete').addEventListener('click', () => {
                console.log('Confirmando exclusão de conta');
                if (deleteUserAccount(currentUser.email)) {
                    // Adicionar flag para mostrar mensagem na página de login
                    try {
                        sessionStorage.setItem('accountDeleted', 'true');
                    } catch (e) {
                        console.warn('Não foi possível definir flag de exclusão de conta');
                    }
                    
                    // Garantir redirecionamento forçado para a página de login
                    localStorage.removeItem('currentUser'); // garantia adicional
                    window.location.replace('login.html'); // replace não mantém histórico
                } else {
                    showPopup('Não foi possível excluir sua conta. Por favor, tente novamente.', 'error');
                    confirmationPopup.remove();
                }
            });
            
            // Botão de cancelar
            document.getElementById('cancel-delete').addEventListener('click', () => {
                console.log('Exclusão de conta cancelada');
                confirmationPopup.remove();
                showPopup('Exclusão de conta cancelada.', 'info');
            });
        });
    } else {
        console.error('Elemento .action-controls não encontrado na página');
    }
}); 