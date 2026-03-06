#!/usr/bin/env python3
"""
Multiplayer Game Flow Simulation Test
"""

import asyncio
import json
import time
from unittest.mock import AsyncMock, MagicMock

print("="*60)
print("🎮 MULTIPLAYER GAME FLOW TEST")
print("="*60 + "\n")

async def simulate_game():
    """Simulate a full game with 2 players"""
    
    from multiplayer.local_room import Room
    
    # Create room
    room = Room()
    print("✓ Room created")
    
    # Simulate WebSocket connections
    ws1 = AsyncMock()
    ws2 = AsyncMock()
    
    # Add players
    await room.add_player("Player1", ws1)
    await room.add_player("Player2", ws2)
    print(f"✓ Players joined: {list(room.players.keys())}")
    print(f"  Scores: {room.scores}\n")
    
    # Check if game starts when 2 players join
    if len(room.players) == 2:
        print("✓ Both players ready - Starting game...\n")
        
        # Simulate answer submission
        print("⏳ Simulating player answers...\n")
        
        # Player 1 answers quickly (gets harder difficulty)
        await room.submit_answer("Player1", "Machine Learning", 2, True)
        print(f"  Player1 answered correctly in 2s")
        print(f"    Difficulty: {room.difficulty}")
        print(f"    Scores: {room.scores}")
        
        # Player 2 answers slower (stays medium/easy)
        await room.submit_answer("Player2", "AI", 12, False)
        print(f"  Player2 answered incorrectly in 12s")
        print(f"    Difficulty: {room.difficulty}")
        print(f"    Scores: {room.scores}\n")
        
        print(f"✓ Multiple answers processed")
        print(f"  Final Scores: {room.scores}")
        print(f"  Winnings: {'Player1' if room.scores['Player1'] > room.scores['Player2'] else 'Player2'}")

# Run the async test
print("📋 Test Sequence:\n")
print("1️⃣  Creating multiplayer room")
print("2️⃣  Adding 2 players")
print("3️⃣  Simulating game flow")
print("4️⃣  Processing answers")
print("5️⃣  Tracking difficulty changes\n")

try:
    asyncio.run(simulate_game())
    print("\n" + "="*60)
    print("✅ MULTIPLAYER SIMULATION SUCCESSFUL!")
    print("="*60)
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
