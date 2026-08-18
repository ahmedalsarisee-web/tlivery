const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(
    __dirname,
    '..',
    'node_modules',
    'expo',
    'node_modules',
    '@expo',
    'cli',
    'build',
    'src',
    'start',
    'server',
    'middleware',
    'ManifestMiddleware.js',
  ),
  path.join(
    __dirname,
    '..',
    'node_modules',
    '@expo',
    'cli',
    'build',
    'src',
    'start',
    'server',
    'middleware',
    'ManifestMiddleware.js',
  ),
];

for (const file of candidates) {
  if (!fs.existsSync(file)) {
    continue;
  }

  const source = fs.readFileSync(file, 'utf8');
  const next = source.replace(
    'bytecode: engine === \'hermes\'',
    'bytecode: false',
  );

  if (next !== source) {
    fs.writeFileSync(file, next);
    console.log(
      'Patched Expo manifest to serve JavaScript instead of Hermes bytecode',
    );
  }
}
