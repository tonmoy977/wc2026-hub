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

// Endpoints: direct first (unlikely to work due to CORS, but worth trying), then proxies
const ENDPOINTS = [
  'https://worldcup26.ir/get/games',
  'https://corsproxy.io/?https://worldcup26.ir/get/games',
  'https://api.allorigins.win/raw?url=https://worldcup26.ir/get/games',
  'https://api.codetabs.com/v1/proxy?quest=https://worldcup26.ir/get/games'
];

const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES_PER_ENDPOINT = 2;

// =============================================================================
// SCHEMA NORMALIZATION
// =============================================================================
// Your frontend (fetchOnlineResults) expects these exact field names:
//   home_team_name_en, away_team_name_en, home_score, away_score,
//   finished/time_elapsed/status
// We normalize whatever the source sends into this standard format.

const ALIASES = {
  homeTeam: ['home_team_name_en', 'homeTeam', 'home_team', 'home', 'team1', 'homeName'],
  awayTeam: ['away_team_name_en', 'awayTeam', 'away_team', 'away', 'team2', 'awayName'],
  homeScore: ['home_score', 'homeScore', 'score1', 'home_score_fulltime'],
  awayScore: ['away_score', 'awayScore', 'score2', 'away_score_fulltime'],
  status: ['finished', 'time_elapsed', 'status', 'match_status', 'state']
};

function pick(obj, keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function normalizeGame(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const home = pick(raw, ALIASES.homeTeam);
  const away = pick(raw, ALIASES.awayTeam);
  const homeScore = pick(raw, ALIASES.homeScore);
  const awayScore = pick(raw, ALIASES.awayScore);
  const statusRaw = pick(raw, ALIASES.status);

  // Hard validation: must have identifiable teams and numeric scores
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
    home_team_name_en: String(home).trim(),
    away_team_name_en: String(away).trim(),
    home_score: parseInt(homeScore, 10) || 0,
    away_score: parseInt(awayScore, 10) || 0,
    finished: isFinished,
    status: isFinished ? 'FINISHED' : (String(statusRaw || 'SCHEDULED').toUpperCase()),
    // Preserve any extra metadata the source provides
    _source_timestamp: raw.timestamp || raw.date || raw.datetime || raw.match_time || null
  };
}

// =============================================================================
// NETWORK LAYER
// =============================================================================

function fetchJSON(urlString, attempt = 1) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.get(urlString, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://worldcup26.ir/'
      },
      timeout: REQUEST_TIMEOUT
    }, (res) => {
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

async function fetchWithRetry(url) {
  let lastErr;
  for (let i = 0; i < MAX_RETRIES_PER_ENDPOINT; i++) {
    try {
      return await fetchJSON(url);
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
// MAIN
// =============================================================================

async function main() {
  console.log('🏆 FIFA World Cup 2026 Live Scraper');
  console.log(`⏰ ${new Date().toISOString()}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let success = false;
  let usedSource = null;
  let lastError = null;
  let games = [];

  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`\n🔄 Trying: ${endpoint}`);
      const payload = await fetchWithRetry(endpoint);

      // Unwrap various API shapes
      let rawGames = payload.games || payload.matches || payload.fixtures ||
                     payload.response || payload.data || payload;
      if (!Array.isArray(rawGames)) {
        rawGames = (rawGames && typeof rawGames === 'object') ? [rawGames] : [];
      }

      // Normalize & validate
      games = rawGames.map(normalizeGame).filter(g => g !== null);

      if (games.length === 0) {
        throw new Error('No valid games after normalization');
      }

      usedSource = endpoint;
      success = true;
      console.log(`✅ SUCCESS: ${games.length} valid games`);
      break;
    } catch (err) {
      lastError = err.message;
      console.log(`❌ FAILED: ${endpoint} — ${err.message}`);
    }
  }

  // Build output
  const output = {
    meta: {
      lastUpdated: new Date().toISOString(),
      source: usedSource || 'none',
      version: '2.0',
      totalGames: games.length,
      finishedGames: games.filter(g => g.finished).length,
      success,
      error: success ? null : lastError
    },
    games
  };

  // Atomic write: temp file then rename
  fs.writeFileSync(TEMP_PATH, JSON.stringify(output, null, 2));
  fs.renameSync(TEMP_PATH, OUTPUT_PATH);

  if (success) {
    console.log(`\n💾 Saved → ${OUTPUT_PATH}`);
    console.log(`📊 Total: ${games.length} | ✅ Finished: ${output.meta.finishedGames} | ⏳ Upcoming: ${games.length - output.meta.finishedGames}`);
    process.exit(0);
  } else {
    console.error(`\n⚠️ All sources failed. Last error: ${lastError}`);
    console.log(`📁 Wrote empty/placeholder file so the frontend never gets a 404`);
    process.exit(0);
  }
}

// Crash safety: even if main() throws, write a valid JSON file
main().catch((err) => {
  console.error('💥 Unhandled error:', err);
  try {
    const emergency = {
      meta: {
        lastUpdated: new Date().toISOString(),
        source: 'crash',
        version: '2.0',
        totalGames: 0,
        success: false,
        error: err.message
      },
      games: []
    };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(emergency, null, 2));
  } catch (e) { /* ignore */ }
  process.exit(0);
});
