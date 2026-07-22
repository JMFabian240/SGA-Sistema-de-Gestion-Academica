const { build } = require('esbuild');
const { execSync } = require('child_process');

async function run() {
  console.log('Bundling backend with esbuild...');
  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'server.bundle.js',
    // Prisma client uses dynamic require for the engine, so it must be externalized.
    // fastify-multipart and bcryptjs have native bindings or strict require structures.
    external: [
      '@prisma/client',
      'bcryptjs',
      '@fastify/multipart'
    ],
    define: {
      'import.meta.url': 'import_meta.url',
    },
    banner: {
      js: "const import_meta = { url: require('url').pathToFileURL(__filename).href };",
    },
  });

  console.log('Running pkg on bundled file...');
  // Package ONLY the bundle and required assets.
  execSync('npx pkg server.bundle.js --targets node18-win-x64 --output ../app-tauri/src-tauri/binaries/sga-back-x86_64-pc-windows-msvc.exe', { stdio: 'inherit' });
  
  console.log('Sidecar build complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
