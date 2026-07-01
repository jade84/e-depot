import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ship, Eye, EyeOff, Fingerprint } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { digitsOnly } from '../lib/validate'

export function LoginPage() {
  const { signIn, signInDemo, ready } = useAuth()
  const nav = useNavigate()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setBusy(true)
    const { error } = await signIn(account.trim(), password)
    setBusy(false)
    if (error) { setErr(error); return }
    nav('/', { replace: true })
  }

  function onDemo() {
    signInDemo()
    nav('/', { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-brand-800 to-brand-600 mx-auto max-w-[480px]">
      {/* Ảnh nền / logo */}
      <div className="safe-top pt-10 pb-6 flex flex-col items-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-3 backdrop-blur">
          <Ship size={34} />
        </div>
        <div className="text-2xl font-extrabold tracking-tight">e-Depot</div>
        <div className="text-[12px] text-brand-100 mt-0.5">Quản lý & vận hành container</div>
      </div>

      {/* Thẻ đăng nhập */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-7 pb-6 flex flex-col">
        <h1 className="text-xl font-bold text-ink-900">Đăng nhập</h1>
        <p className="text-[12.5px] text-ink-500 mt-1 mb-5">Sử dụng tài khoản đã đăng ký để đăng nhập</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-semibold text-ink-600">Số điện thoại</label>
            <input
              value={account}
              onChange={(e) => setAccount(digitsOnly(e.target.value).slice(0, 10))}
              inputMode="numeric"
              maxLength={10}
              placeholder="Số điện thoại đã đăng ký"
              className="mt-1.5 w-full h-12 px-4 rounded-xl border border-ink-200 bg-ink-50 text-[15px] outline-none focus:border-brand-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-ink-600">Mật khẩu</label>
            <div className="mt-1.5 relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? 'text' : 'password'}
                placeholder="Mật khẩu"
                className="w-full h-12 px-4 pr-11 rounded-xl border border-ink-200 bg-ink-50 text-[15px] outline-none focus:border-brand-500 focus:bg-white transition"
              />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {err && <div className="text-[12.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

          <button type="submit" disabled={busy}
            className="h-12 rounded-xl bg-brand-700 text-white font-bold text-[15px] active:bg-brand-800 disabled:opacity-60 transition">
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        <div className="flex items-center justify-between mt-4 text-[12.5px]">
          <button className="text-ink-500">Quên mật khẩu?</button>
          <button className="text-brand-700 font-semibold flex items-center gap-1">
            <Fingerprint size={16} /> Vân tay
          </button>
        </div>

        <div className="mt-auto pt-6">
          {!ready && (
            <button onClick={onDemo}
              className="w-full h-11 rounded-xl border-2 border-dashed border-brand-300 text-brand-700 font-semibold text-[13.5px]">
              Vào thử (demo) — xem giao diện
            </button>
          )}
          <p className="text-center text-[11px] text-ink-400 mt-3">
            Chưa có tài khoản?{' '}
            <button onClick={() => nav('/register')} className="text-brand-700 font-semibold">Đăng ký ngay</button>
          </p>
        </div>
      </div>
    </div>
  )
}
