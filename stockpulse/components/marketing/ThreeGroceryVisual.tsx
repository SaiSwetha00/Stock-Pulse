'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
// Ships inside the installed `three` package (three/examples/jsm) — not a new
// dependency, not a download. It builds a small procedural room whose walls
// and lights become the scene's reflections.
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

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
    // 1.5, not 2. A retina phone at DPR 3 was rendering four times the pixels
    // of DPR 1.5 for a decoration, and this scene now carries a transmission
    // pass that re-renders everything — so pixel count is multiplied twice
    // over. At this size the difference is invisible; the frame cost is not.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.VSMShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    /**
     * THE ENVIRONMENT MAP — the single change that stops this looking like
     * plastic.
     *
     * Physically-based materials are lit by their surroundings, not just by
     * lamps. Until now `scene.environment` was null, and that one omission is
     * what every "toy" complaint traced back to:
     *
     *   transmission 0.92 had nothing behind it to refract, so glass rendered
     *     as a flat tinted solid;
     *   metalness 0.95 had nothing to reflect, so brass caps rendered as dark
     *     grey plastic;
     *   roughness barely mattered, because under direct light alone a rough
     *     and a smooth surface return nearly the same thing.
     *
     * RoomEnvironment is a small procedural room — a few emissive planes and
     * boxes — rendered once into a PMREM cubemap. Generated in memory at
     * startup: no HDR file, no texture download, no dependency. One render at
     * mount, then the target is reused every frame, so the per-frame cost is a
     * texture lookup rather than a scene render.
     */
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    const roomEnv = new RoomEnvironment()
    const envRT = pmrem.fromScene(roomEnv, 0.04)
    scene.environment = envRT.texture
    pmrem.dispose()

    // The environment adds real light, so the exposure tuned without one now
    // blows out.
    renderer.toneMappingExposure = 0.85

    /**
     * THREE-POINT RIG: key, fill, rim.
     *
     * The old rig was an ambient at 0.8 plus a spotlight and two coloured
     * point lights. Ambient that strong is why everything read as plastic —
     * it fills every crevice equally, so nothing has a dark side, and an
     * object with no dark side has no volume. The ambient is now a fraction of
     * that and the shape comes from direction instead.
     *
     * The rim is the one people forget. Against a near-black page a dark
     * product silhouette dissolves into the background; a light behind and
     * above puts a bright edge on the top of every bottle and crate, and that
     * edge is what separates them from the void.
     */
    const ambientLight = new THREE.AmbientLight(0xfff1dd, 0.22)
    scene.add(ambientLight)

    // KEY — warm, high and to the right, and the only caster. One shadow
    // source keeps contact shadows readable; two would cross and mush.
    const keyLight = new THREE.SpotLight(0xfff2d6, 90)
    keyLight.position.set(3.4, 6.4, 5.2)
    keyLight.angle = Math.PI / 5
    keyLight.penumbra = 0.85
    keyLight.decay = 1.5
    keyLight.distance = 22
    keyLight.castShadow = true
    // 1024. 2048 was measured at roughly 3.5x the frame cost of the previous
    // scene on software rendering; the shadow map was a large part of it and
    // VSM at radius 5 is soft enough that the extra resolution never showed.
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    keyLight.shadow.camera.near = 1
    keyLight.shadow.camera.far = 20
    // VSM blurs by radius, which is what turns a hard edge into a contact
    // shadow that tightens where an object meets the deck and softens as it
    // travels away.
    keyLight.shadow.radius = 5
    keyLight.shadow.blurSamples = 8
    keyLight.shadow.bias = -0.0006
    scene.add(keyLight)

    // FILL — cool, opposite the key, dim and shadowless. Lifts the dark side
    // just enough to keep it from going to pure black.
    const fillLight = new THREE.DirectionalLight(0xbcd4e6, 0.55)
    fillLight.position.set(-5, 1.6, 3.4)
    scene.add(fillLight)

    // RIM — behind and above, warm gold, so the top edges catch.
    const rimLight = new THREE.DirectionalLight(0xffd79a, 2.6)
    rimLight.position.set(-1.6, 4.2, -5.5)
    scene.add(rimLight)

    // A very low bounce from below, standing in for light off the shop floor.
    const bounce = new THREE.HemisphereLight(0xffe9c8, 0x120d08, 0.35)
    scene.add(bounce)

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
      envMapIntensity: 1.5,
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
     * A STOCKED SHELF, not a display of one-of-each.
     *
     * Two things were making this read as toys, and geometry was neither of
     * them. The first was quantity: a single lonely bottle beside a single
     * lonely jar is a product photograph, not stock. A real shelf holds
     * groups — a tray of eggs, a crate packed above its rim, a row of the same
     * bottle with a second row behind it. The second was material: every
     * surface was the same mid-roughness standard material under a strong
     * ambient, so glass, cardboard and tomato all returned light identically.
     *
     * MATERIALS, and what each one buys:
     *
     *   glassBottleMat  MeshPhysical, transmission 0.92, ior 1.5, thickness,
     *                   clearcoat 1 / roughness 0.04. Real refraction plus a
     *                   sharp specular streak — the streak is what says glass.
     *   glassJarMat     MeshPhysical, transmission 0.78, thicker and rougher
     *                   than the bottle so it reads as a heavier preserve jar
     *                   with something in it.
     *   capMat          MeshStandard, metalness 0.95, roughness 0.25 — opaque
     *                   brass against the transmissive body. The CONTRAST is
     *                   the point; a glass cap on a glass jar reads as one
     *                   lump.
     *   produceMat      MeshPhysical, roughness 0.78, clearcoat 0.25 with high
     *                   clearcoatRoughness. Matte with the faintest waxy
     *                   sheen, which is what fruit skin does.
     *   leafMat         MeshStandard, roughness 0.92, flat — leaves are the
     *                   one produce surface with no sheen at all.
     *   cardboardMat    MeshStandard, roughness 0.96, metalness 0. Nothing
     *                   reflective; cardboard is the flattest thing on the
     *                   shelf and it is what makes the glass look like glass.
     *   sackMat         as cardboard but lighter, roughness 0.98.
     *   eggMat          MeshPhysical, roughness 0.55, clearcoat 0.35 — a
     *                   chalky shell with a slight sheen.
     *
     * PERFORMANCE: every repeated item is a single InstancedMesh, so a tray of
     * twelve eggs is one draw call, not twelve. Per-instance hue and scale
     * jitter goes through instanceColor and the instance matrix, so the
     * variation costs nothing extra.
     */
    /**
     * Procedural surface noise: value noise over a hashed lattice, drawn to a
     * canvas at runtime.
     *
     * As a roughnessMap it makes a surface unevenly matte — which is the
     * difference between "matte" and "moulded plastic". A real tomato is
     * glossier on the shoulder than in the dimple, and a single uniform
     * roughness value cannot say that. As a bumpMap on cardboard it gives
     * tooth.
     *
     * 0 KB of assets: drawn, not loaded.
     */
    function noiseTexture(size: number, scale: number, contrast: number, seedBase: number) {
      const c = document.createElement('canvas')
      c.width = size
      c.height = size
      const g = c.getContext('2d')
      if (g) {
        const img = g.createImageData(size, size)
        const hash = (x: number, y: number) => {
          const n = Math.sin(x * 127.1 + y * 311.7 + seedBase) * 43758.5453
          return n - Math.floor(n)
        }
        const smooth = (x: number, y: number) => {
          const xi = Math.floor(x)
          const yi = Math.floor(y)
          const xf = x - xi
          const yf = y - yi
          const u = xf * xf * (3 - 2 * xf)
          const v = yf * yf * (3 - 2 * yf)
          const a = hash(xi, yi)
          const b = hash(xi + 1, yi)
          const cc = hash(xi, yi + 1)
          const d = hash(xi + 1, yi + 1)
          return a * (1 - u) * (1 - v) + b * u * (1 - v) + cc * (1 - u) * v + d * u * v
        }
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            let n = 0
            let amp = 1
            let f = scale
            for (let o = 0; o < 3; o++) {
              n += smooth((x / size) * f, (y / size) * f) * amp
              amp *= 0.5
              f *= 2
            }
            n = n / 1.75
            const v = Math.max(0, Math.min(255, 128 + (n - 0.5) * 255 * contrast))
            const i = (y * size + x) * 4
            img.data[i] = v
            img.data[i + 1] = v
            img.data[i + 2] = v
            img.data[i + 3] = 255
          }
        }
        g.putImageData(img, 0, 0)
      }
      const t = new THREE.CanvasTexture(c)
      t.wrapS = THREE.RepeatWrapping
      t.wrapT = THREE.RepeatWrapping
      return t
    }

    const produceNoise = noiseTexture(128, 6, 0.9, 11.3)
    const cardboardNoise = noiseTexture(128, 14, 1.1, 47.9)
    const clothNoise = noiseTexture(128, 22, 0.8, 91.7)

    const phys = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(o)
    const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o)

    const glassBottleMat = phys({
      color: 0xb8860b,
      transmission: 0.92,
      thickness: 0.5,
      ior: 1.5,
      roughness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      transparent: true,
      metalness: 0,
      envMapIntensity: 1.4,
    })
    const glassJarMat = phys({
      color: 0x7a1f14,
      transmission: 0.78,
      thickness: 0.75,
      ior: 1.48,
      roughness: 0.12,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      transparent: true,
      metalness: 0,
      envMapIntensity: 1.2,
    })
    const capMat = std({ color: 0xe0b343, metalness: 0.95, roughness: 0.25, envMapIntensity: 1.6 })
    const labelMat = std({ color: 0xf4e8d4, roughness: 0.75, metalness: 0 })
    // roughnessMap is what makes it fruit rather than a painted ball: the
    // shoulder catches a highlight, the dimple does not.
    const produceMat = phys({
      color: 0xffffff,
      roughness: 0.72,
      roughnessMap: produceNoise,
      clearcoat: 0.3,
      clearcoatRoughness: 0.65,
      metalness: 0,
      envMapIntensity: 0.9,
    })
    const leafMat = std({ color: 0x5f6b21, roughness: 0.9, roughnessMap: produceNoise, metalness: 0, envMapIntensity: 0.6 })
    const cardboardMat = std({
      color: 0x4a3524,
      roughness: 0.96,
      roughnessMap: cardboardNoise,
      bumpMap: cardboardNoise,
      bumpScale: 0.9,
      metalness: 0,
      envMapIntensity: 0.35,
    })
    const crateSlatMat = std({
      color: 0x5c4530,
      roughness: 0.95,
      roughnessMap: cardboardNoise,
      bumpMap: cardboardNoise,
      bumpScale: 0.8,
      metalness: 0,
      envMapIntensity: 0.35,
    })
    const sackMat = std({
      color: 0xd6c3a3,
      roughness: 0.98,
      roughnessMap: clothNoise,
      bumpMap: clothNoise,
      bumpScale: 1.2,
      metalness: 0,
      envMapIntensity: 0.3,
    })
    const cartonMat = std({
      color: 0xf4e8d4,
      roughness: 0.82,
      roughnessMap: cardboardNoise,
      metalness: 0,
      envMapIntensity: 0.5,
    })
    const cartonCapMat = std({ color: 0x8f2a1c, roughness: 0.7, metalness: 0 })
    const eggMat = phys({
      color: 0xf0e2c8,
      roughness: 0.6,
      roughnessMap: produceNoise,
      clearcoat: 0.3,
      clearcoatRoughness: 0.55,
      metalness: 0,
      envMapIntensity: 0.8,
    })

    // Deterministic jitter. Math.random would make every reload a different
    // shelf, so a screenshot could never be compared against another one.
    let seed = 0x51ed
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const jitter = (amount: number) => (rnd() - 0.5) * 2 * amount

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

    /**
     * One draw call for N copies, each with its own position, tilt, scale and
     * a slightly shifted hue.
     *
     * `hueSpread` is small on purpose. Identical clones read as fake, but so
     * does a crate of rainbow tomatoes — the variation has to sit right at the
     * edge of noticeable.
     */
    type Placement = { pos: [number, number, number]; rot?: [number, number, number]; scale?: number }
    function instanced(
      geo: THREE.BufferGeometry,
      material: THREE.Material,
      base: THREE.Color,
      placements: Placement[],
      hueSpread = 0.02,
      valueSpread = 0.12,
    ) {
      const mesh = new THREE.InstancedMesh(geo, material, placements.length)
      const m = new THREE.Matrix4()
      const q = new THREE.Quaternion()
      const e = new THREE.Euler()
      const v = new THREE.Vector3()
      const sc = new THREE.Vector3()
      const hsl = { h: 0, s: 0, l: 0 }
      base.getHSL(hsl)
      placements.forEach((p, i) => {
        const sv = (p.scale ?? 1) * (1 + jitter(0.09))
        v.set(p.pos[0], p.pos[1], p.pos[2])
        e.set(p.rot ? p.rot[0] : jitter(0.5), p.rot ? p.rot[1] : jitter(Math.PI), p.rot ? p.rot[2] : jitter(0.5))
        q.setFromEuler(e)
        sc.set(sv, sv, sv)
        m.compose(v, q, sc)
        mesh.setMatrixAt(i, m)
        const c = new THREE.Color().setHSL(
          (hsl.h + jitter(hueSpread) + 1) % 1,
          Math.min(1, Math.max(0, hsl.s + jitter(0.08))),
          Math.min(1, Math.max(0.02, hsl.l + jitter(valueSpread))),
        )
        mesh.setColorAt(i, c)
      })
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.castShadow = true
      mesh.receiveShadow = true
      return mesh
    }

    /**
     * Contact shadow: a small dark disc laid on the deck under a cluster.
     *
     * The shadow map alone leaves a gap under wide groups at this camera
     * angle, and a gap under an object is exactly what makes it look like it
     * is hovering. The texture is drawn to a canvas at runtime — procedural,
     * no file, no request.
     */
    const contactTex = (() => {
      const c = document.createElement('canvas')
      c.width = 128
      c.height = 128
      const g = c.getContext('2d')
      if (g) {
        const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62)
        grad.addColorStop(0, 'rgba(0,0,0,0.62)')
        grad.addColorStop(0.55, 'rgba(0,0,0,0.28)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = grad
        g.fillRect(0, 0, 128, 128)
      }
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      return t
    })()
    const contactMat = new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
    })
    const contactGeo = new THREE.PlaneGeometry(1, 1)
    function contact(x: number, sy: number, z: number, w: number, d: number) {
      const m = new THREE.Mesh(contactGeo, contactMat)
      m.rotation.x = -Math.PI / 2
      m.scale.set(w, d, 1)
      m.position.set(x, sy + 0.035, z)
      itemsGroup.add(m)
    }

    // ---- shared geometry, built once and reused by every instance ----
    const sphereGeo = new THREE.SphereGeometry(1, 14, 10)
    const eggGeo = new THREE.SphereGeometry(0.05, 12, 9)
    const bottleBodyGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.3, 18)
    const bottleNeckGeo = new THREE.CylinderGeometry(0.032, 0.06, 0.16, 14)
    const bottleCapGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.05, 14)
    const bottleLabelGeo = new THREE.CylinderGeometry(0.098, 0.098, 0.11, 18)
    const jarBodyGeo = new THREE.CylinderGeometry(0.105, 0.11, 0.19, 18)
    const jarLidGeo = new THREE.CylinderGeometry(0.088, 0.088, 0.055, 18)
    const carrotGeo = new THREE.ConeGeometry(0.032, 0.2, 10)
    const bladeGeo = new THREE.BoxGeometry(0.035, 0.17, 0.008)
    const bananaGeo = new THREE.TorusGeometry(0.075, 0.021, 8, 12, Math.PI * 0.85)

    /** An open crate: base plus four slatted walls. */
    function makeCrate(w: number, d: number, h: number) {
      const g = new THREE.Group()
      const t = 0.022
      const base = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), cardboardMat)
      base.position.y = t / 2
      g.add(base)
      const wall = (ww: number, dd: number, x: number, z: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(ww, h, dd), crateSlatMat)
        m.position.set(x, h / 2, z)
        g.add(m)
      }
      wall(w, t, 0, d / 2 - t / 2)
      wall(w, t, 0, -d / 2 + t / 2)
      wall(t, d, w / 2 - t / 2, 0)
      wall(t, d, -w / 2 + t / 2, 0)
      return g
    }

    /** Fill a crate's footprint with piled spheres — two layers, the upper one
     *  sitting in the gaps of the lower, so it reads as a heap rather than a
     *  grid. Placements are in the crate's local space. */
    function pile(w: number, d: number, rimY: number, r: number, cols: number, rows: number): Placement[] {
      const out: Placement[] = []
      const sx = (w - r * 2.2) / Math.max(1, cols - 1)
      const sz = (d - r * 2.2) / Math.max(1, rows - 1)
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          out.push({
            pos: [-w / 2 + r * 1.1 + i * sx + jitter(0.012), rimY - r * 0.25, -d / 2 + r * 1.1 + j * sz + jitter(0.012)],
            scale: r,
          })
        }
      }
      // Upper layer, offset into the hollows, fewer of them.
      for (let i = 0; i < cols - 1; i++) {
        for (let j = 0; j < rows - 1; j++) {
          if ((i + j) % 2) continue
          out.push({
            pos: [
              -w / 2 + r * 1.1 + (i + 0.5) * sx + jitter(0.01),
              rimY + r * 0.95,
              -d / 2 + r * 1.1 + (j + 0.5) * sz + jitter(0.01),
            ],
            scale: r * 0.94,
          })
        }
      }
      return out
    }

    const topY = 1.15
    const midY = 0
    const botY = -1.15
    const deck = 0.03 // half the deck thickness: the surface products stand on

    // =====================================================================
    // TOP SHELF — a row of bottles with a second row behind, and jars
    // =====================================================================
    const bottlePlacements: Placement[] = []
    const bottleRows = [
      { z: 0.16, n: 4, x0: -1.62, gap: 0.235 },
      { z: -0.12, n: 3, x0: -1.5, gap: 0.235 },
    ]
    bottleRows.forEach((row) => {
      for (let i = 0; i < row.n; i++) {
        bottlePlacements.push({
          pos: [row.x0 + i * row.gap + jitter(0.012), 0, row.z + jitter(0.02)],
          rot: [0, jitter(0.4), 0],
          scale: 1,
        })
      }
    })
    // Each bottle is four instanced parts sharing one transform list: four
    // draw calls for seven bottles rather than twenty-eight meshes.
    const bottleParts: Array<[THREE.BufferGeometry, THREE.Material, number, number]> = [
      [bottleBodyGeo, glassBottleMat, 0.15, 0xb8860b],
      [bottleLabelGeo, labelMat, 0.13, 0xf4e8d4],
      [bottleNeckGeo, glassBottleMat, 0.38, 0xb8860b],
      [bottleCapGeo, capMat, 0.49, 0xe0b343],
    ]
    bottleParts.forEach(([geo, material, yOff, col]) => {
      const pl: Placement[] = bottlePlacements.map((p) => ({
        pos: [p.pos[0], topY + deck + yOff, p.pos[2]] as [number, number, number],
        rot: p.rot,
        scale: 1,
      }))
      itemsGroup.add(instanced(geo, material, new THREE.Color(col), pl, 0.012, 0.06))
    })
    contact(-1.28, topY, 0.02, 1.5, 0.62)

    // Jars, lined up in threes with two more behind.
    const jarPlacements: Placement[] = [0, 1, 2].map((i) => ({
      pos: [0.62 + i * 0.26 + jitter(0.01), 0, 0.1 + jitter(0.03)] as [number, number, number],
      rot: [0, jitter(0.5), 0] as [number, number, number],
    }))
    itemsGroup.add(
      instanced(
        jarBodyGeo,
        glassJarMat,
        new THREE.Color(0x7a1f14),
        jarPlacements.map((p) => ({ ...p, pos: [p.pos[0], topY + deck + 0.095, p.pos[2]] as [number, number, number] })),
        0.015,
        0.07,
      ),
    )
    itemsGroup.add(
      instanced(
        jarLidGeo,
        capMat,
        new THREE.Color(0xe0b343),
        jarPlacements.map((p) => ({ ...p, pos: [p.pos[0], topY + deck + 0.216, p.pos[2]] as [number, number, number] })),
        0.01,
        0.05,
      ),
    )
    const jarBack: Placement[] = [0, 1].map((i) => ({
      pos: [0.78 + i * 0.28, topY + deck + 0.095, -0.16 + jitter(0.02)] as [number, number, number],
      rot: [0, jitter(0.6), 0] as [number, number, number],
      scale: 0.92,
    }))
    itemsGroup.add(instanced(jarBodyGeo, glassJarMat, new THREE.Color(0x7a1f14), jarBack, 0.015, 0.07))
    itemsGroup.add(
      instanced(
        jarLidGeo,
        capMat,
        new THREE.Color(0xe0b343),
        jarBack.map((p) => ({ ...p, pos: [p.pos[0], topY + deck + 0.205, p.pos[2]] as [number, number, number] })),
        0.01,
        0.05,
      ),
    )
    contact(0.95, topY, 0.0, 1.15, 0.66)

    // =====================================================================
    // MIDDLE SHELF — vegetable and fruit crates, packed above the rim
    // =====================================================================
    const vegW = 0.78
    const vegD = 0.5
    const vegH = 0.17

    const tomatoCrate = makeCrate(vegW, vegD, vegH)
    tomatoCrate.position.set(-1.18, midY + deck, 0.02)
    tomatoCrate.rotation.y = 0.06
    itemsGroup.add(shade(tomatoCrate))
    const tomatoes = instanced(sphereGeo, produceMat, new THREE.Color(0x9e2b1b), pile(vegW, vegD, vegH, 0.072, 5, 3), 0.014, 0.1)
    tomatoes.position.copy(tomatoCrate.position)
    tomatoes.rotation.y = tomatoCrate.rotation.y
    itemsGroup.add(tomatoes)

    const onionCrate = makeCrate(vegW, vegD, vegH)
    onionCrate.position.set(-0.3, midY + deck, -0.06)
    onionCrate.rotation.y = -0.05
    itemsGroup.add(shade(onionCrate))
    const onions = instanced(sphereGeo, produceMat, new THREE.Color(0xc9992f), pile(vegW, vegD, vegH, 0.078, 4, 3), 0.02, 0.12)
    onions.position.copy(onionCrate.position)
    onions.rotation.y = onionCrate.rotation.y
    itemsGroup.add(onions)

    // Leafy greens: a bundle of blades leaning out of a shallow crate.
    const greensCrate = makeCrate(0.6, 0.44, 0.13)
    greensCrate.position.set(0.52, midY + deck, 0.02)
    greensCrate.rotation.y = 0.04
    itemsGroup.add(shade(greensCrate))
    const bladePl: Placement[] = []
    for (let i = 0; i < 16; i++) {
      bladePl.push({
        pos: [0.52 + jitter(0.2), midY + deck + 0.19 + jitter(0.03), 0.02 + jitter(0.14)],
        rot: [jitter(0.5), jitter(Math.PI), jitter(0.6)],
        scale: 1,
      })
    }
    itemsGroup.add(instanced(bladeGeo, leafMat, new THREE.Color(0x5f6b21), bladePl, 0.03, 0.14))
    const carrotPl: Placement[] = [0, 1, 2, 3].map((i) => ({
      pos: [0.34 + i * 0.11 + jitter(0.02), midY + deck + 0.155, 0.2 + jitter(0.02)] as [number, number, number],
      rot: [jitter(0.2), jitter(0.6), Math.PI / 2 + jitter(0.25)] as [number, number, number],
    }))
    itemsGroup.add(instanced(carrotGeo, produceMat, new THREE.Color(0xd07a1d), carrotPl, 0.012, 0.08))

    // Fruit: apples piled in a crate, oranges beside them, bananas on top.
    const fruitCrate = makeCrate(0.72, 0.48, 0.16)
    fruitCrate.position.set(1.3, midY + deck, 0.0)
    fruitCrate.rotation.y = -0.07
    itemsGroup.add(shade(fruitCrate))
    const apples = instanced(sphereGeo, produceMat, new THREE.Color(0xa8281c), pile(0.72, 0.48, 0.16, 0.07, 4, 3), 0.02, 0.11)
    apples.position.copy(fruitCrate.position)
    apples.rotation.y = fruitCrate.rotation.y
    itemsGroup.add(apples)
    const orangePl: Placement[] = [0, 1, 2, 3, 4].map((i) => ({
      pos: [
        0.98 + (i % 3) * 0.13 + jitter(0.02),
        midY + deck + 0.07 + Math.floor(i / 3) * 0.11,
        -0.28 + jitter(0.05),
      ] as [number, number, number],
      scale: 0.066,
    }))
    itemsGroup.add(instanced(sphereGeo, produceMat, new THREE.Color(0xd98515), orangePl, 0.012, 0.08))
    const bananaPl: Placement[] = [0, 1, 2, 3].map((i) => ({
      pos: [1.26 + jitter(0.07), midY + deck + 0.3 + i * 0.016, 0.02 + jitter(0.06)] as [number, number, number],
      rot: [Math.PI / 2 + jitter(0.2), i * 0.34 + jitter(0.15), jitter(0.3)] as [number, number, number],
    }))
    itemsGroup.add(instanced(bananaGeo, produceMat, new THREE.Color(0xd9b524), bananaPl, 0.012, 0.07))

    contact(-1.18, midY, 0.02, 0.95, 0.62)
    contact(-0.3, midY, -0.06, 0.95, 0.62)
    contact(0.52, midY, 0.02, 0.78, 0.56)
    contact(1.3, midY, 0.0, 0.9, 0.6)

    // =====================================================================
    // BOTTOM SHELF — an egg tray, stacked cartons, sacks
    // =====================================================================
    const trayW = 0.62
    const trayD = 0.3
    const tray = new THREE.Group()
    const trayBase = new THREE.Mesh(new THREE.BoxGeometry(trayW, 0.035, trayD), cardboardMat)
    trayBase.position.y = 0.017
    tray.add(trayBase)
    const trayLip = (w: number, d: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.055, d), cardboardMat)
      m.position.set(x, 0.028, z)
      tray.add(m)
    }
    trayLip(trayW, 0.02, 0, trayD / 2 - 0.01)
    trayLip(trayW, 0.02, 0, -trayD / 2 + 0.01)
    trayLip(0.02, trayD, trayW / 2 - 0.01, 0)
    trayLip(0.02, trayD, -trayW / 2 + 0.01, 0)
    tray.position.set(-1.24, botY + deck, 0.06)
    tray.rotation.y = 0.05
    itemsGroup.add(shade(tray))

    // Eggs are ellipsoids, so the squash lives in the geometry — one squashed
    // sphere, twelve copies, one draw call.
    eggGeo.scale(1, 1.32, 1)
    const eggPl: Placement[] = []
    for (let c = 0; c < 6; c++) {
      for (let r = 0; r < 2; r++) {
        eggPl.push({
          pos: [-1.24 - trayW / 2 + 0.06 + c * 0.1, botY + deck + 0.062, 0.06 - trayD / 2 + 0.075 + r * 0.15],
          rot: [Math.PI / 2 + jitter(0.12), jitter(0.4), jitter(0.12)],
          scale: 1,
        })
      }
    }
    itemsGroup.add(instanced(eggGeo, eggMat, new THREE.Color(0xf0e2c8), eggPl, 0.006, 0.05))
    contact(-1.24, botY, 0.06, 0.78, 0.42)

    // Cartons: three lined up, one turned.
    function makeCarton() {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.3, 0.19), cartonMat)
      body.position.y = 0.15
      const roofL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.14, 0.02), cartonCapMat)
      roofL.position.set(0, 0.36, 0.05)
      roofL.rotation.x = -Math.PI * 0.2
      const roofR = roofL.clone()
      roofR.position.z = -0.05
      roofR.rotation.x = Math.PI * 0.2
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.03, 0.03), cartonCapMat)
      ridge.position.y = 0.42
      g.add(body, roofL, roofR, ridge)
      return shade(g)
    }
    const cartonAt: Array<[number, number, number]> = [
      [-0.36, 0.08, 0.05],
      [-0.14, 0.06, -0.1],
      [0.06, 0.1, 0.06],
    ]
    cartonAt.forEach(([x, z, ry]) => {
      const c = makeCarton()
      c.position.set(x, botY + deck, z)
      c.rotation.y = ry
      c.scale.setScalar(1 + jitter(0.05))
      itemsGroup.add(c)
    })
    contact(-0.14, botY, 0.0, 0.78, 0.5)

    // Sacks: three, one leaning.
    function makeSack(h: number) {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, h, 9), sackMat)
      body.position.y = h / 2
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 0.07, 9), sackMat)
      neck.position.y = h + 0.03
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.014, 8, 14), capMat)
      tie.position.y = h + 0.06
      tie.rotation.x = Math.PI / 2
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.16, 0.07, 9), cardboardMat)
      band.position.y = h * 0.42
      g.add(body, neck, tie, band)
      return shade(g)
    }
    const sackA = makeSack(0.32)
    sackA.position.set(0.72, botY + deck, 0.04)
    sackA.rotation.y = 0.3
    itemsGroup.add(sackA)
    const sackB = makeSack(0.27)
    sackB.position.set(1.02, botY + deck, -0.08)
    sackB.rotation.set(0, -0.5, 0.09)
    itemsGroup.add(sackB)
    const sackC = makeSack(0.29)
    sackC.position.set(1.3, botY + deck, 0.08)
    sackC.rotation.y = 0.8
    itemsGroup.add(sackC)
    contact(1.0, botY, 0.0, 1.0, 0.5)

    // How much is actually on the shelf, reported in dev so the draw-call cost
    // is a measured number rather than a guess.
    if (process.env.NODE_ENV !== 'production') {
      let draws = 0
      let objects = 0
      itemsGroup.traverse((n) => {
        const im = n as THREE.InstancedMesh
        if (im.isInstancedMesh) {
          draws += 1
          objects += im.count
        } else if ((n as THREE.Mesh).isMesh) {
          draws += 1
          objects += 1
        }
      })
      console.info(`[hero shelf] ${draws} draw calls, ${objects} objects`)
    }

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
