class SkyBox {
    imagePaths = {}
    texImages = []
    constructor(posX, negX, posY, negY, posZ, negZ) {
        this.buffers = {}
        this.texture = null
        this.imagePaths.negX = negX
        this.imagePaths.posX = posX
        this.imagePaths.negY = negY
        this.imagePaths.posY = posY
        this.imagePaths.negZ = negZ
        this.imagePaths.posZ = posZ
        this.position = [0, 0, 0]
        this.scale = 1
        this.rotation = 0
        this.worldSize = 10
        this.init()
    }

    init() {
        // cube vertices from -1 to 1 - vec4
        let vertices = [
            -1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, 1, 1, 1, -1, 1, -1, -1, -1,
            1, -1, 1, -1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, -1, 1, 1, 1, -1,
            1, 1, -1, -1, 1, -1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, 1, -1, 1,
            -1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, -1, -1, 1, -1, 1, 1, 1, -1,
            -1, 1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, 1, 1, -1, 1, 1, -1,
            -1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 1, -1, 1, -1,
            1, 1, 1, 1, 1, -1, 1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1,
            1, -1, 1, 1,
        ]

        this.positions = new Float32Array(vertices)

        this.loadImages()
    }

    load() {
        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                if (this.texImages.length == 6) {
                    clearInterval(interval)
                    resolve()
                }
            })
        })
    }

    loadImages() {
        let imagePaths = this.imagePaths
        let images = []
        for (let key in imagePaths) {
            let image = new Image()
            image.src = imagePaths[key]
            image.crossOrigin = ''
            images.push(image)
        }

        this.texImages = images
        console.log('Skybox images loaded')
    }

    getImages() {
        return this.images
    }

    getPositions() {
        return this.positions
    }

    getImages() {
        return this.texImages
    }
}
