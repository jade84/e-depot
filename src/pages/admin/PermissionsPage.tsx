import { useState } from 'react'
import { X, Check, Loader2, ShieldAlert, UserCog, Shield } from 'lucide-react'
import { ScreenHeader } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import { useAllUsers, useUpdateUserAccess, type AdminUser } from '../../features/users'
import { PERMISSIONS } from '../../lib/permissions'

const ROLES = [
  { value: 'admin', label: 'Toàn quyền', desc: 'Tất cả chức năng quản trị' },
  { value: 'staff', label: 'Nhân viên', desc: 'Chỉ các quyền được chọn bên dưới' },
  { value: 'driver', label: 'Nhà xe', desc: 'Người dùng thường, không quản trị' },
]

function roleBadge(role: string) {
  if (role === 'admin') return { label: 'Toàn quyền', cls: 'bg-brand-100 text-brand-700' }
  if (role === 'staff') return { label: 'Nhân viên', cls: 'bg-sky-100 text-sky-700' }
  return { label: 'Nhà xe', cls: 'bg-ink-100 text-ink-500' }
}

export function PermissionsPage() {
  const { can, profile } = useAuth()
  const { data: users, isLoading } = useAllUsers()
  const [editing, setEditing] = useState<AdminUser | null>(null)

  if (!can('permissions')) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Phân quyền" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-ink-500">
            <ShieldAlert size={40} className="mx-auto mb-2 text-ink-300" />
            <div className="text-[14px] font-semibold">Bạn không có quyền phân quyền</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Phân quyền nhân sự" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-2">
        <p className="text-[11px] text-ink-400 px-1 leading-snug">
          Cấp quyền quản trị cho từng tài khoản. <b>Toàn quyền</b> dùng được mọi chức năng; <b>Nhân viên</b> chỉ dùng các quyền được tick.
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10"><Loader2 size={18} className="animate-spin" /> Đang tải…</div>
        ) : (users?.length ?? 0) === 0 ? (
          <div className="text-center text-ink-400 text-[13px] py-10">Chưa có tài khoản.</div>
        ) : (
          users!.map(u => {
            const rb = roleBadge(u.role)
            const isMe = u.id === profile?.id
            return (
              <button key={u.id} onClick={() => setEditing(u)}
                className="w-full bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 text-left active:bg-ink-50">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  {u.role === 'driver' ? <UserCog size={17} className="text-ink-400" /> : <Shield size={17} className="text-brand-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-ink-800 truncate">
                    {u.name || u.phone}{isMe && <span className="text-[11px] text-ink-400 font-normal"> (bạn)</span>}
                  </div>
                  <div className="text-[11.5px] text-ink-400">{u.phone}{u.role === 'staff' && u.perms.length ? ` · ${u.perms.length} quyền` : ''}</div>
                </div>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${rb.cls}`}>{rb.label}</span>
              </button>
            )
          })
        )}
        <div className="pb-6" />
      </div>

      {editing && <AccessEditor user={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function AccessEditor({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const save = useUpdateUserAccess()
  const [role, setRole] = useState(user.role)
  const [perms, setPerms] = useState<string[]>(user.perms)
  const [err, setErr] = useState('')

  const toggle = (k: string) => setPerms(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])

  async function onSave() {
    setErr('')
    try {
      // role admin = full quyền → perms để trống; driver → xoá quyền.
      const finalPerms = role === 'staff' ? perms : []
      await save.mutateAsync({ id: user.id, role, perms: finalPerms })
      onClose()
    } catch (e) {
      setErr('Lỗi lưu: ' + (e as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-4 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-ink-800 truncate">{user.name || user.phone}</h2>
          <button onClick={onClose} className="p-1 text-ink-400"><X size={22} /></button>
        </div>

        <label className="text-[12px] font-semibold text-ink-600">Vai trò</label>
        <div className="mt-1.5 space-y-2">
          {ROLES.map(r => (
            <button key={r.value} type="button" onClick={() => setRole(r.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition ${
                role === r.value ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-ink-50'
              }`}>
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${role === r.value ? 'border-brand-600 bg-brand-600' : 'border-ink-300'}`} />
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-ink-800">{r.label}</div>
                <div className="text-[11px] text-ink-400">{r.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {role === 'staff' && (
          <div className="mt-4">
            <label className="text-[12px] font-semibold text-ink-600">Quyền chi tiết</label>
            <div className="mt-1.5 space-y-1.5">
              {PERMISSIONS.map(p => (
                <label key={p.key} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-ink-50 border border-ink-100">
                  <input type="checkbox" checked={perms.includes(p.key)} onChange={() => toggle(p.key)}
                    className="w-4 h-4 accent-brand-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-ink-700">{p.label}</div>
                    <div className="text-[10.5px] text-ink-400">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {err && <div className="mt-3 text-[12.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

        <button onClick={onSave} disabled={save.isPending}
          className="w-full h-12 mt-4 rounded-xl bg-brand-700 text-white font-bold text-[15px] active:bg-brand-800 disabled:opacity-60 flex items-center justify-center gap-2">
          {save.isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Lưu quyền
        </button>
        <div className="pb-4" />
      </div>
    </div>
  )
}
