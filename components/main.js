import * as THREE from 'three';

import Stats from 'three/addons/stats.module.js';
import { DragControls } from 'three/addons/DragControls.js';
import { OrbitControls } from 'three/addons/OrbitControls.js';
// Add these imports for the bloom effect
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
import { ToneMapShader } from '/libs/shaders/ToneMapShader.js';

// Add at the top of your imports
import { GUI } from 'three/addons/lil-gui.module.min.js';

import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Add this import at the top
import { Reflector } from 'three/addons/objects/Reflector.js';

const showAllBricks = true; // Toggle this variable to create all bricks per layer

// Graphics variables
let container, stats;
let camera, controls, scene, renderer;
let textureLoader;
let enableSelection = false;
let objects = [];
const clock = new THREE.Clock();

// Camera, controls
let orbitControls, dragControls;

// Add these variables for post-processing
let composer;
let bloomParams = {
    strength: 0.1,   // Bloom intensity
    radius: .2,     // Bloom radius
    threshold: 0.01   // Minimum brightness to apply bloom
};

// Add depth-of-field parameters
let dofParams = {
    focus: 18.0,      // Focus distance
    aperture: 0.0005,  // Aperture (smaller = more blur)
    maxblur: 0.005     // Maximum blur amount
};

// Add these variables to hold our GUI and effect references
let gui;
let bloomPass, bokehPass, toneMapPass;

// Add these variables for auto-focus
let autoFocus = true;
let focusUpdateFrequency = 10; // Update focus every N frames
let frameCounter = 0;
let towerCenter = new THREE.Vector3(0, 5, 0); // Approximate center of the tower

// Add this variable to the top section with other effect parameters
let bloomEnabled = true;  // Toggle for bloom effect

// Add this variable to the top section with other effect parameters
let dofEnabled = false;  // Toggle for depth of field effect

// Add these variables to store the ground material and available HDR files
let groundMaterial;
let hdrFiles = ['pure_sky_4k.hdr', 'canary_wharf_2k.hdr', 'portland_2k.hdr', 'overcast_2k.hdr', 'cloudy_puresky_2k.hdr', 'island_2k.hdr', 'terminal_4k.hdr', 'sunset_4k.hdr', 'cloudy_puresky_4k.hdr']; // Add your HDR files here
let currentHdrIndex = 0;

// Add this variable at the top with other state variables
let groundVisible = true;
let groundMirror; // Make sure this is declared at the top level

// Add these variables near other ground-related variables
let useReflectiveGround = true;  // Toggle between reflective and standard ground
let groundReflectivity = .1;    // Store reflectivity value
let groundColor = 0xffffff;      // Store ground color

// Physics variables
const gravityConstant = -9.8;
// const gravityConstant = -6; //use smaller gavity?
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let softBodySolver;
let physicsWorld;
const rigidBodies = [];
// const margin = 0.05;
const margin = 0.001;
let transformAux1;

let runPhysics = false;

const defaultTimeDiv = 1;
let timeDiv = defaultTimeDiv;

//for view switch dropdown
let currentView;
const viewContainer = d3.select('#viewContainer')

// Initialize raycaster and mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


// Ammo is the name of the physics library being used
Ammo().then(function(AmmoLib) {
    
    Ammo = AmmoLib;
    
    init();
    
});


//prepare data relevant
//scale for region color
const colorScale = d3.scaleOrdinal()
.range(['#ff0000', '#ffff00', '#00ffff', '#0000ff', '#ff00ff']) //six colors for six macro regions
.domain(['Oceania', 'Europe', 'Americas', 'Asia', 'Africa'])

const brick_layout = d3.scaleQuantize()
.range([1, 2, 3, 4]); // Output groups

//get data
const dataFile = d3.csv('./data/results_semicon.csv', parse)

function parse(d) {
    // number_of_companies,
    //mean_betweeness_centrality,sd_betweeness_centrality,median_betweeness_centrality
    //mean_page_rank,sd_page_rank,median_page_rank
    d.number_of_companies = +d.number_of_companies;
    //let's fake a value for stabability between 1-4. later we need to add a column for the real values
    // d.stablility = Math.floor(Math.random() * (4 - 1) + 1)
    d.mean_betweeness_centrality = +d.mean_betweeness_centrality;
    d.mean_page_rank = +d.mean_page_rank;
    return d;
}

function init() {
    
    initGraphics();
    
    initPhysics();
    
    initInput();
    
    
    createObjects();
    
    // Create DragControls for moving blocks.
    dragControls = new DragControls(objects, camera, renderer.domElement);
    dragControls.addEventListener('dragend', function(event) {
        const object = event.object;
        // Retrieve the physics body linked to the object
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
            
            // Optional: Clear the velocity to avoid unexpected movement after dragging
            physicsBody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            physicsBody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
        }
    });
    // Initially, enable drag controls
    dragControls.enabled = false;
}

function initGraphics() {
    container = document.getElementById('container');
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 2000);
    camera.position.set(-12, 24, -12);
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xCCCCCC);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    // Better tone mapping for HDR content
    renderer.toneMapping = THREE.CineonToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    
    // Setup post-processing effects
    const renderPass = new RenderPass(scene, camera);
    
    // Create the bloom pass
    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        bloomParams.strength,
        bloomParams.radius,
        bloomParams.threshold
    );
    
    // Setup depth-of-field effect
    bokehPass = new BokehPass(scene, camera, {
        focus: dofParams.focus,
        aperture: dofParams.aperture,
        maxblur: dofParams.maxblur,
        width: window.innerWidth,
        height: window.innerHeight
    });
    bokehPass.enabled = dofEnabled;
    
    // Add a gamma correction pass (important for color accuracy)
    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    
    // Create a tone mapping pass
    toneMapPass = new ShaderPass(ToneMapShader);
    toneMapPass.uniforms["toneMapping"].value = renderer.toneMapping;
    toneMapPass.uniforms["exposure"].value = renderer.toneMappingExposure;
    
    // Set up the composer with the new pass order
    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(bokehPass);
    composer.addPass(toneMapPass);  // Apply tone mapping
    composer.addPass(gammaCorrectionPass); // Gamma correction should come last
    
    // Set up orbit controls
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };
    orbitControls.target.set(0, 2, 0);
    orbitControls.enabled = true;
    orbitControls.update();
    
    textureLoader = new THREE.TextureLoader();
    
    // Load HDR environment map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    new RGBELoader()
    .setPath('textures/hdr/')
    .load('overcast_2k.hdr', (hdrTexture) => {
        const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
        
        // Set environment map for the scene (affects all PBR materials)
        scene.environment = envMap;
        
        // Optionally set as background too (comment this out if you prefer your solid color background)
        scene.background = envMap;
        
        hdrTexture.dispose();
        pmremGenerator.dispose();
    });
    
    // You can reduce or remove some lights since environment lighting will provide ambient illumination
    // But keep one directional light for strong shadows
    const light = new THREE.DirectionalLight(0xffffff, 2); // Reduced intensity
    light.position.set(-10, 10, 5);
    light.castShadow = true;
    const d = 10;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.near = 2;
    light.shadow.camera.far = 50;
    light.shadow.mapSize.x = 1024;
    light.shadow.mapSize.y = 1024;
    scene.add(light);
    
    window.addEventListener('resize', onWindowResize);
    
    // Add GUI controls after setting up the renderer and effects
    setupGUI();
}

// Add this function to create and configure the GUI
function setupGUI() {
    // Create GUI instance
    gui = new GUI({ width: 300 });
    gui.title('Visual Effects');
    
    // Create Bloom folder
    const bloomFolder = gui.addFolder('Bloom Effect');
    
    // Add bloom enable/disable checkbox
    bloomFolder.add({ bloomEnabled: bloomEnabled }, 'bloomEnabled').name('Enable Bloom').onChange(value => {
        bloomEnabled = value;
        bloomPass.enabled = value;
    });
    
    bloomFolder.add(bloomParams, 'strength', 0, 3, 0.01).name('Strength').onChange(value => {
        bloomPass.strength = value;
    });
    bloomFolder.add(bloomParams, 'radius', 0, 1, 0.01).name('Radius').onChange(value => {
        bloomPass.radius = value;
    });
    bloomFolder.add(bloomParams, 'threshold', 0, 1, 0.01).name('Threshold').onChange(value => {
        bloomPass.threshold = value;
    });
    bloomFolder.open();
    
    // Create DOF folder
    const dofFolder = gui.addFolder('Depth of Field');

    dofFolder.add({ dofEnabled: dofEnabled }, 'dofEnabled').name('Enable Depth of Field').onChange(value => {
        dofEnabled = value;
        bokehPass.enabled = value;
    });
    
    // Store reference to the focus controller so we can update it
    const focusController = dofFolder.add(dofParams, 'focus', 1, 50, 0.1).name('Focus Distance').onChange(value => {
        bokehPass.uniforms['focus'].value = value;
    });
    
    // Add this line to store the controller reference as a property
    dofParams.controller = focusController;
    
    dofFolder.add(dofParams, 'aperture', 0.0001, 0.05, 0.0001).name('Aperture').onChange(value => {
        bokehPass.uniforms['aperture'].value = value;
    });
    dofFolder.add(dofParams, 'maxblur', 0, 0.05, 0.001).name('Max Blur').onChange(value => {
        bokehPass.uniforms['maxblur'].value = value;
    });
    dofFolder.add({ autoFocus: autoFocus }, 'autoFocus').name('Auto Focus').onChange(value => {
        autoFocus = value;
    });

    dofFolder.open();
    
    // Ground Material folder - only add if groundMaterial exists
    // We'll create it now as an empty folder and add controls later
    const groundFolder = gui.addFolder('Ground Material');
    groundFolder.open();
    
    // Store the folder reference for later use
    gui.groundFolder = groundFolder;
    
    // Add Rendering folder
    const renderFolder = gui.addFolder('Renderer');
    
    // Add tone mapping dropdown
    const toneMappings = {
        'None': THREE.NoToneMapping,
        'Linear': THREE.LinearToneMapping,
        'Reinhard': THREE.ReinhardToneMapping,
        'Cineon': THREE.CineonToneMapping,
        'ACES Filmic': THREE.ACESFilmicToneMapping,
        'AgX': THREE.AgXToneMapping,
        'Neutral': THREE.NeutralToneMapping
    };
    
    
    // Update the tone mapping GUI controls
    renderFolder.add({ toneMapping: 'Cineon' }, 'toneMapping', 
        Object.keys(toneMappings)).onChange(value => {
            const toneMapType = toneMappings[value];
            renderer.toneMapping = toneMapType; 
            
            // Also update the tone mapping pass
            if (toneMapPass && toneMapPass.uniforms) {
                toneMapPass.uniforms["toneMapping"].value = toneMapType;
            }
            
            scene.traverse(obj => {
                if (obj.material) obj.material.needsUpdate = true;
            });
        });
        
        renderFolder.add(renderer, 'toneMappingExposure', 0, 2, 0.1).name('Exposure')
        .onChange(value => {
            // Also update the tone mapping pass
            if (toneMapPass && toneMapPass.uniforms) {
                toneMapPass.uniforms["exposure"].value = value;
            }
        });
        
        // Add HDR environment map dropdown
        renderFolder.add({ hdrFile: hdrFiles[currentHdrIndex] }, 'hdrFile', hdrFiles).onChange(value => {
            loadHdrEnvironment(value);
        });
        
        renderFolder.open();
        
        // Position GUI in top right
        gui.domElement.style.position = 'absolute';
        gui.domElement.style.top = '10px';
        gui.domElement.style.right = '10px';
        
        // Gui for ground added in this function called in createObjects()
        // setupGroundMaterialGUI();
    }
        
    // Add this function to load HDR environments
    function loadHdrEnvironment(filename) {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        
        new RGBELoader()
        .setPath('textures/hdr/')
        .load(filename, (hdrTexture) => {
            const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
            
            // Set environment map for the scene (affects all PBR materials)
            scene.environment = envMap;
            
            // Also set as background
            scene.background = envMap;
            
            hdrTexture.dispose();
            pmremGenerator.dispose();
        });
    }
    
    function initPhysics() {
        
        // Physics configuration
        collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        broadphase = new Ammo.btDbvtBroadphase();
        solver = new Ammo.btSequentialImpulseConstraintSolver();
        softBodySolver = new Ammo.btDefaultSoftBodySolver();
        physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
        physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
        physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0));
        
        const solverInfo = physicsWorld.getSolverInfo();
        solverInfo.set_m_numIterations(60); // Increase solver iterations for stability
        
        transformAux1 = new Ammo.btTransform();
        
    }
    
    // Function to update the ground based on current settings
    function updateGround() {
        // Remove existing ground if any
        if (groundMirror) {
            scene.remove(groundMirror);
        }
        
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        
        if (useReflectiveGround) {
            // Use Reflector for reflective ground
            groundMirror = new Reflector(groundGeometry, {
                clipBias: 0.003,
                textureWidth: window.innerWidth * window.devicePixelRatio,
                textureHeight: window.innerHeight * window.devicePixelRatio,
                color: groundColor,
                reflectivity: groundReflectivity
            });
        } else {
            // Use standard material for non-reflective ground
            groundMirror = new THREE.Mesh(groundGeometry, 
                new THREE.MeshStandardMaterial({
                    color: groundColor,
                    roughness: 0.3,
                    metalness: 0.8,
                    envMapIntensity: 1.0
                })
            );
        }
        
        groundMirror.rotateX(-Math.PI / 2);
        groundMirror.position.set(0, -0.01, 0);
        groundMirror.visible = groundVisible;
        groundMirror.receiveShadow = true;
        scene.add(groundMirror);
        
        // Update material reference
        groundMaterial = groundMirror.material;
    }
    
    // Modify the ground creation in createObjects function:
    function createObjects() {
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        
        // Ground - replace the standard parallelpiped with a reflector
        pos.set(0, -0.5, 0);
        quat.set(0, 0, 0, 1);
        
        updateGround(); // Create ground based on current settings
        
        // Still create the physics collision ground
        const ground = createParalellepiped(400, 1, 400, 0, pos, quat, 
            new THREE.MeshStandardMaterial({ 
                color: 0x000000,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            })
        );
        
        // Add GUI controls for reflection properties
        groundMaterial = groundMirror.material;
        setupGroundMaterialGUI();
        
        // Jenga Block Dimensions
        // const brickMass = 5;
        const brickMass = 100;
        const brickLength = 10.2; // Longest dimension of the brick
        const brickDepth = brickLength / 3; // Width of the brick, so that 3 blocks side by side equal the brick length
        const brickHeight = brickLength / 4; // Shortest dimension, height of the brick
        const heightOffset = -0.0008; // Offset to prevent bouncing
        
        //access data
        dataFile.then((data) => {
            console.log(data)
            
            //set up scale for determin the number of bricks per layer
            brick_layout.domain(d3.extent(data, d => d.mean_betweeness_centrality)) // Thresholds divide the input
            
            //sort data based on a value, it can sort by other ways
            console.log(currentView.id)
            data.sort((a, b) => b[currentView.id] - a[currentView.id])
            
            // Limit to only the first soso data entries if desired
            const limitLayers = false; // Toggle this to false to use all data entries
            if (limitLayers) {
                data = data.slice(0, 20);
            }
            
            data.forEach((d, j) => {
                //get region color for this country
                d.color = colorScale(d.macro_region);
                
                const numBricksPerLayer = 3; //alwasy show three bricks for layout.
                //either create all bricks per layer or based on data   
                const brickLayoutPerLayer = showAllBricks ? 4 : brick_layout(d.mean_betweeness_centrality);
                // console.log(brickLayoutPerLayer)
                
                // Determine layer rotation and positioning
                const isOddLayer = j % 2 !== 0;
                const x0 = isOddLayer ? -(numBricksPerLayer * brickDepth / numBricksPerLayer) : 0;
                // const z0 = isOddLayer ? -(brickLength / numBricksPerLayer - brickDepth / numBricksPerLayer) : -(numBricksPerLayer * brickDepth / numBricksPerLayer);
                const z0 = isOddLayer ? 0 : -(numBricksPerLayer * brickDepth / numBricksPerLayer);
                
                pos.set(x0, (brickHeight + heightOffset) * (j + .5), z0);
                // pos.set(isOddLayer ? x0 : 0, (brickHeight+heightOffset)* (j + .5), isOddLayer ? 0 : z0); // Adjust the initial position for each layer
                quat.set(0, isOddLayer ? 0.7071 : 0, 0, isOddLayer ? 0.7071 : 1); // Rotate 90 degrees for odd layers
                
                //create bricks
                //TODO: define the fixed brick layout for 4 groups
                for (let i = 0; i < numBricksPerLayer; i++) {
                    //skip bricks based on brickLayoutPerLayer: 1,2,3,4.
                    //4: keep all three bricks -- 1 1 1
                    //3: skip the middle one -----1 0 1
                    //2: skip the last one -------1 1 0
                    //1: only keep the middle one-0 1 0
                    if ((i === 0 && brickLayoutPerLayer > 1) || (i === 1 && brickLayoutPerLayer !== 3) || i === 2 && brickLayoutPerLayer > 2) {
                        
                        const brick = createParalellepiped(
                            brickLength, // Length of the brick
                            brickHeight, // Height of the brick
                            brickDepth, // Depth of the brick
                            brickMass, // Mass of the brick
                            pos, // Position of the brick
                            quat, // Rotation
                            createMaterial(d.color) // Material of the brick
                        );
                        
                        brick.castShadow = true;
                        brick.receiveShadow = true;
                        brick.userData.index = j * numBricksPerLayer + i;
                        brick.userData.region = d.macro_region;
                        brick.userData.country = d.country;
                        brick.userData.companies = d.number_of_companies;
                        brick.userData.centrality = d.mean_betweeness_centrality;
                        brick.userData.pagerank = d.mean_page_rank;
                        brick.userData.color = d.color
                        brick.userData.brickLayoutPerLayer = brickLayoutPerLayer //for debugging
                        
                        
                        objects.push(brick);
                    }
                    
                    if (isOddLayer) {
                        pos.x = i * brickDepth;
                        // pos.x += brickDepth; // Move the position to place the next brick side by side along the x-axis
                    } else {
                        pos.z = i * brickDepth;
                        // pos.z += brickDepth; // Move the position to place the next brick side by side along the z-axis
                    }
                }
            })
            
            return objects;
        })
        
    }
    
    
    function createParalellepiped(sx, sy, sz, mass, pos, quat, material) {
        
        const threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
        const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
        shape.setMargin(margin);
        
        createRigidBody(threeObject, shape, mass, pos, quat);
        
        return threeObject;
        
    }
    
    function createRigidBody(threeObject, physicsShape, mass, pos, quat) {
        
        threeObject.position.copy(pos);
        threeObject.quaternion.copy(quat);
        
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        const motionState = new Ammo.btDefaultMotionState(transform);
        
        const localInertia = new Ammo.btVector3(0, 0, 0);
        physicsShape.calculateLocalInertia(mass, localInertia);
        
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);
        body.setSleepingThresholds(0.01, 0.01);
        // body.setFriction(.5);
        body.setFriction(1);
        body.setRestitution(.0);
        body.setDamping(0.5, 1); // Adjust values between 0 (no damping) and 1 (max damping):
        // linear damping, which will gradually slow down the object's movement along its path.
        // angular damping, which will gradually reduce the object's spinning motion.
        body.setCcdMotionThreshold(0.1);
        body.setCcdSweptSphereRadius(0.05);
        
        
        
        threeObject.userData.physicsBody = body;
        
        scene.add(threeObject);
        
        if (mass > 0) {
            rigidBodies.push(threeObject);
        }
        
        physicsWorld.addRigidBody(body);
        
    }
    
    function createRandomColor() {
        return Math.floor(Math.random() * (1 << 12));
    }
    
    // function createMaterial(color) {
    // //     // return new THREE.MeshPhongMaterial( { color: createRandomColor() } );
    //     return new THREE.MeshPhongMaterial({ color: color, shininess:50, specular: 0xffffff });
    // }
    
    function createMaterial(color) {
        // Use MeshStandardMaterial for PBR rendering
        return new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.3,         // Lower values = more reflective/glossy (0-1)
            metalness: 0.5,         // Controls how "metal-like" the surface appears (0-1)
            flatShading: true,     // Smooth shading for more realistic appearance
            envMapIntensity: .8    // How strongly the environment map affects the material
        });
    }
    
    function initInput() {
        const viewOptions = [{
            id: "number_of_companies",
            name: 'Number of Companies',
        },
        {
            id: "mean_page_rank",
            name: 'Page Rank',
        },
        
    ]
    currentView = viewOptions[0]
    createDropdown(viewContainer, "view-dropdown", viewOptions, currentView, (m) => {
        currentView = m;
        runPhysics = false;
        removeAllBlocks(); // Clear previous blocks
        createObjects(); // Create new blocks
        console.log(currentView)
    })
    
    
    document.addEventListener('mousedown', event => {
        timeDiv = 4;
    });
    document.addEventListener('mouseup', event => {
        timeDiv = defaultTimeDiv;
    });
    // Add mouse move event listener
    document.addEventListener('mousemove', onMouseMove);
    
    // Function to handle the spacebar and enter press
    document.addEventListener('keydown', (event) => {
        
        if (event.key === " " || event.code === "Space") {
            runPhysics = false;
            removeAllBlocks(); // Clear previous blocks
            createObjects(); // Create new blocks
        } else if (event.code === "Enter") {
            runPhysics = !runPhysics; // toggle physic simulation on/off
        } else if (event.code === "KeyM") {
            controls.touches.ONE = (controls.touches.ONE === THREE.TOUCH.PAN) ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN;
        } else if (event.metaKey || event.ctrlKey) { // Check for the command key (event.metaKey on macOS; on Windows you might check event.ctrlKey)
            console.log("Block moving enabled");
            dragControls.enabled = true; // Disable dragging so that OrbitControls can work.
            orbitControls.enabled = false; // Enable OrbitControls
        }
    });
    
    document.addEventListener('keyup', (event) => {
        if (!event.metaKey && !event.ctrlKey) {
            console.log("Orbit enabled");
            orbitControls.enabled = true;
            dragControls.enabled = false;
        }
    });
    
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    
    // Update bokeh pass size
    bokehPass.renderTargetDepth.setSize(window.innerWidth, window.innerHeight);
    bokehPass.renderTargetColor.setSize(window.innerWidth, window.innerHeight);
    
    // Update reflector resolution if it exists
    if (groundMirror) {
        groundMirror.getRenderTarget().setSize(
            window.innerWidth * window.devicePixelRatio, 
            window.innerHeight * window.devicePixelRatio
        );
    }
}

function animate() {
    // console.log(rigidBodies)
    render();
    // stats.update();
    
}

// Modify your render function to include auto-focus
function render() {
    const deltaTime = clock.getDelta();
    
    if (runPhysics) updatePhysics(deltaTime);
    
    // Auto-focus the camera on the tower
    if (autoFocus && frameCounter % focusUpdateFrequency === 0) {
        updateFocusOnTower();
    }
    frameCounter++;
    
    // Use composer.render() instead of renderer.render()
    composer.render();
}

function updatePhysics(deltaTime) {
    
    // Hinge control
    // hinge.enableAngularMotor( true, 1.5 * armMovement, 50 );
    
    // Step world
    physicsWorld.stepSimulation(deltaTime / timeDiv, 100);
    
    // Update rigid bodies
    for (let i = 0, il = rigidBodies.length; i < il; i++) {
        
        const objThree = rigidBodies[i];
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();
        if (ms) {
            
            ms.getWorldTransform(transformAux1);
            const p = transformAux1.getOrigin();
            const q = transformAux1.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
            
        }
    }
}

// Add this function to calculate and update the focus
function updateFocusOnTower() {
    if (rigidBodies.length === 0) return;
    
    // Option 1: Use center of tower (computationally cheap)
    calculateTowerCenter();
    const distanceToTower = camera.position.distanceTo(towerCenter);
    
    // Option 2: Use raycasting to find exact distance (more accurate but more expensive)
    // Cast ray from camera toward tower center
    raycaster.set(camera.position, 
        new THREE.Vector3().subVectors(towerCenter, camera.position).normalize());
        const intersects = raycaster.intersectObjects(rigidBodies);
        
        let focusDistance = distanceToTower;
        if (intersects.length > 0) {
            // Use the first intersection distance
            focusDistance = intersects[0].distance;
        }
        
        // Smoothly transition focus
        const currentFocus = bokehPass.uniforms['focus'].value;
        bokehPass.uniforms['focus'].value = THREE.MathUtils.lerp(
            currentFocus, 
            focusDistance, 
            0.9 // Adjust speed of focus change (0-1)
        );
        
        // Update the value in our parameters object
        dofParams.focus = bokehPass.uniforms['focus'].value;
        
        // Update the GUI slider to reflect the current value
        if (dofParams.controller) {
            dofParams.controller.setValue(dofParams.focus);
        }
    }
    
    // Calculate the approximate center of the Jenga tower
    function calculateTowerCenter() {
        if (rigidBodies.length === 0) return;
        
        // Find the average position of all bricks
        const sum = new THREE.Vector3();
        rigidBodies.forEach(body => {
            sum.add(body.position);
        });
        
        towerCenter.copy(sum.divideScalar(rigidBodies.length));
    }
    
    function onMouseMove(event) {
        // Calculate normalized mouse position
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Perform raycasting
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(rigidBodies);
        
        // Check if any block is intersected
        if (intersects.length > 0) {
            const intersectedBlock = intersects[0].object;
            
            // Display index information (or other data)
            showBlockInfo(intersectedBlock);
        } else {
            hideBlockInfo(); // Hide info when not hovering over a block
        }
        // console.log(camera.position)
    }
    
    
    // Function to display block info (create a div or tooltip as needed)
    function showBlockInfo(block) {
        const hoverBox = document.getElementById('hoverBox');
        hoverBox.style.display = 'flex';
        hoverBox.innerHTML = `
    <div class="title-container">
        <span class="title">${block.userData.country}</span>
        <span class="pill" style="border-color:${block.userData.color}">${block.userData.region}</span>
    </div>
    <div class="subtitle">
        This country contains ${block.userData.companies} companies, connected to the global network with an average betweenness centrality of ${block.userData.centrality.toFixed(4)} and based on an average PageRank of ${d3.format(".4f")(block.userData.pagerank)}. Further details are displayed below.
    </div>
    <div id="infographicBox">
        Add infographics here (bricklayout ${block.userData.brickLayoutPerLayer})
    </div>
`;
        hoverBox.style.top = `${event.clientY}px`;
        hoverBox.style.left = `${event.clientX + 15}px`;
    }
    
    function hideBlockInfo() {
        const hoverBox = document.getElementById('hoverBox');
        hoverBox.style.display = 'none';
    }
    
    function removeAllBlocks() {
        // Remove rigid bodies from the physics world
        rigidBodies.forEach(obj => {
            physicsWorld.removeRigidBody(obj.userData.physicsBody);
            scene.remove(obj);
        });
        rigidBodies.length = 0; // Clear the array
    }

// Updated ground material GUI
function setupGroundMaterialGUI() {
    if (!gui || !gui.groundFolder) return;
    
    // Clear existing controllers
    while(gui.groundFolder.__controllers && gui.groundFolder.__controllers.length > 0) {
        gui.groundFolder.__controllers[0].remove();
    }
    
    // Add visibility toggle
    gui.groundFolder.add({ visible: groundVisible }, 'visible')
        .name('Show Ground')
        .onChange(value => {
            groundVisible = value;
            if (groundMirror) {
                groundMirror.visible = value;
            }
        });
    
    // Add reflective ground toggle
    gui.groundFolder.add({ reflective: useReflectiveGround }, 'reflective')
        .name('Reflective Ground')
        .onChange(value => {
            useReflectiveGround = value;
            updateGround();
        });
    
    // Add controls specific to ground type
    if (useReflectiveGround) {
        // Reflector-specific controls
        gui.groundFolder.add({ reflectivity: groundReflectivity }, 'reflectivity', 0, 1, 0.01)
            .name('Reflectivity')
            .onChange(value => {
                groundReflectivity = value;
                updateGround();
            });
        
        gui.groundFolder.add({ clipBias: 0.003 }, 'clipBias', 0, 0.01, 0.0001)
            .name('Clip Bias')
            .onChange(value => {
                updateGround();
            });
    } else {
        // Standard material controls for non-reflective ground
        const material = groundMirror.material;
        gui.groundFolder.add(material, 'roughness', 0, 1, 0.01).name('Roughness');
        gui.groundFolder.add(material, 'metalness', 0, 1, 0.01).name('Metalness');
        gui.groundFolder.add(material, 'envMapIntensity', 0, 3, 0.1).name('EnvMap Intensity');
    }
    
    // Common controls for both ground types
    gui.groundFolder.addColor({ color: '#ffffff' }, 'color')
        .name('Ground Color')
        .onChange(value => {
            groundColor = new THREE.Color(value).getHex();
            if (useReflectiveGround) {
                updateGround(); // Reflector needs a full rebuild
            } else {
                groundMirror.material.color.set(groundColor);
            }
        });
}