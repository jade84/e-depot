import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { digitsOnly, isValidPhone, isValidCccd } from '../lib/validate'

export function RegisterPage() {
  const { signUp, signIn } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', phone: '', cccd: '', password: '' })
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  function set<K extends keyof typeof f>(k: K, v: string) { setF(p => ({ ...p, [k]: v })) }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!f.name.trim()) { setErr('Nhập họ tên.'); return }
    if (!isValidPhone(f.phone)) { setErr('Số điện thoại phải gồm 10 số, bắt đầu bằng 0.'); return }
    if (!isValidCccd(f.cccd)) { setErr('Số CCCD phải 12 số (hoặc CMND cũ 9 số).'); return }
    if (f.password.length < 6) { setErr('Mật khẩu tối thiểu 6 ký tự.'); return }
    setBusy(true)
    const { error } = await signUp({ name: f.name.trim(), phone: f.phone, cccd: f.cccd, password: f.password })
    if (error) { setBusy(false); setErr(error); return }
    const res = await signIn(f.phone, f.password)
    setBusy(false)
    if (res.error) { nav('/login', { replace: true }); return }
    nav('/', { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-white mx-auto max-w-[480px]">
      <header className="safe-top bg-brand-800 text-white flex items-center gap-2 px-3 py-3.5">
        <button onClick={() => nav('/login')} className="p-1 -ml-1"><ChevronLeft size={24} /></button>
        <h1 className="text-[15px] font-bold">Đăng ký tài khoản</h1>
      </header>

      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 flex flex-col gap-4">
        <Field label="Họ tên" value={f.name} onChange={v => set('name', v)} placeholder="Nguyễn Văn A" />
        <Field label="Số điện thoại (tài khoản đăng nhập)" value={f.phone}
          onChange={v => set('phone', digitsOnly(v).slice(0, 10))}
          placeholder="0987654321" inputMode="numeric" maxLength={10}
          hint="Dùng số này để đăng nhập" />
        <Field label="Số CCCD" value={f.cccd}
          onChange={v => set('cccd', digitsOnly(v).slice(0, 12))}
          placeholder="0123456789xx" inputMode="numeric" maxLength={12}
          hint="12 số (CMND cũ: 9 số) — để làm thủ tục tại depot" />

        <div>
          <label className="text-[12px] font-semibold text-ink-600">Mật khẩu</label>
          <div className="mt-1.5 relative">
            <input
              value={f.password} onChange={e => set('password', e.target.value)}
              type={show ? 'text' : 'password'} placeholder="Tối thiểu 6 ký tự"
              className="w-full h-12 px-4 pr-11 rounded-xl border border-ink-200 bg-ink-50 text-[15px] outline-none focus:border-brand-500 focus:bg-white transition"
            />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {err && <div className="text-[12.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

        <button type="submit" disabled={busy}
          className="h-12 rounded-xl bg-brand-700 text-white font-bold text-[15px] active:bg-brand-800 disabled:opacity-60 transition mt-2">
          {busy ? 'Đang tạo tài khoản…' : 'Đăng ký'}
        </button>

        <p className="text-center text-[12px] text-ink-400">
          Đã có tài khoản? <button type="button" onClick={() => nav('/login')} className="text-brand-700 font-semibold">Đăng nhập</button>
        </p>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, inputMode, maxLength, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
  inputMode?: 'numeric' | 'tel' | 'text'; maxLength?: number; hint?: string
}) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-ink-600">{label}</label>
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        inputMode={inputMode} maxLength={maxLength}
        className="mt-1.5 w-full h-12 px-4 rounded-xl border border-ink-200 bg-ink-50 text-[15px] outline-none focus:border-brand-500 focus:bg-white transition"
      />
      {hint && <p className="text-[10.5px] text-ink-400 mt-1 px-1">{hint}</p>}
    </div>
  )
}
