// ================================================
// Scenarios Page
// API endpoints used:
//   GET /scenarios/itemTimings,
//   GET /scenarios/laneRoles,
//   GET /scenarios/misc
// ================================================

import { api } from "../api.js";
import {
	loader,
	errorState,
	emptyState,
	miniHeroImg,
	tabBar,
} from "../components.js";
import { heroStore, laneRoleName, formatNumber } from "../utils.js";

export async function renderScenarios() {
	const app = document.getElementById("app");
	app.innerHTML = `
    <div class="page-container">
      <h1 class="section-title">Scenarios</h1>
      <p class="section-subtitle">Win rates based on item timings, lane roles, and miscellaneous game scenarios.</p>

      <div id="scenarios-tabs">
        ${tabBar(
			[
				{ id: "itemtimings", label: "Item Timings" },
				{ id: "laneroles", label: "Lane Roles" },
				{ id: "misc", label: "Miscellaneous" },
			],
			"itemtimings",
			"scenarios-tabs",
		)}
      </div>
      <div id="scenarios-tab-content">${loader()}</div>
    </div>
  `;

	loadScenarioTab("itemtimings");

	window.addEventListener("tab-change", (e) => {
		if (e.detail.container === "scenarios-tabs") {
			document
				.querySelectorAll("#scenarios-tabs .tab-btn")
				.forEach((b) => {
					b.classList.toggle(
						"active",
						b.textContent
							.trim()
							.toLowerCase()
							.replace(/\s+/g, "") === e.detail.tab,
					);
				});
			loadScenarioTab(e.detail.tab);
		}
	});
}

async function loadScenarioTab(tab) {
	const el = document.getElementById("scenarios-tab-content");
	el.innerHTML = loader();

	try {
		switch (tab) {
			case "itemtimings": {
				el.innerHTML = `
          <div class="flex flex-wrap gap-3 mb-4">
            <input type="text" id="item-filter" class="dota-input w-48" placeholder="Filter by item name...">
            <select id="hero-filter-items" class="dota-input dota-select w-48">
              <option value="">All Heroes</option>
              ${heroStore.heroes.map((h) => `<option value="${h.id}">${h.localized_name}</option>`).join("")}
            </select>
          </div>
          <div id="item-timings-data">${loader()}</div>
        `;

				loadItemTimings();
				document
					.getElementById("item-filter")
					.addEventListener("input", () => loadItemTimings());
				document
					.getElementById("hero-filter-items")
					.addEventListener("change", () => loadItemTimings());
				break;
			}

			case "laneroles": {
				el.innerHTML = `
          <div class="flex flex-wrap gap-3 mb-4">
            <select id="lane-role-filter" class="dota-input dota-select w-48">
              <option value="">All Lanes</option>
              <option value="1">Safe Lane</option>
              <option value="2">Mid Lane</option>
              <option value="3">Off Lane</option>
              <option value="4">Jungle</option>
            </select>
            <select id="hero-filter-lane" class="dota-input dota-select w-48">
              <option value="">All Heroes</option>
              ${heroStore.heroes.map((h) => `<option value="${h.id}">${h.localized_name}</option>`).join("")}
            </select>
          </div>
          <div id="lane-roles-data">${loader()}</div>
        `;

				loadLaneRoles();
				document
					.getElementById("lane-role-filter")
					.addEventListener("change", () => loadLaneRoles());
				document
					.getElementById("hero-filter-lane")
					.addEventListener("change", () => loadLaneRoles());
				break;
			}

			case "misc": {
				const data = await api.getMiscScenarios();
				if (!data?.length) {
					el.innerHTML = emptyState("No scenario data");
					return;
				}

				el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Scenario</th><th>Win</th><th>Games</th><th>Win Rate</th></tr></thead>
              <tbody>
                ${data
					.slice(0, 40)
					.map((s) => {
						const wr =
							s.games > 0
								? ((s.wins / s.games) * 100).toFixed(1)
								: "0";
						return `
                    <tr>
                      <td class="text-xs text-dota-text-primary">${s.scenario || "--"}</td>
                      <td class="text-xs">${formatNumber(s.wins)}</td>
                      <td class="text-xs">${formatNumber(s.games)}</td>
                      <td>
                        <div class="flex items-center gap-2">
                          <div class="w-20 stat-bar"><div class="stat-bar-fill ${parseFloat(wr) >= 50 ? "radiant" : "dire"}" style="width:${wr}%"></div></div>
                          <span class="text-xs font-semibold ${parseFloat(wr) >= 50 ? "text-dota-radiant" : "text-dota-dire"}">${wr}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
					})
					.join("")}
              </tbody>
            </table>
          </div>
        `;
				break;
			}
		}
	} catch {
		el.innerHTML = errorState("Failed to load scenarios");
	}
}

async function loadItemTimings() {
	const el = document.getElementById("item-timings-data");
	if (!el) return;
	el.innerHTML = loader();

	try {
		const params = {};
		const item = document.getElementById("item-filter")?.value?.trim();
		const heroId = document.getElementById("hero-filter-items")?.value;
		if (item) params.item = item;
		if (heroId) params.hero_id = heroId;

		const data = await api.getItemTimings(params);
		if (!data?.length) {
			el.innerHTML = emptyState("No item timing data");
			return;
		}

		el.innerHTML = `
      <div class="overflow-table">
        <table class="dota-table">
          <thead><tr><th>Hero</th><th>Item</th><th>Timing</th><th>Games</th><th>Win Rate</th></tr></thead>
          <tbody>
            ${data
				.slice(0, 40)
				.map((d) => {
					const wr =
						d.games > 0
							? ((d.wins / d.games) * 100).toFixed(1)
							: "0";
					return `
                <tr>
                  <td class="flex items-center gap-2">${miniHeroImg(d.hero_id, 28)}<span class="text-xs">${heroStore.getHeroName(d.hero_id)}</span></td>
                  <td class="text-xs text-dota-gold">${(d.item || "").replace(/_/g, " ")}</td>
                  <td class="text-xs">${d.time || "--"} min</td>
                  <td class="text-xs">${formatNumber(d.games)}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="w-16 stat-bar"><div class="stat-bar-fill ${parseFloat(wr) >= 50 ? "radiant" : "dire"}" style="width:${wr}%"></div></div>
                      <span class="text-xs font-semibold ${parseFloat(wr) >= 50 ? "text-dota-radiant" : "text-dota-dire"}">${wr}%</span>
                    </div>
                  </td>
                </tr>
              `;
				})
				.join("")}
          </tbody>
        </table>
      </div>
    `;
	} catch {
		el.innerHTML = errorState("Failed to load item timings");
	}
}

async function loadLaneRoles() {
	const el = document.getElementById("lane-roles-data");
	if (!el) return;
	el.innerHTML = loader();

	try {
		const params = {};
		const laneRole = document.getElementById("lane-role-filter")?.value;
		const heroId = document.getElementById("hero-filter-lane")?.value;
		if (laneRole) params.lane_role = laneRole;
		if (heroId) params.hero_id = heroId;

		const data = await api.getLaneRoles(params);
		if (!data?.length) {
			el.innerHTML = emptyState("No lane role data");
			return;
		}

		el.innerHTML = `
      <div class="overflow-table">
        <table class="dota-table">
          <thead><tr><th>Hero</th><th>Lane</th><th>Games</th><th>Win Rate</th></tr></thead>
          <tbody>
            ${data
				.slice(0, 40)
				.map((d) => {
					const wr =
						d.games > 0
							? ((d.wins / d.games) * 100).toFixed(1)
							: "0";
					return `
                <tr>
                  <td class="flex items-center gap-2">${miniHeroImg(d.hero_id, 28)}<span class="text-xs">${heroStore.getHeroName(d.hero_id)}</span></td>
                  <td class="text-xs">${laneRoleName(d.lane_role)}</td>
                  <td class="text-xs">${formatNumber(d.games)}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="w-16 stat-bar"><div class="stat-bar-fill ${parseFloat(wr) >= 50 ? "radiant" : "dire"}" style="width:${wr}%"></div></div>
                      <span class="text-xs font-semibold ${parseFloat(wr) >= 50 ? "text-dota-radiant" : "text-dota-dire"}">${wr}%</span>
                    </div>
                  </td>
                </tr>
              `;
				})
				.join("")}
          </tbody>
        </table>
      </div>
    `;
	} catch {
		el.innerHTML = errorState("Failed to load lane roles");
	}
}
