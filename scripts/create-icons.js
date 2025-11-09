import fs from 'fs'
import path from 'path'

// 创建简单的 SVG 图标内容
function createSVGIcon(size, text = 'MT') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#007acc" rx="4"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" font-size="${size * 0.4}" fill="white">${text}</text>
</svg>`
}

// 创建图标目录和文件
function createIcons(distDir) {
  const iconsDir = path.join(distDir, 'icons')

  // 确保目录存在
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  // 创建不同尺寸的图标
  const sizes = [16, 32, 48, 128]

  sizes.forEach(size => {
    const svgContent = createSVGIcon(size)
    const svgPath = path.join(iconsDir, `icon-${size}.svg`)
    const pngPath = path.join(iconsDir, `icon-${size}.png`)

    // 保存 SVG 文件
    fs.writeFileSync(svgPath, svgContent)

    // 创建对应的 PNG 文件（简单的占位文件）
    // 由于我们没有图像处理库，我们创建一个简单的文本文件作为占位
    // 在实际使用中，您可以使用工具将 SVG 转换为 PNG
    const placeholderContent = `PNG placeholder for icon-${size}.png
This file should be replaced with an actual PNG icon.
For now, using SVG version: icon-${size}.svg`

    fs.writeFileSync(pngPath, placeholderContent)
  })

  console.log(`✅ Icons created in: ${iconsDir}`)
}

// 为 Chrome 和 Firefox 都创建图标
const browsers = ['chrome', 'firefox']
browsers.forEach(browser => {
  const distDir = path.join(process.cwd(), 'dist', browser)
  if (fs.existsSync(distDir)) {
    createIcons(distDir)
  }
})