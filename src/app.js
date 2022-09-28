import 'dotenv/config';
import Bot from './wss/bot.js';

const bot = new Bot();

bot.start();
