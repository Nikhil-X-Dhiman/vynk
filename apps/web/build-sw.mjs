/**
 * @fileoverview Service Worker Build Script
 *
 * Bundles the TypeScript service worker source into a production-ready JavaScript
 * file using esbuild. Supports both one-time builds and watch mode for development.
 *
 * @example
 * ```bash
 * # Production build
 * NODE_ENV=production node build-sw.mjs
 *
 * # Development watch mode
 * node build-sw.mjs --watch
 * ```
 *
 * @module build-sw
 */

import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

// ==========================================
// Configuration
// ==========================================

/** Current file path (ESM equivalent of __filename) */
const __filename = fileURLToPath(import.meta.url);

/** Current directory path (ESM equivalent of __dirname) */
const __dirname = path.dirname(__filename);

/** Whether to build for production (minified, no sourcemaps) */
const IS_PROD = process.env.NODE_ENV === 'production';

/** Whether to watch for file changes and rebuild automatically */
const WATCH_MODE = process.argv.includes('--watch');

/**
 * esbuild configuration for bundling the service worker.
 * @type {import('esbuild').BuildOptions}
 */
const buildConfig = {
  entryPoints: [path.join(__dirname, 'worker/index.ts')],
  outfile: path.join(__dirname, 'public/sw.js'),
  bundle: true,
  minify: IS_PROD,
  sourcemap: !IS_PROD,
  platform: 'browser',
  target: ['es2020'],
  format: 'iife',
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development',
    ),
    // Workbox manifest placeholder - injected during build if using workbox-webpack-plugin
    'self.__WB_MANIFEST': '[]',
  },
  logLevel: 'info',
};

// ==========================================
// Build Functions
// ==========================================

/**
 * Executes the service worker build process.
 *
 * In watch mode, creates a persistent build context that automatically
 * rebuilds when source files change. In production mode, performs a
 * single optimized build.
 *
 * @returns {Promise<void>}
 * @throws {Error} If the build process fails
 */
async function build() {
  try {
    if (WATCH_MODE) {
      const ctx = await esbuild.context(buildConfig);
      await ctx.watch();
      console.log('👀 Watching service worker for changes...');
    } else {
      const result = await esbuild.build(buildConfig);

      if (result.errors.length === 0) {
        console.log('⚡ Service Worker built successfully!');
      }
    }
  } catch (error) {
    console.error('❌ Service Worker build failed:', error);
    process.exit(1);
  }
}

// ==========================================
// Entry Point
// ==========================================

build();
