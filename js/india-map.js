/* India map: marker tooltips and two-way highlighting between the map and the office cards */
(function () {
	'use strict';

	var map = document.getElementById('ind-map');
	var tip = document.getElementById('ind-tooltip');
	if (!map || !tip) { return; }
	var wrap = map.parentNode;
	var markers = Array.prototype.slice.call(map.querySelectorAll('.ind-mk'));
	var cards = Array.prototype.slice.call(document.querySelectorAll('.ind-card'));

	var STATE = { Delhi: 'delhi', Mumbai: 'maharashtra', Chennai: 'tamil-nadu', Kolkata: 'west-bengal', Krishnapatnam: 'andhra-pradesh', Ludhiana: 'punjab', Gujarat: 'gujarat', Visakhapatnam: 'andhra-pradesh', Tuticorin: 'tamil-nadu' };

	function byCity(list, city) {
		return list.filter(function (el) { return el.getAttribute('data-city') === city; })[0];
	}

	function showTip(mk) {
		var type = mk.getAttribute('data-type');
		tip.setAttribute('data-type', type);
		tip.innerHTML = '<strong>' + mk.getAttribute('data-city') + '</strong><span>' + mk.getAttribute('data-label') + '</span>';
		var m = mk.getBoundingClientRect(), w = wrap.getBoundingClientRect();
		var x = m.left - w.left + m.width / 2;
		x = Math.max(60, Math.min(w.width - 60, x));
		tip.style.left = x + 'px';
		tip.style.top = (m.top - w.top - 8) + 'px';
		tip.classList.add('is-visible');
		tip.setAttribute('aria-hidden', 'false');
	}

	function setActive(city) {
		var on = !!city;
		map.classList.toggle('has-active', on);
		markers.forEach(function (mk) { mk.classList.toggle('is-active', on && mk.getAttribute('data-city') === city); });
		cards.forEach(function (c) { c.classList.toggle('is-active', on && c.getAttribute('data-city') === city); });
		Array.prototype.forEach.call(map.querySelectorAll('.ind-st'), function (s) { s.classList.toggle('is-active', on && s.id === STATE[city]); });
		if (on) {
			var mk = byCity(markers, city);
			if (mk) { showTip(mk); }
		} else {
			tip.classList.remove('is-visible');
			tip.setAttribute('aria-hidden', 'true');
		}
	}

	markers.forEach(function (mk) {
		var city = mk.getAttribute('data-city');
		mk.addEventListener('mouseenter', function () { setActive(city); });
		mk.addEventListener('mouseleave', function () { setActive(null); });
		mk.addEventListener('focus', function () { setActive(city); });
		mk.addEventListener('blur', function () { setActive(null); });
	});
	cards.forEach(function (c) {
		var city = c.getAttribute('data-city');
		c.addEventListener('mouseenter', function () { setActive(city); });
		c.addEventListener('mouseleave', function () { setActive(null); });
		c.addEventListener('focus', function () { setActive(city); });
		c.addEventListener('blur', function () { setActive(null); });
		c.addEventListener('click', function () {
			var mk = byCity(markers, city);
			if (!mk) { return; }
			setActive(city);
			if (map.getBoundingClientRect().top < 0) { map.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
		});
	});
	// Touch: tap a marker to show its tooltip, tap elsewhere to clear
	document.addEventListener('touchstart', function (e) {
		var mk = e.target.closest && e.target.closest('.ind-mk');
		if (mk) { setActive(mk.getAttribute('data-city')); }
		else if (!(e.target.closest && e.target.closest('.ind-card'))) { setActive(null); }
	}, { passive: true });
})();