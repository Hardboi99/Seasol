/* International Network page: dot-matrix world map with illustrative route lines, plus section reveal observers */
(function () {
	'use strict';

	var NS = 'http://www.w3.org/2000/svg';
	var FULL = '0 0 1200 536', CROP = '250 6 910 420';

	/* Illustrative regions only: not offices, ports or confirmed routes. Coordinates are in map units (1200 x 536). */
	var HUB = { x: 853, y: 201 };
	var REGIONS = [
		{ name: 'Europe', x: 628, y: 88, lx: -14, ly: -14, a: 'end', lift: .22, text: 'Freight forwarding connectivity between India and European markets.' },
		{ name: 'CIS / Central Asia', short: 'CIS', x: 790, y: 100, lx: 0, ly: -18, a: 'middle', lift: .3, text: 'Coordinated freight movements linking India with CIS destinations.' },
		{ name: 'Middle East', x: 745, y: 190, lx: -14, ly: 24, a: 'end', lift: .18, text: 'Ocean and air freight forwarding between India and the Middle East.' },
		{ name: 'Africa', x: 668, y: 292, lx: -14, ly: 5, a: 'end', lift: .2, text: 'International freight forwarding supporting trade with African markets.' },
		{ name: 'Americas', x: 352, y: 150, lx: 0, ly: -20, a: 'middle', lift: .34, text: 'Ocean and air freight forwarding connecting India with the Americas.' },
		{ name: 'Asia-Pacific', x: 972, y: 262, lx: 16, ly: 5, a: 'start', lift: .16, text: 'Freight forwarding connectivity between India and Asia-Pacific trade partners.' }
	];

	function el(tag, attrs, parent) {
		var n = document.createElementNS(NS, tag);
		for (var k in attrs) { if (attrs.hasOwnProperty(k)) { n.setAttribute(k, attrs[k]); } }
		if (parent) { parent.appendChild(n); }
		return n;
	}

	/* Label with a translucent dark pill behind the text; width is estimated so no layout read is needed */
	function label(parent, text, x, y, anchor, cls) {
		var size = cls === 'ix-hub__lbl' ? 22 : 15;
		var w = text.length * size * 0.66 + 18, h = size + 11;
		var rx = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
		el('rect', { 'class': 'ix-pill ' + cls, x: rx, y: y - size + 1 - 5, width: w, height: h, rx: h / 2 }, parent);
		var t = el('text', { 'class': 'ix-lbl ' + cls, x: anchor === 'end' ? x - 9 : anchor === 'middle' ? x : x + 9, y: y, 'text-anchor': anchor }, parent);
		t.textContent = text;
	}

	function buildMap() {
		var svg = document.getElementById('intl-map');
		if (!svg) { return; }
		var fig = svg.parentNode;
		var tip = document.createElement('div');
		tip.className = 'ix-tip';
		tip.setAttribute('role', 'status');
		fig.appendChild(tip);

		var routes = el('g', { 'class': 'ix-routes' }, svg);
		var paths = [];
		REGIONS.forEach(function (g, i) {
			var mx = (HUB.x + g.x) / 2, my = (HUB.y + g.y) / 2;
			var len = Math.sqrt(Math.pow(g.x - HUB.x, 2) + Math.pow(g.y - HUB.y, 2));
			var d = 'M' + HUB.x + ' ' + HUB.y + ' Q' + mx.toFixed(1) + ' ' + (my - len * g.lift).toFixed(1) + ' ' + g.x + ' ' + g.y;
			paths.push(d);
			el('path', { 'class': 'ix-route', d: d, pathLength: 100, style: '--ix-i:' + i }, routes);
			el('path', { 'class': 'ix-flow', d: d, style: '--ix-i:' + i }, routes);
			var p = el('circle', { 'class': 'ix-packet', r: 3.2, style: '--ix-i:' + i + ';offset-path:path("' + d + '")' }, routes);
			p.setAttribute('aria-hidden', 'true');
		});

		var marks = el('g', { 'class': 'ix-marks' }, svg);
		REGIONS.forEach(function (g, i) {
			var m = el('g', { 'class': 'ix-mk', tabindex: 0, role: 'img', 'aria-label': g.name + '. ' + g.text, style: '--ix-i:' + i }, marks);
			el('circle', { 'class': 'ix-pulse', cx: g.x, cy: g.y, r: 6 }, m);
			el('circle', { 'class': 'ix-hit', cx: g.x, cy: g.y, r: 22 }, m);
			el('circle', { 'class': 'ix-dot', cx: g.x, cy: g.y, r: 6 }, m);
			var lg = el('g', { 'class': 'ix-lg' }, m);
			label(lg, g.name, g.x + g.lx, g.y + g.ly, g.a, g.short ? 'ix-reg ix-reg--long' : 'ix-reg');
			if (g.short) { label(lg, g.short, g.x + g.lx, g.y + g.ly, g.a, 'ix-reg ix-reg--short'); }
			function show() {
				var r = fig.getBoundingClientRect(), b = m.getBoundingClientRect();
				tip.innerHTML = '<strong></strong><span></span>';
				tip.firstChild.textContent = g.name;
				tip.lastChild.textContent = g.text;
				tip.style.left = Math.min(Math.max(b.left - r.left + b.width / 2, 120), r.width - 120) + 'px';
				var low = b.top - r.top < 110;
				tip.classList.toggle('is-low', low);
				tip.style.top = (low ? b.bottom - r.top + 8 : b.top - r.top - 8) + 'px';
				tip.classList.add('is-on');
			}
			function hide() { tip.classList.remove('is-on'); }
			m.addEventListener('mouseenter', show);
			m.addEventListener('mouseleave', hide);
			m.addEventListener('focus', show);
			m.addEventListener('blur', hide);
		});

		var hub = el('g', { 'class': 'ix-hub' }, svg);
		el('circle', { 'class': 'ix-pulse ix-pulse--hub', cx: HUB.x, cy: HUB.y, r: 10 }, hub);
		el('circle', { 'class': 'ix-pulse ix-pulse--hub ix-pulse--b', cx: HUB.x, cy: HUB.y, r: 10 }, hub);
		el('circle', { 'class': 'ix-hub__dot', cx: HUB.x, cy: HUB.y, r: 8 }, hub);
		label(hub, 'INDIA', HUB.x + 4, HUB.y + 70, 'middle', 'ix-hub__lbl');

		/* Narrow screens: crop to the regions in use so the labels stay readable */
		var mq = window.matchMedia ? window.matchMedia('(max-width: 575px)') : null;
		function fit() { svg.setAttribute('viewBox', mq && mq.matches ? CROP : FULL); }
		fit();
		if (mq && mq.addEventListener) { mq.addEventListener('change', fit); }
	}
	/* One observer per section: adds .is-in once, CSS does the staggering */
	function watch(id, threshold) {
		var s = document.getElementById(id);
		if (!s) { return; }
		function show() { s.classList.add('is-in'); }
		if (!('IntersectionObserver' in window)) { show(); return; }
		var io = new IntersectionObserver(function (entries) {
			if (entries[0].isIntersecting) { show(); io.disconnect(); }
		}, { threshold: threshold });
		io.observe(s);
	}

	buildMap();
	watch('global-coverage', 0.2);
	watch('intl-capabilities', 0.15);
})();
