const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const ngrok = require('@ngrok/ngrok');
const os = require('node:os');

const PORT = 5500;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const NGROK_CONFIG_PATHS = [
  path.join(os.homedir(), '.config', 'ngrok', 'ngrok.yml'),
  path.join(os.homedir(), 'Library', 'Application Support', 'ngrok', 'ngrok.yml'),
  path.join(os.homedir(), '.ngrok2', 'ngrok.yml'),
];

main();

async function main() {
  try {
    // Get ngrok authtoken
    const authtoken = await getNgrokAuthtoken();

    // Create HTTP server
    const server = http.createServer((req, res) => {
      handleRequest(req, res);
    });

    // Start local server
    server.listen(PORT, () => {
      console.log(`\n✓ Local server running on port ${PORT}`);
    });

    // Create ngrok tunnel
    console.log('✓ Starting ngrok tunnel...');

    // Try to use a static domain if available (check ngrok config)
    const domain = getStaticDomain();
    const connectOptions = {
      addr: PORT,
      authtoken: authtoken
    };

    if (domain) {
      connectOptions.domain = domain;
      console.log(`  Using static domain: ${domain}`);
    }

    const listener = await ngrok.connect(connectOptions);

    const url = listener.url();
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Plugin available at:');
    console.log(`   ${url}/dist.zip`);
    console.log('='.repeat(60) + '\n');

    if (!domain) {
      console.log('💡 TIP: URL changes each time on free plan.');
      console.log('   To get a permanent URL, claim your free static domain:');
      console.log('   1. Visit: https://dashboard.ngrok.com/domains');
      console.log('   2. Click "Create Domain" or "New Domain"');
      console.log('   3. Save the domain (e.g., acode-prettier.ngrok-free.app)');
      console.log('   4. Add to ngrok config: ngrok config edit');
      console.log('   5. Add under agent section:');
      console.log('      domain: your-domain.ngrok-free.app\n');
    }

    console.log('Copy the URL above and paste it in Acode:');
    console.log('Settings → Plugins → + → REMOTE\n');

    if (process.send) {
      process.send('OK');
    }
  } catch (error) {
    console.error('\n❌ Error starting server:');
    console.error(error.message);
    process.exit(1);
  }
}

async function getNgrokAuthtoken() {
  // Try to read authtoken from ngrok config file
  for (const configPath of NGROK_CONFIG_PATHS) {
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, 'utf8');
      const match = config.match(/authtoken:\s*([^\s]+)/);
      if (match) {
        return match[1];
      }
    }
  }

  // If not found, show error
  console.error('\n❌ ngrok authtoken not configured!\n');
  console.error('Please follow these steps:');
  console.error('1. Sign up at https://dashboard.ngrok.com/signup');
  console.error('2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken');
  console.error('3. Run: ngrok config add-authtoken <YOUR_TOKEN>\n');
  process.exit(1);
}

function getStaticDomain() {
  // Try to read static domain from ngrok config file
  for (const configPath of NGROK_CONFIG_PATHS) {
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, 'utf8');
      // Look for domain under agent section
      const match = config.match(/domain:\s*([^\s]+)/);
      if (match) {
        return match[1];
      }
    }
  }

  return null;
}

function handleRequest(req, res) {
  // Parse URL and remove query string
  const url = req.url.split('?')[0];

  // Determine file path
  let filePath;
  if (url === '/' || url === '/index.html') {
    filePath = path.join(PROJECT_ROOT, 'index.html');
  } else {
    filePath = path.join(PROJECT_ROOT, url);
  }

  // Security check: ensure file is within project root
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(PROJECT_ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  // Check if path is a directory
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Directory listing not allowed');
    return;
  }

  // Determine content type
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
  };
  const contentType = contentTypes[ext] || 'application/octet-stream';

  // Serve file
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Access-Control-Allow-Origin': '*',
  });

  const readStream = fs.createReadStream(filePath);
  readStream.on('error', (err) => {
    console.error('Error reading file:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end('500 Internal Server Error');
  });
  readStream.pipe(res);
}
