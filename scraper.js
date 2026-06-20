const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================
//  CONFIGURATION
// ============================================================
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const WC_START = '20260611';
const WC_END   = '20260720';

// ---------- FIXTURE MAP ----------
const FIXTURES = [
  { id:1,  team1:"Mexico",       team2:"South Africa" },
  { id:2,  team1:"South Korea",  team2:"Czechia" },
  { id:3,  team1:"Czechia",      team2:"South Africa" },
  { id:4,  team1:"Mexico",       team2:"South Korea" },
  { id:5,  team1:"Czechia",      team2:"Mexico" },
  { id:6,  team1:"South Africa", team2:"South Korea" },
  { id:7,  team1:"Canada",       team2:"Bosnia" },
  { id:8,  team1:"Qatar",        team2:"Switzerland" },
  { id:9,  team1:"Switzerland",  team2:"Bosnia" },
  { id:10, team1:"Canada",       team2:"Qatar" },
  { id:11, team1:"Switzerland",  team2:"Canada" },
  { id:12, team1:"Bosnia",       team2:"Qatar" },
  { id:13, team1:"Brazil",       team2:"Morocco" },
  { id:14, team1:"Haiti",        team2:"Scotland" },
  { id:15, team1:"Scotland",     team2:"Morocco" },
  { id:16, team1:"Brazil",       team2:"Haiti" },
  { id:17, team1:"Scotland",     team2:"Brazil" },
  { id:18, team1:"Morocco",      team2:"Haiti" },
  { id:19, team1:"USA",          team2:"Paraguay" },
  { id:20, team1:"Australia",    team2:"Türkiye" },
  { id:21, team1:"USA",          team2:"Australia" },
  { id:22, team1:"Türkiye",      team2:"Paraguay" },
  { id:23, team1:"Türkiye",      team2:"USA" },
  { id:24, team1:"Paraguay",     team2:"Australia" },
  { id:25, team1:"Germany",      team2:"Curaçao" },
  { id:26, team1:"Ivory Coast",  team2:"Ecuador" },
  { id:27, team1:"Germany",      team2:"Ivory Coast" },
  { id:28, team1:"Ecuador",      team2:"Curaçao" },
  { id:29, team1:"Curaçao",      team2:"Ivory Coast" },
  { id:30, team1:"Ecuador",      team2:"Germany" },
  { id:31, team1:"Netherlands",  team2:"Japan" },
  { id:32, team1:"Sweden",       team2:"Tunisia" },
  { id:33, team1:"Netherlands",  team2:"Sweden" },
  { id:34, team1:"Tunisia",      team2:"Japan" },
  { id:35, team1:"Japan",        team2:"Sweden" },
  { id:36, team1:"Tunisia",      team2:"Netherlands" },
  { id:37, team1:"Belgium",      team2:"Egypt" },
  { id:38, team1:"Iran",         team2:"New Zealand" },
  { id:39, team1:"Belgium",      team2:"Iran" },
  { id:40, team1:"New Zealand",  team2:"Egypt" },
  { id:41, team1:"Egypt",        team2:"Iran" },
  { id:42, team1:"New Zealand",  team2:"Belgium" },
  { id:43, team1:"Spain",        team2:"Cape Verde" },
  { id:44, team1:"Saudi Arabia", team2:"Uruguay" },
  { id:45, team1:"Spain",        team2:"Saudi Arabia" },
  { id:46, team1:"Uruguay",      team2:"Cape Verde" },
  { id:47, team1:"Cape Verde",   team2:"Saudi Arabia" },
  { id:48, team1:"Uruguay",      team2:"Spain" },
  { id:49, team1:"France",       team2:"Senegal" },
  { id:50, team1:"Iraq",         team2:"Norway" },
  { id:51, team1:"France",       team2:"Iraq" },
  { id:52, team1:"Norway",       team2:"Senegal" },
  { id:53, team1:"Norway",       team2:"France" },
  { id:54, team1:"Senegal",      team2:"Iraq" },
  { id:55, team1:"Argentina",    team2:"Algeria" },
  { id:56, team1:"Austria",      team2:"Jordan" },
  { id:57, team1:"Argentina",    team2:"Austria" },
  { id:58, team1:"Jordan",       team2:"Algeria" },
  { id:59, team1:"Algeria",      team2:"Austria" },
  { id:60, team1:"Jordan",       team2:"Argentina" },
  { id:61, team1:"Portugal",     team2:"DR Congo" },
  { id:62, team1:"Uzbekistan",   team2:"Colombia" },
  { id:63, team1:"Portugal",     team2:"Uzbekistan" },
  { id:64, team1:"Colombia",     team2:"DR Congo" },
  { id:65, team1:"Colombia",     team2:"Portugal" },
  { id:66, team1:"DR Congo",     team2:"Uzbekistan" },
  { id:67, team1:"England",      team2:"Croatia" },
  { id:68, team1:"Ghana",        team2:"Panama" },
  { id:69, team1:"England",      team2:"Ghana" },
  { id:70, team1:"Panama",       team2:"Croatia" },
  { id:71, team1:"Panama",       team2:"England" },
  { id:72, team1:"Croatia",      team2:"Ghana" }
];

const TEAM_ALIASES = {
  "Korea Republic":"South Korea","United States":"USA","Czech Republic":"Czechia",
  "Cabo Verde":"Cape Verde","Cote d'Ivoire":"Ivory Coast","IR Iran":"Iran",
  "Congo DR":"DR Congo","Turkiye":"Türkiye","Turkey":"Türkiye","Curacao":"Curaçao",
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

// ---------- HTTP HELPERS ----------
function fetchJson(host, path, headers={}){
  const opts = {
    hostname: host,
    path: path,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', ...headers },
    method: 'GET',
    timeout: 12000
  };
  return new Promise((resolve,reject)=>{
    const req = https.request(opts, (res)=>{
      let d='';
      res.on('data', c=>d+=c);
      res.on('end', ()=>{
        // Detect HTML error pages
        if(d.trim().startsWith('<') || d.trim().startsWith('<!')) {
          return reject(new Error(`HTML response from ${host}`));
        }
        try{ resolve(JSON.parse(d)); }
        catch(e){ reject(new Error(`JSON err ${host}: ${e.message}`)); }
      });
    });
    req.on('error', e=>reject(new Error(`Net err ${host}: ${e.message}`)));
    req.on('timeout', ()=>{ req.destroy(); reject(new Error(`Timeout ${host}`)); });
    req.end();
  });
}

// ---------- DEMO GENERATOR (only when DEMO_MODE=true) ----------
function generateDemoData(){
  const now = new Date();
  const games = [];
  for(const f of FIXTURES){
    const md = new Date(f.date + 'Z');
    const done = now > new Date(md.getTime() + 3*60*60*1000);
    const live = now >= md && now <= new Date(md.getTime() + 3*60*60*1000);
    if(!done && !live) continue;
    let hs = done ? Math.floor(Math.random()*4) : Math.floor(Math.random()*3);
    let as = done ? Math.floor(Math.random()*4) : Math.floor(Math.random()*3);
    games.push({
      id: f.id, home: f.team1, away: f.team2,
      homeScore: hs, awayScore: as,
      status: done ? 'FT' : 'LIVE', completed: done
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

// ---------- SOURCE 1: ESPN (FREE) ----------
async function fetchEspn(){
  console.log('[SRC] ESPN...');
  // Try multiple endpoint variations
  const attempts = [
    `/apis/site/v2/sports/soccer/fifa.worldcup/scoreboard?dates=${WC_START}-${WC_END}`,
    `/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${WC_START}-${WC_END}`,
    `/apis/site/v2/sports/soccer/fifa.worldcup/scoreboard`
  ];
  for(const p of attempts){
    try{
      const data = await fetchJson('site.api.espn.com', p);
      const games = [];
      if(!data?.events) continue;
      for(const ev of data.events){
        const comp = ev.competitions?.[0]; if(!comp) continue;
        const h = comp.competitors?.find(c=>c.homeAway==='home');
        const a = comp.competitors?.find(c=>c.homeAway==='away');
        if(!h?.team?.name || !a?.team?.name) continue;
        const home = norm(h.team.name), away = norm(a.team.name);
        const id = FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
        const state = ev.status?.type?.state;
        let status='Scheduled', completed=false;
        if(state==='in') status='LIVE';
        else if(state==='post'){status='FT';completed=true;}
        games.push({
          id, home:h.team.name, away:a.team.name,
          homeScore: h.score!==undefined?parseInt(h.score):null,
          awayScore: a.score!==undefined?parseInt(a.score):null,
          status, completed
        });
      }
      console.log(`[SRC] ESPN: ${games.length} matches`);
      return {source:'ESPN',games};
    }catch(e){ console.log(`[SRC] ESPN attempt failed: ${e.message}`); }
  }
  return {source:'ESPN',games:[]};
}

// ---------- SOURCE 2: FIFA DIGITAL (FREE) ----------
async function fetchFifa(){
  console.log('[SRC] FIFA...');
  try{
    const data = await fetchJson('digitalhub.fifa.com', '/api/v1/calendar/matches?from=2026-06-11T00:00:00Z&to=2026-07-20T23:59:59Z&language=en&count=500');
    const games=[];
    if(!data?.Results) return {source:'FIFA',games};
    for(const m of data.Results){
      const home=norm(m.Home?.Name||m.HomeTeam?.Name);
      const away=norm(m.Away?.Name||m.AwayTeam?.Name);
      const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
      let status='Scheduled', completed=false;
      const s=m.MatchStatus||m.Status;
      if(s===3||s==='Finished'||s==='FT'){status='FT';completed=true;}
      else if(s===2||s==='Live') status='LIVE';
      games.push({
        id, home:m.Home?.Name||m.HomeTeam?.Name, away:m.Away?.Name||m.AwayTeam?.Name,
        homeScore: m.HomeTeamScore??m.Home?.Score??null,
        awayScore: m.AwayTeamScore??m.Away?.Score??null,
        status, completed
      });
    }
    console.log(`[SRC] FIFA: ${games.length} matches`);
    return {source:'FIFA',games};
  }catch(e){
    console.log(`[SRC] FIFA failed: ${e.message}`);
    return {source:'FIFA',games:[]};
  }
}

// ---------- SOURCE 3: OPENLIGADB (FREE) ----------
async function fetchOpenLigaDB(){
  console.log('[SRC] OpenLigaDB...');
  try{
    const data = await fetchJson('api.openligadb.de', '/getmatchdata/wm2026');
    const games=[];
    if(!Array.isArray(data)) return {source:'OpenLigaDB',games};
    for(const m of data){
      const home=norm(m.Team1?.TeamName), away=norm(m.Team2?.TeamName);
      const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
      const result = m.MatchResults?.find(r=>r.ResultOrderID===1)||m.MatchResults?.[0];
      const hs=result?result.PointsTeam1:null;
      const as=result?result.PointsTeam2:null;
      let status='Scheduled', completed=!!m.MatchIsFinished;
      if(completed) status='FT';
      else if(hs!==null && as!==null) status='LIVE';
      games.push({id,home:m.Team1?.TeamName,away:m.Team2?.TeamName,homeScore:hs,awayScore:as,status,completed});
    }
    console.log(`[SRC] OpenLigaDB: ${games.length} matches`);
    return {source:'OpenLigaDB',games};
  }catch(e){
    console.log(`[SRC] OpenLigaDB failed: ${e.message}`);
    return {source:'OpenLigaDB',games:[]};
  }
}

// ---------- SOURCE 4: THESPORTSDB (FREE DEMO KEY) ----------
async function fetchTheSportsDB(){
  console.log('[SRC] TheSportsDB...');
  try{
    const key = process.env.THESPORTSDB_KEY || '3';
    const data = await fetchJson('www.thesportsdb.com', `/api/v1/json/${key}/eventsseason.php?id=4427&s=2026`);
    const games=[];
    if(!data?.events) return {source:'TheSportsDB',games};
    for(const m of data.events){
      const home=norm(m.strHomeTeam), away=norm(m.strAwayTeam);
      const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
      let status='Scheduled', completed=false;
      const s=m.strStatus||m.strProgress;
      if(s==='FT'||s==='Final'||s==='Finished'){status='FT';completed=true;}
      else if(s==='LIVE'||s==='In Play') status='LIVE';
      games.push({
        id,home:m.strHomeTeam,away:m.strAwayTeam,
        homeScore:m.intHomeScore!==undefined?parseInt(m.intHomeScore):null,
        awayScore:m.intAwayScore!==undefined?parseInt(m.intAwayScore):null,
        status,completed
      });
    }
    console.log(`[SRC] TheSportsDB: ${games.length} matches`);
    return {source:'TheSportsDB',games};
  }catch(e){
    console.log(`[SRC] TheSportsDB failed: ${e.message}`);
    return {source:'TheSportsDB',games:[]};
  }
}

// ---------- SOURCE 5: FOOTBALL-DATA (free tier, needs key) ----------
async function fetchFootballData(){
  const key=process.env.FOOTBALL_DATA_KEY;
  if(!key){ console.log('[SKIP] Football-Data: no key'); return {source:'Football-Data',games:[]}; }
  console.log('[SRC] Football-Data...');
  try{
    const data=await fetchJson('api.football-data.org','/v4/competitions/WC/matches?season=2026',{'X-Auth-Token':key});
    const games=[];
    if(!data?.matches) return {source:'Football-Data',games};
    for(const m of data.matches){
      const home=norm(m.homeTeam?.name), away=norm(m.awayTeam?.name);
      const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
      let status='Scheduled', completed=false;
      const s=m.status;
      if(s==='IN_PLAY'||s==='LIVE') status='LIVE';
      else if(s==='FINISHED'){status='FT';completed=true;}
      games.push({id,home:m.homeTeam?.name,away:m.awayTeam?.name,homeScore:m.score?.fullTime?.home??null,awayScore:m.score?.fullTime?.away??null,status,completed});
    }
    console.log(`[SRC] Football-Data: ${games.length} matches`);
    return {source:'Football-Data',games};
  }catch(e){
    console.log(`[SRC] Football-Data failed: ${e.message}`);
    return {source:'Football-Data',games:[]};
  }
}

// ---------- SOURCE 6: API-FOOTBALL (RapidAPI free tier) ----------
async function fetchApiFootball(){
  const key=process.env.API_FOOTBALL_KEY;
  if(!key){ console.log('[SKIP] API-Football: no key'); return {source:'API-Football',games:[]}; }
  console.log('[SRC] API-Football...');
  try{
    const data=await fetchJson('v3.football.api-sports.io',`/fixtures?league=1&season=2026&from=2026-06-11&to=2026-07-20`,{'x-rapidapi-key':key,'x-rapidapi-host':'v3.football.api-sports.io'});
    const games=[];
    if(!data?.response) return {source:'API-Football',games};
    for(const f of data.response){
      const home=norm(f.teams?.home?.name), away=norm(f.teams?.away?.name);
      const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
      let status='Scheduled', completed=false;
      const short=f.fixture?.status?.short;
      if(['1H','2H','HT','ET','P','LIVE'].includes(short)) status='LIVE';
      else if(['FT','AET','PEN'].includes(short)){status='FT';completed=true;}
      games.push({id,home:f.teams?.home?.name,away:f.teams?.away?.name,homeScore:f.goals?.home,awayScore:f.goals?.away,status,completed});
    }
    console.log(`[SRC] API-Football: ${games.length} matches`);
    return {source:'API-Football',games};
  }catch(e){
    console.log(`[SRC] API-Football failed: ${e.message}`);
    return {source:'API-Football',games:[]};
  }
}

// ---------- SOURCE 7: SPORTMONKS (free tier) ----------
async function fetchSportmonks(){
  const key=process.env.SPORTMONKS_KEY;
  if(!key){ console.log('[SKIP] Sportmonks: no key'); return {source:'Sportmonks',games:[]}; }
  console.log('[SRC] Sportmonks...');
  try{
    const data=await fetchJson('api.sportmonks.com',`/v3/football/fixtures?filters=season=2026;league=732&include=scores;participants&api_token=${key}`);
    const games=[];
    if(!data?.data) return {source:'Sportmonks',games};
    for(const m of data.data){
      const p = m.participants || [];
      const hName = p[0]?.name || p[0]?.display_name;
      const aName = p[1]?.name || p[1]?.display_name;
      const home=norm(hName), away=norm(aName);
      const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
      let status='Scheduled', completed=false;
      const s=m.state?.short_name;
      if(s==='FT'||s==='Finished'){status='FT';completed=true;}
      else if(s==='LIVE'||s==='1H'||s==='2H') status='LIVE';
      const sc=m.scores?.find(x=>x.description==='CURRENT')||m.scores?.[0];
      games.push({id,home:hName,away:aName,homeScore:sc?.score?.participant_home??null,awayScore:sc?.score?.participant_away??null,status,completed});
    }
    console.log(`[SRC] Sportmonks: ${games.length} matches`);
    return {source:'Sportmonks',games};
  }catch(e){
    console.log(`[SRC] Sportmonks failed: ${e.message}`);
    return {source:'Sportmonks',games:[]};
  }
}

// ---------- SOURCE 8: LIVESCORE-API (free tier) ----------
async function fetchLivescore(){
  const key=process.env.LIVESCORE_API_KEY;
  if(!key){ console.log('[SKIP] Livescore: no key'); return {source:'Livescore',games:[]}; }
  const secret=process.env.LIVESCORE_API_SECRET||'';
  console.log('[SRC] Livescore...');
  try{
    const data=await fetchJson('livescore-api.com',`/api-client/scores/live.json?key=${key}&secret=${secret}&competition_id=2`);
    const games=[];
    const arr=data?.data?.match||data?.matches;
    if(!arr) return {source:'Livescore',games};
    for(const m of arr){
      const home=norm(m.home_name), away=norm(m.away_name);
      const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
      let status='Scheduled', completed=false;
      if(m.status==='FINISHED'||m.status==='FT'){status='FT';completed=true;}
      else if(m.status==='LIVE'||m.status==='IN PLAY') status='LIVE';
      const score=m.score?.split(/\s*[-–—]\s*/);
      games.push({id,home:m.home_name,away:m.away_name,homeScore:score?parseInt(score[0]):null,awayScore:score?parseInt(score[1]):null,status,completed});
    }
    console.log(`[SRC] Livescore: ${games.length} matches`);
    return {source:'Livescore',games};
  }catch(e){
    console.log(`[SRC] Livescore failed: ${e.message}`);
    return {source:'Livescore',games:[]};
  }
}

// ---------- CROSS-VALIDATION ----------
function crossValidate(results){
  console.log(`[VALIDATE] Merging ${results.length} source(s)...`);
  const map={};
  for(const res of results){
    for(const g of res.games){
      if(!map[g.id]) map[g.id]={scores:{},statuses:{},sources:[],home:g.home,away:g.away};
      const sk=`${g.homeScore}-${g.awayScore}`;
      map[g.id].scores[sk]=(map[g.id].scores[sk]||0)+1;
      map[g.id].statuses[g.status]=(map[g.id].statuses[g.status]||0)+1;
      map[g.id].sources.push(res.source);
    }
  }
  const final=[];
  for(const [idStr,data] of Object.entries(map)){
    let bestScore=null,bestScoreC=0;
    for(const [sk,c] of Object.entries(data.scores)){if(c>bestScoreC){bestScoreC=c;bestScore=sk;}}
    let bestStatus=null,bestStatusC=0;
    for(const [st,c] of Object.entries(data.statuses)){if(c>bestStatusC){bestStatusC=c;bestStatus=st;}}
    const [hs,as]=bestScore?bestScore.split('-').map(Number):[null,null];
    final.push({
      id:parseInt(idStr),home:data.home,away:data.away,
      homeScore:hs,awayScore:as,
      status:bestStatus||'Scheduled',
      completed:bestStatus==='FT',
      sourceAgreement:`${bestScoreC}/${data.sources.length} agree`,
      sources:[...new Set(data.sources)]
    });
  }
  return final;
}

// ---------- MAIN ----------
async function main(){
  // If demo mode is on, generate demo data immediately
  if(DEMO_MODE){
    console.log('⚠️  DEMO_MODE is enabled. Generating labeled demo data.');
    const demo = generateDemoData();
    const outDir=path.join(__dirname,'data');
    if(!fs.existsSync(outDir)) fs.mkdirSync(outDir,{recursive:true});
    fs.writeFileSync(path.join(outDir,'live.json'),JSON.stringify(demo,null,2));
    console.log(`✅ DEMO data written: ${demo.games.length} games`);
    return;
  }

  const sources = [
    fetchEspn(), fetchFifa(), fetchOpenLigaDB(), fetchTheSportsDB(),
    fetchFootballData(), fetchApiFootball(), fetchSportmonks(), fetchLivescore()
  ];

  const settled = await Promise.all(sources);
  const results = settled.filter(r => r.games.length > 0);

  let output;
  if(results.length === 0){
    console.log('[WARN] All real sources returned zero matches. Writing empty file.');
    output = {
      games: [],
      lastUpdated: new Date().toISOString(),
      source: 'No live data available',
      sourceCount: 0,
      sourcesUsed: [],
      message: 'No matches found. Tournament may not have started yet, or all APIs are empty. Set DEMO_MODE=true for demo data.'
    };
  } else if(results.length === 1){
    output = {
      games: results[0].games,
      lastUpdated: new Date().toISOString(),
      source: results[0].source,
      sourceCount: 1,
      sourcesUsed: [results[0].source]
    };
  } else {
    const merged = crossValidate(results);
    output = {
      games: merged,
      lastUpdated: new Date().toISOString(),
      source: `Cross-validated (${results.map(r=>r.source).join('+')})`,
      sourceCount: results.length,
      sourcesUsed: results.map(r=>r.source)
    };
  }

  const outDir = path.join(__dirname,'data');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,'live.json'),JSON.stringify(output,null,2));
  console.log(`✅ Written ${output.games.length} games to data/live.json`);
}

main().catch(err=>{
  console.error('Fatal:',err);
  process.exit(1);
});
