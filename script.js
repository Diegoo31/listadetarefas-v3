// Verificação de autenticação
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        // Redirecionar para a página de login sem exibir alerta
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Verificar autenticação imediatamente
if (!checkAuth()) {
    throw new Error('Usuário não autenticado');
}

// Elementos do DOM
const taskInput = document.getElementById('task-input');
const addButton = document.getElementById('add-button');
const taskList = document.getElementById('task-list');
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Carregar tarefas do localStorage
function loadTasks() {
    try {
        const tasks = JSON.parse(localStorage.getItem(`tasks_${currentUser.email}`) || '[]');
        taskList.innerHTML = ''; // Limpar lista antes de carregar
        tasks.forEach(task => {
            createTaskElement(task.text, task.completed, task.dueDate);
        });
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
    }
}

// Salvar tarefas no localStorage
function saveTasks() {
    try {
        const tasks = [];
        document.querySelectorAll('.task-item').forEach(item => {
            tasks.push({
                text: item.querySelector('.task-text').textContent,
                completed: item.querySelector('.task-text').classList.contains('completed'),
                dueDate: item.getAttribute('data-due-date') || ''
            });
        });
        localStorage.setItem(`tasks_${currentUser.email}`, JSON.stringify(tasks));
    } catch (error) {
        console.error('Erro ao salvar tarefas:', error);
    }
}

// Criar elemento de tarefa
function createTaskElement(text, completed = false, dueDate = '') {
    const taskItem = document.createElement('li');
    taskItem.className = 'task-item';
    
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    if (completed) taskText.classList.add('completed');
    taskText.textContent = text;
    
    // Elemento para data e hora
    const taskDate = document.createElement('div');
    taskDate.className = 'task-date';
    
    // Formatação da data se existir
    if (dueDate) {
        updateTaskDateDisplay(taskDate, dueDate);
    }
    
    // Botão para definir data
    const dateButton = document.createElement('button');
    dateButton.className = 'date-button';
    dateButton.innerHTML = dueDate ? '🕒 Alterar' : '🕒 Agendar';
    
    // Input oculto para o flatpickr
    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.className = 'date-input';
    dateInput.style.display = 'none';
    document.body.appendChild(dateInput);
    
    // Configurar flatpickr
    const datePicker = flatpickr(dateInput, {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        locale: "pt",
        minDate: "today",
        position: "auto",
        static: true,
        minuteIncrement: 5,
        allowInput: true,
        defaultDate: dueDate ? new Date(dueDate) : null,
        theme: "dark",
        onChange: function(selectedDates, dateStr) {
            if (selectedDates.length > 0) {
                const selectedDate = selectedDates[0];
                taskItem.setAttribute('data-due-date', selectedDate.toISOString());
                updateTaskDateDisplay(taskDate, selectedDate.toISOString());
                dateButton.innerHTML = '🕒 Alterar';
                
                if (!taskContent.contains(taskDate)) {
                    taskContent.appendChild(taskDate);
                }
                
                // Salvar tarefas atualizadas
                saveTasks();
                
                // Verificar se a tarefa está atrasada
                setTimeout(checkOverdueTasks, 100);
                
                // Mostrar popup de confirmação
                const formattedDate = selectedDate.toLocaleDateString('pt-BR');
                const formattedTime = selectedDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                showPopup(`Tarefa agendada para ${formattedDate} às ${formattedTime}`, 'info');
            }
        },
        onClose: function() {
            // Remover o input quando o datepicker for fechado
            setTimeout(() => {
                if (document.body.contains(dateInput)) {
                    document.body.removeChild(dateInput);
                }
            }, 300);
        }
    });
    
    // Evento do botão de data
    dateButton.onclick = (e) => {
        e.stopPropagation();
        datePicker.open();
    };
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'task-buttons';
    
    // Botão de excluir - mantendo o estilo vermelho
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Excluir';
    deleteButton.onclick = (e) => {
        e.stopPropagation();
        
        // Pedir confirmação antes de excluir
        confirmPopup('Tem certeza que deseja excluir esta tarefa?').then(confirmed => {
            if (confirmed) {
                taskItem.remove();
                saveTasks();
                showPopup('Tarefa excluída com sucesso!', 'delete');
            }
        });
    };
    
    // Botão de compartilhar no WhatsApp
    const shareButton = document.createElement('button');
    shareButton.className = 'share-button';
    shareButton.textContent = 'Compartilhar';
    shareButton.onclick = (e) => {
        e.stopPropagation();
        let message = `📝 Tarefa: ${text}`;
        
        if (dueDate) {
            const date = new Date(dueDate);
            message += `\n🕒 Agendada para: ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
        }
        
        message += `\n✨ Compartilhado via Lista de Tarefas`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };
    
    // Adicionar elementos
    taskContent.appendChild(taskText);
    if (dueDate) {
        taskContent.appendChild(taskDate);
    }
    
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    actionButtons.appendChild(dateButton);
    
    buttonsContainer.appendChild(actionButtons);
    buttonsContainer.appendChild(shareButton);
    buttonsContainer.appendChild(deleteButton);
    
    taskItem.appendChild(taskContent);
    taskItem.appendChild(buttonsContainer);
    
    if (dueDate) {
        taskItem.setAttribute('data-due-date', dueDate);
    }
    
    taskList.appendChild(taskItem);
    
    // Evento para marcar como concluída
    taskText.addEventListener('click', () => {
        taskText.classList.toggle('completed');
        saveTasks();
        checkOverdueTasks(); // Verificar tarefas vencidas ao marcar como concluída
    });
}

// Função auxiliar para atualizar o display da data
function updateTaskDateDisplay(taskDateElement, dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    
    const formattedDate = date.toLocaleDateString('pt-BR');
    const formattedTime = date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    
    let dateText = '';
    
    // Mostrar "Hoje" ou "Amanhã" se for o caso
    if (date.toDateString() === now.toDateString()) {
        dateText = `<span class="date-icon">📅</span> Hoje às ${formattedTime}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
        dateText = `<span class="date-icon">📅</span> Amanhã às ${formattedTime}`;
    } else {
        // Usar os nomes dos dias da semana para datas nos próximos 7 dias
        const diffDays = Math.round((date - now) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
            const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            dateText = `<span class="date-icon">📅</span> ${weekdays[date.getDay()]} às ${formattedTime}`;
        } else {
            dateText = `<span class="date-icon">📅</span> ${formattedDate} às ${formattedTime}`;
        }
    }
    
    taskDateElement.innerHTML = dateText;
}

// Adicionar nova tarefa
window.addTask = function() {
    const text = taskInput.value.trim();
    if (text) {
        createTaskElement(text);
        taskInput.value = '';
        saveTasks();
        
        // Mostrar popup de sucesso
        showPopup('Tarefa adicionada com sucesso! Clique em "Agendar" para definir data e hora.', 'success');
    }
};

// Event Listeners
addButton.addEventListener('click', window.addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        window.addTask();
    }
});

// Mostrar nome do usuário
document.getElementById('user-name').textContent = `Olá, ${currentUser.name}`;

// Logout
document.getElementById('logout-button').addEventListener('click', async () => {
    // Opcional: Cancelar inscrição push antes de limpar dados locais
    await unsubscribeUserFromPush();
    
    localStorage.removeItem('currentUser');
    // Opcional: Limpar outros dados relacionados ao usuário se necessário
    // localStorage.removeItem(`tasks_${currentUser.email}`);
    window.location.href = 'login.html';
});

// Carregar tarefas ao iniciar
loadTasks();

// Criação das partículas flutuantes
function createParticles() {
    const numberOfParticles = 50;
    const container = document.body;

    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Posição inicial aleatória
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        
        // Movimento aleatório
        const tx = Math.random() * 400 - 200;
        const ty = Math.random() * 400 - 200;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        container.appendChild(particle);
    }
}

// Inicializar partículas
createParticles();

// Adicionar efeito de hover nos botões
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('mouseover', () => {
        button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseout', () => {
        button.style.transform = 'scale(1)';
    });
});

// Adicionar efeito de foco no input
taskInput.addEventListener('focus', () => {
    taskInput.style.boxShadow = '0 0 15px rgba(0, 255, 157, 0.3)';
});

taskInput.addEventListener('blur', () => {
    taskInput.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.1)';
});

// Função para ordenar tarefas por data
function sortTasksByDate() {
    const tasks = Array.from(document.querySelectorAll('.task-item'));
    
    tasks.sort((a, b) => {
        const dateA = a.getAttribute('data-due-date') ? new Date(a.getAttribute('data-due-date')).getTime() : Infinity;
        const dateB = b.getAttribute('data-due-date') ? new Date(b.getAttribute('data-due-date')).getTime() : Infinity;
        
        return dateA - dateB;
    });
    
    // Remover todas as tarefas atuais
    taskList.innerHTML = '';
    
    // Adicionar tarefas ordenadas
    tasks.forEach(task => taskList.appendChild(task));
}

// Função para verificar tarefas vencidas
function checkOverdueTasks() {
    const now = new Date();
    const tasks = document.querySelectorAll('.task-item');
    let hasUpcoming = false;
    
    tasks.forEach(task => {
        const dueDate = task.getAttribute('data-due-date');
        if (dueDate) {
            const taskDate = new Date(dueDate);
            
            // Remover classes existentes
            task.classList.remove('overdue', 'upcoming');
            
            // Remover indicadores existentes
            const existingIndicator = task.querySelector('.status-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Se a tarefa já está concluída, não precisa de indicador
            if (task.querySelector('.task-text').classList.contains('completed')) {
                return;
            }
            
            // Calcular a diferença em horas
            const diffHours = (taskDate - now) / (1000 * 60 * 60);
            const taskDateElement = task.querySelector('.task-date');
            
            let statusIndicator = document.createElement('span');
            statusIndicator.className = 'status-indicator';
            
            // Tarefas vencidas
            if (diffHours < 0) {
                task.classList.add('overdue');
                statusIndicator.textContent = '⚠️ Atrasada';
                statusIndicator.classList.add('overdue-indicator');
                if (taskDateElement) taskDateElement.appendChild(statusIndicator);
            } 
            // Tarefas próximas (menos de 24 horas)
            else if (diffHours < 24) {
                task.classList.add('upcoming');
                statusIndicator.textContent = '⏰ Em breve';
                statusIndicator.classList.add('upcoming-indicator');
                if (taskDateElement) taskDateElement.appendChild(statusIndicator);
                hasUpcoming = true;
            }
        }
    });
    
    // Notificar sobre tarefas próximas, mas apenas uma vez a cada sessão
    if (hasUpcoming && !localStorage.getItem('upcomingNotified')) {
        showPopup('Você tem tarefas programadas para as próximas 24 horas!', 'warning');
        localStorage.setItem('upcomingNotified', 'true');
        
        // Limpar notificação após 3 horas para poder notificar novamente
        setTimeout(() => {
            localStorage.removeItem('upcomingNotified');
        }, 3 * 60 * 60 * 1000);
    }
}

// Função para agrupar tarefas por data
function groupTasksByDate() {
    const tasks = Array.from(document.querySelectorAll('.task-item'));
    const tasksByDate = {};
    const taskList = document.getElementById('task-list');
    
    // Limpar lista atual
    taskList.innerHTML = '';
    
    // Agrupar tarefas por data
    tasks.forEach(task => {
        const dueDate = task.getAttribute('data-due-date');
        let dateKey = 'Sem data';
        
        if (dueDate) {
            const date = new Date(dueDate);
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            
            // Categorizar por hoje, amanhã, esta semana, próximo mês
            if (date.toDateString() === now.toDateString()) {
                dateKey = 'Hoje';
            } else if (date.toDateString() === tomorrow.toDateString()) {
                dateKey = 'Amanhã';
            } else {
                // Usar os nomes dos dias da semana para datas nos próximos 7 dias
                const diffDays = Math.round((date - now) / (1000 * 60 * 60 * 24));
                if (diffDays > 0 && diffDays < 7) {
                    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                    dateKey = weekdays[date.getDay()];
                } else {
                    dateKey = date.toLocaleDateString('pt-BR');
                }
            }
        }
        
        if (!tasksByDate[dateKey]) {
            tasksByDate[dateKey] = [];
        }
        
        tasksByDate[dateKey].push(task);
    });
    
    // Ordem específica para as seções
    const sectionOrder = ['Hoje', 'Amanhã', 'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const sortedKeys = Object.keys(tasksByDate).sort((a, b) => {
        // Se ambas são datas específicas (não são grupos especiais), ordenar por data
        if (!sectionOrder.includes(a) && !sectionOrder.includes(b) && a !== 'Sem data' && b !== 'Sem data') {
            const dateA = a.split('/').reverse().join('-');
            const dateB = b.split('/').reverse().join('-');
            return dateA.localeCompare(dateB);
        }
        
        // Colocar "Sem data" por último
        if (a === 'Sem data') return 1;
        if (b === 'Sem data') return -1;
        
        // Usar a ordem definida para seções especiais
        const indexA = sectionOrder.indexOf(a);
        const indexB = sectionOrder.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return a.localeCompare(b);
    });
    
    // Adicionar cada grupo com seu cabeçalho
    sortedKeys.forEach(dateKey => {
        // Adicionar cabeçalho de seção
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'task-section-header';
        sectionHeader.textContent = dateKey;
        taskList.appendChild(sectionHeader);
        
        // Adicionar tarefas desta seção
        tasksByDate[dateKey].forEach(task => {
            taskList.appendChild(task);
        });
    });
    
    return sortedKeys.length > 1; // Retorna true se tiver mais de uma seção
}

// Substituir a função addGroupButtons por um inicializador de eventos para os botões
function initializeButtons() {
    // Botão para agrupar tarefas
    const groupButton = document.getElementById('group-button');
    groupButton.onclick = () => {
        if (groupTasksByDate()) {
            showPopup('Tarefas agrupadas por data!', 'info');
        } else {
            showPopup('Não há tarefas suficientes para agrupar', 'info');
        }
    };
    
    // Botão para ordenar tarefas
    const sortButton = document.getElementById('sort-button');
    sortButton.onclick = () => {
        sortTasksByDate();
        showPopup('Tarefas ordenadas por data!', 'info');
    };
}

// Remover o antigo botão de ordenação e usar a nova função
window.addEventListener('DOMContentLoaded', () => {
    initializeButtons();
    
    // Verificar tarefas vencidas a cada minuto
    checkOverdueTasks();
    setInterval(checkOverdueTasks, 60000);

    // Registrar o Service Worker e tentar inscrever para Push
    registerServiceWorker();

    // Atualizar nome do usuário
    if (currentUser && currentUser.name) {
        document.getElementById('user-name').textContent = `Olá, ${currentUser.name}`;
    } else {
        console.warn('Nome do usuário não encontrado em currentUser.');
        // Lidar com caso onde nome não está disponível
    }
});

let serviceWorkerRegistration = null;

// Chave pública VAPID (GERADA NO SEU BACKEND! Substitua esta chave de exemplo)
const vapidPublicKey = 'BAa_YOUR_PUBLIC_VAPID_KEY_HERE_REPLACE_ME_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Substitua pela sua chave pública real!

// Função para converter a chave VAPID de base64 para Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Função para registrar o Service Worker
async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker não suportado neste navegador.');
        return;
    }
    try {
        const registration = await navigator.serviceWorker.register('service-worker.js');
        console.log('Service Worker registrado com sucesso:', registration);
        serviceWorkerRegistration = registration; // Guarda a referência
        // Tenta inscrever o usuário imediatamente após o registro bem-sucedido do SW
        // Isso garante que a inscrição ocorra após o SW estar pronto.
        await subscribeUserToPush();
    } catch (error) {
        console.error('Falha ao registrar o Service Worker:', error);
    }
}

// Função para solicitar permissão e inscrever para Push Notifications
async function subscribeUserToPush() {
    if (!serviceWorkerRegistration) {
        console.warn('Service Worker ainda não registrado. Tentando registrar novamente.');
        // Tenta registrar novamente se a referência não estiver disponível
        await registerServiceWorker();
        if (!serviceWorkerRegistration) {
             console.error('Não foi possível registrar o Service Worker para inscrição.');
             return;
        }
    }

    // Verifica se já existe uma inscrição
    const existingSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
    if (existingSubscription) {
        console.log('Usuário já inscrito:', existingSubscription);
        // Opcional: Enviar a inscrição existente para o backend novamente,
        // caso o backend tenha perdido por algum motivo.
        // sendSubscriptionToBackend(existingSubscription);
        return; // Já inscrito, não precisa fazer nada
    }

    // Solicitar permissão
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        console.warn('Permissão para notificações não concedida.');
        showPopup('Permissão de notificação negada. Você não receberá alertas push.', 'warning');
        return;
    }

    // Tentar inscrever o usuário
    try {
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        const subscription = await serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true, // Requerido, indica que as notificações serão visíveis ao usuário
            applicationServerKey: applicationServerKey
        });
        console.log('Usuário inscrito com sucesso:', subscription);

        // !! IMPORTANTE: Enviar a inscrição (subscription) para o seu backend !!
        await sendSubscriptionToBackend(subscription);

    } catch (error) {
        console.error('Falha ao inscrever o usuário para push:', error);
        if (Notification.permission === 'denied') {
             console.warn('A permissão foi negada após a tentativa de inscrição.');
             showPopup('Permissão de notificação foi bloqueada durante o processo.', 'error');
        } else {
             console.error('Erro inesperado durante a inscrição:', error);
             showPopup('Ocorreu um erro ao ativar as notificações push.', 'error');
        }
    }
}

// Função para enviar a inscrição para o backend (IMPLEMENTE ESTA FUNÇÃO!)
async function sendSubscriptionToBackend(subscription) {
    console.log('Enviando inscrição para o backend (simulado):', subscription);
    // Este é o ponto onde você faria uma requisição HTTP (POST) para o seu servidor
    // Substitua '/api/subscribe' pelo endpoint real do seu backend
    try {
        const response = await fetch('/api/subscribe', { // <-- SUBSTITUA PELO SEU ENDPOINT
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscription: subscription,
                userId: currentUser.email // Envie um identificador do usuário
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Inscrição enviada com sucesso para o backend:', data);
        showPopup('Notificações Push ativadas com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao enviar inscrição para o backend:', error);
        showPopup('Falha ao comunicar com o servidor para ativar notificações.', 'error');
        // Aqui você pode querer tentar reenviar mais tarde ou notificar o usuário
        // de forma mais persistente.
    }
}

// Função para cancelar a inscrição (opcional, útil para logout ou configurações)
async function unsubscribeUserFromPush() {
    if (!serviceWorkerRegistration) {
        console.warn('Service Worker não registrado para cancelar inscrição.');
        return;
    }
    try {
        const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
            console.log('Inscrição cancelada com sucesso.');

            // !! IMPORTANTE: Notifique seu backend para remover a inscrição !!
            // await sendUnsubscriptionToBackend(subscription.endpoint); 
            showPopup('Notificações Push desativadas.', 'info');
        } else {
            console.log('Nenhuma inscrição encontrada para cancelar.');
        }
    } catch (error) {
        console.error('Erro ao cancelar inscrição:', error);
        showPopup('Erro ao desativar notificações push.', 'error');
    }
}

// ----- Fim das Funções de Notificação Push -----