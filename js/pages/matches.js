// ================================================
// Matches Page
// API endpoints used:
//   GET /matches/{match_id}, GET /proMatches,
//   GET /publicMatches, GET /parsedMatches,
//   GET /findMatches, POST /request/{match_id},
//   GET /request/{jobId}
// ================================================

import { api } from '../api.js';
import { loader, errorState, emptyState, miniHeroImg, statCard, tabBar } from '../components.js';
import { heroStore, heroImg, formatDuration, timeAgo, formatNumber, winRate, gameModeName, showToast, itemImg, formatMatchAvgSkill } from '../utils.js';

// ---- Matches List Page ----
export async function renderMatches() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-container">
      <h1 class="section-title">Matches</h1>
      <p class="section-subtitle">Browse pro matches, public matches, and look up specific match details.</p>

      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-3 mb-6">
        <div class="flex-1 min-w-[200px] max-w-md">
          <div class="relative">
            <input type="text" id="match-id-input" class="dota-input pl-10" placeholder="Enter Match ID...">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dota-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
        <button type="button" id="match-lookup-btn" class="btn-gold">Look Up Match</button>
        <button type="button" id="parse-match-btn" class="btn-outline">Request Parse</button>
      </div>

      <!-- Tabs -->
      <div id="matches-tabs">
        ${tabBar([
          { id: 'pro', label: 'Pro Matches' },
          { id: 'public', label: 'Public Matches' },
          { id: 'parsed', label: 'Parsed Matches' },
          { id: 'find', label: 'Find Matches' },
        ], 'pro', 'matches-tabs')}
      </div>
      <div id="matches-tab-content">${loader()}</div>
    </div>
  `;

  // Match lookup
  document.getElementById('match-lookup-btn').addEventListener('click', () => {
    const id = document.getElementById('match-id-input').value.trim();
    if (id) window.location.hash = `#/matches/${id}`;
  });

  document.getElementById('match-id-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const id = e.target.value.trim();
      if (id) window.location.hash = `#/matches/${id}`;
    }
  });

  // Parse request
  document.getElementById('parse-match-btn').addEventListener('click', async () => {
    const id = document.getElementById('match-id-input').value.trim();
    if (!id) { showToast('Enter a match ID first', 'error'); return; }
    try {
      const result = await api.requestParse(id);
      showToast(`Parse requested! Job: ${result.job?.jobId || 'queued'}`, 'success');
    } catch {
      showToast('Failed to request parse', 'error');
    }
  });

  // Load default tab
  loadMatchesTab('pro');

  // Tab events
  window.addEventListener('tab-change', (e) => {
    if (e.detail.container === 'matches-tabs') {
      document.querySelectorAll('#matches-tabs .tab-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.trim().toLowerCase().replace(/\s+/g, '') === e.detail.tab);
      });
      loadMatchesTab(e.detail.tab);
    }
  });
}

async function loadMatchesTab(tab) {
  const el = document.getElementById('matches-tab-content');
  el.innerHTML = loader();

  try {
    switch (tab) {
      case 'pro': {
        const data = await api.getProMatches();
        if (!data?.length) { el.innerHTML = emptyState('No pro matches'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Match</th><th>League</th><th>Radiant</th><th>Dire</th><th>Score</th><th>Duration</th><th>Time</th></tr></thead>
              <tbody>
                ${data.slice(0, 30).map(m => `
                  <tr class="cursor-pointer" onclick="window.location.hash='#/matches/${m.match_id}'">
                    <td class="text-xs text-dota-gold">${m.match_id}</td>
                    <td class="text-xs truncate max-w-[150px]">${m.league_name || '--'}</td>
                    <td class="text-xs ${m.radiant_win ? 'text-dota-radiant font-bold' : ''}">${m.radiant_name || m.radiant_team_id || 'Radiant'}</td>
                    <td class="text-xs ${!m.radiant_win ? 'text-dota-dire font-bold' : ''}">${m.dire_name || m.dire_team_id || 'Dire'}</td>
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

      case 'public': {
        const data = await api.getPublicMatches();
        if (!data?.length) { el.innerHTML = emptyState('No public matches'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Match</th><th>Duration</th><th>Avg MMR</th><th>Radiant</th><th>Dire</th><th>Winner</th><th>Time</th></tr></thead>
              <tbody>
                ${data.slice(0, 30).map(m => {
                  const radiantHeroes = (m.radiant_team || '').split(',').filter(Boolean);
                  const direHeroes = (m.dire_team || '').split(',').filter(Boolean);
                  return `
                    <tr class="cursor-pointer" onclick="window.location.hash='#/matches/${m.match_id}'">
                      <td class="text-xs text-dota-gold">${m.match_id}</td>
                      <td class="text-xs">${formatDuration(m.duration)}</td>
                      <td class="text-xs">${m.avg_mmr || '--'}</td>
                      <td><div class="flex gap-0.5">${radiantHeroes.slice(0, 5).map(h => miniHeroImg(parseInt(h), 20)).join('')}</div></td>
                      <td><div class="flex gap-0.5">${direHeroes.slice(0, 5).map(h => miniHeroImg(parseInt(h), 20)).join('')}</div></td>
                      <td><span class="${m.radiant_win ? 'text-dota-radiant' : 'text-dota-dire'} text-xs font-bold">${m.radiant_win ? 'Radiant' : 'Dire'}</span></td>
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

      case 'parsed': {
        const data = await api.getParsedMatches();
        if (!data?.length) { el.innerHTML = emptyState('No parsed matches'); return; }
        el.innerHTML = `
          <div class="dota-card-flat p-4">
            <h3 class="text-sm font-semibold text-dota-gold mb-3">Recently Parsed Matches</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              ${data.slice(0, 48).map(m => `
                <a href="#/matches/${m.match_id}" class="text-xs text-dota-gold hover:text-dota-gold-light bg-dota-card p-2 rounded text-center transition-colors">
                  ${m.match_id}
                </a>
              `).join('')}
            </div>
          </div>
        `;
        break;
      }

      case 'find': {
        el.innerHTML = `
          <div class="dota-card-flat p-6">
            <h3 class="text-sm font-semibold text-dota-gold mb-4">Find Matches by Heroes</h3>
            <p class="text-xs text-dota-text-muted mb-4">Enter hero IDs separated by commas for each team to find matching games.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="text-xs text-dota-radiant font-semibold mb-1 block">Team A Heroes</label>
                <input type="text" id="find-team-a" class="dota-input" placeholder="e.g. 1,2,3">
              </div>
              <div>
                <label class="text-xs text-dota-dire font-semibold mb-1 block">Team B Heroes</label>
                <input type="text" id="find-team-b" class="dota-input" placeholder="e.g. 4,5,6">
              </div>
            </div>
            <button type="button" id="find-matches-btn" class="btn-gold">Find Matches</button>
            <div id="find-results" class="mt-4"></div>
          </div>
        `;

        document.getElementById('find-matches-btn').addEventListener('click', async () => {
          const teamA = document.getElementById('find-team-a').value.split(',').filter(Boolean).map(Number);
          const teamB = document.getElementById('find-team-b').value.split(',').filter(Boolean).map(Number);
          const resultsEl = document.getElementById('find-results');
          resultsEl.innerHTML = loader('Finding matches...');

          try {
            const params = {};
            if (teamA.length) params.teamA = teamA;
            if (teamB.length) params.teamB = teamB;
            const data = await api.findMatches(params);
            if (!data?.length) { resultsEl.innerHTML = emptyState('No matches found'); return; }
            resultsEl.innerHTML = `
              <div class="overflow-table">
                <table class="dota-table">
                  <thead><tr><th>Match</th><th>Duration</th><th>Radiant</th><th>Dire</th><th>Winner</th></tr></thead>
                  <tbody>
                    ${data.slice(0, 20).map(m => `
                      <tr class="cursor-pointer" onclick="window.location.hash='#/matches/${m.match_id}'">
                        <td class="text-xs text-dota-gold">${m.match_id}</td>
                        <td class="text-xs">${formatDuration(m.duration)}</td>
                        <td><div class="flex gap-0.5">${(m.radiant_team || '').split(',').filter(Boolean).map(h => miniHeroImg(parseInt(h), 20)).join('')}</div></td>
                        <td><div class="flex gap-0.5">${(m.dire_team || '').split(',').filter(Boolean).map(h => miniHeroImg(parseInt(h), 20)).join('')}</div></td>
                        <td><span class="${m.radiant_win ? 'text-dota-radiant' : 'text-dota-dire'} text-xs">${m.radiant_win ? 'Radiant' : 'Dire'}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
          } catch {
            resultsEl.innerHTML = errorState('Search failed');
          }
        });
        break;
      }
    }
  } catch {
    el.innerHTML = errorState('Failed to load matches');
  }
}

// ---- Match Detail Page ----
export async function renderMatchDetail(matchId) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page-container">${loader('Loading match data...')}</div>`;

  try {
    const match = await api.getMatch(matchId);
    const radiantWin = match.radiant_win;
    const radiantPlayers = (match.players || []).filter(p => p.player_slot < 128);
    const direPlayers = (match.players || []).filter(p => p.player_slot >= 128);

    app.innerHTML = `
      <div class="page-container">
        <a href="#/matches" class="text-xs text-dota-text-muted hover:text-dota-gold transition-colors mb-4 inline-block">&larr; Matches</a>

        <!-- Match Header -->
        <div class="dota-card-flat p-6 mb-6">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 class="section-title text-2xl mb-1">Match ${matchId}</h1>
              <div class="flex flex-wrap gap-2 text-xs text-dota-text-muted">
                <span>${gameModeName(match.game_mode)}</span>
                <span>&bull;</span>
                <span>${formatDuration(match.duration)}</span>
                <span>&bull;</span>
                <span>${timeAgo(match.start_time)}</span>
                ${match.region ? `<span>&bull;</span><span>Region ${match.region}</span>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-center">
                <div class="text-3xl font-bold text-dota-radiant">${match.radiant_score || 0}</div>
                <div class="text-xs ${radiantWin ? 'text-dota-radiant font-bold' : 'text-dota-text-muted'}">Radiant${radiantWin ? ' WIN' : ''}</div>
              </div>
              <div class="text-dota-text-muted text-lg">VS</div>
              <div class="text-center">
                <div class="text-3xl font-bold text-dota-dire">${match.dire_score || 0}</div>
                <div class="text-xs ${!radiantWin ? 'text-dota-dire font-bold' : 'text-dota-text-muted'}">Dire${!radiantWin ? ' WIN' : ''}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          ${statCard('Duration', formatDuration(match.duration), '')}
          ${statCard('First Blood', formatDuration(match.first_blood_time), '', 'text-dota-crimson')}
          ${statCard('Avg MMR', formatMatchAvgSkill(match), '')}
          ${statCard('Patch', match.patch || '--', '')}
        </div>

        <!-- Radiant Team -->
        <div class="mb-6">
          <h2 class="text-sm font-semibold ${radiantWin ? 'text-dota-radiant' : 'text-dota-text-secondary'} mb-3 flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-dota-radiant"></span>
            RADIANT ${radiantWin ? '(WINNER)' : ''}
          </h2>
          ${renderTeamTable(radiantPlayers)}
        </div>

        <!-- Dire Team -->
        <div class="mb-6">
          <h2 class="text-sm font-semibold ${!radiantWin ? 'text-dota-dire' : 'text-dota-text-secondary'} mb-3 flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-dota-dire"></span>
            DIRE ${!radiantWin ? '(WINNER)' : ''}
          </h2>
          ${renderTeamTable(direPlayers)}
        </div>

        <!-- Draft -->
        ${match.picks_bans?.length ? `
        <div class="dota-card-flat p-4 mb-6">
          <h3 class="text-sm font-semibold text-dota-gold mb-3">Draft</h3>
          <div class="flex flex-wrap gap-2">
            ${match.picks_bans.sort((a, b) => a.order - b.order).map(pb => `
              <div class="flex flex-col items-center gap-1">
                <div class="relative">
                  ${miniHeroImg(pb.hero_id, 36)}
                  ${pb.is_pick ? '' : '<div class="absolute inset-0 bg-red-900/60 rounded flex items-center justify-center"><span class="text-[8px] text-red-300 font-bold">BAN</span></div>'}
                </div>
                <span class="text-[9px] ${pb.team === 0 ? 'text-dota-radiant' : 'text-dota-dire'}">${pb.is_pick ? 'Pick' : 'Ban'}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  } catch (e) {
    app.innerHTML = `<div class="page-container">${errorState('Failed to load match data. The match may not exist or may not be parsed yet.')}</div>`;
  }
}

function renderTeamTable(players) {
  return `
    <div class="overflow-table">
      <table class="dota-table">
        <thead>
          <tr>
            <th>Hero</th>
            <th>Player</th>
            <th>K/D/A</th>
            <th>LH/DN</th>
            <th>GPM</th>
            <th>XPM</th>
            <th>DMG</th>
            <th>Heal</th>
            <th>BLD</th>
            <th>Net Worth</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody>
          ${players.map(p => {
            const items = [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].filter(Boolean);
            return `
              <tr>
                <td>${miniHeroImg(p.hero_id, 36)}</td>
                <td>
                  <a href="#/players/${p.account_id}" class="text-xs text-dota-text-primary hover:text-dota-gold transition-colors">
                    ${p.personaname || 'Anonymous'}
                  </a>
                </td>
                <td class="text-xs font-semibold">${p.kills}/${p.deaths}/${p.assists}</td>
                <td class="text-xs">${p.last_hits}/${p.denies}</td>
                <td class="text-xs text-dota-gold">${p.gold_per_min}</td>
                <td class="text-xs">${p.xp_per_min}</td>
                <td class="text-xs">${formatNumber(p.hero_damage)}</td>
                <td class="text-xs">${formatNumber(p.hero_healing)}</td>
                <td class="text-xs">${formatNumber(p.tower_damage)}</td>
                <td class="text-xs text-dota-gold">${formatNumber(p.net_worth || p.total_gold)}</td>
                <td>
                  <div class="flex gap-0.5">
                    ${items.map(itemId => {
                      const itemName = heroStore.getItemName(itemId) || `Item ${itemId}`;
                      const imageUrl = heroStore.getItemImage(itemId);
                      return `
                        <img
                          src="${imageUrl}"
                          class="w-6 h-5 rounded object-cover bg-dota-card"
                          alt="${itemName}"
                          title="${itemName}"
                          loading="lazy"
                          onerror="this.style.display='none'"
                        >
                      `;
                    }).join('')}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
