#!/usr/bin/env python3
"""
Test script for Marketing Analysis Strategy Department
"""

import requests
import json
import time

def test_system():
    """Test the marketing analysis system."""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Marketing Analysis Strategy Department...")
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test 2: Get agents
    print("\n2. Testing agents endpoint...")
    try:
        response = requests.get(f"{base_url}/agents")
        if response.status_code == 200:
            agents = response.json()
            print(f"✅ Found {len(agents)} agents:")
            for agent in agents:
                print(f"   - {agent['agent_id']} ({agent['status']})")
        else:
            print(f"❌ Agents endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Agents endpoint error: {e}")
        return False
    
    # Test 3: Create a marketing analysis task
    print("\n3. Testing task creation...")
    try:
        task_data = {
            "task_type": "marketing_analysis",
            "target_url": "https://bettercalldominik.com/",
            "analysis_scope": ["content", "structure", "links", "metadata"],
            "priority": "high"
        }
        
        response = requests.post(f"{base_url}/task", json=task_data)
        if response.status_code == 200:
            result = response.json()
            task_id = result.get("task_id")
            print(f"✅ Task created successfully: {task_id}")
            
            # Test 4: Check task status
            print("\n4. Testing task status...")
            time.sleep(2)  # Wait a bit for task processing
            
            response = requests.get(f"{base_url}/task/{task_id}")
            if response.status_code == 200:
                task_status = response.json()
                print(f"✅ Task status retrieved:")
                print(f"   - Task ID: {task_status.get('task_id')}")
                print(f"   - Status: {task_status.get('status')}")
                print(f"   - Subtasks: {len(task_status.get('subtasks', []))}")
            else:
                print(f"❌ Task status failed: {response.status_code}")
                
        else:
            print(f"❌ Task creation failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Task creation error: {e}")
        return False
    
    print("\n🎉 System test completed!")
    return True

if __name__ == "__main__":
    test_system() 