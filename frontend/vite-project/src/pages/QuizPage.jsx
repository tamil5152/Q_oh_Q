import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getUser, startQuiz, getQuestion, submitAnswer, endQuiz } from "../services/api";

const TOTAL_QUESTIONS = 10;
const TIME_PER_QUESTION = 20;

export default function QuizPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const topic = searchParams.get("topic") || "General Knowledge";
    const user = getUser();

    const [sessionId, setSessionId] = useState(null);
    const [question, setQuestion] = useState(null);
    const [questionNum, setQuestionNum] = useState(0);
    const [score, setScore] = useState(0);
    const [difficulty, setDifficulty] = useState("easy");
    const [selected, setSelected] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);   // between-question flash
    const [preparing, setPreparing] = useState(true); // initial batch-generation wait
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(TIME_PER_QUESTION);
    const [questionStartTime, setQuestionStartTime] = useState(0);
    const [finished, setFinished] = useState(false);
    const timerRef = useRef(null);
    const sessionRef = useRef(null); // stable ref so callbacks always see latest sessionId

    // Start quiz session
    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        async function init() {
            try {
                const data = await startQuiz(user.id, topic);
                if (data.error) {
                    setError(`Failed to start quiz: ${data.error}`);
                    setPreparing(false);
                    return;
                }
                sessionRef.current = data.session_id;
                setSessionId(data.session_id);
                // batch was pre-loaded server-side; first question served instantly
                await fetchNextQuestionWith(data.session_id);
            } catch (err) {
                setError(`Could not connect to backend: ${err.message}`);
            }
            setPreparing(false);
        }
        init();
        return () => clearInterval(timerRef.current);
    }, []);

    // Wrapper that always uses latest sessionId via ref
    const fetchNextQuestion = useCallback(() => {
        return fetchNextQuestionWith(sessionRef.current);
    }, []);

    async function fetchNextQuestionWith(sid) {
        setSelected(null);
        setResult(null);
        setLoading(true);
        try {
            const q = await getQuestion(user.id, topic, sid);
            if (q.error) {
                setError(`AI Error: ${q.error}`);
                setLoading(false);
                return;
            }
            setQuestion(q);
            setDifficulty(q.difficulty || "easy");
            setQuestionNum((n) => n + 1);
            setQuestionStartTime(Date.now());
            setTimer(TIME_PER_QUESTION);
            startTimer();
        } catch (err) {
            setError(`Failed to fetch question: ${err.message}`);
        }
        setLoading(false);
    }

    function startTimer() {
        clearInterval(timerRef.current);
        let t = TIME_PER_QUESTION;
        timerRef.current = setInterval(() => {
            t -= 1;
            setTimer(t);
            if (t <= 0) {
                clearInterval(timerRef.current);
                handleTimeout();
            }
        }, 1000);
    }

    function handleTimeout() {
        if (!question || selected !== null) return;
        setSelected("__timeout__");
        setResult({ is_correct: false, correct_answer: question.answer });
        // Auto-advance after 2s
        setTimeout(() => fetchNextQuestion(), 2000);
    }

    async function handleAnswer(option) {
        if (selected !== null) return;
        clearInterval(timerRef.current);

        const responseTime = (Date.now() - questionStartTime) / 1000;
        setSelected(option);

        try {
            const res = await submitAnswer(
                user.id,
                sessionId,
                question.question,
                option,
                question.answer,
                responseTime
            );
            setResult(res);
            setDifficulty(res.new_difficulty || difficulty);
            if (res.is_correct) {
                setScore((s) => s + 10);
            }
        } catch {
            setResult({ is_correct: option === question.answer, correct_answer: question.answer });
        }

        if (questionNum >= TOTAL_QUESTIONS) {
            setTimeout(() => handleEnd(), 2000);
        } else {
            setTimeout(() => fetchNextQuestion(), 2000);
        }
    }

    async function handleEnd() {
        setFinished(true);
        clearInterval(timerRef.current);
        try {
            const res = await endQuiz(user.id, sessionId);
            // Refresh user data in localStorage
            const updatedUser = { ...user, score: (user.score || 0) + score };
            localStorage.setItem("quizUser", JSON.stringify(updatedUser));
            navigate("/results", {
                state: {
                    mode: "single",
                    topic,
                    score,
                    total: TOTAL_QUESTIONS,
                    correct: res.correct_answers || 0,
                    avgTime: res.avg_response_time || 0,
                    performance: res.performance || {},
                },
            });
        } catch {
            navigate("/results", {
                state: { mode: "single", topic, score, total: TOTAL_QUESTIONS, correct: 0 },
            });
        }
    }

    const letters = ["A", "B", "C", "D"];
    const progressPct = (questionNum / TOTAL_QUESTIONS) * 100;
    const timerPct = (timer / TIME_PER_QUESTION) * 283;

    if (error) {
        return (
            <div>
                <Navbar />
                <div className="loading">
                    <p style={{ color: '#ff6b6b', fontSize: '1.2rem', marginBottom: '1rem' }}>⚠️ {error}</p>
                    {error.includes('quota') || error.includes('429') || error.includes('RESOURCE_EXHAUSTED') ? (
                        <p style={{ color: '#aaa', maxWidth: '500px', textAlign: 'center' }}>
                            The Gemini API key has exceeded its quota. Please get a new API key from{' '}
                            <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: '#00d4ff' }}>Google AI Studio</a>{' '}
                            and update <code>backend/.env</code>.
                        </p>
                    ) : (
                        <p style={{ color: '#aaa' }}>Make sure the backend server is running on port 5000.</p>
                    )}
                    <button onClick={() => navigate('/')} style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#00d4ff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Go Home</button>
                </div>
            </div>
        );
    }

    if (preparing) {
        return (
            <div>
                <Navbar />
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Preparing your quiz...</p>
                    <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Generating all 10 questions at once — this takes ~5 seconds, then every question loads instantly ⚡
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="quiz-page">
                {/* Top Bar */}
                <div className="quiz-top-bar">
                    <div className="quiz-progress">
                        <div className="quiz-progress-label">
                            <span>Question {questionNum} / {TOTAL_QUESTIONS}</span>
                            <span>{topic}</span>
                        </div>
                        <div className="quiz-progress-bar">
                            <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }}></div>
                        </div>
                    </div>

                    <div className="quiz-meta">
                        <span className={`quiz-badge badge-${difficulty}`}>{difficulty}</span>
                        <div className="quiz-timer">
                            <svg viewBox="0 0 100 100">
                                <circle className="quiz-timer-circle" cx="50" cy="50" r="45" />
                                <circle
                                    className="quiz-timer-progress"
                                    cx="50" cy="50" r="45"
                                    strokeDasharray="283"
                                    strokeDashoffset={283 - timerPct}
                                />
                            </svg>
                            <span className="quiz-timer-text">{timer}</span>
                        </div>
                    </div>
                </div>

                {/* Score Bar */}
                <div className="quiz-score-bar">
                    <span>Score</span>
                    <span className="quiz-score-val">{score}</span>
                </div>

                {/* Question */}
                {question && (
                    <div className="quiz-question-card" key={questionNum}>
                        <div className="quiz-question-text">{question.question}</div>
                    </div>
                )}

                {/* Options */}
                {question && (
                    <div className="quiz-options">
                        {question.options.map((opt, i) => {
                            let cls = "quiz-option";
                            if (selected !== null) {
                                cls += " disabled";
                                if (opt === question.answer) cls += " correct";
                                else if (opt === selected) cls += " wrong";
                            }
                            return (
                                <div key={i} className={cls} onClick={() => handleAnswer(opt)}>
                                    <div className="quiz-option-letter">{letters[i]}</div>
                                    <span>{opt}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Explanation */}
                {result && question?.explanation && (
                    <div className="quiz-explanation">
                        💡 {question.explanation}
                    </div>
                )}

                {loading && question && (
                    <div className="loading" style={{ padding: "2rem" }}>
                        <div className="spinner"></div>
                        <p>Loading next question...</p>
                    </div>
                )}
            </div>
        </div>
    );
}