import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "quizohquiz-secret-key-2026")
    SQLALCHEMY_DATABASE_URI = "sqlite:///quiz.db"
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]
