const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const auditRoutes = require('./routes/audit.routes');
const assistantRoutes = require('./routes/assistant.routes');
const liveKitRoutes = require('./routes/livekittoken.routes');
const startBot = require('./controllers/bot.controller');

const app = express();

app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/livekit', liveKitRoutes);

app.post('/start-bot', (req, res) => {
    const { room } = req.body;
    if (!room) return res.status(400).send({ error: 'room is required' });
    startBot(room);
    res.send({ status: 'bot_started', room });
});

app.use((err, req, res, next) => {
    console.error('APPJS', err);
    res.status(500).json({ status: false, message: "APPLICATION CRASHED...", error: err.message || 'Something went wrong', code: 'APP_ERROR' });
});

module.exports = app;
