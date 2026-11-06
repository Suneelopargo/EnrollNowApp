import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.resolve(__dirname, '..');
const srcDir = path.join(pkgRoot, 'src');
const distDir = path.join(pkgRoot, 'dist');
const pkgJsonPath = path.join(pkgRoot, 'package.json');

const srcEsmPath = path.join(srcDir, 'index.js');
const srcDtsPath = path.join(srcDir, 'index.d.ts');

if (!fs.existsSync(srcEsmPath)) {
  console.error(`[administrator-ui] Build failed: missing source file ${srcEsmPath}`);
  process.exit(1);
}
if (!fs.existsSync(srcDtsPath)) {
  console.error(`[administrator-ui] Build failed: missing type declaration source ${srcDtsPath}`);
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });

const esmSource = fs.readFileSync(srcEsmPath, 'utf8');
const dtsSource = fs.readFileSync(srcDtsPath, 'utf8');

// 1. Write ESM bundle (dist/administrator-ui.js)
const distEsmPath = path.join(distDir, 'administrator-ui.js');
fs.writeFileSync(distEsmPath, esmSource, 'utf8');

// 2. Transform ESM source into CommonJS/UMD bundle (dist/administrator-ui.umd.cjs)
const cjsBody = esmSource
  .replace(
    /^import\s+React,\s*\{\s*([^}]+)\s*\}\s*from\s*['"]react['"];?\s*$/m,
    'const React = require("react");\nconst { $1 } = React;'
  )
  .replace(/export\s+const\s+(\w+)\s*=/g, 'const $1 = exports.$1 =')
  .replace(/export\s+default\s+Administrator;?\s*$/m, 'exports.default = Administrator;\nmodule.exports = Object.assign(exports.default, exports);');

const distUmdPath = path.join(distDir, 'administrator-ui.umd.cjs');
fs.writeFileSync(distUmdPath, `'use strict';\n${cjsBody}\n`, 'utf8');

// 3. Write TypeScript declarations (dist/index.d.ts)
const distDtsPath = path.join(distDir, 'index.d.ts');
fs.writeFileSync(distDtsPath, dtsSource, 'utf8');

// 4. Verify all artifacts declared in package.json exist and are non-empty
const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
const requiredOutputs = [
  pkgJson.main,
  pkgJson.module,
  pkgJson.types,
  pkgJson.exports?.['.']?.import,
  pkgJson.exports?.['.']?.require,
  pkgJson.exports?.['.']?.types,
].filter(Boolean);

for (const relPath of new Set(requiredOutputs)) {
  const fullPath = path.resolve(pkgRoot, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[administrator-ui] Build verification failed: missing output artifact ${relPath}`);
    process.exit(1);
  }
  const stat = fs.statSync(fullPath);
  if (stat.size === 0) {
    console.error(`[administrator-ui] Build verification failed: empty output artifact ${relPath}`);
    process.exit(1);
  }
}

console.log('[administrator-ui] Built and verified dist/administrator-ui.js, dist/administrator-ui.umd.cjs, and dist/index.d.ts');
