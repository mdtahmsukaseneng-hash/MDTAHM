import { useState, useEffect } from 'react';
import { fetchTransaksi, fetchSiswa, fetchTarif, getKasirName, serahkanUang } from '../api';
import { Download, FileText, CheckCircle } from 'lucide-react';

const Laporan = () => {
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [siswaMap, setSiswaMap] = useState<any>({});
  const [tarifMap, setTarifMap] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kasirName = getKasirName();

  const loadData = async () => {
    setIsLoading(true);
    const [transaksiData, siswaData, tarifData] = await Promise.all([
      fetchTransaksi(),
      fetchSiswa(),
      fetchTarif()
    ]);

    // Build Maps for quick lookup
    const sMap: any = {};
    siswaData.forEach((s: any) => { sMap[s.NIS] = s.Nama_Lengkap; });
    setSiswaMap(sMap);

    const tMap: any = {};
    tarifData.forEach((t: any) => { tMap[t.ID_Tarif] = t.Jenis_Pembayaran; });
    // Add GRP-SPP virtual tarif
    tMap['GRP-SPP'] = 'SPP (Bulanan)';
    setTarifMap(tMap);

    setTransaksiList(transaksiData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSerahkan = async () => {
    if (!kasirName) {
      alert("Nama Kasir belum diatur di Pengaturan!");
      return;
    }
    
    if (confirm(`Serahkan semua uang yang ada di tangan Anda (${kasirName}) ke Bendahara (Anah)?`)) {
      setIsSubmitting(true);
      const res = await serahkanUang(kasirName, 'Anah');
      if (res && res.status === 'success') {
        alert(res.data || 'Berhasil diserahkan!');
        loadData();
      } else {
        alert('Gagal: ' + (res?.message || 'Terjadi kesalahan'));
      }
      setIsSubmitting(false);
    }
  };

  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // Kalkulasi
  let totalDiKasir = 0;
  let totalDiBendahara = 0;
  
  const trxKasirSaatIni = transaksiList.filter(t => {
    const p = t.Penerima ? t.Penerima.toString().trim().toUpperCase() : '';
    return p === kasirName.trim().toUpperCase();
  });
  
  const trxBendahara = transaksiList.filter(t => {
    const p = t.Penerima ? t.Penerima.toString().trim().toUpperCase() : '';
    return p === 'ANAH';
  });

  trxKasirSaatIni.forEach(t => totalDiKasir += Number(t.Nominal_Dibayar || 0));
  trxBendahara.forEach(t => totalDiBendahara += Number(t.Nominal_Dibayar || 0));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Laporan Keuangan</h1>
          <p className="page-subtitle">Rekapitulasi penerimaan uang dan riwayat transaksi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Uang di Tangan Anda ({kasirName || 'Belum Diatur'})
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
            {formatRp(totalDiKasir)}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSerahkan} 
            disabled={totalDiKasir === 0 || isSubmitting || !kasirName}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <CheckCircle size={18} /> {isSubmitting ? 'Memproses...' : 'Serahkan ke Bendahara (Anah)'}
          </button>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--success-color)' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Total Uang di Bendahara (Anah)
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {formatRp(totalDiBendahara)}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>
            Uang yang sudah diserahkan dan diamankan oleh Bendahara.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} className="text-primary" />
            Riwayat Seluruh Transaksi
          </h2>
          <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <Download size={18} /> Export Excel
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Siswa</th>
                <th>Jenis Pembayaran</th>
                <th style={{ textAlign: 'right' }}>Nominal</th>
                <th>Penerima (Kasir)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Memuat data transaksi...</td></tr>
              ) : transaksiList.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Belum ada transaksi</td></tr>
              ) : (
                transaksiList.slice().reverse().map((trx, idx) => (
                  <tr key={idx}>
                    <td>{trx.Tanggal}</td>
                    <td>{siswaMap[trx.NIS] || trx.NIS}</td>
                    <td>{tarifMap[trx.ID_Tarif] || trx.ID_Tarif}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRp(Number(trx.Nominal_Dibayar))}</td>
                    <td>
                      <span className={`badge ${trx.Penerima && trx.Penerima.toString().toUpperCase() === 'ANAH' ? 'badge-success' : 'badge-warning'}`}>
                        {trx.Penerima || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Laporan;
