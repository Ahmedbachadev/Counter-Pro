import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

esbuild.build({
  entryPoints: [path.resolve(__dirname, '../src/database/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: path.resolve(__dirname, '../public/localdb.cjs'),
  external: ['better-sqlite3', 'electron'], // native modules must be external
}).then(() => {
  console.log('✅ Local database layer compiled successfully.');
}).catch(() => process.exit(1));
