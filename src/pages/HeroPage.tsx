import { useNavigate } from 'react-router-dom'

export default function HeroPage() {
  const navigate = useNavigate()

  return (
    <>
      <section className="hero-section">
        <div className="hero-grid-bg" />
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />

        <div className="hero-inner">
          <div className="hero-eyebrow animate-in">
            <span>◈</span> Digital Fraud &amp; Security Tools
          </div>

          <h1 className="hero-title animate-in animate-delay-1">
            Detect <span className="accent">Identity Theft</span> Before It
            Causes <span className="green">Damage</span>
          </h1>

          <p className="hero-desc animate-in animate-delay-2">
            An advanced anomaly detection system that analyzes login behavior
            patterns — geographic shifts, device changes, access timing, and
            frequency spikes — to surface high-confidence identity theft
            indicators in real time.
          </p>

          <div className="hero-actions animate-in animate-delay-3">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              ▣ &nbsp;Open Dashboard
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/model')}
            >
              ⬡ &nbsp;View Detection Logic
            </button>
          </div>

          <div className="hero-stats animate-in animate-delay-4">
            <div>
              <div className="hero-stat-val">5</div>
              <div className="hero-stat-label">Anomaly Signals</div>
            </div>
            <div>
              <div className="hero-stat-val">0 – 100</div>
              <div className="hero-stat-label">Risk Score Range</div>
            </div>
            <div>
              <div className="hero-stat-val">3</div>
              <div className="hero-stat-label">Severity Tiers</div>
            </div>
            <div>
              <div className="hero-stat-val">CSV</div>
              <div className="hero-stat-label">Dataset Input Format</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="page-container section-gap-lg">
        <div className="grid-4">
          {features.map((f, i) => (
            <div key={i} className="card card-pad" style={{ cursor: 'default' }}>
              <div
                style={{
                  fontSize: '1.4rem',
                  marginBottom: '0.75rem',
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: f.bg,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ marginBottom: '0.35rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

const features = [
  {
    icon: '📂',
    title: 'Dataset Ingestion',
    desc: 'Upload any login-activity CSV. Sentinel auto-detects column headers and normalizes timestamps for processing.',
    bg: 'rgba(108,140,255,0.1)',
  },
  {
    icon: '🧠',
    title: 'Anomaly Detection',
    desc: 'Weighted multi-signal model scores each login on location novelty, device changes, timing, frequency z-score, and travel velocity.',
    bg: 'rgba(56,217,169,0.1)',
  },
  {
    icon: '⚡',
    title: 'Risk Alerts',
    desc: 'Ranked alerts surface the highest-risk logins first, with per-event severity badges and human-readable reason chains.',
    bg: 'rgba(255,190,77,0.1)',
  },
  {
    icon: '📊',
    title: 'Trend Visualization',
    desc: 'Interactive charts track daily suspicious activity volume, risk score movement, and location/device anomaly concentration.',
    bg: 'rgba(255,92,114,0.1)',
  },
]
