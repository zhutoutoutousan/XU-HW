import logging
from flask import Flask
from flask_cors import CORS

logger = logging.getLogger(__name__)

def create_app():
    logger.info("Creating Flask application...")
    app = Flask(__name__)
    
    logger.info("Enabling CORS...")
    CORS(app)  # Enable CORS for all routes
    
    logger.info("Registering blueprints...")
    from .routes import main_bp
    app.register_blueprint(main_bp)
    
    logger.info("Flask application created successfully")
    return app