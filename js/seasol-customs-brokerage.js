/*
 * Seasol Maritime - Customs Brokerage & Cross Trading page.
 * Deep links to the two service tabs (#customs-brokerage, #cross-trading), pillar-card jumps and the
 * document checklist. Tabs, reveal and FAQ come from seasol-service-page.js.
 */
(function () {
  'use strict';

  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var IDS = ['customs-brokerage', 'cross-trading'];

  function openTab(id) { var t = document.getElementById('tab-' + id); if (t) { t.click(); } }
  function toFlow() { var f = document.getElementById('flow'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }

  function initTabLinks() {
    var hash = (location.hash || '').replace('#', '');
    if (IDS.indexOf(hash) > -1) {
      openTab(hash);
      setTimeout(function () { var f = document.getElementById('flow'); if (f) { f.scrollIntoView(); } }, 120);
    }
    $$('[data-jump]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); openTab(a.getAttribute('data-jump')); toFlow(); });
    });
    window.addEventListener('hashchange', function () {
      var h = (location.hash || '').replace('#', '');
      if (IDS.indexOf(h) > -1) { openTab(h); toFlow(); }
    });
  }

  /* ---------- document checklist ---------- */
  var DOCS = {
    'export': [
      ['Commercial invoice', 'Value, terms and buyer details'],
      ['Packing list', 'Packages, weights and marks'],
      ['Shipping bill details', 'Filed by our customs team'],
      ['Export order / contract', 'Confirms the sale'],
      ['Certificate of origin', 'If required by the buyer or lane']
    ],
    'import': [
      ['Commercial invoice', 'From the overseas supplier'],
      ['Packing list', 'Matches the invoice'],
      ['Bill of lading / air waybill', 'Transport document'],
      ['Bill of entry details', 'Filed by our customs team'],
      ['Import licence / permits', 'For regulated goods only']
    ],
    'cross': [
      ['Commercial invoice', 'Supplier to buyer'],
      ['Packing list', 'Cargo details and weights'],
      ['Sales contract / PO', 'Agreed trade terms'],
      ['Certificate of origin', 'If the buyer requires it'],
      ['Booking and shipping instructions', 'For the carrier']
    ]
  };
  var NAMES = { 'export': 'Export', 'import': 'Import', 'cross': 'Cross trade' };

  function initChecklist() {
    var list = document.getElementById('cb-list');
    if (!list) { return; }
    var ring = document.getElementById('cb-ring'), pct = document.getElementById('cb-pct');
    var status = document.getElementById('cb-status'), count = document.getElementById('cb-count');
    var send = document.getElementById('cb-send'), ringBox = ring.closest('.cb-ring');
    var C = 2 * Math.PI * 52;
    var mode = 'export';
    var state = { 'export': {}, 'import': {}, 'cross': {} };

    function update() {
      var total = DOCS[mode].length;
      var have = DOCS[mode].filter(function (d, i) { return state[mode][i]; });
      var missing = DOCS[mode].filter(function (d, i) { return !state[mode][i]; });
      var p = Math.round(have.length / total * 100);
      ring.style.strokeDashoffset = (C * (1 - have.length / total)).toFixed(1);
      pct.textContent = p + '%';
      count.textContent = have.length + ' of ' + total + ' documents ready';
      status.textContent = p === 100 ? 'Clearance-ready!' : p >= 60 ? 'Almost there' : p > 0 ? 'Good start' : 'Let’s get started';
      ringBox.classList.toggle('is-done', p === 100);
      var name = function (d) { return d[0]; };
      var body = 'Hello Seasol Maritime team,\n\nShipment type: ' + NAMES[mode] +
        '\nDocuments ready: ' + (have.length ? have.map(name).join(', ') : 'none yet') +
        '\nStill to arrange: ' + (missing.length ? missing.map(name).join(', ') : 'none') +
        '\n\nCommodity:\nRoute:\n\nPlease review and advise.\n\nThank you.';
      send.href = 'mailto:venkat@seasolmaritime.com?subject=' + encodeURIComponent('Customs clearance enquiry - ' + NAMES[mode]) + '&body=' + encodeURIComponent(body);
    }

    function render() {
      list.innerHTML = '';
      DOCS[mode].forEach(function (d, i) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        var on = !!state[mode][i];
        b.type = 'button';
        b.className = 'cb-item' + (on ? ' is-on' : '');
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        var box = document.createElement('span');
        box.className = 'cb-item__box';
        box.innerHTML = '<i class="fa-solid fa-check"></i>';
        var tx = document.createElement('span');
        var t1 = document.createElement('span'); t1.textContent = d[0];
        var t2 = document.createElement('small'); t2.textContent = d[1];
        tx.appendChild(t1); tx.appendChild(t2);
        b.appendChild(box); b.appendChild(tx);
        b.addEventListener('click', function () {
          state[mode][i] = !state[mode][i];
          b.classList.toggle('is-on', state[mode][i]);
          b.setAttribute('aria-pressed', state[mode][i] ? 'true' : 'false');
          update();
        });
        li.appendChild(b);
        list.appendChild(li);
      });
      update();
    }

    $$('.cb-seg__b').forEach(function (btn) {
      btn.addEventListener('click', function () {
        mode = btn.getAttribute('data-mode');
        $$('.cb-seg__b').forEach(function (o) {
          var on = o === btn;
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        list.classList.remove('is-swap'); void list.offsetWidth; list.classList.add('is-swap');
        render();
      });
    });
    render();
  }

  function init() { initTabLinks(); initChecklist(); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
