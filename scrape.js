const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================
//  BULLETPROOF MULTI-SOURCE SCRAPER - WC 2026 FULL (104 MATCHES)
//  Includes Group Stage (1-72) + Knockout Stage (73-104)
//  Never crashes. Always writes a valid live.json.
// ============================================================

// ============================================================
//  PERMANENT MANUAL OVERRIDES - Real World Cup 2026 Results
//  These are hardcoded from actual match results and CANNOT
//  be overwritten by any API sync.
// ============================================================
const PERMANENT_OVERRIDES = {
  // ===== GROUP A (1-6) =====
  1:  { homeScore: 2, awayScore: 0, status: 'FT', completed: true, note: 'Mexico 2-0 South Africa' },
  2:  { homeScore: 2, awayScore: 1, status: 'FT', completed: true, note: 'South Korea 2-1 Czechia' },
  3:  { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Czechia 1-1 South Africa' },
  4:  { homeScore: 1, awayScore: 0, status: 'FT', completed: true, note: 'Mexico 1-0 South Korea' },
  // 5,6 pending
  // ===== GROUP B (7-12) =====
  7:  { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Canada 1-1 Bosnia' },
  8:  { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Switzerland 1-1 Qatar' },
  9:  { homeScore: 4, awayScore: 1, status: 'FT', completed: true, note: 'Switzerland 4-1 Bosnia' },
  10: { homeScore: 6, awayScore: 0, status: 'FT', completed: true, note: 'Canada 6-0 Qatar' },
  // 11,12 pending
  // ===== GROUP C (13-18) =====
  13: { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Brazil 1-1 Morocco' },
  14: { homeScore: 1, awayScore: 0, status: 'FT', completed: true, note: 'Scotland 1-0 Haiti' },
  15: { homeScore: 0, awayScore: 1, status: 'FT', completed: true, note: 'Scotland 0-1 Morocco' },
  16: { homeScore: 3, awayScore: 0, status: 'FT', completed: true, note: 'Brazil 3-0 Haiti' },
  // 17,18 pending
  // ===== GROUP D (19-24) =====
  19: { homeScore: 4, awayScore: 1, status: 'FT', completed: true, note: 'USA 4-1 Paraguay' },
  20: { homeScore: 2, awayScore: 0, status: 'FT', completed: true, note: 'Australia 2-0 Turkiye' },
  21: { homeScore: 2, awayScore: 0, status: 'FT', completed: true, note: 'USA 2-0 Australia' },
  22: { homeScore: 0, awayScore: 1, status: 'FT', completed: true, note: 'Turkiye 0-1 Paraguay' },
  // 23,24 pending
  // ===== GROUP E (25-30) =====
  25: { homeScore: 7, awayScore: 1, status: 'FT', completed: true, note: 'Germany 7-1 Curacao' },
  26: { homeScore: 1, awayScore: 0, status: 'FT', completed: true, note: 'Ivory Coast 1-0 Ecuador' },
  27: { homeScore: 2, awayScore: 1, status: 'FT', completed: true, note: 'Germany 2-1 Ivory Coast' },
  28: { homeScore: 0, awayScore: 0, status: 'FT', completed: true, note: 'Ecuador 0-0 Curacao' },
  // 29,30 pending
  // ===== GROUP F (31-36) =====
  31: { homeScore: 2, awayScore: 2, status: 'FT', completed: true, note: 'Netherlands 2-2 Japan' },
  32: { homeScore: 5, awayScore: 1, status: 'FT', completed: true, note: 'Sweden 5-1 Tunisia' },
  33: { homeScore: 5, awayScore: 1, status: 'FT', completed: true, note: 'Netherlands 5-1 Sweden' },
  34: { homeScore: 4, awayScore: 0, status: 'FT', completed: true, note: 'Japan 4-0 Tunisia' },
  // 35,36 pending
  // ===== GROUP G (37-42) =====
  37: { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Belgium 1-1 Egypt' },
  38: { homeScore: 2, awayScore: 2, status: 'FT', completed: true, note: 'Iran 2-2 New Zealand' },
  // 39-42 pending
  // ===== GROUP H (43-48) =====
  43: { homeScore: 0, awayScore: 0, status: 'FT', completed: true, note: 'Spain 0-0 Cape Verde' },
  44: { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Saudi Arabia 1-1 Uruguay' },
  // 45-48 pending
  // ===== GROUP I (49-54) =====
  49: { homeScore: 3, awayScore: 1, status: 'FT', completed: true, note: 'France 3-1 Senegal' },
  50: { homeScore: 4, awayScore: 1, status: 'FT', completed: true, note: 'Norway 4-1 Iraq' },
  // 51-54 pending
  // ===== GROUP J (55-60) =====
  55: { homeScore: 3, awayScore: 0, status: 'FT', completed: true, note: 'Argentina 3-0 Algeria' },
  56: { homeScore: 3, awayScore: 1, status: 'FT', completed: true, note: 'Austria 3-1 Jordan' },
  // 57-60 pending
  // ===== GROUP K (61-66) =====
  61: { homeScore: 1, awayScore: 1, status: 'FT', completed: true, note: 'Portugal 1-1 DR Congo' },
  62: { homeScore: 1, awayScore: 3, status: 'FT', completed: true, note: 'Uzbekistan 1-3 Colombia' },
  // 63-66 pending
  // ===== GROUP L (67-72) =====
  67: { homeScore: 4, awayScore: 2, status: 'FT', completed: true, note: 'England 4-2 Croatia' },
  68: { homeScore: 1, awayScore: 0, status: 'FT', completed: true, note: 'Ghana 1-0 Panama' },
  // 69-72 pending
  // ===== KNOCKOUT STAGE (73-104) - NO PERMANENT OVERRIDES =====
  // These will be populated by live API sync
};

// ============================================================
//  ALL 104 FIXTURES (Group 1-72 + Knockout 73-104)
// ============================================================
const FIXTURES = [
  // ===== GROUP STAGE (1-72) =====
  { id:1,  team1:"Mexico",       team2:"South Africa", date:"2026-06-11T19:00:00Z", stage:"group", venue:"Mexico City", group:"A" },
  { id:2,  team1:"South Korea",  team2:"Czechia",      date:"2026-06-12T02:00:00Z", stage:"group", venue:"Zapopan", group:"A" },
  { id:3,  team1:"Czechia",      team2:"South Africa", date:"2026-06-18T16:00:00Z", stage:"group", venue:"Atlanta", group:"A" },
  { id:4,  team1:"Mexico",       team2:"South Korea",  date:"2026-06-19T01:00:00Z", stage:"group", venue:"Zapopan", group:"A" },
  { id:5,  team1:"Czechia",      team2:"Mexico",       date:"2026-06-25T01:00:00Z", stage:"group", venue:"Mexico City", group:"A" },
  { id:6,  team1:"South Africa", team2:"South Korea",  date:"2026-06-25T01:00:00Z", stage:"group", venue:"Monterrey", group:"A" },
  { id:7,  team1:"Canada",       team2:"Bosnia",       date:"2026-06-12T19:00:00Z", stage:"group", venue:"Toronto", group:"B" },
  { id:8,  team1:"Qatar",        team2:"Switzerland",  date:"2026-06-13T19:00:00Z", stage:"group", venue:"San Francisco", group:"B" },
  { id:9,  team1:"Switzerland",  team2:"Bosnia",       date:"2026-06-18T19:00:00Z", stage:"group", venue:"Los Angeles", group:"B" },
  { id:10, team1:"Canada",       team2:"Qatar",        date:"2026-06-19T22:00:00Z", stage:"group", venue:"Vancouver", group:"B" },
  { id:11, team1:"Switzerland",  team2:"Canada",       date:"2026-06-24T19:00:00Z", stage:"group", venue:"Vancouver", group:"B" },
  { id:12, team1:"Bosnia",       team2:"Qatar",        date:"2026-06-24T19:00:00Z", stage:"group", venue:"Seattle", group:"B" },
  { id:13, team1:"Brazil",       team2:"Morocco",      date:"2026-06-13T22:00:00Z", stage:"group", venue:"New Jersey", group:"C" },
  { id:14, team1:"Haiti",        team2:"Scotland",     date:"2026-06-14T01:00:00Z", stage:"group", venue:"Boston", group:"C" },
  { id:15, team1:"Scotland",     team2:"Morocco",      date:"2026-06-19T22:00:00Z", stage:"group", venue:"Boston", group:"C" },
  { id:16, team1:"Brazil",       team2:"Haiti",        date:"2026-06-20T00:30:00Z", stage:"group", venue:"Philadelphia", group:"C" },
  { id:17, team1:"Scotland",     team2:"Brazil",       date:"2026-06-24T22:00:00Z", stage:"group", venue:"Miami", group:"C" },
  { id:18, team1:"Morocco",      team2:"Haiti",        date:"2026-06-24T22:00:00Z", stage:"group", venue:"Atlanta", group:"C" },
  { id:19, team1:"USA",          team2:"Paraguay",     date:"2026-06-13T01:00:00Z", stage:"group", venue:"Los Angeles", group:"D" },
  { id:20, team1:"Australia",    team2:"Turkiye",      date:"2026-06-14T04:00:00Z", stage:"group", venue:"Vancouver", group:"D" },
  { id:21, team1:"USA",          team2:"Australia",    date:"2026-06-19T19:00:00Z", stage:"group", venue:"Seattle", group:"D" },
  { id:22, team1:"Turkiye",      team2:"Paraguay",     date:"2026-06-20T03:00:00Z", stage:"group", venue:"San Francisco", group:"D" },
  { id:23, team1:"Turkiye",      team2:"USA",          date:"2026-06-26T02:00:00Z", stage:"group", venue:"Los Angeles", group:"D" },
  { id:24, team1:"Paraguay",     team2:"Australia",    date:"2026-06-26T02:00:00Z", stage:"group", venue:"San Francisco", group:"D" },
  { id:25, team1:"Germany",      team2:"Curacao",      date:"2026-06-14T17:00:00Z", stage:"group", venue:"Houston", group:"E" },
  { id:26, team1:"Ivory Coast",  team2:"Ecuador",      date:"2026-06-14T23:00:00Z", stage:"group", venue:"Philadelphia", group:"E" },
  { id:27, team1:"Germany",      team2:"Ivory Coast",  date:"2026-06-20T20:00:00Z", stage:"group", venue:"Toronto", group:"E" },
  { id:28, team1:"Ecuador",      team2:"Curacao",      date:"2026-06-21T00:00:00Z", stage:"group", venue:"Kansas City", group:"E" },
  { id:29, team1:"Curacao",      team2:"Ivory Coast",  date:"2026-06-25T20:00:00Z", stage:"group", venue:"Philadelphia", group:"E" },
  { id:30, team1:"Ecuador",      team2:"Germany",      date:"2026-06-25T20:00:00Z", stage:"group", venue:"New Jersey", group:"E" },
  { id:31, team1:"Netherlands",  team2:"Japan",        date:"2026-06-13T20:00:00Z", stage:"group", venue:"Dallas", group:"F" },
  { id:32, team1:"Sweden",       team2:"Tunisia",      date:"2026-06-14T02:00:00Z", stage:"group", venue:"Monterrey", group:"F" },
  { id:33, team1:"Netherlands",  team2:"Sweden",       date:"2026-06-20T17:00:00Z", stage:"group", venue:"Houston", group:"F" },
  { id:34, team1:"Tunisia",      team2:"Japan",        date:"2026-06-21T04:00:00Z", stage:"group", venue:"Monterrey", group:"F" },
  { id:35, team1:"Japan",        team2:"Sweden",       date:"2026-06-25T23:00:00Z", stage:"group", venue:"Dallas", group:"F" },
  { id:36, team1:"Tunisia",      team2:"Netherlands",  date:"2026-06-25T23:00:00Z", stage:"group", venue:"Kansas City", group:"F" },
  { id:37, team1:"Belgium",      team2:"Egypt",        date:"2026-06-14T19:00:00Z", stage:"group", venue:"Seattle", group:"G" },
  { id:38, team1:"Iran",         team2:"New Zealand",  date:"2026-06-15T01:00:00Z", stage:"group", venue:"Los Angeles", group:"G" },
  { id:39, team1:"Belgium",      team2:"Iran",         date:"2026-06-21T19:00:00Z", stage:"group", venue:"Los Angeles", group:"G" },
  { id:40, team1:"New Zealand",  team2:"Egypt",        date:"2026-06-22T01:00:00Z", stage:"group", venue:"Vancouver", group:"G" },
  { id:41, team1:"Egypt",        team2:"Iran",         date:"2026-06-27T03:00:00Z", stage:"group", venue:"Seattle", group:"G" },
  { id:42, team1:"New Zealand",  team2:"Belgium",      date:"2026-06-27T03:00:00Z", stage:"group", venue:"Vancouver", group:"G" },
  { id:43, team1:"Spain",        team2:"Cape Verde",   date:"2026-06-14T16:00:00Z", stage:"group", venue:"Atlanta", group:"H" },
  { id:44, team1:"Saudi Arabia", team2:"Uruguay",      date:"2026-06-14T22:00:00Z", stage:"group", venue:"Miami", group:"H" },
  { id:45, team1:"Spain",        team2:"Saudi Arabia", date:"2026-06-21T16:00:00Z", stage:"group", venue:"Atlanta", group:"H" },
  { id:46, team1:"Uruguay",      team2:"Cape Verde",   date:"2026-06-21T22:00:00Z", stage:"group", venue:"Miami", group:"H" },
  { id:47, team1:"Cape Verde",   team2:"Saudi Arabia", date:"2026-06-27T00:00:00Z", stage:"group", venue:"Houston", group:"H" },
  { id:48, team1:"Uruguay",      team2:"Spain",        date:"2026-06-27T00:00:00Z", stage:"group", venue:"Guadalajara", group:"H" },
  { id:49, team1:"France",       team2:"Senegal",      date:"2026-06-15T19:00:00Z", stage:"group", venue:"New Jersey", group:"I" },
  { id:50, team1:"Iraq",         team2:"Norway",       date:"2026-06-15T22:00:00Z", stage:"group", venue:"Boston", group:"I" },
  { id:51, team1:"France",       team2:"Iraq",         date:"2026-06-22T21:00:00Z", stage:"group", venue:"Philadelphia", group:"I" },
  { id:52, team1:"Norway",       team2:"Senegal",      date:"2026-06-23T00:00:00Z", stage:"group", venue:"New Jersey", group:"I" },
  { id:53, team1:"Norway",       team2:"France",       date:"2026-06-26T19:00:00Z", stage:"group", venue:"Boston", group:"I" },
  { id:54, team1:"Senegal",      team2:"Iraq",         date:"2026-06-26T19:00:00Z", stage:"group", venue:"Toronto", group:"I" },
  { id:55, team1:"Argentina",    team2:"Algeria",      date:"2026-06-16T01:00:00Z", stage:"group", venue:"Kansas City", group:"J" },
  { id:56, team1:"Austria",      team2:"Jordan",       date:"2026-06-16T04:00:00Z", stage:"group", venue:"San Francisco", group:"J" },
  { id:57, team1:"Argentina",    team2:"Austria",      date:"2026-06-22T17:00:00Z", stage:"group", venue:"Dallas", group:"J" },
  { id:58, team1:"Jordan",       team2:"Algeria",      date:"2026-06-23T03:00:00Z", stage:"group", venue:"San Francisco", group:"J" },
  { id:59, team1:"Algeria",      team2:"Austria",      date:"2026-06-28T02:00:00Z", stage:"group", venue:"Kansas City", group:"J" },
  { id:60, team1:"Jordan",       team2:"Argentina",    date:"2026-06-28T02:00:00Z", stage:"group", venue:"Dallas", group:"J" },
  { id:61, team1:"Portugal",     team2:"DR Congo",     date:"2026-06-16T17:00:00Z", stage:"group", venue:"Houston", group:"K" },
  { id:62, team1:"Uzbekistan",   team2:"Colombia",     date:"2026-06-17T02:00:00Z", stage:"group", venue:"Mexico City", group:"K" },
  { id:63, team1:"Portugal",     team2:"Uzbekistan",   date:"2026-06-23T17:00:00Z", stage:"group", venue:"Houston", group:"K" },
  { id:64, team1:"Colombia",     team2:"DR Congo",     date:"2026-06-24T02:00:00Z", stage:"group", venue:"Guadalajara", group:"K" },
  { id:65, team1:"Colombia",     team2:"Portugal",     date:"2026-06-27T23:30:00Z", stage:"group", venue:"Miami", group:"K" },
  { id:66, team1:"DR Congo",     team2:"Uzbekistan",   date:"2026-06-27T23:30:00Z", stage:"group", venue:"Atlanta", group:"K" },
  { id:67, team1:"England",      team2:"Croatia",      date:"2026-06-16T20:00:00Z", stage:"group", venue:"Dallas", group:"L" },
  { id:68, team1:"Ghana",        team2:"Panama",       date:"2026-06-16T23:00:00Z", stage:"group", venue:"Toronto", group:"L" },
  { id:69, team1:"England",      team2:"Ghana",        date:"2026-06-23T20:00:00Z", stage:"group", venue:"Boston", group:"L" },
  { id:70, team1:"Panama",       team2:"Croatia",      date:"2026-06-23T23:00:00Z", stage:"group", venue:"Toronto", group:"L" },
  { id:71, team1:"Panama",       team2:"England",      date:"2026-06-27T21:00:00Z", stage:"group", venue:"New Jersey", group:"L" },
  { id:72, team1:"Croatia",      team2:"Ghana",        date:"2026-06-27T21:00:00Z", stage:"group", venue:"Philadelphia", group:"L" },

  // ===== KNOCKOUT STAGE (73-104) =====
  // Round of 32
  { id:73,  team1Slot:"2A",  team2Slot:"2B",  date:"2026-06-28T19:00:00Z", stage:"round32", venue:"SoFi Stadium, Inglewood" },
  { id:74,  team1Slot:"1E",  team2Slot:"3rd_ABCDF", date:"2026-06-29T20:30:00Z", stage:"round32", venue:"Gillette Stadium, Foxborough" },
  { id:75,  team1Slot:"1F",  team2Slot:"2C",  date:"2026-06-30T01:00:00Z", stage:"round32", venue:"Estadio BBVA, Guadalupe" },
  { id:76,  team1Slot:"1C",  team2Slot:"2F",  date:"2026-06-29T17:00:00Z", stage:"round32", venue:"NRG Stadium, Houston" },
  { id:77,  team1Slot:"1I",  team2Slot:"3rd_CDFGH", date:"2026-06-30T21:00:00Z", stage:"round32", venue:"MetLife Stadium, East Rutherford" },
  { id:78,  team1Slot:"2E",  team2Slot:"2I",  date:"2026-06-30T17:00:00Z", stage:"round32", venue:"AT&T Stadium, Arlington" },
  { id:79,  team1Slot:"1A",  team2Slot:"3rd_CEFHI", date:"2026-07-01T01:00:00Z", stage:"round32", venue:"Estadio Azteca, Mexico City" },
  { id:80,  team1Slot:"1L",  team2Slot:"3rd_EHIJK", date:"2026-07-01T16:00:00Z", stage:"round32", venue:"Mercedes-Benz Stadium, Atlanta" },
  { id:81,  team1Slot:"1D",  team2Slot:"3rd_BEFIJ", date:"2026-07-02T00:00:00Z", stage:"round32", venue:"Levi's Stadium, Santa Clara" },
  { id:82,  team1Slot:"1G",  team2Slot:"3rd_AEHIJ", date:"2026-07-01T20:00:00Z", stage:"round32", venue:"Lumen Field, Seattle" },
  { id:83,  team1Slot:"2K",  team2Slot:"2L",  date:"2026-07-02T23:00:00Z", stage:"round32", venue:"BMO Field, Toronto" },
  { id:84,  team1Slot:"1H",  team2Slot:"2J",  date:"2026-07-02T19:00:00Z", stage:"round32", venue:"SoFi Stadium, Inglewood" },
  { id:85,  team1Slot:"1B",  team2Slot:"3rd_EFGIJ", date:"2026-07-03T03:00:00Z", stage:"round32", venue:"BC Place, Vancouver" },
  { id:86,  team1Slot:"1J",  team2Slot:"2H",  date:"2026-07-03T22:00:00Z", stage:"round32", venue:"Hard Rock Stadium, Miami Gardens" },
  { id:87,  team1Slot:"1K",  team2Slot:"3rd_DEIJL", date:"2026-07-04T01:30:00Z", stage:"round32", venue:"Arrowhead Stadium, Kansas City" },
  { id:88,  team1Slot:"2D",  team2Slot:"2G",  date:"2026-07-03T18:00:00Z", stage:"round32", venue:"AT&T Stadium, Arlington" },
  // Round of 16
  { id:89,  team1Slot:"W73", team2Slot:"W75", date:"2026-07-04T17:00:00Z", stage:"round16", venue:"Lincoln Financial Field, Philadelphia" },
  { id:90,  team1Slot:"W74", team2Slot:"W77", date:"2026-07-04T21:00:00Z", stage:"round16", venue:"NRG Stadium, Houston" },
  { id:91,  team1Slot:"W76", team2Slot:"W78", date:"2026-07-05T20:00:00Z", stage:"round16", venue:"MetLife Stadium, East Rutherford" },
  { id:92,  team1Slot:"W79", team2Slot:"W80", date:"2026-07-06T00:00:00Z", stage:"round16", venue:"Estadio Azteca, Mexico City" },
  { id:93,  team1Slot:"W83", team2Slot:"W84", date:"2026-07-06T19:00:00Z", stage:"round16", venue:"AT&T Stadium, Arlington" },
  { id:94,  team1Slot:"W81", team2Slot:"W82", date:"2026-07-07T00:00:00Z", stage:"round16", venue:"Lumen Field, Seattle" },
  { id:95,  team1Slot:"W86", team2Slot:"W88", date:"2026-07-07T16:00:00Z", stage:"round16", venue:"Mercedes-Benz Stadium, Atlanta" },
  { id:96,  team1Slot:"W85", team2Slot:"W87", date:"2026-07-07T20:00:00Z", stage:"round16", venue:"BC Place, Vancouver" },
  // Quarter-finals
  { id:97,  team1Slot:"W89", team2Slot:"W90", date:"2026-07-09T20:00:00Z", stage:"quarter", venue:"Gillette Stadium, Foxborough" },
  { id:98,  team1Slot:"W93", team2Slot:"W94", date:"2026-07-10T19:00:00Z", stage:"quarter", venue:"SoFi Stadium, Inglewood" },
  { id:99,  team1Slot:"W91", team2Slot:"W92", date:"2026-07-11T21:00:00Z", stage:"quarter", venue:"Hard Rock Stadium, Miami Gardens" },
  { id:100, team1Slot:"W95", team2Slot:"W96", date:"2026-07-12T01:00:00Z", stage:"quarter", venue:"Arrowhead Stadium, Kansas City" },
  // Semi-finals
  { id:101, team1Slot:"W97", team2Slot:"W98", date:"2026-07-14T19:00:00Z", stage:"semi", venue:"AT&T Stadium, Arlington" },
  { id:102, team1Slot:"W99", team2Slot:"W100", date:"2026-07-15T19:00:00Z", stage:"semi", venue:"Mercedes-Benz Stadium, Atlanta" },
  // 3rd Place
  { id:103, team1Slot:"L101", team2Slot:"L102", date:"2026-07-18T21:00:00Z", stage:"final", isThirdPlace:true, venue:"Hard Rock Stadium, Miami Gardens" },
  // Final
  { id:104, team1Slot:"W101", team2Slot:"W102", date:"2026-07-19T19:00:00Z", stage:"final", venue:"MetLife Stadium, East Rutherford" }
];

const WC_START = '20260611';
const WC_END   = '20260720';

const TEAM_ALIASES = {
  "Korea Republic":"South Korea","United States":"USA","Czech Republic":"Czechia",
  "Cabo Verde":"Cape Verde","Cote d'Ivoire":"Ivory Coast","IR Iran":"Iran",
  "Congo DR":"DR Congo","Turkiye":"Turkiye","Turkey":"Turkiye","Curacao":"Curacao",
  "Bosnia and Herzegovina":"Bosnia"
};

const FIXTURE_MAP = {};
FIXTURES.forEach(f=>{
  if (f.stage === 'group') {
    const k1 = `${norm(f.team1)}_${norm(f.team2)}`;
    const k2 = `${norm(f.team2)}_${norm(f.team1)}`;
    FIXTURE_MAP[k1] = f.id;
    FIXTURE_MAP[k2] = f.id;
  }
  FIXTURE_MAP[`id_${f.id}`] = f.id;
});

function norm(n){ 
  if(!n) return ''; 
  const s = n.trim(); 
  return (TEAM_ALIASES[s]||s).toLowerCase().replace(/[^a-z0-9]/g,''); 
}

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

function mergeWithProtection(existingGames, newGames) {
  const resultMap = new Map();

  for (const g of existingGames || []) {
    if (g.completed === true || g.permanent === true) {
      resultMap.set(g.id, g);
      console.log(`[PROTECT] Match ${g.id} (${g.stage || 'group'}) finalized (${g.homeScore}-${g.awayScore}). Preserving.`);
    }
  }

  for (const newGame of newGames || []) {
    if (resultMap.has(newGame.id)) {
      console.log(`[SKIP] Match ${newGame.id} already finalized, ignoring new data.`);
      continue;
    }
    resultMap.set(newGame.id, newGame);
    console.log(`[UPDATE] Match ${newGame.id}: ${newGame.home} ${newGame.homeScore ?? '?'} - ${newGame.awayScore ?? '?'} ${newGame.away}`);
  }

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
        stage: fixture.stage,
        group: fixture.group,
        overrideNote: override.note
      });
      console.log(`[PERMANENT] Match ${id} LOCKED: ${fixture.team1} ${override.homeScore}-${override.awayScore} ${fixture.team2}`);
    }
  }

  return Array.from(resultMap.values()).sort((a, b) => a.id - b.id);
}

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
    const fixture = FIXTURES.find(f => f.id === id);
    const state = ev.status?.type?.state;
    let status = 'Scheduled', completed = false;
    if (state === 'in') status = 'LIVE';
    else if (state === 'post') { status = 'FT'; completed = true; }

    const gameObj = { 
      id, 
      home: h.team.name, 
      away: a.team.name,
      homeScore: h.score !== undefined ? parseInt(h.score) : null,
      awayScore: a.score !== undefined ? parseInt(a.score) : null,
      status, 
      completed,
      stage: fixture?.stage || 'group',
      group: fixture?.group || null,
      date: fixture?.date || null,
      venue: fixture?.venue || null
    };

    if (fixture?.stage !== 'group') {
      gameObj.etHomeScore = ev.status?.type?.detail?.includes('ET') ? gameObj.homeScore : null;
      gameObj.etAwayScore = ev.status?.type?.detail?.includes('ET') ? gameObj.awayScore : null;
      if (ev.status?.type?.detail?.includes('PEN')) {
        const winner = comp.competitors?.find(c => c.winner === true);
        if (winner) gameObj.penaltyWinner = winner.team?.name;
      }
    }

    games.push(gameObj);
  }
  console.log(`[SRC] ESPN: ${games.length} matches`);
  return { source: 'ESPN', games };
}

async function fetchFootballData() {
  const key = process.env.FOOTBALL_DATA_KEY;
  console.log('[DEBUG] FOOTBALL_DATA_KEY exists:', !!key, 'Length:', key ? key.length : 0);
  if (!key) {
    console.log('[WARN] No FOOTBALL_DATA_KEY found, skipping Football-Data');
    return { source: 'Football-Data', games: [] };
  }
  console.log('[SRC] Football-Data...');
  const data = await fetchJson('api.football-data.org', '/v4/competitions/WC/matches?season=2026', { 'X-Auth-Token': key });
  const games = [];
  if (!data?.matches) return { source: 'Football-Data', games };
  for (const m of data.matches) {
    const home = norm(m.homeTeam?.name), away = norm(m.awayTeam?.name);
    const id = FIXTURE_MAP[`${home}_${away}`]; if (!id) continue;
    const fixture = FIXTURES.find(f => f.id === id);
    let status = 'Scheduled', completed = false;
    const s = m.status;
    if (s === 'IN_PLAY' || s === 'LIVE') status = 'LIVE';
    else if (s === 'FINISHED') { status = 'FT'; completed = true; }

    const gameObj = { 
      id, 
      home: m.homeTeam?.name, 
      away: m.awayTeam?.name,
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
      status, 
      completed,
      stage: fixture?.stage || 'group',
      group: fixture?.group || null,
      date: fixture?.date || null,
      venue: fixture?.venue || null
    };

    if (fixture?.stage !== 'group') {
      if (m.score?.extraTime) {
        gameObj.etHomeScore = m.score.extraTime.home;
        gameObj.etAwayScore = m.score.extraTime.away;
      }
      if (m.score?.penalties) {
        const pHome = m.score.penalties.home;
        const pAway = m.score.penalties.away;
        gameObj.penaltyWinner = pHome > pAway ? m.homeTeam?.name : m.awayTeam?.name;
      }
    }

    games.push(gameObj);
  }
  console.log(`[SRC] Football-Data: ${games.length} matches`);
  return { source: 'Football-Data', games };
}

async function fetchFifaApi() {
  return { source: 'FIFA-API', games: [] };
}

async function main() {
  let output;

  const existingData = loadExistingLiveData();
  const existingFinalized = (existingData?.games || []).filter(g => g.completed).length;
  console.log(`[LOAD] Existing live.json: ${existingData?.games?.length || 0} matches, ${existingFinalized} finalized`);

  const [espn, fd, fifa] = await Promise.all([fetchEspn(), fetchFootballData(), fetchFifaApi()]);
  const results = [espn, fd, fifa].filter(r => r.games.length > 0);

  if (results.length === 0) {
    console.log('[WARN] No real data from APIs. Preserving existing finalized matches.');
    const preserved = mergeWithProtection(existingData?.games || [], []);
    output = {
      games: preserved, 
      lastUpdated: new Date().toISOString(),
      source: 'No live data - preserved existing', 
      sourceCount: 0, 
      sourcesUsed: [],
      finalizedCount: preserved.filter(g => g.completed).length,
      permanentOverrides: Object.keys(PERMANENT_OVERRIDES).length,
      message: 'No new matches from APIs. Existing finalized matches preserved.',
      totalFixtures: FIXTURES.length
    };
  } else {
    const best = results.reduce((a, b) => a.games.length > b.games.length ? a : b);
    const merged = mergeWithProtection(existingData?.games || [], best.games);
    output = {
      games: merged, 
      lastUpdated: new Date().toISOString(),
      source: `Merged (${results.map(r => r.source).join('+')})`,
      sourceCount: results.length, 
      sourcesUsed: results.map(r => r.source),
      finalizedCount: merged.filter(g => g.completed).length,
      permanentOverrides: Object.keys(PERMANENT_OVERRIDES).length,
      totalFixtures: FIXTURES.length
    };
  }

  const outDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'live.json'), JSON.stringify(output, null, 2));
  const finalFinalized = output.games.filter(g => g.completed).length;
  const permanentCount = output.games.filter(g => g.permanent).length;
  const knockoutCount = output.games.filter(g => g.stage && g.stage !== 'group').length;
  console.log(`Written ${output.games.length} games to data/live.json`);
  console.log(`   - ${finalFinalized} finalized (protected from future overwrites)`);
  console.log(`   - ${permanentCount} permanent manual overrides`);
  console.log(`   - ${knockoutCount} knockout matches`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  const existingData = loadExistingLiveData();
  const preserved = mergeWithProtection(existingData?.games || [], []);
  const outDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'live.json'), JSON.stringify({
    games: preserved, 
    lastUpdated: new Date().toISOString(),
    source: 'Error fallback - existing preserved', 
    error: err.message,
    finalizedCount: preserved.filter(g => g.completed).length,
    permanentOverrides: Object.keys(PERMANENT_OVERRIDES).length,
    totalFixtures: FIXTURES.length
  }, null, 2));
});
