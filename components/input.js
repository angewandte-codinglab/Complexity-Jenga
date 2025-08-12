import * as THREE from 'three';
import { DragControls } from 'three/addons/DragControls.js';
// import * as d3 from 'd3';
import { state } from './state.js';
import { removeAllBlocks, createObjects, animateRecreateTower } from './physics.js';

// Dropdown functions in Dropdown.js

export function initInput() {
    setupInputHandlers();
    setupViewDropdown();
    setupDragControls();
}

let blockTouched = false;
let lastHighlightedBlocks = null; //if contains items, in array format

// Add variables to track input state
let metaKeyPressed = false;
let isDragging = false;

function isMobile() {
    const userAgent = navigator.userAgent;
    // Simple check for mobile devices (phones), excluding tablets like iPad.
    return /Mobi/i.test(userAgent) && !/iPad/i.test(userAgent);
}

function setupInputHandlers() {
    // Detect if this is a touch device
    // state.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    d3.selectAll('.mouse-hint').classed('d-none', state.isTouchDevice)
    d3.selectAll('.touch-hint').classed('d-none', !state.isTouchDevice)

    // Add touch events for mobile devices
    if (state.isTouchDevice) {
        setupTouchEvents();

        // Ensure UI elements work properly on touch devices
        // ensureTouchCompatibility();
        document.addEventListener('click', onMouseMove);
    } else {
        // Mouse events
        document.addEventListener('mousedown', () => {
            state.timeDiv = 4;
        });

        document.addEventListener('mouseup', () => {
            state.timeDiv = state.defaultTimeDiv;
        });

        document.addEventListener('mousemove', onMouseMove);

    }



    // Store physics state before modifier key was pressed
    let previousPhysicsState = false;



    //controls 
    // d3.select('#btn-togglesimulation').on('click', function() {
    //     toggleRunPhysics()
    // })
    d3.select('button[data-key="space"]').on('click', function() {
        toggleRecreateTower()
    })
    // d3.select('#btn-brickmoving').on('click', function() {
    //     toggleBrickMoving()
    // })
    document.querySelectorAll('#setview-buttons button').forEach(button => {
        button.addEventListener('click', () => {
            const key = button.getAttribute('data-key');
            handleNumberInput(+key);
        });
    });

    function handleNumberInput(keyNum) {

        const presetNames = Object.keys(state.cameraPresets);

        // Check if we have enough presets for this number
        if (keyNum <= presetNames.length - 1) {
            // Get preset name (subtract 1 because arrays are 0-indexed)
            const presetName = presetNames[keyNum - 1];

            // Import the function from gui.js for animation
            import('./gui.js').then(module => {
                // Animate to selected preset with 1000ms duration
                module.animateCameraToPreset(presetName, 1000);
            });
        }
    }


    // Store physics state before modifier key was pressed
    // let previousPhysicsState = false;

    function toggleRunPhysics() {
        //update control label on 'stop'/'start' simulation
        // const el = d3.select('#btn-togglesimulation')
        // el.classed('enable', !el.classed('enable'));

        state.runPhysics = !state.runPhysics;
        console.log("Physics running: " + state.runPhysics);

        //hide hint if physics running
        d3.select('#action-hint').classed('d-none', state.runPhysics)
    }

    function toggleRecreateTower() {
        // Use animated recreation if blocks exist, otherwise create normally
        if (state.rigidBodies.length > 0) {
            animateRecreateTower();
        } else {
            state.runPhysics = false;
            //hide hint if physics running
            d3.select('#action-hint').classed('d-none', state.runPhysics)
            removeAllBlocks();
            createObjects();
        }
    }

    // function toggleBrickMoving() {
    //     //update control label on 'enable'/'disable' brick moving
    //     const el = d3.select('#btn-brickmoving')
    //     el.classed('enable', !el.classed('enable'));

    //     if (el.classed('enable')) {
    //         enableBlockMoving();
    //         console.log("Block moving enabled (button pressed)");
    //     } else {
    //         disableBlockMoving();
    //         console.log("Block moving disabled (button pressed)");
    //     }
    // }

    // Keyboard events
    document.addEventListener('keydown', (event) => {
        if (event.key === " " || event.code === "Space") {
            toggleRecreateTower()
        } else if (event.code === "Enter") {
            toggleRunPhysics()
        } else if (event.code === "KeyM") {
            state.controls.touches.ONE = (state.controls.touches.ONE === THREE.TOUCH.PAN) ?
                THREE.TOUCH.ROTATE :
                THREE.TOUCH.PAN;
        }
        // Camera position shortcuts (numbers 1-9)
        else if (!isNaN(parseInt(event.key)) && event.key !== '0') {
            const keyNum = parseInt(event.key);

            const presetNames = Object.keys(state.cameraPresets);

            // Check if we have enough presets for this number
            if (keyNum <= presetNames.length - 1) {
                // Get preset name (subtract 1 because arrays are 0-indexed)
                const presetName = presetNames[keyNum - 1];

                // Import the function from gui.js for animation
                import('./gui.js').then(module => {
                    // Animate to selected preset with 1000ms duration
                    module.animateCameraToPreset(presetName, 1000);
                });
            }

            handleNumberInput(keyNum);


        } else if (event.key === 'q' || event.key === 'Q') {
            const quaternion = state.camera.quaternion.clone();
            console.log('Current camera quaternion:');
            console.log(
                quaternion.x.toFixed(2),
                quaternion.y.toFixed(2),
                quaternion.z.toFixed(2),
                quaternion.w.toFixed(2)
            );

            const position = state.camera.position.clone();
            console.log('Current camera position:');
            console.log(
                position.x.toFixed(2),
                position.y.toFixed(2),
                position.z.toFixed(2)
            );
        }
    });
}

// New function to handle touch events
function setupTouchEvents() {
    // Only attach to the 3D container, not the entire document
    const container = document.getElementById('container');
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
}

function onTouchStart(event) {
    // Only prevent default if we're in the 3D area and touching a block
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        state.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        state.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        // Check if we're touching a block
        state.raycaster.setFromCamera(state.mouse, state.camera);
        const intersects = state.raycaster.intersectObjects(state.rigidBodies);

        if (intersects.length > 0) {
            // Only prevent default if we're actually touching a block
            event.preventDefault();

            // Enable block moving for touch
            enableBlockMoving();
            isDragging = true;
        }
        // If not touching a block, let orbit controls handle the touch
    }
}

function onTouchEnd(event) {
    if (isDragging) {
        event.preventDefault();

        // Properly restore controls after dragging
        isDragging = false;

        // Re-enable orbit controls and physics
        state.orbitControls.enabled = true;
        state.orbitControls.enableRotate = true;
        state.dragControls.enabled = true; // Keep drag enabled for future interactions
        state.runPhysics = true;
        //hide hint if physics running
        d3.select('#action-hint').classed('d-none', state.runPhysics)

        console.log("Touch drag ended - orbit controls restored");
    }
}

function onTouchMove(event) {
    if (isDragging && event.touches.length === 1) {
        event.preventDefault(); // Only prevent default while actively dragging

        const touch = event.touches[0];

        // Update mouse position for raycasting and drag controls
        state.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        state.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        // Call the existing mouse move handler for block info display
        onMouseMove({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }
}

// Ensure UI elements work properly on touch devices
// function ensureTouchCompatibility() {
//     // Add touch event handling for critical UI buttons
//     const criticalButtons = [
//         '#btn-about',
//         // '#btn-togglesimulation',
//         // '#btn-brickmoving',
//         '.btn[data-bs-toggle="collapse"]'
//     ];

//     criticalButtons.forEach(selector => {
//         const elements = document.querySelectorAll(selector);
//         elements.forEach(element => {
//             // Add explicit touch handling
//             element.addEventListener('touchend', function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();

//                 // Trigger the click event
//                 element.click();
//             }, { passive: false });
//         });
//     });

//     // Ensure dropdown options work on touch
//     setTimeout(() => {
//         const dropdownOptions = document.querySelectorAll('.dropdown-content .option');
//         dropdownOptions.forEach(element => {
//             element.addEventListener('touchend', function(e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 element.click();
//             }, { passive: false });
//         });
//     }, 1000); // Delay to ensure dropdown is created
// }

// Helper functions to enable/disable block moving
function enableBlockMoving() {
    // Stop physics immediately
    state.runPhysics = false;
    //hide hint if physics running
    d3.select('#action-hint').classed('d-none', state.runPhysics)

    // Enable drag controls and disable orbit rotation
    state.dragControls.enabled = true;
    state.orbitControls.enableRotate = false;
    state.orbitControls.enabled = false;
}

function disableBlockMoving() {
    // Always restore orbit controls when manually disabling
    state.orbitControls.enabled = true;
    state.orbitControls.enableRotate = true;

    // For manual button toggle, disable drag controls
    // For touch/meta key release, keep drag enabled for future use
    if (!state.isTouchDevice && !metaKeyPressed) {
        state.dragControls.enabled = false;
    }
}

function setupViewDropdown() {
    const viewOptions = [
        { id: "number_of_companies", name: 'Number of Companies' },
        { id: "mean_page_rank", name: 'PageRank' }
    ];

    state.currentView = viewOptions[0];

    createDropdown(
        state.viewContainer,
        "view-dropdown",
        viewOptions,
        state.currentView,
        (selected) => {
            state.currentView = selected;

            // Use animated recreation if blocks exist, otherwise create normally
            if (state.rigidBodies.length > 0) {
                animateRecreateTower();
            } else {
                state.runPhysics = false;
                //hide hint if physics running
                d3.select('#action-hint').classed('d-none', state.runPhysics)
                removeAllBlocks();
                createObjects();
            }
            console.log(state.currentView);
        }
    );
}

// Setup drag controls for both mouse and touch interactions
function setupDragControls() {
    state.dragControls = new DragControls(state.objects, state.camera, state.renderer.domElement);

    // Add dragstart listener to stop physics when dragging starts
    state.dragControls.addEventListener('dragstart', function(event) {
        // Ensure physics is stopped when actually dragging an object
        state.runPhysics = false;
        //hide hint if physics running
        d3.select('#action-hint').classed('d-none', state.runPhysics)

        // Disable orbit controls while dragging
        state.orbitControls.enabled = false;

        // Hide block info when dragging begins
        showBlockInfo(); // This call with no parameters hides the info

        isDragging = true; // Set dragging state
        // console.log("Started dragging block");

    });

    state.dragControls.addEventListener('dragend', function(event) {
        const object = event.object;
        const physicsBody = object.userData.physicsBody;

        if (physicsBody) {
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            // Set the new position
            const position = object.position;
            transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
            // Set the new orientation
            const quaternion = object.quaternion;
            transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
            // Update both the rigid body's world transform and its motion state
            physicsBody.setWorldTransform(transform);
            if (physicsBody.getMotionState()) {
                physicsBody.getMotionState().setWorldTransform(transform);
            }
            // Activate the body so it doesn't remain sleeping
            physicsBody.activate();
            // Clear the velocity to avoid unexpected movement after dragging
            physicsBody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            physicsBody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
        }
        // Re-enable physics when dropping a block
        state.runPhysics = true;
        //hide hint if physics running
        d3.select('#action-hint').classed('d-none', state.runPhysics)
        // Always restore orbit controls unless meta key is held
        if (!metaKeyPressed) {
            state.orbitControls.enabled = true;
            state.orbitControls.enableRotate = true;
        }
        isDragging = false; // Allow block info on hover again
        // console.log("Finished dragging block");
    });

    // Initially enable drag controls for direct interaction
    state.dragControls.enabled = true;

    // Set up proper interaction with orbit controls
    state.dragControls.addEventListener('hoveron', function() {
        // Temporarily reduce orbit control responsiveness when hovering over objects
        if (state.orbitControls.enabled) {
            state.orbitControls.enableRotate = false;
            // console.log("Hover started - orbit controls disabled");
        }
    });

    state.dragControls.addEventListener('hoveroff', function() {
        // Restore orbit controls when not hovering over objects
        if (state.orbitControls.enabled && !isDragging) {
            state.orbitControls.enableRotate = true;
            // console.log("Hover ended - orbit controls restored");
        }
    });
}

function onMouseMove(event) {
    //skip it if modal is on
    // if (document.querySelector('.modal.show')) return;
    // Calculate normalized mouse position
    state.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Perform raycasting
    state.raycaster.setFromCamera(state.mouse, state.camera);
    const intersects = state.raycaster.intersectObjects(state.rigidBodies);

    // Reset previous highlighted block if exists

    //     if (lastHighlightedBlock) {
    //         resetBlockHighlight(lastHighlightedBlock);
    //         lastHighlightedBlock = null;
    //     }

    //     // Check if any block is intersected
    //     if (intersects.length > 0) {
    //         const intersectedBlock = intersects[0].object;

    //         // Store original material properties if first time highlighting
    //         if (!intersectedBlock.userData.hasOwnProperty('originalEmissive')) {
    //             // Clone the color object instead of just storing the hex value
    //             intersectedBlock.userData.originalEmissive = intersectedBlock.material.emissive.clone();
    //             intersectedBlock.userData.originalEmissiveIntensity = intersectedBlock.material.emissiveIntensity;
    //         }

    //         // Apply highlighting effect
    //         intersectedBlock.material.emissive.set(0xFFFFFF);
    //         intersectedBlock.material.emissiveIntensity = 0.3;

    //         // Track this block as the currently highlighted one
    //         lastHighlightedBlock = intersectedBlock;

    //         showBlockInfo(intersectedBlock, event);

    // if (lastHighlightedBlocks) {
    //     resetBlockHighlight(lastHighlightedBlocks);
    //     lastHighlightedBlocks = null;
    // }

    // Check if any block is intersected
    if (intersects.length > 0) {
        const intersectedBlock = intersects[0].object;

        // // Skip showing block info if we're currently dragging
        // let modalOverlap = false;
        // const modal = document.querySelector('.modal.show');
        // if (modal) {
        //     const rect = modal.querySelector('.modal-dialog').getBoundingClientRect();
        //     const mouseX = event.clientX;
        //     const mouseY = event.clientY;

        //     const isInsideModal =
        //         mouseX >= rect.left &&
        //         mouseX <= rect.right &&
        //         mouseY >= rect.top &&
        //         mouseY <= rect.bottom;
        //     if (isInsideModal) {
        //         modalOverlap = true;
        //     }
        // }

        // // Only show block info if not dragging, not in a modal, and not on mobile
        // if (!modalOverlap && !isMobile() && !isDragging) {
        //     showBlockInfo(intersectedBlock, event);
        // }
        // Only show block info if not dragging, not in a modal
        // if (!isDragging) {
        showBlockInfo(intersectedBlock, event);
        // }

        blockTouched = true;
    } else {

        // Add timeout before setting blockTouched to false
        setTimeout(() => {
            blockTouched = false;
        }, 200);
        showBlockInfo();

    }
}

function showBlockInfo(block, event) {
    // console.log(state.rigidBodies, lastHighlightedBlocks)
    const hoverBox = document.getElementById('hoverBox');
    if (block) {
        hoverBox.style.display = 'flex';
        if (state.currentHover !== block.userData.countryCode) {

            hoverBox.innerHTML = `
                <div class="title-container d-flex pt-3">
                    <div class="col-3 px-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70" width="100%">
                          ${block.userData.brickIcon}
                        </svg>
                    </div>
                    <div class="d-flex flex-column col-9 fs-7">
                        <div class="fw-bold fs-5">${block.userData.country}</div>
                        <div class="d-flex align-items-center">
                            Region:
                            <span class="pill ms-2 me-1" style="background-color:${block.userData.color}"></span>
                            <span class="fw-bold">${block.userData.region}</span>
                        </div>
                        <div>Betweenness centrality: <span class="fw-bold">${block.userData.brickLabel}</span></div>
                    </div>
                </div>
                <div class="d-flex fs-7 p-2 mt-2 border-top">
                    <div class="col-6">Num. Companies: <span class="fw-bold">${block.userData.companies}</span></div>
                    <div class="col-6">Avg. PageRank: <span class="fw-bold">${d3.format(".4f")(block.userData.pagerank)}</span></div>
                </div>
                <div id="infographicBoxContainer" class="col-12 d-flex flex-column">
                    <div class="fs-7 p-2 d-flex flex-column lh-1"><div>Connected countries</div><div class="fs-7 text-opacity">Size by number of links between companies</div></div>
                    <div id="infographicBox"></div>
                </div>
            `;
            //TODO: aligh box
            hoverBox.style.top = `${Math.min(event.clientY, document.body.clientHeight - 500)}px`;
            hoverBox.style.left = `${Math.min(event.clientX + 30, document.body.clientWidth - Math.min(400, document.body.clientWidth))}px`;

            // Draw the network graph for the hovered country

            state.currentHover = block.userData.countryCode;
            loadGlobalNetworkGraph('infographicBox', state.currentHover);

            //highlight linked countries
            const linkedCountry = new Set(
                block.userData.neighbors.flatMap(link => [link.source, link.target])
            );

            lastHighlightedBlocks = state.rigidBodies.filter(d => linkedCountry.has(d.userData.countryCode))
            blockHighlight(lastHighlightedBlocks) //one block in an array format


        }
    } else {
        hoverBox.style.display = 'none';
        blockHighlight()
        state.currentHover = null;
    }
}

function blockHighlight(blocks) {
    if (blocks) {
        blocks.forEach(block => {
            // Store original material properties if first time highlighting
            if (!block.userData.hasOwnProperty('originalEmissive')) {
                // Clone the color object instead of just storing the hex value
                block.userData.originalEmissive = block.material.emissive.clone();
                block.userData.originalEmissiveIntensity = block.material.emissiveIntensity;
            }

            // Apply highlighting effect
            block.material.emissive.set(0xFFFFFF);
            // block.material.emissiveIntensity = 0.3;
            if (state.currentHover === block.userData.countryCode) {
                block.material.emissiveIntensity = 0.3;
            } else {
                block.material.emissiveIntensity = 0.1;
            }


        })
    } else {
        // Reset previous highlighted block
        // if exists
        if (lastHighlightedBlocks) {
            resetBlockHighlight(lastHighlightedBlocks);
            lastHighlightedBlocks = null;
        }
    }
}

function resetBlockHighlight(blocks) {
    blocks.forEach(block => {
        if (block && block.userData.hasOwnProperty('originalEmissive')) {
            // Use the clone of the original color instead of just the hex value
            block.material.emissive.copy(block.userData.originalEmissive);
            block.material.emissiveIntensity = block.userData.originalEmissiveIntensity || 0;
        }
    })
}