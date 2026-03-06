"""
Room Manager for multiplayer quiz games.
Manages in-memory room state for active games with SocketIO.
"""

import random
import string
import time
from engine.difficulty_engine import DifficultyEngine


class PlayerState:
    """Tracks the state of a single player in a room."""
    def __init__(self, user_id, username, sid):
        self.user_id = user_id
        self.username = username
        self.sid = sid
        self.score = 0
        self.answers = 0
        self.correct = 0
        self.difficulty_engine = DifficultyEngine()
        self.selected_topic = None
        self.ready = False

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "score": self.score,
            "answers": self.answers,
            "correct": self.correct,
            "difficulty": self.difficulty_engine.get_difficulty(),
        }


class GameRoom:
    """Represents a single multiplayer game room."""
    def __init__(self, room_code, host_id, host_username, host_sid):
        self.room_code = room_code
        self.host_id = host_id
        self.host_sid = host_sid
        self.players = {}  # sid -> PlayerState
        self.status = "waiting"  # waiting, topic_select, playing, finished
        self.topic = "General Knowledge"
        self.topic_votes = {}  # topic -> count
        self.current_question = None
        self.question_number = 0
        self.total_questions = 10
        self.question_start_time = 0
        self.created_at = time.time()

        # Add host as first player
        self.add_player(host_id, host_username, host_sid)

    def add_player(self, user_id, username, sid):
        self.players[sid] = PlayerState(user_id, username, sid)

    def remove_player(self, sid):
        if sid in self.players:
            del self.players[sid]

    def get_player_list(self):
        return [p.to_dict() for p in self.players.values()]

    def vote_topic(self, sid, topic):
        if sid in self.players:
            self.players[sid].selected_topic = topic
            # Count votes
            self.topic_votes = {}
            for p in self.players.values():
                if p.selected_topic:
                    self.topic_votes[p.selected_topic] = self.topic_votes.get(p.selected_topic, 0) + 1
            # Set topic to most voted
            if self.topic_votes:
                self.topic = max(self.topic_votes, key=self.topic_votes.get)

    def submit_answer(self, sid, is_correct, response_time):
        if sid not in self.players:
            return
        player = self.players[sid]
        player.answers += 1
        if is_correct:
            player.correct += 1
            # Score based on speed and difficulty
            difficulty_bonus = {"easy": 1, "medium": 1.5, "hard": 2}
            bonus = difficulty_bonus.get(player.difficulty_engine.get_difficulty(), 1)
            time_bonus = max(1, int((15 - response_time) * 2))
            player.score += int(10 * bonus + time_bonus)

        player.difficulty_engine.record_answer(is_correct, response_time)

    def get_scores(self):
        return {p.username: p.score for p in self.players.values()}

    def get_results(self):
        results = []
        for p in sorted(self.players.values(), key=lambda x: x.score, reverse=True):
            stats = p.difficulty_engine.get_stats()
            results.append({
                "username": p.username,
                "user_id": p.user_id,
                "score": p.score,
                "correct": p.correct,
                "total": p.answers,
                "accuracy": stats["accuracy"],
                "avg_time": stats["avg_response_time"],
            })
        return results


class RoomManager:
    """Manages all active game rooms."""
    def __init__(self):
        self.rooms = {}  # room_code -> GameRoom

    def generate_code(self):
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if code not in self.rooms:
                return code

    def create_room(self, host_id, host_username, host_sid):
        code = self.generate_code()
        room = GameRoom(code, host_id, host_username, host_sid)
        self.rooms[code] = room
        return room

    def get_room(self, room_code):
        return self.rooms.get(room_code)

    def remove_room(self, room_code):
        if room_code in self.rooms:
            del self.rooms[room_code]

    def find_room_by_sid(self, sid):
        for code, room in self.rooms.items():
            if sid in room.players:
                return code, room
        return None, None