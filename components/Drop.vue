<template>
    <!-- <div class="drop bg-indigo-500" ref="dropcontainer">
        <canvas class="w-full h-full" ref="drop"></canvas>
    </div> -->
    <div class="drop" ref="dropcontainer">
        <div class="drop__shadow"></div>
        <div class="drop__image"></div>
        <canvas class="drop__canvas" ref="dropcanvas"></canvas>
        <div class="drop__imageoverlay"></div>
    </div>
</template>

<script>
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { BlendShader } from 'three/examples/jsm/shaders/BlendShader.js'

let scene = null
let camera = null
let renderer = null
let clock = null
let dropContainer = null
let dropCanvas = null
let width = 0
let height = 0
let points = []
let linePositions = null
let lineColors = null
let lineMesh = null
let lineMaxDistance = 2.5

let lineColor = new THREE.Color(0xff0000)
let backgroundColor = new THREE.Color(0xffffff)
let diffColor = lineColor.clone().sub(backgroundColor)

let postprocessingComposer = null
let renderPass = null
let savePass = null
let blendPass = null
let outputPass = null
const renderTargetParameters = {
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	stencilBuffer: false
}

let pointDefinitions = [
    { count: 1, y: 10, radius: 0 },
    { count: 2, y: 9, radius: 0.8 },
    { count: 3, y: 8, radius: 1.2 },
    { count: 4, y: 7, radius: 2 },
    { count: 8, y: 6, radius: 2.4 },
    { count: 8, y: 5, radius: 3.1 },
    { count: 7, y: 4, radius: 3.2 },
    { count: 6, y: 3, radius: 3.4 },
    { count: 8, y: 2, radius: 3.0 },
    { count: 5, y: 1, radius: 2.2 },
    { count: 1, y: -0.1, radius: 0 },
]


export default {
    async mounted(){
        try {
            // await this.LoadDropModel()
            this.CreateNet()
            await this.StartEngine()
        }catch(err){
            console.log(err)
        }
    },

    mounted(){
        this.StartEngine()
        this.CreatePoints()
        this.CreateNet()
        this.Update()
    },

    methods: {
        StartEngine(){
            dropContainer = this.$refs.dropcontainer
            dropCanvas = this.$refs.dropcanvas

            width = dropContainer.clientWidth
            height = dropContainer.clientHeight

            dropCanvas.width = width
            dropCanvas.height = height

            clock = new THREE.Clock()
            scene = new THREE.Scene()
            camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
            camera.position.z = 12.6
            camera.position.y = 5

            renderer = new THREE.WebGLRenderer({
                canvas: dropCanvas,
                antialias: true,
                alpha: true
            })
            renderer.setSize(width, height)

            // Postprocessing pipeline
            // postprocessingComposer = new EffectComposer(renderer)
            
            // renderPass = new RenderPass(scene, camera)
            
            // savePass = new SavePass(new THREE.WebGLRenderTarget(width, height, renderTargetParameters))
            
            // blendPass = new ShaderPass(BlendShader, 'tDiffuse1')
            // blendPass.uniforms['tDiffuse2'].value = savePass.renderTarget.texture
            // blendPass.uniforms['mixRatio'].value = 0.8

            // outputPass = new ShaderPass(CopyShader)
            // outputPass.renderToScreen = true

            // postprocessingComposer.addPass(renderPass)
            // postprocessingComposer.addPass(savePass)
            // postprocessingComposer.addPass(blendPass)
            // postprocessingComposer.addPass(outputPass)
        },


        CreatePoints(){
            points = []
            for (let i = 0; i < pointDefinitions.length; i++){
                let pointDefinition = pointDefinitions[i]
                let pointCount = pointDefinition.count
                for (let j = 0; j < pointCount; j++){
                    let angle = ((j + 1) / pointCount) * 360

                    let x = Math.sin(angle * Math.PI / 180) * pointDefinition.radius
                    let z = Math.cos(angle * Math.PI / 180) * pointDefinition.radius

                    let point = new THREE.Vector3(x, pointDefinition.y, z)
                    let pointMesh = this.CreatePointMesh(point)

                    pointMesh.r = pointDefinition.radius
                    pointMesh.originalY = pointDefinition.y

                    points.push(pointMesh)
                    scene.add(pointMesh)
                }
            }
        },

        CreatePointMesh(position){
            const geometry = new THREE.SphereGeometry(0.05, 12, 12)
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
            const sphere = new THREE.Mesh(geometry, material)
            sphere.position.set(position.x, position.y, position.z)
            return sphere

        },

        CreateNet(){
            linePositions = new Float32Array(points.length * points.length * 3)
            lineColors = new Float32Array(points.length * points.length * 3)

            let lineGeometry = new THREE.BufferGeometry()
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage))
            lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage))
            lineGeometry.computeBoundingSphere()
            lineGeometry.setDrawRange(0, 0)

            let lineMaterial = new THREE.LineBasicMaterial({
                vertexColors: THREE.VertexColors,
                linewidth: 1,
                blending: THREE.AdditiveBlending,
                transparent: true
            })

            lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
            scene.add(lineMesh)
        },

        Update(){
            requestAnimationFrame(this.Update)

            this.UpdateNet()
            
            // postprocessingComposer.render()
            renderer.render(scene, camera)
        },

        UpdateNet(){
            let vertexPos = 0
            let colorPos = 0
            let numConnected = 0

            for(let i = 0; i < points.length; i++){
                let point = points[i]
                if(point.r > 0) this.UpdatePoint(point, i)

                for(let j = i; j < points.length; j++){
                    // hacky one :D 
                    if(j == i) continue

                    let otherPoint = points[j]

                    const dx = point.position.x - otherPoint.position.x
                    const dy = point.position.y - otherPoint.position.y
                    const dz = point.position.z - otherPoint.position.z
                    
                    let distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

                    if(distance < lineMaxDistance){
                        let distanceRatio = distance / lineMaxDistance
                        let alpha = 1//point.position.z + 2//Math.max(0, 1 - distanceRatio)

                        let lineColor = new THREE.Color(alpha,0,0)//(0xff0000)//.lerp(new THREE.Color(0x000000), alpha)

                        linePositions[ vertexPos++ ] = point.position.x
                        linePositions[ vertexPos++ ] = point.position.y
                        linePositions[ vertexPos++ ] = point.position.z
                        linePositions[ vertexPos++ ] = otherPoint.position.x
                        linePositions[ vertexPos++ ] = otherPoint.position.y
                        linePositions[ vertexPos++ ] = otherPoint.position.z

                        lineColors[ colorPos++ ] = lineColor.r
                        lineColors[ colorPos++ ] = lineColor.g
                        lineColors[ colorPos++ ] = lineColor.b
                        lineColors[ colorPos++ ] = lineColor.r
                        lineColors[ colorPos++ ] = lineColor.g
                        lineColors[ colorPos++ ] = lineColor.b

                        numConnected++
                    }
                }
            }

            lineMesh.geometry.setDrawRange(0, numConnected * 2)
            lineMesh.geometry.attributes.position.needsUpdate = true
            lineMesh.geometry.attributes.color.needsUpdate = true
        },

        UpdatePoint(point, pointIndex){
            let angle = Math.atan2(point.position.z, point.position.x)
            let distance = Math.sqrt(point.position.z * point.position.z + point.position.x * point.position.x)
            angle += 0.00025 * point.r * point.position.y * 0.5
            point.position.x = Math.cos(angle) * distance
            point.position.z = Math.sin(angle) * distance
            point.position.y = point.originalY + Math.sin(clock.getElapsedTime() * Math.PI / 180 * 40) * 0.2 * (pointIndex % 2 == 0 ? 1 : -1)

            let alpha = 1//point.position.z + 2

            point.material.color = new THREE.Color(alpha, 0, 0)

        }

    }
}
</script>

<style lang="scss">
.drop {
    width: 732px;
    height: 823px;
    @apply relative;
    @apply bg-indigo-600;
    
    &__image {
        background-image: url(/assets/drop.png);
        @apply absolute top-0 left-0 w-full h-full;
        @apply bg-center bg-no-repeat;
    }

    &__shadow {
        background-image: url(/assets/shadow.png);
        @apply absolute top-0 left-0 w-full h-full;
        @apply bg-center bg-no-repeat;
    }

    &__canvas {
        @apply absolute top-0 left-0 w-full h-full;
        mix-blend-mode: screen;
        opacity: 0.5;
    }

    &__imageoverlay {
        // background-image: url(/assets/drop.png);
        // @apply absolute top-0 left-0 w-full h-full;
        // @apply bg-center bg-no-repeat;
        // mix-blend-mode: overlay ;
    }
}
</style>