Detailed Implementation Plan for Complexity-Jenga Improvements

  Phase 1: Critical Stability and User Experience (Estimated: 2-3 weeks)

  1.1 Memory Management and Resource Cleanup

  Priority: Critical
  Files: components/physics.js, components/graphics.js

  1.1.1 Fix removeAllBlocks() memory leaks
  - Modify removeAllBlocks() function (physics.js:288-296)
  - Add .dispose() calls for geometries: obj.geometry.dispose()
  - Add .dispose() calls for materials: obj.material.dispose()
  - Add texture disposal for loaded textures
  - Test memory usage with browser DevTools during multiple tower recreations

  1.1.2 Implement proper Three.js cleanup
  - Create cleanupThreeJSObject(object) utility function
  - Add cleanup for shadow maps and render targets
  - Dispose of Ammo.js physics bodies and shapes properly
  - Add memory monitoring utilities for development

  1.1.3 Fix animation memory management
  - Clean up old physics bodies before creating new ones in completeAnimationWithAssignments()
  - Dispose materials when reassigning in animated recreation
  - Add proper cleanup for intermediate animation objects

  1.2 Error Handling and User Feedback

  Priority: CriticalFiles: components/main.js, components/data.js, components/graphics.js

  1.2.1 Add loading indicators
  - Create loading overlay component in HTML/CSS
  - Show progress during Ammo.js initialization (main.js:15-25)
  - Add progress indicator for CSV data loading (data.js)
  - Display loading state during 3D model loading (graphics.js:125-150)

  1.2.2 Implement error boundaries
  - Wrap Ammo() initialization with try-catch (main.js:15)
  - Add error handling for CSV parsing failures (data.js:15-45)
  - Handle WebGL context loss and restoration
  - Create user-friendly error messages instead of console errors

  1.2.3 Add fallback mechanisms
  - Detect WebGL support and show fallback message
  - Provide 2D visualization fallback when 3D fails
  - Add retry mechanisms for failed network requests
  - Implement graceful degradation for unsupported browsers

  1.2.4 Create error reporting system
  - Add showUserError(message, type) utility function
  - Replace console.error() calls with user notifications
  - Add error toast/banner component
  - Implement error recovery suggestions

  1.3 Input Validation and Security

  Priority: High
  Files: components/data.js, components/Dropdown.js

  1.3.1 Add CSV data validation
  - Validate data types for numeric fields (data.js:25-35)
  - Check for required fields: country, centrality, companies, pagerank
  - Sanitize country names and ISO codes
  - Add bounds checking for centrality values (0-1 range)

  1.3.2 Implement input sanitization
  - Sanitize dropdown values in createDropdown() (Dropdown.js)
  - Validate state.currentView before use
  - Add type checking for configuration parameters
  - Escape HTML content in hover tooltips

  1.3.3 Add resource loading security
  - Implement CORS error handling
  - Add integrity checks for external resources
  - Validate file extensions and MIME types
  - Add timeout handling for resource requests

  1.4 Critical Bug Fixes

  Priority: High
  Files: components/physics.js, components/input.js

  1.4.1 Fix heightOffset inconsistency
  - Standardize heightOffset value across creation functions
  - Use consistent value in createBlocksFromData() and calculateTowerLayout()
  - Test tower stability with corrected offset

  1.4.2 Fix mobile touch handling
  - Resolve touch event conflicts between orbit and drag controls
  - Add proper touch event prevention
  - Test on various mobile devices

  Phase 2: Code Quality and Technical Debt (Estimated: 3-4 weeks)

  2.1 Function Decomposition and Refactoring

  Priority: High
  Files: components/physics.js, components/infographics.js, components/input.js

  2.1.1 Refactor animateBricksToNewTower() function
  - Split into smaller functions:
    - prepareAnimationAssignments(existingBlocks, newLayout)
    - executeAnimationFrame(assignments, progress)
    - finalizeAnimationState(assignments, newLayout)
  - Extract animation timing logic into utility functions
  - Add proper parameter validation

  2.1.2 Decompose updateViz() function (infographics.js:76-300)
  - Split into logical components:
    - prepareNetworkData(countryCode, neighbors)
    - createNetworkVisualization(data, container)
    - updateNetworkLayout(simulation, nodes, links)
    - handleNetworkInteractions(nodes, links)
  - Create separate functions for each visualization type

  2.1.3 Refactor showBlockInfo() function
  - Separate data preparation from DOM manipulation
  - Extract tooltip positioning logic
  - Create reusable info panel component
  - Add proper cleanup for event listeners

  2.2 Technical Debt Cleanup

  Priority: Medium
  Files: Multiple files across project

  2.2.1 Remove commented-out code
  - Delete commented HTML controls (index.html:24-38)
  - Remove commented texture code (graphics.js:87-93)
  - Clean up commented control handlers (input.js:60-68, 95-96)
  - Document reasoning for any preserved commented code

  2.2.2 Eliminate duplicate dependencies
  - Remove duplicate Bootstrap directories:
    - Keep only /libs/bootstrap-5.3.3-dist/
    - Delete /libs/bootstrap-5.3 2.3-dist/ and /libs/bootstrap-5.3 3.3-dist/
  - Consolidate loader directories:
    - Merge /libs/loaders/ and /libs/loaders 2/
    - Update import paths accordingly
  - Clean up utility directories:
    - Merge /libs/utils/ and /libs/utils 2/

  2.2.3 Standardize coding patterns
  - Convert all variables to consistent camelCase naming
  - Standardize import statement ordering and grouping
  - Use consistent comment styles (prefer // for single-line)
  - Apply consistent indentation and formatting

  2.2.4 Address TODO items
  - Fix hover box alignment (input.js:531)
  - Resolve z-index issue (main.css:68)
  - Document or implement any other TODO items found

  2.3 Configuration Management System

  Priority: Medium
  Files: components/state.js, components/physics.js, components/graphics.js

  2.3.1 Create centralized configuration
  - Create config/physics.js with all physics constants:
    - Brick dimensions, mass, friction, restitution
    - Gravity, solver iterations, margins
  - Create config/graphics.js with rendering settings:
    - Shadow map sizes, camera parameters
    - Material properties, lighting settings
  - Create config/animation.js with timing settings

  2.3.2 Implement configuration loading
  - Add configuration validation
  - Support environment-specific overrides
  - Add runtime configuration updates
  - Create configuration documentation

  2.3.3 Replace hardcoded values
  - Replace magic numbers in physics.js:85 with config references
  - Update graphics.js:110-112 table scaling to use config
  - Move color scales from state.js to theme configuration

  2.4 Basic Testing Infrastructure

  Priority: Medium
  Files: New test files, package.json

  2.4.1 Set up testing framework
  - Add Jest to package.json dependencies
  - Create tests/ directory structure
  - Configure Jest for ES6 modules and browser environment
  - Add test scripts to package.json

  2.4.2 Create utility function tests
  - Test data processing functions (data.js)
  - Test mathematical calculations (physics utilities)
  - Test configuration loading and validation
  - Test error handling functions

  2.4.3 Add integration tests
  - Test tower creation workflow
  - Test animation system
  - Test user interaction flows
  - Add visual regression testing for UI components

  Phase 3: Performance and User Experience (Estimated: 2-3 weeks)

  3.1 Rendering Performance Optimization

  Priority: High
  Files: components/graphics.js, components/physics.js

  3.1.1 Implement adaptive quality settings
  - Add performance monitoring utilities
  - Create quality presets (low, medium, high)
  - Implement automatic quality adjustment based on frame rate
  - Add user-controlled quality settings

  3.1.2 Optimize shadow rendering
  - Implement cascaded shadow maps for better quality/performance balance
  - Add shadow distance culling
  - Implement shadow map resolution scaling
  - Add shadow enable/disable option

  3.1.3 Add Level of Detail (LOD) system
  - Create simplified brick geometries for distant objects
  - Implement distance-based material switching
  - Add frustum culling for off-screen objects
  - Optimize particle effects and animations

  3.2 Mobile Experience Enhancement

  Priority: High
  Files: components/input.js, styles/main.css, index.html

  3.2.1 Improve touch controls
  - Implement proper touch event handling with prevent default
  - Add touch-specific UI feedback
  - Optimize control sensitivity for touch devices
  - Add haptic feedback where supported

  3.2.2 Responsive UI implementation
  - Convert fixed-size elements to responsive units
  - Implement mobile-specific layouts
  - Add collapsible info panels for small screens
  - Optimize button sizes for touch targets (minimum 44px)

  3.2.3 Mobile performance optimization
  - Reduce default quality settings on mobile
  - Implement texture compression for mobile GPUs
  - Add memory usage monitoring and warnings
  - Optimize asset loading for slower connections

  3.3 Data Processing Optimization

  Priority: Medium
  Files: components/infographics.js, components/data.js

  3.3.1 Cache calculation results
  - Implement memoization for brick layout calculations
  - Cache D3.js simulation results
  - Add intelligent cache invalidation
  - Store processed data structures

  3.3.2 Optimize D3.js operations
  - Throttle continuous simulations
  - Use requestAnimationFrame for D3 updates
  - Implement viewport-based rendering
  - Add pause/resume capabilities for background simulations

  3.3.3 Improve data loading
  - Implement progressive data loading
  - Add data prefetching for known user actions
  - Compress CSV data or convert to binary format
  - Add client-side data caching

  3.4 Accessibility Implementation

  Priority: Medium
  Files: index.html, components/input.js, styles/main.css

  3.4.1 Add keyboard navigation
  - Implement keyboard controls for camera movement
  - Add keyboard shortcuts for common actions
  - Create focus management system
  - Add skip navigation links

  3.4.2 Screen reader support
  - Add ARIA labels to all interactive elements
  - Create alternative text descriptions for 3D content
  - Implement screen reader announcements for state changes
  - Add semantic HTML structure

  3.4.3 Visual accessibility improvements
  - Add high contrast mode option
  - Implement alternative to color-only information
  - Add text size scaling options
  - Test with colorblind simulation tools

  Phase 4: Advanced Features and Maintainability (Estimated: 3-4 weeks)

  4.1 Enhanced Build System

  Priority: Medium
  Files: build.js, package.json, new configuration files

  4.1.1 Development workflow improvements
  - Add development server with hot reload
  - Implement source map generation for debugging
  - Create environment-specific configurations
  - Add automatic browser opening

  4.1.2 Advanced build optimizations
  - Implement code splitting for better loading
  - Add tree shaking for unused code elimination
  - Optimize image and model assets during build
  - Add bundle analysis tools

  4.1.3 Quality assurance automation
  - Add ESLint configuration and rules
  - Implement Prettier for code formatting
  - Add pre-commit hooks for code quality
  - Create CI/CD pipeline configuration

  4.2 Advanced Features

  Priority: Low
  Files: New feature components

  4.2.1 Save/Load functionality
  - Implement state serialization/deserialization
  - Add URL-based state sharing
  - Create bookmark system for tower configurations
  - Add export to JSON functionality

  4.2.2 Enhanced visualization options
  - Add side-by-side comparison mode
  - Implement timeline/historical data views
  - Add data filtering and search capabilities
  - Create custom color schemes and themes

  4.2.3 Advanced analytics
  - Add interaction tracking and heatmaps
  - Implement data insights and recommendations
  - Create automated report generation
  - Add data export capabilities (CSV, PNG, SVG)

  4.3 Comprehensive Documentation

  Priority: Medium
  Files: Multiple files, new documentation

  4.3.1 Code documentation
  - Add JSDoc comments to all functions
  - Document all module interfaces and APIs
  - Create architecture documentation
  - Add inline code comments for complex logic

  4.3.2 User documentation
  - Create comprehensive user guide
  - Add interactive tutorials and onboarding
  - Document all features and capabilities
  - Create FAQ and troubleshooting guide

  4.3.3 Developer documentation
  - Document development setup and workflows
  - Create contribution guidelines
  - Add API reference documentation
  - Document testing procedures and standards

  4.4 Production Readiness

  Priority: High
  Files: Multiple files, configuration

  4.4.1 Monitoring and analytics
  - Add error tracking and reporting
  - Implement performance monitoring
  - Add user behavior analytics
  - Create health check endpoints

  4.4.2 Security hardening
  - Implement Content Security Policy (CSP)
  - Add integrity checks for all resources
  - Create security headers configuration
  - Add rate limiting for API calls

  4.4.3 Deployment optimization
  - Add CDN configuration for static assets
  - Implement progressive web app features
  - Add offline functionality where appropriate
  - Create deployment automation scripts

  Implementation Timeline Summary

  - Phase 1: 2-3 weeks (Critical stability and UX)
  - Phase 2: 3-4 weeks (Code quality and technical debt)
  - Phase 3: 2-3 weeks (Performance and mobile optimization)
  - Phase 4: 3-4 weeks (Advanced features and production readiness)
