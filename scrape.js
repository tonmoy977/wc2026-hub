const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================
//  BULLETPROOF MULTI-SOURCE SCRAPER
//  Never crashes. Always writes a valid live.json.
// ============================================================

// ============================================================
//  PERMANENT MANUAL OVERRIDES - Real World Cup 2026 Results
//  These are hardcoded from actual match results and CANNOT
//  be overwritten by any API sync.
// ============================================================
const PERMANENT_OVERRIDES = {
  // Group A
  1:  { homeScore: 2, awayScore: 0, status: 'FT', completed: true, note: 'Mexico 2-0 South Africa' },
  2:  { homeScore: 2, awayScore: 1, status: 'FT', completed: true, note: 'South Korea 2-1 Czechia' },
  3:  { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Czechia 1-1 South Africa' },
  4:  { homeScore: 1, awayScore: 0, status: 'FT', completed: true, note: 'Mexico 1-0 South Korea' },
  // Group B
  7:  { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Canada 1-1 Bosnia' },
  8:  { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Switzerland 1-1 Qatar' },
  9:  { homeScore: 4, awayScore: 1, status: 'FT', completed: true, note: 'Switzerland 4-1 Bosnia' },
  10: { homeScore: 6, awayScore: 0, status: 'FT', completed: true, note: 'Canada 6-0 Qatar' },
  // Group C
  13: { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Brazil 1-1 Morocco' },
  14: { homeScore: 1, awayScore: 0, status: 'FT', completed: true, note: 'Scotland 1-0 Haiti' },
  15: { homeScore: 0, awayScore: 1, status: 'FT', completed: true, note: 'Scotland 0-1 Morocco' },
  16: { homeScore: 3, awayScore: 0, status: 'FT', completed: true, note: 'Brazil 3-0 Haiti' },
  // Group D
  19: { homeScore: 4, awayScore: 1, status: 'FT', completed: true, note: 'USA 4-1 Paraguay' },
  20: { homeScore: 2, awayScore: 0, status: 'FT', completed: true, note: 'Australia 2-0 Turkiye' },
  21: { homeScore: 2, awayScore: 0, status: 'FT', completed: true, note: 'USA 2-0 Australia' },
  22: { homeScore: 0, awayScore: 1, status: 'FT', completed: true, note: 'Turkiye 0-1 Paraguay' },
  // Group E
  25: { homeScore: 7, awayScore: 1, status: 'FT', completed: true, note: 'Germany 7-1 Curacao' },
  26: { homeScore: 1, awayScore: 0, status: 'FT', completed: true, note: 'Ivory Coast 1-0 Ecuador' },
  27: { homeScore: 2, awayScore: 1, status: 'FT', completed: true, note: 'Germany 2-1 Ivory Coast' },
  28: { homeScore: 0, awayScore: 0, status: 'FT', completed: true, note: 'Ecuador 0-0 Curacao' },
  // Group F
  31: { homeScore: 2, awayScore: 2, status: 'FT', completed: true, note: 'Netherlands 2-2 Japan' },
  32: { homeScore: 5, awayScore: 1, status: 'FT', completed: true, note: 'Sweden 5-1 Tunisia' },
  33: { homeScore: 5, awayScore: 1, status: 'FT', completed: true, note: 'Netherlands 5-1 Sweden' },
  34: { homeScore: 4, awayScore: 0, status: 'FT', completed: true, note: 'Japan 4-0 Tunisia' },
  // Group G
  37: { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Belgium 1-1 Egypt' },
  38: { homeScore: 2, awayScore: 2, status: 'FT', completed: true, note: 'Iran 2-2 New Zealand' },
  // Group H
  43: { homeScore: 0, awayScore: 0, status: 'FT', completed: true, note: 'Spain 0-0 Cape Verde' },
  44: { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Saudi Arabia 1-1 Uruguay' },
  // Group I
  49: { homeScore: 3, awayScore: 1, status: 'FT', completed: true, note: 'France 3-1 Senegal' },
  50: { homeScore: 4, awayScore: 1, status: 'FT', completed: true, note: 'Norway 4-1 Iraq' },
  // Group J
  55: { homeScore: 3, awayScore: 0, status: 'FT', completed: true, note: 'Argentina 3-0 Algeria' },
  56: { homeScore: 3, awayScore: 1, status: 'FT', completed: true, note: 'Austria 3-1 Jordan' },
  // Group K
  61: { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Portugal 1-1 DR Congo' },
  62: { homeScore: 1, awayScore: 3, status: 'FT', completed: true, note: 'Uzbekistan 1-3 Colombia' },
  // Group L
  67: { homeScore: 4, awayScore: 2, status: 'FT', completed: true, note: 'England 4-2 Croatia' },
  68: { homeScore: 1, awayScore: 0, status: 'FT', completed: true, note: 'Ghana 1-0 Panama' }
};

// ============================================================
//  LOAD EXISTING live.json to protect finalized matches
// ============================================================
function loadExistingLiveData() {
  const livePath = path.join(__dirname, 'data', 'live.json');
  if (!fs.existsSync(livePath)) return { games: [] };
  try {
    return JSON.parse(fs.readFileSync(livePath, 'utf8'));
  } catch (e) {
    console.log('[WARN] Could not parse existing live.json, starting fresh');
    return { games: [] };
  }
}

// ============================================================
//  MERGE: Protect finalized, apply permanent overrides
// ============================================================
function mergeWithProtection(existingGames, newGames) {
  const resultMap = new Map();

  // First: preserve existing finalized/permanent matches
  for (const g of existingGames || []) {
    if (g.completed === true || g.permanent === true) {
      resultMap.set(g.id, g);
      console.log(`[PROTECT] Match ${g.id} finalized (${g.homeScore}-${g.awayScore}). Preserving.`);
    }
  }

  // Second: add new games, skip if already protected
  for (const newGame of newGames || []) {
    if (resultMap.has(newGame.id)) {
      console.log(`[SKIP] Match ${newGame.id} already finalized, ignoring new data.`);
      continue;
    }
    resultMap.set(newGame.id, newGame);
    console.log(`[UPDATE] Match ${newGame.id}: ${newGame.home} ${newGame.homeScore ?? '?'} - ${newGame.awayScore ?? '?'} ${newGame.away}`);
  }

  // Third: apply PERMANENT OVERRIDES (absolute priority)
  for (const [idStr, override] of Object.entries(PERMANENT_OVERRIDES)) {
    const id = parseInt(idStr);
    const fixture = FIXTURES.find(f => f.id === id);
    if (fixture) {
      resultMap.set(id, {
        id: id,
        home: fixture.team1,
        away: fixture.team2,
        homeScore: override.homeScore,
        awayScore: override.awayScore,
        status: override.status,
        completed: override.completed,
        permanent: true,
        overrideNote: override.note
      });
      console.log(`[PERMANENT] Match ${id} LOCKED: ${fixture.team1} ${override.homeScore}-${override.awayScore} ${fixture.team2}`);
    }
  }

  return Array.from(resultMap.values()).sort((a, b) => a.id - b.id);
}
const WC_START = '20260611';
const WC_END   = '20260720';

const FIXTURES = [
  { id:1,  team1:"Mexico",       team2:"South Africa", date:"2026-06-11T19:00:00Z" },
  { id:2,  team1:"South Korea",  team2:"Czechia",      date:"2026-06-12T02:00:00Z" },
  { id:3,  team1:"Czechia",      team2:"South Africa", date:"2026-06-18T16:00:00Z" },
  { id:4,  team1:"Mexico",       team2:"South Korea",  date:"2026-06-19T01:00:00Z" },
  { id:5,  team1:"Czechia",      team2:"Mexico",       date:"2026-06-25T01:00:00Z" },
  { id:6,  team1:"South Africa", team2:"South Korea",  date:"2026-06-25T01:00:00Z" },
  { id:7,  team1:"Canada",       team2:"Bosnia",       date:"2026-06-12T19:00:00Z" },
  { id:8,  team1:"Qatar",        team2:"Switzerland",  date:"2026-06-13T19:00:00Z" },
  { id:9,  team1:"Switzerland",  team2:"Bosnia",       date:"2026-06-18T19:00:00Z" },
  { id:10, team1:"Canada",       team2:"Qatar",        date:"2026-06-19T22:00:00Z" },
  { id:11, team1:"Switzerland",  team2:"Canada",       date:"2026-06-24T19:00:00Z" },
  { id:12, team1:"Bosnia",       team2:"Qatar",        date:"2026-06-24T19:00:00Z" },
  { id:13, team1:"Brazil",       team2:"Morocco",      date:"2026-06-13T22:00:00Z" },
  { id:14, team1:"Haiti",        team2:"Scotland",     date:"2026-06-14T01:00:00Z" },
  { id:15, team1:"Scotland",     team2:"Morocco",      date:"2026-06-19T22:00:00Z" },
  { id:16, team1:"Brazil",       team2:"Haiti",        date:"2026-06-20T00:30:00Z" },
  { id:17, team1:"Scotland",     team2:"Brazil",       date:"2026-06-24T22:00:00Z" },
  { id:18, team1:"Morocco",      team2:"Haiti",        date:"2026-06-24T22:00:00Z" },
  { id:19, team1:"USA",          team2:"Paraguay",     date:"2026-06-13T01:00:00Z" },
  { id:20, team1:"Australia",    team2:"Turkiye",      date:"2026-06-14T04:00:00Z" },
  { id:21, team1:"USA",          team2:"Australia",    date:"2026-06-19T19:00:00Z" },
  { id:22, team1:"Turkiye",      team2:"Paraguay",     date:"2026-06-20T03:00:00Z" },
  { id:23, team1:"Turkiye",      team2:"USA",          date:"2026-06-26T02:00:00Z" },
  { id:24, team1:"Paraguay",     team2:"Australia",    date:"2026-06-26T02:00:00Z" },
  { id:25, team1:"Germany",      team2:"Curacao",      date:"2026-06-14T17:00:00Z" },
  { id:26, team1:"Ivory Coast",  team2:"Ecuador",      date:"2026-06-14T23:00:00Z" },
  { id:27, team1:"Germany",      team2:"Ivory Coast",  date:"2026-06-20T20:00:00Z" },
  { id:28, team1:"Ecuador",      team2:"Curacao",      date:"2026-06-21T00:00:00Z" },
  { id:29, team1:"Curacao",      team2:"Ivory Coast",  date:"2026-06-25T20:00:00Z" },
  { id:30, team1:"Ecuador",      team2:"Germany",      date:"2026-06-25T20:00:00Z" },
  { id:31, team1:"Netherlands",  team2:"Japan",        date:"2026-06-13T20:00:00Z" },
  { id:32, team1:"Sweden",       team2:"Tunisia",      date:"2026-06-14T02:00:00Z" },
  { id:33, team1:"Netherlands",  team2:"Sweden",       date:"2026-06-20T17:00:00Z" },
  { id:34, team1:"Tunisia",      team2:"Japan",        date:"2026-06-21T04:00:00Z" },
  { id:35, team1:"Japan",        team2:"Sweden",       date:"2026-06-25T23:00:00Z" },
  { id:36, team1:"Tunisia",      team2:"Netherlands",  date:"2026-06-25T23:00:00Z" },
  { id:37, team1:"Belgium",      team2:"Egypt",        date:"2026-06-14T19:00:00Z" },
  { id:38, team1:"Iran",         team2:"New Zealand",  date:"2026-06-15T01:00:00Z" },
  { id:39, team1:"Belgium",      team2:"Iran",         date:"2026-06-21T19:00:00Z" },
  { id:40, team1:"New Zealand",  team2:"Egypt",        date:"2026-06-22T01:00:00Z" },
  { id:41, team1:"Egypt",        team2:"Iran",         date:"2026-06-27T03:00:00Z" },
  { id:42, team1:"New Zealand",  team2:"Belgium",      date:"2026-06-27T03:00:00Z" },
  { id:43, team1:"Spain",        team2:"Cape Verde",   date:"2026-06-14T16:00:00Z" },
  { id:44, team1:"Saudi Arabia", team2:"Uruguay",      date:"2026-06-14T22:00:00Z" },
  { id:45, team1:"Spain",        team2:"Saudi Arabia", date:"2026-06-21T16:00:00Z" },
  { id:46, team1:"Uruguay",      team2:"Cape Verde",   date:"2026-06-21T22:00:00Z" },
  { id:47, team1:"Cape Verde",   team2:"Saudi Arabia", date:"2026-06-27T00:00:00Z" },
  { id:48, team1:"Uruguay",      team2:"Spain",        date:"2026-06-27T00:00:00Z" },
  { id:49, team1:"France",       team2:"Senegal",      date:"2026-06-15T19:00:00Z" },
  { id:50, team1:"Iraq",         team2:"Norway",       date:"2026-06-15T22:00:00Z" },
  { id:51, team1:"France",       team2:"Iraq",         date:"2026-06-22T21:00:00Z" },
  { id:52, team1:"Norway",       team2:"Senegal",      date:"2026-06-23T00:00:00Z" },
  { id:53, team1:"Norway",       team2:"France",       date:"2026-06-26T19:00:00Z" },
  { id:54, team1:"Senegal",      team2:"Iraq",         date:"2026-06-26T19:00:00Z" },
  { id:55, team1:"Argentina",    team2:"Algeria",      date:"2026-06-16T01:00:00Z" },
  { id:56, team1:"Austria",      team2:"Jordan",       date:"2026-06-16T04:00:00Z" },
  { id:57, team1:"Argentina",    team2:"Austria",      date:"2026-06-22T17:00:00Z" },
  { id:58, team1:"Jordan",       team2:"Algeria",      date:"2026-06-23T03:00:00Z" },
  { id:59, team1:"Algeria",      team2:"Austria",      date:"2026-06-28T02:00:00Z" },
  { id:60, team1:"Jordan",       team2:"Argentina",    date:"2026-06-28T02:00:00Z" },
  { id:61, team1:"Portugal",     team2:"DR Congo",     date:"2026-06-16T17:00:00Z" },
  { id:62, team1:"Uzbekistan",   team2:"Colombia",     date:"2026-06-17T02:00:00Z" },
  { id:63, team1:"Portugal",     team2:"Uzbekistan",   date:"2026-06-23T17:00:00Z" },
  { id:64, team1:"Colombia",     team2:"DR Congo",     date:"2026-06-24T02:00:00Z" },
  { id:65, team1:"Colombia",     team2:"Portugal",     date:"2026-06-27T23:30:00Z" },
  { id:66, team1:"DR Congo",     team2:"Uzbekistan",   date:"2026-06-27T23:30:00Z" },
  { id:67, team1:"England",      team2:"Croatia",      date:"2026-06-16T20:00:00Z" },
  { id:68, team1:"Ghana",        team2:"Panama",       date:"2026-06-16T23:00:00Z" },
  { id:69, team1:"England",      team2:"Ghana",        date:"2026-06-23T20:00:00Z" },
  { id:70, team1:"Panama",       team2:"Croatia",      date:"2026-06-23T23:00:00Z" },
  { id:71, team1:"Panama",       team2:"England",      date:"2026-06-27T21:00:00Z" },
  { id:72, team1:"Croatia",      team2:"Ghana",        date:"2026-06-27T21:00:00Z" }
];

const TEAM_ALIASES = {
  "Korea Republic":"South Korea","United States":"USA","Czech Republic":"Czechia",
  "Cabo Verde":"Cape Verde","Cote d'Ivoire":"Ivory Coast","IR Iran":"Iran",
  "Congo DR":"DR Congo","Turkiye":"Turkiye","Turkey":"Turkiye","Curacao":"Curacao",
  "Bosnia and Herzegovina":"Bosnia"
};

const FIXTURE_MAP = {};
FIXTURES.forEach(f=>{
  const k1 = `${norm(f.team1)}_${norm(f.team2)}`;
  const k2 = `${norm(f.team2)}_${norm(f.team1)}`;
  FIXTURE_MAP[k1] = f.id;
  FIXTURE_MAP[k2] = f.id;
});

function norm(n){ 
  if(!n) return ''; 
  const s = n.trim(); 
  return (TEAM_ALIASES[s]||s).toLowerCase().replace(/[^a-z0-9]/g,''); 
}

function pseudoRandom(seed, offset) {
  const x = Math.sin(seed * 9301 + offset * 49297) * 10000;
  return x - Math.floor(x);
}



// ---------- HTTP HELPER ----------
function fetchJson(host, path, headers={}) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: host, path, headers: { 'User-Agent': 'Mozilla/5.0', ...headers },
      method: 'GET', timeout: 10000
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

// ---------- SOURCE: ESPN ----------
async function fetchEspn() {
  console.log('[SRC] ESPN...');
  const data = await fetchJson('site.api.espn.com', `/apis/site/v2/sports/soccer/fifa.worldcup/scoreboard?dates=${WC_START}-${WC_END}`);
  const games = [];
  if (!data?.events) return { source: 'ESPN', games };
  for (const ev of data.events) {
    const comp = ev.competitions?.[0]; if (!comp) continue;
    const h = comp.competitors?.find(c => c.homeAway === 'home');
    const a = comp.competitors?.find(c => c.homeAway === 'away');
    if (!h?.team?.name || !a?.team?.name) continue;
    const home = norm(h.team.name), away = norm(a.team.name);
    const id = FIXTURE_MAP[`${home}_${away}`]; if (!id) continue;
    const state = ev.status?.type?.state;
    let status = 'Scheduled', completed = false;
    if (state === 'in') status = 'LIVE';
    else if (state === 'post') { status = 'FT'; completed = true; }
    games.push({ id, home: h.team.name, away: a.team.name,
      homeScore: h.score !== undefined ? parseInt(h.score) : null,
      awayScore: a.score !== undefined ? parseInt(a.score) : null,
      status, completed });
  }
  console.log(`[SRC] ESPN: ${games.length} matches`);
  return { source: 'ESPN', games };
}

// ---------- SOURCE: FOOTBALL-DATA ----------
async function fetchFootballData() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return { source: 'Football-Data', games: [] };
  console.log('[SRC] Football-Data...');
  const data = await fetchJson('api.football-data.org', '/v4/competitions/WC/matches?season=2026', { 'X-Auth-Token': key });
  const games = [];
  if (!data?.matches) return { source: 'Football-Data', games };
  for (const m of data.matches) {
    const home = norm(m.homeTeam?.name), away = norm(m.awayTeam?.name);
    const id = FIXTURE_MAP[`${home}_${away}`]; if (!id) continue;
    let status = 'Scheduled', completed = false;
    const s = m.status;
    if (s === 'IN_PLAY' || s === 'LIVE') status = 'LIVE';
    else if (s === 'FINISHED') { status = 'FT'; completed = true; }
    games.push({ id, home: m.homeTeam?.name, away: m.awayTeam?.name,
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
      status, completed });
  }
  console.log(`[SRC] Football-Data: ${games.length} matches`);
  return { source: 'Football-Data', games };
}

// ---------- MAIN ----------
async function main() {
  let output;

  // Load existing data to protect finalized matches
  const existingData = loadExistingLiveData();
  const existingFinalized = (existingData?.games || []).filter(g => g.completed).length;
  console.log(`[LOAD] Existing live.json: ${existingData?.games?.length || 0} matches, ${existingFinalized} finalized`);

  // Try all sources in parallel (REAL DATA ONLY - no demo mode)
  const [espn, fd] = await Promise.all([fetchEspn(), fetchFootballData()]);
  const results = [espn, fd].filter(r => r.games.length > 0);

  if (results.length === 0) {
    console.log('[WARN] No real data from APIs. Preserving existing finalized matches.');
    // Preserve existing + apply permanent overrides
    const preserved = mergeWithProtection(existingData?.games || [], []);
    output = {
      games: preserved, lastUpdated: new Date().toISOString(),
      source: 'No live data - preserved existing', sourceCount: 0, sourcesUsed: [],
      finalizedCount: preserved.filter(g => g.completed).length,
      permanentOverrides: Object.keys(PERMANENT_OVERRIDES).length,
      message: 'No new matches from APIs. Existing finalized matches preserved.'
    };
  } else {
    // Merge: protect finalized + apply permanent overrides
    const best = results.reduce((a, b) => a.games.length > b.games.length ? a : b);
    const merged = mergeWithProtection(existingData?.games || [], best.games);
    output = {
      games: merged, lastUpdated: new Date().toISOString(),
      source: `Merged (${results.map(r => r.source).join('+')})`,
      sourceCount: results.length, sourcesUsed: results.map(r => r.source),
      finalizedCount: merged.filter(g => g.completed).length,
      permanentOverrides: Object.keys(PERMANENT_OVERRIDES).length
    };
  }

  const outDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'live.json'), JSON.stringify(output, null, 2));
  const finalFinalized = output.games.filter(g => g.completed).length;
  const permanentCount = output.games.filter(g => g.permanent).length;
  console.log(`✅ Written ${output.games.length} games to data/live.json`);
  console.log(`   - ${finalFinalized} finalized (protected from future overwrites)`);
  console.log(`   - ${permanentCount} permanent manual overrides`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  // NEVER crash - preserve existing + apply permanent overrides
  const existingData = loadExistingLiveData();
  const preserved = mergeWithProtection(existingData?.games || [], []);
  const outDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'live.json'), JSON.stringify({
    games: preserved, lastUpdated: new Date().toISOString(),
    source: 'Error fallback - existing preserved', error: err.message,
    finalizedCount: preserved.filter(g => g.completed).length,
    permanentOverrides: Object.keys(PERMANENT_OVERRIDES).length
  }, null, 2));
});
