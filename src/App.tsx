import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DataSiswa from './pages/DataSiswa';
import Kasir from './pages/Kasir';
import MasterTarif from './pages/MasterTarif';
import Settings from './pages/Settings';
import Laporan from './pages/Laporan';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="siswa" element={<DataSiswa statusFilter="Aktif" />} />
          <Route path="siswa-nonaktif" element={<DataSiswa statusFilter="Nonaktif" />} />
          <Route path="tarif" element={<MasterTarif />} />
          <Route path="kasir" element={<Kasir />} />
          <Route path="laporan" element={<Laporan />} />
          <Route path="pengaturan" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
