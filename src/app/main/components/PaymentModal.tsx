// 파일 경로: src/app/main/components/PaymentModal.tsx
interface PaymentItem {
  name: string
  type: string
  price: string
  thumb: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  paymentItem: PaymentItem
  payMethod: "card" | "simple" | "virtual"
  onSetPayMethod: (method: "card" | "simple" | "virtual") => void
  onConfirm: () => void
  isLoading: boolean
}

export function PaymentModal({
  isOpen,
  onClose,
  paymentItem,
  payMethod,
  onSetPayMethod,
  onConfirm,
  isLoading,
}: PaymentModalProps) {
  return (
    <div className={`modal-backdrop${isOpen ? " open" : ""}`} onClick={onClose}>
      <div className="payment-modal" onClick={(event) => event.stopPropagation()}>
        <div className="plans-modal-header">
          <div className="plans-modal-title">결제하기</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="payment-item-info">
          <div className="payment-item-thumb">{paymentItem.thumb}</div>
          <div className="payment-item-detail">
            <div className="payment-item-name">{paymentItem.name}</div>
            <div className="payment-item-type">{paymentItem.type}</div>
          </div>
          <div className="payment-item-price">{paymentItem.price}</div>
        </div>
        <div className="pay-section-label">결제 수단</div>
        <div className="pay-method-row">
          <button className={`pay-method${payMethod === "card" ? " active" : ""}`} onClick={() => onSetPayMethod("card")}>신용카드</button>
          <button className={`pay-method${payMethod === "simple" ? " active" : ""}`} onClick={() => onSetPayMethod("simple")}>간편결제</button>
          <button className={`pay-method${payMethod === "virtual" ? " active" : ""}`} onClick={() => onSetPayMethod("virtual")}>가상계좌</button>
        </div>
        <div className="pay-total">
          <span className="pay-total-label">결제 금액</span>
          <span className="pay-total-val">{paymentItem.price}</span>
        </div>
        <button className={`pay-confirm-btn${isLoading ? " btn-loading" : ""}`} onClick={onConfirm} disabled={isLoading}>결제하기</button>
      </div>
    </div>
  )
}
