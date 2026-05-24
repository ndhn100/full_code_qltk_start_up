// src/pages/ThanhVien/TaoTaiKhoan.jsx
import { useState } from 'react'
import { memberCreate } from '../../services/memberService'

export default function TaoTaiKhoan({ onSave, onCancel, showToast }) {
  const [form, setForm] = useState({
    username:          '',
    fullName:          '',
    email:             '',
    hocHam:            '',
    hocVi:             '',
    trinhDoChuyenMon:  '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Vui lòng nhập tên đăng nhập'
    if (!form.fullName.trim()) errs.fullName = 'Vui lòng nhập họ tên'
    if (!form.email.trim())    errs.email    = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ'
    return errs
  }

  // ── POST /manager/members ─────────────────────────────────────
  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const { ok, data } = await memberCreate({
        username:         form.username,
        fullName:         form.fullName,
        email:            form.email,
        roleId:           3,                              // Quản lý thành viên – cố định
        hocHam:           form.hocHam           || undefined,
        hocVi:            form.hocVi            || undefined,
        trinhDoChuyenMon: form.trinhDoChuyenMon || undefined,
      })
      if (ok) {
        showToast('success', 'Tạo tài khoản thành công')
        onSave(data)
      } else {
        showToast('error', data?.message ?? data?.title ?? 'Tạo tài khoản thất bại')
      }
    } catch {
      showToast('error', 'Lỗi kết nối máy chủ')
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { label: 'Tên đăng nhập',       name: 'username',         type: 'text'   },
    { label: 'Họ tên người dùng',   name: 'fullName',         type: 'text'   },
    { label: 'Email liên lạc',      name: 'email',            type: 'email'  },
    { label: 'Học hàm',             name: 'hocHam',           type: 'select', optKey: 'hocHam' },
    { label: 'Học vị',              name: 'hocVi',            type: 'select', optKey: 'hocVi'  },
    { label: 'Trình độ chuyên môn', name: 'trinhDoChuyenMon', type: 'text'   },
  ]

  const options = {
    hocHam: ['Giáo sư', 'Phó giáo sư', 'Không có'],
    hocVi:  ['Tiến sĩ', 'Thạc sĩ', 'Cử nhân', 'Kỹ sư'],
  }

  return (
    <div className="form-card">
      <style>{`
        .form-card { background: linear-gradient(160deg, #e8f3fd 0%, #cfe5f9 100%); border-radius: 14px; padding: 30px 32px; box-shadow: 0 2px 16px rgba(0,90,224,0.07); }
        .form-card h2 { font-size: 20px; font-weight: 800; margin-bottom: 24px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 32px; margin-bottom: 28px; }

        .form-field label { display: block; font-size: 13.5px; font-weight: 600; margin-bottom: 6px; }
        .form-field .field-error { font-size: 11.5px; color: #EF4444; margin-top: 4px; }

        .form-field input,
        .form-select {
          width: 100%; padding: 10px 14px; border-radius: 8px;
          border: 1.5px solid #b8d8f0; outline: none; font-size: 13.5px; box-sizing: border-box;
        }
        .form-field input.has-error,
        .form-select.has-error { border-color: #EF4444; }
        .form-field input:focus, .form-select:focus { border-color: #005AE0; box-shadow: 0 0 0 3px rgba(0,90,224,0.1); }

        .form-select {
          appearance: none; background-color: #fff; cursor: pointer;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23005AE0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat; background-position: right 12px center; background-size: 16px;
        }

        .form-actions { display: flex; justify-content: flex-end; gap: 12px; }
        .btn-cancel { padding: 10px 26px; border: 1.5px solid #b8d8f0; background: #fff; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .btn-save   { padding: 10px 26px; background: linear-gradient(135deg, #005AE0, #00317A); color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <h2>Tạo tài khoản mới</h2>

      <div className="form-grid">
        {fields.map(f => (
          <div className="form-field" key={f.name}>
            <label>{f.label}</label>

            {f.type === 'select' ? (
              <select
                name={f.name}
                className={`form-select${errors[f.name] ? ' has-error' : ''}`}
                value={form[f.name]}
                onChange={handleChange}
              >
                <option value="">Chọn {f.label.toLowerCase()}</option>
                {options[f.optKey].map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                name={f.name}
                type={f.type}
                className={errors[f.name] ? 'has-error' : ''}
                value={form[f.name]}
                onChange={handleChange}
              />
            )}

            {errors[f.name] && <div className="field-error">{errors[f.name]}</div>}
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button className="btn-cancel" onClick={onCancel} disabled={saving}>Hủy</button>
        <button className="btn-save"   onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu thông tin'}
        </button>
      </div>
    </div>
  )
}