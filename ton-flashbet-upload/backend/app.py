import os
from flask import Flask, request, jsonify, send_from_directory
from telegram import Update, Bot
from telegram.ext import Dispatcher, CommandHandler, MessageHandler, Filters, CallbackContext
import logging
from config import Config

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend/static', template_folder='../frontend/templates')

# Initialize Telegram bot
bot = Bot(token=Config.TELEGRAM_BOT_TOKEN)
dispatcher = Dispatcher(bot, None, workers=0)

# Import handlers (we'll create these in a separate file to keep things clean)
from app.handlers import setup_handlers
setup_handlers(dispatcher)

# Route for Telegram webhook
@app.route('/webhook', methods=['POST'])
def webhook():
    """Handle incoming updates from Telegram."""
    if request.method == "POST":
        update = Update.de_json(request.get_json(force=True), bot)
        dispatcher.process_update(update)
        return jsonify({'status': 'ok'})
    else:
        raise RuntimeError('Invalid request method')

# Route for serving the TMA (Telegram Mini App) index.html
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# Route for serving static assets (CSS, JS, images) for the TMA
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

# Health check endpoint
@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    # For local development
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=Config.FLASK_DEBUG)