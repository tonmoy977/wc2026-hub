const fs = require('fs');
const https = require('https');

// CHANGE THIS to the site you want to read from
const SOURCE_URL = 'https://worldcup26.ir/get/games';
const OUTPUT_PATH = './data/live.json';

function fetchJSON() {
  return new Promise((resolve, reject) => {
    https.get(SOURCE_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  try {
    const raw = await fetchJSON();
    const json = JSON.parse(raw);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(json, null, 2));
    const count = Array.isArray(json) ? json.length : 
                  (json.matches?.length || json.fixtures?.length || json.games?.length || 'unknown');
    console.log(`✅ Saved ${count} matches to ${OUTPUT_PATH}`);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

main();
