/* =========================================================
   RIMBA — screen1.js (Versi Final + Interkoneksi Spesies)
   ========================================================= */

(function () {
  'use strict';

  var state = {
    initialized: false,
    leafletMap: null,
    voronoiLayer: null,
    markerGroup: null,
    generatedMarkers: []
  };

  function init() {
    if (state.initialized) return;
    state.initialized = true;

    var mapEl = document.getElementById('map');
    if (!mapEl) return;

    var data = window.RIMBA_DATA;
    if (!data) { showFallback('Data simulasi tidak ditemukan.'); return; }

    if (typeof window.L === 'undefined') {
      showFallback('Peta tidak dapat dimuat (CDN Leaflet tidak tersedia).');
      return;
    }

    // --- 1. Peta dasar (Satelit Esri) ---
    var map = window.L.map('map', {
      center: [data.center.lat, data.center.lng],
      zoom: data.zoom,
      scrollWheelZoom: true,
      zoomControl: false 
    });
    state.leafletMap = map;
    window._rimbaMap = map;

    window.L.control.zoom({ position: 'bottomright' }).addTo(map);

    window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    }).addTo(map);

    // --- 2. Marker titik acuan ---
    data.referencePoints.forEach(function (ref, index) {
      var label = String.fromCharCode(65 + index);
      var circle = window.L.circleMarker([ref.lat, ref.lng], {
        radius: 7, fillColor: '#2f6b3a', color: '#ffffff', weight: 2, fillOpacity: 1
      }).addTo(map);
      circle.bindTooltip('Titik ' + label, { permanent: true, direction: 'right', className: 'ref-tooltip' });
    });

    // --- 3. Marker kandidat lahan awal ---
    state.markerGroup = window.L.layerGroup().addTo(map);

    data.candidates.forEach(function (cand) {
      var icon = window.L.divIcon({
        className: 'candidate-marker',
        html: '<div class="candidate-marker-inner" aria-hidden="true">?</div>',
        iconSize: [26, 26], iconAnchor: [13, 13]
      });
      var marker = window.L.marker([cand.lat, cand.lng], { icon: icon }).addTo(state.markerGroup);

      marker.bindPopup(
        '<div class="popup-title">' + esc(cand.name) + '</div>' +
        '<div class="popup-status">Status: ' + esc(cand.status) + '</div>' +
        '<button type="button" class="popup-btn" data-cand-id="' + esc(cand.id) + '">Lihat detail</button>'
      );
    });

    // --- 4. Siapkan lapisan Voronoi ---
    if (window.RIMBA_VORONOI && window.RIMBA_VORONOI.available()) {
      var cells = window.RIMBA_VORONOI.compute(data.referencePoints, data.refLat, 500);
      if (cells) {
        var vGroup = window.L.layerGroup();
        var colors = ['#4a90e2', '#50e3c2', '#f5a623', '#e94e77'];
        cells.forEach(function (cell, index) {
          if (!cell) return;
          var latlngs = cell.map(function (p) { return [p[0], p[1]]; });
          window.L.polygon(latlngs, {
            color: '#ffffff', weight: 3, fillColor: colors[index % colors.length],
            fillOpacity: 0.35, dashArray: '6,4'
          }).addTo(vGroup);

          var center = window.L.polygon(latlngs).getBounds().getCenter();
          window.L.marker(center, {
            icon: window.L.divIcon({ className: 'voronoi-label', html: 'Wilayah ' + String.fromCharCode(65 + index), iconSize: [80, 20] }),
            interactive: false
          }).addTo(vGroup);
        });
        state.voronoiLayer = vGroup;
      }
    }

    // --- 5. Toggle Voronoi ---
    var toggleEl = document.getElementById('toggle-voronoi');
    if (toggleEl) {
      toggleEl.addEventListener('change', function () {
        if (!state.voronoiLayer) return;
        if (toggleEl.checked) state.voronoiLayer.addTo(map);
        else map.removeLayer(state.voronoiLayer);
      });
    }

    // --- 6. Fitur Pencarian Peta ---
    var btnSearch = document.getElementById('btn-map-search');
    var inputSearch = document.getElementById('map-search-input');
    var labelEl = document.getElementById('map-location-label');
    
    function doSearch() {
      var q = inputSearch.value.trim();
      if (!q) return;
      btnSearch.textContent = 'Mencari...';
      btnSearch.disabled = true;

      fetch('https://photon.komoot.io/api/?q=' + encodeURIComponent(q) + '&limit=1')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.features && data.features.length > 0) {
            var f = data.features[0];
            var lat = f.geometry.coordinates[1];
            var lon = f.geometry.coordinates[0];
            var name = f.properties.name || q;
            var city = f.properties.city || f.properties.state || '';
            map.setView([lat, lon], 16);
            if (labelEl) labelEl.innerHTML = '📍 Lokasi Pencarian: <strong>' + esc(name + (city ? ', ' + city : '')) + '</strong>';
            if (window._searchMarker) map.removeLayer(window._searchMarker);
            window._searchMarker = window.L.marker([lat, lon]).addTo(map).bindPopup('<b>' + esc(name) + '</b>').openPopup();
          } else { alert('Lokasi tidak ditemukan.'); }
        })
        .catch(function() { alert('Gagal mencari lokasi. Pastikan internet menyala.'); })
        .finally(function() { btnSearch.textContent = 'Cari'; btnSearch.disabled = false; });
    }

    if (btnSearch) btnSearch.addEventListener('click', doSearch);
    if (inputSearch) inputSearch.addEventListener('keypress', function(e) { if (e.key === 'Enter') doSearch(); });

    // --- 7. Simulasi Pindai Lahan & Voronoi Dinamis ---
    var btnGen = document.getElementById('btn-generate-candidates');
    if (btnGen) {
      btnGen.addEventListener('click', function() {
        var center = map.getCenter();
        state.generatedMarkers.forEach(function(m) { map.removeLayer(m); });
        state.generatedMarkers = [];
        if (state.markerGroup) state.markerGroup.clearLayers();
        if (state.voronoiLayer) map.removeLayer(state.voronoiLayer);

        var newPoints = [];
        for (var i = 0; i < 5; i++) {
          var rLat = center.lat + (Math.random() - 0.5) * 0.01;
          var rLng = center.lng + (Math.random() - 0.5) * 0.01;
          newPoints.push({ lat: rLat, lng: rLng });
          var marker = window.L.marker([rLat, rLng], {
            icon: window.L.divIcon({ className: 'candidate-marker', html: '<div class="candidate-marker-inner" style="background:#fff4e0;border-color:#7a4b00;color:#7a4b00;">?</div>', iconSize: [26, 26], iconAnchor: [13, 13] })
          }).addTo(map);
          marker.bindPopup(
            '<div class="popup-title">Titik Simulasi #' + (i + 1) + '</div>' +
            '<div class="popup-status">Status: perlu verifikasi</div>' +
            '<button type="button" class="popup-btn" onclick="window.RIMBA_PINDAH_KE_LAPORAN(' + rLat + ', ' + rLng + ')">Laporkan Lahan Ini</button>'
          );
          state.generatedMarkers.push(marker);
        }

        if (window.RIMBA_VORONOI && window.RIMBA_VORONOI.available()) {
          var cells = window.RIMBA_VORONOI.compute(newPoints, center.lat, 500);
          if (cells) {
            var vGroup = window.L.layerGroup();
            var colors = ['#4a90e2', '#50e3c2', '#f5a623', '#e94e77', '#9b59b6'];
            cells.forEach(function (cell, index) {
              if (!cell) return;
              var latlngs = cell.map(function (p) { return [p[0], p[1]]; });
              window.L.polygon(latlngs, { color: '#fff', weight: 3, fillColor: colors[index % colors.length], fillOpacity: 0.35, dashArray: '6,4' }).addTo(vGroup);
              window.L.marker(window.L.polygon(latlngs).getBounds().getCenter(), { icon: window.L.divIcon({ className: 'voronoi-label', html: 'Wilayah ' + String.fromCharCode(65 + index), iconSize: [80, 20] }), interactive: false }).addTo(vGroup);
            });
            state.voronoiLayer = vGroup;
            var toggleEl = document.getElementById('toggle-voronoi');
            if (toggleEl) toggleEl.checked = true;
            state.voronoiLayer.addTo(map);
          }
        }
        if (labelEl) labelEl.innerHTML = '📍 Area Dipindai: <strong>Ditemukan 5 Titik Simulasi</strong>';
      });
    }

    // --- 8. Popup Detail & Interkoneksi ---
    map.on('popupopen', function (e) {
      var btn = e.popup.getElement().querySelector('.popup-btn');
      if (!btn || btn.hasAttribute('onclick')) return;
      btn.addEventListener('click', function () { showDetail(btn.getAttribute('data-cand-id')); });
    });

    map.on('click', function(e) {
      if (e.originalEvent.target.closest('.candidate-marker') || e.originalEvent.target.closest('.leaflet-interactive')) return;
      window.L.popup().setLatLng(e.latlng).setContent(
        '<div style="text-align:center;"><strong style="color:#2f6b3a;">Titik Terpilih</strong><br>' +
        '<span style="font-size:11px;color:#666;">' + e.latlng.lat.toFixed(5) + ', ' + e.latlng.lng.toFixed(5) + '</span><br><br>' +
        '<button type="button" class="btn btn-primary btn-sm" onclick="window.RIMBA_PINDAH_KE_LAPORAN(' + e.latlng.lat + ', ' + e.latlng.lng + ')" style="width:100%;">Laporkan Lahan Ini</button></div>'
      ).openOn(map);
    });

    renderCandidateList();
  }

  // --- FUNGSI JEMBATAN ---
  window.RIMBA_PINDAH_KE_LAPORAN = function(lat, lng) {
    var tabBtn = document.querySelector('[data-screen="screen-4"]');
    if (tabBtn) tabBtn.click();
    var inputLat = document.getElementById('rep-lat');
    var inputLng = document.getElementById('rep-lng');
    var inputTitle = document.getElementById('rep-title');
    if (inputLat && inputLng) { inputLat.value = lat.toFixed(6); inputLng.value = lng.toFixed(6); }
    if (inputTitle) inputTitle.focus();
  };

  window.RIMBA_SYNC_SPECIES = function(width, exposure, water) {
    var tabBtn = document.querySelector('[data-screen="screen-3"]');
    if (tabBtn) tabBtn.click();
    var selWidth = document.getElementById('crit-width');
    var selExposure = document.getElementById('crit-exposure');
    var selWater = document.getElementById('crit-water');
    if (selWidth) selWidth.value = width;
    if (selExposure) selExposure.value = exposure;
    if (selWater) selWater.value = water;
    setTimeout(function() {
      var btnCari = document.getElementById('btn-sp-recommend');
      if (btnCari) btnCari.click();
    }, 100);
  };

  // --- FUNGSI RENDER ---
  function renderCandidateList() {
    var listEl = document.getElementById('candidate-ul');
    var data = window.RIMBA_DATA;
    if (!listEl || !data) return;
    var html = '';
    data.candidates.forEach(function (cand) {
      html += '<li class="cand-item"><button type="button" class="cand-link" data-cand-id="' + esc(cand.id) + '"><span class="cand-name">' + esc(cand.name) + '</span><span class="cand-status">' + esc(cand.status) + '</span></button></li>';
    });
    listEl.innerHTML = html;

    listEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.cand-link');
      if (!btn) return;
      var id = btn.getAttribute('data-cand-id');
      showDetail(id);
      if (state.leafletMap && window.RIMBA_DATA) {
        var found = null;
        for (var i = 0; i < window.RIMBA_DATA.candidates.length; i++) {
          if (window.RIMBA_DATA.candidates[i].id === id) { found = window.RIMBA_DATA.candidates[i]; break; }
        }
        if (found) state.leafletMap.setView([found.lat, found.lng], 18);
      }
    });
  }

  function showDetail(candId) {
    var data = window.RIMBA_DATA;
    if (!data) return;
    var cand = null;
    for (var i = 0; i < data.candidates.length; i++) {
      if (data.candidates[i].id === candId) { cand = data.candidates[i]; break; }
    }
    if (!cand) return;

    var panel = document.getElementById('detail-panel');
    if (!panel) return;

    // HTML Tombol Interkoneksi Baru
    panel.innerHTML =
      '<div class="detail-header"><h3>' + esc(cand.name) + '</h3>' +
        '<button type="button" class="detail-close" aria-label="Tutup">\u00d7</button></div>' +
      '<p class="detail-status">Status: <strong>' + esc(cand.status) + '</strong></p>' +
      '<dl class="detail-dl">' +
        '<dt>Koordinat</dt><dd>' + cand.lat.toFixed(6) + ', ' + cand.lng.toFixed(6) + '</dd>' +
        '<dt>Luas (perkiraan)</dt><dd>' + esc(cand.area) + '</dd>' +
        '<dt>Lebar lahan</dt><dd>' + esc(cand.width) + '</dd>' +
        '<dt>Paparan</dt><dd>' + esc(cand.exposure) + '</dd>' +
        '<dt>Kebutuhan air</dt><dd>' + esc(cand.waterNeed) + '</dd>' +
        '<dt>Catatan</dt><dd>' + esc(cand.notes) + '</dd>' +
      '</dl>' +
      '<div style="margin-top: 16px; text-align: right;">' +
        '<button type="button" id="btn-detail-sync" class="btn btn-primary">Cari Spesies untuk Lahan Ini ➔</button>' +
      '</div>' +
      '<p class="detail-disclaimer">DATA SIMULASI — bukan hasil pengukuran. Status kandidat belum diverifikasi ahli.</p>';

    panel.hidden = false;
    
    // Event listener untuk tombol interkoneksi (lebih aman daripada inline onclick)
    var btnSync = panel.querySelector('#btn-detail-sync');
    if (btnSync) {
      btnSync.addEventListener('click', function() {
        window.RIMBA_SYNC_SPECIES(cand.width, cand.exposure, cand.waterNeed);
      });
    }

    panel.querySelector('.detail-close').addEventListener('click', function () { panel.hidden = true; });
  }

  function showFallback(reason) {
    var mapEl = document.getElementById('map');
    var fbEl = document.getElementById('map-fallback');
    if (mapEl) mapEl.hidden = true;
    if (fbEl) {
      fbEl.hidden = false;
      var note = fbEl.querySelector('.fallback-reason');
      if (note) note.textContent = reason;
    }
    renderCandidateList();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    if (!e.target.closest('[data-screen="screen-1"]')) return;
    setTimeout(function () { if (state.leafletMap) state.leafletMap.invalidateSize(); }, 60);
  });
})();