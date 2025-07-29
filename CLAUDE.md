# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Complexity-Jenga" is an interactive 3D visualization that represents the global semiconductor supply chain as a Jenga-like tower. Each layer represents a country, with blocks arranged according to their betweenness centrality in the supply chain network. The project combines Three.js for 3D graphics, Ammo.js for physics simulation, and D3.js for data visualization and educational components.

## Development Commands

This is a client-side JavaScript application that runs directly in the browser. No build system is required.

**Running the application:**
- Open `index.html` in a web browser or serve via local HTTP server
- For development, use a local server: `python -m http.server 8000` or `npx serve .`

**No package.json or build commands** - this is a vanilla JavaScript project using ES6 modules.

## Architecture

The application follows a modular architecture with clear separation of concerns:

### Core Modules
- **main.js**: Application orchestrator, initializes Ammo.js and coordinates all modules
- **state.js**: Centralized state management with global configuration, camera presets, and runtime state
- **graphics.js**: Three.js scene setup, rendering, lighting, and GLTF model loading
- **physics.js**: Ammo.js physics world management and data-driven Jenga tower creation
- **input.js**: User interaction handling (mouse, keyboard, drag controls, tooltips)
- **gui.js**: lil-gui debug interface and camera preset animations
- **data.js**: CSV data loading and network relationship processing
- **legend.js**: D3.js educational visualizations for centrality concepts
- **infographics.js**: Dynamic network graphs for country hover interactions
- **Dropdown.js**: Reusable UI dropdown component

### Key Dependencies
- **Three.js** (ES6 modules): 3D graphics, controls, loaders
- **Ammo.js** (WebAssembly): Bullet physics engine
- **D3.js v5**: Data processing and 2D visualizations  
- **lil-gui**: Debug interface
- **Bootstrap 5.3.3**: UI styling and modals
- **jQuery/jQuery UI**: Modal drag functionality

### Data Sources
- `data/results_semicon.csv`: Country semiconductor data (companies, centrality, PageRank)
- `data/semicon_source_target_country.csv`: Network connections between countries
- `data/importance_measures.csv`: Additional network metrics

## Key Features

### Interactive Controls
- **Space**: Recreate tower
- **Enter**: Start/stop physics simulation
- **1-4**: Camera presets
- **Mouse hover**: Display country information
- **Cmd/Ctrl + drag**: Move individual blocks
- **Mouse wheel**: Zoom
- **Click + drag**: Orbit camera

### Data Visualization
- Countries are represented as Jenga blocks with color-coded regions
- Block arrangement reflects betweenness centrality (1-4 block layouts)
- Tower can be reordered by different metrics (companies, PageRank)
- Educational overlays explain network concepts

### Physics Simulation
- Real-time Bullet physics simulation via Ammo.js
- Intentionally unstable tower design to demonstrate fragility
- Dynamic block removal and tower recreation

## Development Notes

### File Organization
- `components/`: All JavaScript modules
- `libs/`: Third-party libraries (Three.js, Ammo.js, etc.)
- `data/`: CSV datasets
- `models/table/`: 3D GLTF table model
- `textures/`: Background and surface textures
- `imgs/`: UI icons and SVG illustrations
- `styles/`: CSS for UI and dropdowns

### State Management
The `state.js` module serves as a singleton containing all shared application state, including Three.js objects, physics world, camera presets, and data visualization settings.

### Camera System
Five predefined camera presets provide different viewing angles. Camera transitions are smoothly animated using easing functions in `gui.js`.

### Data Flow
CSV data → `data.js` processing → `physics.js` tower creation → `graphics.js` rendering → `input.js` interaction → `infographics.js` contextual visualization

### Physics Integration
The physics simulation runs in sync with Three.js rendering. Objects maintain both physics bodies (Ammo.js) and visual meshes (Three.js) with automatic position synchronization.