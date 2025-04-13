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

// Verificar se já existe um usuário logado
window.addEventListener('load', () => {
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
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        return false;
    }
}

// Função para verificar se o usuário existe
function findUser(email) {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(user => user.email === email);
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
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = registerPassword.value;
    
    // Validações
    if (!name || !email || !password) {
        showPopup('Por favor, preencha todos os campos! 📝', 'warning');
        return;
    }
    
    if (!isGeneratedPassword(password)) {
        showPopup('Use o botão "Gerar Senha" para criar uma senha segura! 🔒', 'warning');
        return;
    }
    
    if (findUser(email)) {
        showPopup('Este e-mail já está cadastrado! Tente fazer login 📧', 'error');
        return;
    }
    
    const user = { name, email, password };
    
    if (saveUser(user)) {
        showPopup('Cadastro realizado com sucesso! Guarde sua senha em um local seguro 🎉', 'success');
        setTimeout(() => setLoggedInUser(user), 1500);
    } else {
        showPopup('Ops! Algo deu errado no cadastro. Tente novamente 😕', 'error');
    }
});

// Login de usuário
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showPopup('Por favor, preencha todos os campos! 📝', 'warning');
        return;
    }
    
    const user = findUser(email);
    
    if (!user || user.password !== password) {
        showPopup('E-mail ou senha incorretos! Verifique seus dados 🔍', 'error');
        return;
    }
    
    setLoggedInUser(user);
}); 