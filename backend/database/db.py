import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "quiz.db")
DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from models.user_model import User
    from models.quiz_model import GameSession, QuizAnswer
    from models.room_model import Room, RoomPlayer
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")