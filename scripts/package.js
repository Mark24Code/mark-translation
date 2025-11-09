import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// 获取版本信息
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
const version = packageJson.version
const name = packageJson.name

console.log(`🚀 Packaging ${name} v${version}...\n`)

// 创建打包函数
function packageExtension(browser) {
  const distDir = path.join(process.cwd(), 'dist', browser)
  const zipName = `${name}-${browser}-v${version}.zip`
  const zipPath = path.join(process.cwd(), 'dist', zipName)

  console.log(`📦 Packaging ${browser} extension...`)

  // 检查构建目录是否存在
  if (!fs.existsSync(distDir)) {
    console.error(`❌ Build directory not found for ${browser}: ${distDir}`)
    console.log(`💡 Please run 'npm run build:${browser}' first`)
    return false
  }

  try {
    // 创建 ZIP 文件
    execSync(`cd "${distDir}" && zip -r "../${zipName}" .`, { stdio: 'pipe' })

    // 检查文件大小
    const stats = fs.statSync(zipPath)
    const fileSize = (stats.size / 1024).toFixed(2)

    console.log(`✅ ${browser.toUpperCase()} extension packaged: ${zipName}`)
    console.log(`   📁 File size: ${fileSize} KB`)
    console.log(`   📍 Location: dist/${zipName}\n`)

    return true
  } catch (error) {
    console.error(`❌ Failed to package ${browser} extension:`, error.message)
    return false
  }
}

// 主打包函数
async function main() {
  // 获取命令行参数
  const targetBrowser = process.argv[2]
  const browsers = targetBrowser ? [targetBrowser] : ['chrome', 'firefox']
  const results = []

  console.log('🎯 Starting packaging process...\n')

  for (const browser of browsers) {
    const success = packageExtension(browser)
    results.push({ browser, success })
  }

  console.log('📊 Packaging Summary:')
  console.log('='.repeat(40))

  results.forEach(({ browser, success }) => {
    const status = success ? '✅ SUCCESS' : '❌ FAILED'
    console.log(`   ${browser.toUpperCase()}: ${status}`)
  })

  const allSuccess = results.every(result => result.success)

  if (allSuccess) {
    console.log('\n🎉 All extensions packaged successfully!')
    console.log('\n📋 Installation Instructions:')
    console.log('   Chrome: Go to chrome://extensions, enable "Developer mode",')
    console.log('            and load unpacked extension from dist/chrome/')
    console.log('   Firefox: Go to about:debugging, click "This Firefox",')
    console.log('            and load temporary add-on from dist/firefox/')
    console.log('\n📦 Or use the ZIP files for distribution:')
    results.forEach(({ browser }) => {
      console.log(`   ${browser.toUpperCase()}: dist/${name}-${browser}-v${version}.zip`)
    })
  } else {
    console.log('\n⚠️ Some packages failed. Check the errors above.')
    process.exit(1)
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ Packaging failed:', error)
  process.exit(1)
})