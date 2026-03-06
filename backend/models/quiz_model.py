from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database.db import Base
from datetime import datetime, timezone


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mode = Column(String(20), default="single")  # single / multiplayer
    topic = Column(String(100), nullable=False)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    score = Column(Integer, default=0)
    avg_response_time = Column(Float, default=0.0)
    difficulty_progression = Column(String(500), default="")  # JSON string of difficulty changes
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "mode": self.mode,
            "topic": self.topic,
            "total_questions": self.total_questions,
            "correct_answers": self.correct_answers,
            "score": self.score,
            "avg_response_time": round(self.avg_response_time, 2),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_text = Column(String(500))
    selected_answer = Column(String(200))
    correct_answer = Column(String(200))
    is_correct = Column(Integer, default=0)  # 0 or 1
    response_time = Column(Float, default=0.0)
    difficulty = Column(String(20), default="easy")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))