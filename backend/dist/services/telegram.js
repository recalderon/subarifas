import { Telegraf } from 'telegraf';
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
let bot = null;
if (botToken) {
    bot = new Telegraf(botToken);
}
else {
    console.warn('TELEGRAM_BOT_TOKEN not found in environment variables');
}
export const sendReceiptToTelegram = async (file, caption, filename) => {
    if (!bot || !chatId) {
        console.error('Telegram bot or chat ID not configured');
        return false;
    }
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await bot.telegram.sendDocument(chatId, {
            source: buffer,
            filename: filename
        }, {
            caption: caption
        });
        return true;
    }
    catch (error) {
        console.error('Error sending receipt to Telegram:', error);
        return false;
    }
};
//# sourceMappingURL=telegram.js.map