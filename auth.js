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

// Inicializar EmailJS (adicione seu ID de usuário real)
(function() {
    emailjs.init("seu_user_id_do_emailjs");
})();

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

// Função para enviar email com dados do registro
function sendRegistrationEmail(user) {
    const templateParams = {
        to_email: user.email,
        to_name: user.name,
        user_email: user.email,
        user_password: user.password,
        subject: "Boas-vindas à Lista de Tarefas Espacial ✨",
        message: `
            Olá ${user.name},
            
            Seja bem-vindo(a) à Lista de Tarefas Espacial! ✨
            
            Seus dados de acesso são:
            - Email: ${user.email}
            - Senha: ${user.password}
            
            IMPORTANTE: Esta senha foi gerada automaticamente e é ÚNICA.
            Ela não poderá ser recuperada caso você a perca.
            Por favor, guarde-a em um local seguro.
            
            Esperamos que você aproveite nossa aplicação!
            
            Atenciosamente,
            Equipe Lista de Tarefas Espacial
        `
    };
    
    return emailjs.send('service_id', 'template_id', templateParams)
        .then(function(response) {
            console.log('Email enviado com sucesso:', response);
            return true;
        }, function(error) {
            console.error('Erro ao enviar email:', error);
            return false;
        });
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
    
    // Tentar salvar usuário
    const saveSuccess = saveUser(user);
    
    if (saveSuccess) {
        // Mostrar informação para o usuário anotar suas credenciais
        const credentialInfo = document.createElement('div');
        credentialInfo.className = 'credentials-info';
        credentialInfo.innerHTML = `
            <div class="credentials-popup">
                <h3>Suas credenciais de acesso</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Senha:</strong> ${password}</p>
                <p class="warning">IMPORTANTE: Anote estas informações! Elas não poderão ser recuperadas.</p>
                <button id="confirm-credentials" class="credentials-confirm">Anotei minhas credenciais</button>
            </div>
        `;
        
        document.body.appendChild(credentialInfo);
        
        // Adicionar evento para confirmar que as credenciais foram salvas
        document.getElementById('confirm-credentials').addEventListener('click', () => {
            credentialInfo.remove();
            
            // Enviar email com as credenciais (se configurado)
            try {
                sendRegistrationEmail(user).then(() => {
                    showPopup('Email com suas credenciais enviado! Verifique sua caixa de entrada 📧✨', 'success');
                }).catch(() => {
                    console.error('Falha ao enviar email');
                });
            } catch (error) {
                console.error('Erro ao enviar email:', error);
            }
            
            // Redirecionar para a página de login após o registro
            showPopup('Cadastro realizado com sucesso! Redirecionando para o login... 🎉', 'success');
            
            // Mostrar os formulários de registro e login
            registerForm.style.display = 'none';
            loginForm.style.display = 'flex';
            
            // Preencher o campo de email para facilitar o login
            document.getElementById('email').value = email;
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
            
            // Adicionar mensagem de confirmação acima do formulário de login
            const loginContainer = document.querySelector('.login-container');
            const confirmMessage = document.createElement('div');
            confirmMessage.className = 'register-confirmation';
            confirmMessage.innerHTML = `
                <div class="confirmation-message">
                    <p>✅ Seu cadastro foi realizado com sucesso!</p>
                    <p>Por favor, faça login com suas credenciais.</p>
                </div>
            `;
            
            // Inserir a mensagem antes do formulário de login
            loginContainer.insertBefore(confirmMessage, loginForm);
            
            // Remover a mensagem após 10 segundos
            setTimeout(() => {
                if (confirmMessage.parentNode) {
                    confirmMessage.parentNode.removeChild(confirmMessage);
                }
            }, 10000);
        });
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
        
        // Remover usuários específicos (diegocorreapereira93@hotmail.com e user@user.com)
        const filteredUsers = currentUsers.filter(user => 
            user.email.toLowerCase() !== 'diegocorreapereira93@hotmail.com' && 
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