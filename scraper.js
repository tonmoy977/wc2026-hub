
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// =============================================================================
// CONFIGURATION
// =============================================================================

const OUTPUT_DIR = path.join(__dirname, 'data');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'live.json');
const TEMP_PATH = path.join(OUTPUT_DIR, 'live.json.tmp');

const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES_PER_ENDPOINT = 2;

// =============================================================================
// MULTI-SOURCE CONFIGURATION
// Priority: worldcup26.ir → football-data.org → API-Football → TheSportsDB
// =============================================================================

const SOURCES = [
  {
    name: 'worldcup26.ir',
    type: 'direct',
    endpoints: [
      'https://worldcup26.ir/get/games',
      'https://corsproxy.io/?https://worldcup26.ir/get/games',
      'https://api.allorigins.win/raw?url=https://worldcup26.ir/get/games',
      'https://api.codetabs.com/v1/proxy?quest=https://worldcup26.ir/get/games'
    ],
    unwrap: (payload) => payload.games || payload.matches || payload.fixtures || payload.response || payload.data || payload,
    fieldMap: {
      homeTeam: ['home_team_name_en', 'homeTeam', 'home_team', 'home', 'team1', 'homeName'],
      awayTeam: ['away_team_name_en', 'awayTeam', 'away_team', 'away', 'team2', 'awayName'],
      homeScore: ['home_score', 'homeScore', 'score1', 'intHomeScore', 'home_score_fulltime'],
      awayScore: ['away_score', 'awayScore', 'score2', 'intAwayScore', 'away_score_fulltime'],
      status: ['finished', 'time_elapsed', 'status', 'match_status', 'state']
    }
  },
  {
    name: 'football-data.org',
    type: 'direct',
    endpoints: [
      'https://api.football-data.org/v4/competitions/WC/matches',
      'https://corsproxy.io/?https://api.football-data.org/v4/competitions/WC/matches'
    ],
    headers: {
      'X-Auth-Token': process.env.FOOTBALL_DATA_TOKEN || ''
    },
    unwrap: (payload) => payload.matches || [],
    fieldMap: {
      homeTeam: ['homeTeam', 'home_team', 'home'],
      awayTeam: ['awayTeam', 'away_team', 'away'],
      homeScore: ['score.fullTime.home', 'score.halfTime.home', 'home_score'],
      awayScore: ['score.fullTime.away', 'score.halfTime.away', 'away_score'],
      status: ['status', 'match_status', 'state']
    },
    customNormalize: (raw) => {
      const homeObj = raw.homeTeam || {};
      const awayObj = raw.awayTeam || {};
      const home = homeObj.name || homeObj.shortName || homeObj.tla;
      const away = awayObj.name || awayObj.shortName || awayObj.tla;
      
      const scoreObj = raw.score || {};
      const ft = scoreObj.fullTime || {};
      const homeScore = ft.home !== undefined ? ft.home : (scoreObj.halfTime?.home ?? undefined);
      const awayScore = ft.away !== undefined ? ft.away : (scoreObj.halfTime?.away ?? undefined);
      
      const statusRaw = raw.status;
      const s = String(statusRaw || '').toUpperCase();
      const isFinished = s === 'FINISHED' || s === 'FT' || s === 'FULL_TIME' || s === 'FINISHED_AET' || s === 'FINISHED_PEN';
      
      if (!home || !away) return null;
      if (homeScore === undefined || awayScore === undefined) return null;
      
      return {
        home_team_name_en: String(home).trim(),
        away_team_name_en: String(away).trim(),
        home_score: parseInt(homeScore, 10) || 0,
        away_score: parseInt(awayScore, 10) || 0,
        finished: isFinished,
        status: isFinished ? 'FINISHED' : String(statusRaw || 'SCHEDULED').toUpperCase(),
        _source_timestamp: raw.utcDate || raw.lastUpdated || null
      };
    }
  },
  {
    name: 'api-football (api-sports)',
    type: 'direct',
    endpoints: [
      'https://v3.football.api-sports.io/fixtures?league=1&season=2026',
      'https://corsproxy.io/?https://v3.football.api-sports.io/fixtures?league=1&season=2026'
    ],
    headers: {
      'x-apisports-key': process.env.API_FOOTBALL_KEY || '',
      'x-rapidapi-host': 'v3.football.api-sports.io'
    },
    unwrap: (payload) => payload.response || [],
    fieldMap: {},
    customNormalize: (raw) => {
      const fixture = raw.fixture || {};
      const teams = raw.teams || {};
      const goals = raw.goals || {};
      
      const home = teams.home?.name;
      const away = teams.away?.name;
      const homeScore = goals.home;
      const awayScore = goals.away;
      const statusRaw = fixture.status?.short || fixture.status?.long;
      
      const s = String(statusRaw || '').toUpperCase();
      const isFinished = s === 'FT' || s === 'AET' || s === 'PEN' || s === 'FINISHED';
      
      if (!home || !away) return null;
      if (homeScore === undefined || awayScore === undefined) return null;
      
      return {
        home_team_name_en: String(home).trim(),
        away_team_name_en: String(away).trim(),
        home_score: parseInt(homeScore, 10) || 0,
        away_score: parseInt(awayScore, 10) || 0,
        finished: isFinished,
        status: isFinished ? 'FINISHED' : String(statusRaw || 'SCHEDULED').toUpperCase(),
        _source_timestamp: fixture.date || fixture.timestamp || null
      };
    }
  },
  {
    name: 'TheSportsDB',
    type: 'direct',
    endpoints: [
      'https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4424&s=2026',
      'https://corsproxy.io/?https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4424&s=2026'
    ],
    unwrap: (payload) => payload.events || [],
    fieldMap: {},
    customNormalize: (raw) => {
      const home = raw.strHomeTeam;
      const away = raw.strAwayTeam;
      const homeScore = raw.intHomeScore;
      const awayScore = raw.intAwayScore;
      const statusRaw = raw.strStatus || raw.strProgress;
      
      const s = String(statusRaw || '').toLowerCase();
      const isFinished = s.includes('finished') || s.includes('ft') || s.includes('full') || (homeScore !== '' && awayScore !== '' && s === '');
      
      if (!home || !away) return null;
      if (homeScore === '' || homeScore === null || awayScore === '' || awayScore === null) return null;
      
      return {
        home_team_name_en: String(home).trim(),
        away_team_name_en: String(away).trim(),
        home_score: parseInt(homeScore, 10) || 0,
        away_score: parseInt(awayScore, 10) || 0,
        finished: isFinished,
        status: isFinished ? 'FINISHED' : (String(statusRaw || 'SCHEDULED').toUpperCase()),
        _source_timestamp: raw.dateEvent || raw.strTimestamp || null
      };
    }
  }
];

// =============================================================================
// TEAM NAME MAPPING (normalize different API spellings to your app names)
// =============================================================================

const TEAM_NAME_MAP = {
  'Korea Republic': 'South Korea',
  'Korea Rep.': 'South Korea',
  'Republic of Korea': 'South Korea',
  'Czech Republic': 'Czechia',
  'Czechia': 'Czechia',
  'Turkey': 'Türkiye',
  'Turkiye': 'Türkiye',
  'Curacao': 'Curaçao',
  "Cote d'Ivoire": 'Ivory Coast',
  "Côte d'Ivoire": 'Ivory Coast',
  'IR Iran': 'Iran',
  'United States': 'USA',
  'United States of America': 'USA',
  'Congo DR': 'DR Congo',
  'Congo-Kinshasa': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  'Cabo Verde': 'Cape Verde',
  'Bosnia and Herzegovina': 'Bosnia',
  'Bosnia-Herzegovina': 'Bosnia',
  'Bosnia Herzegovina': 'Bosnia',
  'Trinidad and Tobago': 'Trinidad & Tobago'
};

function normalizeTeamName(name) {
  if (!name) return null;
  const trimmed = String(name).trim();
  if (TEAM_NAME_MAP[trimmed]) return TEAM_NAME_MAP[trimmed];
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(TEAM_NAME_MAP)) {
    if (key.toLowerCase() === lower) return val;
  }
  return trimmed;
}

// =============================================================================
// SCHEMA NORMALIZATION
// =============================================================================

function pick(obj, keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function normalizeGame(raw, sourceConfig) {
  if (!raw || typeof raw !== 'object') return null;

  if (sourceConfig.customNormalize) {
    const result = sourceConfig.customNormalize(raw);
    if (result) {
      result.home_team_name_en = normalizeTeamName(result.home_team_name_en);
      result.away_team_name_en = normalizeTeamName(result.away_team_name_en);
    }
    return result;
  }

  const fm = sourceConfig.fieldMap;
  const home = pick(raw, fm.homeTeam);
  const away = pick(raw, fm.awayTeam);
  const homeScore = pick(raw, fm.homeScore);
  const awayScore = pick(raw, fm.awayScore);
  const statusRaw = pick(raw, fm.status);

  if (!home || !away) return null;
  if (homeScore === undefined || awayScore === undefined) return null;

  const s = String(statusRaw || '').toLowerCase();
  const isFinished =
    s === 'true' ||
    s === 'finished' ||
    s === 'ft' ||
    s === 'full time' ||
    s === 'full_time' ||
    s.includes('finish');

  return {
    home_team_name_en: normalizeTeamName(String(home).trim()),
    away_team_name_en: normalizeTeamName(String(away).trim()),
    home_score: parseInt(homeScore, 10) || 0,
    away_score: parseInt(awayScore, 10) || 0,
    finished: isFinished,
    status: isFinished ? 'FINISHED' : (String(statusRaw || 'SCHEDULED').toUpperCase()),
    _source_timestamp: raw.timestamp || raw.date || raw.datetime || raw.match_time || null
  };
}

// =============================================================================
// NETWORK LAYER
// =============================================================================

function fetchJSON(urlString, headers = {}, attempt = 1) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        ...headers
      },
      timeout: REQUEST_TIMEOUT
    };

    const req = client.get(urlString, options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${e.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.on('error', (err) => reject(new Error(`Network: ${err.message}`)));
  });
}

async function fetchWithRetry(url, headers = {}) {
  let lastErr;
  for (let i = 0; i < MAX_RETRIES_PER_ENDPOINT; i++) {
    try {
      return await fetchJSON(url, headers);
    } catch (err) {
      lastErr = err;
      console.log(`   ↳ Retry ${i + 1}/${MAX_RETRIES_PER_ENDPOINT}: ${err.message}`);
      if (i < MAX_RETRIES_PER_ENDPOINT - 1) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

// =============================================================================
// SOURCE FETCHING
// =============================================================================

async function trySource(source) {
  console.log(`\n📡 Trying source: ${source.name}`);
  
  for (const endpoint of source.endpoints) {
    try {
      console.log(`   🔄 Endpoint: ${endpoint}`);
      const payload = await fetchWithRetry(endpoint, source.headers || {});
      
      let rawGames = source.unwrap(payload);
      if (!Array.isArray(rawGames)) {
        rawGames = (rawGames && typeof rawGames === 'object') ? [rawGames] : [];
      }
      
      const games = rawGames.map(g => normalizeGame(g, source)).filter(g => g !== null);
      
      if (games.length === 0) {
        throw new Error('No valid games after normalization');
      }
      
      console.log(`   ✅ SUCCESS: ${games.length} valid games from ${source.name}`);
      return { source: source.name, endpoint, games };
      
    } catch (err) {
      console.log(`   ❌ FAILED: ${endpoint} — ${err.message}`);
    }
  }
  
  throw new Error(`All endpoints for ${source.name} failed`);
}

// =============================================================================
// MERGE LOGIC: Combine results from multiple sources
// =============================================================================

function mergeGames(allResults) {
  const gameMap = new Map();
  
  for (const result of allResults) {
    for (const game of result.games) {
      const key = `${game.home_team_name_en} vs ${game.away_team_name_en}`;
      const existing = gameMap.get(key);
      
      if (!existing) {
        gameMap.set(key, { ...game, _sources: [result.source] });
      } else if (game.finished && !existing.finished) {
        gameMap.set(key, { ...game, _sources: [...existing._sources, result.source] });
      } else if (game.finished && existing.finished) {
        const newTime = new Date(game._source_timestamp || 0).getTime();
        const oldTime = new Date(existing._source_timestamp || 0).getTime();
        if (newTime > oldTime) {
          gameMap.set(key, { ...game, _sources: [...existing._sources, result.source] });
        }
      }
    }
  }
  
  return Array.from(gameMap.values());
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🏆 FIFA World Cup 2026 Live Scraper (Multi-Source v3.0)');
  console.log(`⏰ ${new Date().toISOString()}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = [];
  let lastError = null;
  
  for (const source of SOURCES) {
    try {
      const result = await trySource(source);
      results.push(result);
      console.log(`   📊 ${result.games.filter(g => g.finished).length} finished games found`);
    } catch (err) {
      lastError = err.message;
      console.log(`   ⚠️ Source ${source.name} failed: ${err.message}`);
    }
  }
  
  let games = [];
  let usedSources = [];
  
  if (results.length > 0) {
    games = mergeGames(results);
    usedSources = results.map(r => r.source);
    console.log(`\n🔄 Merged ${results.length} sources → ${games.length} unique games`);
  }
  
  const success = games.length > 0;
  const finishedGames = games.filter(g => g.finished).length;

  const output = {
    meta: {
      lastUpdated: new Date().toISOString(),
      sources: usedSources,
      primarySource: usedSources[0] || 'none',
      version: '3.0',
      totalGames: games.length,
      finishedGames,
      upcomingGames: games.length - finishedGames,
      success,
      error: success ? null : (lastError || 'All sources failed')
    },
    games: games.map(g => {
      const { _sources, ...clean } = g;
      return clean;
    })
  };

  fs.writeFileSync(TEMP_PATH, JSON.stringify(output, null, 2));
  fs.renameSync(TEMP_PATH, OUTPUT_PATH);

  if (success) {
    console.log(`\n💾 Saved → ${OUTPUT_PATH}`);
    console.log(`📊 Total: ${games.length} | ✅ Finished: ${finishedGames} | ⏳ Upcoming: ${games.length - finishedGames}`);
    console.log(`📡 Sources: ${usedSources.join(', ')}`);
    process.exit(0);
  } else {
    console.error(`\n⚠️ All sources failed. Last error: ${lastError}`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err);
  try {
    const emergency = {
      meta: {
        lastUpdated: new Date().toISOString(),
        sources: [],
        primarySource: 'crash',
        version: '3.0',
        totalGames: 0,
        finishedGames: 0,
        success: false,
        error: err.message
      },
      games: []
    };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(emergency, null, 2));
  } catch (e) { /* ignore */ }
  process.exit(0);
});
