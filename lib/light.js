class Light {
    constructor(position, diffuse, specular, ambient) {
        this.position = vec4(position)
        this.diffuse = vec4(diffuse)
        this.specular = vec4(specular)
        this.ambient = vec4(ambient)
    }

    getDiffuse() {
        let x = this.diffuse[0]
        let y = this.diffuse[1]
        let z = this.diffuse[2]
        return [x, y, z]
    }

    getSpecular() {
        let x = this.specular[0]
        let y = this.specular[1]
        let z = this.specular[2]
        return [x, y, z]
    }

    getAmbient() {
        let x = this.ambient[0]
        let y = this.ambient[1]
        let z = this.ambient[2]
        return [x, y, z]
    }

    setDiffuse(x, y, z) {
        this.diffuse = vec4(x, y, z, 1.0)
    }

    setSpecular(x, y, z) {
        this.specular = vec4(x, y, z, 1.0)
    }

    setAmbient(x, y, z) {
        this.ambient = vec4(x, y, z, 1.0)
    }
}
