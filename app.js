class DeepSeekVKApp {
    constructor() {
        this.isVK = window.vkIntegration && window.vkIntegration.isVK;
        this.init();
        this.bindEvents();
        this.chatHistory = [];
    }

    init() {
        this.messagesContainer = document.getElementById('messages');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        this.vkMenu = document.getElementById('vk-menu-panel');
        this.vkMenuBtn = document.getElementById('vk-menu');
        
        this.loadChatHistory();
        this.setupCharacterCounter();
    }

    bindEvents() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.userInput.addEventListener('input', this.autoResizeTextarea.bind(this));
        this.vkMenuBtn.addEventListener('click', () => this.toggleVKMenu());
        
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.currentTarget.dataset.prompt;
                this.userInput.value = prompt;
                this.autoResizeTextarea();
                this.userInput.focus();
            });
        });

        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleMenuAction(action);
            });
        });

        document.addEventListener('click', (e) => {
            if (!this.vkMenu.contains(e.target) && e.target !== this.vkMenuBtn) {
                this.vkMenu.classList.remove('active');
            }
        });
    }

    setupCharacterCounter() {
        this.userInput.addEventListener('input', () => {
            const count = this.userInput.value.length;
            if (count > 1800) {
                this.userInput.style.borderColor = '#e52525';
            } else if (count > 1500) {
                this.userInput.style.borderColor = '#ff9d00';
            } else {
                this.userInput.style.borderColor = '#e7e8ec';
            }
        });
    }

    autoResizeTextarea() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 100) + 'px';
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        this.userInput.value = '';
        this.autoResizeTextarea();
        this.userInput.style.borderColor = '#e7e8ec';

        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        this.addMessage(message, 'user');
        this.showTypingIndicator();
        this.sendButton.disabled = true;

        const apiKey = 'sk-8e3893442b634bfeb972b89103eb5f71';

        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: 'Ты — ИИ-напарник D&R Fit. Ты ведёшь диалог строго по шагам. Распознаёшь короткие ответы.\n\n**ШАГ 1 (первый ответ на любое сообщение):**\nВсегда отвечай: «Готовы потренироваться? (да / нет)»\n\n**ШАГ 2 (если пользователь ответил «да», «давай», «погнали», «конечно», «хочу», «ок»):**\nЗадай первый вопрос: «Мужчина или женщина? (м/ж)»\n\n**ВАЖНО: Если пользователь ответил «м» — считай это «мужчина». Если «ж» — «женщина».**\n\n**ШАГ 3 (после ответа на вопрос 1):**\nЗадай второй вопрос: «Подскажите Ваш возраст?»\n\n**ШАГ 4 (после ответа на вопрос 2):**\nЗадай третий вопрос: «Присутствуют ли боли, травмы?»\n\n**ШАГ 5 (после ответа на вопрос 3):**\nЗадай четвёртый вопрос: «Где планируем тренироваться (дом/зал)?»\n\n**ШАГ 6:**\n- Если пользователь ответил «дом»: задай вопрос: «Какой инвентарь есть под рукой (коврик, гантели, резина)?»\n- Если пользователь ответил «зал»: пропусти вопрос про инвентарь, переходи к шагу 7.\n\n**ШАГ 7:**\nЗадай вопрос: «Сколько минут есть?»\n\n**ШАГ 8:**\nЗадай вопрос: «Какую преследуем цель от занятия (размяться / подвижность / сила / энергия / похудеть)?»\n\n**ШАГ 9 (после ответа на все вопросы):**\nДай структурированную тренировку в формате:\n\n**Разминка:**\n- [2-3 движения]\n\n**Основная часть:**\n- [2-3 упражнения]\n\n**Заминка:**\n- [1-2 упражнения]\n\n**ВАЖНО:**\n- Не пиши время и повторения.\n- Учитывай возраст, боли, инвентарь, цель.\n\n**Если на любом шаге пользователь ответил «нет» на вопрос о готовности:**\nОтветь: «Отдохните и приходите. Я здесь, когда будет настроение 🤍» — и остановись.'
                        },
                        ...this.chatHistory.slice(-10).map(msg => ({
                            role: 'user',
                            content: msg.user
                        })),
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const botReply = data.choices[0].message.content;
            
            this.hideTypingIndicator();
            this.addMessage(botReply, 'bot');
            this.saveToHistory(message, botReply);
            
        } catch (error) {
            console.error('DeepSeek API error:', error);
            this.hideTypingIndicator();
            let errorMsg = '❌ Ошибка связи с DeepSeek. Попробуйте позже.';
            if (error.message.includes('401')) errorMsg = '❌ Ошибка: неверный API ключ DeepSeek.';
            if (error.message.includes('429')) errorMsg = '❌ Превышен лимит запросов к DeepSeek. Попробуйте позже.';
            this.addMessage(errorMsg, 'bot');
        } finally {
            this.sendButton.disabled = false;
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = 'DeepSeek печатает<span class="typing-dots"></span>';
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    toggleVKMenu() {
        this.vkMenu.classList.toggle('active');
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new-chat':
                this.newChat();
                break;
            case 'history':
                this.showHistory();
                break;
            case 'share':
                this.shareApp();
                break;
            case 'about':
                this.showAbout();
                break;
        }
        this.toggleVKMenu();
    }

    newChat() {
        if (this.chatHistory.length > 0) {
            this.messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-avatar">🤖</div>
                    <div class="welcome-text">
                        <h3>Привет! Я D&R Fit</h3>
                        <p>Твой ИИ-напарник для тренировок, восстановления и поддержки. Без токсичной мотивации.</p>
                        <p>👇 Напиши «Дай тренировку» или задай вопрос</p>
                    </div>
                </div>
            `;
            this.chatHistory = [];
            this.saveChatHistory();
        }
    }

    showHistory() {
        if (this.chatHistory.length === 0) {
            alert('История чатов пуста');
        } else {
            alert(`У вас ${this.chatHistory.length} сообщений в истории`);
        }
    }

    shareApp() {
        if (window.vkIntegration) {
            window.vkIntegration.shareApp();
        } else {
            alert('Поделитесь ссылкой на приложение с друзьями!');
        }
    }

    showAbout() {
        alert('D&R Fit | ИИ-напарник\nВерсия 1.0\n\nИИ-помощник для ВКонтакте на базе DeepSeek AI');
    }

    saveToHistory(userMessage, botMessage) {
        this.chatHistory.push({
            user: userMessage,
            bot: botMessage,
            timestamp: new Date().toISOString()
        });
        
        if (this.chatHistory.length > 50) {
            this.chatHistory = this.chatHistory.slice(-50);
        }
        
        this.saveChatHistory();
    }

    saveChatHistory() {
        localStorage.setItem('deepseek_vk_chat_history', JSON.stringify(this.chatHistory));
    }

    loadChatHistory() {
        const saved = localStorage.getItem('deepseek_vk_chat_history');
        if (saved) {
            this.chatHistory = JSON.parse(saved);
            
            const recentMessages = this.chatHistory.slice(-10);
            if (recentMessages.length > 0) {
                const welcome = document.querySelector('.welcome-message');
                if (welcome) welcome.style.display = 'none';
                recentMessages.forEach(chat => {
                    this.addMessage(chat.user, 'user');
                    this.addMessage(chat.bot, 'bot');
                });
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.deepSeekApp = new DeepSeekVKApp();
});
