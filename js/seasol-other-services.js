/*
 * Seasol Maritime - Other Services page.
 * Deep links to the three service tabs (#3pl, #transportation, #value-added), pillar-card jumps,
 * and the service planner that builds an enquiry email. Tabs/reveal/FAQ come from seasol-service-page.js.
 */
(function () {
  'use strict';

  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var IDS = ['3pl', 'transportation', 'value-added'];

  function openTab(id) {
    var tab = document.getElementById('tab-' + id);
    if (tab) { tab.click(); }
  }
  function toFlow() {
    var flow = document.getElementById('flow');
    if (flow) { flow.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  /* hash on load: #3pl etc. */
  function initHash() {
    var hash = (location.hash || '').replace('#', '');
    if (IDS.indexOf(hash) > -1) {
      openTab(hash);
      setTimeout(function () { var f = document.getElementById('flow'); if (f) { f.scrollIntoView(); } }, 120);
    }
  }

  /* pillar cards: open matching tab and scroll */
  function initJump() {
    $$('[data-jump]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openTab(a.getAttribute('data-jump'));
        toFlow();
      });
    });
    window.addEventListener('hashchange', function () {
      var h = (location.hash || '').replace('#', '');
      if (IDS.indexOf(h) > -1) { openTab(h); toFlow(); }
    });
  }

  /* journey track: trigger animation when in view */
  function initTrack() {
    var t = document.querySelector('.os-track');
    if (!t) { return; }
    if (!('IntersectionObserver' in window)) { t.classList.add('is-in'); return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { t.classList.add('is-in'); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(t);
  }

  /* service planner */
  function initPlanner() {
    var wrap = document.getElementById('os-opts');
    if (!wrap) { return; }
    var count = document.getElementById('os-count');
    var list = document.getElementById('os-list');
    var send = document.getElementById('os-send');
    var plain = function (s) { var d = document.createElement('div'); d.innerHTML = s; return d.textContent; };

    function update() {
      var on = $$('.os-opt.is-on', wrap).map(function (b) { return plain(b.getAttribute('data-v')); });
      count.textContent = on.length;
      count.classList.remove('pulse'); void count.offsetWidth; count.classList.add('pulse');
      list.textContent = on.length ? on.join(' • ') : 'Nothing selected yet – tap the options above.';
      var body = 'Hello Seasol Maritime team,\n\nI would like to enquire about:\n' +
        (on.length ? on.map(function (s) { return '- ' + s; }).join('\n') : '- (please advise)') +
        '\n\nCargo / commodity:\nLocations:\nExpected volumes:\n\nThank you.';
      send.href = 'mailto:venkat@seasolmaritime.com?subject=' + encodeURIComponent('Other services enquiry') + '&body=' + encodeURIComponent(body);
    }
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.os-opt') : null;
      if (!b) { return; }
      b.classList.toggle('is-on');
      b.setAttribute('aria-pressed', b.classList.contains('is-on') ? 'true' : 'false');
      update();
    });
    $$('.os-opt', wrap).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    update();
  }

  function init() { initHash(); initJump(); initTrack(); initPlanner(); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
