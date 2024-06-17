function main() {
    let objects = {};

    // function to initialize WebGL
    /*****************************************************************************************************************/
    function initWebGL() {
        let canvas = document.getElementById('webgl');
        let gl = WebGLUtils.setupWebGL(canvas);
        if (!gl) {
            console.log('Failed to get the rendering context for WebGL');
            return;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        let program = initShaders(gl, "vshader", "fshader");
        gl.useProgram(program);

        return [canvas, gl, program];
    }
    /*****************************************************************************************************************/

    let [canvas, gl, program] = initWebGL();
    /*****************************************************************************************************************/
    // function to initialize model objects
    /*****************************************************************************************************************/
    async function initModels() {

        // wait for all models to load
        const stopSign = new Model(
            "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.obj",
            "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.mtl");

        // Get the lamp
        const lamp = new Model(
            "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.obj",
            "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.mtl");

        // Get the car
        const car = new Model(
            "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.obj",
            "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.mtl");

        // Get the street
        const street = new Model(
            "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.obj",
            "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.mtl");

        // Get the bunny (you will not need this one until Part II)
        const bunny = new Model(
            "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.obj",
            "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.mtl");

        await Promise.all([stopSign.load(), lamp.load(), car.load(), street.load(), bunny.load()]);

        objects.stopSign = stopSign;
        objects.lamp = lamp;
        objects.car = car;
        objects.street = street;
        objects.bunny = bunny;

        for (let key in objects) {
            objects[key].materialColors = objects[key].getMaterialColors();
            objects[key].modelMatrix = mat4();
        }

        console.log("Models loaded.");
    }
    /*****************************************************************************************************************/
    // function to initialize buffers
    /*****************************************************************************************************************/
    async function initBuffers(gl) {
        for (let key in objects) {
            let model = objects[key];
            let buffers = {};

            buffers.position = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            let positions = flatten(model.getVertices());
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

            buffers.normal = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
            let normals = flatten(model.getNormals());
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

            buffers.color = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
            let colors = flatten(model.getMaterialColors());
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

            if (model.getTexCoords().length === 0) {

            } else {
                buffers.textureCoord = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
                let textureCoords = flatten(model.getTexCoords());
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
            }

            model.buffers = buffers;

            console.log("Buffers initialized.");
        }
    }
    /*****************************************************************************************************************/
    // load textures
    /*****************************************************************************************************************/
    async function loadTextures(gl) {
        for (let key in objects) {
            let model = objects[key];
            if (!model.textured) {
                continue;
            }
            let texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            let image = model.texImage;
            image.src = model.imagePath;
            image.onload = function () {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.generateMipmap(gl.TEXTURE_2D);
            };

            model.texture = texture;
            console.log(model.name + " texture loaded.");
            gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
        }

        console.log("Textures loaded.");
    }

    // function to setup the camera
    function createViewMatrix() {
        let eye = vec3(0.0, 10, 20);
        let at = vec3(0.0, -5, -5);
        let up = vec3(0.0, 1.0, 0.0);
        let fov = 45
        let near = 0.1;
        let far = 100;
        let aspect = canvas.width / canvas.height;

        // combine the perspective and lookAt matrices
        let viewMatrix = mult(perspective(fov, aspect, near, far), lookAt(eye, at, up));

        return viewMatrix;
    }
    /*****************************************************************************************************************/
    // function to setup lighting
    /*****************************************************************************************************************/
    function setupLighting(gl, shaderProgram) {
        const lightPosition = [0.0, 0.0, 0.0, 1.0];
        const ambientLight = [0.2, 0.2, 0.2, 1.0];
        const diffuseLight = [0.8, 0.8, 0.8, 1.0];
        const specularLight = [1.0, 1.0, 1.0, 1.0];

        gl.uniform4fv(gl.getUniformLocation(shaderProgram, 'lightPosition'), lightPosition);
        gl.uniform4fv(gl.getUniformLocation(shaderProgram, 'lightAmbient'), ambientLight);
        gl.uniform4fv(gl.getUniformLocation(shaderProgram, 'lightDiffuse'), diffuseLight);
        gl.uniform4fv(gl.getUniformLocation(shaderProgram, 'lightSpecular'), specularLight);
    }
    /*****************************************************************************************************************/
    // function to update the view matrix
    function updateView(gl, program) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "viewMatrix"), false, flatten(viewMatrix));
    }
    /*****************************************************************************************************************/
    // function to draw a model
    function drawModel(gl, program, model) {
        let buffers = model.buffers;

        if (!buffers) {
            return;
        }

        let vPosition = gl.getAttribLocation(program, "vPosition");
        if (vPosition < 0) {
            console.log("Failed to get vPosition attribute");
            return;
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);
        }

        let vNormal = gl.getAttribLocation(program, "vNormal");
        if (vNormal < 0) {
            console.log("Failed to get vNormal attribute");
            return;
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
            gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vNormal);
        }

        let vColor = gl.getAttribLocation(program, "vColor");
        if (vColor < 0) {
            console.log("Failed to get vColor attribute");
            return;
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
            gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);
        }

        if (model.getTexCoords().length === 0) {

        } else {
            let vTexCoord = gl.getAttribLocation(program, "vTexCoord");
            if (vTexCoord < 0) {
                console.log("Failed to get vTexCoord attribute");
                return;
            } else {
                gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
                gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(vTexCoord);
            }
        }

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(model.modelMatrix));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "viewMatrix"), false, flatten(viewMatrix));
        gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);

        gl.drawArrays(gl.TRIANGLES, 0, model.getVertices().length);

        disableAttributes(gl, program);


    }

    function disableAttributes(gl, program) {
        let vPosition = gl.getAttribLocation(program, "vPosition");
        let vNormal = gl.getAttribLocation(program, "vNormal");
        let vColor = gl.getAttribLocation(program, "vColor");
        let vTexCoord = gl.getAttribLocation(program, "vTexCoord");

        gl.disableVertexAttribArray(vPosition);
        gl.disableVertexAttribArray(vNormal);
        gl.disableVertexAttribArray(vColor);
        gl.disableVertexAttribArray(vTexCoord);
    }

    function enableAttributes(gl, program) {
        let vPosition = gl.getAttribLocation(program, "vPosition");
        let vNormal = gl.getAttribLocation(program, "vNormal");
        let vColor = gl.getAttribLocation(program, "vColor");
        let vTexCoord = gl.getAttribLocation(program, "vTexCoord");

        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vNormal);
        gl.enableVertexAttribArray(vColor);
        gl.enableVertexAttribArray(vTexCoord);
    }

    /*****************************************************************************************************************/
    // function to update the model matrix of a model
    function updateModelMatrix(model, position, rotation, scale) {
        let modelMatrix = mat4();
        modelMatrix = mult(modelMatrix, translate(position));
        modelMatrix = mult(modelMatrix, rotate(rotation[0], vec3(1, 0, 0)));
        modelMatrix = mult(modelMatrix, rotate(rotation[1], vec3(0, 1, 0)));
        modelMatrix = mult(modelMatrix, rotate(rotation[2], vec3(0, 0, 1)));
        modelMatrix = mult(modelMatrix, scalem(scale));
        model.modelMatrix = modelMatrix;
    }
    /*****************************************************************************************************************/
    // main render loop
    /*****************************************************************************************************************/
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        updateView(gl, program);
        // draw the models
        drawModel(gl, program, objects.car);
        drawModel(gl, program, objects.street);
        drawModel(gl, program, objects.lamp);
        drawModel(gl, program, objects.stopSign);
        drawModel(gl, program, objects.bunny);

        requestAnimationFrame(render);
    }
    /*****************************************************************************************************************/


    let viewMatrix = createViewMatrix();

    initModels().then(() => {
        initBuffers(gl).then(() => {
            loadTextures(gl).then(() => {
                updateModelMatrix(objects.car, vec3(3, 0, 0), vec3(0, 0, 0), vec3(0.75, 0.75, 0.75));
                updateModelMatrix(objects.street, vec3(0, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
                updateModelMatrix(objects.lamp, vec3(0, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
                updateModelMatrix(objects.stopSign, vec3(5, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
                updateModelMatrix(objects.bunny, vec3(-1, 0, 0), vec3(0, 0, 0), vec3(1, 1, 1));
                setupLighting(gl, program);
                render();
            });
        });
    });


}

window.onload = main;
