// Инициализация VK Bridge с обработкой ошибок
if (window.vkBridge) {
    vkBridge.send('VKWebAppInit', {})
        .then(data => {
            console.log('VK Web App инициализирован');
            
            // Настройка viewport для мобильных устройств
            if (window.innerWidth <= 768) {
                vkBridge.send('VKWebAppSetViewSettings', {
                    status_bar_style: 'light',
                    action_bar_color: '#667eea'
                });
            }
        })
        .catch(error => {
            console.log('VK Bridge не доступен, работаем в standalone режиме');
        });
}
