"""
AI-powered expense categorization using Google Gemini API
"""
import os
import json
from typing import Optional, Dict, Any

# Try to import google.generativeai, fallback if not available
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-generativeai not available. AI categorization will use fallback methods.")

class AICategorizer:
    def __init__(self, api_key: str):
        """Initialize the AI categorizer with Gemini API key"""
        self.api_key = api_key
        self.model = None
        
        if GEMINI_AVAILABLE and api_key:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-2.5-flash')
            except Exception as e:
                print(f"Failed to initialize Gemini API: {e}")
                self.model = None
        
        # Define categories and their descriptions with comprehensive keywords
        self.categories = {
            'Food & Dining': [
                # General food terms
                'food', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast', 
                'grocery', 'supermarket', 'dining', 'meal', 'snack', 'bakery', 'eatery', 'bistro', 'diner',
                # Indian food items
                'biryani', 'curry', 'dal', 'roti', 'naan', 'chapati', 'paratha', 'dosa', 'idli', 'vada',
                'samosa', 'pakora', 'paneer', 'tikka', 'tandoori', 'masala', 'korma', 'vindaloo', 'sabzi',
                'rice', 'pulao', 'khichdi', 'chaat', 'pani puri', 'bhel', 'pav bhaji', 'vada pav',
                # Sweets and desserts
                'gulab jamun', 'rasgulla', 'jalebi', 'barfi', 'ladoo', 'halwa', 'kheer', 'kulfi',
                'ice cream', 'cake', 'pastry', 'dessert', 'sweet', 'candy', 'chocolate',
                # Drinks
                'tea', 'chai', 'lassi', 'juice', 'shake', 'smoothie', 'soda', 'drink', 'beverage',
                # Meat and protein
                'chicken', 'mutton', 'lamb', 'fish', 'prawn', 'egg', 'meat', 'beef', 'pork',
                # Soups and starters
                'soup', 'starter', 'appetizer', 'salad', 'sandwich', 'wrap',
                # Food chains and types
                'mcdonald', 'kfc', 'domino', 'subway', 'starbucks', 'zomato', 'swiggy', 'uber eats',
                'chinese', 'italian', 'mexican', 'thai', 'continental', 'fast food', 'street food'
            ],
            'Transportation': ['transport', 'uber', 'taxi', 'bus', 'train', 'metro', 'gas', 'fuel', 'parking', 'toll', 'flight', 'car', 'ola', 'auto', 'rickshaw'],
            'Shopping': ['shop', 'store', 'mall', 'amazon', 'flipkart', 'clothes', 'shoes', 'electronics', 'retail', 'purchase', 'buy', 'myntra'],
            'Entertainment': ['entertainment', 'netflix', 'movie', 'cinema', 'theater', 'theatre', 'game', 'gaming', 'sports', 'concert', 'show', 'prime', 'hotstar'],
            'Bills & Utilities': ['bill', 'utility', 'electric', 'electricity', 'water', 'internet', 'phone', 'mobile', 'rent', 'mortgage', 'insurance', 'recharge'],
            'Healthcare': ['health', 'medical', 'doctor', 'pharmacy', 'medicine', 'hospital', 'clinic', 'dental', 'dentist', 'checkup'],
            'Education': ['education', 'school', 'college', 'course', 'book', 'tuition', 'learning', 'training', 'class', 'study'],
            'Others': ['other', 'misc', 'miscellaneous']
        }
    
    def categorize_expense(self, item_name: str, amount: float = None) -> Dict[str, Any]:
        """
        Categorize an expense using AI
        
        Args:
            item_name: The name/description of the expense
            amount: Optional amount for context
            
        Returns:
            Dict with category, confidence, and reasoning
        """
        # If AI model is not available, use fallback
        if not self.model:
            return self._fallback_categorization(item_name)
        
        try:
            # Create a prompt for the AI
            prompt = self._create_categorization_prompt(item_name, amount)
            
            # Get AI response
            response = self.model.generate_content(prompt)
            
            # Parse the response
            result = self._parse_ai_response(response.text)
            
            return result
            
        except Exception as e:
            print(f"AI categorization error: {e}")
            # Fallback to rule-based categorization
            return self._fallback_categorization(item_name)
    
    def _create_categorization_prompt(self, item_name: str, amount: float = None) -> str:
        """Create a prompt for the AI model"""
        amount_context = f" (Amount: Rs. {amount})" if amount else ""
        
        prompt = f"""
        Categorize this expense item: "{item_name}"{amount_context}
        
        Available categories:
        - Food & Dining: ALL food items including restaurants, cafes, groceries, food delivery, snacks, desserts, beverages, Indian food (biryani, curry, paneer, tikka, dosa, samosa, gulab jamun, etc.), international cuisines, fast food, street food, sweets, meals, dining out
        - Transportation: uber, ola, taxi, auto, rickshaw, bus, train, metro, gas, fuel, parking, public transport, flights
        - Shopping: retail stores, online shopping (Amazon, Flipkart, Myntra), clothes, shoes, electronics, accessories
        - Entertainment: movies, games, streaming services (Netflix, Prime, Hotstar), concerts, sports events, shows
        - Bills & Utilities: electricity, water, internet, phone/mobile recharge, rent, insurance
        - Healthcare: medical expenses, pharmacy, medicines, doctor visits, dental, health checkups
        - Education: courses, books, tuition, school/college fees, study materials, training
        - Others: anything that doesn't fit the above categories
        
        IMPORTANT: 
        - ANY food item (including Indian dishes like paneer tikka, chicken soup, gulab jamun, biryani, etc.) should be categorized as "Food & Dining"
        - Be very specific: if it's something people eat or drink, it's "Food & Dining"
        
        Respond with ONLY a JSON object in this exact format:
        {{
            "category": "Category Name",
            "confidence": 0.95,
            "reasoning": "Brief explanation of why this category was chosen"
        }}
        
        Be precise and choose the most appropriate category. Confidence should be between 0.0 and 1.0.
        """
        
        return prompt
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the AI response and extract category information"""
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
                if 'category' in result and 'confidence' in result:
                    return {
                        'category': result['category'],
                        'confidence': float(result['confidence']),
                        'reasoning': result.get('reasoning', 'AI categorization'),
                        'method': 'ai'
                    }
            
            # If JSON parsing fails, try to extract category from text
            return self._extract_category_from_text(cleaned_text)
            
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            return self._fallback_categorization("")
    
    def _extract_category_from_text(self, text: str) -> Dict[str, Any]:
        """Extract category from unstructured AI response"""
        text_lower = text.lower()
        
        # Look for category mentions
        for category, keywords in self.categories.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return {
                        'category': category,
                        'confidence': 0.8,
                        'reasoning': f'Matched keyword: {keyword}',
                        'method': 'ai_keyword'
                    }
        
        return self._fallback_categorization("")
    
    def _fallback_categorization(self, item_name: str) -> Dict[str, Any]:
        """Fallback rule-based categorization with better food detection"""
        item_lower = item_name.lower().strip()
        
        # Priority check for Food & Dining (check first to avoid misclassification)
        food_keywords = self.categories.get('Food & Dining', [])
        for keyword in food_keywords:
            if keyword in item_lower:
                return {
                    'category': 'Food & Dining',
                    'confidence': 0.85,
                    'reasoning': f'Food item detected: {keyword}',
                    'method': 'rule_based'
                }
        
        # Check other categories
        for category, keywords in self.categories.items():
            if category == 'Food & Dining':
                continue  # Already checked
            
            for keyword in keywords:
                if keyword in item_lower:
                    return {
                        'category': category,
                        'confidence': 0.7,
                        'reasoning': f'Rule-based match: {keyword}',
                        'method': 'rule_based'
                    }
        
        return {
            'category': 'Others',
            'confidence': 0.5,
            'reasoning': 'No specific match found',
            'method': 'fallback'
        }
    
    def get_suggested_categories(self, item_name: str) -> list:
        """Get multiple category suggestions for an item"""
        # If AI model is not available, use fallback
        if not self.model:
            return self._fallback_suggestions(item_name)
        
        try:
            prompt = f"""
            For the expense item "{item_name}", suggest the top 3 most likely categories.
            
            Available categories: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Others
            
            Respond with a JSON array of objects:
            [
                {{"category": "Category Name", "confidence": 0.9, "reason": "Why this category fits"}},
                {{"category": "Category Name", "confidence": 0.7, "reason": "Why this category fits"}},
                {{"category": "Category Name", "confidence": 0.5, "reason": "Why this category fits"}}
            ]
            """
            
            response = self.model.generate_content(prompt)
            
            # Parse response
            cleaned_text = response.text.strip()
            if '[' in cleaned_text and ']' in cleaned_text:
                start = cleaned_text.find('[')
                end = cleaned_text.rfind(']') + 1
                json_str = cleaned_text[start:end]
                
                suggestions = json.loads(json_str)
                return suggestions[:3]  # Return top 3
            
        except Exception as e:
            print(f"Error getting suggestions: {e}")
        
        # Fallback to simple suggestions
        return self._fallback_suggestions(item_name)
    
    def _fallback_suggestions(self, item_name: str) -> list:
        """Fallback suggestions based on keywords"""
        item_lower = item_name.lower()
        suggestions = []
        
        # Find matching categories
        for category, keywords in self.categories.items():
            for keyword in keywords:
                if keyword in item_lower:
                    suggestions.append({
                        'category': category,
                        'confidence': 0.8,
                        'reason': f'Matched keyword: {keyword}'
                    })
                    break
        
        # If no matches, return default suggestions
        if not suggestions:
            suggestions = [
                {'category': 'Others', 'confidence': 0.5, 'reason': 'No specific match found'},
                {'category': 'Food & Dining', 'confidence': 0.3, 'reason': 'Common category'},
                {'category': 'Shopping', 'confidence': 0.2, 'reason': 'Common category'}
            ]
        
        return suggestions[:3]
