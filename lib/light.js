

class Light {
    constructor(position, diffuse, specular, ambient) {
        this.position = vec4(position);
        this.diffuse = vec4(diffuse);
        this.specular = vec4(specular);
        this.ambient = vec4(ambient);
    }
}