class Shader {
    constructor(gl, id, type) {
        this.gl = gl;
        this.type = type;
        this.id = id;
        this.linkedProgram = null;

        this.attributes = {};
        this.uniforms = {};
        this.textures = {};
    }

    addAttribute(name) {
        this.attributes[name] = this.gl.getAttribLocation(this.linkedProgram, name);
    }

    addUniform(name) {
        this.uniforms[name] = this.gl.getUniformLocation(this.linkedProgram, name);
    }

    addTexture(texture) {
        this.textures[texture] = this.gl.getUniformLocation(this.linkedProgram, texture);
    }

    getAttribute(name) {
        return this.attributes[name];
    }

    getUniform(name) {
        return this.uniforms[name];
    }

    linkProgram(program) {
        this.linkedProgram = program;
    }


}

