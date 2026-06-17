export default function PageWrapper({ children, centered = false }) {
  return (
    <div style={{
      maxWidth: 1500,
      margin: '0 auto',
      padding: '20px 24px',
      ...(centered ? {
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      } : {}),
    }}>
      {children}
    </div>
  )
}