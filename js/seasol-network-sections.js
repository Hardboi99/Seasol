/* Seasol network sections: one-time reveal + linked map/list interactions */
(function () {
	'use strict';

	var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* -------------------------------------------------------------
	   1. Section 1: CIS Gateway Network
	------------------------------------------------------------- */
	var cisSection = document.getElementById('cis-gateway');
	if (cisSection) {
		var cisMap = document.getElementById('cis-map');
		var validDestinations = {
			'belarus': true, 'ukraine': true, 'russia': true, 'armenia': true,
			'azerbaijan': true, 'turkmenistan': true, 'kazakhstan': true,
			'uzbekistan': true, 'tajikistan': true, 'kyrgyzstan': true
		};

		function getDestKey(el) {
			if (!el) return null;
			var destEl = el.closest('[data-dest]');
			if (destEl) return destEl.getAttribute('data-dest');
			var countryEl = el.closest('[data-country]');
			if (countryEl) return countryEl.getAttribute('data-country');
			var pathEl = el.closest('.c');
			if (pathEl && pathEl.id && validDestinations[pathEl.id]) return pathEl.id;
			return null;
		}

		function clearActive() {
			if (cisMap) cisMap.classList.remove('has-active');
			var activeEls = cisSection.querySelectorAll('.is-active');
			for (var i = 0; i < activeEls.length; i++) {
				activeEls[i].classList.remove('is-active');
			}
		}

		function setActive(dest) {
			clearActive();
			if (!dest || !validDestinations[dest]) return;
			if (cisMap) cisMap.classList.add('has-active');

			// Highlight card
			var card = cisSection.querySelector('.cis-dest[data-dest="' + dest + '"]');
			if (card) card.classList.add('is-active');

			// Highlight SVG country
			var country = cisSection.querySelector('#cis-map #' + dest);
			if (country) country.classList.add('is-active');

			// Highlight SVG routes & particles
			var routeGroup = cisSection.querySelector('#cis-map #routes [data-country="' + dest + '"]');
			if (routeGroup) {
				var routeItems = routeGroup.querySelectorAll('.rt, .fl, .pk');
				for (var j = 0; j < routeItems.length; j++) {
					routeItems[j].classList.add('is-active');
				}
			}

			// Highlight SVG marker
			var marker = cisSection.querySelector('#cis-map .mk[data-country="' + dest + '"]');
			if (marker) marker.classList.add('is-active');
		}

		cisSection.addEventListener('mouseover', function (e) {
			var dest = getDestKey(e.target);
			if (dest) setActive(dest);
		});

		cisSection.addEventListener('mouseout', function (e) {
			var related = e.relatedTarget;
			if (!related || !cisSection.contains(related)) {
				clearActive();
			} else {
				var currentDest = getDestKey(e.target);
				var nextDest = getDestKey(related);
				if (currentDest && currentDest !== nextDest) {
					if (nextDest) {
						setActive(nextDest);
					} else {
						clearActive();
					}
				}
			}
		});

		cisSection.addEventListener('focusin', function (e) {
			var dest = getDestKey(e.target);
			if (dest) setActive(dest);
		});

		cisSection.addEventListener('focusout', function (e) {
			var related = e.relatedTarget;
			if (!related || !cisSection.contains(related)) {
				clearActive();
			} else {
				var nextDest = getDestKey(related);
				if (nextDest) {
					setActive(nextDest);
				} else {
					clearActive();
				}
			}
		});

		cisSection.addEventListener('click', function (e) {
			var marker = e.target.closest && e.target.closest('#cis-map .mk, #cis-map .c');
			if (marker) {
				var dest = getDestKey(marker);
				if (dest) {
					var card = cisSection.querySelector('.cis-dest[data-dest="' + dest + '"]');
					if (card) {
						card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
						card.focus();
					}
				}
			}
		});

		if (reduce || !('IntersectionObserver' in window)) {
			cisSection.classList.add('is-revealed');
		} else {
			try {
				var cisIo = new IntersectionObserver(function (entries) {
					if (entries[0].isIntersecting) {
						cisSection.classList.add('is-revealed');
						cisIo.disconnect();
					}
				}, { threshold: 0.15 });
				cisSection.classList.add('js-reveal-ready');
				cisIo.observe(cisSection);
				setTimeout(function () {
					cisSection.classList.add('is-revealed');
					cisIo.disconnect();
				}, 15000);
			} catch (err) {
				cisSection.classList.add('is-revealed');
			}
		}
	}

	/* -------------------------------------------------------------
	   2. Section 2: India Office Network
	------------------------------------------------------------- */
	var ionSection = document.getElementById('india-offices');
	if (!ionSection) return;

	var map = document.getElementById('map');
	var tooltip = document.getElementById('ion-tooltip');

	// State metadata
	var stateMeta = {
		'delhi': { name: 'Delhi', type: 'Associate office' },
		'maharashtra': { name: 'Maharashtra', type: 'Associate office (Mumbai)' },
		'tamil-nadu': { name: 'Tamil Nadu', type: 'Associate (Chennai) & Sales (Tuticorin)' },
		'west-bengal': { name: 'West Bengal', type: 'Associate office (Kolkata)' },
		'andhra-pradesh': { name: 'Andhra Pradesh', type: 'Sales offices (Krishnapatnam & Visakhapatnam)' },
		'punjab': { name: 'Punjab', type: 'Sales office (Ludhiana)' },
		'gujarat': { name: 'Gujarat', type: 'Sales office' },
		'kerala': { name: 'Kerala', type: 'Upcoming sales office' },
		'karnataka': { name: 'Karnataka', type: 'Upcoming sales office' },
		'telangana': { name: 'Telangana', type: 'Upcoming sales office' },
		'odisha': { name: 'Odisha', type: 'Upcoming sales office' },
		'assam': { name: 'Assam', type: 'Upcoming sales office' },
		'jharkhand': { name: 'Jharkhand', type: 'Upcoming sales office' }
	};

	// City metadata
	var cityMeta = {
		'Delhi': { state: 'delhi', type: 'Associate office' },
		'Mumbai': { state: 'maharashtra', type: 'Associate office' },
		'Chennai': { state: 'tamil-nadu', type: 'Associate office' },
		'Kolkata': { state: 'west-bengal', type: 'Associate office' },
		'Krishnapatnam': { state: 'andhra-pradesh', type: 'Sales office' },
		'Visakhapatnam': { state: 'andhra-pradesh', type: 'Sales office' },
		'Ludhiana': { state: 'punjab', type: 'Sales office' },
		'Gujarat': { state: 'gujarat', type: 'Sales office' },
		'Tuticorin': { state: 'tamil-nadu', type: 'Sales office' },
		'Trivandrum': { state: 'kerala', type: 'Upcoming sales office' },
		'Bengaluru': { state: 'karnataka', type: 'Upcoming sales office' },
		'Hyderabad': { state: 'telangana', type: 'Upcoming sales office' },
		'Bhubaneswar': { state: 'odisha', type: 'Upcoming sales office' },
		'Guwahati': { state: 'assam', type: 'Upcoming sales office' },
		'Ranchi': { state: 'jharkhand', type: 'Upcoming sales office' }
	};

	// 2.1 Scroll-in Observer
	function triggerInView() {
		if (map) map.classList.add('in-view');
		ionSection.classList.add('in-view', 'is-revealed');
	}

	if (reduce || !('IntersectionObserver' in window)) {
		triggerInView();
	} else {
		try {
			var ionIo = new IntersectionObserver(function (entries) {
				if (entries[0].isIntersecting) {
					triggerInView();
					ionIo.disconnect();
				}
			}, { threshold: 0.3 });
			ionSection.classList.add('js-reveal-ready');
			ionIo.observe(ionSection);
			setTimeout(function () {
				triggerInView();
				ionIo.disconnect();
			}, 15000);
		} catch (err) {
			triggerInView();
		}
	}

	// 2.2 Tooltip Helpers
	function showTooltip(x, y, title, type) {
		if (!tooltip) return;
		tooltip.innerHTML = '<strong class="ion-tooltip__title">' + title + '</strong><span class="ion-tooltip__type">' + type + '</span>';
		tooltip.classList.add('is-visible');
		positionTooltip(x, y);
	}

	function positionTooltip(x, y) {
		if (!tooltip) return;
		var pad = 12;
		var tw = tooltip.offsetWidth || 150;
		var th = tooltip.offsetHeight || 44;
		var left = Math.max(pad + tw / 2, Math.min(window.innerWidth - pad - tw / 2, x));
		var top = y - 14;
		if (top - th < pad) {
			top = y + th + 24;
		}
		tooltip.style.left = left + 'px';
		tooltip.style.top = top + 'px';
	}

	function hideTooltip() {
		if (tooltip) tooltip.classList.remove('is-visible');
	}

	// 2.3 Active State Management
	var activeTarget = null;

	function clearActive() {
		if (map) map.classList.remove('has-active');
		var allActive = ionSection.querySelectorAll('.is-active');
		Array.prototype.forEach.call(allActive, function (el) {
			el.classList.remove('is-active');
		});
		activeTarget = null;
		hideTooltip();
	}

	function setActiveFromChip(chip, clientX, clientY) {
		clearActive();
		var city = chip.getAttribute('data-city');
		var stateId = chip.getAttribute('data-state');

		if (map) map.classList.add('has-active');
		chip.classList.add('is-active');

		if (stateId && map) {
			var stateEl = map.querySelector('#' + stateId);
			if (stateEl) stateEl.classList.add('is-active');
		}

		if (city && map) {
			var mk = map.querySelector('.mk[data-city="' + city + '"]');
			if (mk) mk.classList.add('is-active');
		}

		var info = cityMeta[city] || (stateMeta[stateId] ? { state: stateId, type: stateMeta[stateId].type } : null);
		if (info && clientX !== undefined && clientY !== undefined) {
			showTooltip(clientX, clientY, city, info.type);
		}
	}

	function setActiveFromMarker(mk, clientX, clientY) {
		clearActive();
		var city = mk.getAttribute('data-city');
		var stateId = mk.getAttribute('data-state');

		if (map) map.classList.add('has-active');
		mk.classList.add('is-active');

		if (stateId && map) {
			var stateEl = map.querySelector('#' + stateId);
			if (stateEl) stateEl.classList.add('is-active');
		}

		if (city) {
			var chips = ionSection.querySelectorAll('.ion-item[data-city="' + city + '"]');
			Array.prototype.forEach.call(chips, function (c) { c.classList.add('is-active'); });
		}

		var info = cityMeta[city];
		var type = info ? info.type : (mk.getAttribute('data-type') === 'associate' ? 'Associate office' : 'Sales office');
		if (clientX !== undefined && clientY !== undefined) {
			showTooltip(clientX, clientY, city, type);
		}
	}

	function setActiveFromState(st, clientX, clientY) {
		clearActive();
		var stateId = st.id;

		if (map) map.classList.add('has-active');
		st.classList.add('is-active');

		// Highlight all markers within this state
		if (map) {
			var mks = map.querySelectorAll('.mk[data-state="' + stateId + '"]');
			Array.prototype.forEach.call(mks, function (m) { m.classList.add('is-active'); });
		}

		// Highlight all chips for this state
		var chips = ionSection.querySelectorAll('.ion-item[data-state="' + stateId + '"]');
		Array.prototype.forEach.call(chips, function (c) { c.classList.add('is-active'); });

		var info = stateMeta[stateId];
		var title = info ? info.name : stateId;
		var type = info ? info.type : 'Office network';
		if (clientX !== undefined && clientY !== undefined) {
			showTooltip(clientX, clientY, title, type);
		}
	}

	// 2.4 Event Listeners (Hover & Focus)
	ionSection.addEventListener('mouseover', function (e) {
		var chip = e.target.closest && e.target.closest('.ion-item');
		if (chip) {
			setActiveFromChip(chip, e.clientX, e.clientY);
			activeTarget = chip;
			return;
		}

		var mk = e.target.closest && e.target.closest('.mk');
		if (mk) {
			setActiveFromMarker(mk, e.clientX, e.clientY);
			activeTarget = mk;
			return;
		}

		var st = e.target.closest && e.target.closest('.st.hl');
		if (st) {
			setActiveFromState(st, e.clientX, e.clientY);
			activeTarget = st;
			return;
		}
	});

	ionSection.addEventListener('mousemove', function (e) {
		if (activeTarget && tooltip && tooltip.classList.contains('is-visible')) {
			positionTooltip(e.clientX, e.clientY);
		}
	});

	ionSection.addEventListener('mouseout', function (e) {
		var related = e.relatedTarget;
		if (activeTarget && (!related || !activeTarget.contains(related))) {
			clearActive();
		}
	});

	ionSection.addEventListener('focusin', function (e) {
		var chip = e.target.closest && e.target.closest('.ion-item');
		if (chip) {
			var rect = chip.getBoundingClientRect();
			setActiveFromChip(chip, rect.left + rect.width / 2, rect.top);
			activeTarget = chip;
			return;
		}

		var mk = e.target.closest && e.target.closest('.mk');
		if (mk) {
			var rect = mk.getBoundingClientRect();
			setActiveFromMarker(mk, rect.left + rect.width / 2, rect.top);
			activeTarget = mk;
			return;
		}

		var st = e.target.closest && e.target.closest('.st.hl');
		if (st) {
			var rect = st.getBoundingClientRect();
			setActiveFromState(st, rect.left + rect.width / 2, rect.top);
			activeTarget = st;
			return;
		}
	});

	ionSection.addEventListener('focusout', function (e) {
		clearActive();
	});

	// 2.5 Touch & Click Toggle
	ionSection.addEventListener('click', function (e) {
		var chip = e.target.closest && e.target.closest('.ion-item');
		var mk = e.target.closest && e.target.closest('.mk');
		var st = e.target.closest && e.target.closest('.st.hl');

		var target = chip || mk || st;
		if (!target) return;

		// If clicked element was already active on tap, toggle off
		if (target.classList.contains('is-active') && e.pointerType === 'touch') {
			clearActive();
			return;
		}

		var rect = target.getBoundingClientRect();
		var cx = rect.left + rect.width / 2;
		var cy = rect.top;

		if (chip) {
			setActiveFromChip(chip, cx, cy);
			activeTarget = chip;
		} else if (mk) {
			setActiveFromMarker(mk, cx, cy);
			activeTarget = mk;
		} else if (st) {
			setActiveFromState(st, cx, cy);
			activeTarget = st;
		}
	});

	// Tap outside to clear active on touch
	document.addEventListener('click', function (e) {
		if (activeTarget && !ionSection.contains(e.target)) {
			clearActive();
		}
	});
})();
