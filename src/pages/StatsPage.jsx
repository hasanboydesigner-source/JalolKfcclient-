import React from 'react'
import StatsPanel from '../components/StatsPanel'

const StatsPage = ({
  stats,
  loading,
  statsDate,
  setStatsDate,
}) => {
  return (
    <StatsPanel
      stats={stats}
      loading={loading}
      statsDate={statsDate}
      setStatsDate={setStatsDate}
    />
  )
}

export default StatsPage
