import os
import logging
from flask import Flask, request, jsonify, send_from_directory
import requests

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend/static', template_folder='../frontend/templates')

# Configuration from environment variables
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_WEBHOOK_URL = os.getenv('TELEGRAM_WEBHOOK_URL')  # Set this to your Render URL + /webhook
TON_CENTER_API_KEY = os.getenv('TON_CENTER_API_KEY')
ADMIN_WALLET_ADDRESS = os.getenv('ADMIN_WALLET_ADDRESS', 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0')

# Telegram API base URL
TELEGRAM_API_URL = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}' if TELEGRAM_BOT_TOKEN else None

@app.route('/')
def index():
    """Serve the Telegram Mini App"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    """Serve static assets (CSS, JS, images)"""
    return send_from_directory(app.static_folder, path)

@app.route('/webhook', methods=['POST'])
def webhook():
    """Handle incoming updates from Telegram"""
    if request.method == "POST":
        try:
            if not TELEGRAM_BOT_TOKEN:
                logger.error("Telegram bot token not configured")
                return jsonify({'status': 'error', 'message': 'Bot not configured'}), 500
            
            update = request.get_json(force=True)
            if not update:
                return jsonify({'status': 'error', 'message': 'No JSON data'}), 400
            
            logger.info(f"Received update: {update.get('update_id', 'unknown')}")
            
            # Handle the update
            if 'message' in update:
                message = update['message']
                chat_id = message.get('chat', {}).get('id')
                text = message.get('text', '')
                
                # Handle /start command
                if text == '/start':
                    user = message.get('from', {})
                    first_name = user.get('first_name', 'there')
                    
                    welcome_text = (
                        f'Привет, {first_name}! Добро пожаловать в TON FlashBet.\n'
                        'Для открытия приложения используйте меню бота → Открыть Web App\n'
                        'Или перейдите по ссылке: https://ton-flashbet.onrender.com'
                    )
                    
                    # Send message via Telegram Bot API
                    url = f'{TELEGRAM_API_URL}/sendMessage'
                    payload = {
                        'chat_id': chat_id,
                        'text': welcome_text
                    }
                    try:
                        response = requests.post(url, json=payload, timeout=10)
                        response.raise_for_status()
                    except Exception as e:
                        logger.error(f"Failed to send Telegram message: {e}")
                
                # Handle data from Web App
                elif 'web_app_data' in message:
                    web_app_data = message['web_app_data']
                    data = web_app_data.get('data', '')
                    logger.info(f"Received data from TMA: {data}")
                    
                    # Here you would process the data (create bet, etc.)
                    # For now, just send a confirmation
                    confirmation = f'Получены данные из ТМА: {data[:100]}{"..." if len(data) > 100 else ""}'
                    
                    url = f'{TELEGRAM_API_URL}/sendMessage'
                    payload = {
                        'chat_id': chat_id,
                        'text': confirmation
                    }
                    try:
                        response = requests.post(url, json=payload, timeout=10)
                        response.raise_for_status()
                    except Exception as e:
                        logger.error(f"Failed to send Telegram message: {e}")
            
            return jsonify({'status': 'ok'})
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500
    else:
        return jsonify({'status': 'error', 'message': 'Method not allowed'}), 405

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    # For local development
    port = int(os.environ.get('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)