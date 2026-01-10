self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// ניהול התראות ברקע
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIF') {
        const { delay, message, title } = event.data;
        
        // יצירת טיימר עצמאי בתוך ה-Worker
        setTimeout(() => {
            self.registration.showNotification(title, {
                body: message,
                icon: 'https://cdn-icons-png.flaticon.com/512/121/121043.png',
                vibrate: [300, 100, 300],
                tag: 'workout-rest',
                renotify: true,
                requireInteraction: true // משאיר את ההתראה על המסך באייפון
            });
        }, delay);
    }
});
