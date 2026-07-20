var SHEET_SISWA = 'Data_Siswa';
var SHEET_TARIF = 'Master_Tarif';
var SHEET_TRANSAKSI = 'Transaksi_Pembayaran';

function doPost(e) {
  var action = e.parameter.action;
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch(err) {
    return responseError('Invalid JSON Format');
  }

  if (action === 'tambahSiswa') {
    return tambahSiswa(data);
  } else if (action === 'editSiswa') {
    return editSiswa(data);
  } else if (action === 'tambahTransaksi') {
    return tambahTransaksi(data);
  } else if (action === 'tambahTarif') {
    return tambahTarif(data);
  } else if (action === 'editTarif') {
    return editTarif(data);
  } else if (action === 'hapusTarif') {
    return hapusTarif(data);
  }

  return responseError('Aksi tidak ditemukan');
}

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'getSiswa') {
    var nis = e.parameter.nis;
    return getSiswa(nis);
  } else if (action === 'getTarif') {
    return getTarif();
  } else if (action === 'getTransaksi') {
    var nis = e.parameter.nis;
    return getTransaksi(nis);
  }

  return responseError('Aksi tidak ditemukan');
}

// ==========================================
// DATA SISWA
// ==========================================
function getSiswa(nis) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SISWA);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  
  for(var i=1; i<data.length; i++){
    var obj = {};
    for(var j=0; j<headers.length; j++){
      var headerName = headers[j] ? headers[j].toString().trim() : '';
      if(headerName) obj[headerName] = data[i][j];
    }
    if (nis) {
      if (obj['NIS'] == nis) {
        result.push(obj);
        break;
      }
    } else {
      result.push(obj);
    }
  }
  return responseSuccess(result);
}

function tambahSiswa(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SISWA);
  
  var listSiswa = sheet.getDataRange().getValues();
  for(var i=1; i<listSiswa.length; i++) {
     if(listSiswa[i][0] == data.NIS) {
        return responseError('NIS sudah terdaftar!');
     }
  }
  
  sheet.appendRow([
    data.NIS || '',
    data.NISN || '',
    data.NIK || '',
    data.Nama_Lengkap || '',
    data.Kelas || '',
    data.Tempat_Lahir || '',
    data.Tanggal_Lahir || '',
    data.Jenis_Kelamin || '',
    data.Status || 'Aktif',
    data.NIK_Ayah || '',
    data.Nama_Ayah || '',
    data.NIK_Ibu || '',
    data.Nama_Ibu || '',
    data.Pekerjaan_Ortu || '',
    data.No_HP || ''
  ]);
  return responseSuccess('Siswa berhasil ditambahkan');
}

function editSiswa(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SISWA);
  var listSiswa = sheet.getDataRange().getValues();
  
  for(var i=1; i<listSiswa.length; i++) {
     if(listSiswa[i][0] == data.NIS) {
        var row = i + 1; 
        
        sheet.getRange(row, 1, 1, 15).setValues([[
          data.NIS || '',
          data.NISN || '',
          data.NIK || '',
          data.Nama_Lengkap || '',
          data.Kelas || '',
          data.Tempat_Lahir || '',
          data.Tanggal_Lahir || '',
          data.Jenis_Kelamin || '',
          data.Status || 'Aktif',
          data.NIK_Ayah || '',
          data.Nama_Ayah || '',
          data.NIK_Ibu || '',
          data.Nama_Ibu || '',
          data.Pekerjaan_Ortu || '',
          data.No_HP || ''
        ]]);
        return responseSuccess('Data Siswa berhasil diperbarui');
     }
  }
  return responseError('NIS tidak ditemukan di database');
}

// ==========================================
// MASTER TARIF
// ==========================================
function getTarif() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TARIF);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  
  for(var i=1; i<data.length; i++){
    var obj = {};
    for(var j=0; j<headers.length; j++){
      var headerName = headers[j] ? headers[j].toString().trim() : '';
      if(headerName) obj[headerName] = data[i][j];
    }
    result.push(obj);
  }
  return responseSuccess(result);
}

function tambahTarif(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TARIF);
  var listTarif = sheet.getDataRange().getValues();
  
  for(var i=1; i<listTarif.length; i++) {
     if(listTarif[i][0] == data.ID_Tarif) {
        return responseError('ID Tarif sudah ada!');
     }
  }
  
  // Format Kolom D (Target Kelas) menjadi Plain Text agar '3,4,5' tidak jadi tanggal
  sheet.getRange("D:D").setNumberFormat("@");
  
  sheet.appendRow([
    data.ID_Tarif || '',
    data.Jenis_Pembayaran || '',
    data.Nominal || 0,
    data.Target_Kelas || ''
  ]);
  return responseSuccess('Tarif berhasil ditambahkan');
}

function editTarif(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TARIF);
  var listTarif = sheet.getDataRange().getValues();
  
  if (data.ID_Tarif === 'GRP-SPP') {
     var updated = false;
     for(var i=1; i<listTarif.length; i++) {
        if(listTarif[i][1].toString().toUpperCase().indexOf('SPP') > -1) {
           sheet.getRange(i+1, 3).setValue(data.Nominal);
           updated = true;
        }
     }
     if (updated) return responseSuccess('Semua bulan SPP berhasil diperbarui');
     return responseError('Data SPP tidak ditemukan di database');
  }

  for(var i=1; i<listTarif.length; i++) {
     if(listTarif[i][0] == data.ID_Tarif) {
        var row = i + 1;
        // Format Kolom D (Target Kelas) menjadi Plain Text sebelum disave
        sheet.getRange("D:D").setNumberFormat("@");
        
        sheet.getRange(row, 1, 1, 4).setValues([[
          data.ID_Tarif || '',
          data.Jenis_Pembayaran || '',
          data.Nominal || 0,
          data.Target_Kelas || ''
        ]]);
        return responseSuccess('Tarif berhasil diperbarui');
     }
  }
  return responseError('ID Tarif tidak ditemukan');
}

function hapusTarif(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TARIF);
  var listTarif = sheet.getDataRange().getValues();
  
  for(var i=1; i<listTarif.length; i++) {
     if(listTarif[i][0] == data.ID_Tarif) {
        var row = i + 1;
        sheet.deleteRow(row);
        return responseSuccess('Tarif berhasil dihapus');
     }
  }
  return responseError('ID Tarif tidak ditemukan');
}


// ==========================================
// TRANSAKSI
// ==========================================
function getTransaksi(nis) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSAKSI);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  
  for(var i=1; i<data.length; i++){
    var obj = {};
    for(var j=0; j<headers.length; j++){
      var headerName = headers[j] ? headers[j].toString().trim() : '';
      if(headerName) obj[headerName] = data[i][j];
    }
    if (nis && obj['NIS'] == nis) {
      result.push(obj);
    } else if (!nis) {
      result.push(obj);
    }
  }
  return responseSuccess(result);
}

function tambahTransaksi(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSAKSI);
  var tgl = new Date();
  var idTrx = "TRX" + tgl.getTime();
  
  sheet.appendRow([
    idTrx,
    data.Tanggal || tgl.toLocaleDateString(),
    data.NIS || '',
    data.ID_Tarif || '',
    data.Nominal_Dibayar || 0,
    data.Penerima || ''
  ]);
  return responseSuccess('Transaksi berhasil dicatat');
}

// ==========================================
// UTILS
// ==========================================
function responseSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function responseError(message) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}
