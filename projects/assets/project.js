/* Shared helpers for project pages: reveal-on-scroll, lightbox, segmented
   controls, tabs, sortable tables and small dependency-free SVG charts. */
(function () {
	"use strict";
	var PP = (window.PP = {});
	var SVGNS = "http://www.w3.org/2000/svg";
	PP.colors = ["#2d709c", "#e07b39", "#4a9d6b", "#8a6bb8", "#c0504d", "#7a8791"];

	function el(tag, attrs, parent) {
		var n = document.createElementNS(SVGNS, tag);
		for (var k in attrs) n.setAttribute(k, attrs[k]);
		if (parent) parent.appendChild(n);
		return n;
	}
	PP.svgEl = el;
	/* Draw charts in the container's own pixel width so text stays at its
	   CSS size instead of scaling with a fixed viewBox. */
	/* Round an axis maximum up to 1, 2, 2.5 or 5 x 10^k so ticks read cleanly. */
	PP.nice = function (v) {
		if (!(v > 0)) return 1;
		var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
		return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
	};
	PP.width = function (root) { return Math.max(300, Math.min(900, Math.round(root.clientWidth || 640))); };

	/* Tooltip ------------------------------------------------------------ */
	var tip;
	PP.tip = function (evt, html) {
		if (!tip) {
			tip = document.createElement("div");
			tip.className = "pp-tip";
			document.body.appendChild(tip);
		}
		if (!html) { tip.classList.remove("is-on"); return; }
		tip.innerHTML = html;
		tip.classList.add("is-on");
		var x = evt.clientX + 14, y = evt.clientY + 14;
		var w = tip.offsetWidth, h = tip.offsetHeight;
		if (x + w > window.innerWidth - 8) x = evt.clientX - w - 14;
		if (y + h > window.innerHeight - 8) y = evt.clientY - h - 14;
		tip.style.left = x + "px";
		tip.style.top = y + "px";
	};
	function bindTip(node, html) {
		node.addEventListener("mousemove", function (e) { PP.tip(e, html); });
		node.addEventListener("mouseleave", function (e) { PP.tip(e, null); });
	}
	PP.bindTip = bindTip;

	/* Reveal on scroll --------------------------------------------------- */
	function reveal() {
		var items = document.querySelectorAll(".pp-reveal");
		if (!("IntersectionObserver" in window)) {
			items.forEach(function (n) { n.classList.add("is-in"); });
			return;
		}
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
			});
		}, { rootMargin: "0px 0px -8% 0px" });
		items.forEach(function (n) {
			// Anything already on screen shows at once; the rest fades in on scroll.
			if (n.getBoundingClientRect().top < window.innerHeight) n.classList.add("is-in");
			else io.observe(n);
		});
		// Content must never stay hidden if the observer does not fire
		// (print, some embedded browsers, screenshot tools).
		setTimeout(function () { items.forEach(function (n) { n.classList.add("is-in"); }); }, 2500);
		window.addEventListener("beforeprint", function () { items.forEach(function (n) { n.classList.add("is-in"); }); });
	}

	/* Lightbox ----------------------------------------------------------- */
	function lightbox() {
		var box = document.createElement("div");
		box.className = "pp-lightbox";
		box.setAttribute("role", "dialog");
		box.setAttribute("aria-label", "Enlarged figure");
		var img = document.createElement("img");
		box.appendChild(img);
		document.body.appendChild(box);
		function close() { box.classList.remove("is-open"); img.removeAttribute("src"); }
		box.addEventListener("click", close);
		document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
		document.addEventListener("click", function (e) {
			var t = e.target.closest ? e.target.closest("img[data-zoom]") : null;
			if (!t) return;
			img.src = t.getAttribute("data-zoom") || t.currentSrc || t.src;
			img.alt = t.alt || "";
			box.classList.add("is-open");
		});
	}

	/* Segmented control: buttons inside [data-seg]. --------------------- */
	PP.seg = function (root, onSelect) {
		var btns = Array.prototype.slice.call(root.querySelectorAll("button"));
		function pick(b, silent) {
			btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
			if (!silent && onSelect) onSelect(b.getAttribute("data-value"), b);
		}
		btns.forEach(function (b) {
			b.type = "button";
			b.addEventListener("click", function () { pick(b); });
		});
		var start = root.querySelector('button[aria-pressed="true"]') || btns[0];
		if (start) pick(start);
		return { pick: function (v) { var b = root.querySelector('button[data-value="' + v + '"]'); if (b) pick(b); } };
	};

	/* Tabs: [data-tabs] holding .pp-seg buttons[data-tab] + [data-panel]. */
	function tabs() {
		document.querySelectorAll("[data-tabs]").forEach(function (root) {
			var btns = root.querySelectorAll("[data-tab]");
			var panels = root.querySelectorAll("[data-panel]");
			function show(id) {
				btns.forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab") === id ? "true" : "false"); });
				panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== id; });
			}
			btns.forEach(function (b) {
				b.type = "button";
				b.setAttribute("role", "tab");
				b.addEventListener("click", function () { show(b.getAttribute("data-tab")); });
			});
			if (btns.length) show(btns[0].getAttribute("data-tab"));
		});
	}

	/* Sortable tables: th[data-sort] in .pp-table-wrap ------------------- */
	function sortable() {
		document.querySelectorAll(".pp-table-wrap table[data-sortable]").forEach(function (table) {
			var ths = table.querySelectorAll("th[data-sort]");
			ths.forEach(function (th) {
				th.tabIndex = 0;
				function go() {
					var idx = Array.prototype.indexOf.call(th.parentNode.children, th);
					var dir = th.getAttribute("aria-sort") === "descending" ? "ascending" : "descending";
					ths.forEach(function (o) { o.removeAttribute("aria-sort"); });
					th.setAttribute("aria-sort", dir);
					var body = table.tBodies[0];
					var rows = Array.prototype.slice.call(body.rows);
					var num = th.getAttribute("data-sort") === "num";
					rows.sort(function (a, b) {
						var x = a.cells[idx].getAttribute("data-v") || a.cells[idx].textContent.trim();
						var y = b.cells[idx].getAttribute("data-v") || b.cells[idx].textContent.trim();
						if (num) { x = parseFloat(x); y = parseFloat(y); }
						var c = x < y ? -1 : x > y ? 1 : 0;
						return dir === "ascending" ? c : -c;
					});
					rows.forEach(function (r) { body.appendChild(r); });
				}
				th.addEventListener("click", go);
				th.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
			});
		});
	}

	/* Grouped bar chart ---------------------------------------------------
	   opts: {categories:[...], series:[{name, values:[...], color}], max, min,
	          fmt(v), height, yTicks, highlight: categoryIndex}            */
	PP.bars = function (root, opts) {
		root.innerHTML = "";
		var W = PP.width(root), H = opts.height || 280, m = { t: 18, r: 10, b: 42, l: 40 };
		var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.label || "Bar chart" }, root);
		var cats = opts.categories, S = opts.series;
		var min = opts.min != null ? opts.min : 0;
		var max = opts.max != null ? opts.max : PP.nice(Math.max.apply(null, S.map(function (s) { return Math.max.apply(null, s.values); })) * 1.08);
		var fmt = opts.fmt || function (v) { return v; };
		var iw = W - m.l - m.r, ih = H - m.t - m.b;
		var y = function (v) { return m.t + ih - ((v - min) / (max - min)) * ih; };
		var ticks = opts.yTicks || 4;
		for (var i = 0; i <= ticks; i++) {
			var tv = min + ((max - min) * i) / ticks;
			el("line", { x1: m.l, x2: W - m.r, y1: y(tv), y2: y(tv), class: "pp-grid" }, svg);
			var t = el("text", { x: m.l - 6, y: y(tv) + 4, "text-anchor": "end" }, svg);
			t.textContent = fmt(Math.round(tv * 100) / 100);
		}
		el("line", { x1: m.l, x2: W - m.r, y1: y(min), y2: y(min), class: "pp-axis" }, svg);
		var band = iw / cats.length, pad = band * 0.18, bw = (band - 2 * pad) / S.length;
		cats.forEach(function (c, ci) {
			var x0 = m.l + ci * band;
			if (opts.highlight === ci) el("rect", { x: x0 + 2, y: m.t - 6, width: band - 4, height: ih + 6, fill: "rgba(45,112,156,0.07)", rx: 4 }, svg);
			S.forEach(function (s, si) {
				var v = s.values[ci];
				if (v == null) return;
				var bx = x0 + pad + si * bw, by = y(v);
				var r = el("rect", { x: bx + 1, y: by, width: Math.max(bw - 2, 1), height: Math.max(y(min) - by, 0), fill: s.color || PP.colors[si % PP.colors.length], rx: 2 }, svg);
				bindTip(r, "<b>" + c + "</b><br>" + s.name + ": " + fmt(v));
				if (opts.labels !== false && bw > 18) {
					var tl = el("text", { x: bx + bw / 2, y: by - 4, "text-anchor": "middle", class: "pp-val" }, svg);
					tl.textContent = fmt(v);
				}
			});
			var lab = el("text", { x: x0 + band / 2, y: H - m.b + 16, "text-anchor": "middle" }, svg);
			lab.textContent = c;
		});
		if (opts.yLabel) {
			var yl = el("text", { x: 12, y: m.t + ih / 2, transform: "rotate(-90 12 " + (m.t + ih / 2) + ")", "text-anchor": "middle" }, svg);
			yl.textContent = opts.yLabel;
		}
		if (S.length > 1 && opts.legend !== false) PP.legend(root, S);
		return svg;
	};

	PP.legend = function (root, series) {
		var ul = document.createElement("ul");
		ul.className = "pp-legend";
		series.forEach(function (s, i) {
			var li = document.createElement("li");
			li.innerHTML = '<i style="background:' + (s.color || PP.colors[i % PP.colors.length]) + '"></i>' + s.name;
			ul.appendChild(li);
		});
		root.appendChild(ul);
	};

	/* Line chart ----------------------------------------------------------
	   opts: {series:[{name, color, points:[[x,y],...], dash}], xMin,xMax,yMin,yMax,
	          xLabel, yLabel, height, marker:{x, label}}                     */
	PP.lines = function (root, opts) {
		root.innerHTML = "";
		var W = PP.width(root), H = opts.height || 300, m = { t: 14, r: 14, b: 40, l: 46 };
		var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.label || "Line chart" }, root);
		var iw = W - m.l - m.r, ih = H - m.t - m.b;
		var X = function (v) { return m.l + ((v - opts.xMin) / (opts.xMax - opts.xMin)) * iw; };
		var Y = function (v) { return m.t + ih - ((v - opts.yMin) / (opts.yMax - opts.yMin)) * ih; };
		var fx = opts.xFmt || function (v) { return Math.round(v * 100) / 100; };
		var fy = opts.yFmt || function (v) { return Math.round(v * 100) / 100; };
		for (var i = 0; i <= 4; i++) {
			var yv = opts.yMin + ((opts.yMax - opts.yMin) * i) / 4;
			el("line", { x1: m.l, x2: W - m.r, y1: Y(yv), y2: Y(yv), class: "pp-grid" }, svg);
			el("text", { x: m.l - 6, y: Y(yv) + 4, "text-anchor": "end" }, svg).textContent = fy(yv);
			var xv = opts.xMin + ((opts.xMax - opts.xMin) * i) / 4;
			el("text", { x: X(xv), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = fx(xv);
		}
		el("line", { x1: m.l, x2: W - m.r, y1: Y(opts.yMin), y2: Y(opts.yMin), class: "pp-axis" }, svg);
		el("line", { x1: m.l, x2: m.l, y1: m.t, y2: m.t + ih, class: "pp-axis" }, svg);
		var clip = "c" + Math.random().toString(36).slice(2);
		var cp = el("clipPath", { id: clip }, el("defs", {}, svg));
		el("rect", { x: m.l, y: m.t, width: iw, height: ih }, cp);
		opts.series.forEach(function (s, si) {
			var d = s.points.map(function (p, k) { return (k ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(" ");
			el("path", { d: d, fill: "none", stroke: s.color || PP.colors[si], "stroke-width": s.width || 2.4, "stroke-dasharray": s.dash || "", "clip-path": "url(#" + clip + ")" }, svg);
		});
		if (opts.marker) {
			el("line", { x1: X(opts.marker.x), x2: X(opts.marker.x), y1: m.t, y2: m.t + ih, stroke: "#22292e", "stroke-dasharray": "4 4", "stroke-width": 1 }, svg);
			(opts.marker.dots || []).forEach(function (dt) {
				if (dt.y < opts.yMin || dt.y > opts.yMax) return;
				el("circle", { cx: X(opts.marker.x), cy: Y(dt.y), r: 4.5, fill: dt.color, stroke: "#fff", "stroke-width": 1.5 }, svg);
			});
		}
		if (opts.xLabel) el("text", { x: m.l + iw / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = opts.xLabel;
		if (opts.yLabel) el("text", { x: 12, y: m.t + ih / 2, transform: "rotate(-90 12 " + (m.t + ih / 2) + ")", "text-anchor": "middle" }, svg).textContent = opts.yLabel;
		if (opts.legend !== false) PP.legend(root, opts.series);
		return { svg: svg, X: X, Y: Y };
	};

	/* Init --------------------------------------------------------------- */
	function init() {
		document.documentElement.classList.remove("pp-js-off");
		reveal();
		lightbox();
		tabs();
		sortable();
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
})();
