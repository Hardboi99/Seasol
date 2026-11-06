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

			var submitBtn = form.querySelector('button[type="submit"]');
			var originalText = submitBtn ? submitBtn.innerHTML : 'Request plan';
			if (submitBtn) {
				submitBtn.disabled = true;
				submitBtn.innerHTML = 'Sending plan request...';
			}

			fetch('contact-handler.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify({
					form_type: 'route_enquiry',
					origin: o,
					destination: d,
					cargo: c,
					subject: 'Route Enquiry: ' + o + ' to ' + d,
					message: 'Route plan request for ' + c + ' from ' + o + ' to ' + d + '.'
				})
			})
			.then(function (res) { return res.json(); })
			.then(function (resData) {
				if (resData.status === 'success') {
					if (submitBtn) submitBtn.innerHTML = 'Request Sent!';
					alert('Thank you! Your route enquiry has been sent to cs2@seasolmaritime.com. Our team will contact you shortly.');
					form.reset();
				} else {
					throw new Error(resData.message || 'Error');
				}
			})
			.catch(function () {
				var body = 'Hello Seasol Maritime team,\n\nPlease share a freight plan for:\nOrigin: ' + o + '\nDestination: ' + d + '\nCargo type: ' + c + '\n\nCommodity, weight/volume and ready date: \n\nThank you.';
				window.location.href = 'mailto:cs2@seasolmaritime.com?subject=' + encodeURIComponent('Route enquiry: ' + o + ' to ' + d) + '&body=' + encodeURIComponent(body);
			})
			.finally(function () {
				if (submitBtn) {
					submitBtn.disabled = false;
					setTimeout(function () { submitBtn.innerHTML = originalText; }, 3000);
				}
			});
		});
	}
})();
