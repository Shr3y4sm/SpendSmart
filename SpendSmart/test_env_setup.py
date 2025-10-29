#!/usr/bin/env python3
"""
Test script to verify environment setup
"""
import requests
import json
import time

def test_server_health():
    """Test if server is running"""
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running")
            return True
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server not accessible: {e}")
        return False

def test_ai_categorization():
    """Test AI categorization with fallback"""
    print("\nTesting AI Categorization (Fallback Mode)...")
    
    test_cases = [
        "pizza",
        "uber ride", 
        "netflix subscription",
        "coffee",
        "gas station"
    ]
    
    for item in test_cases:
        try:
            response = requests.post("http://localhost:5000/api/categorize", 
                                   json={"item": item}, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result["success"]:
                    data = result["data"]
                    print(f"✅ '{item}' → {data['category']} ({data['confidence']:.2f} confidence)")
                    print(f"   Method: {data['method']}, Reasoning: {data['reasoning']}")
                else:
                    print(f"❌ '{item}' → Error: {result.get('error', 'Unknown')}")
            else:
                print(f"❌ '{item}' → HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ '{item}' → Exception: {e}")

def test_visualization():
    """Test visualization data"""
    print("\nTesting Visualization Data...")
    
    try:
        response = requests.get("http://localhost:5000/api/visualization/data", timeout=5)
        if response.status_code == 200:
            result = response.json()
            if result["success"]:
                data = result["data"]
                print(f"✅ Pie chart data: {len(data['pie_chart'])} categories")
                print(f"✅ Monthly trends: {len(data['monthly_trends'])} months")
                print(f"✅ Total amount: ${data['total_amount']}")
            else:
                print(f"❌ Error: {result.get('error', 'Unknown')}")
        else:
            print(f"❌ HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("🔧 Testing Environment Setup")
    print("=" * 50)
    
    if test_server_health():
        test_ai_categorization()
        test_visualization()
        print("\n✅ All tests completed!")
    else:
        print("\n❌ Server not running. Please start with: python run.py")
