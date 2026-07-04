// Edge Function "ingest-eir" — điểm nhận phiếu EIR từ agent máy cảng.
// Thay cho server FastAPI: agent POST (multipart) vào đây -> ghi thẳng vào bảng eir.
// Dùng service_role (tự có trong edge function) nên bỏ qua RLS để INSERT được.
//
// Cấu hình khi deploy (Dashboard → Edge Functions):
//   - Verify JWT: TẮT (để agent gọi được bằng x-api-key riêng, không cần JWT Supabase)
//   - Secret:  EIR_API_KEY = <chuỗi bí mật, khớp api_key trong config.ini của agent>
//
// URL sau khi deploy:  https://<project-ref>.supabase.co/functions/v1/ingest-eir
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Xác thực bằng khoá riêng của hệ thống (không phải JWT Supabase)
  const expected = Deno.env.get('EIR_API_KEY') ?? ''
  const got = req.headers.get('x-api-key') ?? ''
  if (!expected || got !== expected) {
    return json({ error: 'Sai API key' }, 401)
  }

  // Đọc dữ liệu agent gửi (multipart/form-data): fields, raw_text, content_hash (bỏ qua file pdf)
  let fields: Record<string, unknown> = {}
  let rawText = ''
  let contentHash = ''
  try {
    const form = await req.formData()
    contentHash = String(form.get('content_hash') ?? '')
    rawText = String(form.get('raw_text') ?? '')
    try { fields = JSON.parse(String(form.get('fields') ?? '{}')) } catch { fields = {} }
  } catch {
    return json({ error: 'Body không hợp lệ' }, 400)
  }
  if (!contentHash) return json({ error: 'Thiếu content_hash' }, 400)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const f = fields as Record<string, string>
  const row = {
    id: contentHash,                       // = content_hash (chống trùng)
    so_phieu: f.so_phieu ?? null,
    container_no: f.container_no ?? null,
    bien_so: f.bien_so ?? null,
    ngay: f.ngay ?? null,
    tinh_trang: f.tinh_trang ?? null,
    fields_json: fields,
    raw_text: rawText,
  }

  // upsert ignoreDuplicates: in lại cùng nội dung -> không tạo dòng mới
  const { error } = await supabase.from('eir').upsert(row, { onConflict: 'id', ignoreDuplicates: true })
  if (error) return json({ error: error.message }, 500)

  return json({ status: 'ok', id: contentHash })
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
