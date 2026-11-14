/* Shared comparison of the three CelebA face generators (DCGAN, RealNVP, VAE)
   from the EECS 6327 study. Usage: <div data-faces-compare="dcgan|realnvp|vae"></div> */
(function () {
	"use strict";
	var MODELS = [
		{ id: "dcgan", name: "DCGAN", url: "../dcgan-faces/", epochs: 100, perEpoch: 0.5, family: "Adversarial (generator vs. discriminator)",
		  sharp: "Sharp", symmetry: "Frequent deformation", stability: "Unstable, mode collapse seen", verdict: "Fastest to train, weakest faces" },
		{ id: "realnvp", name: "RealNVP", url: "../realnvp-faces/", epochs: 50, perEpoch: 2, family: "Normalizing flow (exact likelihood)",
		  sharp: "Sharp", symmetry: "Frequent deformation", stability: "Stable", verdict: "The sweet spot of speed and quality" },
		{ id: "vae", name: "VAE", url: "../vae-faces/", epochs: 30, perEpoch: 6, family: "Variational (ELBO, approximate likelihood)",
		  sharp: "Blurry", symmetry: "Most symmetric faces", stability: "Stable", verdict: "Best structure, slowest, blurriest" }
	];
	function render(root) {
		var current = root.getAttribute("data-faces-compare");
		var chart = document.createElement("div");
		chart.className = "pp-chart";
		root.appendChild(chart);
		PP.bars(chart, {
			categories: MODELS.map(function (m) { return m.name + " (" + m.epochs + " ep × " + m.perEpoch + " min)"; }),
			series: [{ name: "Training time (min)", values: MODELS.map(function (m) { return m.epochs * m.perEpoch; }), color: "#2d709c" }],
			max: 200, height: 240, yLabel: "minutes", fmt: function (v) { return v + ""; },
			highlight: MODELS.map(function (m) { return m.id; }).indexOf(current), label: "Training time per model"
		});
		var wrap = document.createElement("div");
		wrap.className = "pp-table-wrap";
		var rows = [["Approach", "family"], ["Sharpness", "sharp"], ["Face symmetry", "symmetry"], ["Training", "stability"], ["Verdict", "verdict"]];
		var html = "<table><thead><tr><th></th>" + MODELS.map(function (m) {
			return "<th>" + (m.id === current ? m.name + " (this page)" : '<a href="' + m.url + '">' + m.name + "</a>") + "</th>";
		}).join("") + "</tr></thead><tbody>";
		rows.forEach(function (r) {
			html += "<tr><th>" + r[0] + "</th>" + MODELS.map(function (m) {
				return "<td" + (m.id === current ? ' class="pp-best"' : "") + ">" + m[r[1]] + "</td>";
			}).join("") + "</tr>";
		});
		wrap.innerHTML = html + "</tbody></table>";
		root.appendChild(wrap);
	}
	function init() { document.querySelectorAll("[data-faces-compare]").forEach(render); }
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
