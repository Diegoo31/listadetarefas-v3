self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  // Opcional: Adicionar arquivos ao cache aqui
  self.skipWaiting(); // Força o SW a ativar imediatamente
});

self.addEventListener('activate', event => {
  console.log('Service Worker ativado!');
  // Opcional: Limpar caches antigos aqui
  event.waitUntil(self.clients.claim()); // Torna o SW o controlador para clientes abertos imediatamente
});

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Recebido.');

  // --- Estrutura de Payload Esperada do Backend (Exemplo) ---
  // Seu backend deve enviar um JSON com uma estrutura similar a esta:
  // {
  //   "title": "⏰ Tarefa Próxima!", // Título com emoji!
  //   "body": "Sua tarefa 'Nome da Tarefa Aqui' vence às HH:MM!", // Corpo dinâmico
  //   "icon": "images/favicon.svg", // Opcional, senão usa padrão
  //   "badge": "images/favicon-badge.png", // Opcional, ícone pequeno
  //   "data": {
  //     "taskId": "id-unico-da-tarefa-123", // ID para agrupar e identificar
  //     "url": "/index.html?taskId=id-unico-da-tarefa-123" // Opcional: URL para abrir no clique
  //   }
  // }
  // ----------------------------------------------------------

  // Valores padrão criativos, caso o payload falhe ou não venha completo
  let notificationData = {
    title: '✨ Novidade na Lista!',
    body: 'Uma das suas tarefas precisa de atenção.',
    icon: 'images/favicon.svg',
    badge: 'images/favicon-badge.png',
    data: { taskId: null, url: '/index.html' } // URL padrão
  };

  // Tenta obter e mesclar os dados da notificação do payload push
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[Service Worker] Dados da notificação recebidos:', payload);
      // Mescla o payload com os padrões, garantindo que `data` seja objeto
      notificationData = {
         ...notificationData, 
         ...payload, 
         data: { ...notificationData.data, ...(payload.data || {}) } 
      };
    } catch (e) {
      console.error('[Service Worker] Erro ao parsear dados do push (JSON esperado):', e);
      notificationData.body = event.data.text() || notificationData.body; // Fallback
    }
  }

  const title = notificationData.title;
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    // Usa taskId para agrupar (evita duplicatas), ou timestamp como fallback
    tag: notificationData.data && notificationData.data.taskId ? `task-${notificationData.data.taskId}` : `task-notify-${Date.now()}`,
    data: notificationData.data, // Passa os dados (incluindo URL) para o evento notificationclick
    actions: [
      { action: 'view', title: 'Visualizar Tarefa' }
    ]
  };

  // Exibe a notificação
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Lidar com cliques na notificação ou em suas ações
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Clique na notificação recebido. Ação:', event.action);

  const clickedNotification = event.notification;
  clickedNotification.close();

  // Função auxiliar para focar ou abrir a janela do app
  const focusOrOpenApp = (urlToOpen) => {
    return clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Tenta encontrar uma janela já aberta com a URL base
      const baseUrl = new URL(urlToOpen, self.location.origin).pathname;
      for (const client of clientList) {
        const clientUrl = new URL(client.url, self.location.origin).pathname;
        if (clientUrl.includes(baseUrl) && 'focus' in client) {
          console.log('[Service Worker] Focando janela existente.');
          // Opcional: Poderíamos tentar navegar para a URL específica se a janela já está aberta
          // client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Se não encontrou, abre uma nova janela com a URL específica
      if (clients.openWindow) {
        console.log(`[Service Worker] Abrindo nova janela em: ${urlToOpen}`);
        return clients.openWindow(urlToOpen);
      }
    });
  };

  // Determina a URL a ser aberta (do payload ou padrão)
  const targetUrl = event.notification.data.url || '/index.html';

  // Executa a ação (abrir/focar app) para o clique principal ou ação 'view'
  if (event.action === 'view' || !event.action) {
    console.log('[Service Worker] Ação: Visualizar ou clique no corpo.');
    event.waitUntil(focusOrOpenApp(targetUrl));
  } else {
    console.log(`[Service Worker] Ação desconhecida ou não tratada: ${event.action}`);
  }
}); 