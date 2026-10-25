/* =========================================================
   RIMBA — data.js
   Data simulasi untuk Layar 1. BUKAN hasil pengukuran.
   ========================================================= */

window.RIMBA_DATA = {
  // Pusat peta demo (area kampus fiktif, Bandung)
  center: { lat: -6.8906, lng: 107.6103 },
  zoom: 16,

  // Latitude referensi untuk proyeksi planar (untuk Voronoi)
  refLat: -6.8906,

  // Titik acuan — hanya pembagi ruang, bukan sensor
  // TODO: data simulasi
  referencePoints: [
    { id: 'ref-1', name: 'Titik Acuan A', lat: -6.8895, lng: 107.6095 },
    { id: 'ref-2', name: 'Titik Acuan B', lat: -6.8910, lng: 107.6115 },
    { id: 'ref-3', name: 'Titik Acuan C', lat: -6.8925, lng: 107.6090 },
    { id: 'ref-4', name: 'Titik Acuan D', lat: -6.8888, lng: 107.6110 }
  ],

  // Kandidat lahan — semua berstatus "perlu verifikasi"
  // TODO: data simulasi
  candidates: [
    {
      id: 'cand-1',
      name: 'Lahan Sisi Barat',
      lat: -6.8900, lng: 107.6070,
      area: '±120 m² (perkiraan peta, belum disurvei)',
      width: 'sempit',
      exposure: 'penuh',
      waterNeed: 'sedang',
      status: 'perlu verifikasi',
      notes: 'Dekat jalan akses. Belum disurvei lapangan.'
    },
    {
      id: 'cand-2',
      name: 'Lahan Sudut Timur Laut',
      lat: -6.8890, lng: 107.6120,
      area: '±80 m² (perkiraan peta, belum disurvei)',
      width: 'sempit',
      exposure: 'parsial',
      waterNeed: 'rendah',
      status: 'perlu verifikasi',
      notes: 'Ternaungi bangunan di sisi utara.'
    },
    {
      id: 'cand-3',
      name: 'Lahan Sisi Selatan',
      lat: -6.8930, lng: 107.6100,
      area: '±200 m² (perkiraan peta, belum disurvei)',
      width: 'sedang',
      exposure: 'penuh',
      waterNeed: 'sedang',
      status: 'perlu verifikasi',
      notes: 'Berbatasan dengan saluran drainase.'
    },
    {
      id: 'cand-4',
      name: 'Lahan Sisi Utara',
      lat: -6.8875, lng: 107.6085,
      area: '±150 m² (perkiraan peta, belum disurvei)',
      width: 'sedang',
      exposure: 'penuh',
      waterNeed: 'sedang',
      status: 'perlu verifikasi',
      notes: 'Permukaan tanah tampak padat.'
    },
    {
      id: 'cand-5',
      name: 'Lahan Sisi Barat Daya',
      lat: -6.8915, lng: 107.6065,
      area: '±60 m² (perkiraan peta, belum disurvei)',
      width: 'sempit',
      exposure: 'parsial',
      waterNeed: 'rendah',
      status: 'perlu verifikasi',
      notes: 'Dekat area parkir.'
    }
  ]
};