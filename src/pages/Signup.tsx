import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Brain,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Leaf,
  Sparkles,
} from "lucide-react";

export function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    localStorage.setItem("cogniflow_auth", "true");
    localStorage.setItem(
      "cogniflow_user",
      JSON.stringify({
        email,
        name,
        createdAt: new Date().toISOString(),
      }),
    );

    navigate("/profile-setup");
    setIsLoading(false);
  };

  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 10
          ? 2
          : 3;
  const strengthColors = ["", "#ef4444", "#f59e0b", "#22c55e"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  return (
    <div className="su-root">
      <div className="su-blob su-b1" />
      <div className="su-blob su-b2" />
      <div className="su-blob su-b3" />
      <div className="su-leaf su-lf1">
        <Leaf />
      </div>
      <div className="su-leaf su-lf2">
        <Leaf />
      </div>

      <div className="su-card">
        <div className="su-logo-area">
          <div className="su-logo-box">
            <Brain className="su-logo-svg" />
            <div className="su-logo-ring" />
          </div>
          <h1 className="su-brand">
            Cogno<span className="su-brand-g">Flow</span>
          </h1>
          <p className="su-tagline">Start your cognitive journey today</p>
        </div>

        {error && (
          <div className="su-error">
            <span className="su-err-dot" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="su-form">
          {/* Name */}
          <div className="su-field">
            <label className="su-label">Full Name</label>
            <div className="su-inp-wrap">
              <User className="su-ico" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="su-inp"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="su-field">
            <label className="su-label">Email Address</label>
            <div className="su-inp-wrap">
              <Mail className="su-ico" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="su-inp"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="su-field">
            <label className="su-label">Password</label>
            <div className="su-inp-wrap">
              <Lock className="su-ico" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="su-inp su-inp-pw"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="su-eye"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {/* Password strength */}
            {password.length > 0 && (
              <div className="su-strength">
                <div className="su-strength-bars">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="su-sbar"
                      style={{
                        background:
                          i <= passwordStrength
                            ? strengthColors[passwordStrength]
                            : "#e5e7eb",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="su-strength-label"
                  style={{ color: strengthColors[passwordStrength] }}
                >
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="su-field">
            <label className="su-label">Confirm Password</label>
            <div className="su-inp-wrap">
              <Lock className="su-ico" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="su-inp"
                required
              />
              {confirmPassword && (
                <div
                  className="su-pw-match"
                  style={{
                    color: confirmPassword === password ? "#22c55e" : "#ef4444",
                  }}
                >
                  {confirmPassword === password ? "✓" : "✗"}
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <label className="su-terms">
            <input type="checkbox" className="su-chk" required />
            <span>
              I agree to the{" "}
              <Link to="/terms" className="su-link">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="su-link">
                Privacy Policy
              </Link>
            </span>
          </label>

          <button type="submit" disabled={isLoading} className="su-btn">
            {isLoading ? (
              <span className="su-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="su-footer">
          Already have an account?{" "}
          <Link to="/login" className="su-link su-link-bold">
            Sign in
          </Link>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .su-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ffffff 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 2rem 1rem;
          position: relative; overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .su-blob {
          position: absolute; border-radius: 50%;
          filter: blur(55px); opacity: 0.3;
          animation: su-float 9s ease-in-out infinite;
        }
        .su-b1 { width: 350px; height: 350px; background: radial-gradient(circle, #86efac, #4ade80); top: -80px; right: -80px; }
        .su-b2 { width: 250px; height: 250px; background: radial-gradient(circle, #d1fae5, #a7f3d0); bottom: -60px; left: -60px; animation-delay: 4s; }
        .su-b3 { width: 180px; height: 180px; background: radial-gradient(circle, #bbf7d0, #6ee7b7); top: 40%; left: 10%; animation-delay: 7s; }
        @keyframes su-float { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-18px) scale(1.04); } }

        .su-leaf { position: absolute; opacity: 0.1; color: #16a34a; }
        .su-leaf svg { width: 70px; height: 70px; }
        .su-lf1 { top: 30px; left: 30px; animation: su-leafspin 14s ease-in-out infinite; }
        .su-lf2 { bottom: 50px; right: 50px; animation: su-leafspin 18s ease-in-out infinite reverse; }
        @keyframes su-leafspin { 0%,100% { transform: rotate(-20deg); } 50% { transform: rotate(20deg) scale(1.1); } }

        .su-card {
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(134,239,172,0.45);
          border-radius: 28px;
          padding: 2.25rem 2rem;
          width: 100%; max-width: 450px;
          box-shadow: 0 20px 60px rgba(22,163,74,0.13), 0 4px 20px rgba(0,0,0,0.06);
          animation: su-enter 0.65s cubic-bezier(0.34,1.56,0.64,1) both;
          position: relative; z-index: 10;
        }
        @keyframes su-enter {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .su-logo-area { text-align: center; margin-bottom: 1.75rem; }
        .su-logo-box {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 18px; margin: 0 auto 0.9rem;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(22,163,74,0.35);
          position: relative; animation: su-logopulse 3s ease-in-out infinite;
        }
        .su-logo-svg { width: 30px; height: 30px; color: white; }
        .su-logo-ring {
          position: absolute; inset: -5px; border-radius: 22px;
          border: 2px solid rgba(34,197,94,0.3);
          animation: su-ring 2s ease-out infinite;
        }
        @keyframes su-logopulse { 0%,100% { box-shadow: 0 8px 24px rgba(22,163,74,0.35); } 50% { box-shadow: 0 12px 32px rgba(22,163,74,0.55); } }
        @keyframes su-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.3); opacity: 0; } }

        .su-brand { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: #14532d; margin: 0; letter-spacing: -0.4px; }
        .su-brand-g { color: #22c55e; }
        .su-tagline { font-size: 0.85rem; color: #6b7280; margin: 0.25rem 0 0; font-weight: 300; }

        .su-error {
          background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
          padding: 0.7rem 1rem; border-radius: 12px; margin-bottom: 1rem;
          font-size: 0.84rem; display: flex; align-items: center; gap: 0.5rem;
          animation: su-shake 0.3s ease;
        }
        @keyframes su-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .su-err-dot { width: 6px; height: 6px; background: #dc2626; border-radius: 50%; flex-shrink: 0; }

        .su-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .su-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .su-label { font-size: 0.81rem; font-weight: 500; color: #374151; }

        .su-inp-wrap { position: relative; display: flex; align-items: center; }
        .su-ico { position: absolute; left: 13px; width: 15px; height: 15px; color: #9ca3af; transition: color 0.2s; pointer-events: none; }
        .su-inp {
          width: 100%; padding: 0.78rem 1rem 0.78rem 2.6rem;
          background: rgba(255,255,255,0.9);
          border: 1.5px solid #d1fae5; border-radius: 12px;
          font-size: 0.875rem; font-family: 'DM Sans', sans-serif; color: #111827;
          outline: none; transition: border-color 0.25s, box-shadow 0.25s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .su-inp-pw { padding-right: 2.8rem; }
        .su-inp:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.15); }
        .su-inp:focus + .su-ico { color: #22c55e; }

        .su-eye {
          position: absolute; right: 12px; background: none; border: none;
          cursor: pointer; color: #9ca3af; display: flex; align-items: center;
          transition: color 0.2s; padding: 0.2rem; border-radius: 6px;
        }
        .su-eye:hover { color: #22c55e; }

        .su-pw-match {
          position: absolute; right: 12px;
          font-size: 1rem; font-weight: 700;
          transition: color 0.25s;
        }

        .su-strength { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.4rem; }
        .su-strength-bars { display: flex; gap: 4px; }
        .su-sbar { height: 3px; width: 40px; border-radius: 4px; }
        .su-strength-label { font-size: 0.75rem; font-weight: 600; transition: color 0.3s; }

        .su-terms {
          display: flex; align-items: flex-start; gap: 0.6rem;
          font-size: 0.82rem; color: #4b5563; cursor: pointer; line-height: 1.4;
        }
        .su-chk { width: 15px; height: 15px; accent-color: #22c55e; margin-top: 2px; flex-shrink: 0; }
        .su-link { color: #16a34a; text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .su-link:hover { color: #15803d; text-decoration: underline; }
        .su-link-bold { font-weight: 600; }

        .su-btn {
          width: 100%; padding: 0.88rem;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white; border: none; border-radius: 14px;
          font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          transition: all 0.25s; box-shadow: 0 6px 20px rgba(22,163,74,0.35);
          position: relative; overflow: hidden;
        }
        .su-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .su-btn:hover::after { opacity: 1; }
        .su-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(22,163,74,0.45); }
        .su-btn:disabled { background: linear-gradient(135deg, #86efac, #4ade80); cursor: not-allowed; transform: none; box-shadow: none; }

        .su-spin {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white; border-radius: 50%;
          animation: su-spinr 0.7s linear infinite; display: inline-block;
        }
        @keyframes su-spinr { to { transform: rotate(360deg); } }

        .su-footer { text-align: center; margin-top: 1.4rem; font-size: 0.84rem; color: #6b7280; }

        @media (max-width: 480px) {
          .su-card { padding: 1.75rem 1.25rem; }
        }
      `}</style>
    </div>
  );
}
