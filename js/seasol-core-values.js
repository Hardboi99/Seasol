/* Seasol Core Values: one-time staggered reveal when the section enters the viewport */
(function () {
	'use strict';

	var section = document.getElementById('core-values');
	if (!section) return;

	var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	// No observer or reduced motion: leave the content in its normal, visible state.
	if (reduce || !('IntersectionObserver' in window)) return;

	var io = new IntersectionObserver(function (entries) {
		for (var i = 0; i < entries.length; i++) {
			if (entries[i].isIntersecting) {
				section.classList.add('is-inview');
				io.disconnect();
				break;
			}
		}
	}, { threshold: 0, rootMargin: '0px 0px -15% 0px' });

	section.classList.add('sc-core-values--js');
	io.observe(section);
})();
