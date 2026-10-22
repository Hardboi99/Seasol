/* Seasol network sections: one-time reveal + linked map/list highlighting (scoped). */
(function () {
	var sections = document.querySelectorAll('.cis-gateway-section, .india-office-network');
	var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	Array.prototype.forEach.call(sections, function (s) {
		var attr = s.classList.contains('cis-gateway-section') ? 'data-dest' : 'data-office';
		function toggle(e, on) {
			var el = e.target.closest && e.target.closest('[' + attr + ']');
			if (!el) return;
			var linked = s.querySelectorAll('[' + attr + '="' + el.getAttribute(attr) + '"]');
			Array.prototype.forEach.call(linked, function (i) { i.classList.toggle('is-active', on); });
		}
		s.addEventListener('mouseover', function (e) { toggle(e, true); });
		s.addEventListener('mouseout', function (e) { toggle(e, false); });
		s.addEventListener('focusin', function (e) { toggle(e, true); });
		s.addEventListener('focusout', function (e) { toggle(e, false); });

		// Hidden start states only exist under .js-reveal-ready, so without JS everything shows.
		if (reduce || !('IntersectionObserver' in window)) return;
		try {
			var io = new IntersectionObserver(function (entries) {
				if (entries[0].isIntersecting) { s.classList.add('is-revealed'); io.disconnect(); }
			}, { threshold: 0.15 });
			s.classList.add('js-reveal-ready');
			io.observe(s);
			// Safety net: never leave content hidden if the observer never fires.
			setTimeout(function () { s.classList.add('is-revealed'); io.disconnect(); }, 15000);
		} catch (err) {
			s.classList.remove('js-reveal-ready');
		}
	});
})();
