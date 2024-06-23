// Variables
let canvas
let gl
let programs = {}
let models = {}
models.buffers
let lights = {}
let cameras = {}
let textures = {}
let mainVariables = {
    lightOn: true,
    shadowEnabled: true,
    carBoundary: 3.1,
    cameraMoving: true,
    cameraFollowing: false,
    carMoving: false,
    t: 0,
    shadowMapSize: 2048,
    sceneSize: 10,
}
let carPath = [
    vec3(-mainVariables.carBoundary, -0.1, -mainVariables.carBoundary),
    vec3(-mainVariables.carBoundary, -0.1, mainVariables.carBoundary),
    vec3(mainVariables.carBoundary, -0.1, mainVariables.carBoundary),
    vec3(mainVariables.carBoundary, -0.1, -mainVariables.carBoundary),
    vec3(-mainVariables.carBoundary, -0.1, -mainVariables.carBoundary),
]
let smoothCarPath = []
for (let i = 0; i < carPath.length - 1; i++) {
    let p0 = carPath[i]
    let p1 = carPath[i + 1]
    smoothCarPath.push(p0)
    smoothCarPath.push(mix(p0, p1, 0.25))
    smoothCarPath.push(mix(p0, p1, 0.5))
    smoothCarPath.push(mix(p0, p1, 0.75))
}

function orbitingCamera(t) {
    gl.useProgram(programs.main)
    let rate = 0.1
    let radius = 20
    let angle = rate * t
    let x = radius * Math.sin(angle)
    let z = radius * Math.cos(angle)
    cameras.mainCamera.moveTo(vec3(x, 4.0, z))
    cameras.mainCamera.lookAt(vec3(0.0, -2.0, 0.0))
}

function moveCar(t) {
    let i = Math.floor(t) % smoothCarPath.length
    let p0 = smoothCarPath[i]
    let p1 = smoothCarPath[(i + 1) % smoothCarPath.length]
    let p = mix(p0, p1, t - Math.floor(t))

    if (
        p0[0] === mainVariables.carBoundary &&
        p0[2] === -mainVariables.carBoundary
    ) {
        models.car.setRotation(rotateY(270))
    } else if (
        p0[0] === mainVariables.carBoundary &&
        p0[2] === mainVariables.carBoundary
    ) {
        models.car.setRotation(rotateY(180))
    } else if (
        p0[0] === -mainVariables.carBoundary &&
        p0[2] === mainVariables.carBoundary
    ) {
        models.car.setRotation(rotateY(90))
    } else if (
        p0[0] === -mainVariables.carBoundary &&
        p0[2] === -mainVariables.carBoundary
    ) {
        models.car.setRotation(rotateY(0))
    }

    models.car.setTranslation(translate(p[0], -0.1, p[2]))
}

function createEventListeners() {
    window.addEventListener('keydown', function (event) {
        if (event.key === 'l') {
            mainVariables.lightOn = !mainVariables.lightOn
            gl.uniform1i(
                gl.getUniformLocation(programs.main, 'lightOn'),
                mainVariables.lightOn ? 1 : 0
            )
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
            mainVariables.shadowEnabled = !mainVariables.shadowEnabled
            console.log(
                'Shadow is now ' +
                    (mainVariables.shadowEnabled ? 'enabled' : 'disabled')
            )
        }
    })
}

// Helper Functions
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

    gl.useProgram(programs.main)
}

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

    await Promise.all([
        stopSign.load(),
        lamp.load(),
        car.load(),
        street.load(),
        bunny.load(),
    ])

    models.stopSign = stopSign
    models.lamp = lamp
    models.car = car
    models.street = street
    models.car.embeddedObjects.bunny = bunny
    models.car.embeddedObjects.bunny.transToParent = translate(0, 0.4, 0.75)
    models.car.embeddedObjects.bunny.rotateTransToParent(rotateY(-90))
    models.car.embeddedObjects.bunny.currentTransToParent =
        models.car.embeddedObjects.bunny.transToParent

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

    console.log('Models loaded')
}

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

async function initShadowBuffers() {
    gl.useProgram(programs.shadow)
    let shadowBuffers = {}

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

    console.log('Shadow buffers initialized')
}

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

    // add buffers to programs dictionary
    programs.main.models = models
    programs.shadow.models = models

    console.log('Buffers initialized')
}

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

function setupLighting() {
    gl.useProgram(programs.main)

    let position = vec4(0, findTopOfLamp() + 0.0, 0, 1.0)

    const diffuseLight = [0.8, 0.8, 0.8, 1.0]
    const ambientLight = [0.3, 0.3, 0.3, 1.0]
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

function setupCamera() {
    let coordinates = vec3(0.0, 4.0, 10.0)
    let lookingAt = vec3(0.0, -2.0, -5.0)
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

function setupScene() {
    models.car.setTranslation(
        translate(-mainVariables.carBoundary, 0, -mainVariables.carBoundary)
    )
    models.car.setScale(scalem(0.5, 0.5, 0.5))
    models.stopSign.setTranslation(translate(4.5, 0, 0))
    models.stopSign.setRotation(rotateY(-90))
}

function setupShadows() {
    gl.useProgram(programs.shadow)

    // look at [posX, posY, posZ]
    programs.shadow.lightView = lookAt(
        vec3(0, findTopOfLamp() + 0.0, 0),
        vec3(0, 0, 0),
        vec3(0, 0, 1)
    )

    programs.shadow.lightProjection = perspective(160, 1, 0.1, 100.0)

    let textureMatrix = mat4()
    textureMatrix = mult(textureMatrix, translate(0.5, 0.5, 0.5))
    textureMatrix = mult(textureMatrix, scalem(0.5, 0.5, 0.5))
    textureMatrix = mult(textureMatrix, programs.shadow.lightProjection)
    textureMatrix = mult(textureMatrix, programs.shadow.lightView)

    programs.main.shadowMatrix = textureMatrix

    addUniformsShadow()

    console.log('Shadows setup')
}

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

function addAttributesShadow() {
    let vPosition = gl.getAttribLocation(programs.shadow, 'vPosition')
    programs.shadow.attributes = {
        vPosition: vPosition,
    }
}

function disableAttributes(program) {
    for (let attr in program.attributes) {
        gl.disableVertexAttribArray(program.attributes[attr])
    }
}

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
}

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

    gl.uniform1i(program.uniforms.useTexture, model.textured ? 1 : 0)

    gl.uniform1i(program.uniforms.lightOn, mainVariables.lightOn ? 1 : 0)

    gl.uniform1i(
        program.uniforms.shadowEnabled,
        mainVariables.shadowEnabled ? 1 : 0
    )

    gl.uniform4fv(
        program.uniforms.lightPosition,
        flatten(lights.mainLight.position)
    )

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, programs.shadow.shadowTexture)
    gl.uniform1i(gl.getUniformLocation(program, 'shadowTexture'), 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, model.texture)
    gl.uniform1i(program.uniforms.modelTexture, 1)

    gl.drawArrays(gl.TRIANGLES, 0, model.getVertices().length / 4)

    disableAttributes(program)

    gl.bindTexture(gl.TEXTURE_2D, null)
}

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

function render() {
    gl.useProgram(programs.main)
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(programs.shadow)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.FRONT)
    gl.bindFramebuffer(gl.FRAMEBUFFER, programs.shadow.framebuffer)
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.log('Framebuffer is not complete')
    }
    gl.viewport(0, 0, mainVariables.shadowMapSize, mainVariables.shadowMapSize)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.uniformMatrix4fv(
        gl.getUniformLocation(programs.shadow, 'lightView'),
        false,
        flatten(programs.shadow.lightView)
    )

    gl.uniformMatrix4fv(
        gl.getUniformLocation(programs.shadow, 'lightProjection'),
        false,
        flatten(programs.shadow.lightProjection)
    )

    for (let [name, model] of Object.entries(models)) {
        if (model.name === 'street') {
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
    gl.disable(gl.CULL_FACE)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    for (let [name, model] of Object.entries(models)) {
        drawModel(programs.main, model)
        for (let [childName, childModel] of Object.entries(
            model.embeddedObjects
        )) {
            drawModel(programs.main, childModel)
        }
    }

    if (mainVariables.cameraMoving) {
        orbitingCamera(mainVariables.t)
    }

    if (mainVariables.carMoving) {
        moveCar(mainVariables.t)
    }

    mainVariables.t += 0.01

    requestAnimationFrame(render)
}

// Main Function
function main() {
    initWebGL()
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
                addUniformsMain()
                setupShadows()
                render()
            })
        })
    })
}

window.onload = main
