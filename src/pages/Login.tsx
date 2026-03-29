import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight, Leaf } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (email && password.length >= 6) {
      localStorage.setItem("cogniflow_auth", "true");
      localStorage.setItem(
        "cogniflow_user",
        JSON.stringify({ email, name: email.split("@")[0] }),
      );
      const profile = localStorage.getItem("cogniflow_profile");
      const baseline = localStorage.getItem("cogniflow_extended_baseline");

      if (!profile) {
        navigate("/profile-setup");
      } else if (!baseline) {
        navigate("/baseline-collection");
      } else {
        navigate("/app");
      }
    } else {
      setError("Invalid credentials. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="cf-login-root">
      {/* Animated background blobs */}
      <div className="cf-blob cf-blob-1" />
      <div className="cf-blob cf-blob-2" />
      <div className="cf-blob cf-blob-3" />

      {/* Floating leaf accents */}
      <div className="cf-leaf-accent cf-leaf-tl">
        <Leaf />
      </div>
      <div className="cf-leaf-accent cf-leaf-br">
        <Leaf />
      </div>

      <div className="cf-card cf-login-card">
        {/* Logo */}
        <div className="cf-logo-wrap">
          <div className="cf-logo-icon">
            <Brain className="cf-logo-svg" />
            <div className="cf-logo-ring" />
          </div>
          <h1 className="cf-brand">
            Cogno<span className="cf-brand-accent">Flow</span>
          </h1>
          <p className="cf-subtitle">
            Welcome back — pick up where you left off
          </p>
        </div>

        {error && (
          <div className="cf-error-box">
            <span className="cf-error-dot" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="cf-form">
          <div className="cf-field-group">
            <label className="cf-label">Email Address</label>
            <div className="cf-input-wrap">
              <Mail className="cf-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="cf-input"
                required
              />
              <div className="cf-input-focus-bar" />
            </div>
          </div>

          <div className="cf-field-group">
            <label className="cf-label">Password</label>
            <div className="cf-input-wrap">
              <Lock className="cf-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="cf-input cf-input-pw"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cf-eye-btn"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              <div className="cf-input-focus-bar" />
            </div>
          </div>

          <div className="cf-form-row">
            <label className="cf-remember">
              <input type="checkbox" className="cf-checkbox" />
              <span className="cf-remember-label">Remember me</span>
            </label>
            <Link to="/forgot-password" className="cf-link-sm">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={isLoading} className="cf-btn-primary">
            {isLoading ? (
              <span className="cf-spinner" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="cf-footer-text">
          Don't have an account?{" "}
          <Link to="/signup" className="cf-link">
            Sign up free
          </Link>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .cf-login-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #ffffff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        /* Animated background blobs */
        .cf-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.35;
          animation: cf-float 8s ease-in-out infinite;
        }
        .cf-blob-1 {
          width: 380px; height: 380px;
          background: radial-gradient(circle, #86efac, #4ade80);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }
        .cf-blob-2 {
          width: 280px; height: 280px;
          background: radial-gradient(circle, #bbf7d0, #6ee7b7);
          bottom: -80px; right: -80px;
          animation-delay: 3s;
        }
        .cf-blob-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, #d1fae5, #a7f3d0);
          top: 50%; right: 20%;
          animation-delay: 5s;
        }

        @keyframes cf-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        /* Leaf accents */
        .cf-leaf-accent {
          position: absolute;
          opacity: 0.12;
          color: #16a34a;
        }
        .cf-leaf-accent svg { width: 80px; height: 80px; }
        .cf-leaf-tl { top: 40px; left: 40px; transform: rotate(-30deg); animation: cf-leaf-spin 12s linear infinite; }
        .cf-leaf-br { bottom: 60px; right: 60px; transform: rotate(150deg); animation: cf-leaf-spin 15s linear infinite reverse; }

        @keyframes cf-leaf-spin {
          0% { transform: rotate(-30deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.1); }
          100% { transform: rotate(-30deg) scale(1); }
        }

        /* Card */
        .cf-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(134, 239, 172, 0.4);
          border-radius: 28px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 60px rgba(22, 163, 74, 0.12), 0 4px 16px rgba(0,0,0,0.06);
          animation: cf-card-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          position: relative;
          z-index: 10;
        }

        @keyframes cf-card-enter {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Logo */
        .cf-logo-wrap {
          text-align: center;
          margin-bottom: 2rem;
        }
        .cf-logo-icon {
          width: 68px; height: 68px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 20px;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(22, 163, 74, 0.35);
          position: relative;
          animation: cf-logo-pulse 3s ease-in-out infinite;
        }
        .cf-logo-svg { width: 32px; height: 32px; color: white; }
        .cf-logo-ring {
          position: absolute; inset: -4px;
          border-radius: 24px;
          border: 2px solid rgba(34, 197, 94, 0.3);
          animation: cf-ring-expand 2s ease-out infinite;
        }
        @keyframes cf-logo-pulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(22, 163, 74, 0.35); }
          50% { box-shadow: 0 12px 32px rgba(22, 163, 74, 0.55); }
        }
        @keyframes cf-ring-expand {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        .cf-brand {
          font-family: 'Syne', sans-serif;
          font-size: 1.7rem;
          font-weight: 800;
          color: #14532d;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .cf-brand-accent { color: #22c55e; }
        .cf-subtitle {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0.3rem 0 0;
          font-weight: 300;
        }

        /* Error */
        .cf-error-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-bottom: 1.25rem;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: cf-shake 0.3s ease;
        }
        @keyframes cf-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .cf-error-dot {
          width: 6px; height: 6px;
          background: #dc2626;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Form */
        .cf-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .cf-field-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .cf-label {
          font-size: 0.82rem;
          font-weight: 500;
          color: #374151;
          letter-spacing: 0.02em;
        }
        .cf-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .cf-input-icon {
          position: absolute;
          left: 14px;
          width: 16px; height: 16px;
          color: #9ca3af;
          z-index: 1;
          transition: color 0.2s;
        }
        .cf-input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.75rem;
          background: rgba(255,255,255,0.9);
          border: 1.5px solid #d1fae5;
          border-radius: 12px;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          color: #111827;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .cf-input-pw { padding-right: 2.75rem; }
        .cf-input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
        }
        .cf-input:focus + .cf-input-focus-bar { transform: scaleX(1); }
        .cf-input:focus ~ .cf-input-icon { color: #22c55e; }

        .cf-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 0.25rem;
          border-radius: 6px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .cf-eye-btn:hover { color: #22c55e; }

        .cf-form-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cf-remember {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .cf-checkbox {
          width: 15px; height: 15px;
          accent-color: #22c55e;
          cursor: pointer;
        }
        .cf-remember-label {
          font-size: 0.82rem;
          color: #6b7280;
        }
        .cf-link-sm {
          font-size: 0.82rem;
          color: #16a34a;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        .cf-link-sm:hover { color: #15803d; text-decoration: underline; }

        /* Primary button */
        .cf-btn-primary {
          width: 100%;
          padding: 0.9rem 1.5rem;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-family: 'Syne', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.25s;
          box-shadow: 0 6px 20px rgba(22, 163, 74, 0.35);
          letter-spacing: 0.02em;
          position: relative;
          overflow: hidden;
        }
        .cf-btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .cf-btn-primary:hover::after { opacity: 1; }
        .cf-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(22, 163, 74, 0.45);
        }
        .cf-btn-primary:active { transform: translateY(0); }
        .cf-btn-primary:disabled {
          background: linear-gradient(135deg, #86efac, #4ade80);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Spinner */
        .cf-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: cf-spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes cf-spin { to { transform: rotate(360deg); } }

        /* Footer */
        .cf-footer-text {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.85rem;
          color: #6b7280;
        }
        .cf-link {
          color: #16a34a;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }
        .cf-link:hover { color: #15803d; text-decoration: underline; }

        @media (max-width: 480px) {
          .cf-card { padding: 2rem 1.5rem; }
        }
      `}</style>
    </div>
  );
}
