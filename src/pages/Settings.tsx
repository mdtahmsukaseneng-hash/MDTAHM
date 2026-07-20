import { useState, useEffect } from 'react';
import { Save, Database, AlertCircle, User } from 'lucide-react';
import { getGasUrl, setGasUrl, getKasirName, setKasirName } from '../api';

const Settings = () => {
  const [url, setUrl] = useState('');
  const [kasirName, setKasirNameState] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load existing URL on mount
    setUrl(getGasUrl());
    setKasirNameState(getKasirName());
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setGasUrl(url);
    setKasirName(kasirName);
    
    setTimeout(() => {
      setIsSaving(false);
      alert('Pengaturan berhasil disimpan!');
    }, 500);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pengaturan Sistem</h1>
        <p className="page-subtitle">Konfigurasi koneksi database dan preferensi aplikasi</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <Database size={20} className="text-primary" style={{ color: 'var(--primary-color)' }} />
            Koneksi Google Apps Script
          </h2>
          
          <div style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Penting:</strong> URL ini menghubungkan aplikasi ke Google Sheet Anda. Jangan ubah URL ini kecuali Anda telah men-deploy ulang Apps Script dan mendapatkan URL Web App yang baru. Kesalahan pada URL akan membuat aplikasi tidak dapat membaca atau menyimpan data.
            </div>
          </div>

          <div className="form-group">
            <label>URL Web App (Google Apps Script)</label>
            <input 
              type="text" 
              className="form-control" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <User size={20} className="text-primary" style={{ color: 'var(--primary-color)' }} />
            Identitas Petugas (Kasir)
          </h2>
          
          <div className="form-group">
            <label>Nama Petugas / Kasir</label>
            <input 
              type="text" 
              className="form-control" 
              value={kasirName}
              onChange={(e) => setKasirNameState(e.target.value)}
              placeholder="Masukkan nama petugas/kasir yang menggunakan perangkat ini"
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
              Nama ini akan dicetak pada nota pembayaran dan dicatat di laporan penerimaan kas.
            </small>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
