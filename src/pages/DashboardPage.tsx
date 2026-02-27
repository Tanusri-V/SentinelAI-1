import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Papa from 'papaparse'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { parseLoginRows, runIdentityRiskModel } from '../lib/detectionModel'
import type { DashboardAnalytics, LoginRecord } from '../lib/detectionModel'

const SEVERITY_COLORS: Record<string, string> = {
  low: '#6c8cff',
  medium: '#ffbe4d',
  high: '#ff5c72',
}

export default function DashboardPage() {
  const [records, setRecords] = useState<LoginRecord[]>([])
  const [error, setError] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const analytics: DashboardAnalytics | null = useMemo(() => {
    if (!records.length) return null
    return runIdentityRiskModel(records)
  }, [records])

  const ingest = (rows: unknown[], source: string) => {
    const parsed = parseLoginRows(rows)
    if (!parsed.length) {
      setError('No valid login events found. Ensure your CSV has timestamp and userId columns.')
      return
    }
    setError('')
    setRecords(parsed)
    setSourceLabel(source)
  }

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => ingest(data, file.name),
      error: () => setError('Failed to parse CSV.'),
    })
  }

  const loadDemo = async () => {
    try {
      const csv = await fetch('/sample-login-activity.csv').then((r) => {
        if (!r.ok) throw new Error()
        return r.text()
      })
      Papa.parse<Record<string, string>>(csv, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data }) => ingest(data, 'sample-login-activity.csv (demo)'),
      })
    } catch {
      setError('Could not load demo dataset.')
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Analytics Dashboard</div>
          <div className="page-desc">
            {sourceLabel
              ? `Analyzing ${records.length} events from ${sourceLabel}`
              : 'Upload login activity to begin analysis'}
          </div>
        </div>
        {analytics && (
          <span className="header-badge">
            <span className="header-badge-dot" />
            Pipeline Active
          </span>
        )}
      </div>

      <div className="page-container section-gap-lg">
        {/* Upload zone */}
        <div
          className="card upload-zone"
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} />
          <div className="upload-icon">📄</div>
          <div className="upload-title">
            Drop a CSV file here, or click to browse
          </div>
          <div className="upload-subtitle">
            Required: <strong>timestamp</strong>, <strong>userId</strong>.
            Optional: location, device, loginStatus, ipAddress.
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.3rem' }}>
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation()
                fileRef.current?.click()
              }}
            >
              Upload CSV
            </button>
            <button
              className="btn btn-ghost"
              onClick={(e) => {
                e.stopPropagation()
                loadDemo()
              }}
            >
              Load Demo Dataset
            </button>
          </div>
          {error && (
            <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
              {error}
            </p>
          )}
        </div>

        {analytics && (
          <>
            {/* KPI row */}
            <div className="grid-4 animate-in">
              <MetricCard label="Total Logins" value={analytics.metrics.totalLogins} />
              <MetricCard
                label="Suspicious Events"
                value={analytics.metrics.suspiciousLogins}
                accent="var(--amber)"
              />
              <MetricCard
                label="High-Risk Alerts"
                value={analytics.metrics.highRiskAlerts}
                accent="var(--red)"
              />
              <MetricCard
                label="Avg Risk Score"
                value={analytics.metrics.averageRisk.toFixed(1)}
              />
            </div>

            {/* Behavior trend */}
            <div className="card card-pad section-gap animate-in animate-delay-1">
              <div className="section-header">
                <div>
                  <div className="section-title">Behavior Trend</div>
                  <div className="section-subtitle">
                    Daily total vs suspicious login volume
                  </div>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyTrend}>
                    <defs>
                      <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38d9a9" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#38d9a9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSusp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6c8cff" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6c8cff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="#5b6a8a" fontSize={12} />
                    <YAxis stroke="#5b6a8a" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" stroke="#38d9a9" fill="url(#gTotal)" strokeWidth={2} />
                    <Area type="monotone" dataKey="suspicious" stroke="#6c8cff" fill="url(#gSusp)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Two-column: Risk trend + Severity dist */}
            <div className="grid-2 animate-in animate-delay-2">
              <div className="card card-pad section-gap">
                <div className="section-title">Risk Score Over Time</div>
                <div className="chart-container-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.riskTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" stroke="#5b6a8a" fontSize={12} />
                      <YAxis stroke="#5b6a8a" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="averageRisk" stroke="#6c8cff" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card card-pad section-gap">
                <div className="section-title">Severity Distribution</div>
                <div className="chart-container-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.severityDistribution}
                        dataKey="count"
                        nameKey="severity"
                        outerRadius={95}
                        innerRadius={50}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {analytics.severityDistribution.map((e) => (
                          <Cell key={e.severity} fill={SEVERITY_COLORS[e.severity]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem' }}>
                  {analytics.severityDistribution.map((e) => (
                    <span className="tag" key={e.severity}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: SEVERITY_COLORS[e.severity],
                        }}
                      />
                      {e.severity}: {e.count}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Two-column: Location + Device */}
            <div className="grid-2 animate-in animate-delay-3">
              <div className="card card-pad section-gap">
                <div>
                  <div className="section-title">Anomalies by Location</div>
                  <div className="section-subtitle">Top flagged cities</div>
                </div>
                <div className="chart-container-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.locationAnomalies}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="location" stroke="#5b6a8a" fontSize={12} />
                      <YAxis stroke="#5b6a8a" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ffbe4d" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card card-pad section-gap">
                <div>
                  <div className="section-title">Anomalies by Device</div>
                  <div className="section-subtitle">Top flagged device types</div>
                </div>
                <div className="chart-container-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.deviceAnomalies}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="device" stroke="#5b6a8a" fontSize={12} />
                      <YAxis stroke="#5b6a8a" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ff5c72" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top alerts preview */}
            <div className="card card-pad section-gap animate-in animate-delay-4">
              <div className="section-header">
                <div>
                  <div className="section-title">Top Risk Alerts</div>
                  <div className="section-subtitle">
                    Highest weighted anomaly scores
                  </div>
                </div>
                <span className="tag">Showing top {analytics.alerts.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {analytics.alerts.map((a) => (
                  <div className="alert-row" key={a.id}>
                    <div className="alert-left">
                      <span className="alert-primary-text">
                        {a.userId} — {a.location} — {a.device}
                      </span>
                      <span className="alert-secondary-text">
                        {new Date(a.timestamp).toLocaleString()} · {a.reasons.join(' · ')}
                      </span>
                    </div>
                    <span className={`severity-badge ${a.severity}`}>
                      {a.riskScore.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!analytics && (
          <div className="card empty-state">
            <div className="empty-icon">◈</div>
            <h2>No Data Loaded</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6 }}>
              Upload a login-activity CSV or load the bundled demo
              dataset to initialize the anomaly detection pipeline.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div className="card metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  )
}
