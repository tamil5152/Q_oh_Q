import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { loginUser, saveUser } from "../services/api";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }
        setLoading(true);
        try {
            const data = await loginUser(email, password);
            if (data.error) {
                setError(data.error);
            } else {
                saveUser(data.user);
                navigate("/");
            }
        } catch {
            setError("Network error. Is the backend running?");
        }
        setLoading(false);
    }

    return (
        <div>
            <Navbar />
            <div className="auth-page">
                <form className="auth-card" onSubmit={handleSubmit}>
                    <div className="auth-logo" onClick={() => navigate("/")}>
                        quiz<span className="oh">OH</span>quiz
                    </div>
                    <p className="auth-tagline">Welcome back, quizzer! 👋</p>

                    <div className="auth-tabs">
                        <button type="button" className="auth-tab active">Log In</button>
                        <button type="button" className="auth-tab" onClick={() => navigate("/signup")}>
                            Sign Up
                        </button>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">EMAIL ADDRESS</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">PASSWORD</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Log In →"}
                    </button>
                </form>
            </div>
        </div>
    );
}