import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { registerUser } from "../services/api";

export default function Signup() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        if (!username || !email || !password) {
            setError("Please fill in all fields");
            return;
        }
        if (password.length < 4) {
            setError("Password must be at least 4 characters");
            return;
        }
        setLoading(true);
        try {
            const data = await registerUser(username, email, password);
            if (data.error) {
                setError(data.error);
            } else {
                navigate("/login");
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
                    <p className="auth-tagline">Join thousands of quiz champions 🏆</p>

                    <div className="auth-tabs">
                        <button type="button" className="auth-tab" onClick={() => navigate("/login")}>
                            Log In
                        </button>
                        <button type="button" className="auth-tab active">Sign Up</button>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">USERNAME</label>
                        <input
                            className="form-input"
                            placeholder="Pick a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">EMAIL</label>
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
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Account 🚀"}
                    </button>
                </form>
            </div>
        </div>
    );
}