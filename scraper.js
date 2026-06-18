const fs = require('fs');
const https = require('https');
const path = require('path');

// More reliable proxies – includes fallbacks
const SOURCE_URLS = [
  'https://corsproxy.io/?https://worldcup26.ir/get/games',
  'https://api.allorigins.win/raw?url=https://worldcup26.ir/get/games',
  'https://api.codetabs.com/v1/proxy?quest=https://worldcup26.ir/get/games'
];

const OUTPUT_PATH = path.join(__dirname, 'data', 'live.json');

// Ensure directory exists
if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
}

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 15000 // 15 seconds timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Check if response is valid JSON
        try {
          JSON.parse(data);
          resolve(data);
        } catch (e) {
          reject(new Error('Invalid JSON response from proxy'));
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

async function main() {
  let lastError = '';
  let success = false;

  for (const url of SOURCE_URLS) {
    try {
      console.log(`🔄 Trying: ${url}`);
      const raw = await fetchURL(url);
      const json = JSON.parse(raw);

      // Extract games array
      let games = json.games || json.matches || json.fixtures || json.response || json;
      if (!Array.isArray(games)) {
        games = [games];
      }

      // Filter out empty/invalid entries
      games = games.filter(g => g && typeof g === 'object');

      if (games.length === 0) {
        throw new Error('No games found in response');
      }

      // Write the file
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
        games: games,
        lastUpdated: new Date().toISOString(),
        source: url
      }, null, 2));

      console.log(`✅ SUCCESS via: ${url}`);
      console.log(`   Saved ${games.length} matches to ${OUTPUT_PATH}`);
      success = true;
      break;

    } catch (e) {
      lastError = e.message;
      console.log(`❌ Failed: ${url} - ${e.message}`);
    }
  }

  if (!success) {
    console.error('❌ All sources failed. Last error:', lastError);
    // Create an empty file so the workflow doesn't break
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
      games: [],
      lastUpdated: new Date().toISOString(),
      error: lastError
    }, null, 2));
    console.log('📁 Created empty live.json to prevent workflow failure.');
    process.exit(0); // Exit with 0 so workflow continues
  }
}

main();
