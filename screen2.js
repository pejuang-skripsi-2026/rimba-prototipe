(function () {
  'use strict';

  var state = { grid: null, isRunning: false, timerId: null, tickMs: 400, tickCount: 0 };

  function init() {
    if (typeof window.RIMBA_CA === 'undefined') return;
    
    state.grid = window.RIMBA_CA.createEmptyGrid();
    renderGrid();
    updateStats();

    document.getElementById('ca-step').addEventListener('click', function () {
      if (state.isRunning) return;
      doStep();
    });

    document.getElementById('ca-run').addEventListener('click', function () {
      if (state.isRunning) pauseSim();
      else startSim();
    });

    document.getElementById('ca-reset').addEventListener('click', function () {
      pauseSim();
      window.RIMBA_CA.resetGrid(state.grid);
      state.tickCount = 0;
      renderGrid();
      updateStats();
    });

    bindParamInputs();
  }

  function startSim() {
    state.isRunning = true;
    var btn = document.getElementById('ca-run');
    btn.textContent = 'Jeda (Pause)';
    btn.classList.add('btn-warning');
    btn.classList.remove('btn-primary');
    state.timerId = setInterval(doStep, state.tickMs);
  }

  function pauseSim() {
    state.isRunning = false;
    if (state.timerId) clearInterval(state.timerId);
    var btn = document.getElementById('ca-run');
    btn.textContent = 'Jalankan Otomatis';
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-warning');
  }

  function doStep() {
    var params = {
      pSeed: parseInt(document.getElementById('param-seed').value, 10),
      pGrow1: parseInt(document.getElementById('param-grow1').value, 10),
      pGrow2: parseInt(document.getElementById('param-grow2').value, 10),
      plantType: document.getElementById('param-plant').value, // BARU
      airQuality: document.getElementById('param-air').value    // BARU
    };

    state.grid = window.RIMBA_CA.step(state.grid, params);
    state.tickCount++;
    renderGrid();
    updateStats();
  }

  function renderGrid() {
    var container = document.getElementById('ca-grid');
    if (!container) return;
    container.innerHTML = '';
    for (var y = 0; y < window.RIMBA_CA.height; y++) {
      for (var x = 0; x < window.RIMBA_CA.width; x++) {
        var cell = document.createElement('div');
        cell.className = 'ca-cell state-' + state.grid[y][x];
        container.appendChild(cell);
      }
    }
  }

  function updateStats() {
    var cover = window.RIMBA_CA.canopyCover(state.grid);
    var labelCover = document.getElementById('ca-coverage');
    var fillBar = document.getElementById('ca-coverage-fill');
    if (labelCover) labelCover.textContent = cover + '%';
    if (fillBar) fillBar.style.width = cover + '%';

    var labelTime = document.getElementById('ca-time');
    if (labelTime) labelTime.textContent = state.tickCount;

    var narrativeEl = document.getElementById('ca-narrative');
    if (!narrativeEl) return;

    if (cover === 100) {
      if (state.isRunning) pauseSim();
      narrativeEl.innerHTML = '<strong>Selesai!</strong> Tutupan tajuk mencapai 100% dalam <strong>' + state.tickCount + ' bulan</strong>.';
      narrativeEl.style.borderLeftColor = '#28a745';
    } else {
      narrativeEl.style.borderLeftColor = 'var(--accent)';
      if (state.tickCount === 0) narrativeEl.innerHTML = 'Lahan kosong. Klik "Step" atau "Jalankan".';
      else if (cover === 0) narrativeEl.innerHTML = 'Bibit belum tumbuh. Coba naikkan peluang atau ganti kondisi udara.';
      else if (cover < 20) narrativeEl.innerHTML = '<strong>Fase Awal:</strong> Vegetasi mulai muncul.';
      else if (cover < 50) narrativeEl.innerHTML = '<strong>Fase Berkembang:</strong> Pohon mulai tumbuh.';
      else if (cover < 80) narrativeEl.innerHTML = '<strong>Fase Rimbun:</strong> Tajuk mulai rapat.';
      else narrativeEl.innerHTML = '<strong>Hampir Klimaks:</strong> Hampir seluruh area tertutup.';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

  function bindParamInputs() {
    var sliders = [
      { id: 'param-seed', out: 'val-seed' },
      { id: 'param-grow1', out: 'val-grow1' },
      { id: 'param-grow2', out: 'val-grow2' }
    ];
    sliders.forEach(function (s) {
      var el = document.getElementById(s.id);
      var out = document.getElementById(s.out);
      if (el && out) {
        // Set nilai awal saat halaman dimuat
        out.textContent = el.value + '%';
        
        // Update saat slider digeser
        el.addEventListener('input', function () {
          out.textContent = el.value + '%';
        });
      }
    });
  }