import { useNavigate } from 'react-router-dom'
import { Loader2, RefreshCw, ClipboardList, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { useOrders, useCancelOrder, type Order } from '../../features/orders'
import { ScreenHeader } from '../../components/mobile'
import { ORDER_STATUS } from '../../lib/options'

const TONE: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-ink-200 text-ink-600',
}

export function OrdersPage() {
  const nav = useNavigate()
  const { data: orders, isLoading, isFetching, error, refetch } = useOrders()
  const cancel = useCancelOrder()

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Đơn hàng" right={
        <button onClick={() => refetch()} className="p-1.5" aria-label="Tải lại">
          <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
        </button>
      } />

      <div className="flex-1 overflow-y-auto no-scrollbar p-3">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        )}
        {error && <div className="text-red-600 text-[13px] bg-red-50 rounded-lg p-3">Lỗi tải. Bạn đã chạy SQL 05 chưa?</div>}

        {orders && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center text-ink-400 py-16">
            <ClipboardList size={40} className="mb-3 text-ink-300" />
            <div className="text-[14px] font-semibold text-ink-600">Chưa có đơn hàng</div>
            <div className="text-[12px] mt-1">Vào <b>Lấy cont rỗng</b> ở trang chủ để tạo đơn.</div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {orders?.map(o => <OrderCard key={o.id} o={o} onCancel={() => cancel.mutate(o.id)} canceling={cancel.isPending} />)}
        </div>
      </div>

      <button
        onClick={() => nav('/lay-cont')}
        className="safe-bottom fixed bottom-5 w-auto px-5 h-12 rounded-full bg-brand-600 text-white shadow-lg flex items-center justify-center gap-2 active:bg-brand-700 font-bold text-[14px]"
        style={{ right: 'max(1.25rem, calc((100vw - 480px)/2 + 1.25rem))' }}
      >
        <ArrowUpFromLine size={18} /> Lấy cont
      </button>
    </div>
  )
}

function OrderCard({ o, onCancel, canceling }: { o: Order; onCancel: () => void; canceling: boolean }) {
  const st = ORDER_STATUS[o.trang_thai] ?? { label: o.trang_thai, tone: 'gray' }
  const isLay = o.loai === 'lay'
  const date = new Date(o.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 font-bold text-[13.5px] text-ink-900">
          {isLay ? <ArrowUpFromLine size={15} className="text-green-600" /> : <ArrowDownToLine size={15} className="text-blue-600" />}
          {isLay ? 'Gate OUT · Lấy rỗng' : 'Gate IN · Trả rỗng'}
        </div>
        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${TONE[st.tone]}`}>{st.label}</span>
      </div>
      <div className="text-[10.5px] text-ink-400 mb-2">{date}</div>

      <div className="grid grid-cols-2 gap-y-1 text-[12.5px]">
        <Info label="Số B/L" value={o.so_bl} />
        <Info label="Hãng tàu" value={o.hang_tau} />
        <Info label="Loại cont" value={o.loai_cont} />
        <Info label="Số lượng" value={String(o.so_luong)} />
        <Info label="Biển số" value={o.bien_so} />
        <Info label="Tài xế" value={o.tai_xe_ten} />
      </div>
      {o.so_cont?.length > 0 && (
        <div className="mt-1.5 text-[12px]">
          <span className="text-ink-400">Số cont: </span>
          <span className="font-medium text-ink-800">{o.so_cont.join(', ')}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-ink-100">
        <div className="text-[13px] font-bold text-brand-700">
          {o.phi_nang_ha > 0 ? o.phi_nang_ha.toLocaleString('vi-VN') + ' đ' : '—'}
        </div>
        {o.trang_thai === 'cho_duyet' && (
          <button onClick={onCancel} disabled={canceling}
            className="text-[12px] font-semibold text-red-600 px-3 py-1.5 rounded-lg bg-red-50 active:bg-red-100">
            Hủy đơn
          </button>
        )}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <span className="text-ink-400">{label}: </span>
      <span className="font-medium text-ink-800">{value || '—'}</span>
    </div>
  )
}
