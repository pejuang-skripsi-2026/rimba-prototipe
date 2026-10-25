/* =========================================================
   RIMBA — screen3.js
   Logika UI Layar 3: Form filter dan render hasil.
   ========================================================= */

(function () {
  'use strict';

  function init() {
    if (typeof window.RIMBA_SPECIES === 'undefined') return;

    var btn = document.getElementById('btn-sp-recommend');
    if (btn) {
      btn.addEventListener('click', runRecommendation);
    }
  }

  function runRecommendation() {
    var width = document.getElementById('crit-width').value;
    var exposure = document.getElementById('crit-exposure').value;
    var water = document.getElementById('crit-water').value;

    var results = window.RIMBA_SPECIES.recommend(width, exposure, water);
    renderResults(results);
  }

  function renderResults(list) {
    var container = document.getElementById('sp-results');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = 
        '<div class="empty-state">' +
          '<p>Tidak ada kandidat yang cocok dengan kombinasi kriteria tersebut.</p>' +
          '<p class="text-sm">Coba longgarkan salah satu kriteria.</p>' +
        '</div>';
      return;
    }

    var html = '<h4 class="results-title">Kandidat yang Sesuai (' + list.length + ')</h4>';
    html += '<div class="card-grid">';

    list.forEach(function (sp) {
      html += 
        '<div class="sp-card">' +
          '<div class="sp-name">' + esc(sp.name) + '</div>' +
          '<div class="sp-latin">' + esc(sp.latin) + '</div>' +
          '<div class="sp-tags">' +
            '<span class="tag">Lebar: ' + sp.width.join(', ') + '</span>' +
            '<span class="tag">Paparan: ' + sp.exposure.join(', ') + '</span>' +
            '<span class="tag">Air: ' + sp.water.join(', ') + '</span>' +
          '</div>' +
          '<div class="sp-disclaimer">Perlu verifikasi ahli sebelum penanaman.</div>' +
        '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();