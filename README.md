# DeepSeek AI Assistant для ВКонтакте

Мини-приложение с AI-ассистентом на базе DeepSeek для сообществ ВКонтакте.

## Установка

1. Клонируйте репозиторий
2. Замените API ключ в `app.js` на ваш реальный ключ от DeepSeek
3. Разместите на хостинге (Vercel, GitHub Pages и т.д.)
4. Добавьте URL в настройки сообщества ВКонтакте

## Получение API ключа

1. Зарегистрируйтесь на [DeepSeek Platform](https://platform.deepseek.com/)
2. Перейдите в раздел API Keys
3. Создайте новый ключ
4. Замените `sk-your-deepseek-api-key-here` в `app.js` на ваш ключ

## Структура проекта

- `index.html` - главная страница
- `app.js` - логика приложения
- `package.json` - конфигурация проекта
- `vercel.json` - конфигурация для Vercel
