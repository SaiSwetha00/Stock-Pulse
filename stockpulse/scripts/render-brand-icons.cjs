/**
 * Renders the raster app icons from the StockPulse mark (Icon A).
 *
 * The geometry here MUST match components/brand/StockPulseMark.tsx — that
 * component is the vector the app renders, these files are what a browser tab,
 * an iOS home screen and an Android launcher show. Re-run after any change to
 * the mark:  node scripts/render-brand-icons.cjs
 *
 * Writes: app/favicon.ico (16/32/48), app/apple-icon.png (180, full-bleed —
 * iOS rounds it and fills transparency with black), public/icons/icon-{192,512}
 * (rounded, on transparency) and public/icons/maskable-{192,512} (full-bleed,
 * symbol inside the safe zone because Android crops these to a circle).
 */
const sharp = require('sharp')
const fs = require('fs')

const defs = `<defs>
<linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4F6BFF"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.26"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>`

/** Icon A: three shelf rows, one unit moved off the top row. */
const symbol = `<g fill="#fff">
<rect x="7" y="8" width="11" height="4.6" rx="2.3"/>
<rect x="7" y="14.7" width="18" height="4.6" rx="2.3"/>
<rect x="7" y="21.4" width="14.5" height="4.6" rx="2.3"/>
<rect x="20.4" y="8" width="4.6" height="4.6" rx="2.3" fill-opacity="0.72"/>
</g>`

const rounded = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${defs}
<rect x="0" y="0" width="32" height="32" rx="8.5" fill="url(#f)"/>
<rect x="0" y="0" width="32" height="32" rx="8.5" fill="url(#s)"/>${symbol}</svg>`

const bleed = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${defs}
<rect width="32" height="32" fill="url(#f)"/><rect width="32" height="32" fill="url(#s)"/>
<g transform="translate(16 16) scale(${scale}) translate(-16 -16)">${symbol}</g></svg>`

const png = (svg, size) => sharp(Buffer.from(svg), { density: 1400 }).resize(size, size).png().toBuffer()

;(async () => {
  const files = {
    'public/icons/icon-192.png': await png(rounded(), 192),
    'public/icons/icon-512.png': await png(rounded(), 512),
    'public/icons/maskable-192.png': await png(bleed(0.68), 192),
    'public/icons/maskable-512.png': await png(bleed(0.68), 512),
    'app/apple-icon.png': await png(bleed(0.84), 180),
  }

  // favicon.ico: 16/32/48 PNGs in one container.
  const sizes = [16, 32, 48]
  const imgs = await Promise.all(sizes.map((s) => png(rounded(), s)))
  const header = Buffer.alloc(6 + 16 * sizes.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)
  let offset = header.length
  sizes.forEach((s, i) => {
    const e = 6 + i * 16
    header[e] = s
    header[e + 1] = s
    header.writeUInt16LE(1, e + 4)
    header.writeUInt16LE(32, e + 6)
    header.writeUInt32LE(imgs[i].length, e + 8)
    header.writeUInt32LE(offset, e + 12)
    offset += imgs[i].length
  })
  files['app/favicon.ico'] = Buffer.concat([header, ...imgs])

  for (const [f, buf] of Object.entries(files)) {
    fs.writeFileSync(f, buf)
    console.log(f, buf.length, 'bytes')
  }
})()
