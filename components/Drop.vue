<template>
    <div class="drop bg-indigo-500" ref="dropcontainer">
        <canvas class="w-full h-full" ref="drop"></canvas>
    </div>
</template>

<script>
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '~/utils/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

let scene = null
let camera = null
let renderer = null
let dropModel = null
let clock = null
let sign = 1
// let points = null
let dropMesh = null
let pointUV = new THREE.Vector2()
let positions = null
let uv = null
let perlin = new ImprovedNoise()
let originalPositions = []
let linePositions = null
let lineColors = null

let pointCoords = [
    // top
    { x: 0, y: 0, z: 0 }, 
    // row 1
    { x: -0.4, y: 0.55, z: 0 },
    { x: 0.4, y: 0.55, z: 0 },
    { x: -0.2, y: 0.45, z: 0.5 },
    { x: 0.2, y: 0.45, z: 0.5 },
    // // row 2
    { x: -0.5, y: 1, z: 0 },
    { x: 0.5, y: 1, z: 0 },
    { x: -0.6, y: 1, z: 0.5 },
    { x: 0.6, y: 1, z: 0.5 },
    { x: 0, y: 1.2, z: 0.5 },
    // // row 3
    { x: -0.7, y: 1.5, z: 0 },
    { x: 0.7, y: 1.5, z: 0 },
    { x: -0.85, y: 1.5, z: 0.5 },
    { x: 0.85, y: 1.5, z: 0.5 },
    { x: 0, y: 1.7, z: 0.5 },
    // // row 4
    { x: -1, y: 2, z: 0 },
    { x: 1, y: 2, z: 0 },
    { x: -1.2, y: 2, z: 0.5 },
    { x: 1.2, y: 2, z: 0.5 },
    { x: -0.5, y: 2.2, z: 0.6 },
    { x: 0.5, y: 2.2, z: 0.6 },
    // // row 5
    { x: -1.2, y: 2.5, z: 0 },
    { x: 1.2, y: 2.5, z: 0 },
    { x: -1.5, y: 2.5, z: 0.5 },
    { x: 1.5, y: 2.5, z: 0.5 },
    { x: -0.6, y: 2.7, z: 0.6 },
    { x: 0.6, y: 2.7, z: 0.6 },
    { x: 0, y: 2.7, z: 0.7 },
    // // row 6
    { x: -1.4, y: 3.2, z: 0 },
    { x: 1.4, y: 3.2, z: 0 },
    { x: -1.72, y: 3.2, z: 0.5 },
    { x: 1.72, y: 3.2, z: 0.5 },
    { x: -0.7, y: 3.1, z: 0.6 },
    { x: 0.7, y: 3.1, z: 0.6 },
    { x: 0, y: 3.1, z: 0.7 },
    // // row 7
    { x: -1.4, y: 3.4, z: 0 },
    { x: 1.4, y: 3.4, z: 0 },
    { x: -1.72, y: 3.4, z: 0.5 },
    { x: 1.72, y: 3.4, z: 0.5 },
    { x: -0.8, y: 3.6, z: 0.6 },
    { x: 0.8, y: 3.6, z: 0.6 },
    { x: 0, y: 3.6, z: 0.7 },
    // // row 8
    { x: -2, y: 3.8, z: 0 },
    { x: 2, y: 3.8, z: 0 },
    { x: -1.52, y: 3.8, z: 0.5 },
    { x: 1.52, y: 3.8, z: 0.5 },
    { x: -0.7, y: 3.9, z: 0.6 },
    { x: 0.7, y: 3.9, z: 0.6 },
    { x: 0, y: 3.9, z: 0.7 },
    // // row 8
    { x: -1.36, y: 4.4, z: 0 },
    { x: 1.36, y: 4.4, z: 0 },
    { x: -1.72, y: 4.4, z: 0.5 },
    { x: 1.72, y: 4.4, z: 0.5 },
    { x: -0.7, y: 4.4, z: 0.6 },
    { x: 0.7, y: 4.4, z: 0.6 },
    { x: 0, y: 4.4, z: 0.7 },
    // // row 9
    { x: -1.36, y: 4.9, z: 0 },
    { x: 1.36, y: 4.9, z: 0 },
    { x: -1.4, y: 4.9, z: 0.5 },
    { x: 1.4, y: 4.9, z: 0.5 },
    { x: -0.5, y: 4.9, z: 0.4 },
    { x: 0.5, y: 4.9, z: 0.4 },
    { x: 0, y: 5, z: 0.3 },
    // // row 10
    { x: -0.8, y: 5.5, z: 0 },
    { x: 0.8, y: 5.5, z: 0 },
    { x: -0, y: 5.5, z: 0.5 },
    { x: 0, y: 5.5, z: 0.5 },
    { x: -0.5, y: 5.5, z: 0.4 },
    { x: 0.5, y: 5.5, z: 0.4 },
    { x: 0, y: 5, z: 0.3 },


    // // row 3
    // { x: -1, y: 0.6, z: 0 },
    // { x: 1, y: 0.6, z: 0 },
    // { x: -0.5, y: 0.6, z: 0.5 },
    // { x: 0.5, y: 0.6, z: 0.5 },
    // // row 4
    // { x: -1, y: 0.8, z: 0 },
    // { x: 1, y: 0.8, z: 0 },
    // { x: -0.5, y: 0.8, z: 0.5 },
    // { x: 0.5, y: 0.8, z: 0.5 },
    // // row 5
    // { x: -1, y: 1, z: 0 },
    // { x: 1, y: 1, z: 0 },
    // { x: -0.5, y: 1, z: 0.5 },
    // { x: 0.5, y: 1, z: 0.5 },
    // // row 6
    // { x: -1, y: 1.2, z: 0 },
    // { x: 1, y: 1.2, z: 0 },
    // { x: -0.5, y: 1.2, z: 0.5 },
    // { x: 0.5, y: 1.2, z: 0.5 },
    // // row 7
    // { x: -1, y: 1.4, z: 0 },
    // { x: 1, y: 1.4, z: 0 },
    // { x: -0.5, y: 1.4, z: 0.5 },
    // { x: 0.5, y: 1.4, z: 0.5 },
    // // row 8
    // { x: -1, y: 1.6, z: 0 },
    // { x: 1, y: 1.6, z: 0 },
    // { x: -0.5, y: 1.6, z: 0.5 },
    // { x: 0.5, y: 1.6, z: 0.5 },
    // // row 9
    // { x: -1, y: 1.8, z: 0 },
    // { x: 1, y: 1.8, z: 0 },
    // { x: -0.5, y: 1.8, z: 0.5 },
    // { x: 0.5, y: 1.8, z: 0.5 },
    // // row 10
    // { x: -1, y: 2, z: 0 },
    // { x: 1, y: 2, z: 0 },
    // { x: -0.5, y: 2, z: 0.5 },
    // { x: 0.5, y: 2, z: 0.5 },
    // // row 11
    // { x: -1, y: 2.2, z: 0 },
    // { x: 1, y: 2.2, z: 0 },
    // { x: -0.5, y: 2.2, z: 0.5 },
    // { x: 0.5, y: 2.2, z: 0.5 },
]



let rows = 11

let cols = 3

let points = []
let linesMesh = null
let maxDistance = 1
let diffColor = null
let color = new THREE.Color(0xff5555)
let backgroundColor = new THREE.Color(0x000000)
// let renderScene = null
// let bloomComposer = null
// let bloomPass = null
// let finalComposer = null
// let finalPass = null

// const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;
// const bloomLayer = new THREE.Layers();
// bloomLayer.set( BLOOM_SCENE );

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

    methods: {
        GetBrightness(color){
            return (0.299 * color.r) + (0.587 * color.g) + (0.114 * color.b)
        },
        CreateNet(){
            // for(let y = 0; y < rows; y++){
            //     for(let x = 0; x < cols; x++){
            //         let angle = (x / cols) * 360 + y * 15
            //         let pointX = Math.cos(angle) * ((y) * 0.15)// * (y / rows) * 2
            //         let pointY = Math.sin(angle)// * (y / rows) * 2
            //         originalPositions.push(new THREE.Vector3(pointX, y== 0 ? 0 : -y * 0.2 + Math.random() * 0.2, pointY))
            //     }
            // }
            
            // for(let y = 0; y < rows; y++){
            //     for(let x = 0; x < cols; x++){
            //         let angle = (x / cols) * 360 - y * 15
            //         let pointX = Math.cos(angle) * ((rows - y) * 0.1)// * (y / rows) * 2
            //         let pointY = Math.sin(angle)// * (y / rows) * 2
            //         originalPositions.push(new THREE.Vector3(pointX, (-rows * 0.2) -y * 0.2 + Math.random() * 0.2, pointY))
            //     }
            // }

            // for(let x = 0; x < cols; x++){
            //     let y = 8
            //     let angle = (x / cols) * 360 - y * 15
            //     let pointX = Math.cos(angle) * (15 * 0.1)// * (y / rows) * 2
            //     let pointY = Math.sin(angle)// * (y / rows) * 2
            //     originalPositions.push(new THREE.Vector3(pointX, (-rows * 0.2) -y * 0.2, pointY))
            // }

            // for(let x = 0; x < cols; x++){
            //     let y = 9
            //     let angle = (x / cols) * 360 - y * 15
            //     let pointX = Math.cos(angle) * (12 * 0.1)// * (y / rows) * 2
            //     let pointY = Math.sin(angle)// * (y / rows) * 2
            //     originalPositions.push(new THREE.Vector3(pointX, (-rows * 0.2) -y * 0.2, pointY))
            // }

            // for(let x = 0; x < cols; x++){
            //     let y = 8
            //     let angle = (x / cols) * 360 - y * 15
            //     let pointX = Math.cos(angle) * (10 * 0.1)// * (y / rows) * 2
            //     let pointY = Math.sin(angle)// * (y / rows) * 2
            //     originalPositions.push(new THREE.Vector3(pointX, (-rows * 0.2) -y * 0.2, pointY))
            // }

            // for(let x = 0; x < cols; x++){
            //     let y = 6
            //     let angle = (x / cols) * 360 - y * 15
            //     let pointX = Math.cos(angle) * (15 * 0.1)// * (y / rows) * 2
            //     let pointY = Math.sin(angle)// * (y / rows) * 2
            //     originalPositions.push(new THREE.Vector3(pointX, (-rows * 0.2) -y * 0.2, pointY))
            // }

            // for(let x = 0; x < cols; x++){
            //     let y = 4
            //     let angle = (x / cols) * 360 - y * 15
            //     let pointX = Math.cos(angle) * (15 * 0.1)// * (y / rows) * 2
            //     let pointY = Math.sin(angle)// * (y / rows) * 2
            //     originalPositions.push(new THREE.Vector3(pointX, (-rows * 0.2) -y * 0.2, pointY))
            // }

            for(let i = 0; i < pointCoords.length; i++){
                originalPositions.push(new THREE.Vector3(pointCoords[i].x, -pointCoords[i].y, pointCoords[i].z))
            }
            

            linePositions = new Float32Array(originalPositions.length * originalPositions.length * 3)
            lineColors = new Float32Array(originalPositions.length * originalPositions.length * 3)

            let colorB = this.GetBrightness(color)
            let bgB = this.GetBrightness(backgroundColor)

            diffColor = color.clone().sub(backgroundColor)

            let lineGeometry = new THREE.BufferGeometry()
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage))
            lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage))
            lineGeometry.computeBoundingSphere()
            lineGeometry.setDrawRange(0, 0)

            let lineMaterial = new THREE.LineBasicMaterial({
                vertexColors: THREE.VertexColors,
                linewidth: 1,
                blending: THREE.AdditiveBlending,
                transparent: true,
                side: THREE.DoubleSide,
            })

            linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
            

        },

        UpdateNet(){
            let vertexPos = 0
            let colorPos = 0
            let numConnected = 0

            for(let i = 0; i < points.length; i++){
                let distance
                let point = points[i]
                
                if(point.r != 0){
                    let angle = Math.atan2(point.position.z, point.position.x)
                    distance = Math.sqrt((point.position.z * point.position.z) + (point.position.x * point.position.x))
                    angle += 0.00025 * point.r
                    point.position.x = Math.cos(angle) * distance
                    point.position.z = Math.sin(angle) * distance
                }

                for(let j = i; j < points.length; j++){
                    if(i == j) continue
                    let otherPoint = points[j]
                    const dx = point.position.x - otherPoint.position.x
                    const dy = point.position.y - otherPoint.position.y
                    const dz = point.position.z - otherPoint.position.z
                    distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
                    
                    if(distance < maxDistance){
                        let lineColor
                        const alpha = this.Clamp(0, 1, ((1 - (distance / maxDistance)) *5))
                        // console.log(alpha)
                        lineColor = new THREE.Color(0x990000).lerp(diffColor, alpha)

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

            linesMesh.geometry.setDrawRange(0, numConnected * 2)
            linesMesh.geometry.attributes.position.needsUpdate = true
            linesMesh.geometry.attributes.color.needsUpdate = true
        },

        Clamp(min, max, value){
            if(value < min) return min
            if(value > max) return max
            return value
        },

        async StartEngine(){
            let container = this.$refs.dropcontainer
            let canvas = this.$refs.drop

            canvas.width = container.clientWidth
            canvas.height = container.clientHeight

            clock = new THREE.Clock()
            scene = new THREE.Scene()
            camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
            camera.position.z = 7
            camera.position.y = -2.4

            camera.position.x = 0.13
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: canvas })
            renderer.setSize(container.clientWidth, container.clientHeight)

            for(let i = 0; i < originalPositions.length; i++){
                const geometry = new THREE.SphereGeometry( 0.3, 12, 12 )
                const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 })
                const sphere = new THREE.Mesh( geometry, material );
                sphere.position.z = originalPositions[i].z
                sphere.position.y = originalPositions[i].y
                sphere.position.x = originalPositions[i].x
                sphere.scale.set(0.1,0.1,0.1)
                
                if(sphere.position.y != 0) {
                    sphere.r = -2 + Math.random() * 4
                }else{
                    sphere.r = 0
                }

                points.push(sphere)
                scene.add( sphere );
            }

            scene.add(linesMesh)

            // renderer.toneMapping = THREE.ReinhardToneMapping;
            // renderer.toneMappingExposure = Math.pow( 1.5, 4.0 )

            // renderScene = new RenderPass(scene, camera)
            // bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight),0.5,2,0.2)

            // bloomPass.threshold = 0.1
            // bloomPass.strength = 3
            // bloomPass.radius = 0.1
            // bloomComposer = new EffectComposer(renderer)
            // bloomComposer.addPass(renderScene)
            // bloomComposer.addPass(bloomPass)

            // finalPass = new ShaderPass(
			// 	new THREE.ShaderMaterial( {
			// 		uniforms: {
			// 			baseTexture: { value: null },
			// 			bloomTexture: { value: bloomComposer.renderTarget2.texture }
			// 		},
			// 		vertexShader: `
            //             varying vec2 vUv;
            //             void main() {
            //                 vUv = uv;
            //                 gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            //             }
            //         `,
			// 		fragmentShader: `
            //             uniform sampler2D baseTexture;
            //             uniform sampler2D bloomTexture;

            //             varying vec2 vUv;

                        

            //             void main() {
            //                 gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
            //             }
            //         `,
			// 		defines: {}
			// 	} ), "baseTexture"
			// );
			// // finalPass.needsSwap = true;

            // finalComposer = new EffectComposer(renderer)
            // finalComposer.addPass(renderScene)
            // finalComposer.addPass(finalPass)

            // bloomComposer.renderToScreen = true






            const light = new THREE.PointLight( 0xffffff, 1, 100 );
            light.position.set( 0, 0, 5 );
            scene.add( light );

            // dropModel.scale.set(0.01, 0.01, 0.01)
            
            // scene.add(dropModel)
            

            // console.log(dropModel.vertices)

            // const geometry = new THREE.BoxGeometry();
            // const material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
            // const cube = new THREE.Mesh( geometry, material );
            // cube.position.z = -1
            // cube.position.y = 0.2
            // cube.position.x = 0.12
            // cube.scale.set(3,7,2)
            // cube.layers.set(BLOOM_SCENE)
            // scene.add( cube );
            // console.log(dropMesh)

            // positions = dropMesh.geometry.attributes.position
            // for(let i = 0; i < positions.count; i++){
            //     originalPositions.push(positions.getY(i))
            // }
            
            // uv = dropMesh.geometry.attributes.uv

            this.Update()
        },

        Update(){
            requestAnimationFrame(this.Update)
            // dropModel.rotation.y += 0.003

            // let t = clock.getElapsedTime()

            this.UpdateNet()

            // for (let i = 0; i < positions.count; i++){
            //     pointUV.fromBufferAttribute(uv, i).multiplyScalar(2500)
            //     let y = perlin.noise(pointUV.x, pointUV.y + t, t * 0.01)
            //     // console.log(y)
            //     positions.setY(i, originalPositions[i] + y * 5)
            // }
            // positions.needsUpdate = true

            // camera.layers.set( BLOOM_SCENE );
            // bloomComposer.render();
            // camera.layers.set( ENTIRE_SCENE );

            renderer.render(scene, camera)
        },

        async LoadDropModel(){
            dropModel = await this.LoadModel('/assets/models/dropinner.obj')
            dropModel.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.layers.set( BLOOM_SCENE );
                    child.material = new THREE.MeshBasicMaterial( { color: 0xff0202, wireframe: false } );
                    // points = new THREE.Points(child.geometry, new THREE.PointsMaterial({ size: 0.01, color: 0xffffff }))
                    // console.log(points.morphTargetInfluences)
                    // points.morphTargetInfluences = child.morphTargetInfluences
                    // points.morphTargetDictionary = child.morphTargetDictionary
                    // child.add(points)
                    // console.log(child.morphTargetInfluences)
                    dropMesh = child

                    // child.material =new THREE.MeshPhongMaterial({
                    //     color: 0xff0000,
                    //     // flatShading: true,
                    //     shininess: 2,
                    //     specular: 0xffffff,
                    //     // side: THREE.DoubleSide
                    // })
                //     child.castShadow = true
                //     child.receiveShadow = true
                }
            })
        },

        async LoadModel(path){
            return new Promise((resolve, reject) => {
                let loader = new OBJLoader()
                loader.load(
                    path,
                    (object) => { resolve(object) },
                    (xhr) => { console.log(Math.round(xhr.loaded / xhr.total * 100) + '% of Drop model loaded') },
                    (error) => { reject(error) }
                )
            })
        }
    }
}
</script>

<style lang="scss">
.drop {
    width: 639px;
    height: 599px;
    
}
</style>