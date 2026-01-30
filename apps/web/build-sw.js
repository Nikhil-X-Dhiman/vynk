// build-sw.js
const esbuild = require('esbuild');

// Context creates a persistent builder (great for --watch)
esbuild.context({
  entryPoints: ['worker/index.ts'], // Your Source
  outfile: 'public/sw.js',          // Your Destination
  bundle: true,                     // Bundle all dependencies (Dexie, Workbox)
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  define: {
    // 1. Fix: Replace process.env for the browser
    'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`,

    // 2. Fix: The plugin usually provides this.
    // Since we are manual, we set it to empty.
    // Your "StaleWhileRevalidate" route in index.ts handles caching instead!
    'self.__WB_MANIFEST': '[]',
  },
}).then(async ctx => {
  console.log('⚡ Service Worker built successfully!');

  if (process.argv.includes('--watch')) {
    await ctx.watch();
    console.log('👀 Watching worker/index.ts for changes...');
  } else {
    await ctx.dispose();
  }
}).catch(err => {
  console.error(err);
  process.exit(1);
});
