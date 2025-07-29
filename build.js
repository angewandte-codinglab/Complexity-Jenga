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
}

async function copyStaticAssets() {
  // Copy data files
  await fs.copy(path.join(sourceDir, 'data'), path.join(releaseDir, 'data'));
  
  // Copy images
  await fs.copy(path.join(sourceDir, 'imgs'), path.join(releaseDir, 'imgs'));
  
  // Copy models
  await fs.copy(path.join(sourceDir, 'models'), path.join(releaseDir, 'models'));
  
  // Copy textures
  await fs.copy(path.join(sourceDir, 'textures'), path.join(releaseDir, 'textures'));
  
  // Copy specific libs that shouldn't be minified (binary files, already minified)
  await fs.ensureDir(path.join(releaseDir, 'libs'));
  await fs.copy(path.join(sourceDir, 'libs/ammo.wasm.js'), path.join(releaseDir, 'libs/ammo.wasm.js'));
  await fs.copy(path.join(sourceDir, 'libs/ammo.wasm.wasm'), path.join(releaseDir, 'libs/ammo.wasm.wasm'));
  await fs.copy(path.join(sourceDir, 'libs/bootstrap-5.3.3-dist'), path.join(releaseDir, 'libs/bootstrap-5.3.3-dist'));
  await fs.copy(path.join(sourceDir, 'libs/d3.v5.js'), path.join(releaseDir, 'libs/d3.v5.js'));
  await fs.copy(path.join(sourceDir, 'libs/lil-gui.module.min.js'), path.join(releaseDir, 'libs/lil-gui.module.min.js'));
  await fs.copy(path.join(sourceDir, 'libs/stats.module.js'), path.join(releaseDir, 'libs/stats.module.js'));
}

async function minifyJavaScript() {
  const jsFiles = [
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
            drop_console: true,
            drop_debugger: true
          },
          mangle: true,
          format: {
            comments: false
          }
        });
        
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, result.code);
        console.log(`  ✓ ${file}`);
      } catch (error) {
        console.warn(`  ⚠️  Failed to minify ${file}, copying original:`, error.message);
        await fs.ensureDir(path.dirname(targetPath));
        await fs.copy(sourcePath, targetPath);
      }
    }
  }
}

async function minifyCSS() {
  const cssFiles = [
    'styles/main.css',
    'styles/dropdown.css'
  ];
  
  const cleanCSS = new CleanCSS({
    level: 2,
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

async function minifyHTML() {
  const htmlContent = await fs.readFile(path.join(sourceDir, 'index.html'), 'utf8');
  
  const minified = minifyHtml(htmlContent, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: true
  });
  
  await fs.writeFile(path.join(releaseDir, 'index.html'), minified);
  console.log('  ✓ index.html');
}

// Run the build
build().catch(console.error);