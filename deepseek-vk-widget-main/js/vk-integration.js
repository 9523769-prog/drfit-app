// VK Mini Apps Integration
class VKIntegration {
    constructor() {
        this.bridge = window.vkBridge;
        this.isVK = false;
        this.init();
    }

    async init() {
        try {
            // Проверяем, запущено ли в VK
            if (this.bridge) {
                await this.bridge.send('VKWebAppInit');
                this.isVK = true;
                console.log('VK Mini App initialized');
                
                // Настраиваем приложение для VK
                await this.setupVKApp();
            } else {
                console.log('Running in standalone mode');
                this.isVK = false;
            }
        } catch (error) {
            console.log('Not in VK environment:', error);
            this.isVK = false;
        }
    }

    async setupVKApp() {
        try {
            // Устанавливаем настройки интерфейса
            await this.bridge.send('VKWebAppSetViewSettings', {
                status_bar_style: 'dark',
                action_bar_color: '#FFFFFF',
                navigation_bar_color: '#FFFFFF'
            });

            // Получаем информацию о пользователе
            const userInfo = await this.bridge.send('VKWebAppGetUserInfo');
            this.userId = userInfo.id;
            
            console.log('VK User:', userInfo);

        } catch (error) {
            console.error('VK setup error:', error);
        }
    }

    // Метод для шаринга
    async shareApp() {
        if (!this.isVK) return;
        
        try {
            await this.bridge.send('VKWebAppShare', {
                link: 'https://vk.com/app' + process.env.VK_APP_ID
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    }

    // Метод для добавления в избранное
    async addToFavorites() {
        if (!this.isVK) return;
        
        try {
            await this.bridge.send('VKWebAppAddToFavorites');
        } catch (error) {
            console.error('Add to favorites error:', error);
        }
    }
}

// Инициализация VK интеграции
window.vkIntegration = new VKIntegration();
