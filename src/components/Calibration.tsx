import { useCalibration } from "../hooks/useBehaviorTracker";
import { Target, Keyboard, Zap, CheckCircle2 } from "lucide-react";
import type { BaselineMetrics } from "../types";

interface CalibrationProps {
  onComplete: (baseline: BaselineMetrics) => void;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;600;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

.cal {
  --g1:#052e16; --g2:#14532d; --g3:#166534; --g4:#15803d; --g5:#16a34a;
  --g6:#22c55e; --g7:#4ade80; --g8:#86efac; --g9:#bbf7d0; --g10:#dcfce7;
  --g11:#f0fdf4; --g12:#f7fef9;
  --border:#d1fae5; --border2:#6ee7b7;
  --ink:#052e16; --ink2:#166534; --ink3:#4d8c6a;
  font-family:'Instrument Sans',sans-serif;
  min-height:100vh;
  background: var(--g12);
  background-image:
    radial-gradient(ellipse 60% 45% at 85% 5%,  rgba(74,222,128,.2)  0%, transparent 65%),
    radial-gradient(ellipse 40% 35% at 5%  92%,  rgba(22,163,74,.15)  0%, transparent 60%),
    radial-gradient(ellipse 30% 25% at 50% 50%,  rgba(187,247,208,.3) 0%, transparent 55%);
  display:flex; align-items:center; justify-content:center; padding:2rem;
  color:var(--ink);
}

/* Floating decorative circles */
.cal-deco {
  position:fixed; pointer-events:none; z-index:0;
}
.cal-deco-c1 {
  top:-80px; right:-80px; width:320px; height:320px; border-radius:50%;
  background: radial-gradient(circle, rgba(34,197,94,.12) 0%, transparent 70%);
  animation: calFloat 6s ease-in-out infinite;
}
.cal-deco-c2 {
  bottom:-60px; left:-60px; width:240px; height:240px; border-radius:50%;
  background: radial-gradient(circle, rgba(74,222,128,.10) 0%, transparent 70%);
  animation: calFloat 8s ease-in-out infinite reverse;
}

/* Card */
.cal-card {
  position:relative; z-index:1;
  background:#fff;
  border:1.5px solid var(--border);
  border-radius:28px;
  padding:3rem 3.5rem;
  max-width:640px; width:100%;
  box-shadow: 0 8px 40px rgba(22,163,74,.12), 0 2px 8px rgba(0,0,0,.04);
  animation: calFadeUp .55s cubic-bezier(.22,1,.36,1) both;
}
.cal-card::before {
  content:''; position:absolute; top:0; left:10%; right:10%; height:3px;
  background:linear-gradient(90deg,var(--g4),var(--g7));
  border-radius:0 0 6px 6px;
}

/* Header */
.cal-icon-wrap {
  width:72px; height:72px; border-radius:22px; margin:0 auto 1.75rem;
  background:linear-gradient(145deg,var(--g4),var(--g6));
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 8px 28px rgba(22,163,74,.35);
  animation: calFloat 4s ease-in-out infinite;
}
.cal-icon-wrap svg { width:32px; height:32px; color:#fff; }

.cal-title {
  font-family:'Cabinet Grotesk',sans-serif;
  font-size:2rem; font-weight:800; letter-spacing:-.03em;
  color:var(--ink); text-align:center; margin-bottom:.65rem;
  background:linear-gradient(135deg,var(--g1) 20%,var(--g5) 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}

.cal-sub {
  font-size:.9rem; color:var(--ink3); text-align:center; line-height:1.65;
  margin-bottom:2.25rem; max-width:420px; margin-left:auto; margin-right:auto;
}

/* Steps */
.cal-steps { display:flex; flex-direction:column; gap:.7rem; margin-bottom:2.5rem; }
.cal-step {
  display:flex; align-items:flex-start; gap:.85rem;
  padding:.85rem 1.1rem; border-radius:14px;
  background:var(--g11); border:1px solid var(--border);
  animation: calSlide .4s cubic-bezier(.22,1,.36,1) both;
  transition: background .2s, border-color .2s, transform .2s;
}
.cal-step:hover { background:var(--g10); border-color:var(--border2); transform:translateX(4px); }
.cal-step:nth-child(1){animation-delay:.1s}
.cal-step:nth-child(2){animation-delay:.18s}
.cal-step:nth-child(3){animation-delay:.26s}

.cal-step-num {
  width:26px; height:26px; border-radius:8px; flex-shrink:0;
  background:linear-gradient(135deg,var(--g4),var(--g6));
  color:#fff; font-family:'Cabinet Grotesk',sans-serif;
  font-size:.72rem; font-weight:800; display:flex; align-items:center; justify-content:center;
  box-shadow:0 2px 8px rgba(22,163,74,.3);
}
.cal-step-text { font-size:.83rem; color:var(--ink2); line-height:1.5; padding-top:3px; font-weight:500; }

/* CTA Button */
.cal-btn {
  width:100%; padding:1.05rem; border-radius:16px; border:none; cursor:pointer;
  background:linear-gradient(135deg,var(--g3),var(--g5));
  color:#fff; font-family:'Cabinet Grotesk',sans-serif;
  font-size:1rem; font-weight:800; letter-spacing:.02em;
  display:flex; align-items:center; justify-content:center; gap:.6rem;
  box-shadow:0 6px 24px rgba(22,163,74,.35);
  transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s;
  position:relative; overflow:hidden;
}
.cal-btn::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,.15) 0%,transparent 60%);
  border-radius:16px;
}
.cal-btn:hover { transform:translateY(-3px); box-shadow:0 12px 36px rgba(22,163,74,.45); }
.cal-btn:active { transform:translateY(0); }
.cal-btn svg { width:18px; height:18px; }

/* ─── Typing screen ─── */
.cal-typing-card {
  position:relative; z-index:1;
  background:#fff; border:1.5px solid var(--border);
  border-radius:28px; padding:2.5rem;
  max-width:760px; width:100%;
  box-shadow:0 8px 40px rgba(22,163,74,.12), 0 2px 8px rgba(0,0,0,.04);
  animation:calFadeUp .5s cubic-bezier(.22,1,.36,1) both;
}
.cal-typing-card::before {
  content:''; position:absolute; top:0; left:10%; right:10%; height:3px;
  background:linear-gradient(90deg,var(--g4),var(--g7));
  border-radius:0 0 6px 6px;
}

.cal-typing-header {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:1.75rem;
}
.cal-typing-title {
  font-family:'Cabinet Grotesk',sans-serif;
  font-size:1.35rem; font-weight:800; letter-spacing:-.02em; color:var(--ink);
  display:flex; align-items:center; gap:.6rem;
}
.cal-typing-title svg { color:var(--g5); width:20px; height:20px; }

.cal-pct-badge {
  font-family:'Cabinet Grotesk',sans-serif; font-size:.8rem; font-weight:700;
  color:var(--g4); background:var(--g11); border:1px solid var(--border2);
  padding:4px 12px; border-radius:99px;
}

/* Progress bar */
.cal-bar-track {
  width:100%; height:8px; background:var(--g10);
  border-radius:99px; overflow:hidden; margin-bottom:1.75rem;
  border:1px solid var(--border);
}
.cal-bar-fill {
  height:100%; border-radius:99px;
  background:linear-gradient(90deg,var(--g4),var(--g6));
  transition:width .4s cubic-bezier(.22,1,.36,1);
  box-shadow:0 0 8px rgba(34,197,94,.5);
  position:relative;
}
.cal-bar-fill::after {
  content:''; position:absolute; right:0; top:-2px; bottom:-2px; width:6px;
  background:#fff; border-radius:3px; opacity:.7;
}

/* Target text */
.cal-target-box {
  background:var(--g11); border:1.5px solid var(--border);
  border-radius:18px; padding:1.5rem; margin-bottom:1.25rem;
  position:relative; overflow:hidden;
}
.cal-target-box::before {
  content:'TARGET'; position:absolute; top:10px; right:14px;
  font-family:'Cabinet Grotesk',sans-serif; font-size:.55rem; font-weight:800;
  letter-spacing:.2em; color:var(--border2); opacity:.7;
}
.cal-target-text {
  font-family:'Instrument Sans',sans-serif;
  font-size:1.05rem; line-height:1.85; font-variant-ligatures:none;
}
.cal-char-done  { color:#15803d; }
.cal-char-error { color:#dc2626; background:#fef2f2; border-radius:3px; }
.cal-char-ahead { color:#9ca3af; }

/* Textarea */
.cal-input {
  width:100%; height:120px; padding:1rem 1.1rem;
  border:2px solid var(--border);
  border-radius:16px; resize:none;
  font-family:'Instrument Sans',sans-serif; font-size:1rem; line-height:1.6;
  color:var(--ink); background:#fff;
  transition:border-color .2s, box-shadow .2s;
  outline:none;
}
.cal-input:focus {
  border-color:var(--g5);
  box-shadow:0 0 0 3px rgba(22,163,74,.15);
}
.cal-input::placeholder { color:#9ca3af; }

@keyframes calFadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
@keyframes calSlide  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
@keyframes calFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
`;

export function Calibration({ onComplete }: CalibrationProps) {
  const {
    isActive,
    progress,
    text,
    targetText,
    metrics,
    startCalibration,
    handleInput,
  } = useCalibration();

  if (metrics) {
    onComplete(metrics);
    return null;
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cal">
        {/* Decorative blobs */}
        <div className="cal-deco">
          <div className="cal-deco-c1" />
        </div>
        <div className="cal-deco">
          <div className="cal-deco-c2" />
        </div>

        {!isActive ? (
          /* ── Intro screen ── */
          <div className="cal-card">
            <div className="cal-icon-wrap">
              <Target />
            </div>
            <h2 className="cal-title">Baseline Calibration</h2>
            <p className="cal-sub">
              Let's establish your natural typing rhythm. We'll use this to
              detect when you're focused, confused, or tired — in real time.
            </p>

            <div className="cal-steps">
              {[
                {
                  n: 1,
                  icon: <Keyboard size={14} />,
                  text: "Type the displayed text as accurately as possible",
                },
                {
                  n: 2,
                  icon: <Zap size={14} />,
                  text: "Type at your natural, comfortable pace — no rushing",
                },
                {
                  n: 3,
                  icon: <CheckCircle2 size={14} />,
                  text: "Takes about 30–60 seconds to complete",
                },
              ].map(({ n, text: t }) => (
                <div className="cal-step" key={n}>
                  <div className="cal-step-num">{n}</div>
                  <p className="cal-step-text">{t}</p>
                </div>
              ))}
            </div>

            <button className="cal-btn" onClick={startCalibration}>
              <Zap />
              Start Calibration
            </button>
          </div>
        ) : (
          /* ── Typing screen ── */
          <div className="cal-typing-card">
            <div className="cal-typing-header">
              <span className="cal-typing-title">
                <Keyboard /> Type the text below
              </span>
              <span className="cal-pct-badge">
                {Math.round(progress)}% complete
              </span>
            </div>

            <div className="cal-bar-track">
              <div className="cal-bar-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="cal-target-box">
              <p className="cal-target-text">
                {targetText.split("").map((char, i) => {
                  const isTyped = i < text.length;
                  const isCorrect = text[i] === char;
                  return (
                    <span
                      key={i}
                      className={
                        isTyped
                          ? isCorrect
                            ? "cal-char-done"
                            : "cal-char-error"
                          : "cal-char-ahead"
                      }
                    >
                      {char}
                    </span>
                  );
                })}
              </p>
            </div>

            <textarea
              className="cal-input"
              value={text}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="Start typing here…"
              autoFocus
            />
          </div>
        )}
      </div>
    </>
  );
}
