export type Severity = 'low' | 'medium' | 'high'

export type LoginRecord = {
  id: string
  timestamp: string
  userId: string
  location: string
  device: string
  loginStatus: string
  ipAddress: string
}

export type ScoredLogin = LoginRecord & {
  riskScore: number
  severity: Severity
  reasons: string[]
}

export type DashboardAnalytics = {
  scored: ScoredLogin[]
  alerts: ScoredLogin[]
  metrics: {
    totalLogins: number
    suspiciousLogins: number
    highRiskAlerts: number
    averageRisk: number
    uniqueUsers: number
  }
  dailyTrend: Array<{ date: string; total: number; suspicious: number }>
  riskTrend: Array<{ date: string; averageRisk: number }>
  locationAnomalies: Array<{ location: string; count: number }>
  deviceAnomalies: Array<{ device: string; count: number }>
  severityDistribution: Array<{ severity: Severity; count: number }>
}

type Coordinate = { lat: number; lon: number }

const locationCoordinates: Record<string, Coordinate> = {
  'new york': { lat: 40.7128, lon: -74.006 },
  london: { lat: 51.5074, lon: -0.1278 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  singapore: { lat: 1.3521, lon: 103.8198 },
  sydney: { lat: -33.8688, lon: 151.2093 },
  tokyo: { lat: 35.6762, lon: 139.6503 },
  berlin: { lat: 52.52, lon: 13.405 },
  dubai: { lat: 25.2048, lon: 55.2708 },
  paris: { lat: 48.8566, lon: 2.3522 },
  toronto: { lat: 43.6532, lon: -79.3832 },
}

const normalizeHeader = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '')

const getColumn = (row: Record<string, unknown>, aliases: string[]): string => {
  const entries = Object.entries(row)
  const key = entries.find(([header]) => aliases.includes(normalizeHeader(header)))?.[0]
  const raw = key ? row[key] : ''
  return typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim()
}

const toDay = (timestamp: string): string => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.valueOf())) {
    return 'invalid'
  }

  return date.toISOString().slice(0, 10)
}

const getSeverity = (riskScore: number): Severity => {
  if (riskScore >= 70) {
    return 'high'
  }

  if (riskScore >= 45) {
    return 'medium'
  }

  return 'low'
}

const haversineDistanceKm = (a: Coordinate, b: Coordinate): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadius = 6371

  const latDiff = toRadians(b.lat - a.lat)
  const lonDiff = toRadians(b.lon - a.lon)
  const first =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(lonDiff / 2) *
      Math.sin(lonDiff / 2)

  const second = 2 * Math.atan2(Math.sqrt(first), Math.sqrt(1 - first))
  return earthRadius * second
}

const standardDeviation = (values: number[]): number => {
  if (values.length <= 1) {
    return 0
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / values.length
  return Math.sqrt(variance)
}

export const parseLoginRows = (rows: unknown[]): LoginRecord[] => {
  const parsed: LoginRecord[] = []

  rows.forEach((entry, index) => {
    const row = entry as Record<string, unknown>

    const timestamp = getColumn(row, ['timestamp', 'time', 'datetime', 'loginat'])
    const userId = getColumn(row, ['userid', 'user', 'accountid', 'username'])

    if (!timestamp || !userId || Number.isNaN(new Date(timestamp).valueOf())) {
      return
    }

    const location =
      getColumn(row, ['location', 'city', 'country', 'region']) || 'Unknown Location'
    const device = getColumn(row, ['device', 'devicetype', 'platform']) || 'Unknown Device'
    const loginStatus = getColumn(row, ['loginstatus', 'status', 'result']) || 'success'
    const ipAddress = getColumn(row, ['ip', 'ipaddress']) || 'N/A'

    parsed.push({
      id: `${userId}-${index}-${timestamp}`,
      timestamp,
      userId,
      location,
      device,
      loginStatus,
      ipAddress,
    })
  })

  return parsed.sort(
    (left, right) =>
      new Date(left.timestamp).valueOf() - new Date(right.timestamp).valueOf(),
  )
}

export const runIdentityRiskModel = (records: LoginRecord[]): DashboardAnalytics => {
  const dailyCountPerUser = new Map<string, Map<string, number>>()

  records.forEach((record) => {
    const date = toDay(record.timestamp)
    const userMap = dailyCountPerUser.get(record.userId) ?? new Map<string, number>()
    userMap.set(date, (userMap.get(date) ?? 0) + 1)
    dailyCountPerUser.set(record.userId, userMap)
  })

  const baselineByUser = new Map<string, { mean: number; std: number }>()

  dailyCountPerUser.forEach((counts, userId) => {
    const values = Array.from(counts.values())
    const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
    const std = standardDeviation(values)
    baselineByUser.set(userId, { mean, std })
  })

  const seenLocations = new Map<string, Set<string>>()
  const seenDevices = new Map<string, Set<string>>()
  const lastEventByUser = new Map<string, LoginRecord>()

  const scored = records.map((record): ScoredLogin => {
    const reasons: string[] = []
    let score = 0

    const locationKey = record.location.toLowerCase()
    const deviceKey = record.device.toLowerCase()

    const userLocations = seenLocations.get(record.userId) ?? new Set<string>()
    if (userLocations.size > 0 && !userLocations.has(locationKey)) {
      score += 26
      reasons.push('New geographic login pattern')
    }
    userLocations.add(locationKey)
    seenLocations.set(record.userId, userLocations)

    const userDevices = seenDevices.get(record.userId) ?? new Set<string>()
    if (userDevices.size > 0 && !userDevices.has(deviceKey)) {
      score += 24
      reasons.push('New device fingerprint')
    }
    userDevices.add(deviceKey)
    seenDevices.set(record.userId, userDevices)

    const timestamp = new Date(record.timestamp)
    const hour = timestamp.getHours()
    if (hour < 6 || hour > 22) {
      score += 15
      reasons.push('Off-hours authentication')
    }

    const baseline = baselineByUser.get(record.userId)
    const todayCount = dailyCountPerUser.get(record.userId)?.get(toDay(record.timestamp)) ?? 0
    if (baseline) {
      const zScore = baseline.std === 0 ? 0 : (todayCount - baseline.mean) / baseline.std
      if (zScore > 1.1) {
        score += Math.min(22, (zScore - 1.1) * 10)
        reasons.push('Abnormal login frequency spike')
      }
    }

    if (record.loginStatus.toLowerCase() === 'failure') {
      score += 18
      reasons.push('Failed login attempt')
    }

    const previous = lastEventByUser.get(record.userId)
    if (previous) {
      const prevCoord = locationCoordinates[previous.location.toLowerCase()]
      const currentCoord = locationCoordinates[record.location.toLowerCase()]

      if (prevCoord && currentCoord) {
        const distance = haversineDistanceKm(prevCoord, currentCoord)
        const elapsedHours =
          (new Date(record.timestamp).valueOf() -
            new Date(previous.timestamp).valueOf()) /
          (1000 * 60 * 60)

        if (elapsedHours > 0) {
          const velocity = distance / elapsedHours
          if (velocity > 900) {
            score += 30
            reasons.push('Impossible travel velocity')
          }
        }
      }
    }

    lastEventByUser.set(record.userId, record)

    const riskScore = Math.max(0, Math.min(100, score))
    const severity = getSeverity(riskScore)

    return {
      ...record,
      riskScore,
      severity,
      reasons: reasons.length ? reasons : ['No anomaly trigger'],
    }
  })

  const suspicious = scored.filter((event) => event.severity !== 'low')
  const highRiskAlerts = scored.filter((event) => event.severity === 'high').length
  const averageRisk =
    scored.reduce((sum, event) => sum + event.riskScore, 0) / Math.max(scored.length, 1)

  const dailyAccumulator = new Map<
    string,
    { date: string; total: number; suspicious: number; cumulativeRisk: number }
  >()
  scored.forEach((event) => {
    const date = toDay(event.timestamp)
    const bucket =
      dailyAccumulator.get(date) ?? { date, total: 0, suspicious: 0, cumulativeRisk: 0 }
    bucket.total += 1
    bucket.cumulativeRisk += event.riskScore
    if (event.severity !== 'low') {
      bucket.suspicious += 1
    }
    dailyAccumulator.set(date, bucket)
  })

  const sortedDaily = Array.from(dailyAccumulator.values()).sort((left, right) =>
    left.date.localeCompare(right.date),
  )

  const dailyTrend = sortedDaily.map(({ date, suspicious, total }) => ({
    date,
    suspicious,
    total,
  }))

  const riskTrend = sortedDaily.map(({ date, total, cumulativeRisk }) => ({
    date,
    averageRisk: Number((cumulativeRisk / Math.max(total, 1)).toFixed(2)),
  }))

  const locationAnomaliesMap = new Map<string, number>()
  suspicious.forEach((event) => {
    locationAnomaliesMap.set(event.location, (locationAnomaliesMap.get(event.location) ?? 0) + 1)
  })

  const locationAnomalies = Array.from(locationAnomaliesMap.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 7)

  const deviceAnomaliesMap = new Map<string, number>()
  suspicious.forEach((event) => {
    deviceAnomaliesMap.set(event.device, (deviceAnomaliesMap.get(event.device) ?? 0) + 1)
  })

  const deviceAnomalies = Array.from(deviceAnomaliesMap.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 7)

  const uniqueUsers = new Set(records.map((r) => r.userId)).size

  const severityMap = new Map<Severity, number>([
    ['low', 0],
    ['medium', 0],
    ['high', 0],
  ])

  scored.forEach((event) => {
    severityMap.set(event.severity, (severityMap.get(event.severity) ?? 0) + 1)
  })

  const severityDistribution = Array.from(severityMap.entries()).map(
    ([severity, count]) => ({ severity, count }),
  )

  const alerts = scored
    .filter((event) => event.severity !== 'low')
    .sort((left, right) => right.riskScore - left.riskScore)
    .slice(0, 12)

  return {
    scored,
    alerts,
    metrics: {
      totalLogins: scored.length,
      suspiciousLogins: suspicious.length,
      highRiskAlerts,
      averageRisk,
      uniqueUsers,
    },
    dailyTrend,
    riskTrend,
    locationAnomalies,
    deviceAnomalies,
    severityDistribution,
  }
}