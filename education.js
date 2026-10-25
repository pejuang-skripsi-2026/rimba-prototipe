/* =========================================================
   RIMBA — education.js
   Logika UI Layar 5: Tombol cetak lembar tugas.
   ========================================================= */

(function () {
  'use strict';

  function init() {
    var btnPrint = document.getElementById('btn-print-task');
    if (btnPrint) {
      btnPrint.addEventListener('click', function () {
        // Membuka dialog print bawaan browser
        window.print();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();