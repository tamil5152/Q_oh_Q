const HOST = window.location.hostname;
const API_BASE = `http://${HOST}:5000/api`;

export async function registerUser(username, email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getTopics() {
  const res = await fetch(`${API_BASE}/topics`);
  return res.json();
}

export async function startQuiz(userId, topic, difficulty = "easy") {
  const res = await fetch(`${API_BASE}/quiz/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, topic, difficulty }),
  });
  return res.json();
}

export async function getQuestion(userId, topic, sessionId) {
  const res = await fetch(`${API_BASE}/quiz/question`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, topic, session_id: sessionId }),
  });
  return res.json();
}

export async function submitAnswer(userId, sessionId, question, selectedAnswer, correctAnswer, responseTime) {
  const res = await fetch(`${API_BASE}/quiz/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      session_id: sessionId,
      question,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
      response_time: responseTime,
    }),
  });
  return res.json();
}

export async function endQuiz(userId, sessionId) {
  const res = await fetch(`${API_BASE}/quiz/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, session_id: sessionId }),
  });
  return res.json();
}

export async function getLeaderboard() {
  const res = await fetch(`${API_BASE}/leaderboard`);
  return res.json();
}

export async function getUserStats(userId) {
  const res = await fetch(`${API_BASE}/user/${userId}/stats`);
  return res.json();
}

export function getUser() {
  const data = localStorage.getItem("quizUser");
  return data ? JSON.parse(data) : null;
}

export function saveUser(user) {
  localStorage.setItem("quizUser", JSON.stringify(user));
}

export function logoutUser() {
  localStorage.removeItem("quizUser");
}