/* Shared GAN-family diagram (GAN / cGAN / AC-GAN) and a class-column
   highlighter for the CIFAR-10 result grids.
   <div data-gan-diagram="gan|cgan|acgan"></div>
   <div data-class-grid data-src="img/x.png" data-start="0.051" data-step="0.0993" data-width="0.084"></div> */
(function () {
	"use strict";
	var CLASSES = ["airplane", "car", "bird", "cat", "deer", "dog", "frog", "horse", "ship", "truck"];
	var INFO = {
		gan: { name: "GAN", g: "noise z", d: "real / fake",
			text: "The generator only sees noise, so you cannot choose what it draws. The discriminator only judges realism." },
		cgan: { name: "Conditional GAN", g: "noise z + label y", d: "real / fake for this y",
			text: "The label y is fed to both networks. The discriminator judges whether an image is a realistic example of class y, so the generator must respect the label." },
		acgan: { name: "AC-GAN", g: "noise z + label y", d: "real / fake + class ŷ",
			text: "Only the generator receives y. The discriminator gets an auxiliary classifier head and must also predict the class, adding a classification loss for both real and generated images." }
	};
	function box(svg, x, y, w, h, label, hl) {
		PP.svgEl("rect", { x: x, y: y, width: w, height: h, rx: 8, fill: hl ? "rgba(224,123,57,0.12)" : "#fff", stroke: hl ? "#e07b39" : "#2d709c", "stroke-width": 1.6 }, svg);
		var t = PP.svgEl("text", { x: x + w / 2, y: y + h / 2 + 4, "text-anchor": "middle", style: "font-size:13px;font-weight:600;fill:#3d4449" }, svg);
		t.textContent = label;
	}
	function arrow(svg, x1, y1, x2, y2, hl) {
		var c = hl ? "#e07b39" : "#7a8791";
		PP.svgEl("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: c, "stroke-width": hl ? 2.4 : 1.6, "marker-end": hl ? "url(#ga-o)" : "url(#ga-g)" }, svg);
	}
	function drawDiagram(root, mode) {
		var host = root.querySelector(".gd-svg");
		host.innerHTML = "";
		var svg = PP.svgEl("svg", { viewBox: "0 0 680 250", role: "img", "aria-label": INFO[mode].name + " diagram" }, host);
		var defs = PP.svgEl("defs", {}, svg);
		[["ga-g", "#7a8791"], ["ga-o", "#e07b39"]].forEach(function (m) {
			var mk = PP.svgEl("marker", { id: m[0], viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
			PP.svgEl("path", { d: "M0 0 L10 5 L0 10 z", fill: m[1] }, mk);
		});
		var cond = mode !== "gan";
		box(svg, 10, 40, 100, 40, "noise z");
		if (cond) box(svg, 10, 110, 100, 40, "label y", true);
		box(svg, 180, 70, 120, 50, "Generator G");
		box(svg, 180, 170, 120, 40, "real image x");
		box(svg, 380, 110, 130, 50, "Discriminator D");
		arrow(svg, 110, 60, 180, 88);
		if (cond) arrow(svg, 110, 130, 180, 104, true);
		arrow(svg, 300, 95, 380, 128);
		arrow(svg, 300, 190, 380, 145);
		PP.svgEl("text", { x: 340, y: 100, "text-anchor": "middle", style: "font-size:11px" }, svg).textContent = "fake x̃";
		if (mode === "cgan") {
			PP.svgEl("path", { d: "M60 150 L60 232 L445 232 L445 160", fill: "none", stroke: "#e07b39", "stroke-width": 2.4, "marker-end": "url(#ga-o)" }, svg);
			PP.svgEl("text", { x: 250, y: 226, "text-anchor": "middle", style: "font-size:11px;fill:#e07b39" }, svg).textContent = "y also conditions D";
		}
		box(svg, 560, 80, 110, 40, "real / fake");
		arrow(svg, 510, 128, 560, 100);
		if (mode === "acgan") { box(svg, 560, 150, 110, 40, "class ŷ", true); arrow(svg, 510, 142, 560, 170, true); }
		root.querySelector(".gd-text").innerHTML = "<strong>" + INFO[mode].name + ".</strong> " + INFO[mode].text;
	}
	function diagram(root) {
		var start = root.getAttribute("data-gan-diagram");
		root.innerHTML = '<div class="pp-seg" role="group" aria-label="Model">' +
			["gan", "cgan", "acgan"].map(function (m) { return '<button data-value="' + m + '" aria-pressed="' + (m === start) + '">' + INFO[m].name + "</button>"; }).join("") +
			'</div><div class="gd-svg pp-chart pp-narrow"></div><p class="gd-text pp-small" style="margin-top:.8em"></p>';
		PP.seg(root.querySelector(".pp-seg"), function (v) { drawDiagram(root, v); });
	}
	function classGrid(root) {
		var start = +root.getAttribute("data-start"), step = +root.getAttribute("data-step"), w = +root.getAttribute("data-width");
		root.innerHTML = '<div class="pp-seg" role="group" aria-label="Class">' + CLASSES.map(function (c, i) {
			return '<button data-value="' + i + '">' + c + "</button>"; }).join("") + '<button data-value="-1" aria-pressed="true">all</button></div>' +
			'<div style="position:relative"><img src="' + root.getAttribute("data-src") + '" alt="' + root.getAttribute("data-alt") + '" data-zoom style="display:block;width:100%;height:auto;border-radius:8px;border:1px solid #e2e6e9" />' +
			'<div class="cg-shade" style="position:absolute;inset:0;pointer-events:none;transition:opacity .2s"></div></div>';
		var shade = root.querySelector(".cg-shade");
		PP.seg(root.querySelector(".pp-seg"), function (v) {
			v = +v;
			if (v < 0) { shade.style.opacity = 0; return; }
			var l = (start + step * v - w / 2) * 100, r = (start + step * v + w / 2) * 100;
			shade.style.opacity = 1;
			shade.style.background = "linear-gradient(90deg, rgba(255,255,255,.82) " + l + "%, rgba(255,255,255,0) " + l + "%, rgba(255,255,255,0) " + r + "%, rgba(255,255,255,.82) " + r + "%)";
		});
	}
	function init() {
		document.querySelectorAll("[data-gan-diagram]").forEach(diagram);
		document.querySelectorAll("[data-class-grid]").forEach(classGrid);
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
