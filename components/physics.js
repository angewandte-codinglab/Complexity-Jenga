import * as THREE from 'three';
import { state } from './state.js';

export function initPhysics() {
    // Physics configuration
    state.collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    state.dispatcher = new Ammo.btCollisionDispatcher(state.collisionConfiguration);
    state.broadphase = new Ammo.btDbvtBroadphase();
    state.solver = new Ammo.btSequentialImpulseConstraintSolver();
    state.softBodySolver = new Ammo.btDefaultSoftBodySolver();
    
    state.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(
        state.dispatcher, 
        state.broadphase, 
        state.solver, 
        state.collisionConfiguration, 
        state.softBodySolver
    );
    
    state.physicsWorld.setGravity(new Ammo.btVector3(0, state.gravityConstant, 0));
    state.physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, state.gravityConstant, 0));

    const solverInfo = state.physicsWorld.getSolverInfo();
    solverInfo.set_m_numIterations(60); // Increase solver iterations for stability

    state.transformAux1 = new Ammo.btTransform();
}

export function createObjects() {
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();

    // Ground
    // createGround(pos, quat);
    createGroundInvisible(pos, quat);

    // Jenga blocks from data
    createJengaTower();
}

function createGroundInvisible(pos, quat) {
    pos.set(0, -0.5, 0);
    quat.set(0, 0, 0, 1);
    
    // Create invisible material
    const invisibleMaterial = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0,
        side: THREE.DoubleSide
    });
    
    const ground = createParalellepiped(80*.75, 1, 78, 0, pos, quat, invisibleMaterial);
    
    // Remove shadow casting/receiving for invisible ground
    ground.castShadow = false;
    ground.receiveShadow = true;
    
    // Remove texture loading since the ground is invisible
    // state.textureLoader.load('textures/bg4.png', function(texture) {...});
}

function createGround(pos, quat) {
    pos.set(0, -0.5, 0);
    quat.set(0, 0, 0, 1);
    
    const ground = createParalellepiped(80*.75, 1, 78, 0, pos, quat, 
        new THREE.MeshPhongMaterial({ color: 0xFFFFFF })
    );
    
    ground.castShadow = true;
    ground.receiveShadow = true;
    
    state.textureLoader.load('textures/bg4.png', function(texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        ground.material.map = texture;
        ground.material.needsUpdate = true;
    });
}

function createJengaTower() {
    // Jenga Block Dimensions
    const brickMass = 100;
    const brickLength = 1.2*4; 
    const brickDepth = brickLength / 3;
    const brickHeight = brickLength / 4;
    const heightOffset = -0.0008;
    
    // Load data and create blocks
    import('./data.js').then(module => {
        module.loadData().then(data => {
            const results = data.results; // ← FIX: extract results array
            
            // console.log(results);
            
            // Set up scale for determining the number of bricks per layer
            state.brick_layout.domain(d3.extent(results, d => d.mean_betweeness_centrality));
            
            // Sort data based on current view
            console.log(state.currentView.id);
            results.sort((a, b) => b[state.currentView.id] - a[state.currentView.id]);
            
            // Limit to only the first N data entries if desired
            const limitLayers = false;
            if (limitLayers) {
                data = results.slice(0, 20);
            } else {
                data = results;
            }
            
            createBlocksFromData(data, brickMass, brickLength, brickDepth, brickHeight, heightOffset);
        });
    });
}

function createBlocksFromData(data, brickMass, brickLength, brickDepth, brickHeight, heightOffset) {
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    
    data.forEach((d, j) => {
        // Get region color for this country
        d.color = state.colorScale(d.macro_region);
        
        const numBricksPerLayer = 3; 
        const brickLayoutPerLayer = state.showAllBricks ? 4 : state.brick_layout(d.mean_betweeness_centrality);
        
        // Determine layer rotation and positioning
        const isOddLayer = j % 2 !== 0;
        const x0 = isOddLayer ? -(numBricksPerLayer * brickDepth / numBricksPerLayer) : 0;
        const z0 = isOddLayer ? 0 : -(numBricksPerLayer * brickDepth / numBricksPerLayer);
        
        pos.set(x0, (brickHeight + heightOffset) * (j + .5), z0);
        quat.set(0, isOddLayer ? 0.7071 : 0, 0, isOddLayer ? 0.7071 : 1); // Rotate 90 degrees for odd layers
        
        // Create bricks
        for (let i = 0; i < numBricksPerLayer; i++) {
            // Skip bricks based on brickLayoutPerLayer: 1,2,3,4
            if ((i === 0 && brickLayoutPerLayer > 1) || 
                (i === 1 && brickLayoutPerLayer !== 3) || 
                (i === 2 && brickLayoutPerLayer > 2)) {
                
                const brick = createParalellepiped(
                    brickLength,
                    brickHeight,
                    brickDepth,
                    brickMass,
                    pos,
                    quat,
                    createMaterialSimple(d.color)
                    // createMaterial(d.color)
                );
                
                brick.castShadow = true;
                brick.receiveShadow = true;
                
                // Store data with the brick
                brick.userData.index = j * numBricksPerLayer + i;
                brick.userData.region = d.macro_region;
                brick.userData.country = d.country;
                brick.userData.companies = d.number_of_companies;
                brick.userData.centrality = d.mean_betweeness_centrality;
                brick.userData.pagerank = d.mean_page_rank;
                brick.userData.color = d.color;
                brick.userData.brickLayoutPerLayer = brickLayoutPerLayer;
                
                state.objects.push(brick);
            }
            
            // Move position for the next brick
            if (isOddLayer) {
                pos.x = i * brickDepth;
            } else {
                pos.z = i * brickDepth;
            }
        }
    });
}

export function createParalellepiped(sx, sy, sz, mass, pos, quat, material) {
    const threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
    const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
    shape.setMargin(state.margin);
    
    createRigidBody(threeObject, shape, mass, pos, quat);
    
    return threeObject;
}

export function createRigidBody(threeObject, physicsShape, mass, pos, quat) {
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
    body.setFriction(.5);
    body.setRestitution(0.2);
    // body.setDamping(0.5, 1); // Linear and angular damping, more stability but less realistic behaviour
    body.setDamping(0.2, 0.4);
    body.setCcdMotionThreshold(0.1);
    body.setCcdSweptSphereRadius(0.05);
    
    threeObject.userData.physicsBody = body;
    
    state.scene.add(threeObject);
    
    if (mass > 0) {
        state.rigidBodies.push(threeObject);
    }
    
    state.physicsWorld.addRigidBody(body);
}

// Based on approach found here: https://jsfiddle.net/prisoner849/kmau6591/
function createMaterial(color) {
    // Convert hex color to RGB vector for shader
    const threeColor = new THREE.Color(color);
    
    // Define shader code
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `;
    
    const fragmentShader = `
        varying vec2 vUv;
        uniform float thickness;
        uniform vec3 color;
        
        float edgeFactor(vec2 p){
            vec2 grid = abs(fract(p - 0.5) - 0.5) / fwidth(p) / thickness;
            return min(grid.x, grid.y);
        }
        
        void main() {
            float a = edgeFactor(vUv);
            
         // Mix between black for the edges and the provided color for the main surface
            vec3 c = mix(vec3(0.0), color, a);
            
            gl_FragColor = vec4(c, 1.0);
        }
    `;
    
    // Create shader material with uniforms
    return new THREE.ShaderMaterial({
        uniforms: {
            thickness: { value: 1 },  // Edge thickness (adjust as needed)
            color: { value: new THREE.Vector3(threeColor.r, threeColor.g, threeColor.b) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.DoubleSide  // Render both sides for complete outline effect
    });
}

function createMaterialSimple(color) {
    return new THREE.MeshPhongMaterial({ color: color });
}

export function removeAllBlocks() {
    // Remove rigid bodies from the physics world
    state.rigidBodies.forEach(obj => {
        state.physicsWorld.removeRigidBody(obj.userData.physicsBody);
        state.scene.remove(obj);
    });
    state.rigidBodies.length = 0; // Clear the array
    state.objects.length = 0; // Clear objects array too
}