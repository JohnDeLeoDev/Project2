// John DeLeo
// WPI
// CS543
// Project 2
/***************************************************************************************/
// Project uses WebGL to create a scene with real time shadows, lighting, and textures
// Shadows are created using shadow mapping and depth textures
// Lighting is created using a point light source
/***************************************************************************************/

/***************************************************************************************/
// Variables
/***************************************************************************************/
let canvas
let gl
let programs = {}
let models = {}
models.buffers
let lights = {}
let cameras = {}
let textures = {}
/***************************************************************************************/
// Main variables object used in the project
/***************************************************************************************/
let mainVariables = {
    lightOn: true,
    shadowEnabled: true,
    carBoundary: 3.2,
    carYOffset: -0.3,
    cameraMoving: false,
    cameraFollowing: false,
    carMoving: false,
    carTime: 0,
    cameraTime: 0,
    shadowMapSize: 2048,
    sceneSize: 10,
    carPathPoints: [],
    smoothCarPath: [],
    carPathVectors: [],
    inputs: {},
    displays: {},
    materialShininess: 32,
    envReflEnabled: true,
    refractEnabled: false,
}
/***************************************************************************************/

let carPathPoints = [
    // left edge
    vec3(-mainVariables.carBoundary, mainVariables.carYOffset, 0),
    // bottom left
    vec3(
        -mainVariables.carBoundary,
        mainVariables.carYOffset,
        -mainVariables.carBoundary
    ),
    // bottom edge
    vec3(0, mainVariables.carYOffset, -mainVariables.carBoundary),
    // bottom right
    vec3(
        mainVariables.carBoundary,
        mainVariables.carYOffset,
        -mainVariables.carBoundary
    ),
    // right edge
    vec3(mainVariables.carBoundary, mainVariables.carYOffset, 0),
    // top right
    vec3(
        mainVariables.carBoundary,
        mainVariables.carYOffset,
        mainVariables.carBoundary
    ),
    // top edge
    vec3(0, mainVariables.carYOffset, mainVariables.carBoundary),
    // top left
    vec3(
        -mainVariables.carBoundary,
        mainVariables.carYOffset,
        mainVariables.carBoundary
    ),
    // left edge
    vec3(-mainVariables.carBoundary, mainVariables.carYOffset, 0),
    // top left
    vec3(
        -mainVariables.carBoundary,
        mainVariables.carYOffset,
        mainVariables.carBoundary
    ),
]
mainVariables.carPathPoints = carPathPoints

/***************************************************************************************/
// makes path for car to follow - uses bezier curves
/***************************************************************************************/
function makePath() {
    let path = []
    let points = carPathPoints
    let divisions = 100
    let t = 0
    let step = 1 / divisions
    let p0 = points[0]
    let p1 = points[1]
    let p2 = points[2]
    let p3 = points[3]
    let p4 = points[4]
    let p5 = points[5]
    let p6 = points[6]
    let p7 = points[7]

    // p0 to p2 - left edge to bottom edge - -boundary, 0 to 0, boundary
    // starting coord is p0
    // ending coord is p2
    for (let i = 0; i <= divisions; i++) {
        let x =
            Math.pow(1 - t, 3) * p0[0] +
            3 * Math.pow(1 - t, 2) * t * p1[0] +
            3 * (1 - t) * Math.pow(t, 2) * p2[0] +
            Math.pow(t, 3) * p2[0]
        let y =
            Math.pow(1 - t, 3) * p0[1] +
            3 * Math.pow(1 - t, 2) * t * p1[1] +
            3 * (1 - t) * Math.pow(t, 2) * p2[1] +
            Math.pow(t, 3) * p2[1]
        let z =
            Math.pow(1 - t, 3) * p0[2] +
            3 * Math.pow(1 - t, 2) * t * p1[2] +
            3 * (1 - t) * Math.pow(t, 2) * p2[2] +
            Math.pow(t, 3) * p2[2]
        path.push(vec3(x, y, z))
        t += step
    }

    // p2 to p4 - bottom edge to right edge - boundary, 0 to 0, -boundary
    // starting coord is p2
    // ending coord is p4
    t = 0
    for (let i = 0; i <= divisions; i++) {
        let x =
            Math.pow(1 - t, 3) * p2[0] +
            3 * Math.pow(1 - t, 2) * t * p3[0] +
            3 * (1 - t) * Math.pow(t, 2) * p4[0] +
            Math.pow(t, 3) * p4[0]
        let y =
            Math.pow(1 - t, 3) * p2[1] +
            3 * Math.pow(1 - t, 2) * t * p3[1] +
            3 * (1 - t) * Math.pow(t, 2) * p4[1] +
            Math.pow(t, 3) * p4[1]
        let z =
            Math.pow(1 - t, 3) * p2[2] +
            3 * Math.pow(1 - t, 2) * t * p3[2] +
            3 * (1 - t) * Math.pow(t, 2) * p4[2] +
            Math.pow(t, 3) * p4[2]
        path.push(vec3(x, y, z))
        t += step
    }

    // p4 to p6 - right edge to top edge - boundary, 0 to 0, boundary
    // starting coord is p4
    // ending coord is p6
    t = 0
    for (let i = 0; i <= divisions; i++) {
        let x =
            Math.pow(1 - t, 3) * p4[0] +
            3 * Math.pow(1 - t, 2) * t * p5[0] +
            3 * (1 - t) * Math.pow(t, 2) * p6[0] +
            Math.pow(t, 3) * p6[0]
        let y =
            Math.pow(1 - t, 3) * p4[1] +
            3 * Math.pow(1 - t, 2) * t * p5[1] +
            3 * (1 - t) * Math.pow(t, 2) * p6[1] +
            Math.pow(t, 3) * p6[1]
        let z =
            Math.pow(1 - t, 3) * p4[2] +
            3 * Math.pow(1 - t, 2) * t * p5[2] +
            3 * (1 - t) * Math.pow(t, 2) * p6[2] +
            Math.pow(t, 3) * p6[2]
        path.push(vec3(x, y, z))
        t += step
    }

    // p6 to p0 - top edge to left edge - boundary, 0 to 0, -boundary
    // starting coord is p6
    // ending coord is p0
    t = 0
    for (let i = 0; i <= divisions; i++) {
        let x =
            Math.pow(1 - t, 3) * p6[0] +
            3 * Math.pow(1 - t, 2) * t * p7[0] +
            3 * (1 - t) * Math.pow(t, 2) * p0[0] +
            Math.pow(t, 3) * p0[0]
        let y =
            Math.pow(1 - t, 3) * p6[1] +
            3 * Math.pow(1 - t, 2) * t * p7[1] +
            3 * (1 - t) * Math.pow(t, 2) * p0[1] +
            Math.pow(t, 3) * p0[1]
        let z =
            Math.pow(1 - t, 3) * p6[2] +
            3 * Math.pow(1 - t, 2) * t * p7[2] +
            3 * (1 - t) * Math.pow(t, 2) * p0[2] +
            Math.pow(t, 3) * p0[2]
        path.push(vec3(x, y, z))
        t += step
    }

    for (let i = 0; i < path.length; i++) {
        let roundX = Math.round(path[i][0])
        let roundZ = Math.round(path[i][2])
    }

    // reverse path
    path = path.reverse()

    return path
}

mainVariables.smoothCarPath = makePath()
/***************************************************************************************/
// end of path creation
/***************************************************************************************/

/***************************************************************************************/
// makes path vectors for the car to follow
/***************************************************************************************/
function makePathVectors() {
    for (let i = 0; i < mainVariables.smoothCarPath.length; i++) {
        let nextIndex = (i + 1) % mainVariables.smoothCarPath.length
        let vector = subtract(
            mainVariables.smoothCarPath[nextIndex],
            mainVariables.smoothCarPath[i]
        )
        mainVariables.carPathVectors.push(normalize(vector))
    }
}

makePathVectors()
/***************************************************************************************/
// end of path creation
/***************************************************************************************/

/***************************************************************************************/
// handles camera placement when camera movement is enabled
/***************************************************************************************/
function orbitingCamera() {
    gl.useProgram(programs.main)
    let rate = 0.025
    let radius = 10
    let angle = rate * mainVariables.cameraTime
    let yAngle = 4.0 * angle
    let x = radius * Math.sin(angle)
    let y = 4.0 + 1.0 * Math.sin(yAngle)
    let z = radius * Math.cos(angle)
    cameras.mainCamera.setFOV(45)
    cameras.mainCamera.moveTo(vec3(x, y, z))
    cameras.mainCamera.lookAt(vec3(0.0, 0.0, 0.0))

    mainVariables.cameraTime += 0.1
}
/***************************************************************************************/
// end of camera movement
/***************************************************************************************/

/***************************************************************************************/
// handles camera placement when camera following is enabled - camera follows car fromcar's position
/***************************************************************************************/
function followCamera() {
    gl.useProgram(programs.main)

    // find position on car path
    let rate = 0.05
    let speed = 0.5
    let angle = rate * mainVariables.carTime
    let x = speed * Math.sin(angle)
    let z = speed * Math.cos(angle)
    let car = models.car
    let carPathIndex = Math.floor(
        (angle * 100) % mainVariables.smoothCarPath.length
    )
    let carPathVector = mainVariables.carPathVectors[carPathIndex]
    let carPathPoint = mainVariables.smoothCarPath[carPathIndex]
    let carRotation = rotateY(
        90 - (Math.atan2(carPathVector[2], carPathVector[0]) * 180) / Math.PI
    )

    cameras.mainCamera.moveTo(vec3(carPathPoint[0], 0.75, carPathPoint[2]))
    cameras.mainCamera.setFOV(90)

    // make camera look forward from the car
    cameras.mainCamera.lookAt(
        vec3(
            carPathPoint[0] + 5 * carPathVector[0],
            0,
            carPathPoint[2] + 5 * carPathVector[2]
        )
    )
}

/***************************************************************************************/
// moves car along smoothCarPath pointed at carPathVectors
/***************************************************************************************/
function moveCar() {
    let rate = 0.05
    let speed = 0.5
    let angle = rate * mainVariables.carTime
    let x = speed * Math.sin(angle)
    let z = speed * Math.cos(angle)
    let car = models.car
    let carPathIndex = Math.floor(
        (angle * 100) % mainVariables.smoothCarPath.length
    )
    let carPathVector = mainVariables.carPathVectors[carPathIndex]
    let carPathPoint = mainVariables.smoothCarPath[carPathIndex]
    let newCarAngle =
        90 - (Math.atan2(carPathVector[2], carPathVector[0]) * 180) / Math.PI
    let carRotation = rotateY(newCarAngle)

    car.setTranslation(
        translate(carPathPoint[0], carPathPoint[1], carPathPoint[2])
    )
    car.setRotation(carRotation)

    // current x, z position of car rounded to 2 decimal places
    let roundX = Math.round(carPathPoint[0] * 100) / 100
    let roundZ = Math.round(carPathPoint[2] * 100) / 100

    mainVariables.carTime += 0.1
}
/***************************************************************************************/
// end of car movement
/***************************************************************************************/

/***************************************************************************************/
// creates all event listeners needed for the project
/***************************************************************************************/
function createEventListeners() {
    window.addEventListener('keydown', function (event) {
        if (event.key === 'l') {
            mainVariables.lightOn = !mainVariables.lightOn
            if (!mainVariables.lightOn) {
                mainVariables.shadowEnabled = false
            }

            console.log(
                'Light is now ' + (mainVariables.lightOn ? 'on' : 'off')
            )
        }
        if (event.key === 'c') {
            mainVariables.cameraMoving = !mainVariables.cameraMoving
            mainVariables.cameraFollowing = false
            console.log(
                'Camera is now ' +
                    (mainVariables.cameraMoving ? 'moving' : 'not moving')
            )
        }
        if (event.key === 'm') {
            mainVariables.carMoving = !mainVariables.carMoving
            console.log(
                'Car is now ' +
                    (mainVariables.carMoving ? 'moving' : 'not moving')
            )
        }

        if (event.key === 'd') {
            mainVariables.cameraFollowing = !mainVariables.cameraFollowing
            mainVariables.cameraMoving = false
            console.log(
                'Camera is now ' +
                    (mainVariables.cameraFollowing
                        ? 'following'
                        : 'not following')
            )
        }
        if (event.key === 's') {
            if (mainVariables.lightOn) {
                mainVariables.shadowEnabled = !mainVariables.shadowEnabled
            }
            console.log(
                'Shadow is now ' +
                    (mainVariables.shadowEnabled ? 'enabled' : 'disabled')
            )
        }
        if (event.key === 'r') {
            mainVariables.envReflEnabled = !mainVariables.envReflEnabled
            console.log(
                'Environment Reflection is now ' +
                    (mainVariables.envReflEnabled ? 'enabled' : 'disabled')
            )
        }
        if (event.key === 'f') {
            mainVariables.refractEnabled = !mainVariables.refractEnabled
            console.log(
                'Refraction is now ' +
                    (mainVariables.refractEnabled ? 'enabled' : 'disabled')
            )
        }
    })

    mainVariables.inputs.lightOn.addEventListener('click', function () {
        mainVariables.lightOn = !mainVariables.lightOn
        mainVariables.inputs.lightOn.textContent = mainVariables.lightOn
            ? 'On'
            : 'Off'
        mainVariables.inputs.lightOn.style.backgroundColor =
            mainVariables.lightOn ? 'green' : 'red'

        if (!mainVariables.lightOn) {
            mainVariables.shadowEnabled = false
            mainVariables.inputs.shadowEnabled.textContent = 'Off'
            mainVariables.inputs.shadowEnabled.style.backgroundColor = 'red'
        }
    })

    mainVariables.inputs.shadowEnabled.addEventListener('click', function () {
        if (mainVariables.lightOn) {
            mainVariables.shadowEnabled = !mainVariables.shadowEnabled
            mainVariables.inputs.shadowEnabled.textContent =
                mainVariables.shadowEnabled ? 'On' : 'Off'
            mainVariables.inputs.shadowEnabled.style.backgroundColor =
                mainVariables.shadowEnabled ? 'green' : 'red'
        }
    })

    mainVariables.inputs.cameraOrbit.addEventListener('click', function () {
        mainVariables.cameraMoving = !mainVariables.cameraMoving
        mainVariables.inputs.cameraOrbit.textContent =
            mainVariables.cameraMoving ? 'On' : 'Off'
        mainVariables.inputs.cameraOrbit.style.backgroundColor =
            mainVariables.cameraMoving ? 'green' : 'red'
    })

    mainVariables.inputs.animate.addEventListener('click', function () {
        mainVariables.carMoving = !mainVariables.carMoving
        mainVariables.inputs.animate.textContent = mainVariables.carMoving
            ? 'On'
            : 'Off'
        mainVariables.inputs.animate.style.backgroundColor =
            mainVariables.carMoving ? 'green' : 'red'
    })

    mainVariables.inputs.cameraFollow.addEventListener('click', function () {
        mainVariables.cameraFollowing = !mainVariables.cameraFollowing
        mainVariables.inputs.cameraFollow.textContent =
            mainVariables.cameraFollowing ? 'On' : 'Off'
        mainVariables.inputs.cameraFollow.style.backgroundColor =
            mainVariables.cameraFollowing ? 'green' : 'red'
    })

    mainVariables.inputs.diffuseLight.addEventListener('input', function () {
        let value = mainVariables.inputs.diffuseLight.value
        lights.mainLight.diffuse = vec4(value, value, value, 1.0)
    })

    mainVariables.inputs.ambientLight.addEventListener('input', function () {
        let value = mainVariables.inputs.ambientLight.value
        lights.mainLight.ambient = vec4(value, value, value, 1.0)
    })

    mainVariables.inputs.specularLight.addEventListener('input', function () {
        let value = mainVariables.inputs.specularLight.value
        lights.mainLight.specular = vec4(value, value, value, 1.0)
    })

    mainVariables.inputs.materialShininess.addEventListener(
        'input',
        function () {
            let value = 100 - mainVariables.inputs.materialShininess.value
            mainVariables.materialShininess = value
        }
    )

    mainVariables.inputs.envReflEnabled.addEventListener('click', function () {
        mainVariables.envReflEnabled = !mainVariables.envReflEnabled
        mainVariables.inputs.envReflEnabled.textContent =
            mainVariables.envReflEnabled ? 'On' : 'Off'
        mainVariables.inputs.envReflEnabled.style.backgroundColor =
            mainVariables.envReflEnabled ? 'green' : 'red'
    })

    mainVariables.inputs.refractEnabled.addEventListener('click', function () {
        mainVariables.refractEnabled = !mainVariables.refractEnabled
        mainVariables.inputs.refractEnabled.textContent =
            mainVariables.refractEnabled ? 'On' : 'Off'
        mainVariables.inputs.refractEnabled.style.backgroundColor =
            mainVariables.refractEnabled ? 'green' : 'red'
    })
}
/***************************************************************************************/
// end of event listeners
/***************************************************************************************/

/***************************************************************************************/
// Initialize WebGL
/***************************************************************************************/
function initWebGL() {
    canvas = document.getElementById('webgl')
    gl = canvas.getContext('webgl')

    if (!gl) {
        console.log('WebGL not supported, falling back on experimental-webgl')
        gl = canvas.getContext('experimental-webgl')
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.enable(gl.DEPTH_TEST)

    // enable depth extension
    gl.getExtension('WEBGL_depth_texture')

    programs.main = initShaders(gl, 'main-vshader', 'main-fshader')
    programs.shadow = initShaders(gl, 'shadow-vshader', 'shadow-fshader')
    programs.skybox = initShaders(gl, 'skybox-vshader', 'skybox-fshader')

    gl.useProgram(programs.main)
}
/***************************************************************************************/
// end of WebGL initialization
/***************************************************************************************/

/***************************************************************************************/
// Connect HTML elements to JS
/***************************************************************************************/
function connectHTML() {
    mainVariables.inputs.diffuseLight = document.getElementById('diffuseLight')

    mainVariables.inputs.ambientLight = document.getElementById('ambientLight')

    mainVariables.inputs.specularLight =
        document.getElementById('specularLight')
    // light on button = 'lightOn'
    mainVariables.inputs.lightOn = document.getElementById('lightOn')
    mainVariables.inputs.lightOn.textContent = 'On'
    mainVariables.inputs.lightOn.style.backgroundColor = 'green'
    mainVariables.inputs.lightOn.style.color = 'white'

    mainVariables.inputs.shadowEnabled = document.getElementById('shadowEnable')
    mainVariables.inputs.shadowEnabled.textContent = 'On'
    mainVariables.inputs.shadowEnabled.style.backgroundColor = 'green'
    mainVariables.inputs.shadowEnabled.style.color = 'white'

    mainVariables.inputs.cameraOrbit = document.getElementById('cameraOrbit')
    mainVariables.inputs.cameraOrbit.textContent = 'Off'
    mainVariables.inputs.cameraOrbit.style.backgroundColor = 'red'
    mainVariables.inputs.cameraOrbit.style.color = 'white'

    mainVariables.inputs.animate = document.getElementById('animate')
    mainVariables.inputs.animate.textContent = 'Off'
    mainVariables.inputs.animate.style.backgroundColor = 'red'
    mainVariables.inputs.animate.style.color = 'white'

    mainVariables.inputs.cameraFollow = document.getElementById('cameraFollow')
    mainVariables.inputs.cameraFollow.textContent = 'Off'
    mainVariables.inputs.cameraFollow.style.backgroundColor = 'red'
    mainVariables.inputs.cameraFollow.style.color = 'white'

    mainVariables.inputs.envReflEnabled =
        document.getElementById('envReflEnable')
    mainVariables.inputs.envReflEnabled.textContent = 'On'
    mainVariables.inputs.envReflEnabled.style.backgroundColor = 'green'
    mainVariables.inputs.envReflEnabled.style.color = 'white'

    mainVariables.inputs.refractEnabled =
        document.getElementById('refractEnable')
    mainVariables.inputs.refractEnabled.textContent = 'Off'
    mainVariables.inputs.refractEnabled.style.backgroundColor = 'red'
    mainVariables.inputs.refractEnabled.style.color = 'white'

    mainVariables.displays.cameraPosition =
        document.getElementById('cameraPosition')
    mainVariables.displays.cameraLookAt =
        document.getElementById('cameraLookAt')
    mainVariables.displays.carPosition = document.getElementById('carPosition')
    mainVariables.displays.carRotation = document.getElementById('carRotation')
    mainVariables.displays.lightPosition =
        document.getElementById('lightPosition')
    mainVariables.inputs.materialShininess =
        document.getElementById('materialShininess')
    mainVariables.inputs.materialShininess.value =
        100 - mainVariables.materialShininess
}
/***************************************************************************************/
// end of connecting HTML elements
/***************************************************************************************/

/***************************************************************************************/
// Updates display elements
/***************************************************************************************/
function updateDisplays() {
    let cameraX = cameras.mainCamera.eye[0].toFixed(2)
    let cameraY = cameras.mainCamera.eye[1].toFixed(2)
    let cameraZ = cameras.mainCamera.eye[2].toFixed(2)
    mainVariables.displays.cameraPosition.textContent = `x: ${cameraX}, y: ${cameraY}, z: ${cameraZ}`

    let lookAtX = cameras.mainCamera.at[0].toFixed(2)
    let lookAtY = cameras.mainCamera.at[1].toFixed(2)
    let lookAtZ = cameras.mainCamera.at[2].toFixed(2)
    mainVariables.displays.cameraLookAt.textContent = `x: ${lookAtX}, y: ${lookAtY}, z: ${lookAtZ}`

    let carPosition = models.car.getPosition()
    let carX = carPosition[0].toFixed(2)
    let carY = carPosition[1].toFixed(2)
    let carZ = carPosition[2].toFixed(2)
    mainVariables.displays.carPosition.textContent = `x: ${carX}, y: ${carY}, z: ${carZ}`

    let carRotation = models.car.getRotationAngle()
    let rotationY = carRotation[1].toFixed(2)
    mainVariables.displays.carRotation.textContent = `y: ${rotationY}`

    let lightPosition = lights.mainLight.position
    let lightX = lightPosition[0].toFixed(2)
    let lightY = lightPosition[1].toFixed(2)
    let lightZ = lightPosition[2].toFixed(2)
    mainVariables.displays.lightPosition.textContent = `x: ${lightX}, y: ${lightY}, z: ${lightZ}`

    mainVariables.inputs.lightOn.textContent = mainVariables.lightOn
        ? 'On'
        : 'Off'
    mainVariables.inputs.lightOn.style.backgroundColor = mainVariables.lightOn
        ? 'green'
        : 'red'

    mainVariables.inputs.shadowEnabled.textContent = mainVariables.shadowEnabled
        ? 'On'
        : 'Off'
    mainVariables.inputs.shadowEnabled.style.backgroundColor =
        mainVariables.shadowEnabled ? 'green' : 'red'

    mainVariables.inputs.cameraOrbit.textContent = mainVariables.cameraMoving
        ? 'On'
        : 'Off'
    mainVariables.inputs.cameraOrbit.style.backgroundColor =
        mainVariables.cameraMoving ? 'green' : 'red'

    mainVariables.inputs.animate.textContent = mainVariables.carMoving
        ? 'On'
        : 'Off'
    mainVariables.inputs.animate.style.backgroundColor = mainVariables.carMoving
        ? 'green'
        : 'red'

    mainVariables.inputs.cameraFollow.textContent =
        mainVariables.cameraFollowing ? 'On' : 'Off'
    mainVariables.inputs.cameraFollow.style.backgroundColor =
        mainVariables.cameraFollowing ? 'green' : 'red'

    mainVariables.inputs.envReflEnabled.textContent =
        mainVariables.envReflEnabled ? 'On' : 'Off'
    mainVariables.inputs.envReflEnabled.style.backgroundColor =
        mainVariables.envReflEnabled ? 'green' : 'red'

    mainVariables.inputs.refractEnabled.textContent =
        mainVariables.refractEnabled ? 'On' : 'Off'
    mainVariables.inputs.refractEnabled.style.backgroundColor =
        mainVariables.refractEnabled ? 'green' : 'red'

    mainVariables.inputs.diffuseLight.value = lights.mainLight.diffuse[0]
    mainVariables.inputs.ambientLight.value = lights.mainLight.ambient[0]
    mainVariables.inputs.specularLight.value = lights.mainLight.specular[0]
}

/***************************************************************************************/
// Initialize models
/***************************************************************************************/
async function initModels() {
    const stopSign = new Model(
        'stopSign',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.obj',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.mtl'
    )

    // Get the lamp
    const lamp = new Model(
        'lamp',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.obj',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.mtl'
    )

    // Get the car
    const car = new Model(
        'car',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.obj',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.mtl'
    )

    // Get the street
    const street = new Model(
        'street',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.obj',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.mtl'
    )

    // Get the bunny (you will not need this one until Part II)
    const bunny = new Model(
        'bunny',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.obj',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.mtl'
    )

    let skybox = new SkyBox(
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posx.png',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negx.png',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posy.png',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negy.png',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posz.png',
        'https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negz.png'
    )

    await Promise.all([
        stopSign.load(),
        lamp.load(),
        car.load(),
        street.load(),
        bunny.load(),
        skybox.load(),
    ])

    models.stopSign = stopSign
    models.lamp = lamp
    models.car = car
    models.street = street
    models.car.embeddedObjects.bunny = bunny
    models.car.embeddedObjects.bunny.setParent(models.car)
    models.car.embeddedObjects.bunny.translateToParent = translate(0, 0.5, 1)
    models.car.embeddedObjects.bunny.type = 'child'

    for (let model in models) {
        for (let childModel in models[model].embeddedObjects) {
            models[model].embeddedObjects[childModel].diffuseColors =
                models[model].embeddedObjects[childModel].getDiffuseColors()
            models[model].embeddedObjects[childModel].ambientColors =
                models[model].embeddedObjects[childModel].getAmbientColors()
            models[model].embeddedObjects[childModel].specularColors =
                models[model].embeddedObjects[childModel].getSpecularColors()
        }
        models[model].diffuseColors = models[model].getDiffuseColors()
        models[model].ambientColors = models[model].getAmbientColors()
        models[model].specularColors = models[model].getSpecularColors()
    }

    programs.main.models = models
    programs.shadow.models = models
    programs.skybox.model = skybox

    console.log('Models loaded')
}
/***************************************************************************************/
// end of model initialization
/***************************************************************************************/

/***************************************************************************************/
// Initialize model buffers
/***************************************************************************************/
async function initModelBuffers(model) {
    gl.useProgram(programs.main)
    let modelBuffers = {}

    modelBuffers.position = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffers.position)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(model.getVertices()),
        gl.STATIC_DRAW
    )

    modelBuffers.normal = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffers.normal)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(model.getNormals()),
        gl.STATIC_DRAW
    )

    modelBuffers.diffuseColor = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffers.diffuseColor)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(model.getDiffuseColors()),
        gl.STATIC_DRAW
    )

    modelBuffers.ambientColor = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffers.ambientColor)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(model.getAmbientColors()),
        gl.STATIC_DRAW
    )

    modelBuffers.specularColor = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffers.specularColor)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(model.getSpecularColors()),
        gl.STATIC_DRAW
    )

    if (model.getTexCoords().length > 0) {
        modelBuffers.textureCoord = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffers.textureCoord)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(model.getTexCoords()),
            gl.STATIC_DRAW
        )
    }

    gl.useProgram(programs.shadow)

    modelBuffers.vPosShadow = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffers.vPosShadow)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(model.getVertices()),
        gl.STATIC_DRAW
    )

    gl.useProgram(programs.main)

    model.buffers = modelBuffers
}
/***************************************************************************************/
// end of model buffer initialization
/***************************************************************************************/

/***************************************************************************************/
// Initialize shadow buffers
/***************************************************************************************/
async function initShadowBuffers() {
    gl.useProgram(programs.shadow)
    let shadowBuffers = {}

    gl.activeTexture(gl.TEXTURE0)

    programs.shadow.depthTexture = gl.createTexture()

    gl.bindTexture(gl.TEXTURE_2D, programs.shadow.depthTexture)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.DEPTH_COMPONENT,
        mainVariables.shadowMapSize,
        mainVariables.shadowMapSize,
        0,
        gl.DEPTH_COMPONENT,
        gl.UNSIGNED_INT,
        null
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    programs.shadow.framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, programs.shadow.framebuffer)
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D,
        programs.shadow.depthTexture,
        0
    )
    gl.activeTexture(gl.TEXTURE4)
    let unusedTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, unusedTexture)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        mainVariables.shadowMapSize,
        mainVariables.shadowMapSize,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        unusedTexture,
        0
    )

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, programs.shadow.depthTexture)

    gl.bindTexture(gl.TEXTURE_2D, null)

    console.log('Shadow buffers initialized')
}
/***************************************************************************************/
// End of shadow buffer initialization
/***************************************************************************************/

/***************************************************************************************/
// Initialize skybox buffers
/***************************************************************************************/
async function initSkyBoxBuffers() {
    gl.useProgram(programs.skybox)
    let skyboxBuffers = {}

    skyboxBuffers.position = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxBuffers.position)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(programs.skybox.model.getPositions()),
        gl.STATIC_DRAW,
        0,
        0
    )

    programs.skybox.buffers = skyboxBuffers

    // load skybox texture
    gl.activeTexture(gl.TEXTURE2)
    programs.skybox.texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, programs.skybox.texture)

    for (let i = 0; i < programs.skybox.model.texImages.length; i++) {
        let image = programs.skybox.model.texImages[i]

        gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        )
    }

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // unbind texture
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)

    console.log('Skybox buffers initialized')
}
/***************************************************************************************/
// end of skybox buffer initialization
/***************************************************************************************/

/***************************************************************************************/
// Initialize buffers -  starts by initializing shadow buffers, then initializes model buffers, then initializes skybox buffers
// Also adds buffers to the programs dictionary
/***************************************************************************************/
async function initBuffers() {
    await initShadowBuffers()

    for (let [name, model] of Object.entries(models)) {
        await initModelBuffers(model)
        for (let [childName, childModel] of Object.entries(
            model.embeddedObjects
        )) {
            await initModelBuffers(childModel)
        }
    }

    await initSkyBoxBuffers()

    // add buffers to programs dictionary
    programs.main.models = models
    programs.shadow.models = models

    console.log('Buffers initialized')
}
/***************************************************************************************/
// end of buffer initialization
/***************************************************************************************/

/***************************************************************************************/
// load textures
/***************************************************************************************/
async function loadTextures() {
    for (let [name, model] of Object.entries(models)) {
        gl.useProgram(programs.main)
        gl.activeTexture(gl.TEXTURE1)

        if (model.textured) {
            model.texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, model.texture)

            console.log('Loading texture')
            let image = model.texImage
            image.crossOrigin = ''
            image.src = model.imagePath

            image.onload = function () {
                console.log('Texture Image Loaded')
                gl.bindTexture(gl.TEXTURE_2D, model.texture)
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    image
                )
                gl.generateMipmap(gl.TEXTURE_2D)
            }
            gl.uniform1i(
                gl.getUniformLocation(programs.main, 'useTexture'),
                model.textured ? 1 : 0
            )
            gl.uniform1i(
                gl.getUniformLocation(programs.main, 'modelTexture'),
                1
            )
        }
        programs.main.models = models
    }
    console.log('Textures loaded')
}
/***************************************************************************************/
// end of texture loading
/***************************************************************************************/

/***************************************************************************************/
// finds the top of the lamp in the scene
/***************************************************************************************/
function findTopOfLamp() {
    let lamp = models.lamp
    let maxY = 0
    for (let i = 0; i < lamp.getVertices().length; i += 4) {
        if (lamp.getVertices()[i + 1] > maxY) {
            maxY = lamp.getVertices()[i + 1]
        }
    }

    return maxY
}
/***************************************************************************************/
// end of finding top of lamp
/***************************************************************************************/

/***************************************************************************************/
// setup lighting
/***************************************************************************************/
function setupLighting() {
    gl.useProgram(programs.main)

    let position = vec4(0, findTopOfLamp() + 0.0, 0, 1.0)

    const diffuseLight = [0.4, 0.4, 0.4, 1.0]
    const ambientLight = [0.1, 0.1, 0.1, 1.0]
    const specularLight = [0.8, 0.8, 0.8, 1.0]

    let light = new Light(position, diffuseLight, specularLight, ambientLight)

    lights.mainLight = light

    let lightPositionInMain = gl.getUniformLocation(
        programs.main,
        'lightPosition'
    )

    gl.uniform4fv(lightPositionInMain, flatten(lights.mainLight.position))

    let diffuseUniform = gl.getUniformLocation(programs.main, 'lightDiffuse')
    let ambientUniform = gl.getUniformLocation(programs.main, 'lightAmbient')
    let specularUniform = gl.getUniformLocation(programs.main, 'lightSpecular')
    gl.uniform4fv(diffuseUniform, lights.mainLight.diffuse)
    gl.uniform4fv(ambientUniform, lights.mainLight.ambient)
    gl.uniform4fv(specularUniform, lights.mainLight.specular)

    let lightBool = gl.getUniformLocation(programs.main, 'lightOn')
    gl.uniform1i(lightBool, mainVariables.lightOn)

    programs.main.uniforms = {
        lightPosition: lightPositionInMain,
        lightDiffuse: diffuseUniform,
        lightAmbient: ambientUniform,
        lightSpecular: specularUniform,
        lightOn: lightBool,
    }

    console.log('Lighting setup')
}
/***************************************************************************************/
// end of lighting setup
/***************************************************************************************/

/***************************************************************************************/
// setup camera
/***************************************************************************************/
function setupCamera() {
    let coordinates = vec3(0.0, 5.0, 10.0)
    let lookingAt = vec3(0.0, 0.0, 0.0)
    let upDirection = vec3(0.0, 1.0, 0.0)
    let fov = 45
    let aspect = canvas.width / canvas.height
    let near = 0.1
    let far = 100.0

    let camera = new Camera(
        coordinates,
        lookingAt,
        upDirection,
        fov,
        aspect,
        near,
        far
    )
    cameras.mainCamera = camera
}
/***************************************************************************************/
// end of camera setup
/***************************************************************************************/

/***************************************************************************************/
// setup scene - model placement and orientation
/***************************************************************************************/
function setupScene() {
    models.car.setTranslation(
        translate(
            mainVariables.smoothCarPath[0][0],
            mainVariables.smoothCarPath[0][1],
            mainVariables.smoothCarPath[0][2]
        )
    )
    models.car.setRotation(rotateY(0))
    models.car.setScale(scalem(0.75, 0.75, 0.75))
    models.stopSign.setTranslation(translate(4.5, 0, 0))
    models.stopSign.setRotation(rotateY(-90))
}
/***************************************************************************************/
// end of scene setup
/***************************************************************************************/

/***************************************************************************************/
// setup shadow mapping
/***************************************************************************************/
function setupShadows() {
    gl.useProgram(programs.shadow)

    // look at [posX, posY, posZ]
    programs.shadow.lightView = lookAt(
        vec3(0, findTopOfLamp() - 0.2, 0),
        vec3(0, 0, 0),
        vec3(0, 0, 1)
    )

    programs.shadow.lightProjection = perspective(130, 1, 0.1, 100.0)

    let textureMatrix = mat4()
    textureMatrix = mult(textureMatrix, translate(0.5, 0.5, 0.5))
    textureMatrix = mult(textureMatrix, scalem(0.5, 0.5, 0.5))
    textureMatrix = mult(textureMatrix, programs.shadow.lightProjection)
    textureMatrix = mult(textureMatrix, programs.shadow.lightView)

    programs.main.shadowMatrix = textureMatrix

    addUniformsShadow()

    console.log('Shadows setup')
}
/***************************************************************************************/
// end of shadow setup
/***************************************************************************************/

/***************************************************************************************/
// add attributes to main program
/***************************************************************************************/
function addAttributesMain() {
    let vPosition = gl.getAttribLocation(programs.main, 'vPosition')
    let vNormal = gl.getAttribLocation(programs.main, 'vNormal')
    let vTexCoord = gl.getAttribLocation(programs.main, 'vTexCoord')
    let diffuseColor = gl.getAttribLocation(programs.main, 'diffuseColor')
    let specularColor = gl.getAttribLocation(programs.main, 'specularColor')
    let ambientColor = gl.getAttribLocation(programs.main, 'ambientColor')

    programs.main.attributes = {
        vPosition: vPosition,
        vNormal: vNormal,
        vTexCoord: vTexCoord,
        diffuseColor: diffuseColor,
        specularColor: specularColor,
        ambientColor: ambientColor,
    }
}
/***************************************************************************************/
// end of adding attributes to main program
/***************************************************************************************/

/***************************************************************************************/
// add attributes to shadow program
/***************************************************************************************/
function addAttributesShadow() {
    let vPosition = gl.getAttribLocation(programs.shadow, 'vPosition')
    programs.shadow.attributes = {
        vPosition: vPosition,
    }
}
/***************************************************************************************/
// end of adding attributes to shadow program
/***************************************************************************************/

/***************************************************************************************/
// disable attributes of a program
/***************************************************************************************/
function disableAttributes(program) {
    for (let attr in program.attributes) {
        gl.disableVertexAttribArray(program.attributes[attr])
    }
}
/***************************************************************************************/
// end of disabling attributes
/***************************************************************************************/

/***************************************************************************************/
// add uniforms to main program
/***************************************************************************************/
function addUniformsMain() {
    let cameraView = gl.getUniformLocation(programs.main, 'cameraView')
    let cameraProjection = gl.getUniformLocation(
        programs.main,
        'cameraProjection'
    )
    let modelTranslation = gl.getUniformLocation(
        programs.main,
        'modelTranslation'
    )
    let modelRotation = gl.getUniformLocation(programs.main, 'modelRotation')
    let modelScale = gl.getUniformLocation(programs.main, 'modelScale')
    let useTexture = gl.getUniformLocation(programs.main, 'useTexture')
    let modelTexture = gl.getUniformLocation(programs.main, 'modelTexture')
    let lightOn = gl.getUniformLocation(programs.main, 'lightOn')
    let lightPosition = gl.getUniformLocation(programs.main, 'lightPosition')
    let shadowMatrix = gl.getUniformLocation(programs.main, 'shadowMatrix')
    let shadowEnabled = gl.getUniformLocation(programs.main, 'shadowEnabled')
    let additionalBias = gl.getUniformLocation(programs.main, 'additionalBias')
    let hasNoShadow = gl.getUniformLocation(programs.main, 'hasNoShadow')
    let materialShininess = gl.getUniformLocation(
        programs.main,
        'materialShininess'
    )
    let isLamp = gl.getUniformLocation(programs.main, 'isLamp')
    let cameraPosition = gl.getUniformLocation(programs.main, 'cameraPosition')
    let skyboxTexture = gl.getUniformLocation(programs.main, 'skyboxTexture')
    let envReflEnabled = gl.getUniformLocation(programs.main, 'envReflEnabled')
    let refractEnabled = gl.getUniformLocation(programs.main, 'refractEnabled')

    gl.uniform1f(shadowEnabled, 1)

    programs.main.uniforms.cameraView = cameraView
    programs.main.uniforms.cameraProjection = cameraProjection
    programs.main.uniforms.modelTranslation = modelTranslation
    programs.main.uniforms.modelRotation = modelRotation
    programs.main.uniforms.modelScale = modelScale
    programs.main.uniforms.useTexture = useTexture
    programs.main.uniforms.modelTexture = modelTexture
    programs.main.uniforms.lightOn = lightOn
    programs.main.uniforms.lightPosition = lightPosition
    programs.main.uniforms.shadowMatrix = shadowMatrix
    programs.main.uniforms.shadowEnabled = shadowEnabled
    programs.main.uniforms.additionalBias = additionalBias
    programs.main.uniforms.hasNoShadow = hasNoShadow
    programs.main.uniforms.materialShininess = materialShininess
    programs.main.uniforms.isLamp = isLamp
    programs.main.uniforms.cameraPosition = cameraPosition
    programs.main.uniforms.skyboxTexture = skyboxTexture
    programs.main.uniforms.envReflEnabled = envReflEnabled
    programs.main.uniforms.refractEnabled = refractEnabled
}
/***************************************************************************************/
// end of adding uniforms to main program
/***************************************************************************************/

/***************************************************************************************/
// add uniforms to shadow program
/***************************************************************************************/
function addUniformsShadow() {
    let lightView = gl.getUniformLocation(programs.shadow, 'lightView')
    let lightProjection = gl.getUniformLocation(
        programs.shadow,
        'lightProjection'
    )
    let modelTranslation = gl.getUniformLocation(
        programs.shadow,
        'modelTranslation'
    )
    let modelRotation = gl.getUniformLocation(programs.shadow, 'modelRotation')
    let modelScale = gl.getUniformLocation(programs.shadow, 'modelScale')

    programs.shadow.uniforms = {
        lightView: lightView,
        lightProjection: lightProjection,
        modelTranslation: modelTranslation,
        modelRotation: modelRotation,
        modelScale: modelScale,
    }
}
/***************************************************************************************/
// end of adding uniforms to shadow program
/***************************************************************************************/

/***************************************************************************************/
// add uniforms to skybox program
/***************************************************************************************/
function addUniformsSkybox() {
    let cameraView = gl.getUniformLocation(programs.skybox, 'cameraView')
    let cameraProjection = gl.getUniformLocation(
        programs.skybox,
        'cameraProjection'
    )
    let skyboxTexture = gl.getUniformLocation(programs.skybox, 'skyboxTexture')
    let modelTranslation = gl.getUniformLocation(
        programs.skybox,
        'modelTranslation'
    )
    let modelRotation = gl.getUniformLocation(programs.skybox, 'modelRotation')
    let modelScale = gl.getUniformLocation(programs.skybox, 'modelScale')

    programs.skybox.uniforms = {
        cameraView: cameraView,
        cameraProjection: cameraProjection,
        skyboxTexture: skyboxTexture,
        modelTranslation: modelTranslation,
        modelRotation: modelRotation,
        modelScale: modelScale,
    }
}
/***************************************************************************************/
// end of adding uniforms to skybox program
/***************************************************************************************/

/***************************************************************************************/
// add attributes to skybox program
/***************************************************************************************/
function addAttributesSkybox() {
    let vPosition = gl.getAttribLocation(programs.skybox, 'vPosition')
    programs.skybox.attributes = {
        vPosition: vPosition,
    }
}
/***************************************************************************************/
// end of adding attributes to skybox program
/***************************************************************************************/

/***************************************************************************************/
// handles drawing models in scene
/***************************************************************************************/
function drawModel(program, model) {
    gl.useProgram(program)

    let buffers = model.buffers

    if (!buffers) {
        return
    }

    let vPosition = program.attributes['vPosition']
    if (vPosition < 0) {
        console.log('Failed to get vPosition attribute')
        return
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(vPosition)
    }

    let vNormal = program.attributes['vNormal']
    if (vNormal < 0) {
        console.log('Failed to get vNormal attribute')
        return
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal)
        gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(vNormal)
    }

    if (model.getTexCoords().length === 0) {
        gl.uniform1i(gl.getUniformLocation(program, 'useTexture'), 0)
    } else {
        let vTexCoord = program.attributes['vTexCoord']
        if (vTexCoord < 0) {
            console.log('Failed to get vTexCoord attribute')
            return
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord)
            gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(vTexCoord)
            gl.uniform1i(gl.getUniformLocation(program, 'modelTexture'), 1)
            gl.uniform1i(gl.getUniformLocation(program, 'useTexture'), 1)
        }
    }

    let diffuseColor = program.attributes['diffuseColor']
    if (diffuseColor < 0) {
        console.log('Failed to get vColor attribute')
        return
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.diffuseColor)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(model.diffuseColors),
            gl.STATIC_DRAW
        )
        gl.vertexAttribPointer(diffuseColor, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(diffuseColor)
    }

    let specularColor = program.attributes['specularColor']

    if (specularColor < 0) {
        console.log('Failed to get vColor attribute')
        return
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.specularColor)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(model.specularColors),
            gl.STATIC_DRAW
        )
        gl.vertexAttribPointer(specularColor, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(specularColor)
    }

    let ambientColor = program.attributes['ambientColor']

    if (ambientColor < 0) {
        console.log('Failed to get vColor attribute')
        return
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.ambientColor)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(model.ambientColors),
            gl.STATIC_DRAW
        )
        gl.vertexAttribPointer(ambientColor, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(ambientColor)
    }

    if (model.name === 'lamp') {
        gl.uniform1i(programs.main.uniforms.hasNoShadow, 1)
        gl.uniform1f(programs.main.uniforms.isLamp, 1)
    } else {
        gl.uniform1i(programs.main.uniforms.hasNoShadow, 0)
        gl.uniform1f(programs.main.uniforms.isLamp, 0)
    }

    gl.uniform1f(
        program.uniforms.envReflEnabled,
        mainVariables.envReflEnabled ? 1 : 0
    )

    gl.uniformMatrix4fv(
        program.uniforms.cameraView,
        false,
        flatten(cameras.mainCamera.viewMatrix())
    )

    gl.uniformMatrix4fv(
        program.uniforms.cameraProjection,
        false,
        flatten(cameras.mainCamera.projectionMatrix())
    )

    gl.uniformMatrix4fv(
        programs.main.uniforms.shadowMatrix,
        false,
        flatten(programs.main.shadowMatrix)
    )

    gl.uniformMatrix4fv(
        program.uniforms.modelTranslation,
        false,
        flatten(model.getTranslation())
    )
    gl.uniformMatrix4fv(
        program.uniforms.modelRotation,
        false,
        flatten(model.getRotation())
    )
    gl.uniformMatrix4fv(
        program.uniforms.modelScale,
        false,
        flatten(model.getScale())
    )

    if (model.name === 'car') {
        gl.uniform1f(
            programs.main.uniforms.envReflEnabled,
            mainVariables.envReflEnabled ? 1 : 0
        )
    } else {
        gl.uniform1f(programs.main.uniforms.envReflEnabled, 0)
    }

    if (model.name === 'bunny') {
        gl.uniform1f(
            programs.main.uniforms.refractEnabled,
            mainVariables.refractEnabled ? 1 : 0
        )
    } else {
        gl.uniform1f(programs.main.uniforms.refractEnabled, 0)
    }

    gl.uniform1i(program.uniforms.useTexture, model.textured ? 1 : 0)

    gl.uniform1i(program.uniforms.lightOn, mainVariables.lightOn ? 1 : 0)

    gl.uniform1i(
        program.uniforms.shadowEnabled,
        mainVariables.shadowEnabled ? 1 : 0
    )

    let eye = cameras.mainCamera.eye
    let vectorToCameraEye = vec3(eye[0], eye[1], eye[2])
    gl.uniform3fv(program.uniforms.cameraPosition, flatten(vectorToCameraEye))

    gl.uniform4fv(program.uniforms.lightPosition, lights.mainLight.position)

    gl.uniform4fv(program.uniforms.lightDiffuse, lights.mainLight.diffuse)
    gl.uniform4fv(program.uniforms.lightAmbient, lights.mainLight.ambient)
    gl.uniform4fv(program.uniforms.lightSpecular, lights.mainLight.specular)
    gl.uniform1f(
        program.uniforms.materialShininess,
        mainVariables.materialShininess
    )

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, programs.shadow.depthTexture)
    gl.uniform1i(program.uniforms.shadowTexture, 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, model.texture)
    gl.uniform1i(program.uniforms.modelTexture, 1)

    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, programs.skybox.texture)
    gl.uniform1i(program.uniforms.skyboxTexture, 2)

    gl.drawArrays(gl.TRIANGLES, 0, model.getVertices().length / 4)

    disableAttributes(program)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
}
/***************************************************************************************/
// end of drawing model
/***************************************************************************************/

/***************************************************************************************/
// handles drawing shadow map
/***************************************************************************************/
function drawShadow(program, model) {
    gl.useProgram(programs.shadow)

    let buffers = model.buffers

    if (!buffers) {
        return
    }

    let vPosition = program.attributes['vPosition']
    if (vPosition < 0) {
        console.log('Failed to get vPosition attribute')
        return
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vPosShadow)
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(vPosition)
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, programs.shadow.framebuffer)

    gl.uniformMatrix4fv(
        program.uniforms.lightView,
        false,
        flatten(programs.shadow.lightView)
    )

    gl.uniformMatrix4fv(
        program.uniforms.lightProjection,
        false,
        flatten(programs.shadow.lightProjection)
    )

    gl.uniformMatrix4fv(
        program.uniforms.modelTranslation,
        false,
        flatten(model.getTranslation())
    )
    gl.uniformMatrix4fv(
        program.uniforms.modelRotation,
        false,
        flatten(model.getRotation())
    )
    gl.uniformMatrix4fv(
        program.uniforms.modelScale,
        false,
        flatten(model.getScale())
    )

    gl.drawArrays(gl.TRIANGLES, 0, model.getVertices().length / 4)

    gl.disableVertexAttribArray(vPosition)
}
/***************************************************************************************/
// end of drawing shadow map
/***************************************************************************************/

/***************************************************************************************/
// handles drawing skybox
/***************************************************************************************/
function drawSkyBox() {
    gl.useProgram(programs.skybox)
    gl.disable(gl.CULL_FACE)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    let skybox = programs.skybox.model

    let buffers = programs.skybox.buffers

    if (!buffers) {
        return
    }

    let vPosition = programs.skybox.attributes['vPosition']
    if (vPosition < 0) {
        console.log('Failed to get vPosition attribute')
        return
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(vPosition)
    }
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, programs.skybox.texture)
    gl.uniform1i(programs.skybox.uniforms.skyboxTexture, 2)

    let viewMatrix = mat4()
    let projectionMatrix = mat4()
    let translationMatrix = mat4()
    let rotationMatrix = mat4()
    let scaleMatrix = mat4()

    gl.uniformMatrix4fv(
        programs.skybox.uniforms.cameraView,
        false,
        flatten(cameras.mainCamera.viewMatrix())
    )

    gl.uniformMatrix4fv(
        programs.skybox.uniforms.cameraProjection,
        false,
        flatten(cameras.mainCamera.projectionMatrix())
    )

    gl.drawArrays(gl.TRIANGLES, 0, skybox.getPositions().length / 4)

    disableAttributes(programs.skybox)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
}
/***************************************************************************************/
// end of drawing skybox
/***************************************************************************************/

/***************************************************************************************/
// Main Render Function
/***************************************************************************************/
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // handles rendering skybox
    /***************************************************************************************/
    drawSkyBox()
    /***************************************************************************************/
    // handles drawing to shadow map
    /***************************************************************************************/
    gl.useProgram(programs.shadow)

    gl.bindFramebuffer(gl.FRAMEBUFFER, programs.shadow.framebuffer)

    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.log('Framebuffer is not complete')
    }
    gl.enable(gl.DEPTH_TEST)
    gl.cullFace(gl.FRONT)
    gl.enable(gl.CULL_FACE)
    gl.viewport(0, 0, mainVariables.shadowMapSize, mainVariables.shadowMapSize)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    for (let [name, model] of Object.entries(models)) {
        if (model.name === 'lamp') {
            continue
        }
        drawShadow(programs.shadow, model)
        for (let [childName, childModel] of Object.entries(
            model.embeddedObjects
        )) {
            drawShadow(programs.shadow, childModel)
        }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.useProgram(programs.main)
    gl.cullFace(gl.BACK)
    gl.enable(gl.CULL_FACE)

    gl.useProgram(programs.main)

    /*****************************************************************************************/
    // handles rendering models in scene
    /*****************************************************************************************/
    for (let [name, model] of Object.entries(models)) {
        if (model.name === 'car') {
            gl.uniform1f(programs.main.uniforms.additionalBias, 1)
        } else {
            gl.uniform1f(programs.main.uniforms.additionalBias, 0)
        }
        drawModel(programs.main, model)
        for (let [childName, childModel] of Object.entries(
            model.embeddedObjects
        )) {
            drawModel(programs.main, childModel)
        }
    }
    /*****************************************************************************************/
    // checkers for change in state options
    /*****************************************************************************************/
    if (mainVariables.cameraMoving) {
        orbitingCamera()
    }

    if (mainVariables.cameraFollowing) {
        followCamera()
    }

    if (mainVariables.carMoving) {
        moveCar()
    }
    /*****************************************************************************************/

    updateDisplays()
    requestAnimationFrame(render)
}
/***************************************************************************************/
// End of Render Function
/***************************************************************************************/
// Main Function
/***************************************************************************************/
function main() {
    initWebGL()
    connectHTML()
    initModels().then(() => {
        initBuffers().then(() => {
            loadTextures().then(() => {
                console.log('All resources loaded')
                setupLighting()
                setupCamera()
                setupScene()
                createEventListeners()
                addAttributesMain()
                addAttributesShadow()
                addAttributesSkybox()
                addUniformsMain()
                addUniformsSkybox()
                setupShadows()
                render()
            })
        })
    })
}
/***************************************************************************************/
// End of Main Function
/***************************************************************************************/
window.onload = main

/***************************************************************************************/
