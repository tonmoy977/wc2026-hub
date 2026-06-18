const fs = require('fs');
const https = require('https');

// Use proxy to bypass GitHub IP block
const SOURCE_URL = 'https://api.allorigins.win/raw?url=https://worldcup26.ir/get/games';
const OUTPUT_PATH = './data/live.json';

function fetchJSON() {
  return new Promise((resolve, reject) => {
    const req = https.get(SOURCE_URL, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout (30s)'));
    });
    req.on('error', reject);
  });
}

async function main() {
  try {
    const raw = await fetchJSON();
    const json = JSON.parse(raw);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(json, null, 2));
    const count = Array.isArray(json) ? json.length : 
                  (json.games?.length || json.matches?.length || json.fixtures?.length || 'unknown');
    console.log(`✅ Saved ${count} matches to ${OUTPUT_PATH}`);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

main();
