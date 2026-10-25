/* =========================================================
   RIMBA — screen4.js (Final: Telegram + CSV + Arsip)
   ========================================================= */

(function () {
  'use strict';

  var currentImageBase64 = null;

  function init() {
    var form = document.getElementById('report-form');
    if (form) form.addEventListener('submit', handleSubmit);

    var fileInput = document.getElementById('rep-photo');
    if (fileInput) fileInput.addEventListener('change', handlePhotoUpload);

    var btnLoc = document.getElementById('btn-get-loc');
    if (btnLoc) btnLoc.addEventListener('click', handleGetLocation);
    
    // Tombol Download CSV
    var btnCsv = document.getElementById('btn-download-csv');
    if (btnCsv) {
      btnCsv.addEventListener('click', function() {
        var reports = window.RIMBA_REPORTS.getAll();
        if (reports.length === 0) { alert('Belum ada data.'); return; }
        
        var csv = 'ID,Judul,Latitude,Longitude,Catatan,Status\n';
        reports.forEach(function(r) {
          var row = [
            r.id, 
            '"' + r.title.replace(/"/g, '""') + '"', 
            r.lat, 
            r.lng, 
            '"' + r.notes.replace(/"/g, '""') + '"', 
            r.status
          ].join(',');
          csv += row + '\n';
        });
        
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Data_Laporan_RIMBA.csv';
        link.click();
      });
    }

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
      if (statusEl) statusEl.textContent = 'Fitur lokasi tidak didukung. Isi manual.';
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
        if (statusEl) statusEl.textContent = 'Gagal mengambil lokasi. Isi manual.';
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
    
    // --- INTEGRASI TELEGRAM ---
    // GANTI DENGAN TOKEN & CHAT ID KAMU
    var token = 'ISI_TOKEN_BOT_KAMU_DISINI';
    var chatId = 'ISI_CHAT_ID_KAMU_DISINI';
    
    var pesan = "🚨 LAPORAN WARGA BARU 🚨\n\n📌 Judul: " + title + "\n📍 Koordinat: " + lat + ", " + lng + "\n📝 Catatan: " + notes;
                        
    fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: pesan })
    }).catch(function(err) { console.log('Error Telegram:', err); });
    // --------------------------
    
    e.target.reset();
    document.getElementById('rep-photo-preview').hidden = true;
    currentImageBase64 = null;
    document.getElementById('loc-status').textContent = '';
    
    alert('Laporan berhasil dikirim! (Cek bot Telegram)');
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

    var pending = reports.filter(function(r) { return r.status === 'Menunggu Verifikasi'; });
    var archived = reports.filter(function(r) { return r.status !== 'Menunggu Verifikasi'; });

    var html = '<h3>Daftar Laporan Masuk</h3>';
    
    if (pending.length > 0) {
      html += '<div class="pending-list">';
      pending.forEach(function (rep) { html += generateReportCard(rep); });
      html += '</div>';
    } else {
      html += '<p class="empty-state" style="margin-bottom: 20px;">Tidak ada laporan pending.</p>';
    }

    if (archived.length > 0) {
      html += '<details class="archive-section">';
      html += '<summary>📁 Arsip Laporan (' + archived.length + ')</summary>';
      html += '<div class="archive-list">';
      archived.forEach(function (rep) { html += generateReportCard(rep); });
      html += '</div></details>';
    }

    container.innerHTML = html;

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

  function generateReportCard(rep) {
    var dateStr = new Date(rep.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    var statusClass = rep.status === 'Disetujui' ? 'status-approved' : rep.status === 'Ditolak' ? 'status-rejected' : 'status-pending';

    var cardHtml = '<div class="report-card"><div class="rc-image">';
    if (rep.image) cardHtml += '<img src="' + rep.image + '" alt="Foto">';
    else cardHtml += '<div class="no-img">Tanpa Foto</div>';
    cardHtml += '</div><div class="rc-content">';
    cardHtml += '<h4>' + esc(rep.title) + '</h4><div class="rc-meta">' + dateStr + ' · ' + rep.lat.toFixed(4) + ', ' + rep.lng.toFixed(4) + '</div>';
    cardHtml += '<p>' + esc(rep.notes) + '</p><div class="rc-status ' + statusClass + '">' + rep.status + '</div>';
    
    if (rep.status === 'Menunggu Verifikasi') {
      cardHtml += '<div class="rc-actions"><button class="btn btn-sm btn-approve" data-id="' + rep.id + '">Setujui</button><button class="btn btn-sm btn-reject" data-id="' + rep.id + '">Tolak</button></div>';
    }
    cardHtml += '</div></div>';
    return cardHtml;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-screen="screen-4"]')) {
      setTimeout(renderReports, 50);
    }
  });

})();