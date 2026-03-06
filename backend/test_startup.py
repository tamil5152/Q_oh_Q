import sys
import os
os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')

print("Testing database initialization...")
from database.db import init_db
init_db()
print("[OK] Database initialized")

print("\nTesting Flask app import...")
from app import app
print("[OK] Flask app loaded")
routes = [r.rule for r in app.url_map.iter_rules() if r.rule != '/static/<path:filename>']
for r in sorted(routes):
    print(f"  {r}")

print("\nTesting difficulty engine...")
from engine.difficulty_engine import DifficultyEngine
engine = DifficultyEngine()
engine.record_answer(True, 3.5)
engine.record_answer(True, 2.1)
engine.record_answer(False, 8.0)
print(f"  [OK] Difficulty after 3 answers: {engine.get_difficulty()}")
print(f"  [OK] Stats: {engine.get_stats()}")

print("\nTesting question generator import...")
from ai.question_generator import get_available_topics
topics = get_available_topics()
print(f"  [OK] {len(topics)} topics available")

print("\n" + "="*50)
print("ALL BACKEND TESTS PASSED!")
print("="*50)
