from groq import Groq
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Groq's fastest model - llama on Groq is extremely fast (hundreds of tokens/sec)
MODEL = "llama-3.3-70b-versatile"

TOPICS = [
    "Science", "Mathematics", "History", "Technology",
    "Geography", "Sports", "Literature", "General Knowledge",
    "Computer Science", "Physics", "Chemistry", "Biology",
    "Economics", "Art & Culture", "Music", "Movies & Entertainment"
]

# In-memory cache: session_id -> list of pre-generated questions
_question_cache: dict[str, list] = {}


def generate_questions_batch(topic: str = "General Knowledge", difficulty: str = "easy", count: int = 10) -> list:
    """
    Generate `count` quiz questions in a SINGLE Groq API call.
    Groq inference is very fast (~500 tokens/sec), so this returns in ~2-3 seconds.
    """
    prompt = f"""Generate exactly {count} unique multiple choice questions about {topic}.
Difficulty level: {difficulty}

Difficulty guidelines:
- easy: Basic concepts, common knowledge, straightforward questions
- medium: Requires some understanding, application of concepts
- hard: Advanced concepts, requires deep knowledge

CRITICAL: Return ONLY a valid JSON array (no markdown, no explanations, no extra text).
Each object must have exactly these fields:
- question: string
- options: array of exactly 4 strings
- answer: string (must be one of the options)
- explanation: string (brief explanation)

Example:
[
  {{"question": "What is H2O?", "options": ["Water", "Oxygen", "Hydrogen", "Salt"], "answer": "Water", "explanation": "H2O is the chemical formula for water."}}
]

Generate exactly {count} questions now:"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a quiz question generator. Always respond with a valid JSON array only. No markdown, no explanations, no extra text."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4096,
        )
        text = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        questions = json.loads(text)

        if not isinstance(questions, list):
            raise ValueError("Response is not a JSON array")

        validated = []
        for q in questions:
            required = ["question", "options", "answer"]
            if all(f in q for f in required) and len(q.get("options", [])) == 4:
                if "explanation" not in q:
                    q["explanation"] = ""
                validated.append(q)

        if not validated:
            raise ValueError("No valid questions in batch response")

        return validated

    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse response as JSON: {e}")
    except Exception as e:
        raise ValueError(f"Error generating questions: {e}")


def preload_questions(session_id: str, topic: str, difficulty: str = "easy", count: int = 10):
    """Pre-generate all questions for a session and store in cache."""
    questions = generate_questions_batch(topic=topic, difficulty=difficulty, count=count)
    for q in questions:
        q["difficulty"] = difficulty
    _question_cache[session_id] = questions
    return len(questions)


def get_cached_question(session_id: str) -> dict | None:
    """Pop and return the next pre-generated question from cache."""
    questions = _question_cache.get(session_id, [])
    if questions:
        return questions.pop(0)
    return None


def cache_size(session_id: str) -> int:
    return len(_question_cache.get(session_id, []))


def clear_cache(session_id: str):
    _question_cache.pop(session_id, None)


# Single-question fallback (used by multiplayer)
def generate_question(topic: str = "General Knowledge", difficulty: str = "easy") -> dict:
    results = generate_questions_batch(topic=topic, difficulty=difficulty, count=1)
    return results[0]


def get_available_topics():
    return TOPICS