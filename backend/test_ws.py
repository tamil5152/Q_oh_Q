#!/usr/bin/env python3
"""Test WebSocket connection to the backend"""

import asyncio
import json
import websockets

async def test_ws():
    uri = "ws://127.0.0.1:8000/ws"
    print(f"🔗 Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as ws:
            print("✅ Connected!\n")
            
            # Receive initial message
            msg = await asyncio.wait_for(ws.recv(), timeout=2)
            data = json.loads(msg)
            print(f"📨 Server: {data}\n")
            
            # Send a test answer
            print("📤 Sending test answer...")
            await ws.send(json.dumps({
                "answer": "Artificial Intelligence",
                "time": 5,
                "correct": True
            }))
            print("✅ Answer sent!\n")
            
            print("🎮 WebSocket connection working perfectly!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

asyncio.run(test_ws())
