// 파일 경로: src/app/main/components/ReportModal.tsx
interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportReason: string
  onSetReportReason: (reason: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function ReportModal({
  isOpen,
  onClose,
  reportReason,
  onSetReportReason,
  onSubmit,
  isLoading,
}: ReportModalProps) {
  return (
    <div className={`modal-backdrop${isOpen ? " open" : ""}`} onClick={onClose}>
      <div className="payment-modal" onClick={(event) => event.stopPropagation()}>
        <div className="plans-modal-header">
          <div className="plans-modal-title">신고하기</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" }}>
          {[
            { value: "HARASSMENT", label: "욕설 / 괴롭힘" },
            { value: "NUDITY", label: "부적절한 노출" },
            { value: "SPAM", label: "스팸 / 광고" },
            { value: "HATE", label: "혐오 발언" },
            { value: "OTHER", label: "기타" },
          ].map((option) => (
            <div
              key={option.value}
              onClick={() => onSetReportReason(option.value)}
              style={{
                padding: "11px 14px",
                borderRadius: 10,
                border: `1px solid ${reportReason === option.value ? "rgba(124,58,237,0.6)" : "var(--card-border)"}`,
                background: reportReason === option.value ? "rgba(124,58,237,0.1)" : "var(--card-bg)",
                cursor: "pointer",
                fontSize: 13,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: reportReason === option.value ? "#a78bfa" : "var(--text-dim)" }}>●</span>
              {option.label}
            </div>
          ))}
        </div>
        <button className={`pay-confirm-btn${isLoading ? " btn-loading" : ""}`} onClick={onSubmit} disabled={isLoading}>신고 접수</button>
      </div>
    </div>
  )
}
