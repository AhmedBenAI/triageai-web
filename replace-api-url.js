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

const apiUrl = (process.env.API_URL || '').replace(/\/+$/, ''); // strip trailing slash
const file = path.join(__dirname, 'src', 'environments', 'environment.production.ts');

let content = fs.readFileSync(file, 'utf8');
content = content.replace(/apiUrl:\s*'[^']*'/, `apiUrl: '${apiUrl}'`);
fs.writeFileSync(file, content, 'utf8');

if (apiUrl) {
  console.log(`[replace-api-url] apiUrl set to "${apiUrl}"`);
} else {
  console.log('[replace-api-url] API_URL not set — using relative URLs (nginx proxy mode)');
}
