// ================================================
// Heroes Page
// API endpoints used:
//   GET /heroes, GET /heroStats,
//   GET /heroes/{id}/matches, GET /heroes/{id}/matchups,
//   GET /heroes/{id}/durations, GET /heroes/{id}/players,
//   GET /heroes/{id}/itemPopularity,
//   GET /rankings?hero_id, GET /benchmarks?hero_id
// ================================================

import { api } from "../api.js";
import {
	loader,
	errorState,
	emptyState,
	heroCard,
	miniHeroImg,
	statCard,
	tabBar,
} from "../components.js";
import {
	heroImg,
	heroStore,
	formatDuration,
	formatDurationBinLabel,
	timeAgo,
	formatNumber,
	winRate,
	getAttrClass,
	getAttrBgClass,
	getAttrName,
} from "../utils.js";

let durationChart = null;

// ---- Heroes Grid ----
export async function renderHeroes() {
	const app = document.getElementById("app");
	app.innerHTML = `
    <div class="page-container">
      <h1 class="section-title">Heroes</h1>
      <p class="section-subtitle">Browse all Dota 2 heroes. Click on a hero for detailed stats.</p>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <input type="text" id="hero-search" class="dota-input w-full sm:w-64" placeholder="Search heroes...">
        <div class="flex gap-2" id="attr-filters">
          <button type="button" class="filter-chip active" data-attr="all">All</button>
          <button type="button" class="filter-chip" data-attr="str">Strength</button>
          <button type="button" class="filter-chip" data-attr="agi">Agility</button>
          <button type="button" class="filter-chip" data-attr="int">Intelligence</button>
          <button type="button" class="filter-chip" data-attr="uni">Universal</button>
        </div>
      </div>

      <div id="heroes-grid">${loader("Loading heroes...")}</div>
    </div>
  `;

	try {
		const heroStats = await api.getHeroStats();
		renderHeroGrid(heroStats, "all", "");

		// Search
		document
			.getElementById("hero-search")
			.addEventListener("input", (e) => {
				const activeAttr =
					document.querySelector("#attr-filters .filter-chip.active")
						?.dataset.attr || "all";
				renderHeroGrid(heroStats, activeAttr, e.target.value);
			});

		// Attribute filter
		document
			.getElementById("attr-filters")
			.addEventListener("click", (e) => {
				const chip = e.target.closest(".filter-chip");
				if (!chip) return;
				document
					.querySelectorAll("#attr-filters .filter-chip")
					.forEach((c) => {
						c.classList.remove("active");
					});
				chip.classList.add("active");
				const search = document.getElementById("hero-search").value;
				renderHeroGrid(heroStats, chip.dataset.attr, search);
			});
	} catch (e) {
		document.getElementById("heroes-grid").innerHTML = errorState(
			"Failed to load heroes",
		);
	}
}

function renderHeroGrid(heroes, attr, search) {
	let filtered = heroes;
	if (attr && attr !== "all") {
		const attrMap = { str: "str", agi: "agi", int: "int", uni: "all" };
		filtered = filtered.filter((h) => h.primary_attr === attrMap[attr]);
	}
	if (search) {
		const q = search.toLowerCase();
		filtered = filtered.filter((h) =>
			h.localized_name.toLowerCase().includes(q),
		);
	}

	const grid = document.getElementById("heroes-grid");
	if (filtered.length === 0) {
		grid.innerHTML = emptyState("No heroes match your filters");
		return;
	}

	grid.innerHTML = `
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
      ${filtered
			.map((hero) => {
				const totalPicks =
					(hero["1_pick"] || 0) +
					(hero["2_pick"] || 0) +
					(hero["3_pick"] || 0) +
					(hero["4_pick"] || 0) +
					(hero["5_pick"] || 0) +
					(hero["6_pick"] || 0) +
					(hero["7_pick"] || 0) +
					(hero["8_pick"] || 0);
				const totalWins =
					(hero["1_win"] || 0) +
					(hero["2_win"] || 0) +
					(hero["3_win"] || 0) +
					(hero["4_win"] || 0) +
					(hero["5_win"] || 0) +
					(hero["6_win"] || 0) +
					(hero["7_win"] || 0) +
					(hero["8_win"] || 0);
				const wr =
					totalPicks > 0
						? ((totalWins / totalPicks) * 100).toFixed(1)
						: "0";
				const wrColor =
					parseFloat(wr) >= 50
						? "text-dota-radiant"
						: "text-dota-dire";

				return `
          <a href="#/heroes/${hero.id}" class="hero-card h-20 block" title="${hero.localized_name} - ${wr}% WR">
            <img src="${heroImg(hero)}" alt="${hero.localized_name}" loading="lazy">
            <div class="hero-overlay">
              <div>${hero.localized_name}</div>
              <div class="${wrColor}" style="font-size:0.6rem">${wr}%</div>
            </div>
          </a>
        `;
			})
			.join("")}
    </div>
  `;
}

// ---- Hero Detail ----
export async function renderHeroDetail(heroId) {
	const app = document.getElementById("app");
	app.innerHTML = `<div class="page-container">${loader("Loading hero data...")}</div>`;

	try {
		const hero = heroStore.getHero(parseInt(heroId));
		const heroName = hero ? hero.localized_name : `Hero #${heroId}`;
		const attrClass = hero ? getAttrClass(hero.primary_attr) : "";

		app.innerHTML = `
      <div class="page-container">
        <!-- Hero Header -->
        <div class="flex flex-col md:flex-row items-start gap-6 mb-8">
          <div class="relative">
            <img src="${heroImg(hero || { id: heroId })}" alt="${heroName}" class="w-48 h-28 rounded-lg object-cover border-2 border-dota-border">
          </div>
          <div>
            <a href="#/heroes" class="text-xs text-dota-text-muted hover:text-dota-gold transition-colors mb-2 inline-block">&larr; All Heroes</a>
            <h1 class="section-title text-3xl ${attrClass}">${heroName}</h1>
            ${hero ? `<span class="badge ${getAttrBgClass(hero.primary_attr)} mt-1">${getAttrName(hero.primary_attr)}</span>` : ""}
            ${hero?.attack_type ? `<span class="badge badge-gold ml-2">${hero.attack_type}</span>` : ""}
            ${hero?.roles ? `<div class="flex flex-wrap gap-1 mt-2">${hero.roles.map((r) => `<span class="text-xs text-dota-text-muted bg-dota-card px-2 py-0.5 rounded">${r}</span>`).join("")}</div>` : ""}
          </div>
        </div>

        <!-- Tabs -->
        <div id="hero-tabs">
          ${tabBar(
				[
					{ id: "matchups", label: "Matchups" },
					{ id: "durations", label: "Durations" },
					{ id: "players", label: "Top Players" },
					{ id: "items", label: "Items" },
					{ id: "rankings", label: "Rankings" },
					{ id: "benchmarks", label: "Benchmarks" },
					{ id: "matches", label: "Recent Matches" },
				],
				"matchups",
				"hero-tabs",
			)}
        </div>
        <div id="hero-tab-content">${loader()}</div>
      </div>
    `;

		// Load default tab
		loadHeroTab(heroId, "matchups");

		// Tab change listener
		window.addEventListener("tab-change", function handler(e) {
			if (e.detail.container === "hero-tabs") {
				document
					.querySelectorAll("#hero-tabs .tab-btn")
					.forEach((b) => {
						b.classList.remove("active");
					});
				e.target
					.querySelector?.(`.tab-btn[onclick*="${e.detail.tab}"]`)
					?.classList.add("active");
				// Update active state
				document
					.querySelectorAll("#hero-tabs .tab-btn")
					.forEach((b) => {
						if (
							b.textContent
								.trim()
								.toLowerCase()
								.replace(/\s+/g, "") ===
							e.detail.tab.toLowerCase().replace(/\s+/g, "")
						) {
							b.classList.add("active");
						} else {
							b.classList.remove("active");
						}
					});
				loadHeroTab(heroId, e.detail.tab);
			}
		});
	} catch (e) {
		app.innerHTML = `<div class="page-container">${errorState("Failed to load hero")}</div>`;
	}
}

async function loadHeroTab(heroId, tab) {
	const el = document.getElementById("hero-tab-content");

	if (durationChart) {
		durationChart.destroy();
		durationChart = null;
	}

	el.innerHTML = loader();

	try {
		switch (tab) {
			case "matchups": {
				const data = await api.getHeroMatchups(heroId);
				if (!data?.length) {
					el.innerHTML = emptyState("No matchup data");
					return;
				}
				const sorted = data
					.sort(
						(a, b) => (b.games_played || 0) - (a.games_played || 0),
					)
					.slice(0, 30);
				el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Hero</th><th>Games</th><th>Wins</th><th>Win Rate</th><th>Advantage</th></tr></thead>
              <tbody>
                ${sorted
					.map((m) => {
						const wr = winRate(m.wins, m.games_played);
						return `
                    <tr class="cursor-pointer" onclick="window.location.hash='#/heroes/${m.hero_id}'">
                      <td class="flex items-center gap-2">${miniHeroImg(m.hero_id, 32)}<span class="text-dota-text-primary text-xs">${heroStore.getHeroName(m.hero_id)}</span></td>
                      <td class="text-xs">${m.games_played}</td>
                      <td class="text-xs">${m.wins}</td>
                      <td><span class="text-xs font-semibold ${parseFloat(wr) >= 50 ? "text-dota-radiant" : "text-dota-dire"}">${wr}%</span></td>
                      <td>
                        <div class="w-24">
                          <div class="stat-bar"><div class="stat-bar-fill ${parseFloat(wr) >= 50 ? "radiant" : "dire"}" style="width:${wr}%"></div></div>
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

			case "durations": {
				const data = await api.getHeroDurations(heroId);
				if (!data?.length) {
					el.innerHTML = emptyState("No duration data");
					return;
				}
				const chartData = data
					.filter((d) => (d.games_played || 0) > 0)
					.sort(
						(a, b) =>
							Number(a.duration_bin) - Number(b.duration_bin),
					);

				if (!chartData.length) {
					el.innerHTML = emptyState("No duration data");
					return;
				}

				const labels = chartData.map((d) =>
					formatDurationBinLabel(d.duration_bin),
				);
				const winRates = chartData.map((d) => {
					const games = d.games_played || 0;
					return games > 0
						? Number(((d.wins / games) * 100).toFixed(1))
						: 0;
				});
				const gameCounts = chartData.map((d) => d.games_played || 0);

				el.innerHTML = `
          <div class="dota-card-flat p-4">
            <h3 class="text-sm font-semibold text-dota-text-primary mb-4">Win Rate by Match Duration</h3>
            <div class="relative h-72">
              <canvas id="hero-duration-chart"></canvas>
            </div>
            <div class="mt-3 text-xs text-dota-text-muted">
              Gold line: Win Rate (%), Crimson bars: Games Played
            </div>
          </div>
        `;

				const canvas = document.getElementById("hero-duration-chart");
				if (canvas && window.Chart) {
					durationChart = new window.Chart(canvas, {
						type: "bar",
						data: {
							labels,
							datasets: [
								{
									type: "line",
									label: "Win Rate (%)",
									data: winRates,
									borderColor: "#c9a84c",
									backgroundColor: "rgba(201,168,76,0.2)",
									borderWidth: 2,
									tension: 0.25,
									pointRadius: 3,
									pointBackgroundColor: "#e4cc80",
									yAxisID: "yWinRate",
								},
								{
									type: "bar",
									label: "Games Played",
									data: gameCounts,
									backgroundColor: "rgba(194,60,42,0.45)",
									borderColor: "rgba(194,60,42,0.9)",
									borderWidth: 1,
									yAxisID: "yGames",
								},
							],
						},
						options: {
							responsive: true,
							maintainAspectRatio: false,
							plugins: {
								legend: {
									labels: {
										color: "#e8dcc8",
										font: {
											family: "Rajdhani",
										},
									},
								},
								tooltip: {
									backgroundColor: "#141c28",
									titleColor: "#e8dcc8",
									bodyColor: "#9ca3af",
									borderColor: "#1e2a3a",
									borderWidth: 1,
								},
							},
							scales: {
								x: {
									ticks: {
										color: "#9ca3af",
										maxRotation: 45,
										minRotation: 45,
									},
									grid: {
										color: "rgba(30,42,58,0.35)",
									},
								},
								yWinRate: {
									type: "linear",
									position: "left",
									min: 0,
									max: 100,
									ticks: {
										color: "#e4cc80",
										callback: (v) => `${v}%`,
									},
									title: {
										display: true,
										text: "Win Rate %",
										color: "#e4cc80",
									},
									grid: {
										color: "rgba(30,42,58,0.35)",
									},
								},
								yGames: {
									type: "linear",
									position: "right",
									ticks: {
										color: "#ef4444",
									},
									title: {
										display: true,
										text: "Games",
										color: "#ef4444",
									},
									grid: {
										drawOnChartArea: false,
									},
								},
							},
						},
					});
				}
				break;
			}

			case "players": {
				const data = await api.getHeroPlayers(heroId);
				if (!data?.length) {
					el.innerHTML = emptyState("No player data");
					return;
				}
				el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Player</th><th>Games</th><th>Wins</th><th>Win Rate</th></tr></thead>
              <tbody>
                ${data
					.slice(0, 30)
					.map((p) => {
						const wr = winRate(p.wins, p.games_played);
						return `
                    <tr class="cursor-pointer" onclick="window.location.hash='#/players/${p.account_id}'">
                      <td class="text-dota-text-primary text-xs">${p.account_id}</td>
                      <td class="text-xs">${p.games_played || 0}</td>
                      <td class="text-xs">${p.wins || 0}</td>
                      <td><span class="text-xs font-semibold ${parseFloat(wr) >= 50 ? "text-dota-radiant" : "text-dota-dire"}">${wr}%</span></td>
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

			case "items": {
				const data = await api.getHeroItemPopularity(heroId);
				if (!data) {
					el.innerHTML = emptyState("No item data");
					return;
				}
				const phases = [
					"start_game_items",
					"early_game_items",
					"mid_game_items",
					"late_game_items",
				];
				const phaseNames = [
					"Starting",
					"Early Game",
					"Mid Game",
					"Late Game",
				];
				el.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${phases
				.map((phase, i) => {
					const items = data[phase] || {};
					const sorted = Object.entries(items)
						.sort((a, b) => b[1] - a[1])
						.slice(0, 8);
					if (sorted.length === 0) return "";
					return `
                <div class="dota-card-flat p-4">
                  <h3 class="text-sm font-semibold text-dota-gold mb-3">${phaseNames[i]}</h3>
                  <div class="space-y-2">
                    ${sorted
						.map(([itemId, count]) => {
							const itemName =
								heroStore.getItemName(itemId) || itemId;
							const imageUrl = heroStore.getItemImage(itemId);
							return `
                        <div class="flex items-center gap-2">
                          <img src="${imageUrl}" class="w-8 h-6 rounded" alt="${itemName}" loading="lazy" onerror="this.style.display='none'">
                          <span class="text-xs text-dota-text-primary flex-1">${itemName}</span>
                          <span class="text-xs text-dota-text-muted">${formatNumber(count)}</span>
                        </div>
                      `;
						})
						.join("")}
                  </div>
                </div>
              `;
				})
				.join("")}
          </div>
        `;
				break;
			}

			case "rankings": {
				const data = await api.getRankings(heroId);
				if (!data?.rankings?.length) {
					el.innerHTML = emptyState("No ranking data");
					return;
				}
				el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>#</th><th>Player</th><th>Score</th><th>Account</th></tr></thead>
              <tbody>
                ${data.rankings
					.slice(0, 30)
					.map(
						(r, i) => `
                  <tr class="cursor-pointer" onclick="window.location.hash='#/players/${r.account_id}'">
                    <td class="text-dota-gold text-xs font-bold">${i + 1}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        ${r.avatar ? `<img src="${r.avatar}" class="w-6 h-6 rounded-full" alt="">` : ""}
                        <span class="text-dota-text-primary text-xs">${r.personaname || "Anonymous"}</span>
                      </div>
                    </td>
                    <td class="text-xs text-dota-gold">${(r.score || 0).toFixed(2)}</td>
                    <td class="text-xs text-dota-text-muted">${r.account_id}</td>
                  </tr>
                `,
					)
					.join("")}
              </tbody>
            </table>
          </div>
        `;
				break;
			}

			case "benchmarks": {
				const data = await api.getBenchmarks(heroId);
				if (!data?.result) {
					el.innerHTML = emptyState("No benchmark data");
					return;
				}
				const benchmarks = Object.entries(data.result);
				el.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${benchmarks
				.map(([key, values]) => {
					if (!Array.isArray(values)) return "";
					return `
                <div class="dota-card-flat p-4">
                  <h3 class="text-sm font-semibold text-dota-gold mb-3 capitalize">${key.replace(/_/g, " ")}</h3>
                  <div class="space-y-1.5">
                    ${values
						.map(
							(v) => `
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-dota-text-muted">${(v.percentile * 100).toFixed(0)}th percentile</span>
                        <span class="text-xs text-dota-text-primary font-semibold">${typeof v.value === "number" ? v.value.toFixed(2) : v.value}</span>
                      </div>
                    `,
						)
						.join("")}
                  </div>
                </div>
              `;
				})
				.join("")}
          </div>
        `;
				break;
			}

			case "matches": {
				const data = await api.getHeroMatches(heroId);
				if (!data?.length) {
					el.innerHTML = emptyState("No match data");
					return;
				}
				el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Match ID</th><th>Duration</th><th>Avg MMR</th><th>Winner</th><th>Time</th></tr></thead>
              <tbody>
                ${data
					.slice(0, 30)
					.map(
						(m) => `
                  <tr class="cursor-pointer" onclick="window.location.hash='#/matches/${m.match_id}'">
                    <td class="text-dota-gold text-xs">${m.match_id}</td>
                    <td class="text-xs">${formatDuration(m.duration)}</td>
                    <td class="text-xs">${m.avg_mmr || "--"}</td>
                    <td><span class="${m.radiant_win ? "text-dota-radiant" : "text-dota-dire"} text-xs">${m.radiant_win ? "Radiant" : "Dire"}</span></td>
                    <td class="text-xs text-dota-text-muted">${timeAgo(m.start_time)}</td>
                  </tr>
                `,
					)
					.join("")}
              </tbody>
            </table>
          </div>
        `;
				break;
			}
		}
	} catch (e) {
		el.innerHTML = errorState("Failed to load data");
	}
}
