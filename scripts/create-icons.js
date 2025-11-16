import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

// 创建简单的 SVG 图标内容
function createSVGIcon(size, type = 'idle') {
  // 新主题色红色背景
  const backgroundColor = '#cc0000';

  // 状态指示器的颜色和位置
  const statusConfig = {
    idle: { color: null, position: null },
    success: { color: '#28a745', position: { x: size * 0.8, y: size * 0.8, r: size * 0.1 } },
    error: { color: '#dc3545', position: { x: size * 0.8, y: size * 0.8, r: size * 0.1 } }
  };

  const status = statusConfig[type];

  // 根据尺寸调整字体大小，增大汉字"译"字体
  const fontSize = Math.max(size * 0.6, 10);

  // 创建完整的SVG内容，确保格式正确且兼容性好
  let svgContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  svgContent += `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">\n`;
  svgContent += `  <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="4"/>\n`;
  svgContent += `  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" fill="white" font-weight="bold">译</text>\n`;

  if (status.color) {
    svgContent += `  <circle cx="${status.position.x}" cy="${status.position.y}" r="${status.position.r}" fill="${status.color}" stroke="white" stroke-width="1"/>\n`;
  }

  svgContent += '</svg>';

  return svgContent;
}

// 创建图标目录和文件
async function createIcons(distDir) {
  const iconsDir = path.join(distDir, 'icons')

  // 确保目录存在
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  // 创建不同尺寸的图标
  const sizes = [16, 32, 48, 128]
  const types = ['idle', 'success', 'error']

  // 使用 Promise.all 并行处理所有图标
  const promises = []

  sizes.forEach(size => {
    types.forEach(type => {
      const svgContent = createSVGIcon(size, type)
      const svgPath = path.join(iconsDir, `icon-${type}-${size}.svg`)
      const pngPath = path.join(iconsDir, `icon-${type}-${size}.png`)

      // 保存 SVG 文件
      fs.writeFileSync(svgPath, svgContent)

      // 创建 PNG 转换的 promise
      const pngPromise = (async () => {
        try {
          await sharp(Buffer.from(svgContent))
            .png()
            .toFile(pngPath)
          console.log(`✅ Created PNG: ${path.basename(pngPath)}`)
        } catch (error) {
          console.error(`❌ Failed to create PNG: ${path.basename(pngPath)}`, error)
          // 如果转换失败，创建一个简单的PNG占位符
          const placeholderContent = `PNG placeholder for icon-${type}-${size}.png
This file should be replaced with an actual PNG icon.
For now, using SVG version: icon-${type}-${size}.svg`
          fs.writeFileSync(pngPath, placeholderContent)
        }
      })()

      promises.push(pngPromise)
    })
  })

  // 等待所有PNG转换完成
  await Promise.all(promises)

  console.log(`✅ Icons created in: ${iconsDir}`)
}

// 为指定浏览器创建图标
export async function createIconsForBrowser(browser) {
  const distDir = path.join(process.cwd(), 'dist', browser)
  if (fs.existsSync(distDir)) {
    await createIcons(distDir)
  }
}

// 为 Chrome 和 Firefox 都创建图标
async function main() {
  const browsers = ['chrome', 'firefox']

  for (const browser of browsers) {
    await createIconsForBrowser(browser)
  }
}

// 如果直接运行此文件，执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}