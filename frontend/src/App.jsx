import React, { useState, useEffect } from 'react'
import SettingsDialog from './components/SettingsDialog.jsx'

const USER_ID_DEFAULT = 'OZ6p1jNlNkYwVeBaLPCa' // per MVP fixed user id

export default function App() {
  const [open, setOpen] = useState(false)
  const [brandName, setBrandName] = useState('App Settings')
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9')
  const [logoUrl, setLogoUrl] = useState('')
  const [userId, setUserId] = useState(USER_ID_DEFAULT)

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor)
  }, [primaryColor])

  const applyBranding = (settings) => {
    if (settings.brandName) setBrandName(settings.brandName)
    if (settings.primaryColor) setPrimaryColor(settings.primaryColor)
    if (settings.logoUrl !== undefined) setLogoUrl(settings.logoUrl)
  }

  return (
    <div>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        background: 'var(--primary-color)', color: 'white'
      }}>
        {logoUrl ? <img src={logoUrl} alt="logo" style={{height: 32}}/> : null}
        <h1 style={{margin: 0, fontSize: 18}}>{brandName}</h1>
        <div style={{marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center'}}>
          <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="user id" style={{padding: 6}}/>
          <button onClick={() => setOpen(true)} title="Settings" style={{padding: '6px 10px'}}>⚙️</button>
        </div>
      </header>

      <main style={{padding: 16}}>
        <p>Personalization demo. Click the settings icon to configure brand name, logo and primary color.</p>
      </main>

      {open && (
        <SettingsDialog
          userId={userId}
          onClose={() => setOpen(false)}
          onSaved={(s) => applyBranding(s)}
          current={{ brandName, primaryColor, logoUrl }}
        />
      )}
    </div>
  )
}