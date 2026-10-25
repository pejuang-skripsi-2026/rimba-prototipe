/* =========================================================
   RIMBA — screen1.js (Versi Final Bersih)
   ========================================================= */

(function () {
  'use strict';

  var state = { initialized: false, leafletMap: null, voronoiLayer: null, markerGroup: null, generatedMarkers: [] };

  function init() {
    if (state.initialized) return;
    state.initialized = true;

    var mapEl = document.getElementById('map');
    var data = window.RIMBA_DATA;
    if (!mapEl || !data) return;
    if (typeof window.L === 'undefined') { showFallback('Peta tidak dapat dimuat.'); return; }

    var map = window.L.map('map', {
      center: [data.center.lat, data.center.lng], zoom: data.zoom, scrollWheelZoom: true, zoomControl: false 
    });
    state.leafletMap = map; window._rimbaMap = map;

    window.L.control.zoom({ position: 'bottomright' }).addTo(map);
    window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri', maxZoom: 19
    }).addTo(map);

    // Marker acuan
    data.referencePoints.forEach(function (ref, index) {
      var circle = window.L.circleMarker([ref.lat, ref.lng], { radius: 7, fillColor: '#2f6b3a', color: '#ffffff', weight: 2, fillOpacity: 1 }).addTo(map);
      circle.bindTooltip('Titik ' + String.fromCharCode(65 + index), { permanent: true, direction: 'right', className: 'ref-tooltip' });
    });

    // Marker kandidat awal
    state.markerGroup = window.L.layerGroup().addTo(map);
    data.candidates.forEach(function (cand) {
      var icon = window.L.divIcon({ className: 'candidate-marker', html: '<div class="candidate-marker-inner">?</div>', iconSize: [26, 26], iconAnchor: [13, 13] });
      var marker = window.L.marker([cand.lat, cand.lng], { icon: icon }).addTo(state.markerGroup);
      marker.bindPopup('<div class="popup-title">' + cand.name + '</div><button type="button" class="popup-btn" data-cand-id="' + cand.id + '">Lihat detail</button>');
    });

    // Voronoi awal
    if (window.RIMBA_VORONOI && window.RIMBA_VORONOI.available()) {
      var cells = window.RIMBA_VORONOI.compute(data.referencePoints, data.refLat, 500);
      if (cells) {
        var vGroup = window.L.layerGroup();
        var colors = ['#4a90e2', '#50e3c2', '#f5a623', '#e94e77'];
        cells.forEach(function (cell, index) {
          if (!cell) return;
          var latlngs = cell.map(function (p) { return [p[0], p[1]]; });
          window.L.polygon(latlngs, { color: '#ffffff', weight: 3, fillColor: colors[index % colors.length], fillOpacity: 0.35, dashArray: '6,4' }).addTo(vGroup);
          window.L.marker(window.L.polygon(latlngs).getBounds().getCenter(), { icon: window.L.divIcon({ className: 'voronoi-label', html: 'Wilayah ' + String.fromCharCode(65 + index), iconSize: [80, 20] }), interactive: false }).addTo(vGroup);
        });
        state.voronoiLayer = vGroup;
      }
    }

    // Toggle
    var toggleEl = document.getElementById('toggle-voronoi');
    if (toggleEl) toggleEl.addEventListener('change', function () {
      if (!state.voronoiLayer) return;
      if (toggleEl.checked) state.voronoiLayer.addTo(map); else map.removeLayer(state.voronoiLayer);
    });

    // Pencarian
    var btnSearch = document.getElementById('btn-map-search');
    var inputSearch = document.getElementById('map-search-input');
    var labelEl = document.getElementById('map-location-label');
    if (btnSearch && inputSearch) {
      btnSearch.addEventListener('click', function() {
        var q = inputSearch.value.trim(); if (!q) return;
        btnSearch.textContent = 'Mencari...'; btnSearch.disabled = true;
        fetch('https://photon.komoot.io/api/?q=' + encodeURIComponent(q) + '&limit=1')
          .then(function(res) { return res.json(); })
          .then(function(d) {
            if (d && d.features && d.features.length > 0) {
              var f = d.features[0]; var lat = f.geometry.coordinates[1]; var lon = f.geometry.coordinates[0];
              map.setView([lat, lon], 16);
              if (labelEl) labelEl.innerHTML = '📍 Lokasi: <strong>' + (f.properties.name || q) + '</strong>';
              if (window._searchMarker) map.removeLayer(window._searchMarker);
              window._searchMarker = window.L.marker([lat, lon]).addTo(map).bindPopup('<b>' + (f.properties.name || q) + '</b>').openPopup();
            } else { alert('Lokasi tidak ditemukan.'); }
          }).catch(function() { alert('Gagal mencari. Cek internet.'); }).finally(function() { btnSearch.textContent = 'Cari'; btnSearch.disabled = false; });
      });
    }

    // Pindai Lahan
    var btnGen = document.getElementById('btn-generate-candidates');
    if (btnGen) btnGen.addEventListener('click', function() {
      var center = map.getCenter();
      state.generatedMarkers.forEach(function(m) { map.removeLayer(m); }); state.generatedMarkers = [];
      if (state.markerGroup) state.markerGroup.clearLayers();
      if (state.voronoiLayer) map.removeLayer(state.voronoiLayer);
      
      var newPoints = [];
      for (var i = 0; i < 5; i++) {
        var rLat = center.lat + (Math.random() - 0.5) * 0.01, rLng = center.lng + (Math.random() - 0.5) * 0.01;
        newPoints.push({ lat: rLat, lng: rLng });
        var marker = window.L.marker([rLat, rLng], { icon: window.L.divIcon({ className: 'candidate-marker', html: '<div class="candidate-marker-inner" style="background:#fff4e0;border-color:#7a4b00;color:#7a4b00;">?</div>', iconSize: [26, 26], iconAnchor: [13, 13] }) }).addTo(map);
        marker.bindPopup('<div class="popup-title">Titik #' + (i+1) + '</div><button type="button" class="popup-btn" onclick="window.RIMBA_SHOW_TEMP_DETAIL(\'Titik #'+(i+1)+'\', ' + rLat + ', ' + rLng + ')">Lihat detail</button>');
        state.generatedMarkers.push(marker);
      }
      if (window.RIMBA_VORONOI && window.RIMBA_VORONOI.available()) {
        var cells = window.RIMBA_VORONOI.compute(newPoints, center.lat, 500);
        if (cells) {
          var vGroup = window.L.layerGroup(); var colors = ['#4a90e2', '#50e3c2', '#f5a623', '#e94e77', '#9b59b6'];
          cells.forEach(function (cell, index) {
            if (!cell) return;
            var latlngs = cell.map(function (p) { return [p[0], p[1]]; });
            window.L.polygon(latlngs, { color: '#fff', weight: 3, fillColor: colors[index % colors.length], fillOpacity: 0.35, dashArray: '6,4' }).addTo(vGroup);
            window.L.marker(window.L.polygon(latlngs).getBounds().getCenter(), { icon: window.L.divIcon({ className: 'voronoi-label', html: 'Wilayah ' + String.fromCharCode(65 + index), iconSize: [80, 20] }), interactive: false }).addTo(vGroup);
          });
          state.voronoiLayer = vGroup;
          var toggleEl = document.getElementById('toggle-voronoi'); if (toggleEl) toggleEl.checked = true;
          state.voronoiLayer.addTo(map);
        }
      }
      if (labelEl) labelEl.innerHTML = '📍 Area Dipindai: <strong>5 Titik Simulasi</strong>';
    });

    // Popup Detail & Klik Peta
    map.on('popupopen', function (e) {
      var btn = e.popup.getElement().querySelector('.popup-btn');
      if (!btn || btn.hasAttribute('onclick')) return;
      btn.addEventListener('click', function () { showDetail(btn.getAttribute('data-cand-id')); });
    });

    map.on('click', function(e) {
      if (e.originalEvent.target.closest('.candidate-marker') || e.originalEvent.target.closest('.leaflet-interactive')) return;
      window.L.popup().setLatLng(e.latlng).setContent(
        '<div style="text-align:center;">' +
          '<strong style="color:#2f6b3a; font-size:12px;">Titik Terpilih</strong><br><br>' +
          '<div style="display:flex; gap:5px; justify-content:center;">' +
            '<button type="button" class="btn btn-secondary btn-sm" onclick="window.RIMBA_SYNC_SPECIES(\'sedang\', \'penuh\', \'sedang\')" style="font-size:10px; padding:4px 8px;">Cari Spesies</button>' +
            '<button type="button" class="btn btn-primary btn-sm" onclick="window.RIMBA_PINDAH_KE_LAPORAN(' + e.latlng.lat + ', ' + e.latlng.lng + ')" style="font-size:10px; padding:4px 8px;">Laporkan</button>' +
          '</div>' +
        '</div>'
      ).openOn(map);
    });

    renderCandidateList();
  }

  window.RIMBA_PINDAH_KE_LAPORAN = function(lat, lng) {
    var tabBtn = document.querySelector('[data-screen="screen-4"]'); if (tabBtn) tabBtn.click();
    var inputLat = document.getElementById('rep-lat'), inputLng = document.getElementById('rep-lng'), inputTitle = document.getElementById('rep-title');
    if (inputLat && inputLng) { inputLat.value = lat.toFixed(6); inputLng.value = lng.toFixed(6); }
    if (inputTitle) inputTitle.focus();
  };

  window.RIMBA_SYNC_SPECIES = function(width, exposure, water) {
    var tabBtn = document.querySelector('[data-screen="screen-3"]'); if (tabBtn) tabBtn.click();
    var selWidth = document.getElementById('crit-width'), selExposure = document.getElementById('crit-exposure'), selWater = document.getElementById('crit-water');
    if (selWidth) selWidth.value = width; if (selExposure) selExposure.value = exposure; if (selWater) selWater.value = water;
    setTimeout(function() { var btnCari = document.getElementById('btn-sp-recommend'); if (btnCari) btnCari.click(); }, 150);
  };

  window.RIMBA_SHOW_TEMP_DETAIL = function(name, lat, lng) {
    var panel = document.getElementById('detail-panel'); if (!panel) return;
    panel.innerHTML = '<div class="detail-header"><h3>' + name + '</h3><button type="button" class="detail-close">\u00d7</button></div>' +
      '<p class="detail-status">Status: <strong>perlu verifikasi</strong></p>' +
      '<dl class="detail-dl"><dt>Koordinat</dt><dd>' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</dd><dt>Catatan</dt><dd>Titik probabilistik. Harap verifikasi visual.</dd></dl>' +
      '<div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">' +
        '<button type="button" class="btn btn-secondary" id="btn-temp-report">Laporkan ➔</button>' +
        '<button type="button" class="btn btn-primary" id="btn-temp-species">Cari Spesies ➔</button></div>';
    panel.hidden = false; panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    panel.querySelector('.detail-close').addEventListener('click', function() { panel.hidden = true; });
    panel.querySelector('#btn-temp-report').addEventListener('click', function() { window.RIMBA_PINDAH_KE_LAPORAN(lat, lng); });
    panel.querySelector('#btn-temp-species').addEventListener('click', function() { window.RIMBA_SYNC_SPECIES('sedang', 'penuh', 'sedang'); });
  };

  function renderCandidateList() {
    var listEl = document.getElementById('candidate-ul'); var data = window.RIMBA_DATA; if (!listEl || !data) return;
    var html = ''; data.candidates.forEach(function (cand) { html += '<li class="cand-item"><button type="button" class="cand-link" data-cand-id="' + cand.id + '"><span class="cand-name">' + cand.name + '</span><span class="cand-status">' + cand.status + '</span></button></li>'; });
    listEl.innerHTML = html;
    listEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.cand-link'); if (!btn) return;
      var id = btn.getAttribute('data-cand-id'); showDetail(id);
      if (state.leafletMap && window.RIMBA_DATA) {
        for (var i = 0; i < window.RIMBA_DATA.candidates.length; i++) {
          if (window.RIMBA_DATA.candidates[i].id === id) { state.leafletMap.setView([window.RIMBA_DATA.candidates[i].lat, window.RIMBA_DATA.candidates[i].lng], 18); break; }
        }
      }
    });
  }

  function showDetail(candId) {
    var data = window.RIMBA_DATA; if (!data) return; var cand = null;
    for (var i = 0; i < data.candidates.length; i++) { if (data.candidates[i].id === candId) { cand = data.candidates[i]; break; } }
    if (!cand) return;
    var panel = document.getElementById('detail-panel'); if (!panel) return;
    panel.innerHTML = '<div class="detail-header"><h3>' + cand.name + '</h3><button type="button" class="detail-close">\u00d7</button></div>' +
      '<p class="detail-status">Status: <strong>' + cand.status + '</strong></p>' +
      '<dl class="detail-dl"><dt>Koordinat</dt><dd>' + cand.lat.toFixed(6) + ', ' + cand.lng.toFixed(6) + '</dd><dt>Luas</dt><dd>' + cand.area + '</dd><dt>Lebar</dt><dd>' + cand.width + '</dd></dl>' +
      '<div style="margin-top: 16px; text-align: right;"><button type="button" id="btn-detail-sync" class="btn btn-primary">Cari Spesies untuk Lahan Ini ➔</button></div>';
    panel.hidden = false; panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    panel.querySelector('.detail-close').addEventListener('click', function () { panel.hidden = true; });
    panel.querySelector('#btn-detail-sync').addEventListener('click', function() { window.RIMBA_SYNC_SPECIES(cand.width, cand.exposure, cand.waterNeed); });
  }

  function showFallback(reason) {
    var mapEl = document.getElementById('map'), fbEl = document.getElementById('map-fallback');
    if (mapEl) mapEl.hidden = true; if (fbEl) fbEl.hidden = false;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-screen="screen-1"]')) {
      setTimeout(function () { if (state.leafletMap) state.leafletMap.invalidateSize(); }, 60);
    }
  });
})();