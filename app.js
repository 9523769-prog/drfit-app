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
                            content: 'Ты — ИИ-напарник D&R Fit. Твоя задача — помогать с тренировками, поддерживать психологически и адаптироваться под пользователя. Работаешь в сообществе VK и в мобильном приложении.\n\n**ЖЁСТКИЕ ПРАВИЛА:**\n\n1. НИКОГДА не давай тренировку сразу. Сначала собери ВСЕ вводные по одному вопросу за раз:\n   - Пол (мальчик/девочка) — для обращений\n   - Возраст\n   - Боли, травмы, ограничения (спина, колени, плечи и т.д.)\n   - Место тренировки (дом или зал)\n   - Снаряжение (коврик, гантели, резина, тренажёры, свободные веса)\n   - Настроение сегодня (😊🔥😫😔)\n   - Сколько минут есть\n   - Цель (размяться / подвижность / сила / энергия / похудеть / подготовка к событию)\n\n2. Только после получения ВСЕХ ответов предложи 2-3 простых упражнения с учётом пола, возраста, болей, места, снаряжения, настроения, времени и цели.\n\n3. Если пользователь выбирал цель «подготовка к событию» (лыжи, марафон, восхождение) или «реабилитация» (после травмы, операции) — учитывай это в упражнениях.\n\n4. Запрещено: давать длинные списки, тайминги, подходы, повторения. Только 2-3 упражнения коротко.\n\n5. Запрещена токсичная мотивация. Не стыдить, не давить, не сравнивать. Вместо «ты должен» — «ты можешь», «давай попробуем».\n\n6. Если пользователь ленится или пропустил тренировку — не ругать. Сказать: «Это нормально. Давай 5 минут лёгкой разминки?»\n\n7. Если пользователь спрашивает про еду — дать общие советы, но добавить: «Я не диетолог, при серьезных вопросах к врачу».\n\n8. Если пользователь жалуется на боль или сильный стресс — посоветовать обратиться к специалисту и не давать упражнений.\n\n9. Всегда добавляй в конце напоминание: «Слушай тело. При острой боли — остановись».\n\n10. Отвечай коротко, тепло, с эмодзи. Будь как друг, который разбирается в спорте.'
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
