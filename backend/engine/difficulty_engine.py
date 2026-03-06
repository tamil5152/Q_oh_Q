"""
ML-based Adaptive Difficulty Engine

Uses a weighted scoring system analyzing:
- Response time (speed)
- Correctness streak
- Overall accuracy (rolling window)
- Recent performance trend

Outputs: "easy", "medium", or "hard"
"""


class DifficultyEngine:
    def __init__(self):
        self.history = []          # list of dicts: {correct, response_time, difficulty}
        self.streak = 0            # positive = correct streak, negative = wrong streak
        self.window_size = 5       # rolling window for recent performance
        self.current_difficulty = "easy"

        # Weights for the composite score
        self.w_accuracy = 0.35
        self.w_speed = 0.30
        self.w_streak = 0.20
        self.w_trend = 0.15

    def record_answer(self, correct: bool, response_time: float):
        """Record an answer and update internal state."""
        self.history.append({
            "correct": correct,
            "response_time": response_time,
            "difficulty": self.current_difficulty,
        })

        if correct:
            self.streak = max(0, self.streak) + 1
        else:
            self.streak = min(0, self.streak) - 1

        self.current_difficulty = self._calculate_difficulty()
        return self.current_difficulty

    def _calculate_difficulty(self):
        """Calculate difficulty based on weighted composite score (0-1 scale)."""
        if len(self.history) < 2:
            return "easy"

        recent = self.history[-self.window_size:]

        # --- Accuracy score (0-1): proportion of correct answers ---
        correct_count = sum(1 for h in recent if h["correct"])
        accuracy_score = correct_count / len(recent)

        # --- Speed score (0-1): faster = higher score ---
        avg_time = sum(h["response_time"] for h in recent) / len(recent)
        if avg_time < 3:
            speed_score = 1.0
        elif avg_time < 6:
            speed_score = 0.7
        elif avg_time < 10:
            speed_score = 0.4
        else:
            speed_score = 0.15

        # --- Streak score (0-1): longer correct streak = higher ---
        streak_score = min(abs(self.streak) / 5, 1.0)
        if self.streak < 0:
            streak_score = 1.0 - streak_score  # invert for wrong streaks

        # --- Trend score (0-1): improving = higher ---
        if len(self.history) >= 4:
            first_half = self.history[-4:-2]
            second_half = self.history[-2:]
            first_acc = sum(1 for h in first_half if h["correct"]) / len(first_half)
            second_acc = sum(1 for h in second_half if h["correct"]) / len(second_half)
            trend_score = 0.5 + (second_acc - first_acc) * 0.5
            trend_score = max(0, min(1, trend_score))
        else:
            trend_score = 0.5

        # --- Composite score ---
        composite = (
            self.w_accuracy * accuracy_score +
            self.w_speed * speed_score +
            self.w_streak * streak_score +
            self.w_trend * trend_score
        )

        # Map composite to difficulty
        if composite >= 0.65:
            return "hard"
        elif composite >= 0.38:
            return "medium"
        else:
            return "easy"

    def get_difficulty(self):
        """Return the current difficulty level."""
        return self.current_difficulty

    def get_stats(self):
        """Return performance statistics."""
        if not self.history:
            return {
                "total_answered": 0,
                "accuracy": 0,
                "avg_response_time": 0,
                "streak": 0,
                "difficulty": self.current_difficulty,
            }

        total = len(self.history)
        correct = sum(1 for h in self.history if h["correct"])
        avg_time = sum(h["response_time"] for h in self.history) / total

        return {
            "total_answered": total,
            "accuracy": round(correct / total * 100, 1),
            "avg_response_time": round(avg_time, 2),
            "streak": self.streak,
            "difficulty": self.current_difficulty,
        }