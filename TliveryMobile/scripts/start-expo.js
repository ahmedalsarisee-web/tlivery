const {spawn} = require('child_process');
const os = require('os');
const path = require('path');

require('./fix-expo-dev-manifest');

const lanIp = Object.values(os.networkInterfaces())
  .flat()
  .find(
    iface =>
      iface &&
      iface.family === 'IPv4' &&
      !iface.internal &&
      iface.address.startsWith('192.168.'),
  )?.address;

if (lanIp) {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = lanIp;
}

const extraArgs = process.argv.slice(2);
const child = spawn(
  'npx',
  ['expo', 'start', '--offline', '--port', '8081', ...extraArgs],
  {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
    env: process.env,
  },
);

child.on('exit', code => {
  process.exit(code ?? 0);
});
