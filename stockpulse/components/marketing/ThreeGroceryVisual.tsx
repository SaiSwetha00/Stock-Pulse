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

    /**
     * GROCERY SILHOUETTES — locally drawn product panels.
     *
     * These first replaced six `images.unsplash.com` texture loads, for three
     * reasons any one of which is sufficient: remote stock photography carries
     * licensing, it made the landing page depend on a third-party CDN at
     * render time, and all six URLs had already gone 404 — so the scene was
     * fetching, failing, and rendering untextured anyway.
     *
     * That first replacement drew a circle above a horizontal line on every
     * panel. Which is, almost exactly, the glyph browsers and design tools use
     * for a MISSING IMAGE — so six identical broken-image placeholders ended
     * up sitting on a shelf meant to be selling the product. It read as a
     * failure state, not as groceries. This is the second attempt, and the
     * lesson is that "restrained" and "unfinished" can look identical.
     *
     * These are flat line-and-fill shapes: a filled body in one palette colour
     * and a single ink outline, no gradients inside the shape, no shading, no
     * photographs. At the size these render — roughly 90px across in the
     * hero — anything more detailed turns to mush, and anything less is the
     * circle-and-line again.
     *
     * Canvas-drawn for the same reason the rest of this file is: it adds no
     * asset to the repo, no network request, and no dependency.
     */
    type ItemKind = 'leaves' | 'tomato' | 'carrot' | 'onion' | 'bottle' | 'carton' | 'bag' | 'jar'

    function drawItem(
      g: CanvasRenderingContext2D,
      kind: ItemKind,
      cx: number,
      cy: number,
      s: number,
      fill: string,
      ink: string,
    ) {
      g.save()
      g.translate(cx, cy)
      g.scale(s, s)
      g.lineJoin = 'round'
      g.lineCap = 'round'
      g.strokeStyle = ink
      g.lineWidth = 5
      g.fillStyle = fill

      const leaf = (ang: number, len: number, wide: number) => {
        g.save()
        g.rotate(ang)
        g.beginPath()
        g.moveTo(0, 0)
        g.quadraticCurveTo(-wide, -len * 0.55, 0, -len)
        g.quadraticCurveTo(wide, -len * 0.55, 0, 0)
        g.closePath()
        g.fill()
        g.stroke()
        g.restore()
      }

      if (kind === 'leaves') {
        // A tied bunch of greens: three blades from one stem.
        leaf(-0.5, 82, 26)
        leaf(0, 96, 28)
        leaf(0.5, 82, 26)
        g.beginPath()
        g.moveTo(0, 0)
        g.lineTo(0, 34)
        g.stroke()
      } else if (kind === 'tomato') {
        g.beginPath()
        g.arc(0, 6, 44, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        // Calyx — the detail that stops it reading as a plain ball.
        g.beginPath()
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2
          g.moveTo(0, -38)
          g.lineTo(Math.cos(a) * 22, -38 + Math.sin(a) * 16)
        }
        g.stroke()
        g.beginPath()
        g.moveTo(0, -38)
        g.lineTo(0, -56)
        g.stroke()
      } else if (kind === 'carrot') {
        g.beginPath()
        g.moveTo(-26, -22)
        g.lineTo(26, -22)
        g.lineTo(0, 74)
        g.closePath()
        g.fill()
        g.stroke()
        g.beginPath()
        g.moveTo(-16, -24)
        g.lineTo(-26, -60)
        g.moveTo(0, -24)
        g.lineTo(0, -66)
        g.moveTo(16, -24)
        g.lineTo(26, -60)
        g.stroke()
      } else if (kind === 'onion') {
        g.beginPath()
        g.moveTo(0, -26)
        g.bezierCurveTo(46, -20, 46, 62, 0, 62)
        g.bezierCurveTo(-46, 62, -46, -20, 0, -26)
        g.closePath()
        g.fill()
        g.stroke()
        g.beginPath()
        g.moveTo(0, -26)
        g.lineTo(-8, -58)
        g.moveTo(0, -26)
        g.lineTo(10, -56)
        g.stroke()
        // Two seams, which is what makes an onion an onion and not a potato.
        g.beginPath()
        g.moveTo(-18, -14)
        g.quadraticCurveTo(-26, 24, -14, 54)
        g.moveTo(18, -14)
        g.quadraticCurveTo(26, 24, 14, 54)
        g.stroke()
      } else if (kind === 'bottle') {
        g.beginPath()
        g.moveTo(-12, -74)
        g.lineTo(12, -74)
        g.lineTo(12, -40)
        g.quadraticCurveTo(30, -20, 30, 10)
        g.lineTo(30, 66)
        g.quadraticCurveTo(30, 76, 20, 76)
        g.lineTo(-20, 76)
        g.quadraticCurveTo(-30, 76, -30, 66)
        g.lineTo(-30, 10)
        g.quadraticCurveTo(-30, -20, -12, -40)
        g.closePath()
        g.fill()
        g.stroke()
        g.beginPath()
        g.moveTo(-14, -74)
        g.lineTo(14, -74)
        g.stroke()
        g.beginPath()
        g.moveTo(-24, 14)
        g.lineTo(24, 14)
        g.stroke()
      } else if (kind === 'carton') {
        // Gable top — the shape that says "milk" without a label.
        g.beginPath()
        g.moveTo(-34, -34)
        g.lineTo(0, -74)
        g.lineTo(34, -34)
        g.lineTo(34, 70)
        g.lineTo(-34, 70)
        g.closePath()
        g.fill()
        g.stroke()
        g.beginPath()
        g.moveTo(-34, -34)
        g.lineTo(34, -34)
        g.moveTo(0, -74)
        g.lineTo(0, -34)
        g.stroke()
      } else if (kind === 'bag') {
        g.beginPath()
        g.moveTo(-30, -46)
        g.lineTo(30, -46)
        g.lineTo(40, 70)
        g.lineTo(-40, 70)
        g.closePath()
        g.fill()
        g.stroke()
        // Folded-over top.
        g.beginPath()
        g.moveTo(-30, -46)
        g.quadraticCurveTo(0, -66, 30, -46)
        g.stroke()
        g.beginPath()
        g.moveTo(-34, 16)
        g.lineTo(34, 16)
        g.stroke()
      } else if (kind === 'jar') {
        g.beginPath()
        g.moveTo(-34, -34)
        g.lineTo(34, -34)
        g.lineTo(38, 58)
        g.quadraticCurveTo(38, 72, 24, 72)
        g.lineTo(-24, 72)
        g.quadraticCurveTo(-38, 72, -38, 58)
        g.closePath()
        g.fill()
        g.stroke()
        // Lid.
        g.beginPath()
        g.rect(-40, -62, 80, 28)
        g.fill()
        g.stroke()
      }
      g.restore()
    }

    /**
     * One panel face. `kinds` may hold two items — a produce face reads more
     * like a grocery shelf as a small grouping than as one lonely vegetable,
     * and it is how all eight requested items fit across six shelf faces
     * without adding or moving a single panel.
     */
    function createProductPanel(top: string, bottom: string, ink: string, kinds: ItemKind[], fill: string) {
      const c = document.createElement('canvas')
      c.width = 256
      c.height = 256
      const g = c.getContext('2d')
      if (g) {
        const grad = g.createLinearGradient(0, 0, 0, 256)
        grad.addColorStop(0, top)
        grad.addColorStop(1, bottom)
        g.fillStyle = grad
        g.fillRect(0, 0, 256, 256)

        // Sized from the rendered screenshot, not from how it looks in the
        // 256px texture. The panel is ~90px wide on screen and tilted away
        // from camera, so a shape that fills a comfortable half of the canvas
        // ends up reading as a small mark on the shelf.
        if (kinds.length === 1) {
          drawItem(g, kinds[0], 128, 116, 1.3, fill, ink)
        } else {
          drawItem(g, kinds[0], 84, 120, 0.92, fill, ink)
          drawItem(g, kinds[1], 174, 124, 0.92, fill, ink)
        }

        // Shelf-edge rule, so the face reads as packaging rather than a sticker.
        g.strokeStyle = ink
        g.globalAlpha = 0.35
        g.lineWidth = 4
        g.beginPath()
        g.moveTo(38, 214)
        g.lineTo(218, 214)
        g.stroke()
      }
      return new THREE.CanvasTexture(c)
    }

    // Palette only: gold, deep red, coffee-brown, cream, near-black.
    // Fills are chosen for contrast against their own panel, not for realism —
    // a red tomato on a red panel is a silhouette nobody can see.
    const greensTex = createProductPanel('#4a3524', '#2b1f16', '#14100c', ['leaves', 'tomato'], '#c9a227')
    const rootsTex = createProductPanel('#8f2a1c', '#5c1a11', '#14100c', ['carrot', 'onion'], '#f4e8d4')
    const oliveOilTex = createProductPanel('#c9a227', '#8a6206', '#14100c', ['bottle'], '#f4e8d4')
    const honeyJarTex = createProductPanel('#e3b341', '#a8822c', '#14100c', ['jar'], '#5c1a11')
    const organicMilkTex = createProductPanel('#f4e8d4', '#d6c3a3', '#4a3524', ['carton'], '#8f2a1c')
    const riceBagTex = createProductPanel('#edc155', '#c9a227', '#14100c', ['bag'], '#4a3524')

    ;[greensTex, rootsTex, oliveOilTex, honeyJarTex, organicMilkTex, riceBagTex].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 16
    })

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

    // Studio Photo Card PBR Material Generator
    const createStudioPhotoMat = (texture: THREE.Texture, roughness = 0.25, metalness = 0.05) => {
      return new THREE.MeshStandardMaterial({
        map: texture,
        roughness,
        metalness,
        side: THREE.DoubleSide,
      })
    }

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

    // Helper: Create a 3D Product Display Stand with realistic studio photo texture & metallic frame
    const createPhotorealisticProductDisplay = (
      texture: THREE.Texture,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      rotationY = 0
    ) => {
      const prodGroup = new THREE.Group()

      // Main product panel
      const boxGeo = new THREE.BoxGeometry(w, h, d)
      const photoMat = createStudioPhotoMat(texture, 0.15, 0.1)

      // Titanium back panel / border frame
      const borderGeo = new THREE.BoxGeometry(w + 0.04, h + 0.04, d * 0.8)
      const borderMesh = new THREE.Mesh(borderGeo, titaniumMat)
      borderMesh.castShadow = true
      borderMesh.receiveShadow = true
      prodGroup.add(borderMesh)

      // Photo Mesh on front face
      const photoMesh = new THREE.Mesh(boxGeo, [
        titaniumMat, titaniumMat, titaniumMat, titaniumMat, photoMat, titaniumMat,
      ])
      photoMesh.position.z = 0.02
      photoMesh.castShadow = true
      photoMesh.receiveShadow = true
      prodGroup.add(photoMesh)

      // Glass protective shield in front
      const shieldGeo = new THREE.BoxGeometry(w + 0.02, h + 0.02, 0.02)
      const shieldMesh = new THREE.Mesh(shieldGeo, temperedGlassMat)
      shieldMesh.position.z = 0.04
      prodGroup.add(shieldMesh)

      prodGroup.position.set(x, y + h / 2 + 0.03, z)
      prodGroup.rotation.y = rotationY
      return prodGroup
    }

    // --- TOP SHELF: cooking oil bottle & preserve jar ---
    const topY = 1.15
    const oliveOilDisplay = createPhotorealisticProductDisplay(oliveOilTex, -0.9, topY, 0.1, 1.1, 0.85, 0.1, Math.PI * 0.04)
    itemsGroup.add(oliveOilDisplay)

    const honeyDisplay = createPhotorealisticProductDisplay(honeyJarTex, 0.9, topY, 0.1, 1.1, 0.85, 0.1, -Math.PI * 0.04)
    itemsGroup.add(honeyDisplay)

    // --- MIDDLE SHELF: fresh produce — leafy greens, tomato, carrot, onion ---
    const midY = 0
    const greensDisplay = createPhotorealisticProductDisplay(greensTex, -0.9, midY, 0.1, 1.25, 0.9, 0.1, Math.PI * 0.03)
    itemsGroup.add(greensDisplay)

    const rootsDisplay = createPhotorealisticProductDisplay(rootsTex, 0.9, midY, 0.1, 1.25, 0.9, 0.1, -Math.PI * 0.03)
    itemsGroup.add(rootsDisplay)

    // --- BOTTOM SHELF: milk carton & staples bag ---
    const botY = -1.15
    const milkDisplay = createPhotorealisticProductDisplay(organicMilkTex, -0.9, botY, 0.1, 1.1, 0.85, 0.1, Math.PI * 0.05)
    itemsGroup.add(milkDisplay)

    const riceBagDisplay = createPhotorealisticProductDisplay(riceBagTex, 0.9, botY, 0.1, 1.1, 0.85, 0.1, -Math.PI * 0.05)
    itemsGroup.add(riceBagDisplay)

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
