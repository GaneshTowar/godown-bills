import https from 'https';

export function sendTelegramNotification(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) return Promise.resolve();

    const body = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
    });

    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        }, (res) => {
            res.resume();
            res.on('end', resolve);
        });

        req.on('error', resolve); // fail silently
        req.write(body);
        req.end();
    });
}
