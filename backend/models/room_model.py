from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database.db import Base
from datetime import datetime, timezone


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True)
    room_code = Column(String(6), unique=True, nullable=False, index=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(100), default="General Knowledge")
    status = Column(String(20), default="waiting")  # waiting / playing / finished
    max_players = Column(Integer, default=4)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "room_code": self.room_code,
            "host_id": self.host_id,
            "topic": self.topic,
            "status": self.status,
            "max_players": self.max_players,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RoomPlayer(Base):
    __tablename__ = "room_players"

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    username = Column(String(50), nullable=False)
    score = Column(Integer, default=0)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
