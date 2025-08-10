const BASE = (typeof import.meta !== 'undefined' ? import.meta.env.REACT_APP_BACKEND_URL : undefined) || (typeof process !== 'undefined' ? process.env.REACT_APP_BACKEND_URL : undefined)

function url(path) {
  if (!BASE) throw new Error('REACT_APP_BACKEND_URL not configured')
  return `${BASE}${path}`
}

export async function getLatestSettings(userId) {
  const res = await fetch(url(`/api/settings/${encodeURIComponent(userId)}`))
  if (res.status === 404) return null
  if (!res.ok) throw new Error((await res.json()).detail || 'Failed to load settings')
  return res.json()
}

export async function getAllSettings(userId) {
  const res = await fetch(url(`/api/settings/${encodeURIComponent(userId)}/all`))
  if (!res.ok) throw new Error((await res.json()).detail || 'Failed to list settings')
  return res.json()
}

export async function updateSettings(userId, data) {
  const res = await fetch(url(`/api/settings/${encodeURIComponent(userId)}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Failed to save settings')
  return res.json()
}

export async function deleteSetting(userId, settingId) {
  const res = await fetch(url(`/api/settings/${encodeURIComponent(userId)}/${encodeURIComponent(settingId)}`), { method: 'DELETE' })
  if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete')
  return res.json()
}

export async function uploadLogo(userId, file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(url(`/api/settings/${encodeURIComponent(userId)}/upload-logo`), { method: 'POST', body: fd })
  if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed')
  return res.json()
}