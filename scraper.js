const fs = require('fs');
const path = require('path');

// ===== FIXTURE LIST (must match index.html IDs exactly) =====
const FIXTURES = [
    { id: 1, group: "A", team1: "Mexico", team2: "South Africa", date: "2026-06-11T19:00:00Z" },
    { id: 2, group: "A", team1: "South Korea", team2: "Czechia", date: "2026-06-12T02:00:00Z" },
    { id: 3, group: "A", team1: "Czechia", team2: "South Africa", date: "2026-06-18T16:00:00Z" },
    { id: 4, group: "A", team1: "Mexico", team2: "South Korea", date: "2026-06-19T01:00:00Z" },
    { id: 5, group: "A", team1: "Czechia", team2: "Mexico", date: "2026-06-25T01:00:00Z" },
    { id: 6, group: "A", team1: "South Africa", team2: "South Korea", date: "2026-06-25T01:00:00Z" },
    { id: 7, group: "B", team1: "Canada", team2: "Bosnia", date: "2026-06-12T19:00:00Z" },
    { id: 8, group: "B", team1: "Qatar", team2: "Switzerland", date: "2026-06-13T19:00:00Z" },
    { id: 9, group: "B", team1: "Switzerland", team2: "Bosnia", date: "2026-06-18T19:00:00Z" },
    { id: 10, group: "B", team1: "Canada", team2: "Qatar", date: "2026-06-19T22:00:00Z" },
    { id: 11, group: "B", team1: "Switzerland", team2: "Canada", date: "2026-06-24T19:00:00Z" },
    { id: 12, group: "B", team1: "Bosnia", team2: "Qatar", date: "2026-06-24T19:00:00Z" },
    { id: 13, group: "C", team1: "Brazil", team2: "Morocco", date: "2026-06-13T22:00:00Z" },
    { id: 14, group: "C", team1: "Haiti", team2: "Scotland", date: "2026-06-14T01:00:00Z" },
    { id: 15, group: "C", team1: "Scotland", team2: "Morocco", date: "2026-06-19T22:00:00Z" },
    { id: 16, group: "C", team1: "Brazil", team2: "Haiti", date: "2026-06-20T00:30:00Z" },
    { id: 17, group: "C", team1: "Scotland", team2: "Brazil", date: "2026-06-24T22:00:00Z" },
    { id: 18, group: "C", team1: "Morocco", team2: "Haiti", date: "2026-06-24T22:00:00Z" },
    { id: 19, group: "D", team1: "USA", team2: "Paraguay", date: "2026-06-13T01:00:00Z" },
    { id: 20, group: "D", team1: "Australia", team2: "Türkiye", date: "2026-06-14T04:00:00Z" },
    { id: 21, group: "D", team1: "USA", team2: "Australia", date: "2026-06-19T19:00:00Z" },
    { id: 22, group: "D", team1: "Türkiye", team2: "Paraguay", date: "2026-06-20T03:00:00Z" },
    { id: 23, group: "D", team1: "Türkiye", team2: "USA", date: "2026-06-26T02:00:00Z" },
    { id: 24, group: "D", team1: "Paraguay", team2: "Australia", date: "2026-06-26T02:00:00Z" },
    { id: 25, group: "E", team1: "Germany", team2: "Curaçao", date: "2026-06-14T17:00:00Z" },
    { id: 26, group: "E", team1: "Ivory Coast", team2: "Ecuador", date: "2026-06-14T23:00:00Z" },
    { id: 27, group: "E", team1: "Germany", team2: "Ivory Coast", date: "2026-06-20T20:00:00Z" },
    { id: 28, group: "E", team1: "Ecuador", team2: "Curaçao", date: "2026-06-21T00:00:00Z" },
    { id: 29, group: "E", team1: "Curaçao", team2: "Ivory Coast", date: "2026-06-25T20:00:00Z" },
    { id: 30, group: "E", team1: "Ecuador", team2: "Germany", date: "2026-06-25T20:00:00Z" },
    { id: 31, group: "F", team1: "Netherlands", team2: "Japan", date: "2026-06-13T20:00:00Z" },
    { id: 32, group: "F", team1: "Sweden", team2: "Tunisia", date: "2026-06-14T02:00:00Z" },
    { id: 33, group: "F", team1: "Netherlands", team2: "Sweden", date: "2026-06-20T17:00:00Z" },
    { id: 34, group: "F", team1: "Tunisia", team2: "Japan", date: "2026-06-21T04:00:00Z" },
    { id: 35, group: "F", team1: "Japan", team2: "Sweden", date: "2026-06-25T23:00:00Z" },
    { id: 36, group: "F", team1: "Tunisia", team2: "Netherlands", date: "2026-06-25T23:00:00Z" },
    { id: 37, group: "G", team1: "Belgium", team2: "Egypt", date: "2026-06-14T19:00:00Z" },
    { id: 38, group: "G", team1: "Iran", team2: "New Zealand", date: "2026-06-15T01:00:00Z" },
    { id: 39, group: "G", team1: "Belgium", team2: "Iran", date: "2026-06-21T19:00:00Z" },
    { id: 40, group: "G", team1: "New Zealand", team2: "Egypt", date: "2026-06-22T01:00:00Z" },
    { id: 41, group: "G", team1: "Egypt", team2: "Iran", date: "2026-06-27T03:00:00Z" },
    { id: 42, group: "G", team1: "New Zealand", team2: "Belgium", date: "2026-06-27T03:00:00Z" },
    { id: 43, group: "H", team1: "Spain", team2: "Cape Verde", date: "2026-06-14T16:00:00Z" },
    { id: 44, group: "H", team1: "Saudi Arabia", team2: "Uruguay", date: "2026-06-14T22:00:00Z" },
    { id: 45, group: "H", team1: "Spain", team2: "Saudi Arabia", date: "2026-06-21T16:00:00Z" },
    { id: 46, group: "H", team1: "Uruguay", team2: "Cape Verde", date: "2026-06-21T22:00:00Z" },
    { id: 47, group: "H", team1: "Cape Verde", team2: "Saudi Arabia", date: "2026-06-27T00:00:00Z" },
    { id: 48, group: "H", team1: "Uruguay", team2: "Spain", date: "2026-06-27T00:00:00Z" },
    { id: 49, group: "I", team1: "France", team2: "Senegal", date: "2026-06-15T19:00:00Z" },
    { id: 50, group: "I", team1: "Iraq", team2: "Norway", date: "2026-06-15T22:00:00Z" },
    { id: 51, group: "I", team1: "France", team2: "Iraq", date: "2026-06-22T21:00:00Z" },
    { id: 52, group: "I", team1: "Norway", team2: "Senegal", date: "2026-06-23T00:00:00Z" },
    { id: 53, group: "I", team1: "Norway", team2: "France", date: "2026-06-26T19:00:00Z" },
    { id: 54, group: "I", team1: "Senegal", team2: "Iraq", date: "2026-06-26T19:00:00Z" },
    { id: 55, group: "J", team1: "Argentina", team2: "Algeria", date: "2026-06-16T01:00:00Z" },
    { id: 56, group: "J", team1: "Austria", team2: "Jordan", date: "2026-06-16T04:00:00Z" },
    { id: 57, group: "J", team1: "Argentina", team2: "Austria", date: "2026-06-22T17:00:00Z" },
    { id: 58, group: "J", team1: "Jordan", team2: "Algeria", date: "2026-06-23T03:00:00Z" },
    { id: 59, group: "J", team1: "Algeria", team2: "Austria", date: "2026-06-28T02:00:00Z" },
    { id: 60, group: "J", team1: "Jordan", team2: "Argentina", date: "2026-06-28T02:00:00Z" },
    { id: 61, group: "K", team1: "Portugal", team2: "DR Congo", date: "2026-06-16T17:00:00Z" },
    { id: 62, group: "K", team1: "Uzbekistan", team2: "Colombia", date: "2026-06-17T02:00:00Z" },
    { id: 63, group: "K", team1: "Portugal", team2: "Uzbekistan", date: "2026-06-23T17:00:00Z" },
    { id: 64, group: "K", team1: "Colombia", team2: "DR Congo", date: "2026-06-24T02:00:00Z" },
    { id: 65, group: "K", team1: "Colombia", team2: "Portugal", date: "2026-06-27T23:30:00Z" },
    { id: 66, group: "K", team1: "DR Congo", team2: "Uzbekistan", date: "2026-06-27T23:30:00Z" },
    { id: 67, group: "L", team1: "England", team2: "Croatia", date: "2026-06-16T20:00:00Z" },
    { id: 68, group: "L", team1: "Ghana", team2: "Panama", date: "2026-06-16T23:00:00Z" },
    { id: 69, group: "L", team1: "England", team2: "Ghana", date: "2026-06-23T20:00:00Z" },
    { id: 70, group: "L", team1: "Panama", team2: "Croatia", date: "2026-06-23T23:00:00Z" },
    { id: 71, group: "L", team1: "Panama", team2: "England", date: "2026-06-27T21:00:00Z" },
    { id: 72, group: "L", team1: "Croatia", team2: "Ghana", date: "2026-06-27T21:00:00Z" }
];

// ===== TEAM NAME NORMALIZATION (must match index.html mapTeamName) =====
const TEAM_MAP = {
    "Korea Republic": "South Korea",
    "United States": "USA",
    "Czech Republic": "Czechia",
    "Cabo Verde": "Cape Verde",
    "Cote d'Ivoire": "Ivory Coast",
    "IR Iran": "Iran",
    "Congo DR": "DR Congo",
    "Turkiye": "Türkiye",
    "Turkey": "Türkiye"
};

function normalizeTeam(name) {
    if (!name) return null;
    return TEAM_MAP[name] || name;
}

// ===== MOCK GENERATOR (replace with real API call when available) =====
function generateMockData() {
    const now = new Date();
    const games = [];

    for (const f of FIXTURES) {
        const matchDate = new Date(f.date);
        const matchEnd = new Date(matchDate.getTime() + 3 * 60 * 60 * 1000);
        const isFinished = now > matchEnd;
        const isLive = now >= matchDate && now <= matchEnd;

        let homeScore = null;
        let awayScore = null;
        let completed = false;
        let status = 'Scheduled';

        if (isFinished) {
            homeScore = Math.floor(Math.random() * 4);
            awayScore = Math.floor(Math.random() * 4);
            completed = true;
            status = 'FT';
        } else if (isLive) {
            homeScore = Math.floor(Math.random() * 3);
            awayScore = Math.floor(Math.random() * 3);
            status = 'LIVE';
        }

        games.push({
            id: f.id,
            home: f.team1,
            away: f.team2,
            homeScore,
            awayScore,
            completed,
            status
        });
    }

    return {
        games: games.filter(g => g.status !== 'Scheduled'),
        lastUpdated: new Date().toISOString(),
        source: 'mock-scraper'
    };
}

// ===== MAIN =====
async function main() {
    try {
        // TODO: If you have a real API, fetch it here and map the response
        // const data = await fetchFromRealApi();
        const data = generateMockData();

        const outDir = path.join(__dirname, 'data');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        fs.writeFileSync(path.join(outDir, 'live.json'), JSON.stringify(data, null, 2));
        console.log(`✅ Written ${data.games.length} games to data/live.json at ${data.lastUpdated}`);
    } catch (err) {
        console.error('❌ Scraper failed:', err);
        process.exit(1);
    }
}

main();
