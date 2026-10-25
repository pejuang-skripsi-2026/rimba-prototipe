/* =========================================================
   RIMBA — main.js (Tahap 1)
   Hanya logika navigasi tab. Belum ada fitur peta/CA/dll.
   ========================================================= */

(function () {
  "use strict";

  var tabButtons = document.querySelectorAll(".tab-btn");
  var screens = document.querySelectorAll(".screen");

  function activateScreen(screenId) {
    // Sembunyikan semua layar
    screens.forEach(function (screen) {
      screen.classList.remove("active");
    });

    // Matikan status aktif semua tombol
    tabButtons.forEach(function (btn) {
      btn.classList.remove("active");
      btn.setAttribute("aria-selected", "false");
    });

    // Tampilkan layar target
    var targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add("active");
    }

    // Aktifkan tombol target
    var targetButton = document.querySelector(
      '.tab-btn[data-screen="' + screenId + '"]'
    );
    if (targetButton) {
      targetButton.classList.add("active");
      targetButton.setAttribute("aria-selected", "true");
    }

    // Ganti hash URL agar bisa di-refresh tanpa kehilangan layar
    if (history.replaceState) {
      history.replaceState(null, "", "#" + screenId);
    } else {
      window.location.hash = screenId;
    }
  }

  // Event listener untuk setiap tombol tab
  tabButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var screenId = button.getAttribute("data-screen");
      if (screenId) {
        activateScreen(screenId);
      }
    });
  });

  // Buka layar sesuai hash saat halaman dimuat (mis. #screen-3)
  var initialHash = window.location.hash.replace("#", "");
  if (initialHash && document.getElementById(initialHash)) {
    activateScreen(initialHash);
  }

  // TODO: data simulasi — inisialisasi modul peta/CA/spesies/laporan/edukasi
  // akan ditambahkan pada tahap berikutnya.
})();