function StatCard({ icon: Icon, label, value, tone = 'blue', onClick }) {
  return (
    <article className={`stat-card${onClick ? ' clickable' : ''}`} onClick={onClick}>
      <span className={`stat-icon ${tone}`}>{Icon ? <Icon size={22} /> : null}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

export default StatCard
