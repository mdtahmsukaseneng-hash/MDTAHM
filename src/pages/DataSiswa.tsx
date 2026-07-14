import { useState, useEffect } from 'react';
import { Search, Plus, Download, Edit, X } from 'lucide-react';
import { fetchSiswa, tambahSiswa, editSiswa } from '../api';

const DataSiswa = ({ statusFilter = 'Aktif' }: { statusFilter?: 'Aktif' | 'Nonaktif' }) => {
  const [showForm, setShowForm] = useState(false);
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editNis, setEditNis] = useState('');

  // State for Form
  const [formData, setFormData] = useState({
    NIS: '',
    NISN: '',
    NIK: '',
    Nama_Lengkap: '',
    Tempat_Lahir: '',
    Tanggal_Lahir: '',
    Jenis_Kelamin: 'L',
    Kelas: '',
    Status: 'Aktif',
    NIK_Ayah: '',
    Nama_Ayah: '',
    NIK_Ibu: '',
    Nama_Ibu: '',
    Pekerjaan_Ortu: '',
    No_HP: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchSiswa();
    if (statusFilter === 'Aktif') {
      setSiswaList(data.filter((s: any) => s.Status === 'Aktif' || !s.Status));
    } else {
      setSiswaList(data.filter((s: any) => s.Status !== 'Aktif' && s.Status));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditClick = (siswa: any) => {
    // Populate form with existing data
    setFormData({
      NIS: siswa.NIS || '',
      NISN: siswa.NISN || '',
      NIK: siswa.NIK || '',
      Nama_Lengkap: siswa.Nama_Lengkap || '',
      Tempat_Lahir: siswa.Tempat_Lahir || '',
      Tanggal_Lahir: siswa.Tanggal_Lahir || '',
      Jenis_Kelamin: siswa.Jenis_Kelamin || 'L',
      Kelas: siswa.Kelas || '',
      Status: siswa.Status || 'Aktif',
      NIK_Ayah: siswa.NIK_Ayah || '',
      Nama_Ayah: siswa.Nama_Ayah || '',
      NIK_Ibu: siswa.NIK_Ibu || '',
      Nama_Ibu: siswa.Nama_Ibu || '',
      Pekerjaan_Ortu: siswa.Pekerjaan_Ortu || '',
      No_HP: siswa.No_HP || ''
    });
    setEditNis(siswa.NIS);
    setIsEditing(true);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditNis('');
    setFormData({
      NIS: '', NISN: '', NIK: '', Nama_Lengkap: '', Tempat_Lahir: '',
      Tanggal_Lahir: '', Jenis_Kelamin: 'L', Kelas: '', Status: 'Aktif',
      NIK_Ayah: '', Nama_Ayah: '', NIK_Ibu: '', Nama_Ibu: '', Pekerjaan_Ortu: '', No_HP: ''
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    
    let res;
    if (isEditing) {
      res = await editSiswa(formData);
    } else {
      res = await tambahSiswa(formData);
    }

    if (res && res.status === 'success') {
      alert(`Berhasil: ${res.data || 'Disimpan'}`);
      cancelEdit(); // Reset everything
      loadData(); // Refresh table
    } else {
      alert('Gagal: ' + (res?.message || 'Terjadi kesalahan'));
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-subtitle"></div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div className="skeleton" style={{ height: '40px', width: '150px' }}></div>
          <div className="skeleton" style={{ height: '40px', width: '200px' }}></div>
        </div>
        <div className="skeleton skeleton-table"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">{statusFilter === 'Aktif' ? 'Data Siswa (Aktif)' : 'Data Siswa Nonaktif'}</h1>
          <p className="page-subtitle">{statusFilter === 'Aktif' ? 'Kelola data biodata siswa dan orang tua' : 'Daftar siswa yang telah keluar, pindah, atau lulus'}</p>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', flex: 1 }}>
            <Download size={18} /> Export EMIS
          </button>
          {!showForm && (
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setIsEditing(false);
                setShowForm(true);
              }}
              style={{ flex: 1, padding: '0.5rem 1rem' }}
            >
              <Plus size={18} /> Tambah Siswa Baru
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
             <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
               {isEditing ? `Edit Data Siswa: ${editNis}` : 'Formulir Siswa Baru'}
             </h2>
             <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
               <X size={24} />
             </button>
          </div>

          <form className="grid grid-cols-2 gap-6" onSubmit={handleSubmit}>
            <div>
              <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontWeight: 600 }}>Data Pribadi Santri</h3>
              
              <div className="form-group">
                <label>NIS (Nomor Induk Santri)</label>
                <input type="text" name="NIS" value={formData.NIS} onChange={handleInputChange} className="form-control" placeholder="Contoh: 1203001" required readOnly={isEditing} style={{ backgroundColor: isEditing ? '#f1f5f9' : 'white' }} />
                {isEditing && <small style={{ color: 'var(--text-muted)' }}>*NIS tidak dapat diubah</small>}
              </div>
              <div className="form-group">
                <label>NISN</label>
                <input type="text" name="NISN" value={formData.NISN} onChange={handleInputChange} className="form-control" placeholder="Nomor Induk Siswa Nasional" />
              </div>
              <div className="form-group">
                <label>NIK Siswa</label>
                <input type="text" name="NIK" value={formData.NIK} onChange={handleInputChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input type="text" name="Nama_Lengkap" value={formData.Nama_Lengkap} onChange={handleInputChange} className="form-control" required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="form-group">
                  <label>Tempat Lahir</label>
                  <input type="text" name="Tempat_Lahir" value={formData.Tempat_Lahir} onChange={handleInputChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label>Tanggal Lahir</label>
                  <input type="date" name="Tanggal_Lahir" value={formData.Tanggal_Lahir} onChange={handleInputChange} className="form-control" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="form-group">
                  <label>Jenis Kelamin</label>
                  <select name="Jenis_Kelamin" value={formData.Jenis_Kelamin} onChange={handleInputChange} className="form-control">
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Kelas</label>
                  <select name="Kelas" value={formData.Kelas} onChange={handleInputChange} className="form-control" required>
                    <option value="">-- Pilih Kelas --</option>
                    <option value="1">Kelas 1</option>
                    <option value="2">Kelas 2</option>
                    <option value="3">Kelas 3</option>
                    <option value="4">Kelas 4</option>
                    <option value="5">Kelas 5</option>
                    <option value="6">Kelas 6</option>
                  </select>
                </div>
              </div>
              
              {isEditing && (
                 <div className="form-group">
                   <label>Status Santri</label>
                   <select name="Status" value={formData.Status} onChange={handleInputChange} className="form-control" style={{ border: '1px solid var(--warning-color)' }}>
                     <option value="Aktif">Aktif</option>
                     <option value="Lulus">Lulus</option>
                     <option value="Keluar">Keluar / Berhenti</option>
                   </select>
                 </div>
              )}
            </div>

            <div>
              <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontWeight: 600 }}>Data Orang Tua / Wali</h3>
              
              <div className="form-group">
                <label>NIK Ayah</label>
                <input type="text" name="NIK_Ayah" value={formData.NIK_Ayah} onChange={handleInputChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>Nama Ayah</label>
                <input type="text" name="Nama_Ayah" value={formData.Nama_Ayah} onChange={handleInputChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>NIK Ibu</label>
                <input type="text" name="NIK_Ibu" value={formData.NIK_Ibu} onChange={handleInputChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>Nama Ibu</label>
                <input type="text" name="Nama_Ibu" value={formData.Nama_Ibu} onChange={handleInputChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>Pekerjaan Utama Orang Tua</label>
                <input type="text" name="Pekerjaan_Ortu" value={formData.Pekerjaan_Ortu} onChange={handleInputChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>Nomor HP/WA yang bisa dihubungi</label>
                <input type="text" name="No_HP" value={formData.No_HP} onChange={handleInputChange} className="form-control" />
              </div>
            </div>
            
            <div style={{ gridColumn: 'span 2', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
               <button type="button" className="btn btn-outline" onClick={cancelEdit}>Batal</button>
               <button type="submit" className="btn btn-primary" disabled={isSaving}>
                 {isSaving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan ke Database')}
               </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2" style={{ width: '100%', maxWidth: '400px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Cari berdasarkan Nama atau NIS..." 
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>NIS</th>
                  <th>Nama Lengkap</th>
                  <th>Kelas</th>
                  <th>Nama Ayah</th>
                  <th>Nama Ibu</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
                ) : siswaList.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center' }}>Belum ada data siswa</td></tr>
                ) : (
                  siswaList.map((siswa, idx) => (
                    <tr key={idx}>
                      <td>{siswa.NIS}</td>
                      <td style={{ fontWeight: 500, color: siswa.Status === 'Keluar' || siswa.Status === 'Lulus' ? 'var(--text-muted)' : 'inherit' }}>
                        {siswa.Nama_Lengkap}
                      </td>
                      <td>{siswa.Kelas || '-'}</td>
                      <td>{siswa.Nama_Ayah || '-'}</td>
                      <td>{siswa.Nama_Ibu || '-'}</td>
                      <td>
                        <span className={`badge ${siswa.Status === 'Aktif' ? 'badge-success' : 'badge-danger'}`}>
                          {siswa.Status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => handleEditClick(siswa)}
                        >
                          <Edit size={16} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSiswa;
