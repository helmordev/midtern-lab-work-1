// ================================================
// Teams Page
// API endpoints used:
//   GET /teams, GET /teams/{team_id},
//   GET /teams/{team_id}/matches,
//   GET /teams/{team_id}/players,
//   GET /teams/{team_id}/heroes
// ================================================

import { api } from '../api.js';
import { loader, errorState, emptyState, miniHeroImg, statCard, tabBar } from '../components.js';
import { heroStore, formatDuration, timeAgo, formatNumber, winRate } from '../utils.js';

// ---- Teams List ----
export async function renderTeams() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-container">
      <h1 class="section-title">Teams</h1>
      <p class="section-subtitle">Browse professional Dota 2 teams.</p>
      
      <div class="mb-6">
        <input type="text" id="team-search" class="dota-input w-full sm:w-64" placeholder="Search teams...">
      </div>
      <div id="teams-list">${loader('Loading teams...')}</div>
    </div>
  `;

  try {
    const teams = await api.getTeams();
    let filtered = teams.filter(t => t.name);
    renderTeamsList(filtered);

    document.getElementById('team-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const results = filtered.filter(t => t.name.toLowerCase().includes(q) || (t.tag || '').toLowerCase().includes(q));
      renderTeamsList(results);
    });
  } catch {
    document.getElementById('teams-list').innerHTML = errorState('Failed to load teams');
  }
}

function renderTeamsList(teams) {
  const el = document.getElementById('teams-list');
  if (!teams.length) { el.innerHTML = emptyState('No teams found'); return; }

  el.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      ${teams.slice(0, 60).map(t => {
        const wr = winRate(t.wins, t.wins + t.losses);
        return `
          <a href="#/teams/${t.team_id}" class="dota-card p-4 block">
            <div class="flex items-center gap-3 mb-3">
              ${t.logo_url ? `<img src="${t.logo_url}" alt="${t.name}" class="w-10 h-10 object-contain rounded" onerror="this.style.display='none'">` : '<div class="w-10 h-10 bg-dota-card-hover rounded flex items-center justify-center text-dota-gold font-bold text-sm">' + (t.tag || t.name[0]) + '</div>'}
              <div class="flex-1 min-w-0">
                <div class="text-sm text-dota-text-primary font-semibold truncate">${t.name}</div>
                <div class="text-xs text-dota-text-muted">${t.tag || ''}</div>
              </div>
              ${t.rating ? `<span class="text-xs text-dota-gold font-bold">${Math.round(t.rating)}</span>` : ''}
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-dota-text-muted">${(t.wins || 0) + (t.losses || 0)} games</span>
              <span class="${parseFloat(wr) >= 50 ? 'text-dota-radiant' : 'text-dota-dire'} font-semibold">${wr}% WR</span>
            </div>
            ${(t.wins || t.losses) ? `
            <div class="wl-bar mt-2">
              <div class="win" style="width:${(t.wins || 0) / ((t.wins || 0) + (t.losses || 0)) * 100}%"></div>
              <div class="loss" style="width:${(t.losses || 0) / ((t.wins || 0) + (t.losses || 0)) * 100}%"></div>
            </div>` : ''}
          </a>
        `;
      }).join('')}
    </div>
  `;
}

// ---- Team Detail ----
export async function renderTeamDetail(teamId) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page-container">${loader('Loading team...')}</div>`;

  try {
    const team = await api.getTeam(teamId);
    const wr = winRate(team.wins, team.wins + team.losses);

    app.innerHTML = `
      <div class="page-container">
        <a href="#/teams" class="text-xs text-dota-text-muted hover:text-dota-gold transition-colors mb-4 inline-block">&larr; All Teams</a>

        <!-- Team Header -->
        <div class="dota-card-flat p-6 mb-6">
          <div class="flex items-center gap-4">
            ${team.logo_url ? `<img src="${team.logo_url}" alt="${team.name}" class="w-16 h-16 object-contain" onerror="this.style.display='none'">` : ''}
            <div>
              <h1 class="section-title text-2xl mb-0">${team.name || `Team #${teamId}`}</h1>
              <div class="text-xs text-dota-text-muted">${team.tag || ''} ${team.rating ? `| Rating: ${Math.round(team.rating)}` : ''}</div>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-4 max-w-md">
            <div class="text-center">
              <div class="text-lg font-bold text-dota-radiant">${team.wins || 0}</div>
              <div class="text-xs text-dota-text-muted">Wins</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-dota-dire">${team.losses || 0}</div>
              <div class="text-xs text-dota-text-muted">Losses</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold ${parseFloat(wr) >= 50 ? 'text-dota-radiant' : 'text-dota-dire'}">${wr}%</div>
              <div class="text-xs text-dota-text-muted">Win Rate</div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div id="team-tabs">
          ${tabBar([
            { id: 'matches', label: 'Matches' },
            { id: 'players', label: 'Players' },
            { id: 'heroes', label: 'Heroes' },
          ], 'matches', 'team-tabs')}
        </div>
        <div id="team-tab-content">${loader()}</div>
      </div>
    `;

    loadTeamTab(teamId, 'matches');

    window.addEventListener('tab-change', (e) => {
      if (e.detail.container === 'team-tabs') {
        document.querySelectorAll('#team-tabs .tab-btn').forEach(b => {
          b.classList.toggle('active', b.textContent.trim().toLowerCase() === e.detail.tab);
        });
        loadTeamTab(teamId, e.detail.tab);
      }
    });
  } catch {
    app.innerHTML = `<div class="page-container">${errorState('Failed to load team')}</div>`;
  }
}

async function loadTeamTab(teamId, tab) {
  const el = document.getElementById('team-tab-content');
  el.innerHTML = loader();

  try {
    switch (tab) {
      case 'matches': {
        const data = await api.getTeamMatches(teamId);
        if (!data?.length) { el.innerHTML = emptyState('No matches'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Match</th><th>Opponent</th><th>Result</th><th>Duration</th><th>League</th><th>Time</th></tr></thead>
              <tbody>
                ${data.slice(0, 30).map(m => {
                  const isRadiant = m.radiant;
                  const won = isRadiant ? m.radiant_win : !m.radiant_win;
                  return `
                    <tr class="cursor-pointer" onclick="window.location.hash='#/matches/${m.match_id}'">
                      <td class="text-xs text-dota-gold">${m.match_id}</td>
                      <td class="text-xs">${m.opposing_team_name || `Team ${m.opposing_team_id || '--'}`}</td>
                      <td><span class="${won ? 'text-dota-radiant' : 'text-dota-dire'} text-xs font-bold">${won ? 'Won' : 'Lost'}</span></td>
                      <td class="text-xs">${formatDuration(m.duration)}</td>
                      <td class="text-xs truncate max-w-[150px]">${m.league_name || '--'}</td>
                      <td class="text-xs text-dota-text-muted">${timeAgo(m.start_time)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
        break;
      }

      case 'players': {
        const data = await api.getTeamPlayers(teamId);
        if (!data?.length) { el.innerHTML = emptyState('No players'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Player</th><th>Games</th><th>Wins</th><th>Win Rate</th><th>Active</th></tr></thead>
              <tbody>
                ${data.map(p => {
                  const wr = winRate(p.wins, p.games_played);
                  return `
                    <tr class="cursor-pointer" onclick="window.location.hash='#/players/${p.account_id}'">
                      <td class="text-xs text-dota-text-primary">${p.name || 'Unknown'}</td>
                      <td class="text-xs">${p.games_played || 0}</td>
                      <td class="text-xs">${p.wins || 0}</td>
                      <td><span class="text-xs font-semibold ${parseFloat(wr) >= 50 ? 'text-dota-radiant' : 'text-dota-dire'}">${wr}%</span></td>
                      <td>${p.is_current_team_member ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-red">Former</span>'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
        break;
      }

      case 'heroes': {
        const data = await api.getTeamHeroes(teamId);
        if (!data?.length) { el.innerHTML = emptyState('No hero data'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Hero</th><th>Games</th><th>Wins</th><th>Win Rate</th></tr></thead>
              <tbody>
                ${data.filter(h => h.games_played > 0).sort((a, b) => b.games_played - a.games_played).slice(0, 30).map(h => {
                  const wr = winRate(h.wins, h.games_played);
                  return `
                    <tr class="cursor-pointer" onclick="window.location.hash='#/heroes/${h.hero_id}'">
                      <td class="flex items-center gap-2">${miniHeroImg(h.hero_id, 32)}<span class="text-xs">${heroStore.getHeroName(h.hero_id)}</span></td>
                      <td class="text-xs">${h.games_played}</td>
                      <td class="text-xs">${h.wins}</td>
                      <td><span class="text-xs font-semibold ${parseFloat(wr) >= 50 ? 'text-dota-radiant' : 'text-dota-dire'}">${wr}%</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
        break;
      }
    }
  } catch {
    el.innerHTML = errorState('Failed to load data');
  }
}
