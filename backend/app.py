"""
quizOHquiz - AI Multiplayer Quiz Backend
Flask + Flask-SocketIO + SQLite
"""

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from datetime import datetime, timezone
import json

from config import Config
from database.db import SessionLocal, init_db
from models.user_model import User
from models.quiz_model import GameSession, QuizAnswer
from models.room_model import Room, RoomPlayer
from ai.question_generator import (
    generate_question, get_available_topics,
    preload_questions, get_cached_question, get_all_cached_questions,
    clear_cache, cache_size, mark_questions_used
)
from engine.difficulty_engine import DifficultyEngine
from multiplayer.local_room import RoomManager

# ── App Setup ────────────────────────────────────────────────
app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

room_manager = RoomManager()

# Single-player sessions: user_id -> DifficultyEngine
sp_engines = {}

# Fixed difficulty chosen by player before game: user_id -> "easy"|"medium"|"hard"
sp_difficulty = {}


# ── Helpers ──────────────────────────────────────────────────
def get_db():
    return SessionLocal()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REST API Routes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/")
def index():
    return """
    <html>
        <head><title>quizOHquiz Backend</title></head>
        <body style="background: #0f1420; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>🧠 quizOHquiz Backend API</h1>
            <p>The backend is running successfully!</p>
            <br/>
            <p>You are viewing the <b>Backend Server</b>.</p>
            <p>To view and interact with the quizOHquiz application, please open the Vite frontend url in your browser:</p>
            <h2><a href="http://localhost:5173" style="color: #00d4ff;">http://localhost:5173</a> or <a href="http://localhost:5174" style="color: #00d4ff;">http://localhost:5174</a></h2>
        </body>
    </html>
    """

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "quizOHquiz API is running"})


# ── Auth ─────────────────────────────────────────────────────

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    db = get_db()
    try:
        if db.query(User).filter(User.username == username).first():
            return jsonify({"error": "Username already taken"}), 400
        if db.query(User).filter(User.email == email).first():
            return jsonify({"error": "Email already registered"}), 400

        user = User(username=username, email=email)
        user.set_password(password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return jsonify({"message": "Account created successfully", "user": user.to_dict()}), 201
    finally:
        db.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email", "").strip()
    password = data.get("password", "")

    db = get_db()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid email or password"}), 401
        return jsonify({"message": "Login successful", "user": user.to_dict()})
    finally:
        db.close()


# ── Topics ───────────────────────────────────────────────────

@app.route("/api/topics", methods=["GET"])
def topics():
    return jsonify({"topics": get_available_topics()})


# ── Single Player Quiz ───────────────────────────────────────

@app.route("/api/quiz/start", methods=["POST"])
def quiz_start():
    data = request.json
    user_id = data.get("user_id")
    topic = data.get("topic", "General Knowledge")
    # Accept the difficulty the player chose before starting
    chosen_difficulty = data.get("difficulty", "easy").lower()
    if chosen_difficulty not in ("easy", "medium", "hard"):
        chosen_difficulty = "easy"

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    db = get_db()
    try:
        session = GameSession(user_id=user_id, mode="single", topic=topic)
        db.add(session)
        db.commit()
        db.refresh(session)

        # Store the fixed difficulty for this player
        sp_difficulty[user_id] = chosen_difficulty
        # Keep engine around only for stats, not for adaptive difficulty
        sp_engines[user_id] = DifficultyEngine()
        sp_engines[user_id].current_difficulty = chosen_difficulty

        # Pre-generate ALL 10 questions in one API call so they're served instantly
        try:
            preload_questions(
                session_id=str(session.id),
                topic=topic,
                difficulty=chosen_difficulty,
                count=10,
                user_id=user_id,
            )
            preloaded = True
        except Exception as e:
            preloaded = False
            print(f"[WARN] Batch preload failed, will fall back to live: {e}")

        return jsonify({
            "session_id": session.id,
            "topic": topic,
            "difficulty": chosen_difficulty,
            "preloaded": preloaded,
            "message": "Quiz started!"
        })
    finally:
        db.close()


@app.route("/api/quiz/question", methods=["POST"])
def quiz_question():
    data = request.json
    user_id = data.get("user_id")
    session_id = str(data.get("session_id", ""))
    topic = data.get("topic", "General Knowledge")

    # Use the FIXED difficulty the player chose — never adapt
    difficulty = sp_difficulty.get(user_id, "easy")

    # Try to serve from pre-loaded cache first (instant response)
    cached = get_cached_question(session_id) if session_id else None
    if cached:
        cached["difficulty"] = difficulty
        return jsonify(cached)

    # Cache miss or empty — fall back to live generation
    try:
        question = generate_question(topic=topic, difficulty=difficulty)
        question["difficulty"] = difficulty
        return jsonify(question)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quiz/answer", methods=["POST"])
def quiz_answer():
    data = request.json
    user_id = data.get("user_id")
    session_id = data.get("session_id")
    question_text = data.get("question", "")
    selected = data.get("selected_answer", "")
    correct_answer = data.get("correct_answer", "")
    response_time = data.get("response_time", 10.0)

    is_correct = selected == correct_answer
    engine = sp_engines.get(user_id)

    # Difficulty is FIXED — record stats only, don't adapt
    if engine:
        engine.record_answer(is_correct, response_time)
    new_difficulty = sp_difficulty.get(user_id, "easy")

    db = get_db()
    try:
        # Save answer
        difficulty_str = engine.get_difficulty() if engine else "easy"
        answer_record = QuizAnswer(
            session_id=session_id,
            user_id=user_id,
            question_text=question_text,
            selected_answer=selected,
            correct_answer=correct_answer,
            is_correct=1 if is_correct else 0,
            response_time=response_time,
            difficulty=difficulty_str,
        )
        db.add(answer_record)

        # Update session
        session = db.query(GameSession).filter(GameSession.id == session_id).first()
        if session:
            session.total_questions += 1
            if is_correct:
                session.correct_answers += 1
            answers = db.query(QuizAnswer).filter(QuizAnswer.session_id == session_id).all()
            if answers:
                session.avg_response_time = sum(a.response_time for a in answers) / len(answers)

        # Update user stats
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.total_answered = (user.total_answered or 0) + 1
            if is_correct:
                user.total_correct = (user.total_correct or 0) + 1
                user.score = (user.score or 0) + 10
            user.last_played = datetime.now(timezone.utc)

        db.commit()

        stats = engine.get_stats() if engine else {}

        return jsonify({
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "new_difficulty": new_difficulty,
            "stats": stats,
        })
    finally:
        db.close()


@app.route("/api/quiz/end", methods=["POST"])
def quiz_end():
    data = request.json
    user_id = data.get("user_id")
    session_id = data.get("session_id")

    db = get_db()
    try:
        session = db.query(GameSession).filter(GameSession.id == session_id).first()
        user = db.query(User).filter(User.id == user_id).first()

        if user:
            user.total_quizzes = (user.total_quizzes or 0) + 1
            
            # Daily streak logic
            today = datetime.now(timezone.utc).date()
            last_date = user.last_streak_date.date() if getattr(user, 'last_streak_date', None) else None
            
            if last_date != today:
                if last_date is None or (today - last_date).days == 1:
                    user.streak = (user.streak or 0) + 1
                elif (today - last_date).days > 1:
                    user.streak = 1
                user.last_streak_date = datetime.now(timezone.utc)
                if user.streak > (user.best_streak or 0):
                    user.best_streak = user.streak

        if session:
            engine = sp_engines.get(user_id)
            if engine:
                session.difficulty_progression = json.dumps([
                    h["difficulty"] for h in engine.history
                ])
            score = session.correct_answers * 10
            session.score = score
            if user:
                user.score = (user.score or 0)

        db.commit()

        result = session.to_dict() if session else {}
        engine = sp_engines.pop(user_id, None)
        sp_difficulty.pop(user_id, None)
        stats = engine.get_stats() if engine else {}
        result["performance"] = stats

        # Mark all questions from this session as used so they won't repeat
        if session_id:
            # Gather question texts from the DB answers for this session
            answers_for_session = db.query(QuizAnswer).filter(
                QuizAnswer.session_id == session_id
            ).all()
            used_texts = [{"question": a.question_text} for a in answers_for_session if a.question_text]
            if used_texts:
                mark_questions_used(user_id, used_texts)

        # Clean up question cache
        clear_cache(str(session_id))

        return jsonify(result)
    finally:
        db.close()


# ── Leaderboard ──────────────────────────────────────────────

@app.route("/api/leaderboard", methods=["GET"])
def leaderboard():
    db = get_db()
    try:
        users = db.query(User).order_by(User.score.desc()).limit(10).all()
        return jsonify({
            "leaderboard": [
                {
                    "rank": i + 1,
                    "username": u.username,
                    "score": u.score,
                    "streak": u.streak,
                    "total_quizzes": u.total_quizzes,
                }
                for i, u in enumerate(users)
            ]
        })
    finally:
        db.close()


# ── User Stats / Analytics ───────────────────────────────────

@app.route("/api/user/<int:user_id>/stats", methods=["GET"])
def user_stats(user_id):
    db = get_db()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        sessions = db.query(GameSession).filter(
            GameSession.user_id == user_id
        ).order_by(GameSession.created_at.desc()).limit(20).all()

        answers = db.query(QuizAnswer).filter(
            QuizAnswer.user_id == user_id
        ).order_by(QuizAnswer.created_at.desc()).limit(100).all()

        # Accuracy by topic
        topic_stats = {}
        for s in sessions:
            if s.topic not in topic_stats:
                topic_stats[s.topic] = {"total": 0, "correct": 0}
            topic_stats[s.topic]["total"] += s.total_questions
            topic_stats[s.topic]["correct"] += s.correct_answers

        # Score over time
        score_history = [
            {"date": s.created_at.strftime("%m/%d"), "score": s.score, "topic": s.topic}
            for s in reversed(sessions)
        ]

        # Difficulty distribution
        diff_dist = {"easy": 0, "medium": 0, "hard": 0}
        for a in answers:
            if a.difficulty in diff_dist:
                diff_dist[a.difficulty] += 1
                
        # Calculate active days (unique timestamps) so frontend can convert UTC to local time
        all_sessions = db.query(GameSession).filter(GameSession.user_id == user_id).all()
        active_days_set = set(s.created_at.isoformat() for s in all_sessions if s.created_at)
        active_days = sorted(list(active_days_set))

        return jsonify({
            "user": user.to_dict(),
            "sessions": [s.to_dict() for s in sessions],
            "topic_stats": {
                k: {
                    "total": v["total"],
                    "correct": v["correct"],
                    "accuracy": round(v["correct"] / v["total"] * 100, 1) if v["total"] > 0 else 0,
                }
                for k, v in topic_stats.items()
            },
            "score_history": score_history,
            "difficulty_distribution": diff_dist,
            "active_days": active_days,
        })
    finally:
        db.close()


# ── Room Management (REST) ───────────────────────────────────

@app.route("/api/rooms/create", methods=["POST"])
def create_room():
    data = request.json
    user_id = data.get("user_id")
    username = data.get("username")

    if not user_id or not username:
        return jsonify({"error": "user_id and username required"}), 400

    db = get_db()
    try:
        room_code = room_manager.generate_code()
        room_record = Room(room_code=room_code, host_id=user_id)
        db.add(room_record)
        db.commit()
        return jsonify({"room_code": room_code, "message": "Room created"})
    finally:
        db.close()


@app.route("/api/rooms/<room_code>", methods=["GET"])
def get_room_status(room_code):
    game_room = room_manager.get_room(room_code)
    if not game_room:
        return jsonify({"error": "Room not found"}), 404
    return jsonify({
        "room_code": room_code,
        "status": game_room.status,
        "topic": game_room.topic,
        "players": game_room.get_player_list(),
    })


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SocketIO Events (Multiplayer)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@socketio.on("connect")
def on_connect():
    print(f"[WS] Client connected: {request.sid}")


@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    code, room = room_manager.find_room_by_sid(sid)
    if room:
        room.remove_player(sid)
        emit("player_left", {
            "players": room.get_player_list(),
            "message": "A player disconnected"
        }, room=code)
        if len(room.players) == 0:
            room_manager.remove_room(code)
    print(f"[WS] Client disconnected: {sid}")


@socketio.on("create_room")
def on_create_room(data):
    sid = request.sid
    user_id = data.get("user_id")
    username = data.get("username", "Player")

    room = room_manager.create_room(user_id, username, sid)
    join_room(room.room_code)

    emit("room_created", {
        "room_code": room.room_code,
        "players": room.get_player_list(),
        "is_host": True,
    })


@socketio.on("join_room")
def on_join_room(data):
    sid = request.sid
    room_code = data.get("room_code", "").upper()
    user_id = data.get("user_id")
    username = data.get("username", "Player")

    room = room_manager.get_room(room_code)
    if not room:
        emit("error", {"message": "Room not found. Check the code and try again."})
        return

    if room.status != "waiting":
        emit("error", {"message": "Game already in progress"})
        return

    if len(room.players) >= 4:
        emit("error", {"message": "Room is full (max 4 players)"})
        return

    room.add_player(user_id, username, sid)
    join_room(room_code)

    emit("room_joined", {
        "room_code": room_code,
        "players": room.get_player_list(),
        "topic": room.topic,
        "is_host": False,
    })

    emit("player_joined", {
        "players": room.get_player_list(),
        "message": f"{username} joined the room!",
    }, room=room_code)


@socketio.on("select_topic")
def on_select_topic(data):
    sid = request.sid
    room_code = data.get("room_code")
    topic = data.get("topic")

    room = room_manager.get_room(room_code)
    if room:
        room.vote_topic(sid, topic)
        emit("topic_update", {
            "topic": room.topic,
            "votes": room.topic_votes,
            "players": room.get_player_list(),
        }, room=room_code)


@socketio.on("start_game")
def on_start_game(data):
    sid = request.sid
    room_code = data.get("room_code")

    room = room_manager.get_room(room_code)
    if not room:
        return

    if room.host_sid != sid:
        emit("error", {"message": "Only the host can start the game"})
        return

    if len(room.players) < 2:
        emit("error", {"message": "Need at least 2 players to start"})
        return

    room.status = "playing"
    room.question_number = 0

    emit("game_starting", {
        "topic": room.topic,
        "total_questions": room.total_questions,
        "message": "Game is starting!",
    }, room=room_code)

    # Send first question
    send_next_question(room_code)


def send_next_question(room_code):
    room = room_manager.get_room(room_code)
    if not room or room.question_number >= room.total_questions:
        end_game(room_code)
        return

    room.question_number += 1

    try:
        question = generate_question(topic=room.topic, difficulty="medium")
        room.current_question = question
        room.question_start_time = __import__("time").time()

        socketio.emit("new_question", {
            "question": question["question"],
            "options": question["options"],
            "question_number": room.question_number,
            "total_questions": room.total_questions,
            "scores": room.get_scores(),
        }, room=room_code)
    except Exception as e:
        socketio.emit("error", {"message": f"Failed to generate question: {e}"}, room=room_code)


@socketio.on("submit_answer")
def on_submit_answer(data):
    sid = request.sid
    room_code = data.get("room_code")
    selected = data.get("answer")
    response_time = data.get("response_time", 15.0)

    room = room_manager.get_room(room_code)
    if not room or not room.current_question:
        return

    is_correct = selected == room.current_question["answer"]
    room.submit_answer(sid, is_correct, response_time)

    player = room.players.get(sid)
    if player:
        emit("answer_result", {
            "is_correct": is_correct,
            "correct_answer": room.current_question["answer"],
            "your_score": player.score,
            "scores": room.get_scores(),
        })

    emit("score_update", {"scores": room.get_scores()}, room=room_code)

    # Check if all players answered
    answered_count = sum(1 for p in room.players.values() if p.answers >= room.question_number)
    if answered_count >= len(room.players):
        socketio.sleep(1.5)
        send_next_question(room_code)


def end_game(room_code):
    room = room_manager.get_room(room_code)
    if not room:
        return

    room.status = "finished"

    socketio.emit("game_over", {
        "results": room.get_results(),
        "topic": room.topic,
    }, room=room_code)

    # Save to database
    db = get_db()
    try:
        for p in room.players.values():
            session = GameSession(
                user_id=p.user_id,
                mode="multiplayer",
                topic=room.topic,
                total_questions=p.answers,
                correct_answers=p.correct,
                score=p.score,
            )
            db.add(session)

            user = db.query(User).filter(User.id == p.user_id).first()
            if user:
                user.total_quizzes = (user.total_quizzes or 0) + 1
                user.total_answered = (user.total_answered or 0) + p.answers
                user.total_correct = (user.total_correct or 0) + p.correct
                user.score = (user.score or 0) + p.score
                user.last_played = datetime.now(timezone.utc)

        db.commit()
    finally:
        db.close()

    room_manager.remove_room(room_code)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Start Server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == "__main__":
    init_db()
    print("\n[*] quizOHquiz Backend running at http://127.0.0.1:5000")
    print("    SocketIO enabled for multiplayer\n")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)