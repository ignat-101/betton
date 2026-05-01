from telegram import Update, InlineKeyboardButton, InlineKeyboardReplyMarkup, WebAppInfo
from telegram.ext import CallbackContext
import json
import logging
from config import Config

logger = logging.getLogger(__name__)

def start(update: Update, context: CallbackContext):
    """Send a message when the command /start is issued."""
    user = update.effective_user
    # Create a WebAppInfo object for the TMA
    web_app = WebAppInfo(url=Config.TELEGRAM_WEBHOOK_URL)  # This should be the URL of your TMA
    # Create a button that opens the TMA
    keyboard = [
        [InlineKeyboardButton("Открыть FlashBet", web_app=web_app)]
    ]
    reply_markup = InlineKeyboardReplyMarkup(keyboard)
    
    update.message.reply_text(
        f'Привет, {user.first_name}! Добро пожаловать в TON FlashBet.\n'
        'Нажмите кнопку ниже, чтобы открыть приложение и начать делать ставки.',
        reply_markup=reply_markup
    )

def web_app_data(update: Update, context: CallbackContext):
    """Handle data sent from the Telegram Mini App."""
    try:
        data = json.loads(update.effective_message.web_app_data.data)
        logger.info(f"Received data from TMA: {data}")
        
        # Here we would process the data, e.g., create a bet, etc.
        # For now, we just acknowledge receipt.
        update.effective_message.reply_text(
            f'Получены данные из ТМА: {data.get("action", "неизвестное действие")}'
        )
    except Exception as e:
        logger.error(f"Error processing web app data: {e}")
        update.effective_message.reply_text(
            'Произошла ошибка при обработке данных из ТМА.'
        )

def setup_handlers(dispatcher):
    """Set up handlers for the bot."""
    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(MessageHandler(Filters.status.update.web_app_data, web_app_data))
    # TODO: Add more handlers for admin functions, bet confirmation, etc.

