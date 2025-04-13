// Função para gerar senha segura
function generatePassword(length = 16) { // Aumentando o comprimento padrão para 16
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removido caracteres ambíguos I, O
    const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Removido caracteres ambíguos l
    const numbers = '23456789'; // Removido caracteres ambíguos 0, 1
    const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
    
    let password = '';
    
    // Garantir pelo menos dois caracteres de cada tipo para maior segurança
    for (let i = 0; i < 2; i++) {
        password += uppercase[secureRandom(uppercase.length)];
        password += lowercase[secureRandom(lowercase.length)];
        password += numbers[secureRandom(numbers.length)];
        password += symbols[secureRandom(symbols.length)];
    }
    
    // Garantir caracteres especiais específicos
    const requiredSymbols = ['!', '@', '#', '$', '%'];
    password += requiredSymbols[secureRandom(requiredSymbols.length)];
    
    // Completar o resto da senha com caracteres aleatórios
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
        password += allChars[secureRandom(allChars.length)];
    }
    
    // Embaralhar a senha com algoritmo Fisher-Yates para melhor aleatoriedade
    password = fisherYatesShuffle(password.split('')).join('');
    
    // Validar a força da senha
    const passwordStrength = checkPasswordStrength(password);
    if (passwordStrength < 4) {
        // Se a senha não for forte o suficiente, gerar uma nova
        return generatePassword(length);
    }
    
    // Salvar a senha gerada no localStorage para validação posterior
    const generatedPasswords = JSON.parse(localStorage.getItem('generatedPasswords') || '[]');
    generatedPasswords.push(password);
    localStorage.setItem('generatedPasswords', JSON.stringify(generatedPasswords));
    
    return password;
}

// Função para gerar números aleatórios mais seguros
function secureRandom(max) {
    // Usa crypto API se disponível para maior aleatoriedade
    if (window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] % max;
    }
    // Fallback para Math.random()
    return Math.floor(Math.random() * max);
}

// Implementação do algoritmo de Fisher-Yates para embaralhamento mais eficiente
function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [array[i], array[j]] = [array[j], array[i]]; // Troca de elementos
    }
    return array;
}

// Função para verificar a força da senha
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Comprimento
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    
    // Complexidade
    if (/[A-Z]/.test(password)) strength += 1; // Letra maiúscula
    if (/[a-z]/.test(password)) strength += 1; // Letra minúscula
    if (/[0-9]/.test(password)) strength += 1; // Número
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Caractere especial
    
    // Variedade
    const uniqueChars = new Set(password.split('')).size;
    if (uniqueChars >= password.length * 0.7) strength += 1; // Pelo menos 70% de caracteres únicos
    
    // Padrões
    if (!/(.)\\1{2,}/.test(password)) strength += 1; // Sem repetições de 3+ caracteres
    
    return strength;
}

// Função para verificar se a senha foi gerada pelo sistema
function isGeneratedPassword(password) {
    const generatedPasswords = JSON.parse(localStorage.getItem('generatedPasswords') || '[]');
    return generatedPasswords.includes(password);
}

// Limpar senhas antigas (manter apenas as últimas 50)
function cleanOldPasswords() {
    const generatedPasswords = JSON.parse(localStorage.getItem('generatedPasswords') || '[]');
    if (generatedPasswords.length > 50) {
        generatedPasswords.splice(0, generatedPasswords.length - 50);
        localStorage.setItem('generatedPasswords', JSON.stringify(generatedPasswords));
    }
}

// Função para gerar uma senha e exibi-la ao usuário
function displayNewPassword() {
    const password = generatePassword();
    const passwordDisplay = document.getElementById('generated-password-text');
    if (passwordDisplay) {
        passwordDisplay.textContent = password;
        document.querySelector('.generated-password-display').style.display = 'block';
    }
    return password;
}

// Calcular e exibir a força da senha
function displayPasswordStrength(password) {
    const strength = checkPasswordStrength(password);
    let strengthText = '';
    let strengthColor = '';
    
    if (strength <= 3) {
        strengthText = 'Fraca';
        strengthColor = '#ff3366';
    } else if (strength <= 6) {
        strengthText = 'Média';
        strengthColor = '#ffbb00';
    } else {
        strengthText = 'Forte';
        strengthColor = '#00ff9d';
    }
    
    // Se existir o elemento de exibição da força
    const strengthDisplay = document.getElementById('password-strength');
    if (strengthDisplay) {
        strengthDisplay.textContent = strengthText;
        strengthDisplay.style.color = strengthColor;
    }
}

// Limpar senhas antigas periodicamente
setInterval(cleanOldPasswords, 1000 * 60 * 60); // Limpar a cada hora 