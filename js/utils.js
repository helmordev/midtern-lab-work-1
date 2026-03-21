// ================================================
// Utility Functions
// ================================================

// Hero image URL helpers
export function heroImg(hero) {
  if (!hero) return '';
  const name = (hero.name || hero.localized_name || '').replace('npc_dota_hero_', '');
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${name}.png`;
}

export function heroIcon(hero) {
  if (!hero) return '';
  const name = (hero.name || '').replace('npc_dota_hero_', '');
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/${name}.png`;
}

export function itemImg(itemName) {
  if (!itemName) return '';
  const clean = String(itemName).replace('item_', '').replace(/\?.*$/, '');
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${clean}.png`;
}

// Time formatting
export function timeAgo(timestamp) {
  if (!timestamp) return 'Unknown';
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDurationBinLabel(durationBin, binSizeSeconds = 300) {
  const startSeconds = Number(durationBin);
  if (!Number.isFinite(startSeconds) || startSeconds < 0) return '--';
  const endSeconds = startSeconds + binSizeSeconds;
  const startMinutes = Math.floor(startSeconds / 60);
  const endMinutes = Math.floor(endSeconds / 60);
  return `${startMinutes}-${endMinutes} min`;
}

export function formatNumber(n) {
  if (n === null || n === undefined) return '--';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function formatMatchAvgSkill(match) {
  const avgMMR = Number(match?.avg_mmr);
  if (Number.isFinite(avgMMR) && avgMMR > 0) {
    return formatNumber(avgMMR);
  }

  const computedMMRs = (match?.players || [])
    .map(player => Number(player?.computed_mmr))
    .filter(value => Number.isFinite(value) && value > 0);

  if (computedMMRs.length > 0) {
    const averageComputedMMR = Math.round(
      computedMMRs.reduce((total, value) => total + value, 0) / computedMMRs.length
    );
    return formatNumber(averageComputedMMR);
  }

  const avgRankTier = Number(match?.avg_rank_tier);
  if (Number.isFinite(avgRankTier) && avgRankTier > 0) {
    return `Tier ${Math.round(avgRankTier)}`;
  }

  const rankTiers = (match?.players || [])
    .map(player => Number(player?.rank_tier))
    .filter(value => Number.isFinite(value) && value > 0);

  if (rankTiers.length > 0) {
    const averageTier = Math.round(
      rankTiers.reduce((total, value) => total + value, 0) / rankTiers.length
    );
    return `Tier ${averageTier}`;
  }

  return '--';
}

export function formatDate(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// Win rate
export function winRate(wins, total) {
  if (!total) return 0;
  return ((wins / total) * 100).toFixed(1);
}

// Rank tier to medal name
export function rankTierToMedal(rankTier) {
  if (!rankTier) return { name: 'Unranked', stars: 0, class: '' };
  const tier = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  const medals = {
    1: { name: 'Herald', class: 'rank-herald' },
    2: { name: 'Guardian', class: 'rank-guardian' },
    3: { name: 'Crusader', class: 'rank-crusader' },
    4: { name: 'Archon', class: 'rank-archon' },
    5: { name: 'Legend', class: 'rank-legend' },
    6: { name: 'Ancient', class: 'rank-ancient' },
    7: { name: 'Divine', class: 'rank-divine' },
    8: { name: 'Immortal', class: 'rank-immortal' },
  };
  const medal = medals[tier] || { name: 'Unranked', class: '' };
  return { ...medal, stars };
}

// Attribute mapping
export function getAttrClass(attr) {
  const map = { str: 'attr-str', agi: 'attr-agi', int: 'attr-int', all: 'attr-all' };
  return map[attr] || 'attr-all';
}

export function getAttrBgClass(attr) {
  const map = { str: 'attr-str-bg', agi: 'attr-agi-bg', int: 'attr-int-bg', all: 'attr-all-bg' };
  return map[attr] || 'attr-all-bg';
}

export function getAttrName(attr) {
  const map = { str: 'Strength', agi: 'Agility', int: 'Intelligence', all: 'Universal' };
  return map[attr] || 'Universal';
}

// Game mode mapping
export function gameModeName(mode) {
  const modes = {
    0: 'Unknown', 1: 'All Pick', 2: 'Captain\'s Mode', 3: 'Random Draft',
    4: 'Single Draft', 5: 'All Random', 11: 'Mid Only', 12: 'Least Played',
    14: 'Compendium', 16: 'Captain\'s Draft', 18: 'Ability Draft',
    22: 'All Pick (Ranked)', 23: 'Turbo'
  };
  return modes[mode] || `Mode ${mode}`;
}

// Lobby type mapping
export function lobbyTypeName(type) {
  const types = {
    0: 'Normal', 1: 'Practice', 2: 'Tournament', 4: 'Co-op Bot',
    5: 'Ranked', 6: 'Solo Mid', 7: 'Ranked', 9: 'Battle Cup'
  };
  return types[type] || `Lobby ${type}`;
}

// Lane role mapping
export function laneRoleName(role) {
  const roles = { 1: 'Safe Lane', 2: 'Mid Lane', 3: 'Off Lane', 4: 'Jungle' };
  return roles[role] || 'Unknown';
}

// Debounce
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Toast notifications
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = {
    success: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>',
    error: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
    info: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
  };
  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Store hero data globally for lookups
export const heroStore = {
  heroes: [],
  heroMap: {},
  items: {},
  itemIdMap: {},
  async init(api) {
    if (this.heroes.length > 0) return;
    try {
      const [heroes, items] = await Promise.all([
        api.getHeroes(),
        api.getConstants('items')
      ]);
      this.heroes = heroes;
      heroes.forEach(h => { this.heroMap[h.id] = h; });
      this.items = items || {};
      this.itemIdMap = {};
      Object.entries(this.items).forEach(([itemKey, itemData]) => {
        if (itemData?.id !== undefined && itemData?.id !== null) {
          this.itemIdMap[String(itemData.id)] = itemKey;
        }
      });
    } catch (e) {
      console.error('Failed to init hero store:', e);
    }
  },
  getHero(id) {
    return this.heroMap[id] || null;
  },
  getHeroName(id) {
    const h = this.heroMap[id];
    return h ? h.localized_name : `Hero #${id}`;
  },
  getItemKey(key) {
    if (!key && key !== 0) return '';
    const raw = String(key);
    if (this.items[raw]) return raw;

    const withoutPrefix = raw.replace('item_', '');
    if (this.items[withoutPrefix]) return withoutPrefix;

    const mapped = this.itemIdMap[raw] || this.itemIdMap[withoutPrefix];
    if (mapped) return mapped;

    const numericId = Number(raw);
    if (Number.isFinite(numericId)) {
      const found = Object.entries(this.items).find(([, item]) => Number(item?.id) === numericId);
      if (found) return found[0];
    }

    return withoutPrefix;
  },
  getItemName(key) {
    if (!key && key !== 0) return 'Unknown';
    const itemKey = this.getItemKey(key);
    const item = this.items[itemKey];
    return item ? item.dname : itemKey.replace(/_/g, ' ');
  },
  getItemImage(key) {
    const itemKey = this.getItemKey(key);
    return itemImg(itemKey);
  }
};
