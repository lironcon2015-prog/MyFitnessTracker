// Service Worker - Background Handler
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// מאזין להודעות תזמון מהאפליקציה
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIF') {
        const { delay, message, title } = event.data;
        
        // יצירת טיימר בתוך ה-Service Worker
        setTimeout(() => {
            self.registration.showNotification(title, {
                body: message,
                icon: 'https://cdn-icons-png.flaticon.com/512/121/121043.png',
                badge: 'https://cdn-icons-png.flaticon.com/512/121/121043.png',
                vibrate: [200, 100, 200],
                tag: 'workout-timer-' + Date.now(),
                renotify: true
            });
        }, delay);
    }
});
