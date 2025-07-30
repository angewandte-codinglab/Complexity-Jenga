# Complexity-Jenga

## Version 1: Technical Overview

**Complexity-Jenga** is an interactive 3D visualization that represents the global semiconductor supply chain as a physically-simulated Jenga tower. Each layer corresponds to a country, with block arrangements determined by betweenness centrality values in the supply chain network.

The application combines Three.js for 3D graphics, Ammo.js for real-time physics simulation, D3.js for data processing, and Bootstrap for UI components. Users can reorder the tower by different metrics (number of companies, PageRank) and observe how structural changes affect tower stability.

Key technical features include animated tower reconstruction, physics-based collapse simulation, interactive block manipulation with drag controls, and real-time data visualization overlays.

### Development Setup
```bash
# Development server
python -m http.server 8000

# Production build
npm install
npm run build
```

---

## Version 2: Academic Description

**Complexity-Jenga** visualizes the fragility and interdependence of global semiconductor supply chains through an interactive 3D tower metaphor. Countries are represented as layers, with block configurations reflecting their betweenness centrality in the network - a measure of how critical they are as intermediaries in supply chain connections.

The visualization demonstrates how changes in economic metrics affect structural stability. Users can toggle between ranking systems (company count vs. PageRank authority) to observe how different measures of importance create different vulnerabilities in the supply chain architecture.

The implementation leverages WebGL-based 3D rendering with physics simulation to create an intuitive understanding of network robustness. Interactive elements include hover information, drag-and-drop block manipulation, and smooth animated transitions between different organizational schemes.

This tool serves as both an educational resource for understanding supply chain complexity and a research instrument for exploring network centrality measures in real-world economic systems.

---

## Version 3: Project Summary

**Complexity-Jenga** transforms abstract supply chain data into a tangible 3D experience. The application presents the global semiconductor network as an unstable Jenga tower where each country forms a layer, and the number of blocks per layer reflects that country's importance as a network bridge.

Built with modern web technologies, the project features real-time physics simulation powered by Bullet Physics (via Ammo.js), professional 3D graphics using Three.js, and responsive data visualization components. The interface allows users to reorganize the tower by different economic metrics and witness the resulting changes in both structure and stability.

Notable implementation details include country-based block matching during animated reconstructions, physics-synchronized rendering loops, and modular component architecture. The codebase includes a complete build system for production deployment with code minification and asset optimization.

The project originated from the Visualizing Complexity Science Workshop 2024, focusing on semiconductor supply chain analysis, and has been developed into a full interactive web application suitable for educational and research applications.

---

## Ranking Systems and Data Visualization

**Complexity-Jenga** employs a dual-encoding visualization system that represents both economic importance and network position within the global semiconductor supply chain.

  Primary Ranking Systems

  Number of Companies Ranking
  - Sorts countries by total count of semiconductor companies
  - Measures industrial capacity and manufacturing presence
  - Reveals production powerhouses and manufacturing concentration

  PageRank Ranking
  - Sorts countries by network authority score (adapted from Google's PageRank algorithm)
  - Measures influence and coordination capacity in supply networks
  - Identifies strategic control points and coordination hubs

  Visualization Encoding

  Vertical Position (Tower Layer)
  - Countries with higher ranking values appear at the tower base
  - Lower-ranked countries occupy higher, more precarious positions
  - Creates intuitive hierarchy of economic dominance

  Block Count per Layer (Betweenness Centrality)
  - Number of blocks (1-4) reflects each country's role as a network bridge
  - More blocks indicate greater importance as supply chain intermediaries
  - Reveals critical chokepoints independent of economic size

  Analytical Insights

  The dual-encoding system reveals complex supply chain dynamics:
  - Economically large countries may occupy peripheral network positions
  - Small countries can serve as critical network bridges
  - Different ranking systems expose distinct vulnerability patterns
  - Interactive switching between rankings demonstrates how various metrics create different structural fragilities

  This approach enables users to explore both quantitative economic measures (company counts, network authority) and qualitative network
  relationships (bridge positions, coordination roles) within a single interactive visualization.
