import { 
    Scene,
    WebGLRenderer,
    PerspectiveCamera,
    Clock,
    Vector3,
    Color,
    LinearFilter,
    SphereGeometry,
    BufferGeometry,
    Geometry,
    BufferAttribute,
    MeshBasicMaterial,
    LineBasicMaterial,
    ParticleBasicMaterial,
    ParticleSystem,
    Mesh,
    Float32BufferAttribute,
    VertexColors,
    AdditiveBlending,
    NormalBlending,
    MultiplyBlending,
    NoBlending,
    LineSegments,
    DynamicDrawUsage,
    WebGLRenderTarget,
    ImageUtils,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { BlendShader } from 'three/examples/jsm/shaders/BlendShader.js'


export default class Drop {
    constructor(options){
        this.$container = null
        this.$canvas = null
        this.pointColor = new Color(options.pointColor)
        this.pointSize = options.pointSize
        this.particleSize = options.particleSize
        this.particleTexture = options.particleTexture
        this.pointDefinitions = options.pointDefinitions
        this.lineColor = new Color(options.lineColor)
        this.lineMaxDistance = options.lineMaxDistance
        this.linePositions = null
        this.lineColors = null
        this.lineMesh = null

        this.width = 0
        this.height = 0

        this.scene = null
        this.camera = null
        this.renderer = null
        this.composer = null
        this.clock = null

        this.points = []

        this.particlePositions = []
        this.particleCount = 0
        this.particleSystem = null
        this.particles = null
    }

    StartEngine($container, $canvas){
        this.$container = $container
        this.$canvas = $canvas

        this.width = this.$container.clientWidth
        this.height = this.$container.clientHeight

        this.$canvas.width = this.width
        this.$canvas.height = this.height

        this.clock = new Clock()
        this.scene = new Scene()
        this.camera = new PerspectiveCamera(75, this.width / this.height, 0.1, 1000)
        this.camera.position.z = 11.2
        this.camera.position.y = 4.9

        this.renderer = new WebGLRenderer({
            canvas: this.$canvas,
            antialias: true,
            alpha: true,
        })
        this.renderer.setSize(this.width, this.height)

        // Postprocessing pipeline
        // this.composer = new EffectComposer(this.renderer)
        
        // let renderPass = new RenderPass(this.scene, this.camera)
        
        // let savePass = new SavePass(new WebGLRenderTarget(this.width, this.height, {
        //     minFilter: LinearFilter,
        //     magFilter: LinearFilter,
        //     stencilBuffer: false
        // }))
        
        // let blendPass = new ShaderPass(BlendShader, 'tDiffuse1')
        // blendPass.uniforms['tDiffuse2'].value = savePass.renderTarget.texture
        // blendPass.uniforms['mixRatio'].value = 0.8
        // let outputPass = new ShaderPass(CopyShader)
        // outputPass.renderToScreen = true
        // this.composer.addPass(renderPass)
        // this.composer.addPass(savePass)
        // this.composer.addPass(blendPass)
        // this.composer.addPass(outputPass)
    }

    CreatePoints(){
        this.points = []

        for (let i = 0; i < this.pointDefinitions.length; i++){
            let pointDefinition = this.pointDefinitions[i]
            let pointCount = pointDefinition.count
            for (let j = 0; j < pointCount; j++){
                let angle = ((j + 1) / pointCount) * 360

                let x = Math.sin(angle * Math.PI / 180) * pointDefinition.radius
                let z = Math.cos(angle * Math.PI / 180) * pointDefinition.radius

                let point = new Vector3(x, pointDefinition.y, z)
                let pointMesh = this.CreatePointMesh(point)

                pointMesh.r = pointDefinition.radius
                pointMesh.originalY = pointDefinition.y

                this.points.push(pointMesh)
                this.scene.add(pointMesh)
            }
        }
    }

    CreatePointMesh(position){
        const geometry = new SphereGeometry(this.pointSize, 8, 8)
        const material = new MeshBasicMaterial({ color: this.pointColor })
        const sphere = new Mesh(geometry, material)
        
        sphere.position.set(position.x, position.y, position.z)
        
        return sphere
    }

    CreateParticles(){
        this.particles = new BufferGeometry()
        let particleMaterial = new ParticleBasicMaterial({
            color: 0xff9999,
            size: this.particleSize,
            map: ImageUtils.loadTexture(this.particleTexture),
            blending: AdditiveBlending,
            transparent: true,
            depthWrite: false,
        })
        
        this.particlePositions = []
        let particleVertices = []
        this.particleCount = 0

        for (let i = 0; i < this.pointDefinitions.length; i++){
            let pointDefinition = this.pointDefinitions[i]
            let pointCount = pointDefinition.count
            this.particleCount += pointCount

            for (let j = 0; j < pointCount; j++){
                let angle = ((j + 1) / pointCount) * 360

                let x = Math.sin(angle * Math.PI / 180) * pointDefinition.radius * 1.1
                let z = Math.cos(angle * Math.PI / 180) * pointDefinition.radius * 1.1

                this.particlePositions.push(new Vector3(x, pointDefinition.y, z))
                particleVertices.push(x, pointDefinition.y, z)
            }
        }

        this.particles.setAttribute('position', new Float32BufferAttribute(particleVertices, 3))
        // this.particles.computeBoundingSphere()
        // this.particles.setDrawRange(0, 0)

        this.particleSystem = new ParticleSystem(this.particles, particleMaterial)
        this.particleSystem.softParticles = true

        this.scene.add(this.particleSystem)        
    }

    CreateNet(){
        this.linePositions = new Float32Array(this.points.length * this.points.length * 3)
        this.lineColors = new Float32Array(this.points.length * this.points.length * 3)

        let lineGeometry = new BufferGeometry()
        lineGeometry.setAttribute('position', new BufferAttribute(this.linePositions, 3).setUsage(DynamicDrawUsage))
        lineGeometry.setAttribute('color', new BufferAttribute(this.lineColors, 3).setUsage(DynamicDrawUsage))
        lineGeometry.computeBoundingSphere()
        lineGeometry.setDrawRange(0, 0)

        let lineMaterial = new MeshBasicMaterial({
            color: this.lineColor,
            vertexColors: VertexColors,
            // linewidth: 1,
            blending: AdditiveBlending,
            transparent: true,
            opacity: 0.5,
        })

        this.lineMesh = new LineSegments(lineGeometry, lineMaterial)
        this.scene.add(this.lineMesh)
    }

    Update(){
        requestAnimationFrame(this.Update.bind(this))

        this.UpdateNet()
        this.UpdateParticles()

        // this.composer.render(this.clock.getDelta())

        this.renderer.render(this.scene, this.camera)
    }

    UpdateNet(){
        let vertexPos = 0
        let colorPos = 0
        let numConnected = 0

        for(let i = 0; i < this.points.length; i++){
            let point = this.points[i]
            if(point.r > 0) this.UpdatePoint(point, i)

            for(let j = i; j < this.points.length; j++){
                // hacky one :D 
                if(j == i) continue

                let otherPoint = this.points[j]

                const dx = point.position.x - otherPoint.position.x
                const dy = point.position.y - otherPoint.position.y
                const dz = point.position.z - otherPoint.position.z
                
                let distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

                if(distance < this.lineMaxDistance){
                    // let distanceRatio = distance / this.lineMaxDistance
                    let alpha = otherPoint.position.z  / 3 + 1

                    let lineColor = new Color(alpha, 0, 0)//(0xff0000)//.lerp(new THREE.Color(0x000000), alpha)

                    this.linePositions[vertexPos++] = point.position.x
                    this.linePositions[vertexPos++] = point.position.y
                    this.linePositions[vertexPos++] = point.position.z
                    this.linePositions[vertexPos++] = otherPoint.position.x
                    this.linePositions[vertexPos++] = otherPoint.position.y
                    this.linePositions[vertexPos++] = otherPoint.position.z

                    this.lineColors[colorPos++] = lineColor.r
                    this.lineColors[colorPos++] = lineColor.g
                    this.lineColors[colorPos++] = lineColor.b
                    this.lineColors[colorPos++] = lineColor.r
                    this.lineColors[colorPos++] = lineColor.g
                    this.lineColors[colorPos++] = lineColor.b

                    numConnected++
                }
            }
        }

        this.lineMesh.geometry.setDrawRange(0, numConnected * 2)
        this.lineMesh.geometry.attributes.position.needsUpdate = true
        this.lineMesh.geometry.attributes.color.needsUpdate = true
    }

    UpdatePoint(point, pointIndex){
        let angle = Math.atan2(point.position.z, point.position.x)
        let distance = Math.sqrt(point.position.z * point.position.z + point.position.x * point.position.x)
        angle += 0.00025 * point.r * point.position.y * 0.5
        point.position.x = Math.cos(angle) * distance
        point.position.z = Math.sin(angle) * distance
        point.position.y = point.originalY + Math.sin(this.clock.getElapsedTime() * Math.PI / 180 * 40) * 0.2 * (pointIndex % 2 == 0 ? 1 : -1)

        let alpha = point.position.z / 3 + 1

        point.material.color = new Color(alpha, 0, 0)
    }

    UpdateParticles(){
        let counter = 0

        for(let i = 0; i < this.particles.attributes.position.array.length; i += 3){
            let originalPosition = this.particlePositions[parseInt(i / 3)]

            let x = this.particles.attributes.position.array[i]
            let y = this.particles.attributes.position.array[i + 1]
            // let z = this.particles.attributes.position.array[i + 2]

            let randomXSpeed = originalPosition.speedX || (Math.random() * 0.1 + 0.1)
            let randomYSpeed = originalPosition.speedY || (Math.random() * 0.1 + 0.1)

            originalPosition.speedX = randomXSpeed
            originalPosition.speedY = randomYSpeed

            x = originalPosition.x + Math.sin(this.clock.getElapsedTime() * Math.PI / 180 * 40) * randomXSpeed * (counter % 2 == 0 ? 1 : -1)
            y = originalPosition.y + Math.cos(this.clock.getElapsedTime() * Math.PI / 180 * 40) * randomYSpeed * (counter % 2 == 0 ? 1 : -1)
            
            this.particles.attributes.position.array[i] = x
            this.particles.attributes.position.array[i + 1] = y

            counter++

        }

        this.particles.attributes.position.needsUpdate = true

        this.particleSystem.rotation.y -= 0.001
    }
}