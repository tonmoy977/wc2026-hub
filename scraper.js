const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================
//  MULTI-SOURCE WORLD CUP 2026 SCRAPER  (12 sources)
// ============================================================
//  FREE  (no key):  ESPN | OpenLigaDB | WorldCupJSON | SofaScore
//                    | TheSportsDB | SportsOpenData | FIFA API
//                    | Worldfootball scrape
//  FREE TIER (key):  Football-Data | API-Football | Sportmonks
//                    | Livescore-API
// ============================================================

const WC_START = '2026-06-11';
const WC_END   = '2026-07-20';

// ---------- FIXTURE MAP (team pair → your internal ID) ----------
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

const ALL_TEAM_NAMES = [...new Set(FIXTURES.flatMap(f=>[f.team1,f.team2]))];

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

// ---------- SOURCE REGISTRY ----------
const SOURCES = [
  { name:'ESPN_API',        weight:10, needsKey:false, fetch:fetchEspnApi },
  { name:'FIFA_API',        weight:9,  needsKey:false, fetch:fetchFifaApi },
  { name:'OPENLIGADB',      weight:8,  needsKey:false, fetch:fetchOpenLigaDB },
  { name:'WORLDCUP_JSON',   weight:7,  needsKey:false, fetch:fetchWorldCupJson },
  { name:'SOFASCORE',       weight:6,  needsKey:false, fetch:fetchSofaScore },
  { name:'THESPORTSDB',     weight:5,  needsKey:false, fetch:fetchTheSportsDB },
  { name:'SPORTSOPENDATA',  weight:4,  needsKey:false, fetch:fetchSportsOpenData },
  { name:'FOOTBALL_DATA',   weight:9,  needsKey:true, envKey:'FOOTBALL_DATA_KEY', fetch:fetchFootballData },
  { name:'API_FOOTBALL',    weight:8,  needsKey:true, envKey:'API_FOOTBALL_KEY',  fetch:fetchApiFootball },
  { name:'SPORTMONKS',      weight:7,  needsKey:true, envKey:'SPORTMONKS_KEY',    fetch:fetchSportmonks },
  { name:'LIVESCORE_API',   weight:6,  needsKey:true, envKey:'LIVESCORE_API_KEY',   fetch:fetchLivescoreApi },
  { name:'WORLDFOOTBALL_SCRAPE', weight:3, needsKey:false, fetch:fetchWorldfootballScrape }
];

// ---------- HTTP HELPERS ----------
function fetchJson(host, path, headers={}, method='GET'){
  return new Promise((resolve,reject)=>{
    const req = https.request({hostname:host,path:headers.path||path,headers,method,timeout:12000},res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d));}catch(e){reject(new Error(`JSON err ${host}: ${e.message}`));} });
    });
    req.on('error',e=>reject(new Error(`Net err ${host}: ${e.message}`)));
    req.on('timeout',()=>{req.destroy();reject(new Error(`Timeout ${host}`));});
    req.end();
  });
}
function fetchHtml(host, path){
  return new Promise((resolve,reject)=>{
    const req = https.request({hostname:host,path,method:'GET',timeout:12000},res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d));
    });
    req.on('error',e=>reject(e));
    req.on('timeout',()=>{req.destroy();reject(new Error('Timeout'));});
    req.end();
  });
}

// ---------- SOURCE 1: ESPN API (FREE) ----------
async function fetchEspnApi(){
  console.log('[SRC] ESPN_API...');
  const data = await fetchJson('site.api.espn.com', `/apis/site/v2/sports/soccer/fifa.worldcup/scoreboard?dates=${WC_START.replace(/-/g,'')}-${WC_END.replace(/-/g,'')}`);
  const games=[];
  if(!data?.events) return {source:'ESPN_API',games};
  for(const ev of data.events){
    const comp=ev.competitions?.[0]; if(!comp) continue;
    const h=comp.competitors?.find(c=>c.homeAway==='home');
    const a=comp.competitors?.find(c=>c.homeAway==='away');
    if(!h?.team?.name || !a?.team?.name) continue;
    const home=norm(h.team.name), away=norm(a.team.name);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    const state=ev.status?.type?.state;
    let status='Scheduled', completed=false;
    if(state==='in') status='LIVE';
    else if(state==='post'){status='FT';completed=true;}
    games.push({id,home:h.team.name,away:a.team.name,homeScore:h.score!==undefined?parseInt(h.score):null,awayScore:a.score!==undefined?parseInt(a.score):null,status,completed});
  }
  console.log(`[SRC] ESPN_API: ${games.length} matches`);
  return {source:'ESPN_API',games};
}

// ---------- SOURCE 2: FIFA API (FREE) ----------
async function fetchFifaApi(){
  console.log('[SRC] FIFA_API...');
  // FIFA digital platform endpoint (public, no key required)
  const data = await fetchJson('api.fifa.com', `/v3/calendar/matches?from=${WC_START}T00:00:00Z&to=${WC_END}T23:59:59Z&language=en&count=500`);
  const games=[];
  if(!data?.Results) return {source:'FIFA_API',games};
  for(const m of data.Results){
    const home=norm(m.Home?.Name||m.HomeTeam?.Name);
    const away=norm(m.Away?.Name||m.AwayTeam?.Name);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    let status='Scheduled', completed=false;
    const s=m.MatchStatus||m.Status;
    if(s===3||s==='Finished'||s==='FT'){status='FT';completed=true;}
    else if(s===2||s==='Live'||s==='InPlay') status='LIVE';
    games.push({id,home:m.Home?.Name||m.HomeTeam?.Name,away:m.Away?.Name||m.AwayTeam?.Name,homeScore:m.HomeTeamScore??m.Home?.Score??null,awayScore:m.AwayTeamScore??m.Away?.Score??null,status,completed});
  }
  console.log(`[SRC] FIFA_API: ${games.length} matches`);
  return {source:'FIFA_API',games};
}

// ---------- SOURCE 3: OPENLIGADB (FREE) ----------
async function fetchOpenLigaDB(){
  console.log('[SRC] OPENLIGADB...');
  const data = await fetchJson('api.openligadb.de', '/getmatchdata/wm2026');
  const games=[];
  if(!Array.isArray(data)) return {source:'OPENLIGADB',games};
  for(const m of data){
    const home=norm(m.Team1?.TeamName), away=norm(m.Team2?.TeamName);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    const result = m.MatchResults?.find(r=>r.ResultOrderID===1)||m.MatchResults?.[0];
    const hs=result?result.PointsTeam1:null;
    const as=result?result.PointsTeam2:null;
    let status='Scheduled', completed=!!m.MatchIsFinished;
    if(completed) status='FT';
    else if(hs!==null && as!==null) status='LIVE'; // has score but not finished
    games.push({id,home:m.Team1?.TeamName,away:m.Team2?.TeamName,homeScore:hs,awayScore:as,status,completed});
  }
  console.log(`[SRC] OPENLIGADB: ${games.length} matches`);
  return {source:'OPENLIGADB',games};
}

// ---------- SOURCE 4: WORLDCUP JSON (FREE) ----------
async function fetchWorldCupJson(){
  console.log('[SRC] WORLDCUP_JSON...');
  const data = await fetchJson('worldcupjson.github.io', '/2026/matches.json');
  const games=[];
  if(!Array.isArray(data)) return {source:'WORLDCUP_JSON',games};
  for(const m of data){
    const home=norm(m.home_team), away=norm(m.away_team);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    let status='Scheduled', completed=!!m.finished;
    if(completed) status='FT';
    else if(m.home_team_goals!==null && m.away_team_goals!==null) status='LIVE';
    games.push({id,home:m.home_team,away:m.away_team,homeScore:m.home_team_goals,awayScore:m.away_team_goals,status,completed});
  }
  console.log(`[SRC] WORLDCUP_JSON: ${games.length} matches`);
  return {source:'WORLDCUP_JSON',games};
}

// ---------- SOURCE 5: SOFASCORE (FREE) ----------
async function fetchSofaScore(){
  console.log('[SRC] SOFASCORE...');
  // Fetch all live football events, then filter by World Cup team names
  const data = await fetchJson('api.sofascore.com', '/api/v1/sport/football/events/live');
  const games=[];
  if(!data?.events) return {source:'SOFASCORE',games};
  for(const ev of data.events){
    const home=norm(ev.homeTeam?.name), away=norm(ev.awayTeam?.name);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    let status='Scheduled', completed=false;
    const s=ev.status?.type;
    if(s==='finished'){status='FT';completed=true;}
    else if(s==='inprogress') status='LIVE';
    games.push({id,home:ev.homeTeam?.name,away:ev.awayTeam?.name,homeScore:ev.homeScore?.current??null,awayScore:ev.awayScore?.current??null,status,completed});
  }
  console.log(`[SRC] SOFASCORE: ${games.length} matches`);
  return {source:'SOFASCORE',games};
}

// ---------- SOURCE 6: THESPORTSDB (FREE) ----------
async function fetchTheSportsDB(){
  console.log('[SRC] THESPORTSDB...');
  const key = process.env.THESPORTSDB_KEY || '3'; // demo key
  const data = await fetchJson('www.thesportsdb.com', `/api/v1/json/${key}/eventsseason.php?id=4427&s=2026`);
  const games=[];
  if(!data?.events) return {source:'THESPORTSDB',games};
  for(const m of data.events){
    const home=norm(m.strHomeTeam), away=norm(m.strAwayTeam);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    let status='Scheduled', completed=false;
    const s=m.strStatus||m.strProgress;
    if(s==='FT'||s==='Final'||s==='Finished'){status='FT';completed=true;}
    else if(s==='LIVE'||s==='In Play') status='LIVE';
    games.push({id,home:m.strHomeTeam,away:m.strAwayTeam,homeScore:m.intHomeScore!==undefined?parseInt(m.intHomeScore):null,awayScore:m.intAwayScore!==undefined?parseInt(m.intAwayScore):null,status,completed});
  }
  console.log(`[SRC] THESPORTSDB: ${games.length} matches`);
  return {source:'THESPORTSDB',games};
}

// ---------- SOURCE 7: SPORTS OPEN DATA (FREE) ----------
async function fetchSportsOpenData(){
  console.log('[SRC] SPORTSOPENDATA...');
  const data = await fetchJson('api.sportsopendata.net', '/v1/soccer/fifawc-2026/matches');
  const games=[];
  if(!data?.matches && !Array.isArray(data)) return {source:'SPORTSOPENDATA',games};
  const arr = data.matches || data;
  for(const m of arr){
    const home=norm(m.home_team||m.home?.name), away=norm(m.away_team||m.away?.name);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    let status='Scheduled', completed=!!m.finished;
    if(completed) status='FT';
    else if(m.home_score!==null && m.away_score!==null) status='LIVE';
    games.push({id,home:m.home_team||m.home?.name,away:m.away_team||m.away?.name,homeScore:m.home_score??m.home?.score??null,awayScore:m.away_score??m.away?.score??null,status,completed});
  }
  console.log(`[SRC] SPORTSOPENDATA: ${games.length} matches`);
  return {source:'SPORTSOPENDATA',games};
}

// ---------- SOURCE 8: FOOTBALL-DATA.ORG (free tier) ----------
async function fetchFootballData(){
  const key=process.env.FOOTBALL_DATA_KEY; if(!key) throw new Error('no key');
  console.log('[SRC] FOOTBALL_DATA...');
  const data=await fetchJson('api.football-data.org','/v4/competitions/WC/matches?season=2026',{'X-Auth-Token':key});
  const games=[];
  if(!data?.matches) return {source:'FOOTBALL_DATA',games};
  for(const m of data.matches){
    const home=norm(m.homeTeam?.name), away=norm(m.awayTeam?.name);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    let status='Scheduled', completed=false;
    const s=m.status;
    if(s==='IN_PLAY'||s==='LIVE') status='LIVE';
    else if(s==='FINISHED'){status='FT';completed=true;}
    games.push({id,home:m.homeTeam?.name,away:m.awayTeam?.name,homeScore:m.score?.fullTime?.home??null,awayScore:m.score?.fullTime?.away??null,status,completed});
  }
  console.log(`[SRC] FOOTBALL_DATA: ${games.length} matches`);
  return {source:'FOOTBALL_DATA',games};
}

// ---------- SOURCE 9: API-FOOTBALL (RapidAPI free tier) ----------
async function fetchApiFootball(){
  const key=process.env.API_FOOTBALL_KEY; if(!key) throw new Error('no key');
  console.log('[SRC] API_FOOTBALL...');
  const data=await fetchJson('v3.football.api-sports.io',`/fixtures?league=1&season=2026&from=${WC_START}&to=${WC_END}`,{'x-rapidapi-key':key,'x-rapidapi-host':'v3.football.api-sports.io'});
  const games=[];
  if(!data?.response) return {source:'API_FOOTBALL',games};
  for(const f of data.response){
    const home=norm(f.teams?.home?.name), away=norm(f.teams?.away?.name);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    let status='Scheduled', completed=false;
    const short=f.fixture?.status?.short;
    if(['1H','2H','HT','ET','P','LIVE'].includes(short)) status='LIVE';
    else if(['FT','AET','PEN'].includes(short)){status='FT';completed=true;}
    games.push({id,home:f.teams?.home?.name,away:f.teams?.away?.name,homeScore:f.goals?.home,awayScore:f.goals?.away,status,completed});
  }
  console.log(`[SRC] API_FOOTBALL: ${games.length} matches`);
  return {source:'API_FOOTBALL',games};
}

// ---------- SOURCE 10: SPORTMONKS (free tier) ----------
async function fetchSportmonks(){
  const key=process.env.SPORTMONKS_KEY; if(!key) throw new Error('no key');
  console.log('[SRC] SPORTMONKS...');
  // World Cup league ID is typically 732 (FIFA World Cup) or similar
  const data=await fetchJson('api.sportmonks.com',`/v3/football/fixtures?filters=season=2026;league=732&include=scores&api_token=${key}`);
  const games=[];
  if(!data?.data) return {source:'SPORTMONKS',games};
  for(const m of data.data){
    const home=norm(m.participants?.[0]?.name), away=norm(m.participants?.[1]?.name);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    let status='Scheduled', completed=false;
    const s=m.state?.short_name||m.state?.name;
    if(s==='FT'||s==='Finished'){status='FT';completed=true;}
    else if(s==='LIVE'||s==='1H'||s==='2H') status='LIVE';
    const scores=m.scores?.find(x=>x.description==='CURRENT')||m.scores?.[0];
    games.push({id,home:m.participants?.[0]?.name,away:m.participants?.[1]?.name,homeScore:scores?.score?.participant_home??null,awayScore:scores?.score?.participant_away??null,status,completed});
  }
  console.log(`[SRC] SPORTMONKS: ${games.length} matches`);
  return {source:'SPORTMONKS',games};
}

// ---------- SOURCE 11: LIVESCORE-API (free tier) ----------
async function fetchLivescoreApi(){
  const key=process.env.LIVESCORE_API_KEY; if(!key) throw new Error('no key');
  const secret=process.env.LIVESCORE_API_SECRET||'';
  console.log('[SRC] LIVESCORE_API...');
  const data=await fetchJson('livescore-api.com','/api-client/scores/live.json?key='+key+'&secret='+secret+'&competition_id=2');
  const games=[];
  const arr=data?.data?.match||data?.matches;
  if(!arr) return {source:'LIVESCORE_API',games};
  for(const m of arr){
    const home=norm(m.home_name), away=norm(m.away_name);
    const id=FIXTURE_MAP[`${home}_${away}`]; if(!id) continue;
    let status='Scheduled', completed=false;
    if(m.status==='FINISHED'||m.status==='FT'){status='FT';completed=true;}
    else if(m.status==='LIVE'||m.status==='IN PLAY') status='LIVE';
    const score=m.score?.split(/\s*[-–—]\s*/);
    games.push({id,home:m.home_name,away:m.away_name,homeScore:score?parseInt(score[0]):null,awayScore:score?parseInt(score[1]):null,status,completed});
  }
  console.log(`[SRC] LIVESCORE_API: ${games.length} matches`);
  return {source:'LIVESCORE_API',games};
}

// ---------- SOURCE 12: WORLDFOOTBALL.NET SCRAPE (free fallback) ----------
async function fetchWorldfootballScrape(){
  console.log('[SRC] WORLDFOOTBALL_SCRAPE...');
  const html = await fetchHtml('www.worldfootball.net','/schedule/fifa-world-cup-2026-group-stage/');
  const games=[];
  // Heuristic: find our team names and nearby score patterns like "2:1" or "2 - 1"
  const scoreRe = /(\d+)\s*[:–\-—]\s*(\d+)/g;
  const positions = [];
  ALL_TEAM_NAMES.forEach(team=>{
    const re = new RegExp(team.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
    let m;
    while((m=re.exec(html))!==null){
      positions.push({idx:m.index,name:team});
    }
  });
  // Pair nearby team names with scores
  for(let i=0;i<positions.length;i++){
    for(let j=i+1;j<positions.length;j++){
      const dist = Math.abs(positions[i].idx-positions[j].idx);
      if(dist>300) continue;
      const slice = html.substring(Math.min(positions[i].idx,positions[j].idx),Math.max(positions[i].idx,positions[j].idx));
      const sm = slice.match(scoreRe);
      if(sm){
        const sc = sm[0].match(/(\d+)/g);
        const home=norm(positions[i].name), away=norm(positions[j].name);
        const id=FIXTURE_MAP[`${home}_${away}`];
        if(id){
          games.push({id,home:positions[i].name,away:positions[j].name,homeScore:parseInt(sc[0]),awayScore:parseInt(sc[1]),status:'FT',completed:true});
        }
      }
    }
  }
  // Deduplicate by id
  const seen=new Set();
  const uniq = games.filter(g=>{if(seen.has(g.id))return false;seen.add(g.id);return true;});
  console.log(`[SRC] WORLDFOOTBALL_SCRAPE: ${uniq.length} matches`);
  return {source:'WORLDFOOTBALL_SCRAPE',games:uniq};
}

// ---------- CROSS-VALIDATION ----------
function crossValidate(results){
  console.log(`[VALIDATE] Merging ${results.length} source(s)...`);
  const map={}; // id -> {scores:{},statuses:{},sources:[],home,away,weights:{}}
  for(const res of results){
    const w = SOURCES.find(s=>s.name===res.source)?.weight||5;
    for(const g of res.games){
      if(!map[g.id]) map[g.id]={scores:{},statuses:{},sources:[],home:g.home,away:g.away,weights:{}};
      const sk=`${g.homeScore}-${g.awayScore}`;
      map[g.id].scores[sk]=(map[g.id].scores[sk]||0)+w;
      map[g.id].statuses[g.status]=(map[g.id].statuses[g.status]||0)+w;
      map[g.id].sources.push(res.source);
      map[g.id].weights[res.source]=w;
    }
  }

  const final=[];
  for(const [idStr,data] of Object.entries(map)){
    let bestScore=null,bestScoreW=0;
    for(const [sk,w] of Object.entries(data.scores)){if(w>bestScoreW){bestScoreW=w;bestScore=sk;}}
    let bestStatus=null,bestStatusW=0;
    for(const [st,w] of Object.entries(data.statuses)){if(w>bestStatusW){bestStatusW=w;bestStatus=st;}}
    const [hs,as]=bestScore?bestScore.split('-').map(Number):[null,null];
    const uniqSources=[...new Set(data.sources)];
    const totalWeight=uniqSources.reduce((a,s)=>a+(data.weights[s]||5),0);
    let confidence='low';
    if(bestScoreW>=20 && uniqSources.length>=3) confidence='high';
    else if(bestScoreW>=10 && uniqSources.length>=2) confidence='medium';
    final.push({
      id:parseInt(idStr),home:data.home,away:data.away,
      homeScore:hs,awayScore:as,
      status:bestStatus||'Scheduled',
      completed:bestStatus==='FT',
      confidence,
      sourceAgreement:`${bestScoreW}/${totalWeight} weight agree`,
      sources:uniqSources
    });
  }
  return final;
}

// ---------- MAIN ----------
async function main(){
  const active = SOURCES.filter(s=>{
    if(!s.needsKey) return true;
    const has=!!process.env[s.envKey];
    if(!has) console.log(`[SKIP] ${s.name}: ${s.envKey} not set`);
    return has;
  });

  if(active.length===0){
    console.error('[FATAL] No sources configured. Set env keys or wait for tournament when free APIs populate.');
    process.exit(1);
  }

  // Fetch all active sources in parallel with 15s timeout each
  const promises = active.map(s=>Promise.race([
    s.fetch().catch(e=>{console.error(`[ERR] ${s.name}: ${e.message}`);return {source:s.name,games:[]};}),
    new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),15000)).then(()=>{throw new Error('timeout');})
  ]).catch(e=>{console.error(`[ERR] ${s.name}: ${e.message}`);return {source:s.name,games:[]};}));

  const settled = await Promise.all(promises);
  const results = settled.filter(r=>r && r.games && r.games.length>0);

  if(results.length===0){
    console.error('[FATAL] All 12 sources returned zero matches. No data written.');
    process.exit(1);
  }

  let finalGames,sourceLabel;
  if(results.length===1){
    finalGames=results[0].games;
    sourceLabel=results[0].source;
  }else{
    finalGames=crossValidate(results);
    sourceLabel=`Cross-validated ${results.length} sources`;
  }

  const output={
    games:finalGames,
    lastUpdated:new Date().toISOString(),
    source:sourceLabel,
    sourceCount:results.length,
    sourcesUsed:results.map(r=>r.source)
  };

  const outDir=path.join(__dirname,'data');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,'live.json'),JSON.stringify(output,null,2));
  console.log(`✅ Written ${finalGames.length} games (${sourceLabel}) to data/live.json`);
}

main().catch(err=>{
  console.error('Fatal:',err);
  process.exit(1);
});
