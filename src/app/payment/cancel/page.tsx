export default function PaymentCancel() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#080810",
      color: "#fff",
    }}>
      <h1 style={{ fontSize: 48, marginBottom: 16 }}>😢</h1>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>결제가 취소되었습니다</h2>
      <a href="/shop" style={{
        marginTop: 24,
        padding: "12px 24px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        textDecoration: "none",
      }}>상점으로 돌아가기</a>
    </div>
  )
}