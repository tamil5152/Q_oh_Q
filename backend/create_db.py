import sys
sys.path.insert(0, '.')
from database.db import init_db
init_db()
print("DB recreated successfully!")
