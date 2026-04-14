// Инициализация VK Mini Apps
vkBridge.send('VKWebAppInit');

// Элементы DOM
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');

// Конфигурация DeepSeek API
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
// Получите ваш API ключ на https://platform.deepseek.com/
const DEEPSEEK_API_KEY = 'ваш_api_ключ_здесь';

// Функция для добавления сообщения в чат
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Функция для отправки запроса к DeepSeek API
async function sendToDeepSeek(message) {
    try {
        typingIndicator.style.display = 'block';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты полезный AI-ассистент для сообщества ВКонтакте. Отвечай на русском языке.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('Ошибка при запросе к DeepSeek:', error);
        return 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.';
    } finally {
        typingIndicator.style.display = 'none';
    }
}

// Обработчик отправки сообщения
async function handleSendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;

    // Добавляем сообщение пользователя
    addMessage(message, true);
    userInput.value = '';

    // Отправляем запрос к DeepSeek
    const response = await sendToDeepSeek(message);
    
    // Добавляем ответ бота
    addMessage(response, false);
}

// Обработчики событий
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});

// Обработка VK Bridge событий
vkBridge.subscribe((e) => {
    if (e.detail.type === 'VKWebAppUpdateConfig') {
        const scheme = e.detail.data.scheme;
        document.body.style.background = scheme === 'dark' ? '#191919' : '';
    }
});
