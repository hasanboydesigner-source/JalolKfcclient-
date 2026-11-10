import React from 'react'
import StatsPanel from '../components/StatsPanel'

const StatsPage = ({
  stats,
  loading,
  statsDate,
  setStatsDate,
  onRefresh
}) => {
  return (
    <StatsPanel
      stats={stats}
      loading={loading}
      statsDate={statsDate}
      setStatsDate={setStatsDate}
      onRefresh={onRefresh}
    />
  )
}

export default StatsPage
