import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'


/**
 * Base
 */
// Debug

const debugObject = {}
const gui = new GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Object
 */
// const cube = new THREE.Mesh(
//     new THREE.BoxGeometry(1, 1, 1),
//     new THREE.MeshBasicMaterial()
// )

// scene.add(cube)

// textures
const bakedTexture = textureLoader.load('baked1.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

// materials

// baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

// pole light
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffd8c5 })

debugObject.portalColorStart = '#ffc7c7'
debugObject.portalColorEnd = '#000000'

gui
    .addColor(debugObject, 'portalColorStart')
    .onChange(() => 
    {
        portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)
    })
gui
    .addColor(debugObject, 'portalColorEnd')
    .onChange(() => 
    {
        portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)
    })

// portal light
const portalLightMaterial = new THREE.ShaderMaterial({ 
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
        uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) }
    }
 })


// model
gltfLoader.load(
    'portal-one.glb',
    (gltf) =>

    {
        scene.add(gltf.scene)

        // gltf.scene.traverse((child) =>
        // {
        //     child.material = bakedMaterial // this applies to everything, even non-meshes (this is fine because we are eventually going to get rid of this)
        // })
        const bakedMesh = gltf.scene.children.find((child) => child.name === 'baked')
        const poleLightAMesh = gltf.scene.children.find(child => child.name === 'poleLightA')
        const poleLightBMesh = gltf.scene.children.find(child => child.name === 'poleLightB')
        const portalLightMesh = gltf.scene.children.find(child => child.name === 'portalLight')

        // log these to the console to make sure you are finding them accurately
        bakedMesh.material = bakedMaterial
        portalLightMesh.material = portalLightMaterial
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial
        
    })

// fireflies

// ff geometry

const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount * 3) // created an empty array with 90 spaces
const scaleArray = new Float32Array(firefliesCount) // one value for each ff

for(let i = 0; i < firefliesCount; i++) // fills array with "fireflies"
{
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = Math.random() * 1.5
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

    scaleArray[i] = Math.random()

}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3)) // cannot be a name other than position, this is chosen by 3js, the 3 represents how many vertices or values we are sending (xyz verts)
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

// ff material
const firefliesMaterial = new THREE.ShaderMaterial({ 
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms:
    {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2 )},
        uSize: { value: 100 },
        uTime: { value: 0 }
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader
 })

 gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(500).step(1).name('firefliesSize ')

// ff points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// add background color gui to lilgui
debugObject.clearColor = '#282624'
renderer.setClearColor(debugObject.clearColor) // actually changes the bg color

gui
    .addColor(debugObject, 'clearColor')
    .onChange(() =>
    {
        renderer.setClearColor(debugObject.clearColor) // applies the gui color to bg
    }
    )

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // update materials, fireflies
    firefliesMaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()