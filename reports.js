/* =========================================================
   RIMBA — reports.js
   Simulasi penyimpanan laporan warga.
   BUKAN backend sungguhan. Data hilang jika cache dibersihkan.
   ========================================================= */

window.RIMBA_REPORTS = (function () {
  'use strict';

  var STORAGE_KEY = 'rimba_reports_v1';
  var memoryStore = []; // Fallback jika localStorage diblokir

  // Laporan awal (Dummy) agar panel admin tidak kosong saat pertama dibuka
  var initialReports = [
    {
      id: 'rep-001',
      title: 'Lahan kosong ditumbuhi ilalang',
      lat: -6.8912,
      lng: 107.6098,
      notes: 'Tampak kering, belum ada yang menanam.',
      image: null,
      status: 'Menunggu Verifikasi',
      date: '2026-10-23T08:30:00.000Z'
    },
    {
      id: 'rep-002',
      title: 'Pohon tumbang menutup drainase',
      lat: -6.8895,
      lng: 107.6110,
      notes: 'Butuh penanganan segera.',
      image: null,
      status: 'Disetujui',
      date: '2026-10-22T14:15:00.000Z'
    }
  ];

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
      
      // Kalau belum ada, simpan data awal
      saveData(initialReports);
      return initialReports;
    } catch (e) {
      // Jika localStorage error (misal mode private/file:// ketat)
      if (memoryStore.length === 0) memoryStore = initialReports.slice();
      return memoryStore;
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      memoryStore = data;
    }
  }

  function getAll() {
    return loadData().sort(function(a, b) {
      return new Date(b.date) - new Date(a.date); // Urutkan dari terbaru
    });
  }

  function add(report) {
    var data = loadData();
    data.push(report);
    saveData(data);
  }

  function updateStatus(id, newStatus) {
    var data = loadData();
    for (var i = 0; i < data.length; i++) {
      if (data[i].id === id) {
        data[i].status = newStatus;
        break;
      }
    }
    saveData(data);
  }

  return {
    getAll: getAll,
    add: add,
    updateStatus: updateStatus
  };
})();