const fs = require('fs');
const https = require('https');

// Try multiple proxies in order
const SOURCE_URLS = [
  'https://corsproxy.io/?https://worldcup26.ir/get/games',
  'https://api.codetabs.com/v1/proxy?quest=https://worldcup26.ir/get/games',
  'https://api.allorigins.win/raw?url=https://worldcup26.ir/get/games'
];

const OUTPUT_PATH = './data/live.json';

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

async function main() {
  let lastError = '';
  for (const url of SOURCE_URLS) {
    try {
      const raw = await fetchURL(url);
      const json = JSON.parse(raw);
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(json, null, 2));
      console.log(`✅ Success via: ${url}`);
      return;
    } catch (e) {
      lastError = e.message;
      console.log(`❌ Failed: ${url} - ${e.message}`);
    }
  }
  console.error('All sources failed:', lastError);
  process.exit(1);
}

main();
