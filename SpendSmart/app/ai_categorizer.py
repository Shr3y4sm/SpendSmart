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
        
        # Define categories and their descriptions
        self.categories = {
            'Food & Dining': ['food', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast', 'grocery', 'supermarket', 'dining'],
            'Transportation': ['transport', 'uber', 'taxi', 'bus', 'train', 'metro', 'gas', 'fuel', 'parking', 'toll', 'flight', 'car'],
            'Shopping': ['shop', 'store', 'mall', 'amazon', 'clothes', 'shoes', 'electronics', 'retail', 'purchase'],
            'Entertainment': ['entertainment', 'netflix', 'movie', 'cinema', 'theater', 'game', 'gaming', 'sports', 'concert', 'show'],
            'Bills & Utilities': ['bill', 'utility', 'electric', 'water', 'internet', 'phone', 'rent', 'mortgage', 'insurance'],
            'Healthcare': ['health', 'medical', 'doctor', 'pharmacy', 'medicine', 'hospital', 'clinic', 'dental'],
            'Education': ['education', 'school', 'course', 'book', 'tuition', 'learning', 'training'],
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
        amount_context = f" (Amount: ${amount})" if amount else ""
        
        prompt = f"""
        Categorize this expense item: "{item_name}"{amount_context}
        
        Available categories:
        - Food & Dining: restaurants, cafes, groceries, food delivery
        - Transportation: uber, taxi, gas, parking, public transport, flights
        - Shopping: retail stores, online shopping, clothes, electronics
        - Entertainment: movies, games, streaming services, concerts, sports
        - Bills & Utilities: electricity, water, internet, phone, rent, insurance
        - Healthcare: medical expenses, pharmacy, doctor visits, dental
        - Education: courses, books, tuition, school supplies
        - Others: anything that doesn't fit the above categories
        
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
        """Fallback rule-based categorization"""
        item_lower = item_name.lower()
        
        for category, keywords in self.categories.items():
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
