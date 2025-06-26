"""
Sentinel Network Behavior Analyzer - Advanced Cluster Detection and Analysis
Implements the "Galaxy View" cluster analysis and suspicious network pattern detection
"""

import logging
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Set
from collections import defaultdict, Counter
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

class NetworkBehaviorAnalyzer:
    """
    Advanced network behavior analysis for detecting suspicious wallet clusters
    and coordinated attack patterns
    """
    
    def __init__(self, neo4j_client):
        self.neo4j = neo4j_client
        self.scaler = StandardScaler()
        
        # Suspicious patterns thresholds
        self.thresholds = {
            'sybil_min_cluster_size': 10,
            'sybil_funding_similarity': 0.8,
            'mixer_interaction_threshold': 5,
            'flash_loan_time_window': 300,  # 5 minutes
            'coordinated_attack_threshold': 0.7
        }
    
    def analyze_network_clusters(self, center_address: str = None, max_depth: int = 3, 
                                min_cluster_size: int = 5) -> Dict:
        """
        Perform comprehensive cluster analysis of wallet networks
        
        Args:
            center_address: Optional center address for focused analysis
            max_depth: Maximum graph traversal depth
            min_cluster_size: Minimum size for clusters to be considered
            
        Returns:
            Dict containing cluster analysis results
        """
        
        logger.info(f"Starting network cluster analysis")
        
        try:
            # Get network data from Neo4j
            if center_address:
                network_data = self.neo4j.get_network_subgraph(center_address, max_depth)
            else:
                network_data = self.neo4j.get_suspicious_networks(limit=1000)
            
            if not network_data:
                return {'clusters': [], 'analysis': 'No network data available'}
            
            # Extract features for each node
            node_features = self._extract_network_features(network_data)
            
            # Perform clustering
            clusters = self._detect_clusters(node_features, min_cluster_size)
            
            # Analyze each cluster for suspicious patterns
            cluster_analysis = []
            for cluster_id, cluster_nodes in clusters.items():
                analysis = self._analyze_cluster_behavior(
                    cluster_nodes, network_data, cluster_id
                )
                cluster_analysis.append(analysis)
            
            # Detect specific attack patterns
            attack_patterns = self._detect_attack_patterns(network_data, clusters)
            
            # Calculate network-wide risk metrics
            network_metrics = self._calculate_network_metrics(network_data, clusters)
            
            return {
                'analysis_timestamp': datetime.now().isoformat(),
                'network_overview': {
                    'total_addresses': len(set([tx['from_address'] for tx in network_data] + 
                                             [tx['to_address'] for tx in network_data])),
                    'total_transactions': len(network_data),
                    'cluster_count': len(clusters),
                    'suspicious_cluster_count': len([c for c in cluster_analysis if c['risk_level'] != 'LOW'])
                },
                'clusters': cluster_analysis,
                'attack_patterns': attack_patterns,
                'network_metrics': network_metrics,
                'galaxy_view_data': self._prepare_galaxy_view_data(clusters, cluster_analysis)
            }
            
        except Exception as e:
            logger.error(f"Error in network cluster analysis: {str(e)}")
            return {'error': str(e)}
    
    def _extract_network_features(self, network_data: List[Dict]) -> Dict[str, np.ndarray]:
        """Extract sophisticated features for each node in the network"""
        
        # Build address interaction statistics
        address_stats = defaultdict(lambda: {
            'in_degree': 0, 'out_degree': 0, 'in_volume': 0, 'out_volume': 0,
            'tx_count': 0, 'unique_counterparties': set(), 'timestamps': []
        })
        
        for tx in network_data:
            from_addr = tx['from_address']
            to_addr = tx['to_address']
            value = tx.get('value', 0)
            timestamp = tx.get('timestamp')
            
            # Update statistics
            address_stats[from_addr]['out_degree'] += 1
            address_stats[from_addr]['out_volume'] += value
            address_stats[from_addr]['tx_count'] += 1
            address_stats[from_addr]['unique_counterparties'].add(to_addr)
            if timestamp:
                address_stats[from_addr]['timestamps'].append(timestamp)
            
            address_stats[to_addr]['in_degree'] += 1
            address_stats[to_addr]['in_volume'] += value
            address_stats[to_addr]['tx_count'] += 1
            address_stats[to_addr]['unique_counterparties'].add(from_addr)
            if timestamp:
                address_stats[to_addr]['timestamps'].append(timestamp)
        
        # Convert to feature vectors
        features_dict = {}
        for address, stats in address_stats.items():
            features = [
                stats['in_degree'],
                stats['out_degree'], 
                stats['in_volume'] / 1e18,  # Convert to ETH
                stats['out_volume'] / 1e18,
                stats['tx_count'],
                len(stats['unique_counterparties']),
            ]
            
            # Temporal features
            if stats['timestamps']:
                try:
                    dates = [datetime.fromisoformat(ts.replace('Z', '+00:00')) for ts in stats['timestamps'] if ts]
                    if dates:
                        activity_span = (max(dates) - min(dates)).days
                        features.append(activity_span)
                    else:
                        features.append(0)
                except:
                    features.append(0)
            else:
                features.append(0)
            
            # Balance ratio
            total_volume = stats['in_volume'] + stats['out_volume']
            balance_ratio = stats['in_volume'] / max(1, total_volume)
            features.append(balance_ratio)
            
            features_dict[address] = np.array(features)
        
        return features_dict
    
    def _detect_clusters(self, node_features: Dict[str, np.ndarray], min_cluster_size: int) -> Dict[int, List[str]]:
        """Detect clusters using DBSCAN clustering algorithm"""
        
        if not node_features:
            return {}
        
        # Prepare feature matrix
        addresses = list(node_features.keys())
        feature_matrix = np.array([node_features[addr] for addr in addresses])
        
        # Normalize features
        feature_matrix_scaled = self.scaler.fit_transform(feature_matrix)
        
        # Apply DBSCAN clustering
        dbscan = DBSCAN(eps=0.5, min_samples=min_cluster_size)
        cluster_labels = dbscan.fit_predict(feature_matrix_scaled)
        
        # Group addresses by cluster
        clusters = defaultdict(list)
        for addr, label in zip(addresses, cluster_labels):
            if label != -1:  # -1 indicates noise/outliers
                clusters[label].append(addr)
        
        # Filter out small clusters
        filtered_clusters = {
            cluster_id: nodes for cluster_id, nodes in clusters.items() 
            if len(nodes) >= min_cluster_size
        }
        
        return filtered_clusters
    
    def _analyze_cluster_behavior(self, cluster_nodes: List[str], network_data: List[Dict], 
                                 cluster_id: int) -> Dict:
        """Analyze behavior patterns within a cluster"""
        
        # Filter transactions involving cluster nodes
        cluster_txs = [tx for tx in network_data 
                      if tx['from_address'] in cluster_nodes or tx['to_address'] in cluster_nodes]
        
        # Basic cluster metrics
        cluster_size = len(cluster_nodes)
        internal_txs = [tx for tx in cluster_txs 
                       if tx['from_address'] in cluster_nodes and tx['to_address'] in cluster_nodes]
        
        # Analyze funding patterns
        funding_analysis = self._analyze_funding_patterns(cluster_nodes, network_data)
        
        # Analyze transaction timing
        timing_analysis = self._analyze_timing_patterns(cluster_nodes, cluster_txs)
        
        # Detect specific attack patterns
        attack_indicators = self._detect_cluster_attack_patterns(cluster_nodes, network_data)
        
        # Calculate cluster risk score
        risk_score = self._calculate_cluster_risk_score(
            cluster_size, funding_analysis, timing_analysis, attack_indicators
        )
        
        # Determine cluster type and risk level
        cluster_type = self._classify_cluster_type(funding_analysis, timing_analysis, attack_indicators)
        risk_level = self._get_risk_level(risk_score)
        
        return {
            'cluster_id': cluster_id,
            'cluster_type': cluster_type,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'size': cluster_size,
            'addresses': cluster_nodes,
            'connectivity': {
                'internal_transactions': len(internal_txs),
                'external_transactions': len(cluster_txs) - len(internal_txs),
            },
            'funding_analysis': funding_analysis,
            'timing_analysis': timing_analysis,
            'attack_indicators': attack_indicators,
            'recommendations': self._generate_cluster_recommendations(cluster_type, risk_level)
        }
    
    def _analyze_funding_patterns(self, cluster_nodes: List[str], network_data: List[Dict]) -> Dict:
        """Analyze funding patterns within cluster for Sybil attack detection"""
        
        # Find external funding sources
        external_funding = defaultdict(float)
        for tx in network_data:
            if (tx['to_address'] in cluster_nodes and 
                tx['from_address'] not in cluster_nodes):
                external_funding[tx['from_address']] += tx.get('value', 0)
        
        total_funding = sum(external_funding.values())
        max_funding = max(external_funding.values()) if external_funding else 0
        funding_concentration = max_funding / max(1, total_funding)
        
        # Check for similar funding amounts
        amounts = list(external_funding.values())
        amount_similarity = 1 - (np.std(amounts) / max(1, np.mean(amounts))) if amounts else 0
        
        return {
            'external_funding_sources': len(external_funding),
            'total_funding_amount': total_funding / 1e18,
            'funding_concentration': funding_concentration,
            'amount_similarity': amount_similarity,
        }
    
    def _analyze_timing_patterns(self, cluster_nodes: List[str], cluster_txs: List[Dict]) -> Dict:
        """Analyze temporal patterns for coordinated activity detection"""
        
        if not cluster_txs:
            return {'activity_correlation': 0, 'coordinated_windows': []}
        
        # Group transactions by time windows
        time_windows = defaultdict(set)
        window_size = timedelta(minutes=15)
        
        for tx in cluster_txs:
            try:
                timestamp = datetime.fromisoformat(tx['timestamp'].replace('Z', '+00:00'))
                window_key = timestamp.replace(minute=timestamp.minute // 15 * 15, second=0, microsecond=0)
                if tx['from_address'] in cluster_nodes:
                    time_windows[window_key].add(tx['from_address'])
                if tx['to_address'] in cluster_nodes:
                    time_windows[window_key].add(tx['to_address'])
            except:
                continue
        
        # Calculate activity correlation
        window_participation = [len(nodes) / len(cluster_nodes) for nodes in time_windows.values()]
        activity_correlation = np.mean(window_participation) if window_participation else 0
        
        # Identify coordinated windows
        coordinated_windows = [
            {'timestamp': window.isoformat(), 'participation_rate': len(nodes) / len(cluster_nodes)}
            for window, nodes in time_windows.items()
            if len(nodes) / len(cluster_nodes) > 0.5
        ]
        
        return {
            'activity_correlation': activity_correlation,
            'coordinated_windows': coordinated_windows,
            'peak_coordination': max(window_participation) if window_participation else 0
        }
    
    def _detect_cluster_attack_patterns(self, cluster_nodes: List[str], network_data: List[Dict]) -> Dict:
        """Detect specific attack patterns within the cluster"""
        
        indicators = {
            'sybil_attack': False,
            'wash_trading': False,
            'flash_loan_attack': False,
            'mixer_usage': False,
        }
        
        # Sybil attack detection
        if len(cluster_nodes) >= self.thresholds['sybil_min_cluster_size']:
            funding_sources = set()
            for tx in network_data:
                if (tx['to_address'] in cluster_nodes and 
                    tx['from_address'] not in cluster_nodes):
                    funding_sources.add(tx['from_address'])
            
            if len(funding_sources) <= 3:
                indicators['sybil_attack'] = True
        
        # Wash trading detection
        internal_volume = sum(tx['value'] for tx in network_data 
                            if tx['from_address'] in cluster_nodes and tx['to_address'] in cluster_nodes)
        external_volume = sum(tx['value'] for tx in network_data 
                            if (tx['from_address'] in cluster_nodes) != (tx['to_address'] in cluster_nodes))
        
        if internal_volume > external_volume * 2:
            indicators['wash_trading'] = True
        
        return indicators
    
    def _calculate_cluster_risk_score(self, cluster_size: int, funding_analysis: Dict, 
                                    timing_analysis: Dict, attack_indicators: Dict) -> float:
        """Calculate overall risk score for the cluster"""
        
        risk_score = 0
        
        # Size factor
        if cluster_size > 50:
            risk_score += 30
        elif cluster_size > 20:
            risk_score += 20
        elif cluster_size > 10:
            risk_score += 10
        
        # Funding concentration risk
        if funding_analysis['funding_concentration'] > 0.8:
            risk_score += 25
        elif funding_analysis['funding_concentration'] > 0.5:
            risk_score += 15
        
        # Similar funding amounts
        if funding_analysis['amount_similarity'] > 0.8:
            risk_score += 20
        
        # Coordinated activity
        if timing_analysis['activity_correlation'] > 0.7:
            risk_score += 25
        
        # Attack pattern indicators
        attack_count = sum(attack_indicators.values())
        risk_score += attack_count * 15
        
        return min(100, risk_score)
    
    def _classify_cluster_type(self, funding_analysis: Dict, timing_analysis: Dict, 
                             attack_indicators: Dict) -> str:
        """Classify the type of cluster based on behavior patterns"""
        
        if attack_indicators['sybil_attack']:
            return "Sybil Attack Network"
        elif attack_indicators['wash_trading']:
            return "Wash Trading Ring"
        elif timing_analysis['activity_correlation'] > 0.7:
            return "Coordinated Bot Network"
        elif funding_analysis['funding_concentration'] > 0.8:
            return "Single-Source Funded Network"
        else:
            return "Organic Cluster"
    
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
    
    def _generate_cluster_recommendations(self, cluster_type: str, risk_level: str) -> List[str]:
        """Generate recommendations based on cluster analysis"""
        
        recommendations = []
        
        if risk_level in ["CRITICAL", "HIGH"]:
            recommendations.append("Immediate investigation recommended")
            recommendations.append("Consider flagging all addresses in cluster")
        
        if cluster_type == "Sybil Attack Network":
            recommendations.extend([
                "Verify funding sources",
                "Check for identity verification bypassing"
            ])
        elif cluster_type == "Wash Trading Ring":
            recommendations.extend([
                "Monitor for artificial volume inflation",
                "Check for market manipulation"
            ])
        
        return recommendations
    
    def _detect_attack_patterns(self, network_data: List[Dict], clusters: Dict[int, List[str]]) -> List[Dict]:
        """Detect network-wide attack patterns"""
        
        patterns = []
        
        # Cross-cluster coordination detection
        for cluster1_id, cluster1_nodes in clusters.items():
            for cluster2_id, cluster2_nodes in clusters.items():
                if cluster1_id != cluster2_id:
                    cross_cluster_txs = [
                        tx for tx in network_data 
                        if ((tx['from_address'] in cluster1_nodes and tx['to_address'] in cluster2_nodes) or
                            (tx['from_address'] in cluster2_nodes and tx['to_address'] in cluster1_nodes))
                    ]
                    
                    if len(cross_cluster_txs) > 5:
                        patterns.append({
                            'pattern_type': 'Cross-Cluster Coordination',
                            'description': f'Clusters {cluster1_id} and {cluster2_id} show coordinated activity',
                            'risk_level': 'HIGH',
                            'evidence': f'{len(cross_cluster_txs)} transactions between clusters'
                        })
        
        return patterns
    
    def _calculate_network_metrics(self, network_data: List[Dict], clusters: Dict[int, List[str]]) -> Dict:
        """Calculate network-wide risk and complexity metrics"""
        
        all_addresses = set([tx['from_address'] for tx in network_data] + 
                           [tx['to_address'] for tx in network_data])
        clustered_nodes = sum(len(nodes) for nodes in clusters.values())
        
        return {
            'clustering_coverage': clustered_nodes / max(1, len(all_addresses)),
            'average_cluster_size': np.mean([len(nodes) for nodes in clusters.values()]) if clusters else 0,
            'total_value_flow': sum(tx.get('value', 0) for tx in network_data) / 1e18
        }
    
    def _prepare_galaxy_view_data(self, clusters: Dict[int, List[str]], 
                                 cluster_analysis: List[Dict]) -> Dict:
        """Prepare data structure for galaxy view visualization"""
        
        galaxy_data = {
            'nodes': [],
            'cluster_meta': {}
        }
        
        # Create cluster nodes for galaxy view
        for analysis in cluster_analysis:
            cluster_id = analysis['cluster_id']
            
            galaxy_data['nodes'].append({
                'id': f'cluster_{cluster_id}',
                'group': 'cluster',
                'size': analysis['size'],
                'risk_score': analysis['risk_score'],
                'color': self._get_risk_color(analysis['risk_level']),
                'cluster_type': analysis['cluster_type']
            })
            
            galaxy_data['cluster_meta'][f'cluster_{cluster_id}'] = analysis
        
        return galaxy_data
    
    def _get_risk_color(self, risk_level: str) -> str:
        """Get color code for risk level visualization"""
        color_map = {
            'CRITICAL': '#ff4444',
            'HIGH': '#ff8800', 
            'MEDIUM': '#ffbb00',
            'LOW': '#88cc00',
            'MINIMAL': '#00cc88'
        }
        return color_map.get(risk_level, '#cccccc')
