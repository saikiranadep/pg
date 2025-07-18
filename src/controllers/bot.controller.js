require('dotenv').config();
// const { Room } = require('livekit-client');
// const { RTCVideoSink, RTCAudioSink, RTCConfiguration } = require('wrtc');
const generateToken = require('./livekittoken.controller');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// (Optional) dummy STT: logs “audio” chunks
// async function startBot(roomName = 'test-room') {
//     const token = await generateToken.generateToken('voice-bot', roomName);

//     const room = new Room({
//         rtcConfig: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
//         engine: { useWRTC: true },
//     });

//     room.on('trackSubscribed', (track, publication, participant) => {
//         if (track.kind === 'audio') {
//             const sink = new RTCAudioSink(track.mediaStreamTrack);
//             sink.ondata = (data) => {
//                 // Here: send data to STT or just log
//                 console.log(`[Bot] audio data received (${data.samples.length} samples)`);
//             };
//         }
//     });

//     room.connect(process.env.LIVEKIT_URL, token, { autoSubscribe: true })
//         .then(() => console.log('[Bot] connected'))
//         .catch(console.error);
// }

async function startBot(roomName = 'test-room') {
    const token = await generateToken.generateToken('voice-bot', roomName);

    const htmlPath = path.join(__dirname, 'bot-client.html');
    console.log("hmlPATH",htmlPath)
    const botHTML = fs.readFileSync(htmlPath, 'utf8')
        .replace('{{LIVEKIT_URL}}', process.env.LIVEKIT_URL)
        .replace('{{LIVEKIT_TOKEN}}', token);

    const browser = await puppeteer.launch({ headless: true, args: ['--use-fake-ui-for-media-stream'] });
    const page = await browser.newPage();

    await page.setContent(botHTML);

    page.on('console', (msg) => {
        if (msg.type() === 'log') {
            console.log(`[BOT Browser] ${msg.text()}`);
        }
    });

    console.log('[BOT] launched in headless browser');
}

module.exports = startBot;
