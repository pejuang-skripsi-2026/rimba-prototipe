/* =========================================================
   RIMBA — voronoi.js
   Wrapper perhitungan Voronoi berbasis d3-delaunay.
   Voronoi hanya membagi ruang berdasarkan kedekatan titik acuan.
   BUKAN deteksi lahan kosong, BUKAN ukur polusi.
   ========================================================= */

window.RIMBA_VORONOI = (function () {
  'use strict';

  // Proyeksi equirectangular lokal (meter), cukup untuk area kecil
  function project(lat, lng, refLat) {
    var rad = Math.PI / 180;
    var x = lng * Math.cos(refLat * rad) * 111320;
    var y = lat * 111320;
    return [x, y];
  }

  function unproject(x, y, refLat) {
    var rad = Math.PI / 180;
    var lng = x / (111320 * Math.cos(refLat * rad));
    var lat = y / 111320;
    return [lat, lng];
  }

  // Cek ketersediaan d3-delaunay
  function available() {
    return typeof window.d3 !== 'undefined' &&
           typeof window.d3.Delaunay !== 'undefined';
  }

  // Hitung sel Voronoi untuk array titik {lat, lng}
  // Mengembalikan array polygon; tiap polygon = [[lat,lng], ...]
  function compute(points, refLat, padMeters) {
    if (!available()) return null;
    padMeters = padMeters || 400;

    var projected = points.map(function (p) {
      return project(p.lat, p.lng, refLat);
    });

    var xs = projected.map(function (p) { return p[0]; });
    var ys = projected.map(function (p) { return p[1]; });

    var xmin = Math.min.apply(null, xs) - padMeters;
    var xmax = Math.max.apply(null, xs) + padMeters;
    var ymin = Math.min.apply(null, ys) - padMeters;
    var ymax = Math.max.apply(null, ys) + padMeters;

    var delaunay = window.d3.Delaunay.from(projected);
    var voronoi = delaunay.voronoi([xmin, ymin, xmax, ymax]);

    var cells = [];
    for (var i = 0; i < points.length; i++) {
      var poly = voronoi.cellPolygon(i);
      if (!poly) { cells.push(null); continue; }
      var cell = poly.map(function (pt) {
        return unproject(pt[0], pt[1], refLat);
      });
      cells.push(cell);
    }
    return cells;
  }

  return {
    project: project,
    unproject: unproject,
    available: available,
    compute: compute
  };
})();