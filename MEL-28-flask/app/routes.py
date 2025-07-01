import logging
from flask import Blueprint, jsonify, render_template, request, current_app
from sentence_transformers import SentenceTransformer, util
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os
import pickle
import random  # For generating random prices and ratings
import csv
from collections import Counter
from threading import Lock
import json
from datetime import datetime
import torch
from torch import nn
import torch.nn.functional as F

# Configure route-specific logger with DEBUG level
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

main_bp = Blueprint('main', __name__)

# Initialize the SBERT model
logger.info("Initializing SBERT model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
logger.info("SBERT model initialized successfully")

# File paths for cached data
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
PRODUCTS_CACHE = os.path.join(CACHE_DIR, 'products.pkl')
EMBEDDINGS_CACHE = os.path.join(CACHE_DIR, 'embeddings.pkl')
FEEDBACK_WEIGHTS_CACHE = os.path.join(CACHE_DIR, 'feedback_weights.pkl')
CSV_PATH = os.path.join(os.path.dirname(__file__), 'train_mini.csv')
FEEDBACK_PATH = os.path.join(CACHE_DIR, 'product_feedback.csv')
GENERAL_FEEDBACK_PATH = os.path.join(CACHE_DIR, 'general_feedback.json')

# Ensure cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)

# Initialize feedback locks
product_feedback_lock = Lock()
general_feedback_lock = Lock()
model_update_lock = Lock()

# Feedback Learning Rate
FEEDBACK_LEARNING_RATE = 0.01

class FeedbackAdjustmentModel(nn.Module):
    def __init__(self, embedding_dim):
        super(FeedbackAdjustmentModel, self).__init__()
        self.weight = nn.Parameter(torch.ones(embedding_dim))
        self.bias = nn.Parameter(torch.zeros(1))
    
    def forward(self, embeddings):
        return embeddings * self.weight + self.bias

def load_or_initialize_feedback_model(embedding_dim):
    """Load or initialize the feedback adjustment model"""
    if os.path.exists(FEEDBACK_WEIGHTS_CACHE):
        try:
            with open(FEEDBACK_WEIGHTS_CACHE, 'rb') as f:
                state_dict = pickle.load(f)
                model = FeedbackAdjustmentModel(embedding_dim)
                model.load_state_dict(state_dict)
                logger.info("Loaded feedback adjustment model from cache")
                return model
        except Exception as e:
            logger.error(f"Error loading feedback model: {str(e)}")
    
    model = FeedbackAdjustmentModel(embedding_dim)
    logger.info("Initialized new feedback adjustment model")
    return model

def save_feedback_model(model):
    """Save the feedback adjustment model weights"""
    try:
        with open(FEEDBACK_WEIGHTS_CACHE, 'wb') as f:
            pickle.dump(model.state_dict(), f)
        logger.info("Saved feedback adjustment model to cache")
    except Exception as e:
        logger.error(f"Error saving feedback model: {str(e)}")

def update_model_with_feedback(feedback_data, embeddings):
    """Update the model based on feedback data"""
    with model_update_lock:
        try:
            # Initialize or load feedback adjustment model
            feedback_model = load_or_initialize_feedback_model(embeddings.shape[1])
            feedback_model.train()
            
            # Convert feedback to tensors
            embedding_tensor = torch.tensor(embeddings, dtype=torch.float32)
            
            # Create target scores based on feedback
            target_scores = torch.ones(len(embeddings))
            for idx, score in feedback_data.items():
                if isinstance(idx, tuple):  # Handle product-specific feedback
                    product_idx = int(idx[0])
                    target_scores[product_idx] += score * FEEDBACK_LEARNING_RATE
            
            # Normalize target scores
            target_scores = F.normalize(target_scores.unsqueeze(0), p=2, dim=1).squeeze(0)
            
            # Compute adjusted embeddings
            adjusted_embeddings = feedback_model(embedding_tensor)
            
            # Compute loss (cosine similarity between adjusted embeddings and target scores)
            similarity = F.cosine_similarity(adjusted_embeddings, embedding_tensor)
            loss = F.mse_loss(similarity, target_scores)
            
            # Update model
            optimizer = torch.optim.Adam(feedback_model.parameters(), lr=FEEDBACK_LEARNING_RATE)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            # Save updated model
            save_feedback_model(feedback_model)
            
            # Return adjusted embeddings
            return adjusted_embeddings.detach().numpy()
            
        except Exception as e:
            logger.error(f"Error updating model with feedback: {str(e)}")
            return embeddings

def process_feedback_and_update_model(product_id, vote, query):
    """Process feedback and update the model in real-time"""
    try:
        # Step 1: Save feedback data
        save_product_feedback(product_id, products[int(product_id)]['title'], vote, query)
        logger.info("Saved feedback data successfully")
        
        # Step 2: Load all feedback data
        feedback_scores = load_product_feedback()
        logger.info("Loaded existing feedback data")
        
        # Step 3: Update similarity model
        global embeddings
        embeddings = update_model_with_feedback(feedback_scores, embeddings)
        logger.info("Updated model with feedback")
        
        # Step 4: Save updated embeddings
        save_to_cache(embeddings, EMBEDDINGS_CACHE)
        logger.info("Saved updated embeddings to cache")
        
        return True
    except Exception as e:
        logger.error(f"Error processing feedback: {str(e)}")
        return False

def generate_random_price():
    """Generate a realistic random price between 9.99 and 299.99"""
    return round(random.uniform(9.99, 299.99), 2)

def generate_random_rating():
    """Generate a realistic random rating between 3.5 and 5.0"""
    return round(random.uniform(3.5, 5.0), 1)

def save_to_cache(data, filepath):
    logger.info(f"Saving data to cache: {filepath}")
    try:
        with open(filepath, 'wb') as f:
            pickle.dump(data, f)
        logger.debug(f"Successfully saved data to {filepath}")
    except Exception as e:
        logger.error(f"Error saving to cache {filepath}: {str(e)}", exc_info=True)
        raise

def load_from_cache(filepath):
    logger.info(f"Loading data from cache: {filepath}")
    try:
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
        logger.debug(f"Successfully loaded data from {filepath}")
        return data
    except Exception as e:
        logger.error(f"Error loading from cache {filepath}: {str(e)}", exc_info=True)
        raise

def load_product_feedback():
    """Load product-specific feedback and compute score map"""
    if not os.path.exists(FEEDBACK_PATH):
        return Counter()
    
    try:
        feedback_df = pd.read_csv(FEEDBACK_PATH, names=['product_id', 'title', 'vote', 'query', 'timestamp'])
        score_map = Counter()
        
        # Compute scores based on upvotes/downvotes
        for _, row in feedback_df.iterrows():
            key = (row['product_id'], row['query'])
            score_map[key] += 1 if row['vote'] == 'up' else -1
            
        return score_map
    except Exception as e:
        logger.error(f"Error loading product feedback: {str(e)}")
        return Counter()

def save_product_feedback(product_id, title, vote, query):
    """Save product-specific feedback to CSV"""
    try:
        with product_feedback_lock:
            with open(FEEDBACK_PATH, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([product_id, title, vote, query, datetime.now().isoformat()])
        logger.info(f"Saved product feedback for product: {title}")
    except Exception as e:
        logger.error(f"Error saving product feedback: {str(e)}")

def load_general_feedback():
    """Load general feedback from JSON file"""
    if not os.path.exists(GENERAL_FEEDBACK_PATH):
        return []
    
    try:
        with open(GENERAL_FEEDBACK_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading general feedback: {str(e)}")
        return []

def save_general_feedback(rating, comment, query):
    """Save general feedback to JSON file"""
    try:
        feedback_data = load_general_feedback()
        
        new_feedback = {
            'rating': rating,
            'comment': comment,
            'query': query,
            'timestamp': datetime.now().isoformat()
        }
        
        with general_feedback_lock:
            feedback_data.append(new_feedback)
            with open(GENERAL_FEEDBACK_PATH, 'w', encoding='utf-8') as f:
                json.dump(feedback_data, f, indent=2)
                
        logger.info("Saved general feedback")
    except Exception as e:
        logger.error(f"Error saving general feedback: {str(e)}")

def adjust_similarity_scores(similarity_scores, products, query, feedback_scores, adjustment_factor=0.05):
    """Adjust similarity scores based on feedback"""
    adjusted_scores = similarity_scores.copy()
    
    for idx, product in enumerate(products):
        key = (str(idx), query)  # Use product_id and query as key
        feedback_score = feedback_scores.get(key, 0)
        adjusted_scores[idx] += adjustment_factor * feedback_score
    
    return adjusted_scores

# Load and prepare the Amazon products dataset
def load_products():
    # Check if cached data exists
    if os.path.exists(PRODUCTS_CACHE) and os.path.exists(EMBEDDINGS_CACHE):
        logger.info("Found cached data, loading from disk...")
        try:
            products = load_from_cache(PRODUCTS_CACHE)
            embeddings = load_from_cache(EMBEDDINGS_CACHE)
            logger.info(f"Successfully loaded cached data. Products count: {len(products)}")
            return products, embeddings
        except Exception as e:
            logger.error(f"Error loading cached data: {str(e)}", exc_info=True)
    
    logger.info("No cache found or cache loading failed. Processing data from CSV...")
    try:
        # Check if CSV file exists
        if not os.path.exists(CSV_PATH):
            logger.error(f"CSV file not found at path: {CSV_PATH}")
            raise FileNotFoundError(f"CSV file not found at path: {CSV_PATH}")

        # Load the CSV file with chunking
        logger.debug(f"Reading CSV file from: {CSV_PATH}")
        # Read only first 1000 products for testing
        df = pd.read_csv(CSV_PATH, nrows=1000)
        logger.info(f"CSV loaded successfully. Shape: {df.shape}, Columns: {df.columns.tolist()}")
        
        # Verify required columns exist
        required_columns = ['TITLE', 'DESCRIPTION']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            raise ValueError(f"CSV file must contain columns: {required_columns}")
        
        products = []
        
        # Convert DataFrame rows to list of dictionaries
        logger.debug("Converting DataFrame to product list...")
        for idx, row in df.iterrows():
            try:
                product = {
                    'id': str(idx),
                    'title': str(row['TITLE']).strip(),
                    'description': str(row['DESCRIPTION']).strip(),
                    'price': f"{generate_random_price():.2f}",  # Generate random price
                    'stars': str(generate_random_rating())  # Generate random rating
                }
                products.append(product)
                if idx == 0:
                    logger.debug(f"Sample product: {product}")
            except Exception as e:
                logger.error(f"Error processing row {idx}: {str(e)}", exc_info=True)
                continue
        
        logger.info(f"Successfully processed {len(products)} products")
        
        if not products:
            logger.error("No products were processed from the CSV file")
            raise ValueError("No products were processed from the CSV file")
        
        # Compute embeddings for all product descriptions
        logger.debug("Computing embeddings for product descriptions...")
        descriptions = [p['description'] for p in products]
        embeddings = model.encode(descriptions, convert_to_tensor=True)
        logger.info(f"Embeddings computed successfully. Shape: {embeddings.shape}")
        
        # Cache the results
        logger.info("Saving processed data to cache...")
        save_to_cache(products, PRODUCTS_CACHE)
        save_to_cache(embeddings, EMBEDDINGS_CACHE)
        logger.info("Data cached successfully")
        
        return products, embeddings
    except Exception as e:
        logger.error(f"Error loading products: {str(e)}", exc_info=True)
        # Create some sample products if everything fails
        logger.info("Creating sample products as fallback...")
        sample_products = [
            {
                'id': '0',
                'title': 'Sample Product 1',
                'description': 'This is a sample product description',
                'price': '29.99',
                'stars': '4.5'
            },
            {
                'id': '1',
                'title': 'Sample Product 2',
                'description': 'Another sample product description',
                'price': '39.99',
                'stars': '4.0'
            }
        ]
        sample_descriptions = [p['description'] for p in sample_products]
        sample_embeddings = model.encode(sample_descriptions, convert_to_tensor=True)
        return sample_products, sample_embeddings

logger.info("Starting initial product load...")
# Initialize products and embeddings
products, embeddings = load_products()
logger.info(f"Initial product load complete. Products count: {len(products)}")

@main_bp.route('/')
def index():
    logger.info("Serving index page")
    return render_template('index.html')

@main_bp.route('/api/products', methods=['GET'])
def get_products():
    # Get pagination parameters from query string
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=12, type=int)  # Default to 12 products per page
    
    # Validate and limit parameters
    page = max(1, page)  # Ensure page is at least 1
    per_page = min(max(1, per_page), 50)  # Limit per_page between 1 and 50
    
    logger.info(f"Handling /api/products request. Page: {page}, Per page: {per_page}")
    
    if not products:
        logger.error("Products list is empty")
        return jsonify({'error': 'No products available'}), 500
    
    # Calculate start and end indices
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    # Get paginated products
    paginated_products = products[start_idx:end_idx]
    
    # Prepare response with pagination metadata
    response = {
        'products': paginated_products,
        'pagination': {
            'total_products': len(products),
            'total_pages': (len(products) + per_page - 1) // per_page,
            'current_page': page,
            'per_page': per_page,
            'has_next': end_idx < len(products),
            'has_prev': page > 1
        }
    }
    
    logger.info(f"Returning {len(paginated_products)} products for page {page}")
    return jsonify(response)

@main_bp.route('/api/search', methods=['POST'])
def search_products():
    logger.info("Handling text search request")
    
    data = request.get_json()
    if not data or 'query' not in data:
        logger.error("No search query provided")
        return jsonify({'error': 'No search query provided'}), 400
        
    query = data['query']
    if not query.strip():
        logger.error("Empty search query")
        return jsonify({'error': 'Empty search query'}), 400
    
    try:
        # Load feedback scores
        feedback_scores = load_product_feedback()
        
        # Encode the search query
        logger.debug(f"Encoding search query: {query}")
        query_embedding = model.encode([query], convert_to_tensor=True)
        
        # Compute similarity scores with all products
        similarity_scores = cosine_similarity(
            query_embedding,
            embeddings
        )[0]
        
        # Adjust scores based on feedback
        adjusted_scores = adjust_similarity_scores(similarity_scores, products, query, feedback_scores)
        
        # Get top 6 most similar products using adjusted scores
        top_indices = np.argsort(adjusted_scores)[::-1][:6]
        similar_products = [
            {
                **products[idx],
                'similarity_score': float(adjusted_scores[idx]),
                'base_similarity': float(similarity_scores[idx]),
                'feedback_score': feedback_scores.get((str(idx), query), 0)
            }
            for idx in top_indices
        ]
        
        logger.info(f"Found {len(similar_products)} products matching the query")
        return jsonify({
            'query': query,
            'products': similar_products
        })
        
    except Exception as e:
        logger.error(f"Error processing search query: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to process search query'}), 500

def process_general_feedback(rating, comment, query):
    """Process general feedback about the system"""
    try:
        # Step 1: Save general feedback
        save_general_feedback(rating, comment, query)
        logger.info("Saved general feedback successfully")
        
        # Step 2: Load all feedback data
        feedback_scores = load_product_feedback()  # Load product feedback too as it might influence general adjustments
        general_feedback = load_general_feedback()
        logger.info("Loaded existing feedback data")
        
        # Step 3: Compute average rating from general feedback
        recent_ratings = [f['rating'] for f in general_feedback[-10:]]  # Consider last 10 feedbacks
        if recent_ratings:
            avg_rating = sum(recent_ratings) / len(recent_ratings)
            # Adjust learning rate based on average rating
            global FEEDBACK_LEARNING_RATE
            FEEDBACK_LEARNING_RATE = max(0.005, min(0.02, 0.01 * (avg_rating / 3.0)))
            logger.info(f"Adjusted learning rate to {FEEDBACK_LEARNING_RATE} based on feedback")
        
        # Step 4: Update similarity model with adjusted learning rate
        global embeddings
        embeddings = update_model_with_feedback(feedback_scores, embeddings)
        logger.info("Updated model with feedback")
        
        # Step 5: Save updated embeddings
        save_to_cache(embeddings, EMBEDDINGS_CACHE)
        logger.info("Saved updated embeddings to cache")
        
        return True
    except Exception as e:
        logger.error(f"Error processing general feedback: {str(e)}")
        return False

@main_bp.route('/api/feedback/process', methods=['POST'])
def process_feedback():
    """Handle feedback processing and model updates"""
    try:
        data = request.get_json()
        feedback_type = data.get('type')
        
        if feedback_type == 'product':
            # Process product-specific feedback
            if not all(k in data for k in ['productId', 'vote', 'query']):
                return jsonify({
                    'status': 'error',
                    'message': 'Missing required fields for product feedback'
                }), 400
            
            logger.info("Starting product feedback processing...")
            success = process_feedback_and_update_model(
                data['productId'],
                data['vote'],
                data.get('query', '')
            )
        elif feedback_type == 'general':
            # Process general feedback
            if not all(k in data for k in ['rating', 'comment', 'query']):
                return jsonify({
                    'status': 'error',
                    'message': 'Missing required fields for general feedback'
                }), 400
            
            logger.info("Starting general feedback processing...")
            success = process_general_feedback(
                data['rating'],
                data['comment'],
                data.get('query', '')
            )
        else:
            return jsonify({
                'status': 'error',
                'message': 'Invalid feedback type'
            }), 400
        
        if not success:
            return jsonify({
                'status': 'error',
                'message': 'Failed to process feedback'
            }), 500
        
        return jsonify({
            'status': 'success',
            'message': 'Feedback processed and model updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error in feedback processing endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@main_bp.route('/api/similar-products/<product_id>', methods=['GET'])
def get_similar_products(product_id):
    logger.info(f"Handling similar products request for product_id: {product_id}")
    if not products or embeddings is None:
        logger.error("Products or embeddings not available")
        return jsonify({'error': 'Products data not available'}), 500
        
    try:
        product_idx = int(product_id)
        if product_idx < 0 or product_idx >= len(products):
            logger.warning(f"Product ID {product_id} out of range")
            return jsonify({'error': 'Product not found'}), 404
    except ValueError:
        logger.warning(f"Invalid product ID format: {product_id}")
        return jsonify({'error': 'Invalid product ID'}), 400
    
    logger.debug("Computing similarity scores...")
    # Compute similarity scores
    query_embedding = embeddings[product_idx]
    similarity_scores = cosine_similarity(
        query_embedding.reshape(1, -1),
        embeddings
    )[0]
    
    # Get top 5 similar products (excluding the query product)
    similar_indices = np.argsort(similarity_scores)[::-1][1:6]  # Top 5 excluding self
    similar_products = [
        {
            **products[idx],
            'similarity_score': float(similarity_scores[idx])
        }
        for idx in similar_indices
    ]
    
    logger.info(f"Found {len(similar_products)} similar products for product_id: {product_id}")
    return jsonify({
        'query_product': products[product_idx],
        'similar_products': similar_products
    })