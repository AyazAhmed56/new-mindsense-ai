import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Brain,
  User,
  Mail,
  Calendar,
  Clock,
  Target,
  Award,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Moon,
  Shield,
  Trash2,
  Camera,
  Leaf,
} from "lucide-react";
import type { BaselineMetrics } from "../types";

interface UserData {
  name: string;
  email: string;
  createdAt: string;
  baseline?: BaselineMetrics;
}

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "settings">(
    "overview",
  );

  useEffect(() => {
    const stored = localStorage.getItem("cogniflow_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("cogniflow_auth");
    localStorage.removeItem("cogniflow_user");
    navigate("/login");
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure? This will delete all your data.")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  if (!user) {
    return (
      <div className="pf-loading">
        <div className="pf-spinner" />
      </div>
    );
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pf-root">
      <div className="pf-blob pf-b1" />
      <div className="pf-blob pf-b2" />
      <div className="pf-blob pf-b3" />
      <div className="pf-leaf pf-l1">
        <Leaf />
      </div>
      <div className="pf-leaf pf-l2">
        <Leaf />
      </div>

      <div className="pf-container">
        {/* Hero / Profile header */}
        <div className="pf-hero">
          <div className="pf-hero-top-bar" />
          <div className="pf-hero-body">
            <div className="pf-avatar-wrap">
              <div className="pf-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="pf-avatar-ring" />
            </div>
            <div className="pf-hero-info">
              <h1 className="pf-username">{user.name}</h1>
              <p className="pf-useremail">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
              <p className="pf-joined">
                <Calendar className="w-3.5 h-3.5" />
                Joined {joinDate}
              </p>
            </div>
            <button onClick={handleLogout} className="pf-logout-btn">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="pf-tabs">
          {[
            {
              id: "overview",
              label: "Overview",
              icon: <User className="w-4 h-4" />,
            },
            {
              id: "stats",
              label: "Statistics",
              icon: <Target className="w-4 h-4" />,
            },
            {
              id: "settings",
              label: "Settings",
              icon: <Settings className="w-4 h-4" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pf-tab ${activeTab === tab.id ? "pf-tab-active" : "pf-tab-idle"}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="pf-content">
          {activeTab === "overview" && <OverviewTab user={user} />}
          {activeTab === "stats" && <StatsTab />}
          {activeTab === "settings" && (
            <SettingsTab onDelete={handleDeleteAccount} />
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .pf-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7 50%, #ffffff);
          padding: 2rem 1rem;
          position: relative; overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .pf-loading {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
        }
        .pf-spinner { width: 36px; height: 36px; border: 3px solid #bbf7d0; border-top-color: #22c55e; border-radius: 50%; animation: pf-spin 0.7s linear infinite; }
        @keyframes pf-spin { to { transform: rotate(360deg); } }

        .pf-blob { position: absolute; border-radius: 50%; filter: blur(55px); opacity: 0.25; animation: pf-flt 10s ease-in-out infinite; }
        .pf-b1 { width: 380px; height: 380px; background: radial-gradient(circle, #86efac, #4ade80); top: -100px; right: -80px; }
        .pf-b2 { width: 260px; height: 260px; background: radial-gradient(circle, #d1fae5, #a7f3d0); bottom: -70px; left: -60px; animation-delay: 4s; }
        .pf-b3 { width: 180px; height: 180px; background: radial-gradient(circle, #bbf7d0, #6ee7b7); top: 50%; left: 5%; animation-delay: 7s; }
        @keyframes pf-flt { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-18px) scale(1.04); } }

        .pf-leaf { position: absolute; opacity: 0.08; color: #16a34a; }
        .pf-leaf svg { width: 65px; height: 65px; }
        .pf-l1 { top: 20px; left: 20px; animation: pf-ls 14s ease-in-out infinite; }
        .pf-l2 { bottom: 40px; right: 40px; animation: pf-ls 18s ease-in-out infinite reverse; }
        @keyframes pf-ls { 0%,100% { transform: rotate(-20deg); } 50% { transform: rotate(20deg) scale(1.1); } }

        .pf-container { max-width: 820px; margin: 0 auto; position: relative; z-index: 10; display: flex; flex-direction: column; gap: 1.25rem; }

        /* Hero */
        .pf-hero {
          background: rgba(255,255,255,0.82); backdrop-filter: blur(22px);
          border: 1px solid rgba(134,239,172,0.4); border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(22,163,74,0.12);
          animation: pf-enter 0.5s ease both;
        }
        @keyframes pf-enter { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .pf-hero-top-bar { height: 4px; background: linear-gradient(90deg, #22c55e, #4ade80, #86efac, #4ade80, #22c55e); background-size: 200%; animation: pf-shimmer 3s linear infinite; }
        @keyframes pf-shimmer { 0% { background-position: 0%; } 100% { background-position: 200%; } }
        .pf-hero-body { display: flex; align-items: center; gap: 1.5rem; padding: 1.75rem; flex-wrap: wrap; }

        .pf-avatar-wrap { position: relative; flex-shrink: 0; }
        .pf-avatar {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white; font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(22,163,74,0.35);
        }
        .pf-avatar-ring { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid rgba(34,197,94,0.35); animation: pf-ring 2.5s ease-out infinite; }
        @keyframes pf-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }

        .pf-hero-info { flex: 1; }
        .pf-username { font-family: 'Syne', sans-serif; font-size: 1.7rem; font-weight: 800; color: #14532d; margin: 0; }
        .pf-useremail, .pf-joined { display: flex; align-items: center; gap: 0.4rem; font-size: 0.84rem; color: #6b7280; margin: 0.2rem 0 0; }

        .pf-logout-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1.1rem;
          background: #fef2f2; border: 1px solid #fecaca;
          color: #dc2626; border-radius: 12px;
          font-family: 'DM Sans', sans-serif; font-size: 0.84rem; font-weight: 600;
          cursor: pointer; transition: all 0.22s; flex-shrink: 0;
        }
        .pf-logout-btn:hover { background: #fee2e2; transform: translateY(-1px); }

        /* Tabs */
        .pf-tabs { display: flex; gap: 0.6rem; animation: pf-enter 0.5s 0.1s ease both; overflow-x: auto; }
        .pf-tab {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.65rem 1.25rem; border-radius: 14px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.22s; white-space: nowrap;
        }
        .pf-tab-active { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; box-shadow: 0 5px 16px rgba(22,163,74,0.35); }
        .pf-tab-idle { background: rgba(255,255,255,0.8); color: #6b7280; border: 1px solid rgba(134,239,172,0.35); }
        .pf-tab-idle:hover { background: #f0fdf4; color: #374151; }

        /* Content */
        .pf-content { animation: pf-enter 0.5s 0.15s ease both; }

        /* Glass card */
        .pf-card {
          background: rgba(255,255,255,0.82); backdrop-filter: blur(20px);
          border: 1px solid rgba(134,239,172,0.4); border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 8px 28px rgba(22,163,74,0.08);
        }
        .pf-card + .pf-card { margin-top: 1rem; }
        .pf-card-title { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 700; color: #14532d; margin: 0 0 1.25rem; }

        /* Stat tiles */
        .pf-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.9rem; margin-bottom: 1rem; }
        .pf-stat-tile { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; border-radius: 18px; padding: 1.25rem; text-align: center; transition: transform 0.2s; }
        .pf-stat-tile:hover { transform: translateY(-3px); }
        .pf-stat-icon { color: #22c55e; display: flex; justify-content: center; margin-bottom: 0.5rem; }
        .pf-stat-val { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: #14532d; }
        .pf-stat-lbl { font-size: 0.75rem; color: #6b7280; margin-top: 0.1rem; }

        /* Baseline metrics */
        .pf-baseline-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        .pf-baseline-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; border-radius: 14px; padding: 1rem; text-align: center; }
        .pf-baseline-val { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: #16a34a; }
        .pf-baseline-lbl { font-size: 0.75rem; color: #6b7280; margin-top: 0.15rem; }

        /* Activity */
        .pf-activity-list { display: flex; flex-direction: column; gap: 0.6rem; }
        .pf-activity-item { display: flex; align-items: center; gap: 0.9rem; padding: 0.9rem 1rem; background: rgba(240,253,244,0.6); border: 1px solid #d1fae5; border-radius: 14px; transition: background 0.2s; }
        .pf-activity-item:hover { background: rgba(220,252,231,0.6); }
        .pf-activity-ico { color: #22c55e; flex-shrink: 0; }
        .pf-activity-title { font-size: 0.875rem; font-weight: 600; color: #14532d; }
        .pf-activity-time { font-size: 0.76rem; color: #9ca3af; margin-top: 0.1rem; }
        .pf-activity-dur { font-size: 0.8rem; color: #22c55e; font-weight: 600; margin-left: auto; }

        /* Stats tab progress bars */
        .pf-stat-bars { display: flex; flex-direction: column; gap: 1.25rem; }
        .pf-bar-row { }
        .pf-bar-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .pf-bar-name { font-size: 0.875rem; color: #374151; font-weight: 500; }
        .pf-bar-val { font-size: 0.875rem; font-weight: 700; color: #14532d; }
        .pf-bar-track { height: 8px; background: #e5e7eb; border-radius: 8px; overflow: hidden; }
        .pf-bar-fill { height: 100%; border-radius: 8px; transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1); }

        .pf-weekly-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem; }
        .pf-weekly-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; border-radius: 14px; padding: 1.25rem; text-align: center; }
        .pf-weekly-val { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #16a34a; }
        .pf-weekly-lbl { font-size: 0.78rem; color: #6b7280; margin-top: 0.2rem; }

        /* Settings toggles */
        .pf-toggle-list { display: flex; flex-direction: column; gap: 0.65rem; }
        .pf-toggle-row { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(240,253,244,0.5); border: 1px solid #d1fae5; border-radius: 14px; }
        .pf-toggle-ico { color: #22c55e; flex-shrink: 0; }
        .pf-toggle-info { flex: 1; }
        .pf-toggle-name { font-size: 0.875rem; font-weight: 600; color: #14532d; }
        .pf-toggle-desc { font-size: 0.76rem; color: #9ca3af; margin-top: 0.1rem; }
        .pf-toggle-track { width: 44px; height: 24px; border-radius: 24px; border: none; cursor: pointer; position: relative; transition: background 0.25s; flex-shrink: 0; }
        .pf-toggle-thumb { position: absolute; top: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }

        .pf-privacy-list { display: flex; flex-direction: column; gap: 0.6rem; }
        .pf-privacy-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: rgba(240,253,244,0.5); border: 1px solid #d1fae5; border-radius: 14px; cursor: pointer; transition: background 0.2s; }
        .pf-privacy-btn:hover { background: rgba(220,252,231,0.6); }
        .pf-privacy-left { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; font-weight: 600; }

        .pf-delete-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 1rem; background: #fef2f2; border: 1px solid #fecaca;
          color: #dc2626; border-radius: 16px;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all 0.22s; margin-top: 1rem;
        }
        .pf-delete-btn:hover { background: #fee2e2; transform: translateY(-1px); }

        .pf-empty-state { text-align: center; padding: 2.5rem 1rem; }
        .pf-empty-text { font-size: 0.875rem; color: #9ca3af; margin-bottom: 1rem; }
        .pf-calib-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.65rem 1.25rem;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white; border-radius: 12px; text-decoration: none;
          font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 700;
          transition: all 0.22s; box-shadow: 0 4px 14px rgba(22,163,74,0.3);
        }
        .pf-calib-link:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(22,163,74,0.4); }

        @media (max-width: 600px) {
          .pf-hero-body { flex-direction: column; align-items: flex-start; }
          .pf-stat-grid { grid-template-columns: repeat(3, 1fr); }
          .pf-baseline-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}

function OverviewTab({ user }: { user: UserData }) {
  const stats = [
    {
      icon: <Clock className="w-5 h-5" />,
      label: "Session Time",
      value: "12h 34m",
    },
    {
      icon: <Target className="w-5 h-5" />,
      label: "Focus Score",
      value: "87%",
    },
    { icon: <Award className="w-5 h-5" />, label: "Productivity", value: "A+" },
  ];

  return (
    <div>
      <div className="pf-stat-grid">
        {stats.map((s, i) => (
          <div key={i} className="pf-stat-tile">
            <div className="pf-stat-icon">{s.icon}</div>
            <div className="pf-stat-val">{s.value}</div>
            <div className="pf-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="pf-card">
        <p className="pf-card-title">Baseline Metrics</p>
        {user.baseline ? (
          <div className="pf-baseline-grid">
            <div className="pf-baseline-box">
              <div className="pf-baseline-val">
                {Math.round(user.baseline.wpm)}
              </div>
              <div className="pf-baseline-lbl">WPM</div>
            </div>
            <div className="pf-baseline-box">
              <div className="pf-baseline-val">
                {(user.baseline.errorRate * 100).toFixed(1)}%
              </div>
              <div className="pf-baseline-lbl">Error Rate</div>
            </div>
            <div className="pf-baseline-box">
              <div className="pf-baseline-val">
                {(user.baseline.avgPauseTime / 1000).toFixed(1)}s
              </div>
              <div className="pf-baseline-lbl">Avg Pause</div>
            </div>
          </div>
        ) : (
          <div className="pf-empty-state">
            <p className="pf-empty-text">No baseline metrics recorded yet</p>
            <Link to="/calibration" className="pf-calib-link">
              Start Calibration <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      <div className="pf-card" style={{ marginTop: "1rem" }}>
        <p className="pf-card-title">Recent Activity</p>
        <div className="pf-activity-list">
          {[
            {
              icon: <Brain className="w-4 h-4" />,
              title: "Focus Session",
              time: "2 hours ago",
              dur: "45 min",
            },
            {
              icon: <Clock className="w-4 h-4" />,
              title: "Break Taken",
              time: "3 hours ago",
              dur: "10 min",
            },
            {
              icon: <Target className="w-4 h-4" />,
              title: "Calibration Updated",
              time: "1 day ago",
              dur: undefined,
            },
          ].map((a, i) => (
            <div key={i} className="pf-activity-item">
              <div className="pf-activity-ico">{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="pf-activity-title">{a.title}</div>
                <div className="pf-activity-time">{a.time}</div>
              </div>
              {a.dur && <span className="pf-activity-dur">{a.dur}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsTab() {
  const bars = [
    { name: "Focus Time", val: 68, color: "#22c55e" },
    { name: "Confusion Incidents", val: 12, color: "#f59e0b" },
    { name: "Fatigue Detection", val: 20, color: "#ef4444" },
  ];

  return (
    <div>
      <div className="pf-card">
        <p className="pf-card-title">Detailed Statistics</p>
        <div className="pf-stat-bars">
          {bars.map((b, i) => (
            <div key={i} className="pf-bar-row">
              <div className="pf-bar-header">
                <span className="pf-bar-name">{b.name}</span>
                <span className="pf-bar-val">{b.val}%</span>
              </div>
              <div className="pf-bar-track">
                <div
                  className="pf-bar-fill"
                  style={{ width: `${b.val}%`, background: b.color }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
          }}
        >
          <p className="pf-card-title" style={{ marginBottom: "0.75rem" }}>
            Weekly Summary
          </p>
          <div className="pf-weekly-grid">
            <div className="pf-weekly-box">
              <div className="pf-weekly-val">24h</div>
              <div className="pf-weekly-lbl">Total Focus Time</div>
            </div>
            <div className="pf-weekly-box">
              <div className="pf-weekly-val">15</div>
              <div className="pf-weekly-lbl">Breaks Taken</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ onDelete }: { onDelete: () => void }) {
  return (
    <div>
      <div className="pf-card">
        <p className="pf-card-title">Notifications</p>
        <div className="pf-toggle-list">
          <ToggleItem
            icon={<Bell className="w-4 h-4" />}
            title="Push Notifications"
            description="Alerts for cognitive state changes"
            defaultChecked={true}
          />
          <ToggleItem
            icon={<Moon className="w-4 h-4" />}
            title="Focus Mode"
            description="Pause notifications while focused"
            defaultChecked={true}
          />
          <ToggleItem
            icon={<Camera className="w-4 h-4" />}
            title="Eye Detection"
            description="Enable webcam for fatigue detection"
            defaultChecked={false}
          />
        </div>
      </div>

      <div className="pf-card" style={{ marginTop: "1rem" }}>
        <p className="pf-card-title">Privacy & Security</p>
        <div className="pf-privacy-list">
          <button className="pf-privacy-btn">
            <div className="pf-privacy-left">
              <Shield className="w-4 h-4" style={{ color: "#22c55e" }} /> Change
              Password
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "#9ca3af" }} />
          </button>
        </div>
      </div>

      <button onClick={onDelete} className="pf-delete-btn">
        <Trash2 className="w-4 h-4" />
        Delete Account & All Data
      </button>
    </div>
  );
}

function ToggleItem({
  icon,
  title,
  description,
  defaultChecked,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="pf-toggle-row">
      <div className="pf-toggle-ico">{icon}</div>
      <div className="pf-toggle-info">
        <div className="pf-toggle-name">{title}</div>
        <div className="pf-toggle-desc">{description}</div>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className="pf-toggle-track"
        style={{ background: checked ? "#22c55e" : "#d1d5db" }}
      >
        <span
          className="pf-toggle-thumb"
          style={{
            transform: checked ? "translateX(20px)" : "translateX(2px)",
          }}
        />
      </button>
    </div>
  );
}
