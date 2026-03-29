import { useEffect, useState } from "react";
import { X, Shield, Volume2, Zap } from "lucide-react";

interface FocusModeBlockerProps {
  enabled: boolean;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@500;600;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

/* ── Banner ── */
.fmb-banner {
  position:fixed; top:0; left:0; right:0; z-index:50;
  background:linear-gradient(90deg,#14532d 0%,#16a34a 55%,#22c55e 100%);
  color:#fff; padding:.9rem 1.6rem;
  display:flex; align-items:center; justify-content:space-between;
  animation:fmbDown .42s cubic-bezier(.22,1,.36,1) both;
  box-shadow:0 4px 28px rgba(22,163,74,.4);
  font-family:'Instrument Sans',sans-serif;
  overflow:hidden;
}
/* Sheen sweep */
.fmb-banner::before {
  content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);
  animation:fmbSheen 3s ease-in-out 1s infinite;
}
.fmb-banner::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
  background:rgba(255,255,255,.2);
}

.fmb-banner-l { display:flex; align-items:center; gap:.9rem; z-index:1; }
.fmb-banner-icon {
  width:38px; height:38px; border-radius:12px;
  background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.22);
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.fmb-banner-icon svg { width:18px; height:18px; }
.fmb-banner-title {
  font-family:'Cabinet Grotesk',sans-serif;
  font-size:.95rem; font-weight:800; letter-spacing:-.01em; line-height:1;
}
.fmb-banner-sub {
  font-size:.7rem; opacity:.82; margin-top:3px; font-weight:500; line-height:1;
}
.fmb-banner-close {
  background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.22);
  border-radius:9px; cursor:pointer; padding:7px;
  display:flex; align-items:center; justify-content:center;
  transition:background .15s; flex-shrink:0; color:#fff; z-index:1;
}
.fmb-banner-close:hover { background:rgba(255,255,255,.3); }
.fmb-banner-close svg { width:14px; height:14px; }

/* ── Floating pill ── */
.fmb-pill {
  position:fixed; top:1.1rem; left:50%; transform:translateX(-50%);
  z-index:40; background:#fff; border:1.5px solid #6ee7b7; border-radius:99px;
  padding:6px 16px 6px 8px; display:flex; align-items:center; gap:9px;
  box-shadow:0 6px 28px rgba(22,163,74,.22), 0 2px 6px rgba(0,0,0,.06);
  animation:fmbPill .4s cubic-bezier(.22,1,.36,1) both;
  font-family:'Instrument Sans',sans-serif; white-space:nowrap;
  transition:box-shadow .2s, transform .2s;
}
.fmb-pill:hover {
  box-shadow:0 10px 36px rgba(22,163,74,.3);
  transform:translateX(-50%) translateY(-2px);
}
.fmb-pill-icon {
  width:30px; height:30px; border-radius:99px;
  background:linear-gradient(135deg,#15803d,#22c55e);
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  box-shadow:0 2px 8px rgba(22,163,74,.3);
}
.fmb-pill-icon svg { width:13px; height:13px; color:#fff; }
.fmb-pill-text {
  font-family:'Cabinet Grotesk',sans-serif;
  font-size:.72rem; font-weight:800; color:#166534; letter-spacing:.08em; text-transform:uppercase;
}
.fmb-pill-dot {
  width:7px; height:7px; border-radius:50%; background:#22c55e; flex-shrink:0;
  animation:fmbPulse 1.5s ease-in-out infinite; margin-left:2px;
}

/* ── Badge (bottom right) ── */
.fmb-badge {
  position:fixed; bottom:1.5rem; right:1.5rem; z-index:40;
  background:#fff; border:1.5px solid #d1fae5; border-radius:20px;
  padding:1rem 1.15rem; max-width:240px;
  box-shadow:0 6px 28px rgba(22,163,74,.15), 0 2px 6px rgba(0,0,0,.05);
  animation:fmbBadge .5s cubic-bezier(.22,1,.36,1) .12s both;
  font-family:'Instrument Sans',sans-serif;
  overflow:hidden;
}
.fmb-badge::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  background:linear-gradient(90deg,#16a34a,#4ade80);
}
.fmb-badge-head { display:flex; align-items:center; gap:7px; margin-bottom:6px; }
.fmb-badge-head svg { width:14px; height:14px; color:#16a34a; flex-shrink:0; }
.fmb-badge-head-text {
  font-family:'Cabinet Grotesk',sans-serif;
  font-size:.78rem; font-weight:800; letter-spacing:-.01em; color:#052e16;
}
.fmb-badge-desc { font-size:.68rem; color:#4d8c6a; line-height:1.55; }
.fmb-badge-pill {
  display:inline-flex; align-items:center; gap:4px; margin-top:8px;
  background:#f0fdf4; border:1px solid #bbf7d0;
  border-radius:99px; padding:3px 10px;
  font-size:.61rem; font-weight:700; color:#16a34a;
}
.fmb-badge-pill svg { width:9px; height:9px; }

/* ── Blocked-count mini toast (new addition) ── */
.fmb-count-toast {
  position:fixed; bottom:1.5rem; left:50%; transform:translateX(-50%);
  z-index:40; background:#fff;
  border:1.5px solid #d1fae5; border-radius:99px;
  padding:6px 18px 6px 10px;
  display:flex; align-items:center; gap:8px;
  box-shadow:0 4px 20px rgba(22,163,74,.15);
  animation:fmbBadge .5s cubic-bezier(.22,1,.36,1) .25s both;
  font-family:'Instrument Sans',sans-serif; font-size:.7rem;
  color:#166534; font-weight:600; white-space:nowrap;
}
.fmb-count-toast .fmb-pill-dot { margin-left:0; }

@keyframes fmbDown  { from{opacity:0;transform:translateY(-100%)} to{opacity:1;transform:none} }
@keyframes fmbPill  { from{opacity:0;transform:translateX(-50%) scale(.88)} to{opacity:1;transform:translateX(-50%) scale(1)} }
@keyframes fmbBadge { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
@keyframes fmbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.7)} }
@keyframes fmbSheen { from{left:-100%} to{left:160%} }
`;

export function FocusModeBlocker({ enabled }: FocusModeBlockerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    if (enabled) {
      setShowBanner(true);
      const t = setTimeout(() => setShowBanner(false), 5000);
      // Simulate blocked notifications count growing
      const iv = setInterval(() => setBlockedCount((c) => c + 1), 12000);
      return () => {
        clearTimeout(t);
        clearInterval(iv);
      };
    } else {
      setShowBanner(false);
      setBlockedCount(0);
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <style>{CSS}</style>

      {/* Full-width banner (first 5s) */}
      {showBanner && (
        <div className="fmb-banner">
          <div className="fmb-banner-l">
            <div className="fmb-banner-icon">
              <Shield />
            </div>
            <div>
              <div className="fmb-banner-title">Focus Mode Active</div>
              <div className="fmb-banner-sub">
                Notifications paused — stay in the zone
              </div>
            </div>
          </div>
          <button
            className="fmb-banner-close"
            onClick={() => setShowBanner(false)}
            type="button"
          >
            <X />
          </button>
        </div>
      )}

      {/* Floating pill after banner fades */}
      {!showBanner && (
        <div className="fmb-pill">
          <div className="fmb-pill-icon">
            <Zap />
          </div>
          <span className="fmb-pill-text">Focus Mode</span>
          <span className="fmb-pill-dot" />
        </div>
      )}

      {/* Bottom-right badge */}
      <div className="fmb-badge">
        <div className="fmb-badge-head">
          <Volume2 />
          <span className="fmb-badge-head-text">Notifications Paused</span>
        </div>
        <p className="fmb-badge-desc">
          External notifications are blocked while you're focused.
        </p>
        <div className="fmb-badge-pill">
          <Shield />
          Focus mode on
        </div>
      </div>

      {/* Bottom center — blocked count (appears when > 0) */}
      {blockedCount > 0 && (
        <div className="fmb-count-toast">
          <span className="fmb-pill-dot" />
          {blockedCount} notification{blockedCount !== 1 ? "s" : ""} blocked
        </div>
      )}
    </>
  );
}
