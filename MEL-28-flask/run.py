import logging
from app import create_app

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = create_app()

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    logger.info("Server will be accessible at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)