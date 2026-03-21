// ================================================
// OpenDota API Service - All 55 Endpoints
// ================================================

const BASE_URL = 'https://api.opendota.com/api';

class OpenDotaAPI {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  async fetch(endpoint, options = {}) {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.cacheTTL) {
      return cached.data;
    }

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, options);
      if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (options.method !== 'POST') {
        this.cache.set(cacheKey, { data, time: Date.now() });
      }
      return data;
    } catch (err) {
      console.error(`OpenDota API error [${endpoint}]:`, err);
      throw err;
    }
  }

  // ---- PLAYERS (15 endpoints) ----
  getPlayer(accountId) {
    return this.fetch(`/players/${accountId}`);
  }

  getPlayerWinLoss(accountId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/players/${accountId}/wl${qs ? '?' + qs : ''}`);
  }

  getPlayerRecentMatches(accountId) {
    return this.fetch(`/players/${accountId}/recentMatches`);
  }

  getPlayerMatches(accountId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/players/${accountId}/matches${qs ? '?' + qs : ''}`);
  }

  getPlayerHeroes(accountId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/players/${accountId}/heroes${qs ? '?' + qs : ''}`);
  }

  getPlayerPeers(accountId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/players/${accountId}/peers${qs ? '?' + qs : ''}`);
  }

  getPlayerPros(accountId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/players/${accountId}/pros${qs ? '?' + qs : ''}`);
  }

  getPlayerTotals(accountId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/players/${accountId}/totals${qs ? '?' + qs : ''}`);
  }

  getPlayerCounts(accountId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/players/${accountId}/counts${qs ? '?' + qs : ''}`);
  }

  getPlayerHistogram(accountId, field, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/players/${accountId}/histograms/${field}${qs ? '?' + qs : ''}`);
  }

  getPlayerWardmap(accountId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/players/${accountId}/wardmap${qs ? '?' + qs : ''}`);
  }

  getPlayerWordcloud(accountId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/players/${accountId}/wordcloud${qs ? '?' + qs : ''}`);
  }

  getPlayerRatings(accountId) {
    return this.fetch(`/players/${accountId}/ratings`);
  }

  getPlayerRankings(accountId) {
    return this.fetch(`/players/${accountId}/rankings`);
  }

  refreshPlayer(accountId) {
    return this.fetch(`/players/${accountId}/refresh`, { method: 'POST' });
  }

  // ---- PRO PLAYERS (1 endpoint) ----
  getProPlayers() {
    return this.fetch('/proPlayers');
  }

  // ---- MATCHES (1 endpoint) ----
  getMatch(matchId) {
    return this.fetch(`/matches/${matchId}`);
  }

  // ---- PRO MATCHES (1 endpoint) ----
  getProMatches(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/proMatches${qs ? '?' + qs : ''}`);
  }

  // ---- PUBLIC MATCHES (1 endpoint) ----
  getPublicMatches(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/publicMatches${qs ? '?' + qs : ''}`);
  }

  // ---- PARSED MATCHES (1 endpoint) ----
  getParsedMatches(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/parsedMatches${qs ? '?' + qs : ''}`);
  }

  // ---- HEROES (6 endpoints) ----
  getHeroes() {
    return this.fetch('/heroes');
  }

  getHeroMatches(heroId) {
    return this.fetch(`/heroes/${heroId}/matches`);
  }

  getHeroMatchups(heroId) {
    return this.fetch(`/heroes/${heroId}/matchups`);
  }

  getHeroDurations(heroId) {
    return this.fetch(`/heroes/${heroId}/durations`);
  }

  getHeroPlayers(heroId) {
    return this.fetch(`/heroes/${heroId}/players`);
  }

  getHeroItemPopularity(heroId) {
    return this.fetch(`/heroes/${heroId}/itemPopularity`);
  }

  // ---- HERO STATS (1 endpoint) ----
  getHeroStats() {
    return this.fetch('/heroStats');
  }

  // ---- LEAGUES (5 endpoints) ----
  getLeagues() {
    return this.fetch('/leagues');
  }

  getLeague(leagueId) {
    return this.fetch(`/leagues/${leagueId}`);
  }

  getLeagueMatches(leagueId) {
    return this.fetch(`/leagues/${leagueId}/matches`);
  }

  getLeagueMatchIds(leagueId) {
    return this.fetch(`/leagues/${leagueId}/matchIds`);
  }

  getLeagueTeams(leagueId) {
    return this.fetch(`/leagues/${leagueId}/teams`);
  }

  // ---- TEAMS (5 endpoints) ----
  getTeams(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/teams${qs ? '?' + qs : ''}`);
  }

  getTeam(teamId) {
    return this.fetch(`/teams/${teamId}`);
  }

  getTeamMatches(teamId) {
    return this.fetch(`/teams/${teamId}/matches`);
  }

  getTeamPlayers(teamId) {
    return this.fetch(`/teams/${teamId}/players`);
  }

  getTeamHeroes(teamId) {
    return this.fetch(`/teams/${teamId}/heroes`);
  }

  // ---- SEARCH (1 endpoint) ----
  searchPlayers(query) {
    return this.fetch(`/search?q=${encodeURIComponent(query)}`);
  }

  // ---- RANKINGS (1 endpoint) ----
  getRankings(heroId) {
    return this.fetch(`/rankings?hero_id=${heroId}`);
  }

  // ---- BENCHMARKS (1 endpoint) ----
  getBenchmarks(heroId) {
    return this.fetch(`/benchmarks?hero_id=${heroId}`);
  }

  // ---- RECORDS (1 endpoint) ----
  getRecords(field) {
    return this.fetch(`/records/${field}`);
  }

  // ---- LIVE (1 endpoint) ----
  getLiveGames() {
    return this.fetch('/live');
  }

  // ---- SCENARIOS (3 endpoints) ----
  getItemTimings(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/scenarios/itemTimings${qs ? '?' + qs : ''}`);
  }

  getLaneRoles(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/scenarios/laneRoles${qs ? '?' + qs : ''}`);
  }

  getMiscScenarios(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/scenarios/misc${qs ? '?' + qs : ''}`);
  }

  // ---- FIND MATCHES (1 endpoint) ----
  findMatches(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/findMatches${qs ? '?' + qs : ''}`);
  }

  // ---- TOP PLAYERS (1 endpoint) ----
  getTopPlayers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.fetch(`/topPlayers${qs ? '?' + qs : ''}`);
  }

  // ---- REQUEST / PARSE (2 endpoints) ----
  requestParse(matchId) {
    return this.fetch(`/request/${matchId}`, { method: 'POST' });
  }

  getParseStatus(jobId) {
    return this.fetch(`/request/${jobId}`);
  }

  // ---- CONSTANTS (1 endpoint) ----
  getConstants(resource) {
    return this.fetch(`/constants/${resource}`);
  }

  // ---- DISTRIBUTIONS (1 endpoint) ----
  getDistributions() {
    return this.fetch('/distributions');
  }

  // ---- METADATA (1 endpoint) ----
  getMetadata() {
    return this.fetch('/metadata');
  }

  // ---- HEALTH (1 endpoint) ----
  getHealth() {
    return this.fetch('/health');
  }
}

export const api = new OpenDotaAPI();
