import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class Config:
    # Telegram
    TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
    TELEGRAM_WEBHOOK_URL = os.getenv('TELEGRAM_WEBHOOK_URL')  # Set this to your Render URL + /webhook
    
    # TON
    TON_CENTER_API_KEY = os.getenv('TON_CENTER_API_KEY')
    TON_CENTER_API_URL = 'https://toncenter.com/api/v2'
    ADMIN_WALLET_ADDRESS = os.getenv('ADMIN_WALLET_ADDRESS', 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0')
    
    # CoinGecko
    COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
    
    # Flask
    FLASK_ENV = os.getenv('FLASK_ENV', 'production')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Database (if using one, e.g., SQLite for simplicity)
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///flashbet.db')
    
    # Telegram Stars (for payments)
    TELEGRAM_STARS_PROVIDER_TOKEN = os.getenv('TELEGRAM_STARS_PROVIDER_TOKEN')

