const fs = require('fs');
const path = require('path');

const DEMO_MODE = process.env.DEMO_MODE === 'true';

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
  { id:20, team1:"Australia",    team2:"Türkiye",      date:"2026-06-14T04:00:00Z" },
  { id:21, team1:"USA",          team2:"Australia",    date:"2026-06-19T19:00:00Z" },
  { id:22, team1:"Türkiye",      team2:"Paraguay",     date:"2026-06-20T03:00:00Z" },
  { id:23, team1:"Türkiye",      team2:"USA",          date:"2026-06-26T02:00:00Z" },
  { id:24, team1:"Paraguay",     team2:"Australia",    date:"2026-06-26T02:00:00Z" },
  { id:25, team1:"Germany",      team2:"Curaçao",      date:"2026-06-14T17:00:00Z" },
  { id:26, team1:"Ivory Coast",  team2:"Ecuador",      date:"2026-06-14T23:00:00Z" },
  { id:27, team1:"Germany",      team2:"Ivory Coast",  date:"2026-06-20T20:00:00Z" },
  { id:28, team1:"Ecuador",      team2:"Curaçao",      date:"2026-06-21T00:00:00Z" },
  { id:29, team1:"Curaçao",      team2:"Ivory Coast",  date:"2026-06-25T20:00:00Z" },
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
  { id:60, team1:"Jordan",       team2:"Argentina",      date:"2026-06-28T02:00:00Z" },
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

// Deterministic "random" - same match ID always gives same score
function pseudoRandom(seed, offset) {
  const x = Math.sin(seed * 9301 + offset * 49297) * 10000;
  return x - Math.floor(x);
}

function generateDemoData() {
  const now = new Date();
  const games = [];
  
  for (const f of FIXTURES) {
    const matchDate = new Date(f.date);
    const matchEnd = new Date(matchDate.getTime() + 3 * 60 * 60 * 1000);
    
    if (now < matchDate) continue; // match hasn't started yet
    
    const seed = f.id * 1337;
    const hs = Math.floor(pseudoRandom(seed, 1) * 5); // 0-4
    const as = Math.floor(pseudoRandom(seed, 2) * 4); // 0-3
    
    games.push({
      id: f.id,
      home: f.team1,
      away: f.team2,
      homeScore: hs,
      awayScore: as,
      status: now > matchEnd ? 'FT' : 'LIVE',
      completed: now > matchEnd
    });
  }
  
  return {
    games,
    lastUpdated: new Date().toISOString(),
    source: 'DEMO_MODE',
    demo: true,
    sourceCount: 0,
    sourcesUsed: []
  };
}

async function fetchEspn() {
  const https = require('https');
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'site.api.espn.com',
      path: '/apis/site/v2/sports/soccer/fifa.worldcup/scoreboard?dates=20260611-20260720',
      method: 'GET',
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const games = [];
          if (json.events) {
            for (const ev of json.events) {
              const comp = ev.competitions?.[0];
              if (!comp) continue;
              const h = comp.competitors?.find(c => c.homeAway === 'home');
              const a = comp.competitors?.find(c => c.homeAway === 'away');
              if (!h?.team?.name || !a?.team?.name) continue;
              const state = ev.status?.type?.state;
              games.push({
                id: null,
                home: h.team.name,
                away: a.team.name,
                homeScore: h.score !== undefined ? parseInt(h.score) : null,
                awayScore: a.score !== undefined ? parseInt(a.score) : null,
                status: state === 'post' ? 'FT' : (state === 'in' ? 'LIVE' : 'Scheduled'),
                completed: state === 'post'
              });
            }
          }
          resolve({ source: 'ESPN', games });
        } catch (e) {
          resolve({ source: 'ESPN', games: [] });
        }
      });
    });
    req.on('error', () => resolve({ source: 'ESPN', games: [] }));
    req.on('timeout', () => { req.destroy(); resolve({ source: 'ESPN', games: [] }); });
    req.end();
  });
}

async function main() {
  let output;
  
  if (DEMO_MODE) {
    console.log('⚠️ DEMO_MODE enabled - generating deterministic demo data');
    output = generateDemoData();
  } else {
    console.log('Trying ESPN API...');
    const espn = await fetchEspn();
    
    if (espn.games.length > 0) {
      output = {
        games: espn.games,
        lastUpdated: new Date().toISOString(),
        source: 'ESPN',
        sourceCount: 1,
        sourcesUsed: ['ESPN']
      };
    } else {
      console.log('No real data found. Writing empty file.');
      output = {
        games: [],
        lastUpdated: new Date().toISOString(),
        source: 'No live data',
        sourceCount: 0,
        sourcesUsed: [],
        message: 'No matches found. Set DEMO_MODE=true for demo data.'
      };
    }
  }
  
  const outDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'live.json'), JSON.stringify(output, null, 2));
  console.log(`✅ Written ${output.games.length} games to data/live.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  // NEVER crash the workflow - write a fallback file
  const outDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'live.json'), JSON.stringify({
    games: [],
    lastUpdated: new Date().toISOString(),
    source: 'Error fallback',
    error: err.message
  }, null, 2));
  console.log('⚠️ Wrote error fallback file so workflow stays green');
});
