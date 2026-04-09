import https from 'https';

export function sendTelegramNotification(message) {
    const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();

    if (!token || !chatId) {
        console.error('[telegram] missing env vars', { hasToken: !!token, hasChatId: !!chatId });
        return Promise.resolve();
    }

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
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error('[telegram] non-200 response', res.statusCode, data);
                } else {
                    console.log('[telegram] message sent ok');
                }
                resolve();
            });
        });

        req.on('error', (err) => {
            console.error('[telegram] request error', err.message);
            resolve();
        });

        req.write(body);
        req.end();
    });
}
