"""
Sentinel Social Intelligence Service - Off-chain Context Provider
"""

import asyncio
import logging
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import httpx
import os
from ..database.models import SocialMention, SocialIntelligence

class SocialIntelligenceService:
    """Service for collecting social media intelligence about addresses"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # API configurations
        self.twitter_bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
        self.telegram_bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        
        # HTTP client for API calls
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        # Ethereum address regex pattern
        self.eth_address_pattern = re.compile(r'0x[a-fA-F0-9]{40}')
        
        # Keywords for risk assessment
        self.risk_keywords = {
            'scam': ['scam', 'fraud', 'fake', 'phishing', 'rugpull', 'honeypot'],
            'warning': ['warning', 'alert', 'suspicious', 'avoid', 'danger'],
            'legitimate': ['official', 'verified', 'legit', 'safe', 'trusted'],
            'hack': ['hack', 'exploit', 'vulnerability', 'breach', 'attack']
        }
        
    async def close(self):
        """Close HTTP client"""
        await self.http_client.aclose()
    
    # === Twitter Intelligence ===
    
    async def search_twitter_mentions(self, address: str, limit: int = 50) -> List[SocialMention]:
        """Search Twitter for mentions of an address"""
        if not self.twitter_bearer_token:
            self.logger.warning("Twitter Bearer Token not configured")
            return []
        
        # Twitter API v2 search endpoint
        url = "https://api.twitter.com/2/tweets/search/recent"
        
        # Search query for the address
        query = f'"{address}" OR "{address.lower()}" OR "{address.upper()}"'
        
        params = {
            'query': query,
            'max_results': min(limit, 100),  # Twitter API limit
            'tweet.fields': 'created_at,author_id,public_metrics,context_annotations',
            'expansions': 'author_id',
            'user.fields': 'username,name,verified'
        }
        
        headers = {
            'Authorization': f'Bearer {self.twitter_bearer_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = await self.http_client.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            tweets = data.get('data', [])
            users = {user['id']: user for user in data.get('includes', {}).get('users', [])}
            
            mentions = []
            for tweet in tweets:
                author = users.get(tweet['author_id'], {})
                
                mention = SocialMention(
                    platform='twitter',
                    mention_id=tweet['id'],
                    content=tweet['text'],
                    author=author.get('username', 'unknown'),
                    timestamp=datetime.fromisoformat(tweet['created_at'].replace('Z', '+00:00')),
                    engagement=tweet.get('public_metrics', {}).get('like_count', 0),
                    sentiment=self._analyze_sentiment(tweet['text']),
                    is_relevant=self._is_relevant_mention(tweet['text'], address),
                    context_type=self._classify_context(tweet['text'])
                )
                mentions.append(mention)
            
            return mentions
            
        except Exception as e:
            self.logger.error(f"Error searching Twitter for {address}: {str(e)}")
            return []
    
    async def get_twitter_user_info(self, username: str) -> Optional[Dict]:
        """Get Twitter user information"""
        if not self.twitter_bearer_token:
            return None
        
        url = f"https://api.twitter.com/2/users/by/username/{username}"
        
        params = {
            'user.fields': 'created_at,description,public_metrics,verified'
        }
        
        headers = {
            'Authorization': f'Bearer {self.twitter_bearer_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = await self.http_client.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return data.get('data')
            
        except Exception as e:
            self.logger.error(f"Error fetching Twitter user {username}: {str(e)}")
            return None
    
    # === Telegram Intelligence ===
    
    async def search_telegram_channels(self, address: str, channel_list: List[str] = None) -> List[SocialMention]:
        """Search public Telegram channels for address mentions"""
        if not channel_list:
            # Default channels to search (public crypto channels)
            channel_list = [
                '@cryptoalerts',
                '@scamalerts', 
                '@defi_announcements',
                '@etherscan_io'
            ]
        
        mentions = []
        
        for channel in channel_list:
            try:
                channel_mentions = await self._search_telegram_channel(channel, address)
                mentions.extend(channel_mentions)
            except Exception as e:
                self.logger.error(f"Error searching Telegram channel {channel}: {str(e)}")
                continue
        
        return mentions
    
    async def _search_telegram_channel(self, channel: str, address: str) -> List[SocialMention]:
        """Search a specific Telegram channel for address mentions"""
        # This is a simplified implementation
        # In practice, you'd use the Telegram Bot API or web scraping
        # For demo purposes, we'll simulate some mentions
        
        # Simulate finding mentions (replace with actual Telegram API calls)
        simulated_mentions = []
        
        # Example simulated data
        if "scam" in channel.lower():
            mention = SocialMention(
                platform='telegram',
                mention_id=f'tg_{channel}_{int(datetime.now().timestamp())}',
                content=f'Warning: Suspicious activity detected on address {address}',
                author=channel,
                timestamp=datetime.now() - timedelta(hours=2),
                engagement=15,
                sentiment='negative',
                is_relevant=True,
                context_type='warning'
            )
            simulated_mentions.append(mention)
        
        return simulated_mentions
    
    # === Analysis Methods ===
    
    def _analyze_sentiment(self, text: str) -> str:
        """Simple sentiment analysis based on keywords"""
        text_lower = text.lower()
        
        negative_words = ['scam', 'fraud', 'fake', 'avoid', 'warning', 'danger', 'suspicious', 'hack']
        positive_words = ['safe', 'legit', 'official', 'verified', 'trusted', 'good', 'legitimate']
        
        negative_count = sum(1 for word in negative_words if word in text_lower)
        positive_count = sum(1 for word in positive_words if word in text_lower)
        
        if negative_count > positive_count:
            return 'negative'
        elif positive_count > negative_count:
            return 'positive'
        else:
            return 'neutral'
    
    def _is_relevant_mention(self, text: str, address: str) -> bool:
        """Determine if a mention is relevant to our analysis"""
        text_lower = text.lower()
        address_lower = address.lower()
        
        # Check if address is actually mentioned
        if address_lower not in text_lower:
            return False
        
        # Check for crypto-related context
        crypto_keywords = ['ethereum', 'eth', 'wallet', 'address', 'transaction', 'crypto', 'defi', 'token']
        has_crypto_context = any(keyword in text_lower for keyword in crypto_keywords)
        
        return has_crypto_context
    
    def _classify_context(self, text: str) -> str:
        """Classify the context type of the mention"""
        text_lower = text.lower()
        
        # Check against risk keywords
        for context_type, keywords in self.risk_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return context_type
        
        # Default classification
        return 'neutral'
    
    # === Comprehensive Analysis ===
    
    async def analyze_address_social_intelligence(self, address: str) -> SocialIntelligence:
        """Comprehensive social intelligence analysis for an address"""
        
        # Collect mentions from all sources
        twitter_mentions = await self.search_twitter_mentions(address, limit=100)
        telegram_mentions = await self.search_telegram_channels(address)
        
        all_mentions = twitter_mentions + telegram_mentions
        
        # Filter for recent mentions (last 30 days)
        recent_cutoff = datetime.now() - timedelta(days=30)
        recent_mentions = [m for m in all_mentions if m.timestamp >= recent_cutoff]
        
        # Sentiment analysis
        sentiment_summary = {'positive': 0, 'negative': 0, 'neutral': 0}
        for mention in all_mentions:
            sentiment_summary[mention.sentiment] += 1
        
        # Risk indicators
        risk_indicators = []
        scam_alerts = 0
        positive_mentions = 0
        warning_flags = []
        
        for mention in all_mentions:
            if mention.context_type == 'scam':
                scam_alerts += 1
                risk_indicators.append(f"Scam alert from {mention.platform}")
            elif mention.context_type == 'warning':
                warning_flags.append(f"Warning from {mention.author} on {mention.platform}")
            elif mention.context_type == 'legitimate':
                positive_mentions += 1
            elif mention.context_type == 'hack':
                risk_indicators.append(f"Hack/exploit mention on {mention.platform}")
        
        # Additional risk indicators based on patterns
        if len([m for m in all_mentions if 'phishing' in m.content.lower()]) > 0:
            risk_indicators.append("Phishing activity mentioned")
        
        if len([m for m in all_mentions if 'rugpull' in m.content.lower()]) > 0:
            risk_indicators.append("Rugpull concerns mentioned")
        
        return SocialIntelligence(
            address=address,
            total_mentions=len(all_mentions),
            recent_mentions=recent_mentions[:10],  # Last 10 for brevity
            sentiment_summary=sentiment_summary,
            risk_indicators=risk_indicators,
            scam_alerts=scam_alerts,
            positive_mentions=positive_mentions,
            warning_flags=warning_flags
        )
    
    # === Batch Processing ===
    
    async def bulk_analyze_addresses(self, addresses: List[str], batch_size: int = 5) -> Dict[str, SocialIntelligence]:
        """Bulk social intelligence analysis for multiple addresses"""
        
        results = {}
        
        # Process addresses in batches to respect API rate limits
        for i in range(0, len(addresses), batch_size):
            batch = addresses[i:i + batch_size]
            
            # Create tasks for the batch
            batch_tasks = []
            for address in batch:
                task = self.analyze_address_social_intelligence(address)
                batch_tasks.append(task)
            
            # Execute batch
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # Process results
            for address, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    self.logger.error(f"Error analyzing {address}: {result}")
                    # Create empty result for failed analysis
                    results[address] = SocialIntelligence(
                        address=address,
                        total_mentions=0,
                        recent_mentions=[],
                        sentiment_summary={'positive': 0, 'negative': 0, 'neutral': 0},
                        risk_indicators=['Analysis failed'],
                        scam_alerts=0,
                        positive_mentions=0,
                        warning_flags=[]
                    )
                else:
                    results[address] = result
            
            # Rate limiting between batches
            await asyncio.sleep(2)
        
        return results
    
    # === Real-time Monitoring ===
    
    async def monitor_address_mentions(self, address: str, callback_func=None) -> None:
        """Monitor an address for new social media mentions"""
        
        # This would be implemented as a background task
        # that periodically checks for new mentions
        
        last_check = datetime.now()
        
        while True:
            try:
                # Check for new mentions since last check
                new_mentions = await self._get_mentions_since(address, last_check)
                
                if new_mentions and callback_func:
                    await callback_func(address, new_mentions)
                
                last_check = datetime.now()
                
                # Wait before next check (adjust based on requirements)
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                self.logger.error(f"Error monitoring {address}: {str(e)}")
                await asyncio.sleep(60)  # Wait 1 minute before retry
    
    async def _get_mentions_since(self, address: str, since: datetime) -> List[SocialMention]:
        """Get mentions of an address since a specific datetime"""
        
        # Get recent mentions
        twitter_mentions = await self.search_twitter_mentions(address, limit=20)
        
        # Filter for mentions after the 'since' timestamp
        new_mentions = [m for m in twitter_mentions if m.timestamp > since]
        
        return new_mentions
    
    # === Utility Methods ===
    
    def extract_addresses_from_text(self, text: str) -> List[str]:
        """Extract Ethereum addresses from text"""
        return self.eth_address_pattern.findall(text)
    
    def calculate_social_risk_score(self, intelligence: SocialIntelligence) -> float:
        """Calculate risk score based on social intelligence"""
        
        risk_score = 0.0
        
        # Base score from scam alerts
        risk_score += intelligence.scam_alerts * 20
        
        # Warning flags
        risk_score += len(intelligence.warning_flags) * 10
        
        # Risk indicators
        risk_score += len(intelligence.risk_indicators) * 15
        
        # Sentiment impact
        if intelligence.total_mentions > 0:
            negative_ratio = intelligence.sentiment_summary.get('negative', 0) / intelligence.total_mentions
            risk_score += negative_ratio * 30
        
        # Positive mentions reduce risk
        risk_score -= intelligence.positive_mentions * 5
        
        # Cap at 100
        return min(risk_score, 100.0)
    
    def get_platform_stats(self) -> Dict[str, Any]:
        """Get statistics about social media platform coverage"""
        
        return {
            'platforms': ['twitter', 'telegram'],
            'twitter_configured': bool(self.twitter_bearer_token),
            'telegram_configured': bool(self.telegram_bot_token),
            'monitoring_capabilities': {
                'real_time_search': True,
                'historical_analysis': True,
                'sentiment_analysis': True,
                'risk_classification': True
            }
        }
    
    def get_mock_intelligence(self, address: str) -> SocialIntelligence:
        """Get mock social intelligence data when async analysis fails"""
        
        return SocialIntelligence(
            address=address,
            total_mentions=0,
            recent_mentions=[],
            sentiment_summary={'positive': 0, 'negative': 0, 'neutral': 0},
            risk_indicators=[],
            scam_alerts=0,
            positive_mentions=0,
            warning_flags=[]
        ) 