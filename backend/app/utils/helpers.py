"""
Sentinel Helper Functions - Common Utilities
"""

import re
from typing import Optional
from functools import wraps
from flask import jsonify
import logging

def is_valid_ethereum_address(address: str) -> bool:
    """Validate if a string is a valid Ethereum address"""
    if not address:
        return False
    pattern = r'^0x[a-fA-F0-9]{40}$'
    return bool(re.match(pattern, address))

def validate_ethereum_address(address: str) -> bool:
    """Alias for is_valid_ethereum_address for backward compatibility"""
    return is_valid_ethereum_address(address)

def format_wei_to_ether(wei_amount: int) -> float:
    """Convert Wei to Ether"""
    if wei_amount is None:
        return 0.0
    try:
        return float(wei_amount) / (10 ** 18)
    except (ValueError, TypeError):
        return 0.0

def format_address(address: str, short: bool = False) -> str:
    """Format an Ethereum address for display"""
    if not address or not is_valid_ethereum_address(address):
        return "Invalid Address"
    if short:
        return f"{address[:6]}...{address[-4:]}"
    else:
        return address

def handle_errors(func):
    """Decorator to handle API errors gracefully"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logging.error(f"Error in {func.__name__}: {str(e)}")
            return jsonify({
                "error": "Internal server error",
                "message": str(e),
                "endpoint": func.__name__
            }), 500
    return wrapper
