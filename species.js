/* =========================================================
   RIMBA — species.js
   Data kandidat spesies & logika pencocokan kriteria.
   BUKAN klaim penyerapan polutan. PERLU VERIFIKASI AHLI.
   ========================================================= */

window.RIMBA_SPECIES = (function () {
  'use strict';

  // TODO: data simulasi
  // Array kriteria di bawah menggunakan nilai: 'sempit'/'sedang'/'luas', 
  // 'penuh'/'parsial'/'ternaungi', dan 'rendah'/'sedang'/'tinggi'.
  var candidates = [
    {
      id: 'sp-1',
      name: 'Ketapang Kencana',
      latin: 'Terminalia mantaly',
      width: ['sempit', 'sedang'],
      exposure: ['penuh', 'parsial'],
      water: ['rendah', 'sedang']
    },
    {
      id: 'sp-2',
      name: 'Pule',
      latin: 'Alstonia scholaris',
      width: ['sedang', 'luas'],
      exposure: ['penuh', 'parsial'],
      water: ['sedang', 'tinggi']
    },
    {
      id: 'sp-3',
      name: 'Tanjung',
      latin: 'Mimusops elengi',
      width: ['sempit', 'sedang'],
      exposure: ['penuh'],
      water: ['sedang']
    },
    {
      id: 'sp-4',
      name: 'Tabebuya',
      latin: 'Tabebuia rosea',
      width: ['sempit', 'sedang'],
      exposure: ['penuh'],
      water: ['rendah', 'sedang']
    },
    {
      id: 'sp-5',
      name: 'Trembesi',
      latin: 'Samanea saman',
      width: ['luas'],
      exposure: ['penuh'],
      water: ['sedang', 'tinggi']
    },
    {
      id: 'sp-6',
      name: 'Mahoni',
      latin: 'Swietenia macrophylla',
      width: ['sedang', 'luas'],
      exposure: ['penuh'],
      water: ['sedang']
    },
    {
      id: 'sp-7',
      name: 'Angsana',
      latin: 'Pterocarpus indicus',
      width: ['sedang', 'luas'],
      exposure: ['penuh'],
      water: ['sedang']
    },
    {
      id: 'sp-8',
      name: 'Bintaro',
      latin: 'Cerbera manghas',
      width: ['sedang'],
      exposure: ['penuh', 'parsial'],
      water: ['sedang', 'tinggi']
    },
    {
      id: 'sp-9',
      name: 'Bougenville',
      latin: 'Bougainvillea sp.',
      width: ['sempit'],
      exposure: ['penuh'],
      water: ['rendah']
    }
  ];

  // Cari spesies yang cocok dengan ketiga kriteria
  function recommend(width, exposure, water) {
    return candidates.filter(function (sp) {
      return sp.width.indexOf(width) !== -1 &&
             sp.exposure.indexOf(exposure) !== -1 &&
             sp.water.indexOf(water) !== -1;
    });
  }

  return {
    recommend: recommend
  };
})();