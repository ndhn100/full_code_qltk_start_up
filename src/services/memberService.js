// src/services/memberService.js
const BASE_URL = 'https://startup-backend-production-191b.up.railway.app';
const getToken = () => sessionStorage.getItem("token") || "";

const authFetch = (path, options = {}) =>
  fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

// Luôn truyền roleId=3 để chỉ lấy tài khoản Biên soạn
export async function memberGetList() {
  const res = await authFetch("/manager/members?roleId=3");
  const json = await res.json().catch(() => ({}));
  const data = json.data ?? json;
  return { ok: res.ok, status: res.status, data };
}

export async function memberGetById(id) {
  const res = await authFetch(`/manager/members/${id}`);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function memberCreate(payload) {
  const res = await authFetch("/manager/members", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function memberUpdate(id, payload) {
  const res = await authFetch(`/manager/members/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function memberDelete(id) {
  const res = await authFetch(`/manager/members/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function memberBulkSendEmail(ids) {
  const res = await authFetch("/manager/members/bulk-send-email", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function memberBulkRevoke(ids) {
  const res = await authFetch("/manager/members/bulk-revoke", {
    method: "PATCH",
    body: JSON.stringify({ accountIds: ids }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok || res.status === 204, status: res.status, data };
}