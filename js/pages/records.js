// ================================================
// Records & Top Players Page
// API endpoints used:
//   GET /records/{field}, GET /topPlayers
// ================================================

import { api } from '../api.js';
import { loader, errorState, emptyState, miniHeroImg, tabBar } from '../components.js';
import { heroStore, formatDuration, timeAgo, formatNumber } from '../utils.js';

export async function renderRecords() {
  const app = document.getElementById('app');
  const fields = ['kills', 'deaths', 'assists', 'gold_per_min', 'xp_per_min', 'last_hits', 'denies', 'hero_damage', 'tower_damage', 'hero_healing'];

  app.innerHTML = `
    <div class="page-container">
      <h1 class="section-title">Records & Leaderboard</h1>
      <p class="section-subtitle">All-time records and top ranked players.</p>

      <div id="records-tabs">
        ${tabBar([
          { id: 'records', label: 'Records' },
          { id: 'leaderboard', label: 'Leaderboard' },
        ], 'records', 'records-tabs')}
      </div>
      <div id="records-tab-content">${loader()}</div>
    </div>
  `;

  loadRecordsTab('records', fields);

  window.addEventListener('tab-change', (e) => {
    if (e.detail.container === 'records-tabs') {
      document.querySelectorAll('#records-tabs .tab-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.trim().toLowerCase() === e.detail.tab);
      });
      loadRecordsTab(e.detail.tab, fields);
    }
  });
}

async function loadRecordsTab(tab, fields) {
  const el = document.getElementById('records-tab-content');
  el.innerHTML = loader();

  try {
    if (tab === 'records') {
      el.innerHTML = `
        <div class="mb-4">
          <select id="record-field" class="dota-input dota-select w-48">
            ${fields.map(f => `<option value="${f}">${f.replace(/_/g, ' ')}</option>`).join('')}
          </select>
        </div>
        <div id="records-data">${loader()}</div>
      `;

      loadRecordsField(fields[0]);
      document.getElementById('record-field').addEventListener('change', (e) => {
        loadRecordsField(e.target.value);
      });
    } else if (tab === 'leaderboard') {
      const data = await api.getTopPlayers();
      if (!data?.length) { el.innerHTML = emptyState('No leaderboard data'); return; }

      el.innerHTML = `
        <div class="overflow-table">
          <table class="dota-table">
            <thead><tr><th>#</th><th>Player</th><th>Rating</th><th>Wins</th><th>Losses</th></tr></thead>
            <tbody>
              ${data.slice(0, 100).map((p, i) => `
                <tr class="cursor-pointer" onclick="window.location.hash='#/players/${p.account_id}'">
                  <td class="text-dota-gold text-xs font-bold">${i + 1}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      ${p.avatarfull ? `<img src="${p.avatarfull}" class="w-6 h-6 rounded-full" alt="">` : ''}
                      <span class="text-xs text-dota-text-primary">${p.personaname || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td class="text-xs text-dota-gold font-bold">${p.rating || '--'}</td>
                  <td class="text-xs text-dota-radiant">${p.wins || '--'}</td>
                  <td class="text-xs text-dota-dire">${p.losses || '--'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  } catch {
    el.innerHTML = errorState('Failed to load data');
  }
}

async function loadRecordsField(field) {
  const el = document.getElementById('records-data');
  if (!el) return;
  el.innerHTML = loader();

  try {
    const data = await api.getRecords(field);
    if (!data?.length) { el.innerHTML = emptyState('No records found'); return; }

    el.innerHTML = `
      <div class="overflow-table">
        <table class="dota-table">
          <thead><tr><th>#</th><th>Hero</th><th>Value</th><th>Match</th><th>Time</th></tr></thead>
          <tbody>
            ${data.slice(0, 30).map((r, i) => `
              <tr class="cursor-pointer" onclick="window.location.hash='#/matches/${r.match_id}'">
                <td class="text-dota-gold text-xs font-bold">${i + 1}</td>
                <td class="flex items-center gap-2">${miniHeroImg(r.hero_id, 28)}<span class="text-xs">${heroStore.getHeroName(r.hero_id)}</span></td>
                <td class="text-xs text-dota-gold font-bold">${formatNumber(r.score)}</td>
                <td class="text-xs text-dota-text-muted">${r.match_id}</td>
                <td class="text-xs text-dota-text-muted">${timeAgo(r.start_time)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch {
    el.innerHTML = errorState('Failed to load records');
  }
}
