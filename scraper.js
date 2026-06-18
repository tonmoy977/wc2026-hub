const fs = require('fs');
const https = require('https');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, 'data', 'live.json');

// Multiple fallback sources
const SOURCES = [
  // Direct source (if accessible)
  'https://worldcup26.ir/get/games',
  // CORS proxies
  'https://corsproxy.io/?https://worldcup26.ir/get/games',
  'https://api.allorigins.win/raw?url=https://worldcup26.ir/get/games',
  // Alternative sources
  'https://raw.githubusercontent.com/openfootball/world-cup.json/master/2026/worldcup.json',
  // Backup - ESPN API (if available)
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.worldcup/scoreboard'
];

// Ensure directory exists
if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000
    }, (res) => {
      // Follow redirects (status 301, 302, 303, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJSON(res.headers.location).then(resolve).catch(reject);
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Invalid JSON: ${data.substring(0, 100)}...`));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.on('error', reject);
  });
}

function extractGames(data) {
  // Handle different response formats
  if (data.games && Array.isArray(data.games)) return data.games;
  if (data.matches && Array.isArray(data.matches)) return data.matches;
  if (data.fixtures && Array.isArray(data.fixtures)) return data.fixtures;
  if (data.response && Array.isArray(data.response)) return data.response;
  if (data.events && Array.isArray(data.events)) return data.events;
  if (Array.isArray(data)) return data;
  
  // Try to find any array in the response
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key]) && data[key].length > 0) {
      return data[key];
    }
  }
  
  return [];
}

function normalizeGame(game) {
  // Extract team names from various fields
  const homeNames = [
    game.home_team_name_en,
    game.homeTeam,
    game.home_team,
    game.home,
    game.team1,
    game.homeName,
    game.home_team?.name,
    game.homeTeam?.name,
    game.teams?.home?.name
  ].filter(Boolean).map(String);

  const awayNames = [
    game.away_team_name_en,
    game.awayTeam,
    game.away_team,
    game.away,
    game.team2,
    game.awayName,
    game.away_team?.name,
    game.awayTeam?.name,
    game.teams?.away?.name
  ].filter(Boolean).map(String);

  // Extract scores
  const score1 = parseInt(
    game.home_score || game.homeScore || game.score1 || game.intHomeScore || 
    game.scores?.home || game.scores?.team1 || game.goals?.home || 0
  ) || 0;

  const score2 = parseInt(
    game.away_score || game.awayScore || game.score2 || game.intAwayScore ||
    game.scores?.away || game.scores?.team2 || game.goals?.away || 0
  ) || 0;

  // Check if match is completed
  const completed = 
    game.completed === true || 
    game.finished === true ||
    game.status === 'FINISHED' ||
    game.status === 'FT' ||
    game.status === 'Full Time' ||
    (game.status && typeof game.status === 'string' && game.status.toLowerCase().includes('finished'));

  return {
    home: homeNames[0] || 'Unknown Home',
    away: awayNames[0] || 'Unknown Away',
    homeScore: score1,
    awayScore: score2,
    completed: completed || false,
    status: game.status || (completed ? 'FT' : 'Scheduled'),
    id: game.id || game.match_id || game.fixture_id || game._id || Date.now()
  };
}

async function main() {
  console.log('🔄 Starting live score scraper...');
  
  let lastError = '';
  
  for (const url of SOURCES) {
    try {
      console.log(`📡 Fetching: ${url}`);
      const data = await fetchJSON(url);
      const rawGames = extractGames(data);
      
      if (!rawGames || rawGames.length === 0) {
        throw new Error('No games found in response');
      }

      // Normalize all games
      const normalizedGames = rawGames
        .filter(game => game && typeof game === 'object' && !game.error)
        .map(normalizeGame)
        .filter(game => game.home && game.away && game.home !== game.away);

      if (normalizedGames.length === 0) {
        throw new Error('No valid games after normalization');
      }

      // Write to file
      const output = {
        games: normalizedGames,
        lastUpdated: new Date().toISOString(),
        source: url,
        totalMatches: normalizedGames.length
      };

      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
      
      console.log(`✅ SUCCESS! Saved ${normalizedGames.length} matches`);
      console.log(`📁 Output: ${OUTPUT_PATH}`);
      
      // Display sample match
      if (normalizedGames.length > 0) {
        const sample = normalizedGames[0];
        console.log(`📊 Sample: ${sample.home} ${sample.homeScore} - ${sample.awayScore} ${sample.away} (${sample.status})`);
      }
      
      process.exit(0);
      
    } catch (error) {
      lastError = error.message;
      console.log(`❌ Failed: ${url} - ${error.message}`);
      
      // If this was a CORS proxy error, try the next one
      if (error.message.includes('CORS')) {
        console.log('🔄 CORS error detected, trying next source...');
        continue;
      }
    }
  }

  // All sources failed
  console.error('❌ All sources failed. Last error:', lastError);
  
  // Write fallback data
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
    games: [
      {
        home: 'Portugal',
        away: 'DR Congo',
        homeScore: null,
        awayScore: null,
        completed: false,
        status: 'Scheduled',
        id: 61
      }
    ],
    lastUpdated: new Date().toISOString(),
    error: lastError,
    source: 'fallback'
  }, null, 2));
  
  console.log('📁 Created fallback data');
  process.exit(0);
}

// Run the scraper
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(0); // Always exit cleanly
});
