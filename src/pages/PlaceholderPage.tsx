import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Wrench } from 'lucide-react'

export function PlaceholderPage({ title }: { title: string }) {
  const nav = useNavigate()
  return (
    <div className="h-full flex flex-col">
      <header className="safe-top bg-brand-800 text-white flex items-center gap-2 px-3 py-3.5">
        <button onClick={() => nav(-1)} className="p-1 -ml-1"><ChevronLeft size={24} /></button>
        <h1 className="text-[15px] font-bold">{title}</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 text-ink-400">
        <Wrench size={40} className="mb-3 text-ink-300" />
        <div className="text-[14px] font-semibold text-ink-600">Đang phát triển</div>
        <div className="text-[12px] mt-1">Màn hình "{title}" sẽ được xây dựng ở giai đoạn tiếp theo.</div>
      </div>
    </div>
  )
}
