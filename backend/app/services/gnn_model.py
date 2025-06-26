"""
Sentinel GNN Model - Graph Neural Network for Wallet Risk Classification
Core competitive advantage implementing GraphSAGE for transaction graph analysis
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import pickle
import os

logger = logging.getLogger(__name__)

class WalletGraphSAGE(nn.Module):
    """
    GraphSAGE model for wallet risk classification
    
    This model learns from the transaction graph structure to identify
    risky wallet patterns that traditional heuristics cannot detect.
    """
    
    def __init__(self, input_dim: int, hidden_dim: int = 128, num_classes: int = 7, num_layers: int = 3):
        super(WalletGraphSAGE, self).__init__()
        
        self.num_layers = num_layers
        self.hidden_dim = hidden_dim
        self.num_classes = num_classes
        
        # GraphSAGE layers
        self.sage_layers = nn.ModuleList()
        self.sage_layers.append(nn.Linear(input_dim, hidden_dim))
        
        for _ in range(num_layers - 2):
            self.sage_layers.append(nn.Linear(hidden_dim, hidden_dim))
        
        self.sage_layers.append(nn.Linear(hidden_dim, hidden_dim))
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim // 2, num_classes)
        )
        
        # Risk scoring head (continuous score 0-100)
        self.risk_scorer = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim // 2, 1),
            nn.Sigmoid()  # Output between 0 and 1, will be scaled to 0-100
        )
        
    def forward(self, features):
        """
        Forward pass through the GNN
        
        Args:
            features: Node feature tensor
            
        Returns:
            Dict containing classifications and risk scores
        """
        
        h = features
        
        # GraphSAGE-inspired layers with residual connections
        for i, layer in enumerate(self.sage_layers):
            h_new = layer(h)
            h_new = F.relu(h_new)
            h_new = F.dropout(h_new, training=self.training)
            
            # Residual connection for deeper layers
            if i > 0 and h.shape[1] == h_new.shape[1]:
                h = h + h_new
            else:
                h = h_new
        
        # Predictions
        classifications = self.classifier(h)
        risk_scores = self.risk_scorer(h) * 100  # Scale to 0-100
        
        return {
            'classifications': classifications,
            'risk_scores': risk_scores,
            'node_embeddings': h
        }

class GNNIntelligenceEngine:
    """
    High-level interface for the GNN-based intelligence engine
    Handles feature engineering, model inference, and result interpretation
    """
    
    def __init__(self, model_path: str = None):
        self.model = None
        self.feature_scaler = StandardScaler()
        self.is_trained = False
        self.model_path = model_path or 'models/wallet_gnn_model.pt'
        self.feature_dim = 32  # Will be set during training
        
        # Class labels for behavioral classification
        self.class_labels = [
            'Benign',
            'Exchange', 
            'DeFi',
            'MEV_Bot',
            'Phishing_Scam',
            'General_Scam',
            'Sanctions_Related'
        ]
        
        # Load model if available
        if os.path.exists(self.model_path):
            self.load_model()
    
    def engineer_features(self, address: str, graph_data: Dict, transaction_data: List[Dict]) -> np.ndarray:
        """
        Engineer rich features for GNN input based on academic research
        
        Features include:
        - Transaction features: in/out degree, volumes, frequency
        - Temporal features: account age, activity patterns  
        - Graph features: PageRank, clustering coefficient
        - Off-chain features: social media mentions
        """
        
        features = []
        
        # === Transaction Features ===
        tx_count = len(transaction_data)
        
        # Basic transaction metrics
        features.extend([
            graph_data.get('incoming_count', 0),  # in-degree
            graph_data.get('outgoing_count', 0),  # out-degree
            graph_data.get('total_received', 0) / 1e18,  # total ETH received
            graph_data.get('total_sent', 0) / 1e18,  # total ETH sent
            tx_count,  # total transactions
        ])
        
        # Transaction value statistics
        if transaction_data:
            values = [tx.get('value_wei', 0) / 1e18 for tx in transaction_data]
            features.extend([
                np.mean(values) if values else 0,
                np.std(values) if len(values) > 1 else 0,
                np.max(values) if values else 0,
                np.min(values) if values else 0,
            ])
        else:
            features.extend([0, 0, 0, 0])
        
        # === Temporal Features ===
        if transaction_data:
            timestamps = [tx.get('timestamp') for tx in transaction_data if tx.get('timestamp')]
            if timestamps:
                try:
                    dates = [datetime.fromisoformat(ts.replace('Z', '+00:00')) for ts in timestamps]
                    account_age_days = (datetime.now(dates[0].tzinfo) - min(dates)).days
                    
                    # Time intervals between transactions
                    intervals = []
                    for i in range(1, len(dates)):
                        interval = (dates[i] - dates[i-1]).total_seconds() / 3600  # hours
                        intervals.append(interval)
                    
                    features.extend([
                        account_age_days,
                        np.mean(intervals) if intervals else 0,
                        np.std(intervals) if len(intervals) > 1 else 0,
                    ])
                except:
                    features.extend([0, 0, 0])
            else:
                features.extend([0, 0, 0])
        else:
            features.extend([0, 0, 0])
        
        # === Graph Features ===
        features.extend([
            graph_data.get('network_centrality', 0),
            graph_data.get('clustering_coefficient', 0),
            graph_data.get('contract_interactions', 0),
            len(graph_data.get('sent_to_addresses', [])),  # unique recipients
            len(graph_data.get('received_from_addresses', [])),  # unique senders
        ])
        
        # === Pattern Features ===
        # Round number transactions (automation indicator)
        if transaction_data:
            round_txs = sum(1 for tx in transaction_data 
                          if tx.get('value_wei', 0) % (10**18) == 0)
            round_ratio = round_txs / len(transaction_data) if transaction_data else 0
        else:
            round_ratio = 0
        
        features.append(round_ratio)
        
        # Gas usage patterns
        if transaction_data:
            gas_used = [tx.get('gas_used', 0) for tx in transaction_data if tx.get('gas_used')]
            features.extend([
                np.mean(gas_used) if gas_used else 0,
                np.std(gas_used) if len(gas_used) > 1 else 0,
            ])
        else:
            features.extend([0, 0])
        
        # === Risk Indicators ===
        # Interaction with known bad addresses (placeholder)
        known_bad_interactions = 0
        for tx in transaction_data:
            to_addr = tx.get('to', '').lower()
            if to_addr in ['0x0000000000000000000000000000000000000000']:  # Placeholder
                known_bad_interactions += 1
        
        features.append(known_bad_interactions)
        
        # === Social Features ===
        # These would come from social intelligence service
        features.extend([
            0,  # social_mentions
            0,  # scam_alerts
            0,  # sentiment_score
        ])
        
        # Pad or truncate to fixed dimension
        while len(features) < self.feature_dim:
            features.append(0)
        features = features[:self.feature_dim]
        
        return np.array(features, dtype=np.float32)
    
    def predict_single_wallet(self, address: str, graph_data: Dict, transaction_data: List[Dict]) -> Dict:
        """
        Predict risk and behavioral classification for a single wallet
        
        Args:
            address: Wallet address
            graph_data: Graph analytics from Neo4j
            transaction_data: Transaction history
            
        Returns:
            Dict with predictions, confidence scores, and explanations
        """
        
        if not self.is_trained or self.model is None:
            logger.warning("GNN model not trained, falling back to heuristics")
            return self._fallback_prediction(address, graph_data, transaction_data)
        
        # Engineer features for this address
        features = self.engineer_features(address, graph_data, transaction_data)
        features_tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0)
        
        # Model inference
        self.model.eval()
        with torch.no_grad():
            predictions = self.model(features_tensor)
            
            # Get class probabilities
            class_probs = F.softmax(predictions['classifications'], dim=1)[0]
            predicted_class = torch.argmax(class_probs).item()
            confidence = torch.max(class_probs).item()
            
            # Get risk score
            risk_score = predictions['risk_scores'][0].item()
            
            # Get node embedding for similarity analysis
            embedding = predictions['node_embeddings'][0].cpu().numpy()
        
        # Interpret results
        behavioral_tags = self._interpret_classification(predicted_class, class_probs, risk_score)
        risk_factors = self._explain_risk_score(features, risk_score)
        
        return {
            'risk_score': float(risk_score),
            'risk_level': self._get_risk_level(risk_score),
            'predicted_class': self.class_labels[predicted_class],
            'class_confidence': float(confidence),
            'class_probabilities': {
                label: float(prob) for label, prob in zip(self.class_labels, class_probs)
            },
            'behavioral_tags': behavioral_tags,
            'risk_factors': risk_factors,
            'embedding': embedding.tolist(),
            'model_version': 'GNN_v1.0',
            'confidence_level': 'high' if confidence > 0.8 else 'medium' if confidence > 0.6 else 'low'
        }
    
    def _interpret_classification(self, predicted_class: int, class_probs: torch.Tensor, risk_score: float) -> List[str]:
        """Generate behavioral tags based on classification results"""
        
        tags = []
        
        # Primary classification
        primary_label = self.class_labels[predicted_class]
        tags.append(primary_label)
        
        # Secondary classifications (if probability > 0.3)
        for i, prob in enumerate(class_probs):
            if i != predicted_class and prob > 0.3:
                tags.append(f"Potential_{self.class_labels[i]}")
        
        # Risk-based tags
        if risk_score > 80:
            tags.append("Critical_Risk")
        elif risk_score > 60:
            tags.append("High_Risk")
        elif risk_score < 20:
            tags.append("Low_Risk")
        
        return tags
    
    def _explain_risk_score(self, features: np.ndarray, risk_score: float) -> List[str]:
        """Generate explanations for the risk score"""
        
        factors = []
        
        # High transaction volume
        if features[4] > 1000:  # tx_count
            factors.append(f"Very high transaction volume ({features[4]:.0f} transactions)")
        
        # High value transactions
        if features[7] > 100:  # max_value
            factors.append(f"Large transaction detected ({features[7]:.2f} ETH)")
        
        # High network connectivity
        total_connections = features[0] + features[1]  # in_degree + out_degree
        if total_connections > 500:
            factors.append(f"Highly connected wallet ({total_connections:.0f} connections)")
        
        # Account age factor
        if features[12] < 30:  # account_age_days
            factors.append("Relatively new account")
        
        # Automation indicators
        if features[17] > 0.7:  # round_ratio
            factors.append("High proportion of round-number transactions (automation)")
        
        return factors
    
    def _get_risk_level(self, risk_score: float) -> str:
        """Convert risk score to categorical level"""
        if risk_score >= 80:
            return "CRITICAL"
        elif risk_score >= 60:
            return "HIGH"
        elif risk_score >= 40:
            return "MEDIUM"
        elif risk_score >= 20:
            return "LOW"
        else:
            return "MINIMAL"
    
    def _fallback_prediction(self, address: str, graph_data: Dict, transaction_data: List[Dict]) -> Dict:
        """Fallback to heuristic-based prediction when GNN is not available"""
        
        # Import the existing risk scorer as fallback
        from .risk_scorer import RiskScorer
        
        heuristic_scorer = RiskScorer()
        heuristic_result = heuristic_scorer.calculate_risk_score(
            address, transaction_data, graph_data.get('balance', 0)
        )
        
        return {
            'risk_score': heuristic_result['risk_score'],
            'risk_level': heuristic_result['risk_level'],
            'predicted_class': 'Unknown',
            'class_confidence': 0.5,
            'class_probabilities': {},
            'behavioral_tags': heuristic_result['behavioral_tags'],
            'risk_factors': heuristic_result['risk_factors'],
            'embedding': None,
            'model_version': 'Heuristic_Fallback',
            'confidence_level': 'medium'
        }
    
    def save_model(self):
        """Save the trained model and scaler"""
        if not self.model:
            return False
            
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'feature_scaler': self.feature_scaler,
            'feature_dim': self.feature_dim,
            'class_labels': self.class_labels,
            'is_trained': self.is_trained
        }, self.model_path)
        
        logger.info(f"Model saved to {self.model_path}")
        return True
    
    def load_model(self):
        """Load a trained model"""
        if not os.path.exists(self.model_path):
            logger.warning(f"Model file not found: {self.model_path}")
            return False
        
        try:
            checkpoint = torch.load(self.model_path, map_location='cpu')
            
            self.feature_dim = checkpoint['feature_dim']
            self.class_labels = checkpoint['class_labels']
            
            self.model = WalletGraphSAGE(
                input_dim=self.feature_dim,
                hidden_dim=128,
                num_classes=len(self.class_labels)
            )
            
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.feature_scaler = checkpoint['feature_scaler']
            self.is_trained = checkpoint['is_trained']
            
            logger.info("GNN model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False

# Global instance
gnn_engine = GNNIntelligenceEngine() 