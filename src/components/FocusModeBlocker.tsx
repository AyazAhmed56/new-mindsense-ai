import { useEffect, useState } from 'react';
import { X, Shield, Volume2 } from 'lucide-react';

interface FocusModeBlockerProps {
  enabled: boolean;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Familjen+Grotesk:wght@600;700&display=swap');

/* ── Banner ── */
.fb-banner {
  position: fixed; top: 0; left: 0; right: 0; z-index: 40;
  background: linear-gradient(90deg, #14532d 0%, #16a34a 55%, #22c55e 100%);
  color: #fff;
  padding: .8rem 1.5rem;
  display: flex; align-items: center; justify-content: space-between;
  animation: fbDown .45s cubic-bezier(.22,1,.36,1) both;
  box-shadow: 0 3px 24px rgba(22,163,74,.35);
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.fb-banner::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
  background: rgba(255,255,255,.2);
}

.fb-bl { display: flex; align-items: center; gap: .8rem; }
.fb-bl svg { width: 20px; height: 20px; flex-shrink: 0; }

.fb-bt {
  font-family: 'Familjen Grotesk', sans-serif;
  font-size: .92rem; font-weight: 700; letter-spacing: -.01em;
}
.fb-bs { font-size: .72rem; opacity: .82; margin-top: 2px; font-weight: 500; }

.fb-bclose {
  background: rgba(255,255,255,.18); border: none; border-radius: 8px;
  cursor: pointer; padding: 6px; color: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.fb-bclose:hover { background: rgba(255,255,255,.3); }
.fb-bclose svg { width: 15px; height: 15px; }

/* ── Pill ── */
.fb-pill {
  position: fixed; top: 1rem; left: 50%; transform: translateX(-50%);
  z-index: 40;
  background: #ffffff;
  border: 1.5px solid #6ee7b7;
  border-radius: 99px; padding: 6px 16px 6px 8px;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 20px rgba(22,163,74,.2);
  animation: fbPill .4s cubic-bezier(.22,1,.36,1) both;
  font-family: 'Plus Jakarta Sans', sans-serif;
  white-space: nowrap;
}
.fb-picon {
  width: 28px; height: 28px; border-radius: 50%;
  background: #f0fdf4;
  display: flex; align-items: center; justify-content: center; color: #16a34a;
}
.fb-picon svg { width: 13px; height: 13px; }
.fb-ptxt { font-size: .75rem; font-weight: 700; color: #166534; letter-spacing: .02em; }
.fb-pdot {
  width: 7px; height: 7px; border-radius: 50%; background: #22c55e;
  animation: fbPulse 1.5s ease-in-out infinite; margin-left: 2px;
}

/* ── Badge ── */
.fb-badge {
  position: fixed; bottom: 1.25rem; right: 1.25rem; z-index: 30;
  background: #ffffff;
  border: 1.5px solid #d1fae5;
  border-radius: 16px; padding: .85rem 1rem; max-width: 230px;
  box-shadow: 0 4px 20px rgba(22,163,74,.12);
  animation: fbBadge .5s cubic-bezier(.22,1,.36,1) .15s both;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: fixed;
}
.fb-badge::before {
  content: ''; position: absolute; top: 0; left: 1rem; right: 1rem; height: 2px;
  background: linear-gradient(90deg, #16a34a, #4ade80);
  border-radius: 0 0 4px 4px;
}
.fb-bh { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
.fb-bh svg { width: 13px; height: 13px; color: #16a34a; }
.fb-bht {
  font-family: 'Familjen Grotesk', sans-serif;
  font-size: .78rem; font-weight: 700; letter-spacing: -.01em; color: #052e16;
}
.fb-bdesc { font-size: .68rem; color: #4d8c6a; line-height: 1.5; }

/* ── Blocked count badge ── */
.fb-count {
  display: inline-flex; align-items: center; gap: 4px;
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 99px; padding: 2px 8px;
  font-size: .62rem; font-weight: 700; color: #16a34a;
  margin-top: 6px;
}

@keyframes fbDown  { from{opacity:0;transform:translateY(-100%)} to{opacity:1;transform:none} }
@keyframes fbPill  { from{opacity:0;transform:translateX(-50%) scale(.88)} to{opacity:1;transform:translateX(-50%) scale(1)} }
@keyframes fbBadge { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
@keyframes fbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.7)} }
`;

export function FocusModeBlocker({ enabled }: FocusModeBlockerProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (enabled) {
      setShowBanner(true);
      const t = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(t);
    } else {
      setShowBanner(false);
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <style>{CSS}</style>

      {/* Full banner */}
      {showBanner && (
        <div className="fb-banner">
          <div className="fb-bl">
            <Shield />
            <div>
              <div className="fb-bt">Focus Mode Active</div>
              <div className="fb-bs">Notifications paused — stay in the zone</div>
            </div>
          </div>
          <button className="fb-bclose" onClick={() => setShowBanner(false)}><X /></button>
        </div>
      )}

      {/* Minimal pill */}
      {!showBanner && (
        <div className="fb-pill">
          <div className="fb-picon"><Shield /></div>
          <span className="fb-ptxt">Focus Mode</span>
          <span className="fb-pdot" />
        </div>
      )}

      {/* Bottom badge */}
      <div className="fb-badge">
        <div className="fb-bh">
          <Volume2 />
          <span className="fb-bht">Notifications Paused</span>
        </div>
        <p className="fb-bdesc">External notifications are blocked while you're focused.</p>
        <div className="fb-count">
          <Shield style={{ width: 9, height: 9 }} />
          Focus mode on
        </div>
      </div>
    </>
  );
}