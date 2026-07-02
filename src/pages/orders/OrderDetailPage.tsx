import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Loader2, AlertCircle, ArrowDownToLine, ArrowUpFromLine,
  X, ChevronLeft, ChevronRight, Banknote,
  Truck, User, Building2, Package, Hash, FileText, MapPin,
} from 'lucide-react'
import { useOrder, useCancelOrder } from '../../features/orders'
import { ScreenHeader } from '../../components/mobile'
import { ORDER_STATUS } from '../../lib/options'

const TONE: Record<string, string> = {
  amber:  'bg-amber-100 text-amber-700 border-amber-200',
  red:    'bg-red-100 text-red-700 border-red-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  green:  'bg-green-100 text-green-700 border-green-200',
  gray:   'bg-ink-200 text-ink-600 border-ink-300',
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photos, startIndex, onClose }: {
  photos: string[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length)
  const next = () => setIdx(i => (i + 1) % photos.length)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Đóng */}
      <button
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white"
        onClick={onClose}
      >
        <X size={22} />
      </button>

      {/* Counter */}
      {photos.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-[13px]">
          {idx + 1} / {photos.length}
        </div>
      )}

      {/* Ảnh chính */}
      <img
        src={photos[idx]}
        alt={`Ảnh ${idx + 1}`}
        className="max-w-full max-h-full object-contain select-none"
        onClick={e => e.stopPropagation()}
      />

      {/* Prev / Next */}
      {photos.length > 1 && (
        <>
          <button
            className="absolute left-2 p-2 rounded-full bg-white/10 text-white"
            onClick={e => { e.stopPropagation(); prev() }}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            className="absolute right-2 p-2 rounded-full bg-white/10 text-white"
            onClick={e => { e.stopPropagation(); next() }}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </div>
  )
}

// ── Row thông tin ─────────────────────────────────────────────────────────────
function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-ink-100 last:border-0">
      <div className="w-5 h-5 mt-0.5 text-ink-400 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] text-ink-400 leading-none mb-0.5">{label}</div>
        <div className="text-[13.5px] font-medium text-ink-800 break-all">{value}</div>
      </div>
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl px-3.5 pb-0.5 pt-3 shadow-sm">
      <div className="text-[11px] font-bold text-ink-400 uppercase tracking-wide mb-0.5">
        {title}
      </div>
      {children}
    </div>
  )
}

// ── Trang chính ───────────────────────────────────────────────────────────────
export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: o, isLoading, error } = useOrder(id ?? '')
  const cancel = useCancelOrder()
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Chi tiết đơn" />
        <div className="flex-1 flex items-center justify-center gap-2 text-ink-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Đang tải…
        </div>
      </div>
    )
  }

  if (error || !o) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Chi tiết đơn" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-red-600">
            <AlertCircle size={36} className="mx-auto mb-2 text-red-400" />
            <div className="text-[13px]">Không tìm thấy đơn hàng</div>
          </div>
        </div>
      </div>
    )
  }

  const st = ORDER_STATUS[o.trang_thai] ?? { label: o.trang_thai, tone: 'gray' }
  const isLay = o.loai === 'lay'
  const date = new Date(o.created_at).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const photos: string[] = Array.isArray(o.photos) ? o.photos.filter(Boolean) : []

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Chi tiết đơn" />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Hero: loại + trạng thái */}
        <div className="bg-brand-800 px-4 pb-5 pt-1 text-white">
          <div className="flex items-center gap-2 mb-1">
            {isLay
              ? <ArrowUpFromLine size={18} className="text-green-300" />
              : <ArrowDownToLine size={18} className="text-blue-300" />}
            <span className="text-[15px] font-bold">
              {isLay ? 'Gate OUT · Lấy cont rỗng' : 'Gate IN · Trả cont rỗng'}
            </span>
          </div>
          <div className="text-[11px] text-white/50">{date}</div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${TONE[st.tone]}`}>
              {st.label}
            </span>
            {o.phi_nang_ha > 0 && (
              <span className="text-[12px] font-semibold text-white/80">
                Phí: {o.phi_nang_ha.toLocaleString('vi-VN')} đ
              </span>
            )}
          </div>
        </div>

        <div className="px-3 py-3 space-y-3">

          {/* Thông tin cont */}
          <Section title="Thông tin cont">
            <Row icon={<FileText size={15} />} label="Số B/L" value={o.so_bl} />
            <Row icon={<MapPin size={15} />} label="Depot" value={o.depot} />
            <Row icon={<Package size={15} />} label="Hãng tàu" value={o.hang_tau} />
            <Row icon={<Package size={15} />} label="Loại cont" value={o.loai_cont} />
            <Row icon={<Hash size={15} />} label="Số lượng" value={String(o.so_luong) + ' cont'} />
            {o.so_cont?.length > 0 && (
              <div className="flex items-start gap-3 py-2.5 border-b border-ink-100 last:border-0">
                <div className="w-5 h-5 mt-0.5 text-ink-400 shrink-0"><Hash size={15} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] text-ink-400 leading-none mb-1">Số cont</div>
                  <div className="flex flex-wrap gap-1.5">
                    {o.so_cont.map((s, i) => (
                      <span key={i} className="text-[11.5px] font-mono font-semibold bg-ink-100 text-ink-700 px-2 py-0.5 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Phương tiện & tài xế */}
          <Section title="Phương tiện & Tài xế">
            <Row icon={<Truck size={15} />} label="Biển số xe" value={o.bien_so} />
            <Row icon={<User size={15} />} label="Tài xế" value={o.tai_xe_ten} />
            <Row icon={<Hash size={15} />} label="CCCD tài xế" value={o.tai_xe_cccd} />
          </Section>

          {/* Công ty */}
          {(o.cong_ty_hd || o.mst) && (
            <Section title="Thông tin doanh nghiệp">
              <Row icon={<Building2 size={15} />} label="Công ty hợp đồng" value={o.cong_ty_hd} />
              <Row icon={<Hash size={15} />} label="Mã số thuế" value={o.mst} />
            </Section>
          )}

          {/* Ảnh chứng từ */}
          {photos.length > 0 && (
            <div className="bg-white rounded-2xl p-3.5 shadow-sm">
              <div className="text-[11px] font-bold text-ink-400 uppercase tracking-wide mb-2.5">
                Ảnh chứng từ
              </div>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className="aspect-square rounded-xl overflow-hidden bg-ink-100 active:opacity-80 transition"
                  >
                    <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex flex-col gap-2 pb-6">
            {o.trang_thai === 'chua_tt' && (
              <button
                onClick={() => nav(`/don-hang/${o.id}/thanh-toan`)}
                className="w-full h-12 rounded-2xl bg-brand-600 text-white font-bold text-[14px] flex items-center justify-center gap-2 active:bg-brand-700 shadow"
              >
                <Banknote size={18} /> Thanh toán ngay
              </button>
            )}
            {o.trang_thai === 'cho_duyet' && (
              <button
                disabled={cancel.isPending}
                onClick={() => {
                  if (window.confirm('Hủy đơn hàng này?')) {
                    cancel.mutate(o.id, { onSuccess: () => nav(-1) })
                  }
                }}
                className="w-full h-11 rounded-2xl border-2 border-red-200 bg-red-50 text-red-600 font-semibold text-[14px] flex items-center justify-center gap-2 active:bg-red-100 disabled:opacity-60"
              >
                {cancel.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Hủy đơn
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox photos={photos} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}
