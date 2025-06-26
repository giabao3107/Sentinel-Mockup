"""
Sentinel API - Blueprint Registration
"""

from flask import Blueprint

# Create wallet analysis blueprint
wallet_bp = Blueprint('wallet', __name__)

# Import routes (this registers the routes with the blueprint)
from app.api import wallet 