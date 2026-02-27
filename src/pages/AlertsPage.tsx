import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Papa from 'papaparse'
import { parseLoginRows, runIdentityRiskModel } from '../lib/detectionModel'
import type { LoginRecord, ScoredLogin } from '../lib/detectionModel'

type Filter = 'all' | 'high' | 'medium'

export default function AlertsPage() {
  const [records, setRecords] = useState<LoginRecord[]>([])
  const [error, setError] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  const scored = useMemo(() => {
    if (!records.length) return [] as ScoredLogin[]
    return runIdentityRiskModel(records).alerts
  }, [records])

  const filtered = useMemo(() => {
    if (filter === 'all') return scored
    return scored.filter((a) => a.severity === filter)
  }, [scored, filter])

  const ingest = (rows: unknown[], source: string) => {
    const parsed = parseLoginRows(rows)
    if (!parsed.length) {
      setError('No valid login events found.')
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
          <div className="page-title">Alert Center</div>
          <div className="page-desc">
            {sourceLabel
              ? `${filtered.length} alerts from ${sourceLabel}`
              : 'Upload data to generate risk alerts'}
          </div>
        </div>
        {scored.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['all', 'high', 'medium'] as Filter[]).map((f) => (
              <button
                key={f}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="page-container section-gap-lg">
        {!records.length && (
          <>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
                Upload CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
              <button className="btn btn-ghost" onClick={loadDemo}>
                Load Demo Dataset
              </button>
            </div>
            {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}

            <div className="card empty-state">
              <div className="empty-icon">⚡</div>
              <h2>No Alerts Yet</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.6 }}>
                Upload login-activity data to generate risk alerts ranked by anomaly
                score.
              </p>
            </div>
          </>
        )}

        {filtered.length > 0 && (
          <div className="section-gap" style={{ gap: '0.55rem' }}>
            {filtered.map((a, i) => (
              <div
                className="card alert-row animate-in"
                key={a.id}
                style={{ animationDelay: `${Math.min(i * 0.04, 0.5)}s` }}
              >
                <div className="alert-left">
                  <span className="alert-primary-text">
                    {a.userId} — {a.location} — {a.device}
                  </span>
                  <span className="alert-secondary-text">
                    {new Date(a.timestamp).toLocaleString()} · IP {a.ipAddress} · Status: {a.loginStatus}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                    {a.reasons.map((r) => (
                      <span className="tag" key={r}>{r}</span>
                    ))}
                  </div>
                </div>
                <span className={`severity-badge ${a.severity}`}>
                  {a.riskScore.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}

        {records.length > 0 && filtered.length === 0 && (
          <div className="card empty-state">
            <div className="empty-icon">✓</div>
            <h2>No Matching Alerts</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              No alerts match the current filter. Try selecting a different severity.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
