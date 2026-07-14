import { useState, useEffect } from 'react';
import { Users, Receipt, Wallet, TrendingUp, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchSiswa, fetchTransaksi } from '../api';

const Dashboard = () => {
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [transaksiHariIni, setTransaksiHariIni] = useState(0);
  const [kasBulanIni, setKasBulanIni] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      const siswaList = await fetchSiswa();
      // Hitung siswa aktif
      const siswaAktif = siswaList.filter((s: any) => s.Status === 'Aktif').length;
      setTotalSiswa(siswaAktif);

      const transaksiList = await fetchTransaksi();
      
      const today = new Date().toLocaleDateString();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let countToday = 0;
      let sumMonth = 0;

      transaksiList.forEach((trx: any) => {
        // Asumsi format tanggal di sheet bisa di-parse oleh Date() atau sama persis dengan toLocaleDateString
        // Agar aman, kita parse
        const trxDate = new Date(trx.Tanggal);
        if (trx.Tanggal === today || trxDate.toLocaleDateString() === today) {
          countToday++;
        }
        
        if (trxDate.getMonth() === currentMonth && trxDate.getFullYear() === currentYear) {
          sumMonth += Number(trx.Nominal_Dibayar) || 0;
        }
      });

      setTransaksiHariIni(countToday);
      setKasBulanIni(sumMonth);
      
      // Ambil 5 transaksi terakhir (asumsi urutan dari bawah / terbaru)
      setRecentTransactions(transaksiList.slice(-5).reverse());
      
      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  // Format Rupiah
  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  if (isLoading) {
    return (
      <div>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-subtitle"></div>
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
        </div>
        <div className="skeleton skeleton-table"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Dashboard Utama</h1>
          <p className="page-subtitle">Ringkasan data MDTA Hidayatul Mubtadi-ien</p>
        </div>
        <Link to="/pengaturan" className="btn btn-outline flex items-center gap-2">
          <Settings size={18} />
          Pengaturan Sistem
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ccfbf1', color: '#0d9488' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Santri Aktif</h3>
            <div className="stat-value">{isLoading ? '...' : totalSiswa}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Receipt size={24} />
          </div>
          <div className="stat-content">
            <h3>Transaksi Hari Ini</h3>
            <div className="stat-value">{isLoading ? '...' : transaksiHariIni}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
            <Wallet size={24} />
          </div>
          <div className="stat-content">
            <h3>Kas Bulan Ini</h3>
            <div className="stat-value">{isLoading ? '...' : formatRp(kasBulanIni)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Aktivitas Pembayaran Terbaru</h2>
          <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <TrendingUp size={16} /> Refresh
          </button>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>NIS</th>
                <th>Jenis Pembayaran</th>
                <th>Nominal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : recentTransactions.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Belum ada transaksi</td></tr>
              ) : (
                recentTransactions.map((trx, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{new Date(trx.Tanggal).toLocaleDateString('id-ID')}</td>
                    <td>{trx.NIS}</td>
                    <td>{trx.ID_Tarif}</td>
                    <td>{formatRp(Number(trx.Nominal_Dibayar))}</td>
                    <td><span className="badge badge-success">Sukses</span></td>
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

export default Dashboard;
