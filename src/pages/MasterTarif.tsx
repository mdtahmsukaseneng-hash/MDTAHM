import { useState, useEffect } from 'react';
import { fetchTarif, tambahTarif, editTarif, hapusTarif } from '../api';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';

const MasterTarif = () => {
  const [tarifList, setTarifList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [idTarif, setIdTarif] = useState('');
  const [jenisPembayaran, setJenisPembayaran] = useState('');
  const [nominal, setNominal] = useState('');
  const [targetKelas, setTargetKelas] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchTarif();
    
    // Kelompokkan SPP
    const groupedData: any[] = [];
    let sppItem: any = null;

    data.forEach((t: any) => {
      if (t.Jenis_Pembayaran && t.Jenis_Pembayaran.toUpperCase().includes('SPP')) {
        if (!sppItem) {
          sppItem = { 
            ...t, 
            Jenis_Pembayaran: 'SPP (Semua Bulan)', 
            ID_Tarif: 'GRP-SPP',
            Target_Kelas: '' 
          };
          groupedData.push(sppItem);
        }
      } else {
        groupedData.push(t);
      }
    });

    setTarifList(groupedData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setIsEditMode(false);
    setIdTarif('');
    setJenisPembayaran('');
    setNominal('');
    setTargetKelas('');
    setShowForm(false);
  };

  const handleEditClick = (t: any) => {
    setIsEditMode(true);
    setIdTarif(t.ID_Tarif || '');
    setJenisPembayaran(t.Jenis_Pembayaran || '');
    setNominal(t.Nominal || '');
    setTargetKelas(t.Target_Kelas || '');
    setShowForm(true);
  };

  const handleDeleteClick = async (t: any) => {
    if (window.confirm(`Yakin ingin menghapus tarif ${t.Jenis_Pembayaran}?`)) {
      await hapusTarif({ ID_Tarif: t.ID_Tarif });
      loadData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload = {
      ID_Tarif: idTarif,
      Jenis_Pembayaran: jenisPembayaran,
      Nominal: Number(nominal) || 0,
      Target_Kelas: targetKelas
    };

    let result;
    if (isEditMode) {
      result = await editTarif(payload);
    } else {
      result = await tambahTarif(payload);
    }

    setIsSaving(false);
    if (result && result.status === 'success') {
      resetForm();
      loadData();
    } else {
      alert('Gagal menyimpan data: ' + (result?.message || 'Error tidak diketahui'));
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  };

  if (isLoading) {
    return (
      <div>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-subtitle"></div>
        <div className="skeleton skeleton-table"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Master Tarif</h1>
          <p className="page-subtitle">Kelola jenis pembayaran dan nominal iuran tahunan</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Tambah Tarif Baru
          </button>
        )}
      </div>



      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID Tarif</th>
              <th>Jenis Pembayaran</th>
              <th>Nominal Pertahun</th>
              <th>Target Kelas</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tarifList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  Data tarif kosong atau gagal dimuat dari Spreadsheet.
                </td>
              </tr>
            ) : (
              tarifList.map((t, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{t.ID_Tarif}</td>
                  <td>{t.Jenis_Pembayaran}</td>
                  <td>
                    {t.Nominal === 0 || t.Nominal === '' || t.Nominal === '0' ? (
                      <span className="badge badge-warning">Tidak Ada</span>
                    ) : (
                      formatRupiah(t.Nominal)
                    )}
                  </td>
                  <td>
                    {t.Target_Kelas ? (
                      <span className="badge badge-primary" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                        Kelas {t.Target_Kelas}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Semua Kelas</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex" style={{ gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem' }} 
                        onClick={() => handleEditClick(t)}
                        title="Edit Tarif"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-color)', borderColor: '#fecaca' }} 
                        onClick={() => handleDeleteClick(t)}
                        title="Hapus Tarif"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="card" style={{ 
            width: '100%', maxWidth: '600px', 
            borderTop: '4px solid var(--primary-color)',
            animation: 'fadeIn 0.2s ease-out' 
          }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {isEditMode ? 'Edit Tarif Pembayaran' : 'Tambah Tarif Pembayaran Baru'}
              </h3>
              <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none' }} onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-6">
                <div className="form-group">
                  <label>ID Tarif (Kode Unik)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={idTarif} 
                    onChange={(e) => setIdTarif(e.target.value)} 
                    required 
                    disabled={isEditMode}
                    placeholder="Misal: TRF-01"
                    style={{ backgroundColor: isEditMode ? '#f1f5f9' : 'white' }}
                  />
                  {isEditMode && <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>*ID tidak bisa diubah</small>}
                </div>
                <div className="form-group">
                  <label>Jenis Pembayaran (Nama Iuran)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={jenisPembayaran} 
                    onChange={(e) => setJenisPembayaran(e.target.value)} 
                    required 
                    placeholder="Misal: SPP, Kitab, Daftar"
                  />
                </div>
                <div className="form-group">
                  <label>Nominal Pertahun (Rp)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={nominal} 
                    onChange={(e) => setNominal(e.target.value)} 
                    required 
                    placeholder="Isi 0 jika nominalnya 'Tidak Ada'"
                  />
                </div>
                <div className="form-group">
                  <label>Target Kelas (Opsional)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={targetKelas} 
                    onChange={(e) => setTargetKelas(e.target.value)} 
                    placeholder="Misal: 3 atau 1,2,3,4,5 (Kosongkan jika semua)"
                  />
                </div>
              </div>

              <div className="flex" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={resetForm}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Tarif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default MasterTarif;
