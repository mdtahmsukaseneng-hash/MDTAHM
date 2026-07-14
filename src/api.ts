const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycby06kyH2UY02abNftUjbb40xa_a3oqWkgYv-ANpT9n_RnjuWFarPfGrriklQRrl3do/exec';

export const getGasUrl = () => {
  return localStorage.getItem('GAS_URL') || DEFAULT_GAS_URL;
};

export const setGasUrl = (url: string) => {
  localStorage.setItem('GAS_URL', url);
};

export const fetchSiswa = async (nis?: string) => {
  const urlBase = getGasUrl();
  if (!urlBase) {
    console.warn("GAS_URL belum diatur!");
    return [];
  }
  
  try {
    const url = (nis !== undefined && nis !== '') ? `${urlBase}?action=getSiswa&nis=${nis}` : `${urlBase}?action=getSiswa`;
    const response = await fetch(url);
    const result = await response.json();
    return result.status === 'success' ? result.data : [];
  } catch (error) {
    console.error("Gagal mengambil data siswa:", error);
    return [];
  }
};

export const fetchTarif = async () => {
  const urlBase = getGasUrl();
  if (!urlBase) return [];
  try {
    const response = await fetch(`${urlBase}?action=getTarif`);
    const result = await response.json();
    return result.status === 'success' ? result.data : [];
  } catch (error) {
    console.error("Gagal mengambil data tarif:", error);
    return [];
  }
};

export const fetchTransaksi = async (nis?: string) => {
  const urlBase = getGasUrl();
  if (!urlBase) return [];
  try {
    const url = (nis !== undefined && nis !== '') ? `${urlBase}?action=getTransaksi&nis=${nis}` : `${urlBase}?action=getTransaksi`;
    const response = await fetch(url);
    const result = await response.json();
    return result.status === 'success' ? result.data : [];
  } catch (error) {
    console.error("Gagal mengambil data transaksi:", error);
    return [];
  }
};

export const tambahSiswa = async (data: any) => {
  const urlBase = getGasUrl();
  if (!urlBase) {
    alert("Koneksi Database belum diatur (GAS_URL kosong).");
    return { status: 'error' };
  }
  
  try {
    const response = await fetch(`${urlBase}?action=tambahSiswa`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Gagal menambah siswa:", error);
    return { status: 'error', message: 'Koneksi gagal' };
  }
};

export const editSiswa = async (data: any) => {
  const urlBase = getGasUrl();
  if (!urlBase) return { status: 'error' };
  
  try {
    const response = await fetch(`${urlBase}?action=editSiswa`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Gagal mengedit siswa:", error);
    return { status: 'error', message: 'Koneksi gagal' };
  }
};

export const tambahTransaksi = async (data: any) => {
  const urlBase = getGasUrl();
  if (!urlBase) {
    alert("Koneksi Database belum diatur (GAS_URL kosong).");
    return { status: 'error' };
  }

  try {
    const response = await fetch(`${urlBase}?action=tambahTransaksi`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Gagal mencatat transaksi:", error);
    return { status: 'error', message: 'Koneksi gagal' };
  }
};

export const tambahTarif = async (data: any) => {
  const urlBase = getGasUrl();
  if (!urlBase) return { status: 'error' };

  try {
    const response = await fetch(`${urlBase}?action=tambahTarif`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Gagal menambah tarif:", error);
    return { status: 'error', message: 'Koneksi gagal' };
  }
};

export const editTarif = async (data: any) => {
  const urlBase = getGasUrl();
  if (!urlBase) return { status: 'error' };

  try {
    const response = await fetch(`${urlBase}?action=editTarif`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Gagal mengedit tarif:", error);
    return { status: 'error', message: 'Koneksi gagal' };
  }
};

export const hapusTarif = async (data: any) => {
  const urlBase = getGasUrl();
  if (!urlBase) return { status: 'error' };

  try {
    const response = await fetch(`${urlBase}?action=hapusTarif`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Gagal menghapus tarif:", error);
    return { status: 'error', message: 'Koneksi gagal' };
  }
};

