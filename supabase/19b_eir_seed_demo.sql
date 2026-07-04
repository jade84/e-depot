-- ============================================================
-- e-Depot — DỮ LIỆU MẪU phiếu EIR để chạy thử tab "Tra cứu".
-- Chạy SAU 19_eir.sql. Xoá sau khi test: delete from public.eir where id in (...);
-- ============================================================

insert into public.eir (id, so_phieu, container_no, bien_so, ngay, tinh_trang, fields_json, created_at)
values ('9cb63749d072f74d6ed2d061a4f8472b', 'GRL-02742562', 'VIMU6243702', '51D38453', '03/07/2026', 'OUT',
       '{"khach_hang": "ACECOOK", "so_xe": "51D38453", "do_bn_ref": "VC032607SGNDAN0030", "ngay": "03/07/2026", "so_dt": "0906951140", "container_no": "VIMU6243702", "operator": "VMC/VMC", "tau_chuyen": "BIENDONG NAVIGATOR / NB2625N", "kich_co": "4500", "trang_thai": "A", "act_cy": "G", "so_phieu": "GRL-02742562", "time_in": "03/07/26 20:43:38", "time_out": "03/07/2026 22:19:55", "seal": "009181", "cang_do": "VNDAN", "ghi_chu": "OK", "loai": "OUT", "nhan_vien": "Trần Tuấn Sơn", "tau": "BIENDONG NAVIGATOR", "chuyen": "NB2625N", "bien_so": "51D38453", "tinh_trang": "OUT"}'::jsonb, now())
on conflict (id) do nothing;

insert into public.eir (id, so_phieu, container_no, bien_so, ngay, tinh_trang, fields_json, created_at)
values ('63a6ce460616c4696f55bce6159e1cec', 'GRL-02741636', 'VIMU6243702', '50E40865', '03/07/2026', 'IN',
       '{"khach_hang": "HH QUOC TE VN", "so_xe": "50E40865", "ngay": "03/07/2026", "so_dt": "1", "container_no": "VIMU6243702", "operator": "VMC/VMC", "kich_co": "4500", "trang_thai": "A", "act_cy": "G", "trong_luong": "32.500", "so_phieu": "GRL-02741636", "time_in": "03/07/26 05:37:21", "time_out": "03/07/2026 05:41:23", "ghi_chu": "rửa nước, tôn vách dơ bẩn tạo vết 20 m2 ixxx", "loai": "IN", "nhan_vien": "Trần Tuấn Sơn", "bien_so": "50E40865", "tinh_trang": "IN"}'::jsonb, now())
on conflict (id) do nothing;
