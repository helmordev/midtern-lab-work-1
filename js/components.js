// ================================================
// Reusable UI Components
// ================================================

import { heroImg, formatDuration, winRate, timeAgo, formatNumber, rankTierToMedal, getAttrClass, heroStore } from './utils.js';

export function loader(text = 'Loading...') {
  return `
    <div class="flex flex-col items-center justify-center py-20 fade-in">
      <div class="relative w-16 h-16 mb-4">
        <div class="absolute inset-0 border-2 border-dota-border rounded-full"></div>
        <div class="absolute inset-0 border-2 border-transparent border-t-dota-gold rounded-full animate-spin"></div>
      </div>
      <span class="text-dota-text-muted text-sm">${text}</span>
    </div>
  `;
}

export function errorState(message = 'Something went wrong', retryAction = '') {
  return `
    <div class="flex flex-col items-center justify-center py-20 fade-in">
      <svg class="w-16 h-16 text-dota-crimson mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <p class="text-dota-text-muted mb-4">${message}</p>
      ${retryAction ? `<button type="button" class="btn-outline btn-sm" onclick="${retryAction}">Try Again</button>` : ''}
    </div>
  `;
}

export function emptyState(message = 'No data found') {
  return `
    <div class="flex flex-col items-center justify-center py-16 fade-in">
      <svg class="w-12 h-12 text-dota-text-muted mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
      <p class="text-dota-text-muted text-sm">${message}</p>
    </div>
  `;
}

export function skeletonCards(count = 6) {
  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${Array(count).fill('').map(() => `
        <div class="dota-card-flat p-4">
          <div class="skeleton h-4 w-3/4 mb-3"></div>
          <div class="skeleton h-3 w-1/2 mb-2"></div>
          <div class="skeleton h-3 w-2/3"></div>
        </div>
      `).join('')}
    </div>
  `;
}

export function skeletonTable(rows = 5, cols = 4) {
  return `
    <div class="overflow-table">
      <table class="dota-table">
        <thead><tr>${Array(cols).fill('').map(() => '<th><div class="skeleton h-3 w-16"></div></th>').join('')}</tr></thead>
        <tbody>
          ${Array(rows).fill('').map(() => `
            <tr>${Array(cols).fill('').map(() => '<td><div class="skeleton h-3 w-20"></div></td>').join('')}</tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function heroCard(hero, size = 'md') {
  const sizes = { sm: 'h-16 w-28', md: 'h-20 w-36', lg: 'h-28 w-48' };
  const name = hero.localized_name || hero.name || '';
  return `
    <a href="#/heroes/${hero.id}" class="hero-card ${sizes[size] || sizes.md} block" title="${name}">
      <img src="${heroImg(hero)}" alt="${name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23141c28%22 width=%221%22 height=%221%22/></svg>'">
      <div class="hero-overlay">${name}</div>
    </a>
  `;
}

export function miniHeroImg(heroId, size = 24) {
  const hero = heroStore.getHero(heroId);
  if (!hero) return `<div class="inline-block bg-dota-card rounded" style="width:${size}px;height:${size * 0.56}px" title="Hero #${heroId}"></div>`;
  return `<img src="${heroImg(hero)}" alt="${hero.localized_name}" class="inline-block rounded" style="width:${size}px;height:${size * 0.56}px" loading="lazy" title="${hero.localized_name}">`;
}

export function matchRow(match, showHero = true) {
  const isWin = match.radiant_win === (match.player_slot < 128);
  const winText = isWin ? 'Won' : 'Lost';
  const winClass = isWin ? 'text-dota-radiant' : 'text-dota-dire';
  const heroName = heroStore.getHeroName(match.hero_id);
  
  return `
    <tr class="cursor-pointer hover:bg-dota-card-hover/50" onclick="window.location.hash='#/matches/${match.match_id}'">
      ${showHero ? `<td class="flex items-center gap-2">${miniHeroImg(match.hero_id, 32)}<span class="text-dota-text-primary text-xs">${heroName}</span></td>` : ''}
      <td><span class="${winClass} font-semibold text-xs">${winText}</span></td>
      <td class="text-xs">${formatDuration(match.duration)}</td>
      <td class="text-xs">${match.kills || 0}/${match.deaths || 0}/${match.assists || 0}</td>
      <td class="text-xs text-dota-text-muted">${timeAgo(match.start_time)}</td>
      <td class="text-xs text-dota-text-muted">${match.match_id}</td>
    </tr>
  `;
}

export function playerRow(player) {
  const avatar = player.avatarfull || player.avatar || '';
  const name = player.personaname || player.name || 'Anonymous';
  const accountId = player.account_id;
  
  return `
    <div class="search-item" onclick="window.location.hash='#/players/${accountId}'">
      <img src="${avatar}" alt="${name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23141c28%22 width=%221%22 height=%221%22/></svg>'">
      <div>
        <div class="text-sm text-dota-text-primary font-semibold">${name}</div>
        ${accountId ? `<div class="text-xs text-dota-text-muted">${accountId}</div>` : ''}
      </div>
    </div>
  `;
}

export function tabBar(tabs, activeTab, containerId) {
  return `
    <div class="flex flex-wrap gap-1 border-b border-dota-border mb-4 pb-0">
      ${tabs.map(t => `
        <button type="button" class="tab-btn ${t.id === activeTab ? 'active' : ''}" 
                onclick="window.dispatchEvent(new CustomEvent('tab-change', { detail: { container: '${containerId}', tab: '${t.id}' } }))">
          ${t.label}
        </button>
      `).join('')}
    </div>
  `;
}

export function statCard(label, value, subtext = '', color = 'text-dota-gold') {
  return `
    <div class="dota-card-flat p-4">
      <div class="text-xs text-dota-text-muted uppercase tracking-wider mb-1 font-semibold">${label}</div>
      <div class="text-2xl font-bold ${color} font-display">${value}</div>
      ${subtext ? `<div class="text-xs text-dota-text-muted mt-1">${subtext}</div>` : ''}
    </div>
  `;
}

export function pagination(currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) return '';
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  
  if (start > 1) pages.push(1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('...');
  if (end < totalPages) pages.push(totalPages);
  
  return `
    <div class="pagination justify-center mt-6">
      <button type="button" class="page-btn" onclick="${onPageChange}(${currentPage - 1})" ${currentPage === 1 ? 'disabled style="opacity:0.3;pointer-events:none"' : ''}>Prev</button>
      ${pages.map(p => p === '...' 
        ? '<span class="px-2 text-dota-text-muted">...</span>'
        : `<button type="button" class="page-btn ${p === currentPage ? 'active' : ''}" onclick="${onPageChange}(${p})">${p}</button>`
      ).join('')}
      <button type="button" class="page-btn" onclick="${onPageChange}(${currentPage + 1})" ${currentPage === totalPages ? 'disabled style="opacity:0.3;pointer-events:none"' : ''}>Next</button>
    </div>
  `;
}
