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

    // 2. Olive Oil Bottle Label Texture
    const createBottleLabel = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#f8f5eb'
        ctx.fillRect(0, 0, 512, 512)

        ctx.strokeStyle = '#c9a037'
        ctx.lineWidth = 10
        ctx.strokeRect(20, 20, 472, 472)

        ctx.fillStyle = '#1c2118'
        ctx.font = 'bold 36px serif'
        ctx.textAlign = 'center'
        ctx.fillText('ESTATE SELECTION', 256, 120)

        ctx.fillStyle = '#c9a037'
        ctx.font = 'bold 48px serif'
        ctx.fillText('EXTRA VIRGIN', 256, 190)
        ctx.fillText('OLIVE OIL', 256, 245)

        ctx.fillStyle = '#4a5240'
        ctx.font = '22px sans-serif'
        ctx.fillText('COLD PRESSED • 500 ML', 256, 310)
        ctx.fillText('PRODUCT OF TUSCANY', 256, 350)

        // Gold Seal Badge
        ctx.beginPath()
        ctx.arc(256, 420, 35, 0, Math.PI * 2)
        ctx.fillStyle = '#c9a037'
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 18px monospace'
        ctx.fillText('100%', 256, 426)
      }
      return new THREE.CanvasTexture(canvas)
    }

    // 3. Milk Carton Printed Texture
    const createCartonTexture = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 512, 512)

        // Blue header band
        ctx.fillStyle = '#1e3a8a'
        ctx.fillRect(0, 0, 512, 160)

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 44px sans-serif'
        ctx.fillText('PURE ORGANIC', 30, 90)
        ctx.font = '28px sans-serif'
        ctx.fillText('WHOLE MILK', 30, 130)

        ctx.fillStyle = '#1e293b'
        ctx.font = 'bold 32px sans-serif'
        ctx.fillText('PASTEURIZED', 30, 240)
        ctx.font = '22px sans-serif'
        ctx.fillText('Grade A • 1 Gallon (3.78L)', 30, 280)

        // Green Grass graphic
        ctx.fillStyle = '#16a34a'
        ctx.fillRect(0, 400, 512, 112)
      }
      return new THREE.CanvasTexture(canvas)
    }

    // PHOTOREALISTIC TEXTURE LOADER & ASSET MAPS
    const textureLoader = new THREE.TextureLoader()

    // High-resolution Unsplash Studio Grocery Photography URLs
    const pomegranatesTex = textureLoader.load('https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80')
    const avocadoTex = textureLoader.load('https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80')
    const oliveOilTex = textureLoader.load('https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80')
    const honeyJarTex = textureLoader.load('https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=800&q=80')
    const organicMilkTex = textureLoader.load('https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80')
    const artisanCheeseTex = textureLoader.load('https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80')

    ;[pomegranatesTex, avocadoTex, oliveOilTex, honeyJarTex, organicMilkTex, artisanCheeseTex].forEach((tex) => {
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
        const tagTex = createEInkTexture('SKU-8821', 'ROYAL POM', '$6.99', 'FRESH 98%')
        const tagMat = new THREE.MeshStandardMaterial({ map: tagTex })
        const tagGeo = new THREE.BoxGeometry(0.7, 0.35, 0.03)
        const tagMesh = new THREE.Mesh(tagGeo, [
          eslFrameMat, eslFrameMat, eslFrameMat, eslFrameMat, tagMat, eslFrameMat,
        ])
        tagMesh.position.set(-0.8, sy - 0.18, 0.92)
        tagMesh.rotation.x = -0.15
        shelfGroup.add(tagMesh)

        // Second tag: Avocado SKU (Alert)
        const tagTex2 = createEInkTexture('SKU-1029', 'AVOCADO', '$2.49', 'EXP: 2 DAYS', true)
        const tagMat2 = new THREE.MeshStandardMaterial({ map: tagTex2 })
        const tagMesh2 = new THREE.Mesh(tagGeo, [
          eslFrameMat, eslFrameMat, eslFrameMat, eslFrameMat, tagMat2, eslFrameMat,
        ])
        tagMesh2.position.set(0.8, sy - 0.18, 0.92)
        tagMesh2.rotation.x = -0.15
        shelfGroup.add(tagMesh2)
      } else if (tierIdx === 2) {
        // Top shelf tag: Olive oil
        const tagTex = createEInkTexture('SKU-4910', 'OLIVE OIL', '$34.50', 'OPTIMAL')
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

    // --- TOP SHELF (sy = 1.15): Extra Virgin Olive Oil & Artisanal Honey ---
    const topY = 1.15
    const oliveOilDisplay = createPhotorealisticProductDisplay(oliveOilTex, -0.9, topY, 0.1, 1.1, 0.85, 0.1, Math.PI * 0.04)
    itemsGroup.add(oliveOilDisplay)

    const honeyDisplay = createPhotorealisticProductDisplay(honeyJarTex, 0.9, topY, 0.1, 1.1, 0.85, 0.1, -Math.PI * 0.04)
    itemsGroup.add(honeyDisplay)

    // --- MIDDLE SHELF (sy = 0): Fresh Pomegranates & Hass Avocados ---
    const midY = 0
    const pomDisplay = createPhotorealisticProductDisplay(pomegranatesTex, -0.9, midY, 0.1, 1.25, 0.9, 0.1, Math.PI * 0.03)
    itemsGroup.add(pomDisplay)

    const avoDisplay = createPhotorealisticProductDisplay(avocadoTex, 0.9, midY, 0.1, 1.25, 0.9, 0.1, -Math.PI * 0.03)
    itemsGroup.add(avoDisplay)

    // --- BOTTOM SHELF (sy = -1.15): Organic Milk & Gourmet Artisan Cheese ---
    const botY = -1.15
    const milkDisplay = createPhotorealisticProductDisplay(organicMilkTex, -0.9, botY, 0.1, 1.1, 0.85, 0.1, Math.PI * 0.05)
    itemsGroup.add(milkDisplay)

    const cheeseDisplay = createPhotorealisticProductDisplay(artisanCheeseTex, 0.9, botY, 0.1, 1.1, 0.85, 0.1, -Math.PI * 0.05)
    itemsGroup.add(cheeseDisplay)

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
      sCtx.fillText('PROBE #07', 20, 60)
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

    // 3D Telemetry Bounding Boxes
    const create3DBoundingBox = (x: number, y: number, z: number, w: number, h: number, d: number, colorHex: number) => {
      const bGeo = new THREE.BoxGeometry(w, h, d)
      const wire = new THREE.WireframeGeometry(bGeo)
      const mat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 })
      const lineSegs = new THREE.LineSegments(wire, mat)
      lineSegs.position.set(x, y, z)
      return lineSegs
    }

    const bbox1 = create3DBoundingBox(-0.8, midY + 0.32, 0.1, 0.9, 0.65, 0.9, 0xedc155)
    const bbox2 = create3DBoundingBox(0.8, midY + 0.32, 0.1, 0.9, 0.65, 0.9, 0x10b981)
    telemetryGroup.add(bbox1)
    telemetryGroup.add(bbox2)

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

      // Pulse bounding boxes subtly
      const scale = 1 + Math.sin(t * 3) * 0.02
      bbox1.scale.set(scale, scale, scale)
      bbox2.scale.set(scale, scale, scale)

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
