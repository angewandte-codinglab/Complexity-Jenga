/**
 * Build Script for Complexity-Jenga Project
 * 
 * This script creates a minified, production-ready version of the project
 * in the /release folder. It performs the following optimizations:
 * 
 * 1. Minifies all JavaScript files (removes comments, whitespace, console.log)
 * 2. Minifies CSS files (removes whitespace, optimizes rules)
 * 3. Minifies HTML (removes comments, whitespace)
 * 4. Copies all static assets (data, images, models, textures)
 * 
 * USAGE:
 *   npm install          # Install build dependencies (first time only)
 *   npm run build        # Create release version
 * 
 * OUTPUT:
 *   - Creates /release folder with optimized files
 *   - Typical size reduction: 35-45% for text files
 *   - Three.js: ~1.2MB → ~700KB
 *   - Ready for production deployment
 * 
 * DEPLOYMENT:
 *   - Upload contents of /release folder to your web server
 *   - Ensure server can serve static files (.js, .css, .wasm, .gltf, .csv)
 *   - No server-side processing required
 */

const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier');

const sourceDir = __dirname;
const releaseDir = path.join(__dirname, 'release');

async function build() {
  console.log('🏗️  Building release version...');
  
  // Clean and create release directory
  await fs.remove(releaseDir);
  await fs.ensureDir(releaseDir);
  
  // Copy static assets that don't need minification
  console.log('📁 Copying static assets...');
  await copyStaticAssets();
  
  // Minify JavaScript files
  console.log('📦 Minifying JavaScript...');
  await minifyJavaScript();
  
  // Minify CSS files
  console.log('🎨 Minifying CSS...');
  await minifyCSS();
  
  // Minify HTML
  console.log('🏠 Minifying HTML...');
  await minifyHTML();
  
  console.log('✅ Build complete! Release files are in the /release folder');
  console.log('💡 To deploy: Upload the contents of /release to your web server');
}

/**
 * Copy static assets that don't require minification
 * Includes: data files, images, 3D models, textures, binary files
 */
async function copyStaticAssets() {
  // Copy data files (CSV datasets)
  await fs.copy(path.join(sourceDir, 'data'), path.join(releaseDir, 'data'));
  
  // Copy images (SVG icons and UI elements)
  await fs.copy(path.join(sourceDir, 'imgs'), path.join(releaseDir, 'imgs'));
  
  // Copy 3D models (GLTF table model and textures)
  await fs.copy(path.join(sourceDir, 'models'), path.join(releaseDir, 'models'));
  
  // Copy background textures
  await fs.copy(path.join(sourceDir, 'textures'), path.join(releaseDir, 'textures'));
  
  // Copy specific libs that shouldn't be minified (binary files, already minified)
  await fs.ensureDir(path.join(releaseDir, 'libs'));
  
  // Ammo.js physics engine (WebAssembly - don't modify)
  await fs.copy(path.join(sourceDir, 'libs/ammo.wasm.js'), path.join(releaseDir, 'libs/ammo.wasm.js'));
  await fs.copy(path.join(sourceDir, 'libs/ammo.wasm.wasm'), path.join(releaseDir, 'libs/ammo.wasm.wasm'));
  
  // Bootstrap CSS framework (already minified)
  await fs.copy(path.join(sourceDir, 'libs/bootstrap-5.3.3-dist'), path.join(releaseDir, 'libs/bootstrap-5.3.3-dist'));
  
  // D3.js data visualization library
  await fs.copy(path.join(sourceDir, 'libs/d3.v5.js'), path.join(releaseDir, 'libs/d3.v5.js'));
  
  // Already minified GUI library
  await fs.copy(path.join(sourceDir, 'libs/lil-gui.module.min.js'), path.join(releaseDir, 'libs/lil-gui.module.min.js'));
  
  // Stats monitoring (already minified)
  await fs.copy(path.join(sourceDir, 'libs/stats.module.js'), path.join(releaseDir, 'libs/stats.module.js'));
}

/**
 * Minify JavaScript files using Terser
 * Removes comments, console.log statements, and unnecessary whitespace
 * Mangles variable names for additional size reduction
 */
async function minifyJavaScript() {
  const jsFiles = [
    // Core application modules
    'components/main.js',
    'components/state.js',
    'components/graphics.js',
    'components/physics.js',
    'components/input.js',
    'components/gui.js',
    'components/data.js',
    'components/legend.js',
    'components/infographics.js',
    'components/Dropdown.js',
    
    // Three.js core and addons
    'libs/three.module.js',
    'libs/OrbitControls.js',
    'libs/DragControls.js',
    'libs/loaders/GLTFLoader.js',
    'libs/loaders/FontLoader.js',
    'libs/utils/BufferGeometryUtils.js',
    'libs/utils/TextGeometry.js'
  ];
  
  for (const file of jsFiles) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(releaseDir, file);
    
    if (await fs.pathExists(sourcePath)) {
      const code = await fs.readFile(sourcePath, 'utf8');
      
      try {
        const result = await minify(code, {
          compress: {
            drop_console: true,    // Remove console.log statements
            drop_debugger: true    // Remove debugger statements
          },
          mangle: true,            // Shorten variable names
          format: {
            comments: false        // Remove all comments
          }
        });
        
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, result.code);
        console.log(`  ✓ ${file}`);
      } catch (error) {
        // If minification fails, copy original file
        console.warn(`  ⚠️  Failed to minify ${file}, copying original:`, error.message);
        await fs.ensureDir(path.dirname(targetPath));
        await fs.copy(sourcePath, targetPath);
      }
    }
  }
}

/**
 * Minify CSS files using CleanCSS
 * Removes whitespace, combines rules, optimizes values
 */
async function minifyCSS() {
  const cssFiles = [
    'styles/main.css',      // Main application styles
    'styles/dropdown.css'   // Dropdown component styles
  ];
  
  const cleanCSS = new CleanCSS({
    level: 2,               // Advanced optimizations
    returnPromise: true
  });
  
  for (const file of cssFiles) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(releaseDir, file);
    
    if (await fs.pathExists(sourcePath)) {
      const css = await fs.readFile(sourcePath, 'utf8');
      
      try {
        const result = await cleanCSS.minify(css);
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, result.styles);
        console.log(`  ✓ ${file}`);
      } catch (error) {
        console.warn(`  ⚠️  Failed to minify ${file}, copying original:`, error.message);
        await fs.ensureDir(path.dirname(targetPath));
        await fs.copy(sourcePath, targetPath);
      }
    }
  }
}

/**
 * Minify HTML file
 * Removes comments, whitespace, and optimizes inline CSS/JS
 */
async function minifyHTML() {
  const htmlContent = await fs.readFile(path.join(sourceDir, 'index.html'), 'utf8');
  
  const minified = minifyHtml(htmlContent, {
    collapseWhitespace: true,           // Remove whitespace
    removeComments: true,               // Remove HTML comments
    removeRedundantAttributes: true,    // Remove redundant attributes
    removeScriptTypeAttributes: true,   // Remove type="text/javascript"
    removeStyleLinkTypeAttributes: true, // Remove type="text/css"
    useShortDoctype: true,              // Use <!DOCTYPE html>
    minifyCSS: true,                    // Minify inline CSS
    minifyJS: true                      // Minify inline JavaScript
  });
  
  await fs.writeFile(path.join(releaseDir, 'index.html'), minified);
  console.log('  ✓ index.html');
}

// Run the build process
build().catch(console.error);