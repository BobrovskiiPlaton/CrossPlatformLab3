const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Прокси для launchpads
app.get('/launchpads', async (req, res) => {
    try {
        console.log('Получаем launchpads из SpaceX API...');
        const response = await fetch('https://api.spacexdata.com/v4/launchpads');
        const launchpads = await response.json();
        
        console.log(`Получено ${launchpads.length} стартовых площадок`);
        
        res.json({
            success: true,
            count: launchpads.length,
            data: launchpads
        });
        
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// Получить конкретную стартовую площадку
app.get('/launchpads/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Получаем launchpad ${id}...`);
        
        const response = await fetch(`https://api.spacexdata.com/v4/launchpads/${id}`);
        const launchpad = await response.json();
        
        console.log(`Получена площадка: ${launchpad.name}`);
        
        res.json({
            success: true,
            data: launchpad
        });
        
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// Тестовый endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'SpaceX API работает!' });
});

app.listen(PORT, () => {
    console.log(`API сервер запущен на http://localhost:${PORT}`);
});