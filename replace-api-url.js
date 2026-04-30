#!/usr/bin/env node
/**
 * Injects API_URL into environment.production.ts before the Angular build.
 * Used by the "prebuild" npm script and Docker builds.
 *
 * Usage:
 *   API_URL=https://api.yourdomain.com npm run build
 */
const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL;

if (!apiUrl) {
  console.log('[replace-api-url] API_URL not set — keeping value from environment.production.ts');
  process.exit(0);
}

const cleanUrl = apiUrl.replace(/\/+$/, '');
const file = path.join(__dirname, 'src', 'environments', 'environment.production.ts');

let content = fs.readFileSync(file, 'utf8');
content = content.replace(/apiUrl:\s*'[^']*'/, `apiUrl: '${cleanUrl}'`);
fs.writeFileSync(file, content, 'utf8');

console.log(`[replace-api-url] apiUrl set to "${cleanUrl}"`);
