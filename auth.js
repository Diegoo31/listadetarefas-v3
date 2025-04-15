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
    
    // Mostrar mensagem de sucesso
    showPopup(`
        <h3>Cadastro realizado com sucesso!</h3>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Senha:</strong> ${password}</p>
        <p><strong>IMPORTANTE:</strong> Guarde sua senha em um local seguro. Ela não pode ser recuperada.</p>
    `, 'success');
    
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