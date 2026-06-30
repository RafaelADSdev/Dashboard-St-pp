import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

async function removeLightBackground(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const pixels = Buffer.from(data)

  for (let i = 0; i < pixels.length; i += channels) {
    const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
    if (avg >= 235) pixels[i + 3] = 0
  }

  await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toFile(outputPath)
}

async function removeLightBackgroundKeepBrightText(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const pixels = Buffer.from(data)

  for (let i = 0; i < pixels.length; i += channels) {
    const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2])
    if (min < 249) pixels[i + 3] = 0
  }

  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath)
}

await removeLightBackground(resolve(root, 'public/hubon-logo.jpeg'), resolve(root, 'public/hubon-logo.png'))
await removeLightBackgroundKeepBrightText(
  resolve(root, 'HubOn Branco.jpeg'),
  resolve(root, 'public/hubon-logo-white.png')
)

console.log('OK public/hubon-logo.png')
console.log('OK public/hubon-logo-white.png')
