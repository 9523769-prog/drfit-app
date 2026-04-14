import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// VK Mini Apps Middleware
app.use((req, res, next) => {
    // Добавляем заголовки для VK
    res.setHeader('X-Frame-Options', 'ALLOW-FROM https://vk.com');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://vk.com https://*.vk.com");
    next();
});

// Основной маршрут для VK Mini App
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Маршрут для мобильной версии
app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'mobile.html'));
});

// API для VK
app.get('/vk-auth', (req, res) => {
    const { viewer_id, access_token, api_url } = req.query;
    res.json({ 
        status: 'success',
        viewer_id,
        app_id: process.env.VK_APP_ID 
    });
});

// DeepSeek API endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты полезный AI-ассистент для пользователей ВКонтакте. Отвечай на русском языке.'
                    },
                    ...history.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json();
        res.json({ 
            success: true,
            response: data.choices[0].message.content 
        });
        
    } catch (error) {
        console.error('DeepSeek API error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при обращении к AI' 
        });
    }
});

// Health check для VK
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.listen(PORT, () => {
    console.log(`VK Mini App running on http://localhost:${PORT}`);
    console.log('DeepSeek AI Assistant ready for VK!');
});
