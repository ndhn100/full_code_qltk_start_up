// src/pages/ThanhVien/ThanhVien.jsx
import { useState, useEffect, useCallback } from 'react'
import Toast from '../../components/Toast'
import TaoTaiKhoan from './TaoTaiKhoan'
import ChinhSuaTaiKhoan from './ChinhSuaTaiKhoan'
import PhanCongSoanDeCuong from './PhanCongSoanDeCuong'
import {
  memberGetList,
  memberDelete,
  memberBulkSendEmail,
  memberBulkRevoke,
} from '../../services/memberService'

const STATUS_MAP = {
  'Hoạt động':  'Hoạt động',
  'Đã thu hồi': 'Đã thu hồi',
  'Không có':   'Không có',
  active:   'Hoạt động',
  Active:   'Hoạt động',
  revoked:  'Đã thu hồi',
  Revoked:  'Đã thu hồi',
  inactive: 'Không có',
  Inactive: 'Không có',
  1: 'Hoạt động',
  2: 'Đã thu hồi',
  0: 'Không có',
}

const normalizeStatus = (raw) => STATUS_MAP[raw] ?? raw ?? 'Không có'

const normalizeMember = (item, idx) => ({
  id:          item.id,
  stt:         String(idx + 1).padStart(2, '0'),
  tenDangNhap: item.username         ?? '',
  hoTen:       item.fullName         ?? '',
  email:       item.email            ?? '',
  trangThai:   normalizeStatus(item.status),
  phanCong:    item.phanCong         ?? 'Chưa có',
  hocHam:      item.hocHam           ?? '',
  hocVi:       item.hocVi            ?? '',
  chuyenMon:   item.trinhDoChuyenMon ?? '',
  roleId:      item.roleId           ?? item.role_id   ?? 0,
  roleName:    item.roleName         ?? item.role      ?? '',
})

const isRole3 = (item) => {
  const rid   = item.roleId   ?? item.role_id  ?? 0
  const rname = (item.roleName ?? item.role    ?? '').toUpperCase()
  return rid === 3 || rname === 'COMPILER'
}

const LIMIT = 10

export default function ThanhVien() {
  const [tab, setTab]                   = useState('danh-sach')
  const [allMembers, setAllMembers]     = useState([])
  const [loading, setLoading]           = useState(false)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedIds, setSelectedIds]   = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [toast, setToast]               = useState(null)
  const [page, setPage]                 = useState(1)

  const showToast = (type, msg) => setToast({ type, message: msg })

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const { ok, data } = await memberGetList()
      if (ok) {
        const items = Array.isArray(data) ? data : (data.items ?? data.data ?? [])
        const role3 = items.filter(isRole3)
        setAllMembers(role3.map(normalizeMember))
      } else {
        showToast('error', 'Không thể tải danh sách thành viên')
      }
    } catch {
      showToast('error', 'Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'danh-sach') fetchMembers()
  }, [tab, fetchMembers])

  const filtered = allMembers.filter(m => {
    const matchStatus = filterStatus === '' || m.trangThai === filterStatus
    const q = search.trim().toLowerCase()
    const matchSearch = q === ''
      || m.tenDangNhap.toLowerCase().includes(q)
      || m.hoTen.toLowerCase().includes(q)
      || m.email.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  useEffect(() => { setPage(1) }, [search, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT))
  const members    = filtered.slice((page - 1) * LIMIT, page * LIMIT)

  const handleDelete = async (m) => {
    if (!window.confirm(`Xác nhận xóa tài khoản "${m.hoTen}"?`)) return
    const { ok } = await memberDelete(m.id)
    if (ok) { showToast('success', 'Đã xóa tài khoản thành công'); fetchMembers() }
    else      showToast('error', 'Xóa tài khoản thất bại')
  }

  const handleBulkMail = async () => {
    if (!selectedIds.length) { showToast('warning', 'Chưa chọn thành viên nào'); return }
    const { ok } = await memberBulkSendEmail(selectedIds)
    if (ok) showToast('success', `Đã gửi mail cho ${selectedIds.length} thành viên`)
    else    showToast('error', 'Gửi mail thất bại')
  }

  const handleBulkRevoke = async () => {
    if (!selectedIds.length) { showToast('warning', 'Chưa chọn thành viên nào'); return }
    if (!window.confirm(`Xác nhận thu hồi quyền ${selectedIds.length} thành viên?`)) return
    const { ok, status: httpStatus, data } = await memberBulkRevoke(selectedIds)
    if (ok) {
      setSelectedIds([])
      showToast('success', 'Thu hồi quyền thành công')
      setTimeout(() => fetchMembers(), 500)
    } else {
      showToast('error', `Thu hồi quyền thất bại (HTTP ${httpStatus} – ${data?.message ?? 'Lỗi không xác định'})`)
    }
  }

  const toggleSelectAll = () =>
    setSelectedIds(prev => prev.length === members.length ? [] : members.map(m => m.id))
  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const handleSaveDone = () => { setTab('danh-sach'); fetchMembers() }

  // Sidebar items — "Tạo tài khoản" has sub-item "Biên soạn" only
  const sidebarItems = [
    { key: 'tao', label: 'Tạo tài khoản', sub: true },
    { key: 'chinh-sua', label: 'Chỉnh sửa tài khoản' },
    { key: 'phan-cong', label: 'Phân công soạn đề cương' },
  ]

  return (
    <>
      <style>{`
        .tv-page { min-height: auto; background: #f0f4f8; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2340; }
        .tv-breadcrumb { padding: 12px 32px; font-size: 13px; color: #64748b; }
        .tv-breadcrumb span { color: #005AE0; font-weight: 500; cursor: pointer; }
        .tv-layout { display: flex; gap: 20px; padding: 0 32px 32px; }

        .tv-sidebar {
          width: 180px; flex-shrink: 0;
          background: linear-gradient(180deg, #daeef9 0%, #cfe5f9 100%);
          border-radius: 12px; padding: 16px 12px;
          box-shadow: 0 2px 10px rgba(0,90,224,0.07);
          align-self: flex-start;
        }
        .tv-sidebar-title { font-size: 14px; font-weight: 800; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1.5px solid rgba(0,90,224,0.15); color: #1a2340; }
        .tv-sidebar-item {
          padding: 8px 12px; border-radius: 8px; cursor: pointer;
          font-size: 13.5px; color: #005AE0; margin-bottom: 2px;
          transition: all .18s; font-weight: 500;
        }
        .tv-sidebar-item:hover { background: rgba(0,90,224,0.08); }
        .tv-sidebar-item.active {
          background: linear-gradient(135deg, #005AE0, #00317A);
          color: #fff; font-weight: 600;
          box-shadow: 0 2px 6px rgba(0,90,224,0.2);
        }
        /* Sub-item under Tạo tài khoản */
        .tv-sub-item {
          padding: 5px 12px 5px 22px;
          font-size: 12.5px; color: #005AE0; cursor: pointer;
          border-radius: 6px; margin-bottom: 2px; transition: all .18s;
        }
        .tv-sub-item:hover { background: rgba(0,90,224,0.08); }
        .tv-sub-item.active { color: #00317A; font-weight: 700; }

        .tv-content { flex: 1; min-width: 0; }
        .tv-table-card { background: linear-gradient(160deg, #e8f3fd 0%, #cfe5f9 100%); border-radius: 14px; padding: 20px 22px; box-shadow: 0 2px 16px rgba(0,90,224,0.07); }
        .tv-controls { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; justify-content: flex-end; }
        .tv-filter-select { border: 1.5px solid #b8d8f0; border-radius: 20px; padding: 6px 12px; font-size: 13px; outline: none; background: #fff; }
        .tv-table-search { border: 1.5px solid #b8d8f0; border-radius: 20px; padding: 6px 14px; font-size: 13px; outline: none; width: 220px; background: #fff; }
        .btn-bulk-mail   { background: linear-gradient(135deg, #005AE0, #00317A); color: #fff; border: none; padding: 7px 16px; border-radius: 20px; font-size: 12px; cursor: pointer; font-weight: 600; }
        .btn-bulk-revoke { background: linear-gradient(135deg, #00317A, #005AE0); color: #fff; border: none; padding: 7px 16px; border-radius: 20px; font-size: 12px; cursor: pointer; font-weight: 600; }

        .tv-table-wrap { overflow-x: auto; border-radius: 8px; background: #fff; }
        .tv-table { width: 100%; border-collapse: collapse; }
        .tv-table thead th { text-align: left; padding: 12px 14px; background: #b8d8f0; font-size: 12px; font-weight: 700; border-bottom: 2px solid #9dc5e4; }
        .tv-table tbody td { padding: 10px 14px; font-size: 12.5px; border-bottom: 1px solid #cfe5f9; }

        .badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; display: inline-block; min-width: 80px; text-align: center; }
        .badge-active  { background: #CCFBF1; color: #0D9488; }
        .badge-revoked { background: #FFEDD5; color: #D97706; }
        .badge-none    { background: #F1F5F9; color: #64748B; }

        .icon-btn { background: none; border: none; cursor: pointer; font-size: 14px; margin-right: 5px; }

        .tv-pagination { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 14px; }
        .tv-pagination button { border: 1.5px solid #b8d8f0; background: #fff; border-radius: 8px; padding: 5px 12px; cursor: pointer; font-size: 13px; }
        .tv-pagination button:disabled { opacity: 0.4; cursor: default; }
        .tv-pagination span { font-size: 13px; color: #64748b; }

        .empty-state   { text-align: center; padding: 60px 0; color: #94a3b8; font-size: 15px; }
        .loading-state { text-align: center; padding: 40px; color: #64748b; }
      `}</style>

      <div className="tv-page">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        <div className="tv-breadcrumb">
          <span onClick={() => setTab('danh-sach')}>Trang chủ</span> &rsaquo; Danh sách thành viên
        </div>

        <div className="tv-layout">
          {/* Sidebar */}
          <div className="tv-sidebar">
            <div className="tv-sidebar-title">Nội dung</div>

            {/* Tạo tài khoản */}
            <div
              className={`tv-sidebar-item${tab === 'tao' ? ' active' : ''}`}
              onClick={() => setTab('tao')}
            >
              Tạo tài khoản
            </div>
            {/* Sub-item: Biên soạn (only) */}
            <div
              className={`tv-sub-item${tab === 'tao' ? ' active' : ''}`}
              onClick={() => setTab('tao')}
            >
              Biên soạn
            </div>

            {/* Chỉnh sửa tài khoản */}
            <div
              className={`tv-sidebar-item${tab === 'chinh-sua' ? ' active' : ''}`}
              onClick={() => setTab('chinh-sua')}
              style={{ marginTop: 4 }}
            >
              Chỉnh sửa tài khoản
            </div>

            {/* Phân công soạn đề cương */}
            <div
              className={`tv-sidebar-item${tab === 'phan-cong' ? ' active' : ''}`}
              onClick={() => setTab('phan-cong')}
              style={{ marginTop: 4 }}
            >
              Phân công soạn đề cương
            </div>
          </div>

          {/* Content */}
          <div className="tv-content">
            {tab === 'danh-sach' && (
              loading ? (
                <div className="loading-state">Đang tải...</div>
              ) : (
                <div className="tv-table-card">
                  <div className="tv-controls">
                    <select className="tv-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                      <option value="">Trạng thái</option>
                      <option value="Hoạt động">Hoạt động</option>
                      <option value="Đã thu hồi">Đã thu hồi</option>
                      <option value="Không có">Không có</option>
                    </select>
                    <input className="tv-table-search" placeholder="🔍 Tìm kiếm" value={search} onChange={e => setSearch(e.target.value)} />
                    <button className="btn-bulk-mail"   onClick={handleBulkMail}>Gửi mail</button>
                    <button className="btn-bulk-revoke" onClick={handleBulkRevoke}>Thu hồi</button>
                  </div>

                  {members.length === 0 ? (
                    <div className="empty-state">Chưa có thành viên biên soạn nào</div>
                  ) : (
                    <>
                      <div className="tv-table-wrap">
                        <table className="tv-table">
                          <thead>
                            <tr>
                              <th>
                                <input type="checkbox"
                                  checked={selectedIds.length === members.length && members.length > 0}
                                  onChange={toggleSelectAll}
                                />
                              </th>
                              {['STT', 'ID', 'Tên đăng nhập', 'Họ tên người dùng', 'Hành động', 'Trạng thái', 'Email', 'Phân công'].map(h => (
                                <th key={h}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {members.map(m => (
                              <tr key={m.id}>
                                <td><input type="checkbox" checked={selectedIds.includes(m.id)} onChange={() => toggleSelect(m.id)} /></td>
                                <td>{m.stt}</td>
                                <td style={{ color: '#64748b', fontSize: '11px' }}>{m.id}</td>
                                <td>{m.tenDangNhap}</td>
                                <td>{m.hoTen}</td>
                                <td>
                                  <button className="icon-btn" style={{ color: '#10B981' }} onClick={() => { setSelectedMember(m); setTab('chinh-sua') }}>📝</button>
                                  <button className="icon-btn" style={{ color: '#EF4444' }} onClick={() => handleDelete(m)}>🗑️</button>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    m.trangThai === 'Hoạt động'  ? 'badge-active'  :
                                    m.trangThai === 'Đã thu hồi' ? 'badge-revoked' : 'badge-none'
                                  }`}>
                                    {m.trangThai}
                                  </span>
                                </td>
                                <td style={{ color: '#005AE0', textDecoration: 'underline' }}>{m.email}</td>
                                <td>
                                  {m.phanCong === 'Chưa có'
                                    ? m.phanCong
                                    : <span style={{ color: '#005AE0', borderBottom: '1px solid #005AE0' }}>{m.phanCong}</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="tv-pagination">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Trước</button>
                        <span>Trang {page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Sau →</button>
                      </div>
                    </>
                  )}
                </div>
              )
            )}

            {tab === 'tao'       && <TaoTaiKhoan onSave={handleSaveDone} onCancel={() => setTab('danh-sach')} showToast={showToast} />}
            {tab === 'chinh-sua' && <ChinhSuaTaiKhoan member={selectedMember} danhSach={allMembers} onSave={handleSaveDone} onCancel={() => setTab('danh-sach')} showToast={showToast} />}
            {tab === 'phan-cong' && <PhanCongSoanDeCuong onSave={handleSaveDone} onCancel={() => setTab('danh-sach')} showToast={showToast} />}
          </div>
        </div>
      </div>
    </>
  )
}