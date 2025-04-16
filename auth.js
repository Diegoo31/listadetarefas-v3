// Elementos do DOM
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const registerLink = document.getElementById('register-link');
const loginLink = document.getElementById('login-link');
const generateButton = document.getElementById('generate-password');
const passwordDisplay = document.querySelector('.generated-password-display');
const passwordText = document.getElementById('generated-password-text');
const copyButton = document.getElementById('copy-password');
const registerPassword = document.getElementById('register-password');

// Verificar integridade do localStorage
function checkLocalStorageIntegrity() {
    try {
        // Testar se o localStorage está funcionando
        localStorage.setItem('test', 'test');
        const testValue = localStorage.getItem('test');
        localStorage.removeItem('test');
        
        if (testValue !== 'test') {
            console.error('Problema de integridade no localStorage: valores não correspondem');
            return false;
        }
        
        // Verificar se há dados de usuários
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        console.log('Usuários atualmente armazenados:', users.length);
        
        return true;
    } catch (error) {
        console.error('Erro ao verificar localStorage:', error);
        return false;
    }
}

// Executar verificação de localStorage ao carregar a página
window.addEventListener('load', () => {
    const localStorageOk = checkLocalStorageIntegrity();
    
    if (!localStorageOk) {
        alert('Atenção: Seu navegador pode estar bloqueando o armazenamento local. Isso pode impedir o login e registro de usuários. Verifique suas configurações de privacidade ou use outro navegador.');
    }
    
    // Verificar se usuário está logado
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && window.location.pathname.indexOf('login.html') !== -1) {
        window.location.href = 'index.html';
    }
});

// Alternar entre formulários
registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
});

loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
});

// Gerar senha
generateButton.addEventListener('click', () => {
    const password = displayNewPassword();
    registerPassword.value = password;
    
    displayPasswordStrength(password);
    
    showPopup('Senha forte e segura gerada com sucesso! 🔐', 'success');
});

// Copiar senha
copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(passwordText.textContent)
        .then(() => {
            copyButton.textContent = 'Copiado!';
            showPopup('Senha copiada para a área de transferência! 📋', 'success');
            setTimeout(() => {
                copyButton.textContent = 'Copiar';
            }, 2000);
        })
        .catch(err => {
            console.error('Erro ao copiar senha:', err);
            showPopup('Ops! Não foi possível copiar a senha automaticamente 😅', 'error');
        });
});

// Função para salvar usuários no localStorage
function saveUser(user) {
    try {
        // Certificar que o email está em minúsculas para evitar problemas de case-sensitivity
        user.email = user.email.toLowerCase();
        
        // Recuperar lista atual de usuários
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Adicionar o novo usuário
        users.push(user);
        
        // Salvar a lista atualizada
        localStorage.setItem('users', JSON.stringify(users));
        
        // Verificar se os dados foram realmente salvos
        const savedData = localStorage.getItem('users');
        const savedUsers = JSON.parse(savedData || '[]');
        
        if (!savedUsers.some(u => u.email === user.email)) {
            console.error('Falha na persistência: usuário não foi salvo corretamente');
            showPopup('Erro ao salvar dados. Seu navegador pode estar bloqueando o armazenamento local.', 'error');
            return false;
        }
        
        // Para depuração
        console.log('Usuário salvo com sucesso:', user);
        console.log('Total de usuários:', savedUsers.length);
        
        // Usar localStorage e sessionStorage para maior garantia
        try {
            // Backup em sessionStorage para garantir persistência entre páginas
            sessionStorage.setItem('last_registered_user', JSON.stringify(user));
            sessionStorage.setItem('users_backup', JSON.stringify(users));
        } catch (err) {
            console.warn('Não foi possível fazer backup em sessionStorage', err);
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        showPopup('Não foi possível salvar os dados. Verifique as configurações do seu navegador.', 'error');
        return false;
    }
}

// Função para verificar se o usuário existe
function findUser(email) {
    try {
        // Certificar que a busca é feita com email em minúsculas
        const searchEmail = email.toLowerCase();
        
        // Recuperar lista de usuários
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Para depuração
        console.log('Buscando usuário com email:', searchEmail);
        console.log('Total de usuários cadastrados:', users.length);
        
        // Encontrar o usuário pelo email (case insensitive)
        const foundUser = users.find(user => user.email.toLowerCase() === searchEmail);
        
        console.log('Usuário encontrado:', foundUser ? 'Sim' : 'Não');
        
        // Se o usuário não for encontrado no localStorage, tentar no sessionStorage
        if (!foundUser) {
            try {
                const lastUser = JSON.parse(sessionStorage.getItem('last_registered_user') || '{}');
                if (lastUser && lastUser.email && lastUser.email.toLowerCase() === searchEmail) {
                    console.log('Usuário encontrado no sessionStorage');
                    
                    // Restaurar o usuário para o localStorage
                    saveUser(lastUser);
                    return lastUser;
                }
            } catch (err) {
                console.warn('Erro ao verificar sessionStorage', err);
            }
        }
        
        return foundUser;
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
    }
}

// Função para salvar a sessão do usuário
function setLoggedInUser(user) {
    try {
        localStorage.setItem('currentUser', JSON.stringify(user));
        showPopup(`Bem-vindo(a) de volta, ${user.name}! ✨`, 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showPopup('Erro ao fazer login. Por favor, tente novamente 😕', 'error');
    }
}

// Registro de novo usuário
registerForm.addEventListener('submit', registerUser);

// Login de usuário
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showPopup('Por favor, preencha todos os campos! 📝', 'warning');
        return;
    }
    
    // Depuração - mostrar conteúdo do localStorage antes da tentativa de login
    console.log('Conteúdo do localStorage (users):', localStorage.getItem('users'));
    
    const user = findUser(email);
    
    if (!user) {
        showPopup('E-mail não encontrado! Verifique seus dados ou registre-se 🔍', 'error');
        return;
    }
    
    // Comparação direta de senhas
    if (user.password !== password) {
        console.log('Senha fornecida:', password);
        console.log('Senha armazenada:', user.password);
        showPopup('Senha incorreta! Verifique seus dados 🔐', 'error');
        return;
    }
    
    setLoggedInUser(user);
});

// Função para limpar a base de usuários antes da publicação
// Esta função pode ser executada via console do navegador
// Exemplos de como usar:
// 1. clearUserDatabase() - Limpa todos os usuários
// 2. clearUserDatabase(true) - Limpa todos os usuários e dados associados
window.clearUserDatabase = function(clearAllData = false) {
    try {
        // Obter lista atual de usuários
        const currentUsers = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Remover usuários específicos (user@user.com)
        const filteredUsers = currentUsers.filter(user => 
            user.email.toLowerCase() !== 'user@user.com'
        );
        
        // Adicionar usuário admin
        const adminUser = {
            name: "Administrador",
            email: "admin@listadetarefas.com",
            password: "Admin@2025!",
            isAdmin: true
        };
        
        // Verificar se o admin já existe
        const adminExists = filteredUsers.some(user => user.email.toLowerCase() === adminUser.email.toLowerCase());
        
        if (!adminExists) {
            filteredUsers.push(adminUser);
        }
        
        // Salvar a lista atualizada
        localStorage.setItem('users', JSON.stringify(filteredUsers));
        
        // Atualizar backup em sessionStorage
        sessionStorage.setItem('users_backup', JSON.stringify(filteredUsers));
        
        console.log('Usuários específicos removidos e admin criado com sucesso!');
        console.log('Admin credentials - Email: admin@listadetarefas.com, Password: Admin@2024!');
        
        return true;
    } catch (error) {
        console.error('Erro ao limpar base de usuários específicos:', error);
        return false;
    }
};

// Executar limpeza imediatamente
(function() {
    window.clearUserDatabase();
})();

// Modificar a função de registro para não enviar email
function registerUser(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    
    if (!name || !email || !password) {
        showPopup('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    if (findUser(email)) {
        showPopup('Este email já está cadastrado', 'error');
        return;
    }
    
    const user = { name, email, password };
    
    // Salvar usuário
    saveUser(user);
    
    // Mostrar modal de cadastro com sucesso (sem fechamento automático)
    const modalHTML = `
        <div id="registration-success-modal" class="registration-modal">
            <div class="modal-content">
                <div class="success-header">
                    <div class="check-icon">✓</div>
                    <h3>Cadastro realizado com sucesso!</h3>
                </div>
                
                <div class="credentials-container">
                    <div class="credential-item">
                        <div class="credential-icon user-icon">👤</div>
                        <div class="credential-info">
                            <div class="credential-label">Nome:</div>
                            <div class="credential-value">${name}</div>
                        </div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-icon email-icon">📧</div>
                        <div class="credential-info">
                            <div class="credential-label">Email:</div>
                            <div class="credential-value">${email}</div>
                        </div>
                    </div>
                    
                    <div class="credential-item password-item">
                        <div class="credential-icon password-icon">🔐</div>
                        <div class="credential-info">
                            <div class="credential-label">Senha:</div>
                            <div class="credential-value">${password}</div>
                        </div>
                    </div>
                </div>
                
                <div class="warning-box">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-text">IMPORTANTE: Guarde sua senha em um local seguro. Ela não pode ser recuperada.</div>
                </div>
                
                <button id="close-registration-modal" class="close-button">Entendi</button>
            </div>
        </div>
    `;
    
    // Remover qualquer modal existente
    const existingModal = document.getElementById('registration-success-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Inserir o HTML do modal no body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Adicionar os estilos para o modal
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .registration-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: 'Poppins', sans-serif;
        }
        
        .modal-content {
            background-color: #1c313a;
            width: 90%;
            max-width: 400px;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
            border-left: 4px solid #4CAF50;
        }
        
        .success-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            color: #4CAF50;
        }
        
        .check-icon {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 30px;
            height: 30px;
            background-color: #4CAF50;
            color: white;
            border-radius: 50%;
            margin-right: 10px;
            font-size: 16px;
            font-weight: bold;
        }
        
        .success-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .credentials-container {
            background-color: #253740;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 3px solid #4CAF50;
        }
        
        .credential-item {
            display: flex;
            margin-bottom: 10px;
        }
        
        .credential-icon {
            margin-right: 10px;
            font-size: a8px;
            min-width: 24px;
        }
        
        .credential-info {
            display: flex;
            flex-direction: column;
        }
        
        .credential-label {
            font-size: 12px;
            color: #a0a0a0;
            margin-bottom: 2px;
        }
        
        .credential-value {
            font-size: 14px;
            color: #ffffff;
        }
        
        .password-item {
            background-color: #2c4f3d;
            padding: 8px;
            border-radius: 5px;
            margin-top: 5px;
        }
        
        .warning-box {
            display: flex;
            align-items: flex-start;
            background-color: #3d3224;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        
        .warning-icon {
            margin-right: 10px;
            font-size: 16px;
        }
        
        .warning-text {
            font-size: 12px;
            color: #ffc107;
        }
        
        .close-button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            display: block;
            width: 100%;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        
        .close-button:hover {
            background-color: #3e8e41;
        }
    `;
    document.head.appendChild(modalStyle);
    
    // Adicionar evento de clique ao botão de fechar
    document.getElementById('close-registration-modal').addEventListener('click', function() {
        const modal = document.getElementById('registration-success-modal');
        if (modal) {
            modal.classList.add('fade-out');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    });
    
    // Lançar confetti para celebrar o cadastro
    if (window.confetti) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
    
    // Limpar formulário
    document.getElementById('register-form').reset();
    
    // Voltar para o formulário de login
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    
    // Preencher o campo de email para facilitar o login
    document.getElementById('email').value = email;
}

// Modificar a função de exclusão de usuários para remover emails específicos
function deleteAllUsers() {
    // Obter todos os usuários
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Filtrar para manter apenas o admin e remover emails específicos
    const filteredUsers = users.filter(user => 
        user.email.toLowerCase() !== 'admin@listadetarefas.com'
    );
    
    // Salvar usuários filtrados
    localStorage.setItem('users', JSON.stringify(filteredUsers));
    
    // Adicionar o admin se não existir
    const adminUser = {
        name: "Administrador",
        email: "admin@listadetarefas.com",
        password: "Admin@2024!"
    };
    
    const adminExists = filteredUsers.some(user => user.email.toLowerCase() === adminUser.email.toLowerCase());
    
    if (!adminExists) {
        filteredUsers.push(adminUser);
        localStorage.setItem('users', JSON.stringify(filteredUsers));
    }
    
    // Limpar usuário atual
    localStorage.removeItem('currentUser');
    
    // Redirecionar para a página de login
    window.location.href = 'login.html';
    
    console.log('Admin credentials - Email: admin@listadetarefas.com, Password: Admin@2024!');
} 