export const formatoTranscurrido = (ms) => {
  const totalSeg = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeg / 3600)
  const min = Math.floor((totalSeg % 3600) / 60)
  const seg = totalSeg % 60
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`
  return `${min}:${String(seg).padStart(2, '0')}`
}

export const colorTranscurrido = (ms) => {
  const min = ms / 60000
  if (min >= 30) return 'var(--color-danger)'
  if (min >= 15) return 'var(--color-warning)'
  return 'var(--color-text-primary)'
}