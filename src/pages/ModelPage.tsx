export default function ModelPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Detection Logic</div>
          <div className="page-desc">
            Clear explanation of the anomaly detection model and scoring
          </div>
        </div>
      </div>

      <div className="page-container section-gap-lg">
        {/* Scoring overview */}
        <div className="card model-card animate-in">
          <h2>Multi-Signal Anomaly Scoring</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            Each login event is independently scored on a <strong>0–100</strong> risk
            scale by summing weighted anomaly signals. The model operates entirely
            client-side — no server or ML training pipeline is required. It builds
            per-user behavioral baselines from the uploaded dataset and flags
            deviations using the following feature set.
          </p>
        </div>

        {/* Features */}
        <div className="card model-card animate-in animate-delay-1">
          <h2>Anomaly Features</h2>

          {features.map((f, i) => (
            <div className="model-feature" key={i}>
              <div className="model-feature-num">{i + 1}</div>
              <div className="model-feature-body">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
                <span className="tag" style={{ marginTop: '0.3rem' }}>
                  Weight: +{f.weight} pts
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Severity thresholds */}
        <div className="card model-card animate-in animate-delay-2">
          <h2>Severity Classification</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            After the anomaly score is computed, it is clamped to [0, 100] and
            classified into one of three severity tiers used for alert
            prioritization.
          </p>

          <div className="threshold-bar">
            <div className="threshold-seg-low" />
            <div className="threshold-seg-med" />
            <div className="threshold-seg-high" />
          </div>
          <div className="threshold-labels">
            <span>0 — Low (&lt; 45)</span>
            <span>45 — Medium</span>
            <span>70 — High (≥ 70)</span>
            <span>100</span>
          </div>

          <div className="grid-3" style={{ marginTop: '0.6rem' }}>
            <div
              className="card card-pad"
              style={{ borderColor: 'rgba(108,140,255,0.2)' }}
            >
              <span
                className="severity-badge low"
                style={{ marginBottom: '0.5rem', display: 'inline-block' }}
              >
                Low
              </span>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Normal behavioral variance. No action required.
              </p>
            </div>
            <div
              className="card card-pad"
              style={{ borderColor: 'rgba(255,190,77,0.2)' }}
            >
              <span
                className="severity-badge medium"
                style={{ marginBottom: '0.5rem', display: 'inline-block' }}
              >
                Medium
              </span>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Moderate deviation. Recommend secondary verification.
              </p>
            </div>
            <div
              className="card card-pad"
              style={{ borderColor: 'rgba(255,92,114,0.2)' }}
            >
              <span
                className="severity-badge high"
                style={{ marginBottom: '0.5rem', display: 'inline-block' }}
              >
                High
              </span>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Strong identity theft indicator. Immediate review recommended.
              </p>
            </div>
          </div>
        </div>

        {/* CSV format */}
        <div className="card model-card animate-in animate-delay-3">
          <h2>Expected Dataset Format</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            The model accepts any UTF-8 CSV file with the following columns. Column
            header matching is case-insensitive and supports common aliases.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '0.55rem 0.6rem', color: 'var(--text-primary)' }}>
                    Column
                  </th>
                  <th style={{ padding: '0.55rem 0.6rem', color: 'var(--text-primary)' }}>
                    Required
                  </th>
                  <th style={{ padding: '0.55rem 0.6rem', color: 'var(--text-primary)' }}>
                    Aliases
                  </th>
                </tr>
              </thead>
              <tbody>
                {csvColumns.map((c) => (
                  <tr
                    key={c.name}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td style={{ padding: '0.5rem 0.6rem', fontWeight: 600 }}>
                      {c.name}
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem' }}>
                      {c.required ? (
                        <span style={{ color: 'var(--red)' }}>Yes</span>
                      ) : (
                        'No'
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem' }}>{c.aliases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

const features = [
  {
    title: 'New Geographic Login',
    desc: 'Flags when a user authenticates from a location not previously seen in their login history. Indicates potential credential use from an unauthorized region.',
    weight: 26,
  },
  {
    title: 'New Device Fingerprint',
    desc: 'Detects login from a device type the user has never used before. Common in stolen credential attacks where an attacker uses their own hardware.',
    weight: 24,
  },
  {
    title: 'Off-Hours Authentication',
    desc: 'Scores higher for logins occurring outside the 06:00–22:00 window, typical of automated attacks or access from different time zones.',
    weight: 15,
  },
  {
    title: 'Login Frequency Z-Score',
    desc: 'Computes a per-user daily login frequency baseline and flags dates where the count exceeds 1.1 standard deviations from the mean. Detects brute-force or credential-stuffing patterns.',
    weight: 22,
  },
  {
    title: 'Impossible Travel Velocity',
    desc: 'Uses haversine distance between consecutive login locations to compute travel velocity. Flags events exceeding 900 km/h, physically impossible for a single person.',
    weight: 30,
  },
  {
    title: 'Failed Login Attempt',
    desc: 'Adds risk for failed authentication events, which often precede successful account takeovers in credential-stuffing campaigns.',
    weight: 18,
  },
]

const csvColumns = [
  { name: 'timestamp', required: true, aliases: 'time, datetime, loginAt' },
  { name: 'userId', required: true, aliases: 'user, accountId, username' },
  { name: 'location', required: false, aliases: 'city, country, region' },
  { name: 'device', required: false, aliases: 'deviceType, platform' },
  { name: 'loginStatus', required: false, aliases: 'status, result' },
  { name: 'ipAddress', required: false, aliases: 'ip' },
]
