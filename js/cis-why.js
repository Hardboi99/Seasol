/* "Why Seasol for CIS Trade?" reveal: one observer marks the section once, CSS staggers the children */
(function () {
	'use strict';
	var s = document.getElementById('why-seasol-cis');
	if (!s) { return; }
	function show() { s.classList.add('is-in'); }
	if (!('IntersectionObserver' in window)) { show(); return; }
	var io = new IntersectionObserver(function (entries) {
		if (entries[0].isIntersecting) { show(); io.disconnect(); }
	}, { threshold: 0.15 });
	io.observe(s);
})();
