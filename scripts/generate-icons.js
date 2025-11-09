import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

async function generatePNGIcon(size, type = 'idle', outputPath) {
  const colors = {
    idle: '#007acc',
    success: '#28a745',
    error: '#dc3545'
  };

  const symbols = {
    idle: 'MT',
    success: '✓',
    error: '✗'
  };

  // 创建一个简单的背景图标
  const svgBuffer = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${colors[type]}" rx="8"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.35em"
            font-family="Arial, sans-serif" font-size="${Math.floor(size * 0.4)}"
            font-weight="bold" fill="white">${symbols[type]}</text>
    </svg>
  `)

  await sharp(svgBuffer)
    .png()
    .toFile(outputPath)
}

async function createIcons(distDir) {
  const iconsDir = path.join(distDir, 'icons')

  // 确保目录存在
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  // 创建不同尺寸的图标
  const sizes = [16, 32, 48, 128]
  const types = ['idle', 'success', 'error']

  for (const size of sizes) {
    for (const type of types) {
      const pngPath = path.join(iconsDir, `icon-${type}-${size}.png`)
      await generatePNGIcon(size, type, pngPath)
      console.log(`✅ Created: ${pngPath}`)
    }
  }
}

// 为 Chrome 和 Firefox 都创建图标
const browsers = ['chrome', 'firefox']

async function main() {
  for (const browser of browsers) {
    const distDir = path.join(process.cwd(), 'dist', browser)
    if (fs.existsSync(distDir)) {
      console.log(`\n🔄 Creating icons for ${browser}...`)
      await createIcons(distDir)
    }
  }
  console.log('\n🎉 All icons created successfully!')
}

main().catch(console.error)