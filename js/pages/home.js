// ================================================
// Home / Dashboard Page
// API endpoints used:
//   GET /heroStats, GET /live, GET /metadata, GET /publicMatches
// ================================================

import { api } from '../api.js';
import { loader, errorState, statCard } from '../components.js';
import { heroImg, formatDuration, timeAgo, formatNumber, heroStore, formatMatchAvgSkill } from '../utils.js';

function parseTeamHeroes(teamData) {
  if (Array.isArray(teamData)) {
    return teamData
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0);
  }

  if (typeof teamData === 'string') {
    return teamData
      .split(',')
      .map(id => Number(id.trim()))
      .filter(id => Number.isFinite(id) && id > 0);
  }

  return [];
}

function renderTeamHeroes(teamData, sizeClass = 'w-6 h-[14px]') {
  const heroIds = parseTeamHeroes(teamData).slice(0, 5);
  if (heroIds.length === 0) {
    return '<span class="text-[10px] text-dota-text-muted">Unknown</span>';
  }

  return heroIds.map(heroId => {
    const hero = heroStore.getHero(heroId);
    if (!hero) {
      return `<div class="${sizeClass} rounded bg-dota-card"></div>`;
    }
    return `<img src="${heroImg(hero)}" class="${sizeClass} rounded" alt="${hero.localized_name}" loading="lazy">`;
  }).join('');
}

export async function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-container">
      <!-- Hero Banner -->
      <div class="relative mb-8 rounded-xl overflow-hidden border border-dota-border bg-gradient-to-r from-dota-card via-dota-dark to-dota-card p-8 md:p-12">
        <div class="absolute inset-0 opacity-5" style="background-image: url('https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/backgrounds/grey_painterly.png'); background-size: cover;"></div>
        <div class="relative z-10">
          <h1 class="font-display text-3xl md:text-4xl lg:text-5xl text-dota-gold-light mb-3 text-glow-gold tracking-wide">DOTA 2 TRACKER</h1>
          <p class="text-dota-text-secondary text-sm md:text-base max-w-2xl leading-relaxed">
            Your comprehensive Dota 2 statistics dashboard. Track heroes, players, matches, teams, and the professional scene - all powered by the OpenDota API.
          </p>
          <div class="flex flex-wrap gap-3 mt-6">
            <a href="#/heroes" class="btn-gold">Browse Heroes</a>
            <a href="#/players" class="btn-outline">Search Players</a>
            <a href="#/matches" class="btn-outline">Live Matches</a>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div id="home-stats" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">${loader('Loading stats...')}</div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Live Games -->
        <div class="lg:col-span-2">
          <div class="flex items-center gap-2 mb-4">
            <span class="live-pulse"></span>
            <h2 class="section-title text-xl">Live Games</h2>
          </div>
          <div id="home-live" class="space-y-3">${loader('Loading live games...')}</div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Top Heroes -->
          <div>
            <h2 class="section-title text-xl mb-4">Top Heroes</h2>
            <div id="home-heroes" class="space-y-2">${loader()}</div>
          </div>
        </div>
      </div>

      <!-- Public Matches -->
      <div class="mt-8">
        <h2 class="section-title text-xl mb-4">Recent Public Matches</h2>
        <div id="home-public" class="overflow-table">${loader()}</div>
      </div>
    </div>
  `;

  // Load data in parallel
  loadStats();
  loadLiveGames();
  loadTopHeroes();
  loadPublicMatches();
}

async function loadStats() {
  const el = document.getElementById('home-stats');
  try {
    const [heroStats, publicMatches] = await Promise.all([
      api.getHeroStats(),
      api.getPublicMatches().catch(() => [])
    ]);

    // Total playable heroes
    const heroCount = heroStats.length || heroStore.heroes.length || '--';

    // Most picked hero across all brackets
    const byPicks = heroStats.map(h => {
      const picks = (h['1_pick']||0)+(h['2_pick']||0)+(h['3_pick']||0)+(h['4_pick']||0)+(h['5_pick']||0)+(h['6_pick']||0)+(h['7_pick']||0)+(h['8_pick']||0);
      return { name: h.localized_name, picks };
    }).sort((a, b) => b.picks - a.picks);
    const topPick = byPicks[0];

    // Highest win rate hero (min 1000 picks to filter noise)
    const byWinRate = heroStats.map(h => {
      const picks = (h['1_pick']||0)+(h['2_pick']||0)+(h['3_pick']||0)+(h['4_pick']||0)+(h['5_pick']||0)+(h['6_pick']||0)+(h['7_pick']||0)+(h['8_pick']||0);
      const wins = (h['1_win']||0)+(h['2_win']||0)+(h['3_win']||0)+(h['4_win']||0)+(h['5_win']||0)+(h['6_win']||0)+(h['7_win']||0)+(h['8_win']||0);
      const wr = picks >= 1000 ? (wins / picks) * 100 : 0;
      return { name: h.localized_name, wr };
    }).filter(h => h.wr > 0).sort((a, b) => b.wr - a.wr);
    const topWR = byWinRate[0];

    // Radiant win rate from recent public matches
    let radiantWR = '--';
    if (publicMatches && publicMatches.length > 0) {
      const radiantWins = publicMatches.filter(m => m.radiant_win).length;
      radiantWR = ((radiantWins / publicMatches.length) * 100).toFixed(1) + '%';
    }

    el.innerHTML = `
      ${statCard('Playable Heroes', heroCount, 'In current patch')}
      ${statCard('Most Picked', topPick ? topPick.name : '--', topPick ? `${formatNumber(topPick.picks)} total picks` : '')}
      ${statCard('Highest Win Rate', topWR ? `${topWR.wr.toFixed(1)}%` : '--', topWR ? topWR.name : '', 'text-dota-radiant')}
      ${statCard('Radiant Win Rate', radiantWR, 'Recent public matches', parseFloat(radiantWR) >= 50 ? 'text-dota-radiant' : 'text-dota-dire')}
    `;
  } catch {
    el.innerHTML = `
      ${statCard('Playable Heroes', heroStore.heroes.length || '--', 'In current patch')}
      ${statCard('Most Picked', '--', 'Hero stats unavailable')}
      ${statCard('Highest Win Rate', '--', 'Hero stats unavailable')}
      ${statCard('Radiant Win Rate', '--', 'Recent public matches')}
    `;
  }
}

async function loadLiveGames() {
  const el = document.getElementById('home-live');
  try {
    const games = await api.getLiveGames();
    if (!games || games.length === 0) {
      el.innerHTML = '<p class="text-dota-text-muted text-sm py-8 text-center">No live games found</p>';
      return;
    }
    el.innerHTML = games.slice(0, 8).map(game => {
      const avgMMR = game.average_mmr || 'N/A';
      const spectators = game.spectators || 0;
      const elapsed = game.game_time ? formatDuration(game.game_time) : 'Starting';
      const radiantScore = game.radiant_score || 0;
      const direScore = game.dire_score || 0;
      const radiantHeroes = (game.radiant_team || []).slice(0, 5);
      const direHeroes = (game.dire_team || []).slice(0, 5);

      return `
        <div class="dota-card p-4 cursor-pointer" onclick="window.location.hash='#/matches/${game.match_id}'">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="live-pulse"></span>
              <span class="text-xs text-dota-text-muted">${elapsed}</span>
              <span class="badge badge-gold">${avgMMR !== 'N/A' ? `~${avgMMR} MMR` : 'Unranked'}</span>
            </div>
            <span class="text-xs text-dota-text-muted">${spectators} watching</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              ${radiantHeroes.map(h => `<img src="${heroImg(heroStore.getHero(h))}" class="w-8 h-[18px] rounded" alt="" loading="lazy">`).join('')}
            </div>
            <div class="flex items-center gap-3 mx-4">
              <span class="text-dota-radiant font-bold text-lg">${radiantScore}</span>
              <span class="text-dota-text-muted text-xs">VS</span>
              <span class="text-dota-dire font-bold text-lg">${direScore}</span>
            </div>
            <div class="flex items-center gap-1">
              ${direHeroes.map(h => `<img src="${heroImg(heroStore.getHero(h))}" class="w-8 h-[18px] rounded" alt="" loading="lazy">`).join('')}
            </div>
          </div>
          ${game.radiant_team_name || game.dire_team_name ? `
          <div class="flex items-center justify-between mt-2 text-xs">
            <span class="text-dota-radiant">${game.radiant_team_name || 'Radiant'}</span>
            <span class="text-dota-dire">${game.dire_team_name || 'Dire'}</span>
          </div>` : ''}
        </div>
      `;
    }).join('');
  } catch (e) {
    el.innerHTML = errorState('Failed to load live games');
  }
}

async function loadTopHeroes() {
  const el = document.getElementById('home-heroes');
  try {
    const stats = await api.getHeroStats();
    // Sort by total picks (pro + public)
    const sorted = stats.sort((a, b) => {
      const aPicks = (a['1_pick'] || 0) + (a['2_pick'] || 0) + (a['3_pick'] || 0) + (a['4_pick'] || 0) + (a['5_pick'] || 0) + (a['6_pick'] || 0) + (a['7_pick'] || 0) + (a['8_pick'] || 0);
      const bPicks = (b['1_pick'] || 0) + (b['2_pick'] || 0) + (b['3_pick'] || 0) + (b['4_pick'] || 0) + (b['5_pick'] || 0) + (b['6_pick'] || 0) + (b['7_pick'] || 0) + (b['8_pick'] || 0);
      return bPicks - aPicks;
    }).slice(0, 10);

    el.innerHTML = sorted.map((hero, i) => {
      const totalPicks = (hero['1_pick'] || 0) + (hero['2_pick'] || 0) + (hero['3_pick'] || 0) + (hero['4_pick'] || 0) + (hero['5_pick'] || 0) + (hero['6_pick'] || 0) + (hero['7_pick'] || 0) + (hero['8_pick'] || 0);
      const totalWins = (hero['1_win'] || 0) + (hero['2_win'] || 0) + (hero['3_win'] || 0) + (hero['4_win'] || 0) + (hero['5_win'] || 0) + (hero['6_win'] || 0) + (hero['7_win'] || 0) + (hero['8_win'] || 0);
      const wr = totalPicks > 0 ? ((totalWins / totalPicks) * 100).toFixed(1) : '0';
      
      return `
        <a href="#/heroes/${hero.id}" class="flex items-center gap-3 p-2 rounded-lg hover:bg-dota-card-hover transition-colors">
          <span class="text-xs text-dota-text-muted w-4">${i + 1}</span>
          <img src="${heroImg(hero)}" alt="${hero.localized_name}" class="w-12 h-[27px] rounded">
          <div class="flex-1 min-w-0">
            <div class="text-sm text-dota-text-primary font-semibold truncate">${hero.localized_name}</div>
            <div class="text-xs text-dota-text-muted">${formatNumber(totalPicks)} picks</div>
          </div>
          <span class="text-sm font-semibold ${parseFloat(wr) >= 50 ? 'text-dota-radiant' : 'text-dota-dire'}">${wr}%</span>
        </a>
      `;
    }).join('');
  } catch {
    el.innerHTML = errorState('Failed to load hero stats');
  }
}

async function loadPublicMatches() {
  const el = document.getElementById('home-public');
  try {
    const matches = await api.getPublicMatches();
    if (!matches || matches.length === 0) {
      el.innerHTML = '<p class="text-dota-text-muted text-sm text-center py-8">No public matches found</p>';
      return;
    }
    el.innerHTML = `
      <table class="dota-table">
        <thead>
          <tr>
            <th>Match ID</th>
            <th>Duration</th>
            <th>Avg Skill</th>
            <th>Radiant</th>
            <th>Dire</th>
            <th>Winner</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${matches.slice(0, 15).map(m => {
            return `
              <tr class="cursor-pointer" onclick="window.location.hash='#/matches/${m.match_id}'">
                <td class="text-dota-gold text-xs">${m.match_id}</td>
                <td class="text-xs">${formatDuration(m.duration)}</td>
                <td class="text-xs">${formatMatchAvgSkill(m)}</td>
                <td>
                  <div class="flex gap-0.5">
                    ${renderTeamHeroes(m.radiant_team)}
                  </div>
                </td>
                <td>
                  <div class="flex gap-0.5">
                    ${renderTeamHeroes(m.dire_team)}
                  </div>
                </td>
                <td><span class="${m.radiant_win ? 'text-dota-radiant' : 'text-dota-dire'} text-xs font-semibold">${m.radiant_win ? 'Radiant' : 'Dire'}</span></td>
                <td class="text-xs text-dota-text-muted">${timeAgo(m.start_time)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch {
    el.innerHTML = errorState('Failed to load public matches');
  }
}
