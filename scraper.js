const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, 'data', 'live.json');

// FIFA rankings (lower = stronger)
const RANKS = {
  "Mexico": 14, "South Africa": 60, "South Korea": 25, "Czechia": 40,
  "Canada": 30, "Bosnia": 64, "Qatar": 56, "Switzerland": 19,
  "Brazil": 6, "Morocco": 7, "Haiti": 83, "Scotland": 42,
  "USA": 17, "Paraguay": 41, "Australia": 27, "Türkiye": 22,
  "Germany": 10, "Curaçao": 82, "Ivory Coast": 33, "Ecuador": 23,
  "Netherlands": 8, "Japan": 18, "Sweden": 38, "Tunisia": 45,
  "Belgium": 9, "Egypt": 29, "Iran": 20, "New Zealand": 85,
  "Spain": 2, "Cape Verde": 67, "Saudi Arabia": 61, "Uruguay": 16,
  "France": 3, "Senegal": 15, "Iraq": 57, "Norway": 31,
  "Argentina": 1, "Algeria": 28, "Austria": 24, "Jordan": 63,
  "Portugal": 5, "DR Congo": 46, "Uzbekistan": 50, "Colombia": 13,
  "England": 4, "Croatia": 11, "Ghana": 73, "Panama": 34
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

// Deterministic seeded random
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Realistic football score generator
function simulateMatch(home, away, matchId, now) {
  const matchTime = new Date(FIXTURES.find(f => f.id === matchId).date);
  const matchEnd = new Date(matchTime.getTime() + 2 * 60 * 60 * 1000);
  const matchFullEnd = new Date(matchTime.getTime() + 2.5 * 60 * 60 * 1000);
  
  const r1 = RANKS[home] || 50;
  const r2 = RANKS[away] || 50;
  
  // Base expected goals based on ranking difference
  const rankDiff = r2 - r1; // positive = home team stronger
  const homeAdv = 0.35;
  
  // Expected goals: stronger teams score more
  // Base xG for home: 1.2 to 2.8 depending on strength
  let xGHome = 1.1 + (rankDiff / 60) + homeAdv;
  let xGAway = 1.1 - (rankDiff / 60);
  
  // Clamp to realistic ranges
  xGHome = Math.max(0.4, Math.min(3.2, xGHome));
  xGAway = Math.max(0.3, Math.min(2.8, xGAway));
  
  // Deterministic seeds for this match
  const s1 = seededRandom(matchId * 7919);
  const s2 = seededRandom(matchId * 104729);
  const s3 = seededRandom(matchId * 1299709);
  
  // Convert xG to actual goals using weighted probability
  function goalsFromxG(xg, seed) {
    const r = seededRandom(seed * 99991 + matchId);
    // Poisson-like distribution but weighted toward low scores
    if (r < 0.30) return 0;
    if (r < 0.55) return 1;
    if (r < 0.75) return 2;
    if (r < 0.88) return 3;
    if (r < 0.95) return 4;
    return 5;
  }
  
  let homeScore = goalsFromxG(xGHome, s1);
  let awayScore = goalsFromxG(xGAway, s2);
  
  // Fine-tune: if xG is very low, more likely 0 goals
  if (xGHome < 0.8 && s1 > 0.6) homeScore = 0;
  if (xGAway < 0.7 && s2 > 0.65) awayScore = 0;
  
  // If both score 0, force at least one goal 70% of the time (no 0-0 overload)
  if (homeScore === 0 && awayScore === 0) {
    if (s3 < 0.7) {
      if (xGHome >= xGAway) homeScore = 1; else awayScore = 1;
    }
  }
  
  // Upset chance: if rank difference is huge but underdog wins
  if (Math.abs(rankDiff) > 30 && s3 < 0.08) {
    // Swap scores for upset
    const tmp = homeScore;
    homeScore = awayScore;
    awayScore = tmp;
    if (homeScore === awayScore) awayScore += 1;
  }
  
  // Cap at realistic max
  homeScore = Math.min(homeScore, 6);
  awayScore = Math.min(awayScore, 6);
  
  if (now >= matchFullEnd) {
    return { homeScore, awayScore, completed: true, status: 'FT' };
  } else if (now >= matchTime) {
    const progress = Math.min(1, (now - matchTime) / (matchEnd - matchTime));
    // During live match, show partial scores (goals appear over time)
    const liveHome = Math.floor(homeScore * progress);
    const liveAway = Math.floor(awayScore * progress);
    // Add a chance for a late goal to appear early in the second half
    return { 
      homeScore: liveHome + (progress > 0.6 && homeScore > liveHome ? 1 : 0), 
      awayScore: liveAway + (progress > 0.6 && awayScore > liveAway ? 1 : 0), 
      completed: false, 
      status: 'LIVE' 
    };
  } else {
    return { homeScore: null, awayScore: null, completed: false, status: 'Scheduled' };
  }
}

function generate() {
  const now = new Date();
  const games = [];
  
  for (const f of FIXTURES) {
    const result = simulateMatch(f.home, f.away, f.id, now);
    games.push({ 
      id: f.id, 
      home: f.home, 
      away: f.away, 
      homeScore: result.homeScore, 
      awayScore: result.awayScore, 
      completed: result.completed, 
      status: result.status, 
      group: f.group 
    });
  }
  
  return { 
    games, 
    lastUpdated: now.toISOString(), 
    source: 'wc2026-live-engine', 
    totalMatches: games.length, 
    simulated: true 
  };
}

if (!fs.existsSync(path.dirname(OUTPUT_PATH))) fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

const data = generate();
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));

const ft = data.games.filter(g => g.status === 'FT').length;
const live = data.games.filter(g => g.status === 'LIVE').length;
const sched = data.games.filter(g => g.status === 'Scheduled').length;

console.log(`✅ ${data.games.length} matches | FT:${ft} | LIVE:${live} | SOON:${sched}`);
console.log('Sample results:');
data.games.filter(g => g.status === 'FT').slice(0, 6).forEach(g => {
  console.log(`  ${g.home} ${g.homeScore} - ${g.awayScore} ${g.away}`);
});
