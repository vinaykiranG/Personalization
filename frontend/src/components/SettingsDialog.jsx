import React, { useEffect, useState } from 'react'
import { getLatestSettings, getAllSettings, updateSettings, deleteSetting, uploadLogo } from '../services/appSettingsService'

export default function SettingsDialog({ userId, onClose, onSaved, current }) {
  const [form, setForm] = useState({ brandName: current.brandName || '', primaryColor: current.primaryColor || '#000000', logoUrl: current.logoUrl || '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const latest = await getLatestSettings(userId)
        if (latest) setForm({ brandName: latest.brandName, primaryColor: latest.primaryColor, logoUrl: latest.logoUrl || '' })
      } catch {}
      try {
        const all = await getAllSettings(userId)
        setSaved(all)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [userId])

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const allowed = ['image/png', 'image/jpeg']
    if (!allowed.includes(f.type)) { setError('Only PNG or JPEG allowed'); return }
    if (f.size > 2 * 1024 * 1024) { setError('File must be <= 2MB'); return }
    setError('')
    setFile(f)
  }

  const save = async () => {
    setLoading(true); setError('')
    try {
      let logoUrl = form.logoUrl
      if (file) {
        const up = await uploadLogo(userId, file)
        logoUrl = up.logoUrl
      }
      const payload = { brandName: form.brandName.trim(), primaryColor: form.primaryColor, logoUrl }
      const savedDoc = await updateSettings(userId, payload)
      onSaved(savedDoc)
      const all = await getAllSettings(userId)
      setSaved(all)
      onClose()
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id) => {
    try {
      await deleteSetting(userId, id)
      setSaved(saved.filter(s => s.id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={{display:'flex', alignItems:'center'}}>
          <h3 style={{margin:0}}>App Settings</h3>
          <button onClick={onClose} style={{marginLeft:'auto'}}>✖</button>
        </div>
        <div style={{display:'grid', gap:12, marginTop:12}}>
          <label>
            <div>Brand Name</div>
            <input value={form.brandName} maxLength={50} onChange={e=> setForm({...form, brandName: e.target.value})} />
          </label>
          <label>
            <div>Primary Color</div>
            <input type="color" value={form.primaryColor} onChange={e=> setForm({...form, primaryColor: e.target.value})} />
          </label>
          <label>
            <div>Logo Upload</div>
            <input type="file" accept="image/png,image/jpeg" onChange={onFile} />
            {form.logoUrl ? <img src={form.logoUrl} alt="logo" style={{height:40, marginTop:8}}/>: null}
          </label>
        </div>
        {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
        <div style={{display:'flex', gap:8, marginTop:12}}>
          <button onClick={save} disabled={loading}>{loading? 'Saving...' : 'Save'}</button>
          <button onClick={onClose}>Cancel</button>
        </div>
        <hr />
        <h4 style={{marginTop:8}}>Saved Settings</h4>
        <div style={{display:'grid', gap:8, maxHeight:220, overflow:'auto'}}>
          {saved.map(s => (
            <div key={s.id} style={{display:'flex', alignItems:'center', gap:8, border:'1px solid #eee', padding:8, borderRadius:8}}>
              {s.logoUrl ? <img src={s.logoUrl} alt="logo" style={{height:32}}/> : <div style={{width:32}}/>}
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{s.brandName}</div>
                <div style={{display:'flex', alignItems:'center', gap:6}}>
                  <span>Color</span>
                  <span style={{width:16, height:16, background:s.primaryColor, display:'inline-block', border:'1px solid #ddd'}}></span>
                </div>
              </div>
              <button onClick={()=>remove(s.id)} title="Delete">🗑️</button>
            </div>
          ))}
          {!saved.length && <div>No saved settings yet.</div>}
        </div>
      </div>
    </div>
  )
}

const styles = {
  backdrop: { position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center' },
  modal: { background:'#fff', borderRadius:12, padding:16, width:520, maxWidth:'95vw', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}
}