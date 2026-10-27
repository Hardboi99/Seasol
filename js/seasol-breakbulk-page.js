/*
 * Seasol Maritime - Breakbulk & Special Equipment page: indicative cargo-fit checker.
 * Compares cargo size / weight with typical container internal limits and suggests the equipment type.
 */
(function () {
  'use strict';

  var form = document.getElementById('bb-form');
  if (!form) { return; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  var inL = $('bb-l'), inW = $('bb-w'), inH = $('bb-h'), inT = $('bb-t');
  var badge = $('bb-badge'), body = $('bb-body');
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.bb-scene'));

  /* typical container internal limits (metres / tonnes) - indicative only */
  var LIM = { len: 12.0, wid: 2.35, hgt: 2.38, std: 26, flat: 40 };

  var RESULTS = {
    std: {
      badge: 'Fits standard',
      title: 'Standard container',
      text: 'Your cargo is within typical internal dimensions of a general-purpose container, so it can usually travel as normal FCL cargo. Pre-lashing and blocking keep it secure.',
      pts: ['Choose 20 ft or 40 ft by length and weight', 'Block, brace and lash inside the container', 'No special equipment surcharge in most cases']
    },
    open: {
      badge: 'Over-height',
      title: 'Open-top container',
      text: 'The cargo is too tall for a closed container but within the standard width and floor area. An open top lets it be craned in from above and sheeted over.',
      pts: ['Loaded from above with a crane', 'Over-height must be declared and planned', 'Tarpaulin cover and lashing points checked']
    },
    flat: {
      badge: 'Over-dimension',
      title: 'Flat-rack container',
      text: 'The cargo is wider, taller or heavier than a closed container allows. A flat rack carries it on an open platform with engineered lashing, within permitted overhang limits.',
      pts: ['Side or top overhang planned with the carrier', 'Engineered lashing and bedding for the load', 'Route and permit checks for inland legs']
    },
    bbk: {
      badge: 'Breakbulk',
      title: 'Breakbulk / project cargo',
      text: 'This piece is likely too large or heavy for container equipment. It moves as breakbulk, lashed onto several flat racks or directly onto the vessel with cranes and stevedores.',
      pts: ['Cargo survey, lifting plan and stowage plan', 'Bridge, road and port clearance checks', 'Dedicated handling and securing at the terminal']
    }
  };

  var presets = {
    machine: [5.8, 2.3, 2.3, 18],
    tall: [4.5, 2.2, 3.2, 12],
    wide: [6.0, 3.4, 2.6, 22],
    vessel: [14, 3.8, 4.2, 55]
  };

  function num(n) { var v = parseFloat(n.value); return isFinite(v) && v > 0 ? v : 0; }

  function classify(l, w, h, t) {
    if (l <= LIM.len && w <= LIM.wid && h <= LIM.hgt && t <= LIM.std) { return 'std'; }
    if (l <= LIM.len && w <= LIM.wid && h > LIM.hgt && h <= 4.2 && t <= LIM.std) { return 'open'; }
    if (l <= LIM.len && w <= 4.2 && h <= 4.6 && t <= LIM.flat) { return 'flat'; }
    return 'bbk';
  }

  var last = '';
  function run() {
    var l = num(inL), w = num(inW), h = num(inH), t = num(inT);
    if (!l || !w || !h || !t) { return; }
    var key = classify(l, w, h, t);
    scenes.forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-scene') === key); });
    if (key === last) { return; }
    last = key;
    var r = RESULTS[key];
    badge.textContent = r.badge;
    body.innerHTML = '<h3>' + r.title + '</h3><p>' + r.text + '</p><ul>' +
      r.pts.map(function (p) { return '<li><i class="fa-solid fa-check"></i>' + p + '</li>'; }).join('') + '</ul>';
    body.style.animation = 'none';
    void body.offsetWidth;
    body.style.animation = '';
    if (!reduce) { badge.classList.remove('pulse'); void badge.offsetWidth; badge.classList.add('pulse'); }
  }

  [inL, inW, inH, inT].forEach(function (i) { i.addEventListener('input', run); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  Array.prototype.slice.call(document.querySelectorAll('.bb-presets button')).forEach(function (b) {
    b.addEventListener('click', function () {
      var p = presets[b.getAttribute('data-preset')];
      if (!p) { return; }
      inL.value = p[0]; inW.value = p[1]; inH.value = p[2]; inT.value = p[3];
      run();
    });
  });

  run();
})();
