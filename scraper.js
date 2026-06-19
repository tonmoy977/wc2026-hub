const fs = require('fs');
const https = require('https');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, 'data', 'live.json');

// ESPN public API (powers ESPN.com, no auth required)
// Fallback: upbound-web openfootball fork (raw JSON, no auth)
const SOURCES = [
  {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.worldcup/scoreboard',
    type: 'espn'
  },
  {
    url: 'https://raw.githubusercontent.com/upbound-web/worldcup-live.json/master/2026/worldcup.json',
    type: 'openfootball'
  }
];

// Map real API names to your app names
const TEAM_MAP = {
  "Korea Republic": "South Korea",
  "Czech Republic": "Czechia",
  "United States": "USA",
  "Turkiye": "Türkiye",
  "Curacao": "Curaçao",
  "Cote d'Ivoire": "Ivory Coast",
  "IR Iran": "Iran",
  "Congo DR": "DR Congo",
  "Cabo Verde": "Cape Verde",
  "Bosnia and Herzegovina": "Bosnia"
};

function mapTeam(name) {
  if (!name) return null;
  return TEAM_MAP[name] || name;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 15000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJSON(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON')); }
      });
    }).on('timeout', () => reject(new Error('Timeout')))
      .on('error', reject);
  });
}

// Parse ESPN format
function extractESPN(data) {
  const events = data?.events || [];
  const games = [];
  for (const ev of events) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;
    const competitors = comp.competitors || [];
    const home = competitors.find(c => c.homeAway === 'home');
    const away = competitors.find(c => c.homeAway === 'away');
    if (!home?.team?.name || !away?.team?.name) continue;

    const statusName = ev.status?.type?.name || '';
    const isDone = statusName === 'STATUS_FINAL' || statusName === 'STATUS_FULL_TIME';
    const shortDetail = ev.status?.type?.shortDetail || '';

    const homeName = mapTeam(home.team.name);
    const awayName = mapTeam(away.team.name);

    games.push({
      id: parseInt(ev.id, 10) || 0,
      home: homeName,
      away: awayName,
      homeScore: home.score ? parseInt(home.score, 10) : 0,
      awayScore: away.score ? parseInt(away.score, 10) : 0,
      completed: isDone,
      status: isDone ? 'FT' : shortDetail
    });
  }
  return games;
}

// Parse openfootball/upbound-web format
function extractOpenfootball(data) {
  const rounds = data?.rounds || [];
  const games = [];
  for (const round of rounds) {
    for (const m of (round.matches || [])) {
      const score1 = m.score1 !== undefined ? parseInt(m.score1, 10) : null;
      const score2 = m.score2 !== undefined ? parseInt(m.score2, 10) : null;
      const finished = score1 !== null && score2 !== null;
      const homeName = mapTeam(m.team1?.name);
      const awayName = mapTeam(m.team2?.name);
      if (!homeName || !awayName) continue;

      games.push({
        id: parseInt(m.num, 10) || 0,
        home: homeName,
        away: awayName,
        homeScore: finished ? score1 : 0,
        awayScore: finished ? score2 : 0,
        completed: finished,
        status: finished ? 'FT' : 'Scheduled'
      });
    }
  }
  return games;
}

async function main() {
  console.log('🔄 Fetching live results...');
  let lastError = '';

  for (const source of SOURCES) {
    try {
      console.log(`📡 Trying: ${source.url}`);
      const data = await fetchJSON(source.url);

      let games = [];
      if (source.type === 'espn') {
        games = extractESPN(data);
      } else {
        games = extractOpenfootball(data);
      }

      if (games.length === 0) throw new Error('No games found');

      const output = {
        games,
        lastUpdated: new Date().toISOString(),
        source: source.url,
        totalMatches: games.length
      };

      if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
        fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
      }
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

      console.log(`✅ Saved ${games.length} matches from ${source.type}`);
      const sample = games.find(g => g.completed) || games[0];
      if (sample) {
        console.log(`📊 Sample: ${sample.home} ${sample.homeScore} - ${sample.awayScore} ${sample.away} (${sample.status})`);
      }
      process.exit(0);

    } catch (err) {
      lastError = err.message;
      console.log(`❌ Failed: ${source.url} - ${err.message}`);
    }
  }

  console.error('❌ All sources failed:', lastError);
  process.exit(1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
