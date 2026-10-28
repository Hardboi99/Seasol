/* CIS map: marker tooltips and two-way highlighting between the map and the country cards */
(function () {
	'use strict';

	var map = document.getElementById('cis-map');
	var tip = document.getElementById('cis-tooltip');
	if (!map || !tip) { return; }
	var wrap = map.parentNode;
	var markers = Array.prototype.slice.call(map.querySelectorAll('.ind-mk'));
	var cards = Array.prototype.slice.call(document.querySelectorAll('.cis-page .cx-card'));
	var shapes = Array.prototype.slice.call(map.querySelectorAll('.ind-st'));

	function byCountry(list, id) {
		return list.filter(function (el) { return el.getAttribute('data-country') === id; })[0];
	}

	function showTip(mk) {
		tip.setAttribute('data-type', mk.getAttribute('data-type'));
		tip.innerHTML = '<strong>' + mk.getAttribute('data-city') + '</strong><span>' + mk.getAttribute('data-label') + '</span>';
		var m = mk.getBoundingClientRect(), w = wrap.getBoundingClientRect();
		var x = Math.max(70, Math.min(w.width - 70, m.left - w.left + m.width / 2));
		tip.style.left = x + 'px';
		tip.style.top = (m.top - w.top - 8) + 'px';
		tip.classList.add('is-visible');
		tip.setAttribute('aria-hidden', 'false');
	}

	function setActive(id) {
		var on = !!id;
		map.classList.toggle('has-active', on);
		markers.forEach(function (mk) { mk.classList.toggle('is-active', on && mk.getAttribute('data-country') === id); });
		cards.forEach(function (c) { c.classList.toggle('is-active', on && c.getAttribute('data-country') === id); });
		shapes.forEach(function (s) { s.classList.toggle('is-active', on && s.id === 'cis-' + id); });
		var mk = on && byCountry(markers, id);
		if (mk) {
			showTip(mk);
		} else {
			tip.classList.remove('is-visible');
			tip.setAttribute('aria-hidden', 'true');
		}
	}

	function bind(el, id) {
		el.addEventListener('mouseenter', function () { setActive(id); });
		el.addEventListener('mouseleave', function () { setActive(null); });
		el.addEventListener('focus', function () { setActive(id); });
		el.addEventListener('blur', function () { setActive(null); });
	}
	markers.forEach(function (mk) { bind(mk, mk.getAttribute('data-country')); });
	cards.forEach(function (c) { bind(c, c.getAttribute('data-country')); });
	shapes.forEach(function (s) { bind(s, s.id.replace('cis-', '')); });

	// Touch: tap a marker or country to show its tooltip, tap elsewhere to clear
	document.addEventListener('touchstart', function (e) {
		var t = e.target.closest && e.target.closest('.ind-mk, .ind-st, .cx-card');
		if (!t) { setActive(null); return; }
		var id = t.getAttribute('data-country') || (t.id || '').replace('cis-', '');
		setActive(id);
	}, { passive: true });
})();