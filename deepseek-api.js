class DeepSeekAPI {
    constructor() {
        this.apiURL = '/api/chat';
    }

    async sendMessage(message, history = []) {
        try {
            // Форматируем историю для API
            const formattedHistory = [];
            history.forEach(chat => {
                formattedHistory.push(
                    { role: 'user', content: chat.user },
                    { role: 'assistant', content: chat.bot }
                );
            });

            const response = await fetch(this.apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    history: formattedHistory
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
            
        } catch (error) {
            console.error('DeepSeek API error:', error);
            throw error;
        }
    }
}

// Инициализация API
window.deepseekAPI = new DeepSeekAPI();
