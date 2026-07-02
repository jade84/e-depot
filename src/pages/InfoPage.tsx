import { useNavigate } from 'react-router-dom'
import { Clock, Wallet, Smile, Phone, Mail, MapPin, ChevronRight, Loader2 } from 'lucide-react'
import { useServices, serviceIcon } from '../features/services'
import { useCompanyInfo } from '../features/settings'

type IconType = React.ComponentType<{ size?: number; className?: string }>

const VALUES: { icon: IconType; title: string; desc: string }[] = [
  { icon: Clock, title: 'Tiết kiệm thời gian', desc: 'Quy trình chuyên nghiệp, nhanh gọn.' },
  { icon: Wallet, title: 'Tối ưu chi phí', desc: 'Giải pháp dịch vụ hợp lý.' },
  { icon: Smile, title: 'Thuận tiện', desc: 'Lấy sự tiện lợi làm gốc.' },
]

export function InfoPage() {
  const nav = useNavigate()
  const { data: services, isLoading } = useServices()
  const { data: company } = useCompanyInfo()
  const tel = (company?.dienThoai ?? '').replace(/[^\d]/g, '')

  return (
    <div className="pb-6">
      {/* Hero — nền xanh nhạt nhẹ nhàng */}
      <div className="safe-top bg-gradient-to-b from-brand-100 to-ink-50 px-5 pt-7 pb-7 text-center rounded-b-[28px]">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
          <img src="/logo.png" alt="GreenLogistics" className="w-11 h-11 object-contain" />
        </div>
        <h1 className="text-[18px] font-extrabold tracking-tight text-brand-800">GREEN LOGISTICS J.S.C</h1>
        <p className="text-[12px] text-brand-600 mt-1">Gần 20 năm kinh nghiệm ngành logistics</p>
      </div>

      {/* Giới thiệu */}
      <Section title="Giới thiệu">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[13px] text-ink-600 leading-relaxed">
            Green Logistics J.S.C thành lập từ tháng 6/2007, là một trong những công ty đi đầu trong ngành logistics —
            cung cấp sản phẩm chất lượng và dịch vụ chuyên nghiệp trên nền tảng tiết kiệm thời gian,
            tối ưu chi phí và thuận tiện cho khách hàng.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-brand-50 rounded-xl p-2.5 text-center">
                <Icon size={20} className="text-brand-600 mx-auto mb-1.5" />
                <div className="text-[11px] font-bold text-ink-700 leading-tight">{title}</div>
                <div className="text-[9.5px] text-ink-400 mt-1 leading-snug">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Dịch vụ */}
      <Section title="Dịch vụ">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-6">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        ) : (services?.length ?? 0) === 0 ? (
          <div className="text-center text-ink-400 text-[13px] py-6">Chưa có dịch vụ.</div>
        ) : (
          <div className="space-y-2">
            {services!.map(s => {
              const Icon = serviceIcon(s.icon)
              return (
                <button key={s.id} onClick={() => nav(`/thong-tin/dich-vu/${s.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm text-left active:bg-ink-50 transition">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-brand-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold text-ink-800">{s.title}</div>
                    {s.mo_ta && <div className="text-[11.5px] text-ink-500 leading-snug truncate">{s.mo_ta}</div>}
                  </div>
                  <ChevronRight size={18} className="text-ink-300 shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </Section>

      {/* Liên hệ */}
      <Section title="Liên hệ công việc">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          {company?.truSo && <ContactRow icon={MapPin} label="Trụ sở">{company.truSo}</ContactRow>}
          {company?.vanPhong && <ContactRow icon={MapPin} label="Văn phòng">{company.vanPhong}</ContactRow>}
          {company?.dienThoai && (
            <ContactRow icon={Phone} label="Điện thoại" href={`tel:${tel}`}>{company.dienThoai}</ContactRow>
          )}
          {company?.email && (
            <ContactRow icon={Mail} label="Email" href={`mailto:${company.email}`}>{company.email}</ContactRow>
          )}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 mt-5">
      <h2 className="text-[13px] font-bold text-brand-800 mb-2.5">{title}</h2>
      {children}
    </section>
  )
}

function ContactRow({ icon: Icon, label, href, children }: {
  icon: IconType; label: string; href?: string; children: React.ReactNode
}) {
  const body = (
    <div className="flex items-start gap-3">
      <Icon size={17} className="text-brand-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10.5px] text-ink-400 leading-none mb-0.5">{label}</div>
        <div className={`text-[13px] ${href ? 'font-semibold text-brand-700' : 'text-ink-700'} break-words`}>
          {children}
        </div>
      </div>
    </div>
  )
  return href ? <a href={href}>{body}</a> : body
}
