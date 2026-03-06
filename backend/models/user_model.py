from sqlalchemy import Column, Integer, String, DateTime, Float
from database.db import Base
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    score = Column(Integer, default=0)
    total_quizzes = Column(Integer, default=0)
    total_correct = Column(Integer, default=0)
    total_answered = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    last_streak_date = Column(DateTime, nullable=True)
    avg_response_time = Column(Float, default=0.0)
    last_played = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "score": self.score,
            "total_quizzes": self.total_quizzes,
            "total_correct": self.total_correct,
            "total_answered": self.total_answered,
            "streak": self.streak,
            "best_streak": self.best_streak,
            "last_streak_date": self.last_streak_date.isoformat() if hasattr(self, 'last_streak_date') and self.last_streak_date else None,
            "avg_response_time": round(self.avg_response_time, 2),
            "last_played": self.last_played.isoformat() if self.last_played else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }