'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ThreeGroceryVisualProps {
  interactive?: boolean
}

export default function ThreeGroceryVisual({ interactive = true }: ThreeGroceryVisualProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 600
    const height = container.clientHeight || 600

    // SCENE & CAMERA
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000)
    camera.position.set(0, 0.8, 7.2)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.VSMShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    // REALISTIC LIGHTING SETUP
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.8)
    scene.add(ambientLight)

    // Warm Key Light (Spotlight with soft shadows)
    const keyLight = new THREE.SpotLight(0xfff2d6, 4.5)
    keyLight.position.set(4, 7, 6)
    keyLight.angle = Math.PI / 4
    keyLight.penumbra = 0.5
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)

    // Cool Rim Light
    const rimLight = new THREE.DirectionalLight(0xaed6f1, 2.0)
    rimLight.position.set(-5, 4, -4)
    scene.add(rimLight)

    // Golden Accent Point Light
    const goldAccent = new THREE.PointLight(0xedc155, 3.0, 30)
    goldAccent.position.set(2, 2, 4)
    scene.add(goldAccent)

    // Cyan Telemetry Sensor Light
    const sensorLight = new THREE.PointLight(0x10b981, 2.0, 25)
    sensorLight.position.set(-3, -1, 3)
    scene.add(sensorLight)

    // ROOT GROUP FOR MOUSE PARALLAX
    const mainGroup = new THREE.Group()
    mainGroup.rotation.y = -Math.PI * 0.12
    mainGroup.rotation.x = Math.PI * 0.04

    // -------------------------------------------------------------
    // CANVAS TEXTURE GENERATORS (PHOTOREALISTIC LABELS & DISPLAYS)
    // -------------------------------------------------------------

    // 1. Electronic Shelf Label (E-Ink Display Texture)
    const createEInkTexture = (sku: string, name: string, price: string, status: string, isAlert = false) => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // E-ink paper background
        ctx.fillStyle = isAlert ? '#1e0c0e' : '#f4f5f7'
        ctx.fillRect(0, 0, 512, 256)

        // Outer border frame
        ctx.strokeStyle = isAlert ? '#ffb4ab' : '#2c3038'
        ctx.lineWidth = 12
        ctx.strokeRect(6, 6, 500, 244)

        // Header Tag
        ctx.fillStyle = isAlert ? '#ffb4ab' : '#10131b'
        ctx.font = 'bold 24px monospace'
        ctx.fillText(`STOCK PULSE // ${sku}`, 30, 48)

        // Product Name
        ctx.fillStyle = isAlert ? '#ffffff' : '#111827'
        ctx.font = 'bold 32px sans-serif'
        ctx.fillText(name.toUpperCase(), 30, 96)

        // Price
        ctx.fillStyle = isAlert ? '#ff4d4d' : '#000000'
        ctx.font = 'bold 56px monospace'
        ctx.fillText(price, 30, 175)

        // Status & Barcode simulation
        ctx.fillStyle = isAlert ? '#ffb4ab' : '#059669'
        ctx.font = 'bold 22px monospace'
        ctx.fillText(status, 30, 220)

        // Simulated Barcode lines on right side
        ctx.fillStyle = isAlert ? '#ffffff' : '#111827'
        for (let i = 0; i < 28; i++) {
          const w = i % 3 === 0 ? 6 : 2
          ctx.fillRect(350 + i * 5, 120, w, 90)
        }
      }
      const texture = new THREE.CanvasTexture(canvas)
      texture.anisotropy = 16
      return texture
    }
    // Every texture in this scene is generated locally — no loader needed.


    // -------------------------------------------------------------
    // REALISTIC PBR MATERIALS
    // -------------------------------------------------------------

    // Dark Titanium Shelf Pillars
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d24,
      metalness: 0.95,
      roughness: 0.15,
    })

    // Gold Anodized Brass Rails
    const goldBrassMat = new THREE.MeshStandardMaterial({
      color: 0xe0b343,
      metalness: 0.9,
      roughness: 0.2,
    })

    // Tempered Heavy Glass Shelf with refraction & clarity
    const temperedGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.96,
      opacity: 0.98,
      transparent: true,
      roughness: 0.04,
      ior: 1.52,
      thickness: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
    })

    // Dark Matte ESL Casing
    const eslFrameMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      metalness: 0.7,
      roughness: 0.3,
    })

    // -------------------------------------------------------------
    // 1. SMART GROCERY SHELF STRUCTURE
    // -------------------------------------------------------------
    const shelfGroup = new THREE.Group()

    // 4 Corner Structural Titanium Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.045, 0.045, 3.4, 32)
    const pillarPositions: [number, number, number][] = [
      [-1.9, 0, -0.85],
      [1.9, 0, -0.85],
      [-1.9, 0, 0.85],
      [1.9, 0, 0.85],
    ]

    pillarPositions.forEach(([px, py, pz]) => {
      const pMesh = new THREE.Mesh(pillarGeo, titaniumMat)
      pMesh.position.set(px, py, pz)
      pMesh.castShadow = true
      pMesh.receiveShadow = true
      shelfGroup.add(pMesh)
    })

    // 3 Shelf Tiers
    const shelfYLevels = [-1.15, 0, 1.15]

    shelfYLevels.forEach((sy, tierIdx) => {
      // Tempered Glass Deck
      const glassGeo = new THREE.BoxGeometry(3.8, 0.06, 1.7)
      const glassMesh = new THREE.Mesh(glassGeo, temperedGlassMat)
      glassMesh.position.set(0, sy, 0)
      glassMesh.receiveShadow = true
      shelfGroup.add(glassMesh)

      // Brass Front Rail
      const railGeo = new THREE.BoxGeometry(3.86, 0.08, 0.06)
      const railMesh = new THREE.Mesh(railGeo, goldBrassMat)
      railMesh.position.set(0, sy, 0.87)
      railMesh.castShadow = true
      shelfGroup.add(railMesh)

      // Under-Shelf LED Strip Light
      const ledGeo = new THREE.BoxGeometry(3.7, 0.02, 0.04)
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xffeaad })
      const ledMesh = new THREE.Mesh(ledGeo, ledMat)
      ledMesh.position.set(0, sy - 0.04, 0.82)
      shelfGroup.add(ledMesh)

      // ELECTRONIC SHELF LABELS (E-INK TAGS)
      if (tierIdx === 1) {
        // Middle shelf tag: Pomegranate SKU
        const tagTex = createEInkTexture('SKU-8821', 'ROYAL POM', '₹499', 'FRESH 98%')
        const tagMat = new THREE.MeshStandardMaterial({ map: tagTex })
        const tagGeo = new THREE.BoxGeometry(0.7, 0.35, 0.03)
        const tagMesh = new THREE.Mesh(tagGeo, [
          eslFrameMat, eslFrameMat, eslFrameMat, eslFrameMat, tagMat, eslFrameMat,
        ])
        tagMesh.position.set(-0.8, sy - 0.18, 0.92)
        tagMesh.rotation.x = -0.15
        shelfGroup.add(tagMesh)

        // Second tag: Avocado SKU (Alert)
        const tagTex2 = createEInkTexture('SKU-1029', 'AVOCADO', '₹180', 'EXP: 2 DAYS', true)
        const tagMat2 = new THREE.MeshStandardMaterial({ map: tagTex2 })
        const tagMesh2 = new THREE.Mesh(tagGeo, [
          eslFrameMat, eslFrameMat, eslFrameMat, eslFrameMat, tagMat2, eslFrameMat,
        ])
        tagMesh2.position.set(0.8, sy - 0.18, 0.92)
        tagMesh2.rotation.x = -0.15
        shelfGroup.add(tagMesh2)
      } else if (tierIdx === 2) {
        // Top shelf tag: Olive oil
        const tagTex = createEInkTexture('SKU-4910', 'OLIVE OIL', '₹2,450', 'OPTIMAL')
        const tagMat = new THREE.MeshStandardMaterial({ map: tagTex })
        const tagGeo = new THREE.BoxGeometry(0.7, 0.35, 0.03)
        const tagMesh = new THREE.Mesh(tagGeo, [
          eslFrameMat, eslFrameMat, eslFrameMat, eslFrameMat, tagMat, eslFrameMat,
        ])
        tagMesh.position.set(-1.0, sy - 0.18, 0.92)
        tagMesh.rotation.x = -0.15
        shelfGroup.add(tagMesh)
      }
    })

    mainGroup.add(shelfGroup)

    // -------------------------------------------------------------
    // 2. PHOTOREALISTIC GROCERY PRODUCT DISPLAYS (3D STUDIO ASSETS)
    // -------------------------------------------------------------
    const itemsGroup = new THREE.Group()

    /**
     * REAL 3D PRODUCTS, not pictures of products.
     *
     * What was here built a flat panel per product: a thin box whose front
     * face carried a canvas drawing. That is a photograph standing on a shelf,
     * and it read as one — cutout paper shapes with no side faces and no
     * volume, and the giveaway only became obvious as the scene rotated and
     * they stayed card-thin.
     *
     * Each product below is built from actual geometry, so it has real side
     * and top faces, occupies real depth, sits ON the deck rather than against
     * it, casts into the same shadow pass as the shelf, and turns with the
     * scene because it lives in the same group.
     *
     * Palette only: gold, deep red, coffee-brown, cream, near-black. Every
     * material is flat standard PBR — no textures, no images, nothing fetched.
     */
    const mat = (color: number, roughness = 0.55, metalness = 0.05) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness })

    const cardboardMat = mat(0x4a3524, 0.85)  // coffee-brown crate
    const cartonMat = mat(0xf4e8d4, 0.7)      // cream milk carton
    const cartonCapMat = mat(0x8f2a1c, 0.6)   // deep red gable panel
    const sackMat = mat(0xd6c3a3, 0.9)        // cream hessian sack
    const bottleGlassMat = mat(0x8a6206, 0.25, 0.1)
    const jarGlassMat = mat(0x5c1a11, 0.3, 0.1)
    const tomatoMat = mat(0x8f2a1c, 0.45)
    const onionMat = mat(0xe3b341, 0.5)
    const carrotMat = mat(0xc9a227, 0.5)
    const leafMat = mat(0x6f5006, 0.75)

    /** Everything inside a product casts and receives, exactly as the shelf does. */
    const shade = (o: THREE.Object3D) => {
      o.traverse((n) => {
        const m = n as THREE.Mesh
        if (m.isMesh) {
          m.castShadow = true
          m.receiveShadow = true
        }
      })
      return o
    }

    /** Cylindrical body plus a distinctly narrower neck and wider cap, which
     *  is what makes a bottle read as a bottle rather than as a post. */
    function makeBottle() {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.42, 24), bottleGlassMat)
      body.position.y = 0.21
      const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.17, 0.16, 24), bottleGlassMat)
      shoulder.position.y = 0.5
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 20), bottleGlassMat)
      neck.position.y = 0.66
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.09, 20), goldBrassMat)
      cap.position.y = 0.78
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.192, 0.17, 24), cartonMat)
      label.position.y = 0.2
      g.add(body, shoulder, neck, cap, label)
      return shade(g)
    }

    /** Squat body, wide screw lid. */
    function makeJar() {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.22, 0.34, 24), jarGlassMat)
      body.position.y = 0.17
      const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.08, 24), jarGlassMat)
      shoulder.position.y = 0.38
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 24), goldBrassMat)
      lid.position.y = 0.47
      g.add(body, shoulder, lid)
      return shade(g)
    }

    /** Gable-top carton: a box plus two slanted roof panels and a ridge. The
     *  roof is the whole reason it reads as milk with no label on it. */
    function makeCarton() {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.36), cartonMat)
      body.position.y = 0.25
      const roofL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.03), cartonCapMat)
      roofL.position.set(0, 0.62, 0.09)
      roofL.rotation.x = -Math.PI * 0.18
      const roofR = roofL.clone()
      roofR.position.z = -0.09
      roofR.rotation.x = Math.PI * 0.18
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.05), cartonCapMat)
      ridge.position.y = 0.73
      g.add(body, roofL, roofR, ridge)
      return shade(g)
    }

    /** Tapered body — wide at the base, gathered at the neck, tied off. */
    function makeSack() {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.28, 0.46, 9), sackMat)
      body.position.y = 0.23
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.1, 9), sackMat)
      neck.position.y = 0.51
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 16), goldBrassMat)
      tie.position.y = 0.56
      tie.rotation.x = Math.PI / 2
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.247, 0.11, 9), cardboardMat)
      band.position.y = 0.2
      g.add(body, neck, tie, band)
      return shade(g)
    }

    /**
     * A low open crate with produce standing proud of the rim.
     *
     * Four walls and a base rather than a solid box, because the open top is
     * what makes it a crate — and the produce has to break the rim line, or
     * the whole thing reads as a closed carton with lumps resting on it.
     */
    function makeCrate(fill: 'greens' | 'roots') {
      const g = new THREE.Group()
      const W = 0.62
      const D = 0.44
      const H = 0.2
      const T = 0.03

      const base = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), cardboardMat)
      base.position.y = T / 2
      g.add(base)

      const side = (w: number, d: number, x: number, z: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), cardboardMat)
        m.position.set(x, H / 2, z)
        g.add(m)
      }
      side(W, T, 0, D / 2 - T / 2)
      side(W, T, 0, -D / 2 + T / 2)
      side(T, D, W / 2 - T / 2, 0)
      side(T, D, -W / 2 + T / 2, 0)

      if (fill === 'roots') {
        // Onions: squashed spheres. The squash is the shape difference that
        // stops them reading as generic balls.
        const onionGeo = new THREE.SphereGeometry(0.11, 16, 12)
        const onionAt: [number, number][] = [[-0.17, 0.03], [0.05, -0.06], [0.2, 0.06]]
        onionAt.forEach(([x, z], i) => {
          const o = new THREE.Mesh(onionGeo, onionMat)
          o.scale.set(1, 0.85, 1)
          o.position.set(x, H + 0.07 + (i % 2) * 0.01, z)
          g.add(o)
        })
        // Carrots: cones laid over at an angle, tips inward.
        const carrotGeo = new THREE.ConeGeometry(0.055, 0.34, 12)
        ;[-0.12, 0.14].forEach((x, i) => {
          const c = new THREE.Mesh(carrotGeo, carrotMat)
          c.rotation.z = Math.PI / 2
          c.rotation.y = i ? 0.3 : -0.35
          c.position.set(x, H + 0.06, -0.11 + i * 0.05)
          g.add(c)
        })
      } else {
        const tomGeo = new THREE.SphereGeometry(0.1, 16, 12)
        const tomAt: [number, number][] = [[-0.18, 0.02], [0.02, -0.05], [0.19, 0.05]]
        tomAt.forEach(([x, z]) => {
          const t = new THREE.Mesh(tomGeo, tomatoMat)
          t.scale.set(1, 0.88, 1)
          t.position.set(x, H + 0.07, z)
          g.add(t)
        })
        // A leafy bunch: flattened blades splayed out of the back of the crate.
        const bladeGeo = new THREE.BoxGeometry(0.05, 0.26, 0.012)
        for (let i = 0; i < 5; i++) {
          const b = new THREE.Mesh(bladeGeo, leafMat)
          b.position.set(-0.05 + i * 0.045, H + 0.16, -0.13)
          b.rotation.z = (i - 2) * 0.16
          b.rotation.x = -0.18
          g.add(b)
        }
      }
      return shade(g)
    }

    /** Sit a product ON a deck. The deck is 0.06 thick, so its surface is
     *  sy + 0.03, and every model above is built upwards from y = 0. */
    const place = (obj: THREE.Object3D, x: number, sy: number, z: number, rotY: number) => {
      obj.position.set(x, sy + 0.03, z)
      obj.rotation.y = rotY
      itemsGroup.add(obj)
      return obj
    }

    const topY = 1.15
    const midY = 0
    const botY = -1.15

    // --- TOP SHELF: cooking-oil bottles & preserve jars ---
    place(makeBottle(), -1.05, topY, 0.05, Math.PI * 0.05)
    place(makeBottle(), -0.62, topY, -0.14, -Math.PI * 0.12)
    place(makeJar(), 0.72, topY, 0.02, Math.PI * 0.08)
    place(makeJar(), 1.14, topY, -0.15, -Math.PI * 0.05)

    // --- MIDDLE SHELF: fresh produce in open crates ---
    place(makeCrate('greens'), -0.85, midY, 0.06, Math.PI * 0.06)
    place(makeCrate('roots'), 0.85, midY, 0.06, -Math.PI * 0.06)

    // --- BOTTOM SHELF: milk cartons & a staples sack ---
    place(makeCarton(), -1.1, botY, 0.02, Math.PI * 0.07)
    place(makeCarton(), -0.66, botY, -0.15, -Math.PI * 0.04)
    place(makeSack(), 0.85, botY, 0.0, Math.PI * 0.1)

    mainGroup.add(itemsGroup)

    // -------------------------------------------------------------
    // 3. COLD-CHAIN TELEMETRY SENSOR PROBE & OPTICAL LASER SCANNER
    // -------------------------------------------------------------
    const telemetryGroup = new THREE.Group()

    // Cold-Chain Sensor Pod attached to frame pillar
    const sensorPodGeo = new THREE.BoxGeometry(0.22, 0.45, 0.22)
    const sensorPodMesh = new THREE.Mesh(sensorPodGeo, titaniumMat)
    sensorPodMesh.position.set(-1.9, 0.4, 0.85)

    // Sensor Probe Screen (Digital temperature reading 3.8°C)
    const screenCanvas = document.createElement('canvas')
    screenCanvas.width = 256
    screenCanvas.height = 256
    const sCtx = screenCanvas.getContext('2d')
    if (sCtx) {
      sCtx.fillStyle = '#0b0e15'
      sCtx.fillRect(0, 0, 256, 256)
      sCtx.fillStyle = '#10b981'
      sCtx.font = 'bold 36px monospace'
      sCtx.fillText('IN STOCK', 20, 60)
      sCtx.font = 'bold 72px monospace'
      sCtx.fillText('3.8°C', 20, 160)
      sCtx.fillStyle = '#edc155'
      sCtx.font = 'bold 24px monospace'
      sCtx.fillText('NOMINAL', 20, 220)
    }
    const screenTex = new THREE.CanvasTexture(screenCanvas)
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex })
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.4), screenMat)
    screenMesh.position.set(-1.9, 0.4, 0.965)
    telemetryGroup.add(sensorPodMesh)
    telemetryGroup.add(screenMesh)

    // Coiled Wire from Sensor Pod to Middle Shelf
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.9, 0.2, 0.85),
      new THREE.Vector3(-1.7, 0.1, 0.7),
      new THREE.Vector3(-1.2, 0.05, 0.5),
      new THREE.Vector3(-0.8, 0.03, 0.3),
    ])
    const wireGeo = new THREE.TubeGeometry(curve, 32, 0.012, 8, false)
    const probeWireMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
    const wireMesh = new THREE.Mesh(wireGeo, probeWireMat)
    telemetryGroup.add(wireMesh)

    // Scanning Laser Beam Plane
    const scanBeamGeo = new THREE.PlaneGeometry(3.8, 0.04)
    const scanBeamMat = new THREE.MeshBasicMaterial({
      color: 0xedc155,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
    const scanBeam = new THREE.Mesh(scanBeamGeo, scanBeamMat)
    scanBeam.position.set(0, 0, 0.9)
    telemetryGroup.add(scanBeam)

    /* The two telemetry bounding boxes are GONE.
     *
     * They were wireframe cubes floating around the middle shelf, one gold and
     * one green, and they were the other half of why this scene read as
     * broken: a wireframe box drawn over a product is the universal look of
     * something that failed to load, or of a debug overlay left switched on.
     * They also implied a meaning the product does not have — nothing in
     * StockPulse does object detection, so a machine-vision detection box was
     * promising a feature that does not exist.
     *
     * The scan beam and sensor pod stay. Those read as a shelf sensor, which
     * is a thing the monitoring feature genuinely models.
     */
    mainGroup.add(telemetryGroup)
    scene.add(mainGroup)

    // -------------------------------------------------------------
    // MOUSE PARALLAX & ANIMATION LOOP
    // -------------------------------------------------------------
    let mouseX = 0
    let mouseY = 0
    let targetRotY = -Math.PI * 0.12
    let targetRotX = Math.PI * 0.04

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return
      const rect = container.getBoundingClientRect()
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2
    }

    window.addEventListener('mousemove', handleMouseMove)

    // THREE.Clock is deprecated in this three.js version (see console
    // warning it emits); performance.now() is the replacement it points at
    // and has none of Clock's edge cases around tab-visibility pausing.
    const startTime = performance.now()
    let animId: number

    const animate = () => {
      const t = (performance.now() - startTime) / 1000

      // Smooth floating oscillation
      mainGroup.position.y = Math.sin(t * 1.2) * 0.06

      // Animate optical scan laser up and down
      const scanY = Math.sin(t * 1.4) * 1.15
      scanBeam.position.y = scanY

      // The bounding-box pulse went with the boxes themselves.

      // Lerp rotation for smooth mouse interaction
      targetRotY += (mouseX * 0.35 - Math.PI * 0.12 - targetRotY) * 0.05
      targetRotX += (mouseY * 0.25 + Math.PI * 0.04 - targetRotX) * 0.05
      mainGroup.rotation.y = targetRotY
      mainGroup.rotation.x = -targetRotX

      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [interactive])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full min-h-[440px]" />
    </div>
  )
}
