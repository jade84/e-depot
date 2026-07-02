import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Copy, Check, Loader2, AlertCircle, QrCode, Banknote } from 'lucide-react'
import { useOrder } from '../../features/orders'
import { useBankInfo, DEFAULT_BANK } from '../../features/settings'
import { ScreenHeader } from '../../components/mobile'

// ── Hook copy ─────────────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }
  return { copied, copy }
}

// ── Row copy ──────────────────────────────────────────────────────────────────
function CopyRow({ label, value, copyKey, copied, onCopy }: {
  label: string
  value: string
  copyKey: string
  copied: string | null
  onCopy: (v: string, k: string) => void
}) {
  const isCopied = copied === copyKey
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink-100 last:border-0">
      <div className="flex-1 min-w-0 mr-3">
        <div className="text-[10.5px] text-ink-400 leading-none mb-0.5">{label}</div>
        <div className="text-[13.5px] font-semibold text-ink-800 break-all">{value}</div>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, copyKey)}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
          isCopied
            ? 'bg-green-100 text-green-700'
            : 'bg-ink-100 text-ink-600 active:bg-ink-200'
        }`}
      >
        {isCopied ? <Check size={13} /> : <Copy size={13} />}
        {isCopied ? 'Đã copy' : 'Copy'}
      </button>
    </div>
  )
}

// ── Trang thanh toán ──────────────────────────────────────────────────────────
export function PaymentPage() {
  const { id } = useParams<{ id: string }>()
  const { data: o, isLoading, error } = useOrder(id ?? '')
  const { data: bank } = useBankInfo()
  const { copied, copy } = useCopy()
  const BANK_INFO = bank ?? DEFAULT_BANK

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Thanh toán" />
        <div className="flex-1 flex items-center justify-center gap-2 text-ink-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Đang tải…
        </div>
      </div>
    )
  }

  if (error || !o) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Thanh toán" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-red-600">
            <AlertCircle size={36} className="mx-auto mb-2 text-red-400" />
            <div className="text-[13px]">Không tìm thấy đơn hàng</div>
          </div>
        </div>
      </div>
    )
  }

  const soTien = o.phi_nang_ha
  const noiDung = `THANH TOAN ${o.so_bl ?? o.id.slice(0, 8).toUpperCase()}`

  // VietQR URL: https://img.vietqr.io/image/{bank}-{account}-{template}.png?amount=...&addInfo=...
  const qrUrl = [
    `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNo}-compact2.png`,
    `?amount=${soTien}`,
    `&addInfo=${encodeURIComponent(noiDung)}`,
    `&accountName=${encodeURIComponent(BANK_INFO.accountName)}`,
  ].join('')

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Thanh toán" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-3">

        {/* Header phí */}
        <div className="bg-brand-800 rounded-2xl p-4 text-white text-center">
          <div className="text-[11px] text-white/60 mb-1">Số tiền cần thanh toán</div>
          <div className="text-[28px] font-extrabold tracking-tight">
            {soTien > 0 ? soTien.toLocaleString('vi-VN') + ' đ' : '—'}
          </div>
          <div className="text-[11px] text-white/50 mt-1">
            Đơn: {o.so_bl ?? o.id.slice(0, 8).toUpperCase()}
          </div>
        </div>

        {/* QR code */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-400 uppercase tracking-wide mb-3">
            <QrCode size={13} /> Quét mã QR chuyển khoản
          </div>
          {soTien > 0 ? (
            <img
              src={qrUrl}
              alt="QR chuyển khoản"
              className="w-56 h-56 object-contain rounded-xl"
              loading="lazy"
            />
          ) : (
            <div className="w-56 h-56 rounded-xl bg-ink-100 flex flex-col items-center justify-center text-ink-400 text-[12px] gap-2">
              <Banknote size={28} className="text-ink-300" />
              Chưa có phí nâng hạ
            </div>
          )}
          <div className="mt-2 text-[11px] text-ink-400">Ứng dụng ngân hàng → Quét QR</div>
        </div>

        {/* Thông tin chuyển khoản */}
        <div className="bg-white rounded-2xl px-4 pb-1 pt-3.5 shadow-sm">
          <div className="text-[11px] font-bold text-ink-400 uppercase tracking-wide mb-1">
            Thông tin chuyển khoản
          </div>
          <CopyRow
            label="Ngân hàng"
            value={BANK_INFO.bankName}
            copyKey="bank"
            copied={copied}
            onCopy={copy}
          />
          <CopyRow
            label="Số tài khoản"
            value={BANK_INFO.accountNo}
            copyKey="account"
            copied={copied}
            onCopy={copy}
          />
          <CopyRow
            label="Tên chủ tài khoản"
            value={BANK_INFO.accountName}
            copyKey="name"
            copied={copied}
            onCopy={copy}
          />
          {soTien > 0 && (
            <CopyRow
              label="Số tiền"
              value={soTien.toLocaleString('vi-VN') + ' đ'}
              copyKey="amount"
              copied={copied}
              onCopy={copy}
            />
          )}
          <CopyRow
            label="Nội dung chuyển khoản"
            value={noiDung}
            copyKey="content"
            copied={copied}
            onCopy={copy}
          />
        </div>

        {/* Ghi chú */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <div className="text-[12px] text-amber-700 leading-relaxed">
            <span className="font-bold">Lưu ý:</span> Ghi đúng nội dung chuyển khoản để hệ thống xác nhận tự động. Sau khi chuyển khoản, đơn của bạn sẽ được xác nhận trong vòng 30 phút.
          </div>
        </div>

        <div className="pb-6" />
      </div>
    </div>
  )
}
