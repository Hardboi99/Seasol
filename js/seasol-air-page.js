/*
 * Seasol Maritime - Air Freight page: chargeable weight calculator.
 * Volumetric weight (kg) = L x W x H (cm) x pieces / 6000. Chargeable = the greater of actual and volumetric.
 * Indicative only - airlines may apply a different divisor.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var form = document.getElementById('cc-form');
  if (!form) { return; }

  var el = function (id) { return document.getElementById(id); };
  var inputs = ['cc-l', 'cc-w', 'cc-h', 'cc-pcs', 'cc-kg'].map(el);
  var outVol = el('cc-vol'), outAct = el('cc-act'), outChg = el('cc-chg'), badge = el('cc-badge');
  var DIVISOR = 6000;
  var last = { chg: null, basis: '' };
  var anim = null;

  var num = function (node) {
    var v = parseFloat(node.value);
    return isFinite(v) && v > 0 ? v : 0;
  };
  var fmt = function (n) {
    return n.toLocaleString('en-IN', { minimumFractionDigits: n % 1 ? 1 : 0, maximumFractionDigits: 1 });
  };

  function tween(node, from, to) {
    if (anim) { cancelAnimationFrame(anim); }
    if (reduce) { node.textContent = fmt(to); return; }
    var start = null, dur = 520;
    var step = function (ts) {
      if (start === null) { start = ts; }
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(from + (to - from) * eased);
      if (p < 1) { anim = requestAnimationFrame(step); }
    };
    anim = requestAnimationFrame(step);
  }

  function calc() {
    var l = num(inputs[0]), w = num(inputs[1]), h = num(inputs[2]);
    var pcs = Math.max(1, Math.round(num(inputs[3])) || 1);
    var kg = num(inputs[4]);
    var vol = (l * w * h * pcs) / DIVISOR;
    var chg = Math.max(vol, kg);
    var basis = chg === 0 ? 'Enter details' : (vol > kg ? 'Volumetric' : 'Actual');

    outVol.textContent = fmt(Math.round(vol * 10) / 10);
    outAct.textContent = fmt(kg);
    tween(outChg, last.chg === null ? 0 : last.chg, Math.round(chg * 10) / 10);
    last.chg = Math.round(chg * 10) / 10;

    if (badge.textContent !== basis) {
      badge.textContent = basis;
      if (!reduce) {
        badge.classList.remove('pulse');
        void badge.offsetWidth;
        badge.classList.add('pulse');
      }
    }
    last.basis = basis;
  }

  inputs.forEach(function (i) { i.addEventListener('input', calc); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  calc();
})();
