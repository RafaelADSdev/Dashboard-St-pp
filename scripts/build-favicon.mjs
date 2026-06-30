import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const appDir = resolve(root, 'src/app')

mkdirSync(appDir, { recursive: true })

const source = resolve(root, 'public/stupp-logo.png')
const crop = { left: 8, top: 8, width: 210, height: 308 }

async function buildIcon(size, output) {
  await sharp(source)
    .extract(crop)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(output)
  console.log(`OK ${output}`)
}

await buildIcon(32, resolve(appDir, 'icon.png'))
await buildIcon(180, resolve(appDir, 'apple-icon.png'))
await buildIcon(192, resolve(root, 'public/icon-192.png'))
await buildIcon(32, resolve(root, 'public/favicon.png'))

console.log('OK public/favicon.png')
