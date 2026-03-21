// ================================================
// Players Page
// API endpoints used:
//   GET /search, GET /players/{id}, GET /players/{id}/wl,
//   GET /players/{id}/recentMatches, GET /players/{id}/matches,
//   GET /players/{id}/heroes, GET /players/{id}/peers,
//   GET /players/{id}/pros, GET /players/{id}/totals,
//   GET /players/{id}/counts, GET /players/{id}/histograms/{field},
//   GET /players/{id}/wardmap, GET /players/{id}/wordcloud,
//   GET /players/{id}/ratings, GET /players/{id}/rankings,
//   POST /players/{id}/refresh
// ================================================

import { api } from '../api.js';
import { loader, errorState, emptyState, miniHeroImg, statCard, tabBar } from '../components.js';
import { heroStore, formatDuration, timeAgo, formatNumber, winRate, rankTierToMedal, showToast } from '../utils.js';

// ---- Players Search Page ----
export async function renderPlayers() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-container">
      <h1 class="section-title">Players</h1>
      <p class="section-subtitle">Search for any Dota 2 player by name or Steam ID.</p>

      <div class="max-w-2xl mx-auto">
        <div class="relative mb-8">
          <input type="text" id="player-search-input" class="dota-input text-lg py-3 pl-12" placeholder="Enter player name or Steam ID..." autofocus>
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dota-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <div id="player-search-results"></div>
      </div>
    </div>
  `;

  const input = document.getElementById('player-search-input');
  let debounceTimer;
  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const q = e.target.value.trim();
    if (!q) {
      document.getElementById('player-search-results').innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(() => searchPlayers(q), 400);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q && /^\d+$/.test(q)) {
        window.location.hash = `#/players/${q}`;
      }
    }
  });
}

async function searchPlayers(query) {
  const el = document.getElementById('player-search-results');
  el.innerHTML = loader('Searching...');

  try {
    const results = await api.searchPlayers(query);
    if (!results?.length) {
      el.innerHTML = emptyState('No players found');
      return;
    }
    el.innerHTML = `
      <div class="dota-card-flat divide-y divide-dota-border">
        ${results.slice(0, 20).map(p => `
          <a href="#/players/${p.account_id}" class="flex items-center gap-3 p-3 hover:bg-dota-card-hover transition-colors block">
            <img src="${p.avatarfull || ''}" alt="${p.personaname}" class="w-10 h-10 rounded-full border border-dota-border" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23141c28%22 width=%221%22 height=%221%22/></svg>'">
            <div class="flex-1 min-w-0">
              <div class="text-sm text-dota-text-primary font-semibold truncate">${p.personaname || 'Anonymous'}</div>
              <div class="text-xs text-dota-text-muted">ID: ${p.account_id}</div>
            </div>
            ${p.last_match_time ? `<span class="text-xs text-dota-text-muted">${timeAgo(new Date(p.last_match_time).getTime() / 1000)}</span>` : ''}
          </a>
        `).join('')}
      </div>
    `;
  } catch {
    el.innerHTML = errorState('Search failed');
  }
}

// ---- Player Profile ----
export async function renderPlayerProfile(accountId) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page-container">${loader('Loading player profile...')}</div>`;

  try {
    const [player, wl] = await Promise.all([
      api.getPlayer(accountId),
      api.getPlayerWinLoss(accountId)
    ]);

    const profile = player.profile || {};
    const medal = rankTierToMedal(player.rank_tier);
    const wr = winRate(wl.win, wl.win + wl.lose);
    const totalGames = wl.win + wl.lose;

    app.innerHTML = `
      <div class="page-container">
        <!-- Back Link -->
        <a href="#/players" class="text-xs text-dota-text-muted hover:text-dota-gold transition-colors mb-4 inline-block">&larr; Search Players</a>

        <!-- Player Header -->
        <div class="dota-card-flat p-6 mb-6">
          <div class="flex flex-col md:flex-row items-start gap-6">
            <img src="${profile.avatarfull || ''}" alt="${profile.personaname}" class="w-24 h-24 rounded-xl border-2 border-dota-border" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23141c28%22 width=%221%22 height=%221%22/></svg>'">
            <div class="flex-1">
              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="section-title text-2xl mb-0">${profile.personaname || 'Anonymous'}</h1>
                <span class="badge ${medal.class ? `badge-gold` : 'badge-gold'}">${medal.name}${medal.stars ? ` ${medal.stars}` : ''}</span>
                ${profile.is_contributor ? '<span class="badge badge-blue">Contributor</span>' : ''}
              </div>
              <div class="text-xs text-dota-text-muted mt-1">Account ID: ${accountId}${player.mmr_estimate?.estimate ? ` | Est. MMR: ${player.mmr_estimate.estimate}` : ''}</div>

              <!-- Win/Loss -->
              <div class="mt-4 max-w-md">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-dota-radiant font-semibold">${wl.win}W</span>
                  <span class="text-dota-text-muted">${totalGames} games (${wr}%)</span>
                  <span class="text-dota-dire font-semibold">${wl.lose}L</span>
                </div>
                <div class="wl-bar">
                  <div class="win" style="width:${totalGames > 0 ? (wl.win / totalGames * 100) : 50}%"></div>
                  <div class="loss" style="width:${totalGames > 0 ? (wl.lose / totalGames * 100) : 50}%"></div>
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn-outline btn-sm" id="refresh-player-btn">Refresh</button>
              ${profile.profileurl ? `<a href="${profile.profileurl}" target="_blank" class="btn-outline btn-sm">Steam</a>` : ''}
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div id="player-stats" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">${loader()}</div>

        <!-- Tabs -->
        <div id="player-tabs">
          ${tabBar([
            { id: 'recent', label: 'Recent' },
            { id: 'heroes', label: 'Heroes' },
            { id: 'peers', label: 'Peers' },
            { id: 'pros', label: 'Pros' },
            { id: 'totals', label: 'Totals' },
            { id: 'counts', label: 'Counts' },
            { id: 'histograms', label: 'Histograms' },
            { id: 'wardmap', label: 'Ward Map' },
            { id: 'wordcloud', label: 'Word Cloud' },
            { id: 'ratings', label: 'Ratings' },
            { id: 'rankings', label: 'Rankings' },
            { id: 'matches', label: 'All Matches' },
          ], 'recent', 'player-tabs')}
        </div>
        <div id="player-tab-content">${loader()}</div>
      </div>
    `;

    // Load stats
    loadPlayerStats(accountId);
    // Load default tab
    loadPlayerTab(accountId, 'recent');

    // Refresh button
    document.getElementById('refresh-player-btn').addEventListener('click', async () => {
      try {
        await api.refreshPlayer(accountId);
        showToast('Player refresh queued!', 'success');
      } catch {
        showToast('Failed to refresh', 'error');
      }
    });

    // Tab changes
    window.addEventListener('tab-change', function handler(e) {
      if (e.detail.container === 'player-tabs') {
        document.querySelectorAll('#player-tabs .tab-btn').forEach(b => {
          b.classList.toggle('active', b.textContent.trim().toLowerCase() === e.detail.tab.toLowerCase() ||
            b.textContent.trim().toLowerCase().replace(/\s+/g, '') === e.detail.tab);
        });
        loadPlayerTab(accountId, e.detail.tab);
      }
    });
  } catch (e) {
    app.innerHTML = `<div class="page-container">${errorState('Failed to load player profile. Make sure the account ID is correct.')}</div>`;
  }
}

async function loadPlayerStats(accountId) {
  const el = document.getElementById('player-stats');
  try {
    const totals = await api.getPlayerTotals(accountId);
    const kda = totals.find(t => t.field === 'kda');
    const gpm = totals.find(t => t.field === 'gold_per_min');
    const xpm = totals.find(t => t.field === 'xp_per_min');
    const duration = totals.find(t => t.field === 'duration');

    el.innerHTML = `
      ${statCard('Avg KDA', kda ? (kda.sum / kda.n).toFixed(2) : '--', `${kda?.n || 0} games`)}
      ${statCard('Avg GPM', gpm ? Math.round(gpm.sum / gpm.n) : '--', 'Gold per minute', 'text-dota-gold')}
      ${statCard('Avg XPM', xpm ? Math.round(xpm.sum / xpm.n) : '--', 'XP per minute', 'text-dota-blue')}
      ${statCard('Avg Duration', duration ? formatDuration(duration.sum / duration.n) : '--', 'Per match')}
    `;
  } catch {
    el.innerHTML = '';
  }
}

async function loadPlayerTab(accountId, tab) {
  const el = document.getElementById('player-tab-content');
  el.innerHTML = loader();

  try {
    switch (tab) {
      case 'recent': {
        const data = await api.getPlayerRecentMatches(accountId);
        if (!data?.length) { el.innerHTML = emptyState('No recent matches'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Hero</th><th>Result</th><th>Duration</th><th>K/D/A</th><th>GPM/XPM</th><th>Last Hits</th><th>Time</th><th>Match</th></tr></thead>
              <tbody>
                ${data.map(m => {
                  const isWin = m.radiant_win === (m.player_slot < 128);
                  return `
                    <tr class="cursor-pointer" onclick="window.location.hash='#/matches/${m.match_id}'">
                      <td class="flex items-center gap-2">${miniHeroImg(m.hero_id, 32)}<span class="text-xs">${heroStore.getHeroName(m.hero_id)}</span></td>
                      <td><span class="${isWin ? 'text-dota-radiant' : 'text-dota-dire'} text-xs font-bold">${isWin ? 'Won' : 'Lost'}</span></td>
                      <td class="text-xs">${formatDuration(m.duration)}</td>
                      <td class="text-xs">${m.kills}/${m.deaths}/${m.assists}</td>
                      <td class="text-xs">${m.gold_per_min}/${m.xp_per_min}</td>
                      <td class="text-xs">${m.last_hits}</td>
                      <td class="text-xs text-dota-text-muted">${timeAgo(m.start_time)}</td>
                      <td class="text-xs text-dota-gold">${m.match_id}</td>
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
        const data = await api.getPlayerHeroes(accountId);
        if (!data?.length) { el.innerHTML = emptyState('No hero data'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Hero</th><th>Games</th><th>Wins</th><th>Win Rate</th><th>With</th><th>Against</th></tr></thead>
              <tbody>
                ${data.filter(h => h.games > 0).slice(0, 40).map(h => {
                  const wr = winRate(h.win, h.games);
                  return `
                    <tr class="cursor-pointer" onclick="window.location.hash='#/heroes/${h.hero_id}'">
                      <td class="flex items-center gap-2">${miniHeroImg(h.hero_id, 32)}<span class="text-xs">${heroStore.getHeroName(h.hero_id)}</span></td>
                      <td class="text-xs">${h.games}</td>
                      <td class="text-xs">${h.win}</td>
                      <td><span class="text-xs font-semibold ${parseFloat(wr) >= 50 ? 'text-dota-radiant' : 'text-dota-dire'}">${wr}%</span></td>
                      <td class="text-xs">${h.with_games || 0}</td>
                      <td class="text-xs">${h.against_games || 0}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
        break;
      }

      case 'peers': {
        const data = await api.getPlayerPeers(accountId);
        if (!data?.length) { el.innerHTML = emptyState('No peers data'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Player</th><th>Games</th><th>Wins</th><th>Win Rate</th><th>Last Played</th></tr></thead>
              <tbody>
                ${data.filter(p => p.games > 0).slice(0, 30).map(p => {
                  const wr = winRate(p.win, p.games);
                  return `
                    <tr class="cursor-pointer" onclick="window.location.hash='#/players/${p.account_id}'">
                      <td>
                        <div class="flex items-center gap-2">
                          ${p.avatarfull ? `<img src="${p.avatarfull}" class="w-6 h-6 rounded-full" alt="">` : ''}
                          <span class="text-xs text-dota-text-primary">${p.personaname || 'Anonymous'}</span>
                        </div>
                      </td>
                      <td class="text-xs">${p.games}</td>
                      <td class="text-xs">${p.win}</td>
                      <td><span class="text-xs font-semibold ${parseFloat(wr) >= 50 ? 'text-dota-radiant' : 'text-dota-dire'}">${wr}%</span></td>
                      <td class="text-xs text-dota-text-muted">${p.last_played ? timeAgo(p.last_played) : '--'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
        break;
      }

      case 'pros': {
        const data = await api.getPlayerPros(accountId);
        if (!data?.length) { el.innerHTML = emptyState('No pro players encountered'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Pro Player</th><th>Games</th><th>W/L With</th><th>W/L Against</th><th>Last Played</th></tr></thead>
              <tbody>
                ${data.filter(p => (p.with_games || 0) + (p.against_games || 0) > 0).slice(0, 30).map(p => `
                  <tr class="cursor-pointer" onclick="window.location.hash='#/players/${p.account_id}'">
                    <td>
                      <div class="flex items-center gap-2">
                        ${p.avatarfull ? `<img src="${p.avatarfull}" class="w-6 h-6 rounded-full" alt="">` : ''}
                        <span class="text-xs text-dota-text-primary">${p.personaname || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td class="text-xs">${(p.with_games || 0) + (p.against_games || 0)}</td>
                    <td class="text-xs">${p.with_win || 0}/${(p.with_games || 0) - (p.with_win || 0)}</td>
                    <td class="text-xs">${p.against_win || 0}/${(p.against_games || 0) - (p.against_win || 0)}</td>
                    <td class="text-xs text-dota-text-muted">${p.last_played ? timeAgo(p.last_played) : '--'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        break;
      }

      case 'totals': {
        const data = await api.getPlayerTotals(accountId);
        if (!data?.length) { el.innerHTML = emptyState('No totals data'); return; }
        el.innerHTML = `
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            ${data.filter(t => t.n > 0).map(t => {
              const avg = (t.sum / t.n).toFixed(2);
              return statCard(t.field.replace(/_/g, ' '), avg, `Total: ${formatNumber(t.sum)} | ${t.n} games`);
            }).join('')}
          </div>
        `;
        break;
      }

      case 'counts': {
        const data = await api.getPlayerCounts(accountId);
        if (!data) { el.innerHTML = emptyState('No counts data'); return; }
        el.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${Object.entries(data).map(([category, values]) => {
              if (!values || typeof values !== 'object') return '';
              const entries = Object.entries(values).filter(([, v]) => v?.games > 0).sort((a, b) => b[1].games - a[1].games).slice(0, 10);
              if (entries.length === 0) return '';
              return `
                <div class="dota-card-flat p-4">
                  <h3 class="text-sm font-semibold text-dota-gold mb-3 capitalize">${category.replace(/_/g, ' ')}</h3>
                  <div class="space-y-1">
                    ${entries.map(([key, val]) => `
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-dota-text-secondary">${key}</span>
                        <span class="text-dota-text-primary">${val.games}g / ${val.win}w</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
        break;
      }

      case 'histograms': {
        const fields = ['kills', 'deaths', 'assists', 'gold_per_min', 'xp_per_min', 'last_hits', 'duration'];
        el.innerHTML = `
          <div class="mb-4">
            <select id="histogram-field" class="dota-input dota-select w-48">
              ${fields.map(f => `<option value="${f}">${f.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
          <div id="histogram-chart">${loader()}</div>
        `;
        loadHistogram(accountId, fields[0]);
        document.getElementById('histogram-field').addEventListener('change', (e) => {
          loadHistogram(accountId, e.target.value);
        });
        break;
      }

      case 'wardmap': {
        const data = await api.getPlayerWardmap(accountId);
        if (!data) { el.innerHTML = emptyState('No ward data'); return; }
        const obs = data.obs || {};
        const sen = data.sen || {};
        el.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="text-sm font-semibold text-yellow-400 mb-2">Observer Wards</h3>
              <div class="ward-map-container bg-dota-card">
                <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/minimap.jpg" class="w-full h-full object-cover opacity-40" alt="Minimap" onerror="this.style.display='none'">
                ${Object.entries(obs).flatMap(([y, xMap]) =>
                  Object.entries(xMap).map(([x, count]) => {
                    const left = (parseInt(x) / 194 * 100).toFixed(1);
                    const top = (parseInt(y) / 194 * 100).toFixed(1);
                    const size = Math.min(3 + count, 10);
                    return `<div class="ward-dot observer" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px" title="Count: ${count}"></div>`;
                  })
                ).join('')}
              </div>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-blue-400 mb-2">Sentry Wards</h3>
              <div class="ward-map-container bg-dota-card">
                <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/minimap.jpg" class="w-full h-full object-cover opacity-40" alt="Minimap" onerror="this.style.display='none'">
                ${Object.entries(sen).flatMap(([y, xMap]) =>
                  Object.entries(xMap).map(([x, count]) => {
                    const left = (parseInt(x) / 194 * 100).toFixed(1);
                    const top = (parseInt(y) / 194 * 100).toFixed(1);
                    const size = Math.min(3 + count, 10);
                    return `<div class="ward-dot sentry" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px" title="Count: ${count}"></div>`;
                  })
                ).join('')}
              </div>
            </div>
          </div>
        `;
        break;
      }

      case 'wordcloud': {
        const data = await api.getPlayerWordcloud(accountId);
        if (!data) { el.innerHTML = emptyState('No word cloud data'); return; }
        const myWords = data.my_word_counts || {};
        const allWords = data.all_word_counts || {};
        const topMy = Object.entries(myWords).sort((a, b) => b[1] - a[1]).slice(0, 80);
        const topAll = Object.entries(allWords).sort((a, b) => b[1] - a[1]).slice(0, 80);
        const maxMy = topMy[0]?.[1] || 1;
        const maxAll = topAll[0]?.[1] || 1;

        el.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="dota-card-flat p-4">
              <h3 class="text-sm font-semibold text-dota-gold mb-3">My Words</h3>
              <div class="word-cloud">
                ${topMy.map(([word, count]) => {
                  const size = 0.6 + (count / maxMy) * 1.4;
                  return `<span style="font-size:${size}rem" title="${count}">${word}</span>`;
                }).join('')}
              </div>
            </div>
            <div class="dota-card-flat p-4">
              <h3 class="text-sm font-semibold text-dota-gold mb-3">Chat Words</h3>
              <div class="word-cloud">
                ${topAll.map(([word, count]) => {
                  const size = 0.6 + (count / maxAll) * 1.4;
                  return `<span style="font-size:${size}rem" title="${count}">${word}</span>`;
                }).join('')}
              </div>
            </div>
          </div>
        `;
        break;
      }

      case 'ratings': {
        const data = await api.getPlayerRatings(accountId);
        if (!data?.length) { el.innerHTML = emptyState('No rating history'); return; }
        const maxMMR = Math.max(...data.map(r => r.competitive_rank || r.solo_competitive_rank || 0));
        el.innerHTML = `
          <div class="dota-card-flat p-4">
            <h3 class="text-sm font-semibold text-dota-gold mb-4">Rating History</h3>
            <div class="flex items-end gap-[2px] h-48 mb-2">
              ${data.slice(-80).map(r => {
                const mmr = r.competitive_rank || r.solo_competitive_rank || 0;
                const height = maxMMR > 0 ? (mmr / maxMMR * 100) : 0;
                return `<div class="flex-1 bg-gradient-to-t from-dota-gold to-dota-gold-light rounded-t min-w-[3px]" style="height:${height}%" title="MMR: ${mmr} | ${new Date(r.time).toLocaleDateString()}"></div>`;
              }).join('')}
            </div>
            <div class="overflow-table mt-4">
              <table class="dota-table">
                <thead><tr><th>Date</th><th>MMR</th><th>Rank Tier</th></tr></thead>
                <tbody>
                  ${data.slice(-20).reverse().map(r => `
                    <tr>
                      <td class="text-xs">${new Date(r.time).toLocaleDateString()}</td>
                      <td class="text-xs text-dota-gold">${r.competitive_rank || r.solo_competitive_rank || '--'}</td>
                      <td class="text-xs">${r.rank_tier || '--'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        break;
      }

      case 'rankings': {
        const data = await api.getPlayerRankings(accountId);
        if (!data?.length) { el.innerHTML = emptyState('No hero rankings'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Hero</th><th>Score</th><th>Percentile</th><th>Card</th></tr></thead>
              <tbody>
                ${data.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 30).map(r => `
                  <tr class="cursor-pointer" onclick="window.location.hash='#/heroes/${r.hero_id}'">
                    <td class="flex items-center gap-2">${miniHeroImg(r.hero_id, 32)}<span class="text-xs">${heroStore.getHeroName(r.hero_id)}</span></td>
                    <td class="text-xs text-dota-gold">${(r.score || 0).toFixed(2)}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="w-20 stat-bar"><div class="stat-bar-fill" style="width:${(r.percent_rank || 0) * 100}%"></div></div>
                        <span class="text-xs">${((r.percent_rank || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td class="text-xs text-dota-text-muted">${r.card || '--'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        break;
      }

      case 'matches': {
        const data = await api.getPlayerMatches(accountId, { limit: 50 });
        if (!data?.length) { el.innerHTML = emptyState('No matches found'); return; }
        el.innerHTML = `
          <div class="overflow-table">
            <table class="dota-table">
              <thead><tr><th>Hero</th><th>Result</th><th>Duration</th><th>K/D/A</th><th>Time</th><th>Match ID</th></tr></thead>
              <tbody>
                ${data.map(m => {
                  const isWin = m.radiant_win === (m.player_slot < 128);
                  return `
                    <tr class="cursor-pointer" onclick="window.location.hash='#/matches/${m.match_id}'">
                      <td class="flex items-center gap-2">${miniHeroImg(m.hero_id, 32)}<span class="text-xs">${heroStore.getHeroName(m.hero_id)}</span></td>
                      <td><span class="${isWin ? 'text-dota-radiant' : 'text-dota-dire'} text-xs font-bold">${isWin ? 'Won' : 'Lost'}</span></td>
                      <td class="text-xs">${formatDuration(m.duration)}</td>
                      <td class="text-xs">${m.kills || 0}/${m.deaths || 0}/${m.assists || 0}</td>
                      <td class="text-xs text-dota-text-muted">${timeAgo(m.start_time)}</td>
                      <td class="text-xs text-dota-gold">${m.match_id}</td>
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
  } catch (e) {
    el.innerHTML = errorState('Failed to load data');
  }
}

async function loadHistogram(accountId, field) {
  const el = document.getElementById('histogram-chart');
  if (!el) return;
  el.innerHTML = loader();

  try {
    const data = await api.getPlayerHistogram(accountId, field);
    if (!data?.length) { el.innerHTML = emptyState('No histogram data'); return; }
    const maxGames = Math.max(...data.map(d => d.games || 0));
    el.innerHTML = `
      <div class="dota-card-flat p-4">
        <h3 class="text-sm font-semibold text-dota-gold mb-4 capitalize">${field.replace(/_/g, ' ')} Distribution</h3>
        <div class="flex items-end gap-[2px] h-48 mb-2">
          ${data.map(d => {
            const height = maxGames > 0 ? ((d.games || 0) / maxGames * 100) : 0;
            return `<div class="flex-1 bg-gradient-to-t from-dota-gold to-dota-gold-light rounded-t min-w-[3px]" style="height:${height}%" title="${d.x}: ${d.games} games"></div>`;
          }).join('')}
        </div>
        <div class="flex justify-between text-xs text-dota-text-muted">
          <span>${data[0]?.x ?? ''}</span>
          <span>${data[Math.floor(data.length / 2)]?.x ?? ''}</span>
          <span>${data[data.length - 1]?.x ?? ''}</span>
        </div>
      </div>
    `;
  } catch {
    el.innerHTML = errorState('Failed to load histogram');
  }
}
