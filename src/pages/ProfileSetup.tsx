import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  User,
  Phone,
  ChevronRight,
  ArrowLeft,
  Leaf,
  Sparkles,
} from "lucide-react";

interface UserProfile {
  name: string;
  gender: string;
  phone: string;
  email: string;
  isProfileComplete: boolean;
}

export function ProfileSetup() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    gender: "",
    phone: "",
    email: "",
    isProfileComplete: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("cogniflow_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setProfile((prev) => ({
        ...prev,
        email: user.email || "",
        name: user.name || "",
      }));
    }
    const existingProfile = localStorage.getItem("cogniflow_profile");
    if (existingProfile) {
      const parsed = JSON.parse(existingProfile);
      if (parsed.isProfileComplete) navigate("/baseline-collection");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const updatedProfile = { ...profile, isProfileComplete: true };
    localStorage.setItem("cogniflow_profile", JSON.stringify(updatedProfile));
    const userData = JSON.parse(localStorage.getItem("cogniflow_user") || "{}");
    userData.name = profile.name;
    userData.profileComplete = true;
    localStorage.setItem("cogniflow_user", JSON.stringify(userData));
    setIsSaving(false);
    navigate("/baseline-collection");
  };

  const isFormValid = profile.name && profile.gender && profile.phone;

  const steps = [
    { num: 1, label: "Profile", active: true },
    { num: 2, label: "Baseline", active: false },
    { num: 3, label: "App", active: false },
  ];

  return (
    <div className="ps-root">
      <div className="ps-blob ps-b1" />
      <div className="ps-blob ps-b2" />
      <div className="ps-blob ps-b3" />
      <div className="ps-leaf ps-l1">
        <Leaf />
      </div>
      <div className="ps-leaf ps-l2">
        <Leaf />
      </div>

      <div className="ps-card">
        {/* Top accent line */}
        <div className="ps-top-accent" />

        {/* Header */}
        <div className="ps-header">
          <div className="ps-icon-box">
            <User className="ps-icon-svg" />
            <div className="ps-icon-ring" />
          </div>
          <h1 className="ps-title">Complete Your Profile</h1>
          <p className="ps-subtitle">
            Tell us a bit about yourself to personalise your experience
          </p>
        </div>

        {/* Progress stepper */}
        <div className="ps-stepper">
          {steps.map((s, i) => (
            <div key={s.num} className="ps-step-wrap">
              <div
                className={`ps-step-dot ${s.active ? "ps-dot-active" : "ps-dot-inactive"}`}
              >
                {s.active ? <Sparkles className="w-3 h-3" /> : s.num}
              </div>
              <span
                className={`ps-step-label ${s.active ? "ps-slabel-active" : "ps-slabel-inactive"}`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`ps-step-line ${i === 0 && s.active ? "ps-line-partial" : "ps-line-empty"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="ps-form">
          {/* Name */}
          <div className="ps-field">
            <label className="ps-label">
              Full Name <span className="ps-req">*</span>
            </label>
            <div className="ps-inp-wrap">
              <User className="ps-ico" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                placeholder="Enter your full name"
                className="ps-inp"
                required
              />
            </div>
          </div>

          {/* Gender */}
          <div className="ps-field">
            <label className="ps-label">
              Gender <span className="ps-req">*</span>
            </label>
            <div className="ps-gender-row">
              {["male", "female"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setProfile({ ...profile, gender: g })}
                  className={`ps-gender-btn ${profile.gender === g ? "ps-gender-active" : "ps-gender-idle"}`}
                >
                  <span className="ps-gender-emoji">
                    {g === "male" ? "👨" : "👩"}
                  </span>
                  <span className="ps-gender-text">
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div className="ps-field">
            <label className="ps-label">
              Phone Number <span className="ps-req">*</span>
            </label>
            <div className="ps-inp-wrap">
              <Phone className="ps-ico" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder="Enter your phone number"
                className="ps-inp"
                required
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="ps-field">
            <label className="ps-label">
              Email
              <span className="ps-auto-badge">Auto-fetched</span>
            </label>
            <div className="ps-inp-wrap">
              <Mail className="ps-ico ps-ico-muted" />
              <input
                type="email"
                value={profile.email}
                readOnly
                className="ps-inp ps-inp-ro"
              />
            </div>
            <p className="ps-hint">Automatically pulled from your account</p>
          </div>

          {/* Buttons */}
          <div className="ps-actions">
            <Link to="/login" className="ps-back-btn">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="ps-submit-btn"
            >
              {isSaving ? (
                <span className="ps-spin" />
              ) : (
                <>
                  Continue to Baseline
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .ps-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7 50%, #ffffff);
          display: flex; align-items: center; justify-content: center;
          padding: 2rem 1rem;
          position: relative; overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .ps-blob { position: absolute; border-radius: 50%; filter: blur(55px); opacity: 0.28; animation: ps-flt 10s ease-in-out infinite; }
        .ps-b1 { width: 340px; height: 340px; background: radial-gradient(circle, #86efac, #4ade80); top: -100px; left: -80px; }
        .ps-b2 { width: 260px; height: 260px; background: radial-gradient(circle, #bbf7d0, #6ee7b7); bottom: -60px; right: -60px; animation-delay: 3.5s; }
        .ps-b3 { width: 160px; height: 160px; background: radial-gradient(circle, #d1fae5, #a7f3d0); top: 30%; right: 15%; animation-delay: 6s; }
        @keyframes ps-flt { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-16px) scale(1.04); } }

        .ps-leaf { position: absolute; opacity: 0.09; color: #16a34a; }
        .ps-leaf svg { width: 65px; height: 65px; }
        .ps-l1 { top: 25px; right: 40px; animation: ps-lspin 13s ease-in-out infinite; }
        .ps-l2 { bottom: 40px; left: 40px; animation: ps-lspin 17s ease-in-out infinite reverse; }
        @keyframes ps-lspin { 0%,100% { transform: rotate(-25deg); } 50% { transform: rotate(15deg) scale(1.08); } }

        .ps-card {
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(134,239,172,0.45);
          border-radius: 28px; padding: 0 0 2.25rem;
          width: 100%; max-width: 480px;
          box-shadow: 0 24px 64px rgba(22,163,74,0.13), 0 4px 20px rgba(0,0,0,0.06);
          animation: ps-enter 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
          position: relative; z-index: 10; overflow: hidden;
        }
        @keyframes ps-enter { from { opacity: 0; transform: translateY(28px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .ps-top-accent {
          height: 4px;
          background: linear-gradient(90deg, #22c55e, #4ade80, #86efac, #4ade80, #22c55e);
          background-size: 200% 100%;
          animation: ps-shimmer 3s linear infinite;
        }
        @keyframes ps-shimmer { 0% { background-position: 0% 0; } 100% { background-position: 200% 0; } }

        .ps-header { text-align: center; padding: 2rem 2rem 0; }
        .ps-icon-box {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 18px; margin: 0 auto 1rem;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(22,163,74,0.35);
          position: relative; animation: ps-iconpulse 3.5s ease-in-out infinite;
        }
        .ps-icon-svg { width: 28px; height: 28px; color: white; }
        .ps-icon-ring { position: absolute; inset: -5px; border-radius: 22px; border: 2px solid rgba(34,197,94,0.3); animation: ps-ring 2.2s ease-out infinite; }
        @keyframes ps-iconpulse { 0%,100% { box-shadow: 0 8px 24px rgba(22,163,74,0.35); } 50% { box-shadow: 0 12px 32px rgba(22,163,74,0.55); } }
        @keyframes ps-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.35); opacity: 0; } }

        .ps-title { font-family: 'Syne', sans-serif; font-size: 1.55rem; font-weight: 800; color: #14532d; margin: 0; }
        .ps-subtitle { font-size: 0.84rem; color: #6b7280; margin: 0.3rem 0 0; font-weight: 300; }

        /* Stepper */
        .ps-stepper {
          display: flex; align-items: center; justify-content: center;
          gap: 0; padding: 1.5rem 2rem 0; position: relative;
        }
        .ps-step-wrap { display: flex; align-items: center; gap: 0; }
        .ps-step-dot {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
          transition: all 0.3s;
        }
        .ps-dot-active {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white; box-shadow: 0 4px 12px rgba(22,163,74,0.4);
        }
        .ps-dot-inactive { background: #f3f4f6; color: #9ca3af; }
        .ps-step-label { font-size: 0.75rem; font-weight: 500; margin-left: 0.4rem; margin-right: 0.4rem; white-space: nowrap; }
        .ps-slabel-active { color: #16a34a; }
        .ps-slabel-inactive { color: #9ca3af; }
        .ps-step-line { height: 2px; width: 36px; border-radius: 2px; }
        .ps-line-partial { background: linear-gradient(90deg, #22c55e 50%, #e5e7eb 50%); }
        .ps-line-empty { background: #e5e7eb; }

        /* Form */
        .ps-form { display: flex; flex-direction: column; gap: 1.1rem; padding: 1.5rem 2rem 0; }
        .ps-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .ps-label {
          font-size: 0.81rem; font-weight: 500; color: #374151;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .ps-req { color: #22c55e; }
        .ps-auto-badge {
          font-size: 0.7rem; background: #dcfce7; color: #16a34a;
          padding: 0.1rem 0.5rem; border-radius: 20px; font-weight: 600;
        }

        .ps-inp-wrap { position: relative; display: flex; align-items: center; }
        .ps-ico { position: absolute; left: 13px; width: 15px; height: 15px; color: #9ca3af; pointer-events: none; transition: color 0.2s; }
        .ps-ico-muted { color: #d1d5db; }
        .ps-inp {
          width: 100%; padding: 0.78rem 1rem 0.78rem 2.6rem;
          background: rgba(255,255,255,0.9);
          border: 1.5px solid #d1fae5; border-radius: 12px;
          font-size: 0.875rem; font-family: 'DM Sans', sans-serif; color: #111827;
          outline: none; transition: border-color 0.25s, box-shadow 0.25s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .ps-inp:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.15); }
        .ps-inp-ro { background: #f9fafb; color: #6b7280; cursor: not-allowed; border-color: #f3f4f6; }
        .ps-hint { font-size: 0.74rem; color: #9ca3af; margin: 0.15rem 0 0; }

        /* Gender */
        .ps-gender-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .ps-gender-btn {
          padding: 0.85rem;
          border-radius: 14px; border: 1.5px solid;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem; font-weight: 500;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          transition: all 0.22s;
        }
        .ps-gender-active { border-color: #22c55e; background: linear-gradient(135deg, #f0fdf4, #dcfce7); color: #15803d; box-shadow: 0 4px 12px rgba(22,163,74,0.2); }
        .ps-gender-idle { border-color: #d1fae5; background: rgba(255,255,255,0.9); color: #6b7280; }
        .ps-gender-idle:hover { border-color: #86efac; background: #f0fdf4; }
        .ps-gender-emoji { font-size: 1.1rem; }
        .ps-gender-text { font-weight: 600; }

        /* Actions */
        .ps-actions { display: flex; gap: 0.75rem; padding-top: 0.5rem; }
        .ps-back-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          padding: 0.85rem;
          background: rgba(255,255,255,0.9);
          border: 1.5px solid #d1fae5; border-radius: 14px;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
          color: #6b7280; text-decoration: none; cursor: pointer;
          transition: all 0.22s;
        }
        .ps-back-btn:hover { border-color: #86efac; background: #f0fdf4; color: #374151; }

        .ps-submit-btn {
          flex: 2; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          padding: 0.85rem;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none; border-radius: 14px;
          font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700;
          color: white; cursor: pointer;
          transition: all 0.25s; box-shadow: 0 6px 20px rgba(22,163,74,0.35);
          position: relative; overflow: hidden;
        }
        .ps-submit-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent); opacity: 0; transition: opacity 0.2s; }
        .ps-submit-btn:hover::after { opacity: 1; }
        .ps-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(22,163,74,0.45); }
        .ps-submit-btn:disabled { background: linear-gradient(135deg, #86efac, #4ade80); cursor: not-allowed; transform: none; box-shadow: none; }

        .ps-spin { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: ps-spinr 0.7s linear infinite; display: inline-block; }
        @keyframes ps-spinr { to { transform: rotate(360deg); } }

        @media (max-width: 480px) {
          .ps-form, .ps-header, .ps-stepper { padding-left: 1.25rem; padding-right: 1.25rem; }
          .ps-step-line { width: 22px; }
        }
      `}</style>
    </div>
  );
}
