window.RIMBA_CA = (function () {
  'use strict';

  var WIDTH = 12;
  var HEIGHT = 12;

  function createEmptyGrid() {
    var grid = [];
    for (var y = 0; y < HEIGHT; y++) {
      var row = [];
      for (var x = 0; x < WIDTH; x++) row.push(0);
      grid.push(row);
    }
    return grid;
  }

  function resetGrid(grid) {
    for (var y = 0; y < HEIGHT; y++) {
      for (var x = 0; x < WIDTH; x++) grid[y][x] = 0;
    }
  }

  function countNeighbors(grid, x, y, state) {
    var count = 0;
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        var nx = x + dx;
        var ny = y + dy;
        if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
          if (grid[ny][nx] === state) count++;
        }
      }
    }
    return count;
  }

  function step(grid, params) {
    var next = createEmptyGrid();

    // --- LOGIKA BARU: Faktor Pengali Tanaman & Polusi ---
    var plantMultiplier = 1;
    if (params.plantType === 'cepat') plantMultiplier = 1.5;
    if (params.plantType === 'lambat') plantMultiplier = 0.6;
    if (params.plantType === 'bunga') plantMultiplier = 1.3; // Bunga tumbuh cepat
    if (params.plantType === 'semak') plantMultiplier = 1.8; // Semak paling cepat menyebar

    if (params.plantType === 'cepat') plantMultiplier = 1.5;
    if (params.plantType === 'lambat') plantMultiplier = 0.6;

    var airMultiplier = 1;
    if (params.airQuality === 'buruk') airMultiplier = 0.5; // Polusi memperlambat
    if (params.airQuality === 'baik') airMultiplier = 1.2;  // Udara baik mempercepat

    var totalMultiplier = plantMultiplier * airMultiplier;

    for (var y = 0; y < HEIGHT; y++) {
      for (var x = 0; x < WIDTH; x++) {
        var current = grid[y][x];
        var neighborsActive = countNeighbors(grid, x, y, 1) +
                              countNeighbors(grid, x, y, 2) +
                              countNeighbors(grid, x, y, 3);
        
        if (current === 0) {
          var chance = (params.pSeed / 100) + (neighborsActive * 0.03);
          if (Math.random() < (chance * totalMultiplier)) next[y][x] = 1;
          else next[y][x] = 0;
        } else if (current === 1) {
          if (Math.random() < ((params.pGrow1 / 100) * totalMultiplier)) next[y][x] = 2;
          else next[y][x] = 1;
        } else if (current === 2) {
          if (Math.random() < ((params.pGrow2 / 100) * totalMultiplier)) next[y][x] = 3;
          else next[y][x] = 2;
        } else if (current === 3) {
          next[y][x] = 3;
        }
      }
    }
    return next;
  }

  function canopyCover(grid) {
    var count = 0;
    for (var y = 0; y < HEIGHT; y++) {
      for (var x = 0; x < WIDTH; x++) {
        if (grid[y][x] === 3) count++;
      }
    }
    return Math.round((count / (WIDTH * HEIGHT)) * 100);
  }

  return {
    width: WIDTH, height: HEIGHT,
    createEmptyGrid: createEmptyGrid, resetGrid: resetGrid,
    step: step, canopyCover: canopyCover
  };
})();