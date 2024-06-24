class Camera {
    constructor(coordinates, lookingAt, upDirection, fov, aspect, near, far) {
        this.eye = vec3(coordinates)
        this.at = vec3(lookingAt)
        this.up = vec3(upDirection)
        this.fov = fov
        this.aspect = aspect
        this.near = near
        this.far = far
    }

    viewMatrix() {
        return lookAt(this.eye, this.at, this.up)
    }

    projectionMatrix() {
        return perspective(this.fov, this.aspect, this.near, this.far)
    }

    getLocation() {
        return this.eye
    }

    getDirection() {
        return normalize(subtract(this.at, this.eye))
    }

    getUpDirection() {
        return this.up
    }

    moveTo(coordinates) {
        this.eye = vec3(coordinates)
    }

    lookAt(lookingAt) {
        this.at = vec3(lookingAt)
    }

    setFOV(fov) {
        this.fov = fov
        this.perspectiveMatrix = perspective(
            this.fov,
            this.aspect,
            this.near,
            this.far
        )
    }
}
