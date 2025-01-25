    import * as THREE from 'three';

    import Stats from 'three/addons/stats.module.js';

    import { DragControls } from 'three/addons/DragControls.js';
    import { OrbitControls } from 'three/addons/OrbitControls.js';

    // Graphics variables
    let container, stats;
    let camera, controls, scene, renderer;
    let textureLoader;
    let enableSelection = false;
    let objects = [];
    const clock = new THREE.Clock();

    // Physics variables
    const gravityConstant = -9.8;
    let collisionConfiguration;
    let dispatcher;
    let broadphase;
    let solver;
    let softBodySolver;
    let physicsWorld;
    const rigidBodies = [];
    const margin = 0.05;
    // let hinge;
    // let rope;
    let transformAux1;

    let runPhysics = false;

    let timeDiv = 1

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

    const brick_level = d3.scaleQuantize()
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

        controls = new DragControls(objects, camera, renderer.domElement);
        controls.update();

        controls.addEventListener('dragend', function(event) {
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

                // Update the physics body's transform
                physicsBody.setWorldTransform(transform);

                // Optional: Clear the velocity to avoid unexpected movement after dragging
                physicsBody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
                physicsBody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
            }
        });
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
        container.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 2, 0);
        controls.update();

        textureLoader = new THREE.TextureLoader();

        const ambientLight = new THREE.AmbientLight(0xbbbbbb);
        scene.add(ambientLight);

        const light = new THREE.DirectionalLight(0xffffff, 3);
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

        // stats = new Stats();
        // stats.domElement.style.position = 'absolute';
        // stats.domElement.style.top = '0px';
        // container.appendChild( stats.domElement );

        //

        window.addEventListener('resize', onWindowResize);

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

        transformAux1 = new Ammo.btTransform();

    }

    function createObjects() {

        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();

        // Ground
        pos.set(0, -0.5, 0);
        quat.set(0, 0, 0, 1);
        const ground = createParalellepiped(40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial({ color: 0xFFFFFF }));
        ground.castShadow = true;
        ground.receiveShadow = true;
        textureLoader.load('textures/bg4.jpg', function(texture) {

            texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            ground.material.map = texture;
            ground.material.needsUpdate = true;

        });

        // Jenga Block Dimensions
        const brickMass = 0.5;
        const brickLength = 1.2; // Longest dimension of the brick
        const brickDepth = brickLength / 3; // Width of the brick, so that 3 blocks side by side equal the brick length
        const brickHeight = 0.3; // Shortest dimension, height of the brick
        //access data
        dataFile.then((data) => {
            console.log(data)

            //set up scale for determin the number of bricks per layer
            brick_level.domain(d3.extent(data, d => d.mean_betweeness_centrality)) // Thresholds divide the input

            //sort data based on a value, it can sort by other ways
            console.log(currentView.id)
            data.sort((a, b) => a[currentView.id] - b[currentView.id])

            const numLayers = data.length; // Define the number of layers for the tower based on number of countries

            data.forEach((d, j) => {
                //get region color for this country
                d.color = colorScale(d.macro_region);
                //get numBricksPerLayer
                d.bricks = brick_level(d.mean_betweeness_centrality)
                const numBricksPerLayer = d.bricks

                // Determine layer rotation and positioning
                const isOddLayer = j % 2 !== 0;
                const x0 = isOddLayer ? -(numBricksPerLayer * brickDepth / numBricksPerLayer) : 0;
                const z0 = isOddLayer ? -(brickLength / numBricksPerLayer - brickDepth / numBricksPerLayer) : -(numBricksPerLayer * brickDepth / numBricksPerLayer);

                pos.set(isOddLayer ? x0 : 0, brickHeight * (j + 0.5), isOddLayer ? 0 : z0); // Adjust the initial position for each layer
                quat.set(0, isOddLayer ? 0.7071 : 0, 0, isOddLayer ? 0.7071 : 1); // Rotate 90 degrees for odd layers

                //create bricks
                //TODO: define the fixed brick layout for 4 groups
                for (let i = 0; i < numBricksPerLayer; i++) {
                    // if (Math.random() < .8) {
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


                    objects.push(brick);
                    // }

                    if (isOddLayer) {
                        pos.x += brickDepth; // Move the position to place the next brick side by side along the x-axis
                        // pos.z = pos.z + brickLength/3
                    } else {
                        pos.z += brickDepth; // Move the position to place the next brick side by side along the z-axis
                        // pos.x = pos.x + brickLength/3
                    }

                    // pos.z = pos.z * 1.2
                }

            })
            // for (let j = 0; j < numLayers; j++) {
            //                 }

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

        threeObject.userData.physicsBody = body;

        scene.add(threeObject);

        if (mass > 0) {

            rigidBodies.push(threeObject);

            // Disable deactivation
            body.setActivationState(4);

        }

        physicsWorld.addRigidBody(body);

    }

    function createRandomColor() {

        return Math.floor(Math.random() * (1 << 12));

    }

    function createMaterial(color) {

        // return new THREE.MeshPhongMaterial( { color: createRandomColor() } );
        return new THREE.MeshPhongMaterial({ color: color });

    }

    function initInput() {
        // if (event.button == 0) { // left click for mouse
        // } else if (event.button == 1) { // wheel click for mouse
        // } else if (event.button == 2){   // right click for mouse
        // }
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
            timeDiv = 10;
        });
        document.addEventListener('mouseup', event => {
            timeDiv = 1;;
        });
        // Add mouse move event listener
        document.addEventListener('mousemove', onMouseMove);

        // Function to handle the spacebar and enter press
        document.addEventListener('keydown', (event) => {

            if (event.key === " " || event.keyCode === 32) {
                runPhysics = false;
                removeAllBlocks(); // Clear previous blocks
                createObjects(); // Create new blocks
            } else if (event.keyCode === 13) {
                runPhysics = !runPhysics; // toggle physic simulation on/off
            } else if (event.keyCode === 77) {
                controls.touches.ONE = (controls.touches.ONE === THREE.TOUCH.PAN) ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN;
            }

        });


    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    function animate() {
        // console.log(rigidBodies)
        render();
        // stats.update();

    }

    function render() {

        const deltaTime = clock.getDelta();

        if (runPhysics) updatePhysics(deltaTime);

        renderer.render(scene, camera);

    }

    function updatePhysics(deltaTime) {

        // Hinge control
        // hinge.enableAngularMotor( true, 1.5 * armMovement, 50 );

        // Step world
        physicsWorld.stepSimulation(deltaTime / timeDiv, 10);

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

    function removeAllBlocks() {
        // Remove rigid bodies from the physics world
        rigidBodies.forEach(obj => {
            physicsWorld.removeRigidBody(obj.userData.physicsBody);
            scene.remove(obj);
        });
        rigidBodies.length = 0; // Clear the array
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
            Add infographics here
        </div>
    `;
        hoverBox.style.top = `${event.clientY}px`;
        hoverBox.style.left = `${event.clientX + 15}px`;
    }

    function hideBlockInfo() {
        const hoverBox = document.getElementById('hoverBox');
        hoverBox.style.display = 'none';
    }