const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, 'data', 'live.json');

const RANKS = {
  "Mexico":15, "South Africa":64, "South Korea":23, "Czechia":36,
  "Canada":48, "Bosnia":74, "Qatar":56, "Switzerland":20,
  "Brazil":5, "Morocco":14, "Haiti":85, "Scotland":38,
  "USA":11, "Paraguay":52, "Australia":25, "Türkiye":40,
  "Germany":13, "Curaçao":92, "Ivory Coast":41, "Ecuador":35,
  "Netherlands":7, "Japan":18, "Sweden":27, "Tunisia":34,
  "Belgium":3, "Egypt":29, "Iran":22, "New Zealand":100,
  "Spain":8, "Cape Verde":67, "Saudi Arabia":56, "Uruguay":16,
  "France":2, "Senegal":19, "Iraq":62, "Norway":44,
  "Argentina":1, "Algeria":31, "Austria":25, "Jordan":87,
  "Portugal":6, "DR Congo":65, "Uzbekistan":73, "Colombia":12,
  "England":4, "Croatia":10, "Ghana":50, "Panama":44
};

const FIXTURES = [
  { id:1, group:"A", home:"Mexico", away:"South Africa", date:"2026-06-11T19:00:00Z" },
  { id:2, group:"A", home:"South Korea", away:"Czechia", date:"2026-06-12T02:00:00Z" },
  { id:3, group:"A", home:"Czechia", away:"South Africa", date:"2026-06-18T16:00:00Z" },
  { id:4, group:"A", home:"Mexico", away:"South Korea", date:"2026-06-19T01:00:00Z" },
  { id:5, group:"A", home:"Czechia", away:"Mexico", date:"2026-06-25T01:00:00Z" },
  { id:6, group:"A", home:"South Africa", away:"South Korea", date:"2026-06-25T01:00:00Z" },
  { id:7, group:"B", home:"Canada", away:"Bosnia", date:"2026-06-12T19:00:00Z" },
  { id:8, group:"B", home:"Qatar", away:"Switzerland", date:"2026-06-13T19:00:00Z" },
  { id:9, group:"B", home:"Switzerland", away:"Bosnia", date:"2026-06-18T19:00:00Z" },
  { id:10, group:"B", home:"Canada", away:"Qatar", date:"2026-06-19T22:00:00Z" },
  { id:11, group:"B", home:"Switzerland", away:"Canada", date:"2026-06-24T19:00:00Z" },
  { id:12, group:"B", home:"Bosnia", away:"Qatar", date:"2026-06-24T19:00:00Z" },
  { id:13, group:"C", home:"Brazil", away:"Morocco", date:"2026-06-13T22:00:00Z" },
  { id:14, group:"C", home:"Haiti", away:"Scotland", date:"2026-06-14T01:00:00Z" },
  { id:15, group:"C", home:"Scotland", away:"Morocco", date:"2026-06-19T22:00:00Z" },
  { id:16, group:"C", home:"Brazil", away:"Haiti", date:"2026-06-20T00:30:00Z" },
  { id:17, group:"C", home:"Scotland", away:"Brazil", date:"2026-06-24T22:00:00Z" },
  { id:18, group:"C", home:"Morocco", away:"Haiti", date:"2026-06-24T22:00:00Z" },
  { id:19, group:"D", home:"USA", away:"Paraguay", date:"2026-06-13T01:00:00Z" },
  { id:20, group:"D", home:"Australia", away:"Türkiye", date:"2026-06-14T04:00:00Z" },
  { id:21, group:"D", home:"USA", away:"Australia", date:"2026-06-19T19:00:00Z" },
  { id:22, group:"D", home:"Türkiye", away:"Paraguay", date:"2026-06-20T03:00:00Z" },
  { id:23, group:"D", home:"Türkiye", away:"USA", date:"2026-06-26T02:00:00Z" },
  { id:24, group:"D", home:"Paraguay", away:"Australia", date:"2026-06-26T02:00:00Z" },
  { id:25, group:"E", home:"Germany", away:"Curaçao", date:"2026-06-14T17:00:00Z" },
  { id:26, group:"E", home:"Ivory Coast", away:"Ecuador", date:"2026-06-14T23:00:00Z" },
  { id:27, group:"E", home:"Germany", away:"Ivory Coast", date:"2026-06-20T20:00:00Z" },
  { id:28, group:"E", home:"Ecuador", away:"Curaçao", date:"2026-06-21T00:00:00Z" },
  { id:29, group:"E", home:"Curaçao", away:"Ivory Coast", date:"2026-06-25T20:00:00Z" },
  { id:30, group:"E", home:"Ecuador", away:"Germany", date:"2026-06-25T20:00:00Z" },
  { id:31, group:"F", home:"Netherlands", away:"Japan", date:"2026-06-13T20:00:00Z" },
  { id:32, group:"F", home:"Sweden", away:"Tunisia", date:"2026-06-14T02:00:00Z" },
  { id:33, group:"F", home:"Netherlands", away:"Sweden", date:"2026-06-20T17:00:00Z" },
  { id:34, group:"F", home:"Tunisia", away:"Japan", date:"2026-06-21T04:00:00Z" },
  { id:35, group:"F", home:"Japan", away:"Sweden", date:"2026-06-25T23:00:00Z" },
  { id:36, group:"F", home:"Tunisia", away:"Netherlands", date:"2026-06-25T23:00:00Z" },
  { id:37, group:"G", home:"Belgium", away:"Egypt", date:"2026-06-14T19:00:00Z" },
  { id:38, group:"G", home:"Iran", away:"New Zealand", date:"2026-06-15T01:00:00Z" },
  { id:39, group:"G", home:"Belgium", away:"Iran", date:"2026-06-21T19:00:00Z" },
  { id:40, group:"G", home:"New Zealand", away:"Egypt", date:"2026-06-22T01:00:00Z" },
  { id:41, group:"G", home:"Egypt", away:"Iran", date:"2026-06-27T03:00:00Z" },
  { id:42, group:"G", home:"New Zealand", away:"Belgium", date:"2026-06-27T03:00:00Z" },
  { id:43, group:"H", home:"Spain", away:"Cape Verde", date:"2026-06-14T16:00:00Z" },
  { id:44, group:"H", home:"Saudi Arabia", away:"Uruguay", date:"2026-06-14T22:00:00Z" },
  { id:45, group:"H", home:"Spain", away:"Saudi Arabia", date:"2026-06-21T16:00:00Z" },
  { id:46, group:"H", home:"Uruguay", away:"Cape Verde", date:"2026-06-21T22:00:00Z" },
  { id:47, group:"H", home:"Cape Verde", away:"Saudi Arabia", date:"2026-06-27T00:00:00Z" },
  { id:48, group:"H", home:"Uruguay", away:"Spain", date:"2026-06-27T00:00:00Z" },
  { id:49, group:"I", home:"France", away:"Senegal", date:"2026-06-15T19:00:00Z" },
  { id:50, group:"I", home:"Iraq", away:"Norway", date:"2026-06-15T22:00:00Z" },
  { id:51, group:"I", home:"France", away:"Iraq", date:"2026-06-22T21:00:00Z" },
  { id:52, group:"I", home:"Norway", away:"Senegal", date:"2026-06-23T00:00:00Z" },
  { id:53, group:"I", home:"Norway", away:"France", date:"2026-06-26T19:00:00Z" },
  { id:54, group:"I", home:"Senegal", away:"Iraq", date:"2026-06-26T19:00:00Z" },
  { id:55, group:"J", home:"Argentina", away:"Algeria", date:"2026-06-16T01:00:00Z" },
  { id:56, group:"J", home:"Austria", away:"Jordan", date:"2026-06-16T04:00:00Z" },
  { id:57, group:"J", home:"Argentina", away:"Austria", date:"2026-06-22T17:00:00Z" },
  { id:58, group:"J", home:"Jordan", away:"Algeria", date:"2026-06-23T03:00:00Z" },
  { id:59, group:"J", home:"Algeria", away:"Austria", date:"2026-06-28T02:00:00Z" },
  { id:60, group:"J", home:"Jordan", away:"Argentina", date:"2026-06-28T02:00:00Z" },
  { id:61, group:"K", home:"Portugal", away:"DR Congo", date:"2026-06-16T17:00:00Z" },
  { id:62, group:"K", home:"Uzbekistan", away:"Colombia", date:"2026-06-17T02:00:00Z" },
  { id:63, group:"K", home:"Portugal", away:"Uzbekistan", date:"2026-06-23T17:00:00Z" },
  { id:64, group:"K", home:"Colombia", away:"DR Congo", date:"2026-06-24T02:00:00Z" },
  { id:65, group:"K", home:"Colombia", away:"Portugal", date:"2026-06-27T23:30:00Z" },
  { id:66, group:"K", home:"DR Congo", away:"Uzbekistan", date:"2026-06-27T23:30:00Z" },
  { id:67, group:"L", home:"England", away:"Croatia", date:"2026-06-16T20:00:00Z" },
  { id:68, group:"L", home:"Ghana", away:"Panama", date:"2026-06-16T23:00:00Z" },
  { id:69, group:"L", home:"England", away:"Ghana", date:"2026-06-23T20:00:00Z" },
  { id:70, group:"L", home:"Panama", away:"Croatia", date:"2026-06-23T23:00:00Z" },
  { id:71, group:"L", home:"Panama", away:"England", date:"2026-06-27T21:00:00Z" },
  { id:72, group:"L", home:"Croatia", away:"Ghana", date:"2026-06-27T21:00:00Z" }
];

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function simulateMatch(home, away, matchId, now) {
  const matchTime = new Date(FIXTURES.find(f => f.id === matchId).date);
  const matchEnd = new Date(matchTime.getTime() + 2 * 60 * 60 * 1000);
  const matchFullEnd = new Date(matchTime.getTime() + 2.5 * 60 * 60 * 1000);
  
  const r1 = RANKS[home] || 50;
  const r2 = RANKS[away] || 50;
  
  const seed = matchId * 12345 + 2026;
  const rand1 = seededRandom(seed);
  const rand2 = seededRandom(seed + 1);
  const rand3 = seededRandom(seed + 2);
  
  const homeAdv = 0.15;
  const probHome = Math.min(0.85, (r2 / (r1 + r2)) + homeAdv);
  
  let s1, s2;
  
  if (rand1 < probHome * 0.30) { s1 = Math.floor(rand2 * 3) + 2; s2 = Math.floor(rand3 * 2); }
  else if (rand1 < probHome) { s1 = Math.floor(rand2 * 2) + 1; s2 = Math.floor(rand3 * 2); }
  else if (rand1 < probHome + (1 - probHome) * 0.30) { s1 = Math.floor(rand2 * 2); s2 = Math.floor(rand3 * 3) + 2; }
  else { s1 = Math.floor(rand2 * 2); s2 = Math.floor(rand3 * 2) + 1; }
  
  if (rand3 < 0.22) { const d = Math.floor(rand1 * 3); s1 = d; s2 = d; }
  
  if (now >= matchFullEnd) {
    return { homeScore: s1, awayScore: s2, completed: true, status: 'FT' };
  } else if (now >= matchTime) {
    const progress = Math.min(1, (now - matchTime) / (matchEnd - matchTime));
    return { homeScore: Math.floor(s1 * progress) || 0, awayScore: Math.floor(s2 * progress) || 0, completed: false, status: 'LIVE' };
  } else {
    return { homeScore: null, awayScore: null, completed: false, status: 'Scheduled' };
  }
}

function generate() {
  const now = new Date();
  const games = [];
  
  for (const f of FIXTURES) {
    const result = simulateMatch(f.home, f.away, f.id, now);
    games.push({ id: f.id, home: f.home, away: f.away, homeScore: result.homeScore, awayScore: result.awayScore, completed: result.completed, status: result.status, group: f.group });
  }
  
  return { games, lastUpdated: now.toISOString(), source: 'wc2026-live-engine', totalMatches: games.length, simulated: true };
}

if (!fs.existsSync(path.dirname(OUTPUT_PATH))) fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

const data = generate();
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
console.log(`✅ ${data.games.length} matches | Live: ${data.games.filter(g=>g.status==='LIVE').length} | FT: ${data.games.filter(g=>g.status==='FT').length} | Scheduled: ${data.games.filter(g=>g.status==='Scheduled').length}`);
