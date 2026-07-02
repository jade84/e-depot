import { useParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { ScreenHeader } from '../components/mobile'
import { useService, serviceIcon } from '../features/services'

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: s, isLoading, error } = useService(id ?? '')

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Dịch vụ" />
        <div className="flex-1 flex items-center justify-center gap-2 text-ink-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Đang tải…
        </div>
      </div>
    )
  }

  if (error || !s) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Dịch vụ" />
        <div className="flex-1 flex items-center justify-center px-6 text-center text-red-600">
          <div>
            <AlertCircle size={36} className="mx-auto mb-2 text-red-400" />
            <div className="text-[13px]">Không tìm thấy dịch vụ</div>
          </div>
        </div>
      </div>
    )
  }

  const Icon = serviceIcon(s.icon)

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title={s.title} />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Hero */}
        <div className="bg-gradient-to-b from-brand-100 to-ink-50 px-5 pt-6 pb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
            <Icon size={30} className="text-brand-600" />
          </div>
          <h1 className="text-[17px] font-extrabold text-brand-800">{s.title}</h1>
          {s.mo_ta && <p className="text-[12.5px] text-brand-600 mt-1">{s.mo_ta}</p>}
        </div>

        {/* Nội dung chi tiết */}
        <div className="px-4 py-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {s.noi_dung
              ? <div className="text-[13.5px] text-ink-700 leading-relaxed whitespace-pre-wrap">{s.noi_dung}</div>
              : <div className="text-[13px] text-ink-400 text-center py-6">Nội dung đang được cập nhật.</div>
            }
          </div>
        </div>
        <div className="pb-6" />
      </div>
    </div>
  )
}
