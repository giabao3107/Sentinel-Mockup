"""
Sentinel Graph Database Models
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum

class NodeType(str, Enum):
    """Graph node types"""
    ADDRESS = "Address"
    TRANSACTION = "Transaction"
    SMARTCONTRACT = "SmartContract"

class RelationshipType(str, Enum):
    """Graph relationship types"""
    SENT_TO = "SENT_TO"
    INTERACTED_WITH = "INTERACTED_WITH"
    MADE = "MADE"

class RiskLevel(str, Enum):
    """Risk assessment levels"""
    MINIMAL = "MINIMAL"
    LOW = "LOW" 
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

# === Node Models ===

class AddressNode(BaseModel):
    """Address node model for Neo4j"""
    hash: str = Field(..., description="Ethereum address hash")
    first_seen: Optional[datetime] = Field(None, description="First transaction timestamp")
    last_activity: Optional[datetime] = Field(None, description="Last activity timestamp")
    balance: float = Field(0.0, description="Current balance in ETH")
    transaction_count: int = Field(0, description="Total transaction count")
    risk_score: float = Field(0.0, description="Risk score (0-100)")
    risk_level: RiskLevel = Field(RiskLevel.MINIMAL, description="Risk level classification")
    behavioral_tags: List[str] = Field(default_factory=list, description="Behavioral tags")
    is_contract: bool = Field(False, description="Whether this is a smart contract")
    
    # Social intelligence fields
    twitter_mentions: int = Field(0, description="Twitter mentions count")
    telegram_mentions: int = Field(0, description="Telegram mentions count")
    social_context: List[str] = Field(default_factory=list, description="Social media context")
    
    # ML features for Phase 3
    feature_vector: Optional[List[float]] = Field(None, description="ML feature vector")
    cluster_id: Optional[str] = Field(None, description="Cluster identification")
    
    @validator('hash')
    def validate_address_hash(cls, v):
        """Validate Ethereum address format"""
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid Ethereum address format')
        return v.lower()
    
    @validator('risk_score')
    def validate_risk_score(cls, v):
        """Validate risk score range"""
        if not 0 <= v <= 100:
            raise ValueError('Risk score must be between 0 and 100')
        return v

class TransactionNode(BaseModel):
    """Transaction node model for Neo4j"""
    hash: str = Field(..., description="Transaction hash")
    block_number: int = Field(..., description="Block number")
    timestamp: datetime = Field(..., description="Transaction timestamp")
    value: float = Field(0.0, description="Transaction value in ETH")
    gas_used: int = Field(0, description="Gas used")
    gas_price: int = Field(0, description="Gas price in wei")
    method_id: Optional[str] = Field(None, description="Method ID for contract calls")
    is_error: bool = Field(False, description="Whether transaction failed")
    
    # Analysis fields
    is_suspicious: bool = Field(False, description="Flagged as suspicious")
    pattern_type: Optional[str] = Field(None, description="Transaction pattern type")
    
    @validator('hash')
    def validate_tx_hash(cls, v):
        """Validate transaction hash format"""
        if not v.startswith('0x') or len(v) != 66:
            raise ValueError('Invalid transaction hash format')
        return v.lower()

class SmartContractNode(BaseModel):
    """Smart contract node model for Neo4j"""
    address: str = Field(..., description="Contract address")
    name: Optional[str] = Field(None, description="Contract name")
    symbol: Optional[str] = Field(None, description="Token symbol")
    decimals: Optional[int] = Field(None, description="Token decimals")
    total_supply: Optional[float] = Field(None, description="Total supply")
    contract_type: str = Field("Unknown", description="Contract type (ERC20, ERC721, etc.)")
    is_verified: bool = Field(False, description="Whether contract is verified")
    
    # Security analysis
    security_score: float = Field(0.0, description="Security assessment score")
    is_proxy: bool = Field(False, description="Whether this is a proxy contract")
    is_malicious: bool = Field(False, description="Flagged as malicious")
    
    @validator('address')
    def validate_contract_address(cls, v):
        """Validate contract address format"""
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid contract address format')
        return v.lower()

# === Relationship Models ===

class SentToRelationship(BaseModel):
    """SENT_TO relationship model"""
    transaction: str = Field(..., description="Transaction hash")
    value: float = Field(0.0, description="Value sent")
    timestamp: datetime = Field(..., description="Transaction timestamp")
    
    # Analysis fields
    is_unusual: bool = Field(False, description="Flagged as unusual")
    risk_factor: float = Field(0.0, description="Risk factor for this transfer")

class InteractedWithRelationship(BaseModel):
    """INTERACTED_WITH relationship model"""
    transaction: str = Field(..., description="Transaction hash")
    timestamp: datetime = Field(..., description="Interaction timestamp")
    method_called: Optional[str] = Field(None, description="Method called on contract")
    
    # Analysis fields
    interaction_type: str = Field("Unknown", description="Type of interaction")
    is_risky: bool = Field(False, description="Flagged as risky interaction")

# === Graph Query Models ===

class GraphNode(BaseModel):
    """Generic graph node for visualization"""
    id: str = Field(..., description="Node ID")
    type: NodeType = Field(..., description="Node type")
    labels: List[str] = Field(..., description="Node labels")
    properties: Dict[str, Any] = Field(..., description="Node properties")
    
    # Visualization properties
    x: Optional[float] = Field(None, description="X coordinate for visualization")
    y: Optional[float] = Field(None, description="Y coordinate for visualization")
    size: Optional[float] = Field(None, description="Node size for visualization")
    color: Optional[str] = Field(None, description="Node color for visualization")

class GraphRelationship(BaseModel):
    """Generic graph relationship for visualization"""
    id: str = Field(..., description="Relationship ID")
    type: RelationshipType = Field(..., description="Relationship type")
    start_node: str = Field(..., description="Start node ID")
    end_node: str = Field(..., description="End node ID")
    properties: Dict[str, Any] = Field(..., description="Relationship properties")
    
    # Visualization properties
    weight: Optional[float] = Field(None, description="Edge weight for visualization")
    color: Optional[str] = Field(None, description="Edge color for visualization")

class GraphData(BaseModel):
    """Complete graph data for visualization"""
    nodes: List[GraphNode] = Field(..., description="Graph nodes")
    relationships: List[GraphRelationship] = Field(..., description="Graph relationships")
    
    # Metadata
    center_address: Optional[str] = Field(None, description="Center address for subgraph")
    depth: Optional[int] = Field(None, description="Query depth")
    total_nodes: int = Field(0, description="Total number of nodes")
    total_relationships: int = Field(0, description="Total number of relationships")

# === Analysis Models ===

class AddressAnalytics(BaseModel):
    """Comprehensive address analytics"""
    address: AddressNode = Field(..., description="Address data")
    outgoing_count: int = Field(0, description="Number of outgoing transactions")
    incoming_count: int = Field(0, description="Number of incoming transactions")
    contract_interactions: int = Field(0, description="Number of contract interactions")
    total_sent: float = Field(0.0, description="Total ETH sent")
    total_received: float = Field(0.0, description="Total ETH received")
    sent_to_addresses: List[str] = Field(default_factory=list, description="Addresses sent to")
    received_from_addresses: List[str] = Field(default_factory=list, description="Addresses received from")
    interacted_contracts: List[str] = Field(default_factory=list, description="Interacted contracts")
    
    # Network analysis
    network_centrality: Optional[float] = Field(None, description="Network centrality score")
    clustering_coefficient: Optional[float] = Field(None, description="Clustering coefficient")
    betweenness_centrality: Optional[float] = Field(None, description="Betweenness centrality")

class TransactionPath(BaseModel):
    """Transaction path between addresses"""
    from_address: str = Field(..., description="Source address")
    to_address: str = Field(..., description="Destination address")
    path_length: int = Field(..., description="Path length (number of hops)")
    total_value: float = Field(0.0, description="Total value transferred")
    path_nodes: List[GraphNode] = Field(..., description="Nodes in the path")
    path_relationships: List[GraphRelationship] = Field(..., description="Relationships in the path")
    
    # Analysis
    risk_score: float = Field(0.0, description="Path risk score")
    is_suspicious: bool = Field(False, description="Flagged as suspicious path")

class ClusterAnalysis(BaseModel):
    """Cluster analysis results"""
    cluster_id: str = Field(..., description="Cluster identifier")
    cluster_type: str = Field(..., description="Cluster type (e.g., 'high_risk', 'exchange')")
    center_nodes: List[str] = Field(..., description="Central nodes in cluster")
    member_count: int = Field(0, description="Number of cluster members")
    average_risk_score: float = Field(0.0, description="Average risk score")
    total_volume: float = Field(0.0, description="Total transaction volume")
    
    # Graph data
    graph_data: GraphData = Field(..., description="Cluster graph visualization data")

# === Social Intelligence Models ===

class SocialMention(BaseModel):
    """Social media mention data"""
    platform: str = Field(..., description="Platform (twitter, telegram)")
    mention_id: str = Field(..., description="Unique mention ID")
    content: str = Field(..., description="Mention content")
    author: str = Field(..., description="Author username/handle")
    timestamp: datetime = Field(..., description="Mention timestamp")
    engagement: int = Field(0, description="Likes/retweets/reactions")
    
    # Analysis
    sentiment: Optional[str] = Field(None, description="Sentiment analysis result")
    is_relevant: bool = Field(True, description="Whether mention is relevant")
    context_type: str = Field("Unknown", description="Context type (scam, legitimate, etc.)")

class SocialIntelligence(BaseModel):
    """Social intelligence summary for an address"""
    address: str = Field(..., description="Target address")
    total_mentions: int = Field(0, description="Total mentions across platforms")
    recent_mentions: List[SocialMention] = Field(default_factory=list, description="Recent mentions")
    sentiment_summary: Dict[str, int] = Field(default_factory=dict, description="Sentiment breakdown")
    risk_indicators: List[str] = Field(default_factory=list, description="Social risk indicators")
    
    # Alerts
    scam_alerts: int = Field(0, description="Number of scam alerts")
    positive_mentions: int = Field(0, description="Number of positive mentions")
    warning_flags: List[str] = Field(default_factory=list, description="Warning flags from social data")

# === ML Preparation Models ===

class LabeledAddress(BaseModel):
    """Labeled address for ML training"""
    address: str = Field(..., description="Address hash")
    label: str = Field(..., description="Ground truth label")
    confidence: float = Field(1.0, description="Label confidence score")
    source: str = Field(..., description="Label source (manual, automatic, etc.)")
    timestamp: datetime = Field(default_factory=datetime.now, description="Label timestamp")
    
    # Additional metadata
    labeler: Optional[str] = Field(None, description="Who labeled this address")
    notes: Optional[str] = Field(None, description="Additional notes")
    verified: bool = Field(False, description="Whether label is verified")

class FeatureVector(BaseModel):
    """Feature vector for ML model"""
    address: str = Field(..., description="Address hash")
    features: List[float] = Field(..., description="Feature vector")
    feature_names: List[str] = Field(..., description="Feature names")
    extraction_timestamp: datetime = Field(default_factory=datetime.now, description="When features were extracted")
    
    # Metadata
    feature_version: str = Field("1.0", description="Feature extraction version")
    model_ready: bool = Field(True, description="Whether ready for ML model")

# === Database Statistics Models ===

class DatabaseStats(BaseModel):
    """Database statistics"""
    address_count: int = Field(0, description="Total number of addresses")
    transaction_count: int = Field(0, description="Total number of transactions")
    smartcontract_count: int = Field(0, description="Total number of smart contracts")
    sent_to_count: int = Field(0, description="Total SENT_TO relationships")
    interacted_with_count: int = Field(0, description="Total INTERACTED_WITH relationships")
    
    # Additional stats
    high_risk_addresses: int = Field(0, description="High risk addresses count")
    latest_block: Optional[int] = Field(None, description="Latest processed block")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp") 