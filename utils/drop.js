import { 
    Scene,
    WebGLRenderer,
    PerspectiveCamera,
    Clock,
    Vector3,
    Color,
    SphereGeometry,
    CircleGeometry,
    BufferGeometry,
    BufferAttribute,
    MeshBasicMaterial,
    ShaderMaterial,
    ParticleBasicMaterial,
    ParticleSystem,
    Mesh,
    Float32BufferAttribute,
    AdditiveBlending,
    LineSegments,
    DynamicDrawUsage,
    ImageUtils,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js'

export default class Drop {
    constructor(options){
        this.$container = null
        this.$canvas = null
        this.pointSize = options.pointSize
        this.pointColor = new Color(options.pointColor)
        this.pointDefinitions = options.pointDefinitions
        this.netRotationSpeedFactor = options.netRotationSpeedFactor
        this.netRotationSpeedVariance = options.netRotationSpeedVariance
        this.particleSize = options.particleSize
        this.particleTexture = options.particleTexture
        this.particleRotationSpeed = options.particleRotationSpeed
        this.particleRadiusExpansion = options.particleRadiusExpansion
        this.particleSpeedVariance = options.particleSpeedVariance
        this.particleSpeedFactor = options.particleSpeedFactor
        this.particleColor = new Color(options.particleColor)
        this.motionBlurEffect = options.motionBlurEffect
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
        this.composer = new EffectComposer(this.renderer)
        this.composer.addPass(new RenderPass(this.scene, this.camera))
        this.composer.addPass(new AfterimagePass(this.motionBlurEffect))

        window.addEventListener('resize', this.Resize.bind(this))
        this.Resize()
    }

    Resize(){
        this.width = this.$container.clientWidth
        this.height = this.$container.clientHeight

        this.$canvas.width = this.width
        this.$canvas.height = this.height

        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(this.width, this.height)
        this.composer.setSize(this.width, this.height)
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
        const geometry = new CircleGeometry(this.pointSize, 6)
        const material = new ParticleBasicMaterial({
            color: this.particleColor,
            size: this.particleSize,
            map: ImageUtils.loadTexture(this.particleTexture),
            blending: AdditiveBlending,
            transparent: true,
            depthWrite: false,
        })
        const sphere = new Mesh(geometry, material)
        sphere.position.set(position.x, position.y, position.z)
        
        return sphere
    }

    CreateParticles(){
        this.particles = new BufferGeometry()
        let particleMaterial = new ParticleBasicMaterial({
            color: this.particleColor,
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

                let x = Math.sin(angle * Math.PI / 180) * pointDefinition.radius * this.particleRadiusExpansion
                let z = Math.cos(angle * Math.PI / 180) * pointDefinition.radius * this.particleRadiusExpansion

                this.particlePositions.push(new Vector3(x, pointDefinition.y, z))
                particleVertices.push(x, pointDefinition.y, z)
            }
        }

        this.particles.setAttribute('position', new Float32BufferAttribute(particleVertices, 3))

        this.particleSystem = new ParticleSystem(this.particles, particleMaterial)
        this.particleSystem.softParticles = true

        this.scene.add(this.particleSystem)        
    }

    CreateNet(){
        this.linePositions = new Float32Array(this.points.length * this.points.length * 3)
        this.lineColors = new Float32Array(this.points.length * this.points.length * 4)

        let lineGeometry = new BufferGeometry()
        lineGeometry.setAttribute('position', new BufferAttribute(this.linePositions, 3).setUsage(DynamicDrawUsage))
        lineGeometry.setAttribute('color', new BufferAttribute(this.lineColors, 4, true).setUsage(DynamicDrawUsage))
        lineGeometry.computeBoundingSphere()
        lineGeometry.setDrawRange(0, 0)

        // created a shader material to enable alpha fading of the lines
        let lineMaterial = new ShaderMaterial({
            vertexShader: `
                precision mediump float;
                precision mediump int;
            
                attribute vec4 color;
                varying vec4 vColor;
            
                void main(){
                    vColor = color;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
            `,
            fragmentShader: `
                precision mediump float;
                precision mediump int;
            
                varying vec4 vColor;
            
                void main(){
                    vec4 color = vec4( vColor );
                    gl_FragColor = color;
                }
            `,
            blending: AdditiveBlending,
            transparent: true,
            depthTest: false
        })

        this.lineMesh = new LineSegments(lineGeometry, lineMaterial)
        this.scene.add(this.lineMesh)
    }

    Update(){
        requestAnimationFrame(this.Update.bind(this))

        this.UpdateNet()
        this.UpdateParticles()

        // disable this to disable post processing
        this.composer.render(this.clock.getDelta())

        // enable this to disable post processing
        // this.renderer.render(this.scene, this.camera)
    }

    UpdateNet(){
        let vertexPos = 0
        let colorPos = 0
        let numConnected = 0

        for(let i = 0; i < this.points.length; i++){
            let point = this.points[i]
            if(point.r > 0) this.UpdatePoint(point, i)

            for(let j = i + 1; j < this.points.length; j++){
                let otherPoint = this.points[j]

                const dx = point.position.x - otherPoint.position.x
                const dy = point.position.y - otherPoint.position.y
                const dz = point.position.z - otherPoint.position.z
                
                let distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
                let alpha = otherPoint.position.z  / 3
                let distanceAlpha = 1.1 - (distance / this.lineMaxDistance)

                if(distanceAlpha < alpha){
                    alpha = distanceAlpha
                }

                this.linePositions[vertexPos++] = point.position.x
                this.linePositions[vertexPos++] = point.position.y
                this.linePositions[vertexPos++] = point.position.z
                this.linePositions[vertexPos++] = otherPoint.position.x
                this.linePositions[vertexPos++] = otherPoint.position.y
                this.linePositions[vertexPos++] = otherPoint.position.z

                this.lineColors[colorPos++] = this.lineColor.r
                this.lineColors[colorPos++] = this.lineColor.g
                this.lineColors[colorPos++] = this.lineColor.b
                this.lineColors[colorPos++] = alpha
                this.lineColors[colorPos++] = this.lineColor.r
                this.lineColors[colorPos++] = this.lineColor.g
                this.lineColors[colorPos++] = this.lineColor.b
                this.lineColors[colorPos++] = alpha

                numConnected++
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
        point.position.y = point.originalY + Math.sin(this.clock.getElapsedTime() * Math.PI / 180 * this.netRotationSpeedFactor) * this.netRotationSpeedVariance * (pointIndex % 2 == 0 ? 1 : -1)

        let alpha = point.position.z / 3 + 1

        point.material.opacity = alpha
    }

    UpdateParticles(){
        let counter = 0

        for(let i = 0; i < this.particles.attributes.position.array.length; i += 3){
            let originalPosition = this.particlePositions[parseInt(i / 3)]

            let x = this.particles.attributes.position.array[i]
            let y = this.particles.attributes.position.array[i + 1]

            let randomXSpeed = originalPosition.speedX || (Math.random() * this.particleSpeedVariance + this.particleSpeedVariance)
            let randomYSpeed = originalPosition.speedY || (Math.random() * this.particleSpeedVariance + this.particleSpeedVariance)

            let randomXRange = originalPosition.rangeX || (Math.random() * this.particleSpeedFactor * 2 + this.particleSpeedFactor)
            let randomYRange = originalPosition.rangeY || (Math.random() * this.particleSpeedFactor * 2 + this.particleSpeedFactor)

            originalPosition.speedX = randomXSpeed
            originalPosition.speedY = randomYSpeed
            originalPosition.rangeX = randomXRange
            originalPosition.rangeY = randomYRange
            
            x = originalPosition.x - Math.abs(Math.sin(this.clock.getElapsedTime() * Math.PI / 180 * randomXRange) * randomXSpeed * (counter % 2 == 0 ? 1 : -1))
            y = originalPosition.y + Math.cos(this.clock.getElapsedTime() * Math.PI / 180 * randomYRange) * randomYSpeed * (counter % 2 == 0 ? 1 : -1)
            
            this.particles.attributes.position.array[i] = x
            this.particles.attributes.position.array[i + 1] = y
            
            counter++
        }

        this.particles.attributes.position.needsUpdate = true

        this.particleSystem.rotation.y -= this.particleRotationSpeed
    }
}