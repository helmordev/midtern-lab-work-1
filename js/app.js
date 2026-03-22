// ================================================
// Main Application Entry Point
// Wires Router, Pages, Global Search
// ================================================

import { api } from "./api.js";
import { Router } from "./router.js";
import { heroStore, debounce, showToast } from "./utils.js";

// Import all pages
import { renderHome } from "./pages/home.js";
import { renderHeroes, renderHeroDetail } from "./pages/heroes.js";
import { renderPlayers, renderPlayerProfile } from "./pages/players.js";
import { renderMatches, renderMatchDetail } from "./pages/matches.js";
import { renderTeams, renderTeamDetail } from "./pages/teams.js";
import { renderProScene, renderLeagueDetail } from "./pages/pro-scene.js";
import { renderRecords } from "./pages/records.js";
import { renderScenarios } from "./pages/scenarios.js";

// ================================================
// Initialize
// ================================================
async function init() {
	// Initialize hero store (load heroes + items for lookups)
	await heroStore.init(api);

	// Setup router
	const router = new Router();

	router
		.on("/", () => renderHome())
		.on("/heroes", () => renderHeroes())
		.on("/heroes/:id", (id) => renderHeroDetail(id))
		.on("/players", () => renderPlayers())
		.on("/players/:id", (id) => renderPlayerProfile(id))
		.on("/matches", () => renderMatches())
		.on("/matches/:id", (id) => renderMatchDetail(id))
		.on("/teams", () => renderTeams())
		.on("/teams/:id", (id) => renderTeamDetail(id))
		.on("/pro-scene", () => renderProScene())
		.on("/pro-scene/:id", (id) => renderLeagueDetail(id))
		.on("/records", () => renderRecords())
		.on("/scenarios", () => renderScenarios());

	router.start();

	// ================================================
	// Global Search
	// ================================================
	setupGlobalSearch("global-search", "search-dropdown");
}

function setupGlobalSearch(inputId, dropdownId) {
	const input = document.getElementById(inputId);
	if (!input) return;

	const dropdown = dropdownId ? document.getElementById(dropdownId) : null;

	const doSearch = debounce(async (query) => {
		if (!query || query.length < 2) {
			if (dropdown) dropdown.classList.add("hidden");
			return;
		}

		// If it looks like a number, it might be a match ID or account ID
		if (/^\d+$/.test(query)) {
			if (dropdown) {
				dropdown.classList.remove("hidden");
				dropdown.innerHTML = `
          <a href="#/players/${query}" class="search-item">
            <div>
              <div class="text-sm text-dota-text-primary">View Player ${query}</div>
              <div class="text-xs text-dota-text-muted">Account ID</div>
            </div>
          </a>
          <a href="#/matches/${query}" class="search-item">
            <div>
              <div class="text-sm text-dota-text-primary">View Match ${query}</div>
              <div class="text-xs text-dota-text-muted">Match ID</div>
            </div>
          </a>
        `;
			}
			return;
		}

		try {
			const results = await api.searchPlayers(query);
			if (!dropdown) return;

			if (!results?.length) {
				dropdown.classList.remove("hidden");
				dropdown.innerHTML =
					'<div class="p-3 text-xs text-dota-text-muted text-center">No results found</div>';
				return;
			}

			dropdown.classList.remove("hidden");
			dropdown.innerHTML = results
				.slice(0, 8)
				.map(
					(p) => `
        <a href="#/players/${p.account_id}" class="search-item">
          <img src="${p.avatarfull || ""}" alt="${p.personaname}" onerror="this.style.display='none'">
          <div>
            <div class="text-sm text-dota-text-primary">${p.personaname || "Anonymous"}</div>
            <div class="text-xs text-dota-text-muted">ID: ${p.account_id}</div>
          </div>
        </a>
      `,
				)
				.join("");
		} catch {
			// Silently fail for search
		}
	}, 350);

	input.addEventListener("input", (e) => doSearch(e.target.value.trim()));

	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			const q = input.value.trim();
			if (q) {
				if (/^\d+$/.test(q)) {
					window.location.hash = `#/players/${q}`;
				} else {
					window.location.hash = `#/players`;
					// Trigger search on players page after navigation
					setTimeout(() => {
						const playerInput = document.getElementById(
							"player-search-input",
						);
						if (playerInput) {
							playerInput.value = q;
							playerInput.dispatchEvent(new Event("input"));
						}
					}, 100);
				}
				if (dropdown) dropdown.classList.add("hidden");
				input.value = "";
			}
		}
		if (e.key === "Escape") {
			if (dropdown) dropdown.classList.add("hidden");
		}
	});

	// Close dropdown when clicking outside
	document.addEventListener("click", (e) => {
		if (
			dropdown &&
			!input.contains(e.target) &&
			!dropdown.contains(e.target)
		) {
			dropdown.classList.add("hidden");
		}
	});

	// Close dropdown on navigation
	window.addEventListener("hashchange", () => {
		if (dropdown) dropdown.classList.add("hidden");
	});
}

// ================================================
// Start App
// ================================================
init().catch((err) => {
	console.error("Failed to initialize app:", err);
	const app = document.getElementById("app");
	app.innerHTML = `
    <div class="page-container text-center py-20">
      <h1 class="section-title text-4xl mb-4">Failed to Initialize</h1>
      <p class="text-dota-text-muted mb-6">Could not connect to the OpenDota API. Please try refreshing the page.</p>
      <button type="button" class="btn-gold" onclick="window.location.reload()">Retry</button>
    </div>
  `;
});
