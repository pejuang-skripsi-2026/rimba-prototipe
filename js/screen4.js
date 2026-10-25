/* =========================================================
   RIMBA — screen4.js
   Logika UI Layar 4: Form laporan, preview foto, geolocation.
   ========================================================= */

(function () {
  'use strict';

  var currentImageBase64 = null;

  function init() {
    var form = document.getElementById('report-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }

    // Handle upload foto (preview)
    var fileInput = document.getElementById('rep-photo');
    if (fileInput) {
      fileInput.addEventListener('change', handlePhotoUpload);
    }

    // Handle tombol lokasi
    var btnLoc = document.getElementById('btn-get-loc');
    if (btnLoc) {
      btnLoc.addEventListener('click', handleGetLocation);
    }

    // Render list laporan
    renderReports();
  }

  function handlePhotoUpload(e) {
    var file = e.target.files[0];
    var preview = document.getElementById('rep-photo-preview');
    if (!file || !preview) return;

    var reader = new FileReader();
    reader.onload = function (evt) {
      currentImageBase64 = evt.target.result;
      preview.src = currentImageBase64;
      preview.hidden = false;
    };
    reader.readAsDataURL(file);
  }

  function handleGetLocation() {
    var statusEl = document.getElementById('loc-status');
    var latInput = document.getElementById('rep-lat');
    var lngInput = document.getElementById('rep-lng');

    if (!navigator.geolocation) {
      if (statusEl) statusEl.textContent = 'Fitur lokasi tidak didukung browser ini. Isi manual.';
      return;
    }

    if (statusEl) statusEl.textContent = 'Mengambil lokasi...';

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        latInput.value = pos.coords.latitude.toFixed(6);
        lngInput.value = pos.coords.longitude.toFixed(6);
        if (statusEl) statusEl.textContent = 'Lokasi berhasil diambil.';
      },
      function (err) {
        // Sering terjadi jika dibuka lewat file://
        if (statusEl) statusEl.textContent = 'Gagal mengambil lokasi (butuh server lokal/HTTPS). Isi manual.';
      }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    var title = document.getElementById('rep-title').value;
    var lat = parseFloat(document.getElementById('rep-lat').value);
    var lng = parseFloat(document.getElementById('rep-lng').value);
    var notes = document.getElementById('rep-notes').value;

    if (isNaN(lat) || isNaN(lng)) {
      alert('Koordinat tidak valid. Harap isi Latitude dan Longitude dengan angka.');
      return;
    }

    var newReport = {
      id: 'rep-' + Date.now().toString().slice(-6),
      title: title,
      lat: lat,
      lng: lng,
      notes: notes,
      image: currentImageBase64,
      status: 'Menunggu Verifikasi',
      date: new Date().toISOString()
    };

    window.RIMBA_REPORTS.add(newReport);
    
    // Reset form
    e.target.reset();
    document.getElementById('rep-photo-preview').hidden = true;
    currentImageBase64 = null;
    document.getElementById('loc-status').textContent = '';
    
    alert('Laporan berhasil dikirim (simulasi). Cek panel admin di bawah.');
    renderReports();
  }

  function renderReports() {
    var container = document.getElementById('report-list');
    if (!container) return;

    var reports = window.RIMBA_REPORTS.getAll();
    if (reports.length === 0) {
      container.innerHTML = '<p class="empty-state">Belum ada laporan.</p>';
      return;
    }

    var html = '<h3>Daftar Laporan (Panel Admin Simulasi)</h3>';
    
    reports.forEach(function (rep) {
      var dateStr = new Date(rep.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });

      var statusClass = rep.status === 'Disetujui' ? 'status-approved' :
                        rep.status === 'Ditolak' ? 'status-rejected' : 'status-pending';

      html += '<div class="report-card">';
      
      // Bagian Foto
      html += '<div class="rc-image">';
      if (rep.image) {
        html += '<img src="' + rep.image + '" alt="Foto Laporan">';
      } else {
        html += '<div class="no-img">Tanpa Foto</div>';
      }
      html += '</div>';

      // Bagian Konten
      html += '<div class="rc-content">';
      html += '<h4>' + esc(rep.title) + '</h4>';
      html += '<div class="rc-meta">' + dateStr + ' · ' + rep.lat.toFixed(4) + ', ' + rep.lng.toFixed(4) + '</div>';
      html += '<p>' + esc(rep.notes) + '</p>';
      html += '<div class="rc-status ' + statusClass + '">' + rep.status + '</div>';
      
      // Tombol Admin (hanya muncul kalau masih pending)
      if (rep.status === 'Menunggu Verifikasi') {
        html += '<div class="rc-actions">';
        html += '<button class="btn btn-sm btn-approve" data-id="' + rep.id + '">Setujui</button>';
        html += '<button class="btn btn-sm btn-reject" data-id="' + rep.id + '">Tolak</button>';
        html += '</div>';
      }
      
      html += '</div>'; // tutup rc-content
      html += '</div>'; // tutup report-card
    });

    container.innerHTML = html;

    // Bind event tombol admin
    container.querySelectorAll('.btn-approve').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.RIMBA_REPORTS.updateStatus(btn.getAttribute('data-id'), 'Disetujui');
        renderReports();
      });
    });

    container.querySelectorAll('.btn-reject').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.RIMBA_REPORTS.updateStatus(btn.getAttribute('data-id'), 'Ditolak');
        renderReports();
      });
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Init setelah DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Panggil ulang render saat tab Layar 4 diklik (biar datanya update)
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-screen="screen-4"]')) {
      setTimeout(renderReports, 50);
    }
  });

})();