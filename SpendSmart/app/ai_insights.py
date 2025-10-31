"""
AI-powered financial insights and pattern recognition
"""
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict

# Try to import google.generativeai, fallback if not available
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-generativeai not available. AI insights will use fallback methods.")

class AIInsightsGenerator:
    def __init__(self, api_key: str = None):
        """Initialize the AI insights generator"""
        self.api_key = api_key
        self.model = None
        
        if GEMINI_AVAILABLE and api_key:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-2.5-flash')
            except Exception as e:
                print(f"Failed to initialize Gemini API for insights: {e}")
                self.model = None
    
    def generate_insights(self, expenses: List[Dict], time_period: str = "week") -> Dict[str, Any]:
        """
        Generate AI-powered financial insights
        
        Args:
            expenses: List of expense records
            time_period: Analysis period ("week", "month", "all")
            
        Returns:
            Dict with insights, recommendations, and patterns
        """
        if not expenses:
            return self._empty_insights()
        
        # Filter expenses by time period
        filtered_expenses = self._filter_by_period(expenses, time_period)
        
        if not filtered_expenses:
            return self._empty_insights()
        
        # Calculate basic analytics
        analytics = self._calculate_analytics(filtered_expenses, time_period)
        
        # Generate AI insights if model is available
        if self.model:
            try:
                ai_insights = self._generate_ai_insights(analytics, time_period)
                return {
                    'success': True,
                    'analytics': analytics,
                    'insights': ai_insights['insights'],
                    'recommendations': ai_insights['recommendations'],
                    'patterns': ai_insights['patterns'],
                    'alerts': self._generate_budget_alerts(analytics),
                    'generated_at': datetime.now().isoformat()
                }
            except Exception as e:
                print(f"AI insights generation failed: {e}")
                return self._fallback_insights(analytics)
        else:
            return self._fallback_insights(analytics)
    
    def _filter_by_period(self, expenses: List[Dict], period: str) -> List[Dict]:
        """Filter expenses by time period"""
        now = datetime.now()
        
        if period == "week":
            start_date = now - timedelta(days=7)
        elif period == "month":
            start_date = now - timedelta(days=30)
        else:  # all
            return expenses
        
        filtered = []
        for expense in expenses:
            expense_date = datetime.strptime(expense['date'], '%Y-%m-%d')
            if expense_date >= start_date:
                filtered.append(expense)
        
        return filtered
    
    def _calculate_analytics(self, expenses: List[Dict], period: str) -> Dict[str, Any]:
        """Calculate spending analytics"""
        total_amount = sum(expense['amount'] for expense in expenses)
        
        # Category breakdown
        category_totals = defaultdict(float)
        category_counts = defaultdict(int)
        
        for expense in expenses:
            category = expense['category']
            amount = expense['amount']
            category_totals[category] += amount
            category_counts[category] += 1
        
        # Calculate percentages
        category_percentages = {}
        for category, amount in category_totals.items():
            category_percentages[category] = (amount / total_amount * 100) if total_amount > 0 else 0
        
        # Daily spending pattern
        daily_spending = defaultdict(float)
        for expense in expenses:
            date = expense['date']
            daily_spending[date] += expense['amount']
        
        # Average spending per day
        avg_daily = total_amount / len(daily_spending) if daily_spending else 0
        
        # Top spending categories
        top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            'total_amount': round(total_amount, 2),
            'total_expenses': len(expenses),
            'category_breakdown': dict(category_totals),
            'category_percentages': category_percentages,
            'category_counts': dict(category_counts),
            'daily_spending': dict(daily_spending),
            'avg_daily_spending': round(avg_daily, 2),
            'top_categories': top_categories,
            'period': period,
            'date_range': {
                'start': min(expense['date'] for expense in expenses) if expenses else None,
                'end': max(expense['date'] for expense in expenses) if expenses else None
            }
        }
    
    def _generate_ai_insights(self, analytics: Dict, period: str) -> Dict[str, Any]:
        """Generate AI-powered insights using Gemini"""
        prompt = self._create_insights_prompt(analytics, period)
        
        try:
            response = self.model.generate_content(prompt)
            return self._parse_ai_response(response.text)
        except Exception as e:
            print(f"AI insights generation error: {e}")
            return self._fallback_insights(analytics)
    
    def _create_insights_prompt(self, analytics: Dict, period: str) -> str:
        """Create prompt for AI insights generation"""
        total_amount = analytics['total_amount']
        category_percentages = analytics['category_percentages']
        top_categories = analytics['top_categories']
        avg_daily = analytics['avg_daily_spending']
        
        prompt = f"""
        Analyze this spending data for the past {period} and provide CONCISE financial insights:
        
        Total Spending: ${total_amount}
        Average Daily Spending: ${avg_daily}
        Top Categories: {', '.join([f"{cat}: {amount:.1f}%" for cat, amount in top_categories])}
        
        Category Breakdown:
        {json.dumps(category_percentages, indent=2)}
        
        IMPORTANT: Keep each point under 100 characters. Be brief and direct.
        
        Provide:
        1. 2-3 SHORT key insights (what stands out in spending)
        2. 2-3 BRIEF actionable recommendations (how to improve)
        3. 1-2 CONCISE patterns (spending behaviors)
        
        Respond in JSON format:
        {{
            "insights": [
                "Brief insight 1",
                "Brief insight 2"
            ],
            "recommendations": [
                "Quick actionable tip 1",
                "Quick actionable tip 2"
            ],
            "patterns": [
                "Short pattern 1",
                "Short pattern 2"
            ]
        }}
        
        RULES:
        - Each point: 60-100 characters max
        - Use simple language
        - Be specific with numbers/percentages
        - Focus on the most impactful insights
        """
        
        return prompt
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI response and extract insights"""
        try:
            # Clean the response text
            cleaned_text = response_text.strip()
            
            # Try to find JSON in the response
            if '{' in cleaned_text and '}' in cleaned_text:
                start = cleaned_text.find('{')
                end = cleaned_text.rfind('}') + 1
                json_str = cleaned_text[start:end]
                
                result = json.loads(json_str)
                
                # Validate the result
                if all(key in result for key in ['insights', 'recommendations', 'patterns']):
                    return result
            
            # If JSON parsing fails, create fallback insights
            return self._fallback_insights({})
            
        except Exception as e:
            print(f"Error parsing AI insights response: {e}")
            return self._fallback_insights({})
    
    def _fallback_insights(self, analytics: Dict) -> Dict[str, Any]:
        """Generate fallback insights without AI"""
        insights = []
        recommendations = []
        patterns = []
        
        if analytics:
            total_amount = analytics.get('total_amount', 0)
            category_percentages = analytics.get('category_percentages', {})
            top_categories = analytics.get('top_categories', [])
            
            # Generate insights based on data
            if category_percentages:
                top_category = max(category_percentages.items(), key=lambda x: x[1])
                insights.append(f"You spent {top_category[1]:.1f}% of your budget on {top_category[0]} this {analytics.get('period', 'period')}.")
            
            if total_amount > 0:
                insights.append(f"Total spending: ${total_amount:.2f} across {analytics.get('total_expenses', 0)} transactions.")
            
            # Generate recommendations
            if 'Food & Dining' in category_percentages and category_percentages['Food & Dining'] > 40:
                recommendations.append("Consider reducing dining out expenses by cooking more meals at home.")
            
            if total_amount > 500:  # Arbitrary threshold
                recommendations.append("Review your spending to identify areas where you can save money.")
            
            # Generate patterns
            if len(top_categories) > 0:
                patterns.append(f"Your highest spending category is {top_categories[0][0]}.")
        
        return {
            'insights': insights,
            'recommendations': recommendations,
            'patterns': patterns
        }
    
    def _generate_budget_alerts(self, analytics: Dict) -> List[Dict[str, Any]]:
        """Generate budget alerts based on spending patterns"""
        alerts = []
        
        if not analytics:
            return alerts
        
        total_amount = analytics.get('total_amount', 0)
        category_percentages = analytics.get('category_percentages', {})
        
        # High spending alert
        if total_amount > 1000:  # Arbitrary threshold
            alerts.append({
                'type': 'warning',
                'message': f'High spending detected: ${total_amount:.2f} this period',
                'severity': 'medium'
            })
        
        # Category-specific alerts
        for category, percentage in category_percentages.items():
            if percentage > 50:  # More than 50% in one category
                alerts.append({
                    'type': 'info',
                    'message': f'{category} represents {percentage:.1f}% of your spending',
                    'severity': 'low'
                })
        
        return alerts
    
    def _empty_insights(self) -> Dict[str, Any]:
        """Return empty insights for no data"""
        return {
            'success': True,
            'analytics': {
                'total_amount': 0,
                'total_expenses': 0,
                'category_breakdown': {},
                'category_percentages': {},
                'period': 'week'
            },
            'insights': ['No spending data available for analysis'],
            'recommendations': ['Start tracking your expenses to get personalized insights'],
            'patterns': ['No patterns detected - add some expenses to see insights'],
            'alerts': [],
            'generated_at': datetime.now().isoformat()
        }
    
    def get_spending_trends(self, expenses: List[Dict], days: int = 30) -> Dict[str, Any]:
        """Analyze spending trends over time"""
        if not expenses:
            return {'trend': 'stable', 'change': 0, 'message': 'No data available'}
        
        # Sort expenses by date
        sorted_expenses = sorted(expenses, key=lambda x: x['date'])
        
        if len(sorted_expenses) < 2:
            return {'trend': 'stable', 'change': 0, 'message': 'Insufficient data for trend analysis'}
        
        # Calculate daily spending
        daily_totals = defaultdict(float)
        for expense in sorted_expenses:
            daily_totals[expense['date']] += expense['amount']
        
        # Calculate trend
        dates = sorted(daily_totals.keys())
        if len(dates) < 2:
            return {'trend': 'stable', 'change': 0, 'message': 'Insufficient data for trend analysis'}
        
        # Simple trend calculation (first half vs second half)
        mid_point = len(dates) // 2
        first_half = sum(daily_totals[date] for date in dates[:mid_point])
        second_half = sum(daily_totals[date] for date in dates[mid_point:])
        
        if first_half == 0:
            change_percent = 100 if second_half > 0 else 0
        else:
            change_percent = ((second_half - first_half) / first_half) * 100
        
        if change_percent > 10:
            trend = 'increasing'
            message = f'Spending increased by {change_percent:.1f}%'
        elif change_percent < -10:
            trend = 'decreasing'
            message = f'Spending decreased by {abs(change_percent):.1f}%'
        else:
            trend = 'stable'
            message = f'Spending is relatively stable ({change_percent:.1f}% change)'
        
        return {
            'trend': trend,
            'change': round(change_percent, 1),
            'message': message,
            'first_half_total': round(first_half, 2),
            'second_half_total': round(second_half, 2)
        }
