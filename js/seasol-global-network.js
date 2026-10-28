/* Seasol Global Network – loads the map SVG; country tooltips, keyboard + touch, zoom/pan,
   and zoom-aware country labels with collision detection. */
(function () {
    'use strict';
    var root = document.querySelector('.global-network');
    if (!root) { return; }
    var canvas = root.querySelector('.gn-canvas');
    var scroller = root.querySelector('.gn-scroll');
    var wrap = root.querySelector('.gn-stage');
    var tip = root.querySelector('.gn-tooltip');
    var src = canvas.getAttribute('data-src');
    var svg, group, vbWidth = 1200, countries = [], labels = [], dots = [];
    var active = null, idx = -1, zoom = 1, raf = 0, dragged = false;

    /* ---------- tooltip ---------- */
    function show(c, anchor) {
        if (active && active !== c) { active.classList.remove('is-active'); }
        active = c;
        c.classList.add('is-active');
        group.appendChild(c); /* bring the highlighted outline to the front */
        tip.textContent = c.getAttribute('data-name');
        var r = (anchor || c).getBoundingClientRect(), w = wrap.getBoundingClientRect();
        var x = r.left + r.width / 2 - w.left, y = r.top + r.height / 2 - w.top;
        var half = tip.offsetWidth / 2 || 60;
        tip.style.left = Math.max(half + 6, Math.min(w.width - half - 6, x)) + 'px';
        tip.style.top = Math.max(34, y) + 'px';
        tip.classList.add('is-visible');
    }
    function hide() {
        if (active) { active.classList.remove('is-active'); active = null; }
        tip.classList.remove('is-visible');
    }
    function step(d) {
        idx = (idx + d + countries.length) % countries.length;
        show(countries[idx]);
        scrollIntoMap(countries[idx]);
    }
    function scrollIntoMap(c) {
        var r = c.getBoundingClientRect(), s = scroller.getBoundingClientRect();
        if (r.left < s.left || r.right > s.right) { scroller.scrollLeft += r.left + r.width / 2 - (s.left + s.width / 2); }
        if (r.top < s.top || r.bottom > s.bottom) { scroller.scrollTop += r.top + r.height / 2 - (s.top + s.height / 2); }
    }

    /* ---------- label layout ---------- */
    function overlap(a, b, pad) {
        return !(a[2] + pad < b[0] || a[0] - pad > b[2] || a[3] + pad * 0.6 < b[1] || a[1] - pad * 0.6 > b[3]);
    }
    function inside(L, x0, y0, x1, y1, tol) {
        var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, ty = y0 + (y1 - y0) * 0.15, by = y1 - (y1 - y0) * 0.15;
        var xl = x0 + w * 0.04, xr = x1 - w * 0.04, pts = [[xl, ty], [xr, ty], [xl, by], [xr, by], [cx, cy], [xl, cy], [xr, cy]], miss = 0, pt = svg.createSVGPoint();
        for (var i = 0; i < pts.length; i++) {
            pt.x = pts[i][0]; pt.y = pts[i][1];
            if (!L.path.isPointInFill(pt) && ++miss > tol) { return false; }
        }
        return true;
    }
    function layout() {
        if (!svg || !labels.length) { return; }
        var s = svg.getBoundingClientRect().width / vbWidth;
        if (!s) { return; }
        var pad = 3 / s, zf = Math.sqrt(zoom), boxes = [], i, L;

        for (i = 0; i < labels.length; i++) {
            L = labels[i];
            L.vis = false;
            var small = L.bw < 40;
            /* major countries are slightly larger; type grows gently with zoom (not linearly with the map) */
            var fs = (L.major ? 10.5 : (small ? 6.5 : 8.5)) / zf;
            fs = Math.min(14, Math.max(fs, (L.major ? 9 : (small ? 6.5 : 7.5)) / s));
            var w = L.w10 * fs / 10, h = fs * 1.05;
            if (!L.major && (w > L.bw * 1.1 || h > L.bh)) { continue; }
            var offs = [], dxs = [0, -0.3, 0.3, -0.6, 0.6], dys = [0, -0.8, 0.8, -1.6, 1.6], a, b;
            for (a = 0; a < dxs.length; a++) { for (b = 0; b < dys.length; b++) { offs.push([dxs[a] * w, dys[b] * h]); } }
            offs.sort(function (p, q) { return (Math.abs(p[0]) / 3 + Math.abs(p[1])) - (Math.abs(q[0]) / 3 + Math.abs(q[1])); });
            for (a = 0; a < offs.length; a++) {
                var cx = L.ax + offs[a][0], cy = L.ay + offs[a][1], box = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], clash = false;
                for (b = 0; b < boxes.length; b++) { if (overlap(box, boxes[b], pad)) { clash = true; break; } }
                if (clash || !inside(L, box[0], box[1], box[2], box[3], L.major ? 2 : 1)) { continue; }
                boxes.push(box);
                L.vis = true; L.fs = fs; L.x = cx; L.y = cy;
                break;
            }
        }

        for (i = 0; i < labels.length; i++) {
            L = labels[i];
            var el = L.el;
            if (L.vis) {
                if (!L.seen) { el.style.transition = 'opacity .25s'; L.seen = true; setTimeout(function (e) { return function () { e.style.transition = ''; }; }(el), 60); }
                el.style.fontSize = L.fs.toFixed(2) + 'px';
                el.style.transform = 'translate(' + L.x.toFixed(1) + 'px,' + L.y.toFixed(1) + 'px)';
            }
            el.classList.toggle('is-on', L.vis);
        }

        /* markers for countries that have no room for a name; skipped if they would sit on a label or another marker */
        var placedDots = [], r = 2.3 / s;
        for (i = 0; i < labels.length; i++) {
            L = labels[i];
            var d = L.dot, show_ = false;
            if (d && !L.vis) {
                show_ = true;
                var dbox = [L.ax - r * 2, L.ay - r * 2, L.ax + r * 2, L.ay + r * 2], k;
                for (k = 0; k < boxes.length && show_; k++) { if (overlap(dbox, boxes[k], 1 / s)) { show_ = false; } }
                for (k = 0; k < placedDots.length && show_; k++) { if (overlap(dbox, placedDots[k], 2 / s)) { show_ = false; } }
                if (show_) { placedDots.push(dbox); d.setAttribute('cx', L.ax); d.setAttribute('cy', L.ay); d.setAttribute('r', r.toFixed(2)); d.style.strokeWidth = (1 / s).toFixed(2); }
            }
            if (d) { d.classList.toggle('is-on', show_); }
        }
    }
    function schedule() { clearTimeout(raf); raf = setTimeout(layout, 40); }

    /* ---------- zoom / pan ---------- */
    function setZoom(z) {
        var fx = (scroller.scrollLeft + scroller.clientWidth / 2) / scroller.scrollWidth;
        var fy = (scroller.scrollTop + scroller.clientHeight / 2) / scroller.scrollHeight;
        zoom = Math.max(1, Math.min(3, z));
        canvas.style.width = (zoom * 100) + '%';
        canvas.style.setProperty('--gn-zoom', zoom);
        scroller.scrollLeft = fx * scroller.scrollWidth - scroller.clientWidth / 2;
        scroller.scrollTop = fy * scroller.scrollHeight - scroller.clientHeight / 2;
        scroller.classList.toggle('is-zoomed', zoom > 1);
        hide();
        schedule();
    }

    function init(markup) {
        canvas.innerHTML = markup;
        svg = canvas.querySelector('svg');
        if (!svg) { return; }
        vbWidth = svg.viewBox.baseVal.width || 1200;
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.classList.add('is-js');
        svg.setAttribute('tabindex', '0');
        svg.setAttribute('aria-label', 'World map with country names. Use arrow keys to move between countries, or hover or tap a country to see its name.');
        group = svg.querySelector('.gn-countries');
        countries = Array.prototype.slice.call(group.querySelectorAll('.gn-country'));
        var byName = {};
        countries.forEach(function (c) {
            byName[c.getAttribute('data-name')] = c;
            c.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { show(c); } });
            c.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hide(); } });
            c.addEventListener('click', function (e) { e.stopPropagation(); if (!dragged) { idx = countries.indexOf(c); show(c); } });
        });
        var dotBy = {};
        Array.prototype.forEach.call(svg.querySelectorAll('.gn-dot'), function (d) {
            var target = byName[d.getAttribute('data-name')];
            dotBy[d.getAttribute('data-name')] = d;
            if (!target) { return; }
            d.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { show(target, d); } });
            d.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hide(); } });
            d.addEventListener('click', function (e) { e.stopPropagation(); idx = countries.indexOf(target); show(target, d); });
        });
        /* take over label placement from the static fallback */
        labels = Array.prototype.map.call(svg.querySelectorAll('.gn-clabel'), function (el) {
            var n = el.getAttribute('data-name');
            el.setAttribute('x', 0); el.setAttribute('y', 0);
            el.style.fontSize = '10px';
            var w10 = el.getComputedTextLength() || el.textContent.length * 5.8;
            return { el: el, path: byName[n], dot: dotBy[n], ax: +el.getAttribute('data-ax'), ay: +el.getAttribute('data-ay'), bw: +el.getAttribute('data-bw'), bh: +el.getAttribute('data-bh'), rank: +el.getAttribute('data-rank'), major: el.getAttribute('data-major') === '1', w10: w10 };
        }).filter(function (L) { return L.path; });
        labels.sort(function (a, b) { return (b.major - a.major) || (a.rank - b.rank); });
        svg.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
            else if (e.key === 'Escape') { hide(); }
        });
        svg.addEventListener('blur', hide);
        svg.addEventListener('click', hide);
        layout();
        setTimeout(function () { svg.classList.add('is-ready'); }, 100);
        if (window.ResizeObserver) { new ResizeObserver(schedule).observe(canvas); }
    }

    if (src && window.fetch) {
        fetch(src).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(init).catch(function () { /* keeps the static <img> fallback */ });
    }

    root.querySelector('[data-gn-zoom="in"]').addEventListener('click', function () { setZoom(zoom + 0.5); });
    root.querySelector('[data-gn-zoom="out"]').addEventListener('click', function () { setZoom(zoom - 0.5); });
    root.querySelector('[data-gn-zoom="reset"]').addEventListener('click', function () { setZoom(1); scroller.scrollLeft = 0; scroller.scrollTop = 0; });
    scroller.addEventListener('scroll', hide, { passive: true });
    window.addEventListener('resize', function () { hide(); schedule(); });

    /* mouse drag to pan when zoomed (touch pans natively) */
    scroller.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0 || zoom === 1) { return; }
        var x = e.clientX, y = e.clientY, sl = scroller.scrollLeft, st = scroller.scrollTop;
        dragged = false;
        function move(ev) {
            if (Math.abs(ev.clientX - x) + Math.abs(ev.clientY - y) > 4) { dragged = true; scroller.classList.add('is-dragging'); hide(); }
            if (dragged) { scroller.scrollLeft = sl - (ev.clientX - x); scroller.scrollTop = st - (ev.clientY - y); }
        }
        function up() {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            scroller.classList.remove('is-dragging');
            setTimeout(function () { dragged = false; }, 0);
        }
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    });
})();