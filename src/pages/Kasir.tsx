import { useState, useEffect } from 'react';
import { Search, Save, AlertCircle, User, CreditCard, Printer } from 'lucide-react';
import { fetchSiswa, fetchTarif, fetchTransaksi, tambahTransaksi } from '../api';

const Kasir = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<any[]>([]);
  const [showStudentListModal, setShowStudentListModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [siswaData, setSiswaData] = useState<any>(null);
  
  const [tarifList, setTarifList] = useState<any[]>([]);
  const [transaksiSiswa, setTransaksiSiswa] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  
  // Transaction State
  const [selectedTarif, setSelectedTarif] = useState('');
  const [nominal, setNominal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  


  useEffect(() => {
    // Load tarif and all students on mount for smart search
    const loadInitialData = async () => {
      setIsLoading(true);
      const [tarifData, siswaDataAll] = await Promise.all([fetchTarif(), fetchSiswa()]);
      
      // Kelompokkan SPP untuk Dropdown
      const groupedTarif: any[] = [];
      let sppItem: any = null;
      let totalSppNominal = 0;

      tarifData.forEach((t: any) => {
        if (t.Jenis_Pembayaran && t.Jenis_Pembayaran.toUpperCase().includes('SPP')) {
          totalSppNominal += Number(t.Nominal || 0);
          if (!sppItem) {
            sppItem = { ...t, Jenis_Pembayaran: 'SPP', ID_Tarif: 'GRP-SPP', Target_Kelas: '' };
            groupedTarif.push(sppItem);
          }
        } else {
          groupedTarif.push(t);
        }
      });

      // Update nominal SPP jadi total setahun
      if (sppItem) {
        sppItem.Nominal = totalSppNominal;
      }

      setTarifList(groupedTarif);
      setSiswaList(siswaDataAll);
      setIsLoading(false);
    };
    loadInitialData();


  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSiswaData(null); // Reset selected student if user types again

    if (query.trim().length > 0) {
      const lowerQuery = query.toLowerCase();
      const matches = siswaList.filter(s => 
        (s.NIS !== undefined && s.NIS !== null && s.NIS.toString().toLowerCase().includes(lowerQuery)) || 
        (s.Nama_Lengkap && s.Nama_Lengkap.toLowerCase().includes(lowerQuery))
      );
      setFilteredSiswa(matches);
    }
  };

  const handleSelectSiswa = async (siswa: any) => {
    setSiswaData(siswa);
    setSearchQuery(`${siswa.NIS} - ${siswa.Nama_Lengkap}`);
    setShowStudentListModal(false);
    
    // Fetch transaction history
    setIsFetchingHistory(true);
    const history = await fetchTransaksi(siswa.NIS);
    setTransaksiSiswa(history);
    setIsFetchingHistory(false);

    // Reset transaction form
    setSelectedTarif('');
    setNominal('');
    setShowPaymentModal(false);
  };



  const handleSimpanBayar = async () => {
    if (!selectedTarif || !nominal) {
      alert('Pilih jenis pembayaran dan isi nominal!');
      return;
    }

    setIsSaving(true);
    const payload = {
      NIS: siswaData.NIS,
      ID_Tarif: selectedTarif,
      Nominal_Dibayar: nominal
    };

    const res = await tambahTransaksi(payload);
    if (res && res.status === 'success') {
      alert('Pembayaran berhasil dicatat!');
      
      // Reload history
      setIsFetchingHistory(true);
      const history = await fetchTransaksi(siswaData.NIS);
      setTransaksiSiswa(history);
      setIsFetchingHistory(false);
      
      // Reset form & close modal
      setSelectedTarif('');
      setNominal('');
      setShowPaymentModal(false);
    } else {
      alert('Gagal: ' + (res?.message || 'Terjadi kesalahan saat menyimpan'));
    }
    setIsSaving(false);
  };

  const formatRp = (angka: number) => {
    if (angka === 0) return '';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(angka);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderReport = () => {
    if (!siswaData) return null;

    let totalPertahun = 0;
    let totalDibayar = 0;

    let reportRows = tarifList.map((tarif) => {
      let isTarget = true;
      const targetKelas = tarif.Target_Kelas ? tarif.Target_Kelas.toString().trim() : '';
      const siswaKelas = siswaData.Kelas ? siswaData.Kelas.toString().trim() : '';
      
      if (targetKelas !== '') {
        const targetList = targetKelas.split(',').map((k: string) => k.trim());
        if (!targetList.includes(siswaKelas)) {
           isTarget = false;
        }
      }
      
      const nominalPertahun = isTarget ? Number(tarif.Nominal || 0) : 0;
      
      // Calculate dibayar (termasuk cicilan lama yang mungkin mencantumkan SPP bulan tertentu)
      const trx = transaksiSiswa.filter(t => {
        const tId = t.ID_Tarif ? t.ID_Tarif.toString() : '';
        return (
          tId === tarif.ID_Tarif || 
          tId === tarif.Jenis_Pembayaran ||
          (tarif.ID_Tarif === 'GRP-SPP' && tId.toUpperCase().includes('SPP'))
        );
      });
      const sudahDibayar = trx.reduce((sum, t) => sum + Number(t.Nominal_Dibayar || 0), 0);

      return {
        ...tarif,
        isTarget,
        nominalPertahun,
        sudahDibayar
      };
    });

    // Filter yang tidak ada tagihan (nominal 0 atau bukan target kelas)
    reportRows = reportRows.filter(row => row.nominalPertahun > 0);

    const renderedRows = reportRows.map((row, idx) => {
      totalPertahun += row.nominalPertahun;
      totalDibayar += row.sudahDibayar;

      return (
        <tr key={idx}>
          <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center' }}>{idx + 1}</td>
          <td style={{ border: '1px solid black', padding: '4px 8px' }}>{row.Jenis_Pembayaran} {row.Target_Kelas ? `(Kls ${row.Target_Kelas} saja)` : ''}</td>
          <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'right' }}>
            {formatRp(row.nominalPertahun)}
          </td>
          <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'right' }}>
            {row.sudahDibayar > 0 ? formatRp(row.sudahDibayar) : ''}
          </td>
        </tr>
      );
    });

    const kurang = totalPertahun - totalDibayar;
    const isLunas = kurang <= 0;

    return (
      <div className="report-container" style={{ fontFamily: 'Arial, sans-serif', color: 'black', background: 'white', padding: '2rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: 'bold' }}>
          <div style={{ fontSize: '1.1rem' }}>LAPORAN IURAN MURID</div>
          <div style={{ fontSize: '1.1rem' }}>MDTA HIDAYATUL MUBTADI-IEN</div>
          <div style={{ fontSize: '1rem', fontWeight: 'normal' }}>TAHUN PELAJARAN : 2026/2027</div>
        </div>

        <div style={{ border: '1px solid black', borderBottom: 'none', padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', width: '60px' }}>Nama</span>
              <span>: <strong style={{ textTransform: 'uppercase' }}>{siswaData.Nama_Lengkap}</strong></span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontWeight: 'bold', width: '60px' }}>Kelas</span>
              <span>: <strong>{siswaData.Kelas || '-'}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', paddingBottom: '1rem', maxWidth: '100%' }}>
          <table style={{ borderCollapse: 'collapse', border: '1px solid black', width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#e2e8f0' }}>
                <th style={{ border: '1px solid black', padding: '8px', width: '50px' }}>No</th>
                <th style={{ border: '1px solid black', padding: '8px', whiteSpace: 'nowrap' }}>Iuran</th>
                <th style={{ border: '1px solid black', padding: '8px', whiteSpace: 'nowrap' }}>Iuran Pertahun</th>
                <th style={{ border: '1px solid black', padding: '8px', whiteSpace: 'nowrap' }}>Sudah dibayar</th>
              </tr>
            </thead>
            <tbody>
              {renderedRows}
              <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                <td colSpan={2} style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>Jumlah</td>
                <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatRp(totalPertahun)}</td>
                <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatRp(totalDibayar)}</td>
              </tr>
              <tr style={{ backgroundColor: '#e2e8f0' }}>
                <td colSpan={3} style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'right' }}>Keterangan</td>
                <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontWeight: 'bold' }}>{isLunas ? 'Lunas' : ''}</td>
              </tr>
              <tr style={{ backgroundColor: '#e2e8f0' }}>
                <td colSpan={3} style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'right' }}>Kurang</td>
                <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: 'red', whiteSpace: 'nowrap' }}>
                  {kurang > 0 ? formatRp(kurang) : (kurang < 0 ? `- ${formatRp(Math.abs(kurang))}` : '0')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            Terimakasih telah menyelesaikan iuran murid, Semoga<br/>
            rezeki yang dikeluarkan mendapat ganti<br/>
            yang lebih baik dan barokah Amin
          </p>
          <p>
            * Jika ada ketidak sesuaian perhitungan silahkan Hubungi<br/>
            Masduqi di 085 224 899 824
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-subtitle"></div>
        <div className="skeleton skeleton-card" style={{ height: '80px', marginBottom: '2rem' }}></div>
        <div className="skeleton skeleton-form" style={{ height: '300px' }}></div>
      </div>
    );
  }

  const renderStudentList = () => {
    const listToRender = searchQuery.trim().length > 0 ? filteredSiswa : siswaList;
    return (
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Cari & Pilih Santri</label>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Ketik NIS atau Nama..." 
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ paddingLeft: '2.5rem', borderColor: 'var(--primary-color)', borderWidth: '2px' }}
            autoComplete="off"
          />
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
          {listToRender.length > 0 ? (
            listToRender.map((siswa, idx) => {
              const isSelected = siswaData?.NIS === siswa.NIS;
              return (
                <div 
                  key={idx} 
                  onClick={() => handleSelectSiswa(siswa)}
                  style={{ 
                    padding: '0.75rem', border: `1px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', transition: 'all 0.2s', backgroundColor: isSelected ? 'var(--primary-light)' : 'white'
                  }}
                  onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'white')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: isSelected ? 'var(--primary-color)' : '#f1f5f9', padding: '0.5rem', borderRadius: '50%', color: isSelected ? 'white' : 'var(--text-muted)' }}>
                       <User size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {siswa.Nama_Lengkap}
                        {siswa.Status && siswa.Status.toLowerCase() !== 'aktif' && (
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem' }}>
                            {siswa.Status}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIS: {siswa.NIS}</div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada santri yang cocok dengan "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Kasir Pembayaran</h1>
          <p className="page-subtitle">Laporan iuran dan input transaksi santri</p>
        </div>
        
        {/* Tombol Pilih Santri khusus Mobile */}
        <button 
          className="btn btn-primary"
          style={{ display: window.innerWidth <= 768 ? 'inline-flex' : 'none', whiteSpace: 'nowrap' }}
          onClick={() => setShowStudentListModal(true)}
        >
          <Search size={18} /> Pilih Santri
        </button>
      </div>

      <div className="flex flex-col md:flex-row" style={{ gap: '1.5rem' }}>
        {/* Panel Kiri (Desktop: List Santri) */}
        <div className="card no-print" style={{ display: window.innerWidth <= 768 ? 'none' : 'block', width: '320px', flexShrink: 0, alignSelf: 'flex-start' }}>
          {renderStudentList()}
        </div>

        {/* Panel Kanan (Laporan) */}
        <div style={{ flex: 1, minWidth: 0 }}>
        {siswaData ? (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {siswaData.Status !== 'Aktif' ? (
              <div className="card no-print">
                <div style={{ padding: '1.5rem', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <AlertCircle size={24} />
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Transaksi Ditolak</h3>
                    <p>Santri atas nama <strong>{siswaData.Nama_Lengkap}</strong> sudah berstatus <strong>{siswaData.Status.toUpperCase()}</strong>. Transaksi tidak dapat dilanjutkan.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Bagian Laporan */}
                <div className="card" style={{ padding: '2rem' }}>
                  {isFetchingHistory ? (
                    <div className="card mb-6">
                      <div className="skeleton skeleton-title"></div>
                      <div className="skeleton skeleton-table" style={{ height: '300px' }}></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-6 no-print" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Rekapitulasi Iuran Murid</h2>
                        <div className="flex gap-4" style={{ flexWrap: 'wrap', marginLeft: 'auto' }}>
                          <button className="btn btn-outline" onClick={() => setShowHistoryModal(true)} style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)' }}>
                             Riwayat Pembayaran
                          </button>
                          <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
                            <CreditCard size={18} /> Input Pembayaran Baru
                          </button>
                          <button className="btn btn-outline" onClick={handlePrint}>
                            <Printer size={18} /> Cetak Laporan
                          </button>
                        </div>
                      </div>
                      
                      <div className="print-area">
                        {renderReport()}
                      </div>
                    </>
                  )}
                </div>

                {/* Pop-up Modal Input Pembayaran Baru */}
                {showPaymentModal && (
                  <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                  }}>
                    <div className="card no-print" style={{ 
                      width: '100%', maxWidth: '500px',
                      borderTop: '4px solid var(--primary-color)',
                      animation: 'fadeIn 0.2s ease-out' 
                    }}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CreditCard size={20} color="var(--primary-color)" /> Input Pembayaran
                        </h3>
                        <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none' }} onClick={() => setShowPaymentModal(false)}>
                          <AlertCircle size={20} style={{ display: 'none' }} />
                          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>&times;</span>
                        </button>
                      </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>Pilih Jenis Pembayaran (Klik salah satu)</label>
                      {tarifList.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)' }}>Memuat tarif / Tarif kosong...</div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {tarifList.map((t, idx) => {
                            // Cek apakah tarif ini berlaku untuk kelas siswa ini
                            const targetKelas = t.Target_Kelas ? t.Target_Kelas.toString().trim() : '';
                            const siswaKelas = siswaData.Kelas ? siswaData.Kelas.toString().trim() : '';
                            if (targetKelas !== '') {
                               const targetList = targetKelas.split(',').map((k: string) => k.trim());
                               if (!targetList.includes(siswaKelas)) {
                                  return null; // Sembunyikan tombol jika bukan target kelasnya
                               }
                            }

                            const isSelected = selectedTarif === (t.ID_Tarif || t.Jenis_Pembayaran);
                            return (
                              <button
                                key={idx}
                                type="button"
                                className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                                style={{ 
                                  padding: '0.5rem 1rem', 
                                  borderRadius: '2rem',
                                  border: isSelected ? 'none' : '1px solid var(--border-color)',
                                  backgroundColor: isSelected ? 'var(--primary-color)' : 'white',
                                  color: isSelected ? 'white' : 'var(--text-main)'
                                }}
                                onClick={() => {
                                  const val = t.ID_Tarif || t.Jenis_Pembayaran;
                                  setSelectedTarif(val);
                                  setNominal(t.Nominal ? t.Nominal.toString() : '0');
                                }}
                              >
                                {t.Jenis_Pembayaran}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group" style={{ maxWidth: '300px' }}>
                      <label>Nominal Bayar (Rp) - Bisa diedit jika nyicil</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={nominal}
                        onChange={(e) => setNominal(e.target.value)}
                        style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)', gap: '1rem' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>
                      Batal
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleSimpanBayar}
                      disabled={isSaving}
                    >
                      <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pop-up Modal Riwayat Pembayaran */}
            {showHistoryModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem'
              }}>
                <div className="card no-print" style={{ 
                  width: '100%', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto',
                  borderTop: '4px solid var(--primary-color)',
                  animation: 'fadeIn 0.2s ease-out' 
                }}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                      Detail Riwayat Pembayaran
                    </h3>
                    <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none' }} onClick={() => setShowHistoryModal(false)}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>&times;</span>
                    </button>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Tanggal</th>
                          <th>No. Transaksi</th>
                          <th>Iuran / Pembayaran</th>
                          <th style={{ textAlign: 'right' }}>Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaksiSiswa.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada riwayat pembayaran untuk siswa ini.</td>
                          </tr>
                        ) : (
                          [...transaksiSiswa].reverse().map((trx, idx) => {
                            // Cari nama asli tarif
                            let namaIuran = trx.ID_Tarif;
                            if (trx.ID_Tarif === 'GRP-SPP') {
                               namaIuran = 'SPP';
                            } else {
                               const tarifItem = tarifList.find(t => t.ID_Tarif === trx.ID_Tarif || t.Jenis_Pembayaran === trx.ID_Tarif);
                               if (tarifItem) namaIuran = tarifItem.Jenis_Pembayaran;
                            }
                            
                            return (
                              <tr key={idx}>
                                <td>{trx.Tanggal || '-'}</td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{trx.ID_Transaksi || '-'}</td>
                                <td style={{ fontWeight: 600 }}>{namaIuran}</td>
                                <td style={{ textAlign: 'right', color: 'var(--success-color)', fontWeight: 600 }}>
                                  {formatRp(Number(trx.Nominal_Dibayar || 0))}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button className="btn btn-outline" onClick={() => setShowHistoryModal(false)}>
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
              </div>
            )}
          </div>
        ) : (
          <div className="card no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', border: '2px dashed var(--border-color)', backgroundColor: 'transparent', boxShadow: 'none' }}>
             <User size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
             <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Belum ada santri yang dipilih</h3>
             <p>Silakan cari dan pilih santri dari daftar di sebelah kiri untuk melihat laporan dan melakukan pembayaran.</p>
             
             <button 
                className="btn btn-primary"
                style={{ display: window.innerWidth <= 768 ? 'inline-flex' : 'none', marginTop: '1.5rem' }}
                onClick={() => setShowStudentListModal(true)}
              >
                <Search size={18} /> Cari Santri Sekarang
              </button>
          </div>
        )}
        </div>
      </div>

      {/* Modal Daftar Santri (Khusus Mobile) */}
      {showStudentListModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div className="card" style={{ 
            width: '100%', maxHeight: '90vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '1.5rem',
            animation: 'slideUp 0.3s ease-out' 
          }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Pilih Santri</h3>
              <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none' }} onClick={() => setShowStudentListModal(false)}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>&times;</span>
              </button>
            </div>
            {renderStudentList()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media print {
          body { background: white !important; }
          .no-print, .sidebar-container, .mobile-header, .page-header { display: none !important; }
          .main-content { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
          .print-area { margin: 0; padding: 0; }
          .report-container { border: none !important; padding: 0 !important; width: 50% !important; margin: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};

export default Kasir;
