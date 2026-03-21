// ================================================
// Pro Scene Page
// API endpoints used:
//   GET /proPlayers, GET /leagues,
//   GET /leagues/{league_id}, GET /leagues/{league_id}/matches,
//   GET /leagues/{league_id}/matchIds, GET /leagues/{league_id}/teams
// ================================================

import { api } from '../api.js';
import { loader, errorState, emptyState, tabBar } from '../components.js';
import { formatDuration, timeAgo, formatNumber } from '../utils.js';

// ---- Pro Scene Main Page ----
export async function renderProScene() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-container">
      <h1 class="section-title">Pro Scene</h1>
      <p class="section-subtitle">Professional players and tournament leagues.</p>

      <div id="pro-tabs">
        ${tabBar([
          { id: 'proplayers', label: 'Pro Players' },
          { id: 'leagues', label: 'Leagues' },
        ], 'proplayers', 'pro-tabs')}
      </div>
      <div id="pro-tab-content">${loader()}</div>
    </div>
  `;

  loadProTab('proplayers');

  window.addEventListener('tab-change', (e) => {
    if (e.detail.container === 'pro-tabs') {
      document.querySelectorAll('#pro-tabs .tab-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.trim().toLowerCase().replace(/\s+/g, '') === e.detail.tab);
      });
      loadProTab(e.detail.tab);
    }
  });
}

async function loadProTab(tab) {
  const el = document.getElementById('pro-tab-content');
  el.innerHTML = loader();

  try {
    if (tab === 'proplayers') {
      const data = await api.getProPlayers();
      if (!data?.length) { el.innerHTML = emptyState('No pro players'); return; }
      
      el.innerHTML = `
        <div class="mb-4">
          <input type="text" id="pro-search" class="dota-input w-full sm:w-64" placeholder="Search pro players...">
        </div>
        <div id="pro-players-list">
          ${renderProPlayersList(data.slice(0, 60))}
        </div>
      `;

      document.getElementById('pro-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = data.filter(p => 
          (p.name || '').toLowerCase().includes(q) ||
          (p.personaname || '').toLowerCase().includes(q) ||
          (p.team_name || '').toLowerCase().includes(q)
        );
        document.getElementById('pro-players-list').innerHTML = renderProPlayersList(filtered.slice(0, 60));
      });
    } else if (tab === 'leagues') {
      const data = await api.getLeagues();
      if (!data?.length) { el.innerHTML = emptyState('No leagues'); return; }
      
      const sorted = data.sort((a, b) => (b.tier || '').localeCompare(a.tier || '') || b.leagueid - a.leagueid);
      
      el.innerHTML = `
        <div class="mb-4">
          <input type="text" id="league-search" class="dota-input w-full sm:w-64" placeholder="Search leagues...">
        </div>
        <div id="leagues-list">
          ${renderLeaguesList(sorted.slice(0, 50))}
        </div>
      `;

      document.getElementById('league-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = sorted.filter(l => (l.name || '').toLowerCase().includes(q));
        document.getElementById('leagues-list').innerHTML = renderLeaguesList(filtered.slice(0, 50));
      });
    }
  } catch {
    el.innerHTML = errorState('Failed to load data');
  }
}

function renderProPlayersList(players) {
  return `
    <div class="overflow-table">
      <table class="dota-table">
        <thead><tr><th>Name</th><th>Persona</th><th>Team</th><th>Country</th><th>Account</th></tr></thead>
        <tbody>
          ${players.map(p => `
            <tr class="cursor-pointer" onclick="window.location.hash='#/players/${p.account_id}'">
              <td>
                <div class="flex items-center gap-2">
                  ${p.avatarfull ? `<img src="${p.avatarfull}" class="w-6 h-6 rounded-full" alt="">` : ''}
                  <span class="text-xs text-dota-gold font-semibold">${p.name || '--'}</span>
                </div>
              </td>
              <td class="text-xs">${p.personaname || '--'}</td>
              <td class="text-xs text-dota-text-secondary">${p.team_name || '--'}</td>
              <td class="text-xs">${p.loccountrycode || p.country_code || '--'}</td>
              <td class="text-xs text-dota-text-muted">${p.account_id}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderLeaguesList(leagues) {
  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${leagues.map(l => {
        const tierColors = {
          premium: 'badge-gold',
          professional: 'badge-blue',
          amateur: 'badge-green',
        };
        return `
          <a href="#/pro-scene/${l.leagueid}" class="dota-card p-4 block">
            <div class="flex items-start justify-between mb-2">
              <h3 class="text-sm text-dota-text-primary font-semibold line-clamp-2 flex-1">${l.name || `League #${l.leagueid}`}</h3>
              ${l.tier ? `<span class="badge ${tierColors[l.tier] || 'badge-gold'} ml-2 shrink-0">${l.tier}</span>` : ''}
            </div>
            <div class="text-xs text-dota-text-muted">ID: ${l.leagueid}</div>
          </a>
        `;
      }).join('')}
    </div>
  `;
}

// ---- League Detail ----
export async function renderLeagueDetail(leagueId) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page-container">${loader('Loading league...')}</div>`;

  try {
    const league = await api.getLeague(leagueId);

    app.innerHTML = `
      <div class="page-container">
        <a href="#/pro-scene" class="text-xs text-dota-text-muted hover:text-dota-gold transition-colors mb-4 inline-block">&larr; Pro Scene</a>

        <div class="dota-card-flat p-6 mb-6">
          <h1 class="section-title text-2xl mb-1">${league.name || `League #${leagueId}`}</h1>
          <div class="text-xs text-dota-text-muted">
            ${league.tier ? `Tier: ${league.tier}` : ''} | ID: ${leagueId}
          </div>
        </div>

        <div id="league-tabs">
          ${tabBar([
            { id: 'matches', label: 'Matches' },
            { id: 'teams', label: 'Teams' },
            { id: 'matchids', label: 'Match IDs' },
          ], 'matches', 'league-tabs')}
        </div>
        <div id="league-tab-content">${loader()}</div>
      </div>
    `;

    loadLeagueTab(leagueId, 'matches');

    window.addEventListener('tab-change', (e) => {
      if (e.detail.container === 'league-tabs') {
        document.querySelectorAll('#league-tabs .tab-btn').forEach(b => {
          b.classList.toggle('active', b.textContent.trim().toLowerCase().replace(/\s+/g, '') === e.detail.tab);
        });
        loadLeagueTab(leagueId, e.detail.tab);
      }
    });
  } catch {
    app.innerHTML = `<div class="page-container">${errorState('Failed to load league')}</div>`;
  }
}

async function loadLeagueTab(leagueId, tab) {
  const el = document.getElementById('league-tab-content');
  el.innerHTML = loader();

  try {
    switch (tab) {
      case 'matches': {
        const data = await api.getLeagueMatches(leagueId);
        if (!data?.length) { el.innerHTML = emptyState('No matches found for this league'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Match</th><th>Radiant</th><th>Dire</th><th>Score</th><th>Duration</th><th>Time</th></tr></thead>
              <tbody>
                ${data.slice(0, 30).map(m => `
                  <tr class="cursor-pointer" onclick="window.location.hash='#/matches/${m.match_id}'">
                    <td class="text-xs text-dota-gold">${m.match_id}</td>
                    <td class="text-xs ${m.radiant_win ? 'text-dota-radiant font-bold' : ''}">${m.radiant_name || 'Radiant'}</td>
                    <td class="text-xs ${!m.radiant_win ? 'text-dota-dire font-bold' : ''}">${m.dire_name || 'Dire'}</td>
                    <td class="text-xs">${m.radiant_score || 0}-${m.dire_score || 0}</td>
                    <td class="text-xs">${formatDuration(m.duration)}</td>
                    <td class="text-xs text-dota-text-muted">${timeAgo(m.start_time)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        break;
      }

      case 'teams': {
        const data = await api.getLeagueTeams(leagueId);
        if (!data?.length) { el.innerHTML = emptyState('No teams'); return; }
        el.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${data.map(t => `
              <a href="#/teams/${t.team_id}" class="dota-card p-4 block">
                <div class="flex items-center gap-3">
                  ${t.logo_url ? `<img src="${t.logo_url}" class="w-8 h-8 object-contain rounded" alt="" onerror="this.style.display='none'">` : ''}
                  <div>
                    <div class="text-sm text-dota-text-primary font-semibold">${t.name || `Team ${t.team_id}`}</div>
                    <div class="text-xs text-dota-text-muted">${t.tag || ''} | ${t.wins || 0}W - ${t.losses || 0}L</div>
                  </div>
                </div>
              </a>
            `).join('')}
          </div>
        `;
        break;
      }

      case 'matchids': {
        const data = await api.getLeagueMatchIds(leagueId);
        if (!data?.length) { el.innerHTML = emptyState('No match IDs'); return; }
        el.innerHTML = `
          <div class="dota-card-flat p-4">
            <h3 class="text-sm font-semibold text-dota-gold mb-3">All Match IDs (${data.length})</h3>
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              ${data.slice(0, 100).map(id => `
                <a href="#/matches/${id}" class="text-xs text-dota-gold hover:text-dota-gold-light bg-dota-card p-2 rounded text-center transition-colors">
                  ${id}
                </a>
              `).join('')}
            </div>
            ${data.length > 100 ? `<p class="text-xs text-dota-text-muted mt-3 text-center">Showing 100 of ${data.length} matches</p>` : ''}
          </div>
        `;
        break;
      }
    }
  } catch {
    el.innerHTML = errorState('Failed to load data');
  }
}
