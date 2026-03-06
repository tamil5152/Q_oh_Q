import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, LineChart, Line,
    ResponsiveContainer,
} from "recharts";
import Navbar from "../components/Navbar";
import Calendar from "../components/Calendar";
import Badges from "../components/Badges";
import TierBadge from "../components/TierBadge";
import { getUser, getUserStats } from "../services/api";

const COLORS = ["#ff6b1a", "#00d4ff", "#00e676", "#f5c542", "#a855f7", "#ff4757"];

export default function AnalyticsPage() {
    const navigate = useNavigate();
    const user = getUser();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        getUserStats(user.id)
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading your analytics...</p>
                </div>
            </div>
        );
    }

    if (!stats || !stats.user) {
        return (
            <div>
                <Navbar />
                <div className="analytics-page">
                    <div className="analytics-header">
                        <h1>📊 Your Analytics</h1>
                        <p>Play some quizzes to see your analytics here!</p>
                    </div>
                    <button className="nav-btn-primary" onClick={() => navigate("/topics")}>
                        Start a Quiz 🎮
                    </button>
                </div>
            </div>
        );
    }

    const u = stats.user;
    const topicData = Object.entries(stats.topic_stats || {}).map(([topic, data]) => ({
        topic: topic.length > 12 ? topic.slice(0, 12) + "…" : topic,
        accuracy: data.accuracy,
        total: data.total,
    }));

    const scoreHistory = stats.score_history || [];
    const diffDist = stats.difficulty_distribution || {};
    const diffData = [
        { name: "Easy", value: diffDist.easy || 0 },
        { name: "Medium", value: diffDist.medium || 0 },
        { name: "Hard", value: diffDist.hard || 0 },
    ].filter((d) => d.value > 0);

    const overallAccuracy = u.total_answered > 0
        ? Math.round((u.total_correct / u.total_answered) * 100)
        : 0;

    return (
        <div>
            <Navbar />
            <div className="analytics-page">
                <div className="analytics-header fade-in">
                    <h1>📊 Your Analytics</h1>
                    <p>Track your quiz performance and growth</p>
                </div>

                {/* Stat Cards */}
                <div className="analytics-stats">
                    <div className="ana-stat slide-up">
                        <div className="ana-stat-icon">🎯</div>
                        <div className="ana-stat-value">{u.total_quizzes || 0}</div>
                        <div className="ana-stat-label">Quizzes Played</div>
                    </div>
                    <div className="ana-stat slide-up">
                        <div className="ana-stat-icon">✅</div>
                        <div className="ana-stat-value">{overallAccuracy}%</div>
                        <div className="ana-stat-label">Accuracy</div>
                    </div>
                    <div className="ana-stat slide-up">
                        <div className="ana-stat-icon">🔥</div>
                        <div className="ana-stat-value">{u.best_streak || 0}</div>
                        <div className="ana-stat-label">Best Streak</div>
                    </div>
                    <div className="ana-stat slide-up">
                        <div className="ana-stat-icon">⚡</div>
                        <div className="ana-stat-value">{u.avg_response_time || 0}s</div>
                        <div className="ana-stat-label">Avg Speed</div>
                    </div>
                </div>

                <div className="charts-grid">
                    {/* Calendar (Full Width) */}
                    <div className="chart-card" style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center" }}>
                        <Calendar activeDays={stats.active_days || []} />
                    </div>

                    {/* Score Over Time */}
                    {scoreHistory.length > 0 && (
                        <div className="chart-card">
                            <h3>📈 Score History</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={scoreHistory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#6b7394" fontSize={11} />
                                    <YAxis stroke="#6b7394" fontSize={11} />
                                    <Tooltip
                                        contentStyle={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                                        labelStyle={{ color: "#e8eaf2" }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#ff6b1a" strokeWidth={2} dot={{ fill: "#ff6b1a", r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Difficulty Distribution */}
                    {diffData.length > 0 && (
                        <div className="chart-card">
                            <h3>📊 Difficulty Distribution</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={diffData}
                                        cx="50%" cy="50%"
                                        innerRadius={50} outerRadius={80}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {diffData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Accuracy by Topic */}
                    {topicData.length > 0 && (
                        <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
                            <h3>🎯 Accuracy by Topic</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={topicData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="topic" stroke="#6b7394" fontSize={11} angle={-20} textAnchor="end" height={60} />
                                    <YAxis stroke="#6b7394" fontSize={11} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                                        labelStyle={{ color: "#e8eaf2" }}
                                    />
                                    <Bar dataKey="accuracy" fill="#00d4ff" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Tier & Badges Section */}
                <TierBadge score={u.score || 0} />
                <Badges bestStreak={u.best_streak || 0} />

                {topicData.length === 0 && scoreHistory.length === 0 && (
                    <div className="chart-card" style={{ textAlign: "center", padding: "3rem" }}>
                        <p style={{ color: "var(--muted)", fontSize: "1rem" }}>
                            Play more quizzes to see detailed analytics here! 📊
                        </p>
                        <button
                            className="nav-btn-primary"
                            style={{ marginTop: "1rem" }}
                            onClick={() => navigate("/topics")}
                        >
                            Start a Quiz 🎮
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
