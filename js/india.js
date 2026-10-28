/* India page: regional tabs and the quick route enquiry (opens a pre-filled email) */
(function () {
	'use strict';

	var tabs = Array.prototype.slice.call(document.querySelectorAll('.in-tab'));
	function show(tab) {
		tabs.forEach(function (t) {
			var on = t === tab;
			t.classList.toggle('is-active', on);
			t.setAttribute('aria-selected', on ? 'true' : 'false');
			t.tabIndex = on ? 0 : -1;
			var panel = document.getElementById(t.getAttribute('aria-controls'));
			if (panel) { panel.classList.toggle('is-active', on); panel.hidden = !on; }
		});
	}
	tabs.forEach(function (t, i) {
		t.addEventListener('click', function () { show(t); });
		t.addEventListener('keydown', function (e) {
			var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
			if (n === null) { return; }
			e.preventDefault();
			var next = tabs[(n + tabs.length) % tabs.length];
			show(next); next.focus();
		});
	});

	var form = document.getElementById('in-route-form');
	if (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var o = form.elements.origin.value, d = form.elements.destination.value, c = form.elements.cargo.value;
			var msg = form.querySelector('.in-form__msg');
			if (!o || !d || !c) { msg.hidden = false; return; }
			msg.hidden = true;
			var body = 'Hello Seasol Maritime team,\n\nPlease share a freight plan for:\nOrigin: ' + o + '\nDestination: ' + d + '\nCargo type: ' + c + '\n\nCommodity, weight/volume and ready date: \n\nThank you.';
			window.location.href = 'mailto:venkat@seasolmaritime.com?subject=' + encodeURIComponent('Route enquiry: ' + o + ' to ' + d) + '&body=' + encodeURIComponent(body);
		});
	}
})();
