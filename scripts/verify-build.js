import fs from 'fs'
import path from 'path'

function verifyBuild(browser) {
  const distDir = path.join(process.cwd(), 'dist', browser)

  console.log(`\n🔍 Verifying ${browser} build...`)

  // 检查必需的文件
  const requiredFiles = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'options.html',
    'options.js',
    'background.js',
    'content.js'
  ]

  let allFilesExist = true

  requiredFiles.forEach(file => {
    const filePath = path.join(distDir, file)
    const exists = fs.existsSync(filePath)
    console.log(`${exists ? '✅' : '❌'} ${file}`)
    if (!exists) allFilesExist = false
  })

  // 检查图标
  console.log('\n📁 Checking icons...')
  const iconSizes = [16, 32, 48, 128]
  const iconsDir = path.join(distDir, 'icons')

  if (fs.existsSync(iconsDir)) {
    iconSizes.forEach(size => {
      const iconPath = path.join(iconsDir, `icon-${size}.png`)
      const exists = fs.existsSync(iconPath)
      console.log(`${exists ? '✅' : '❌'} icon-${size}.png`)
      if (!exists) allFilesExist = false
    })
  } else {
    console.log('❌ icons directory missing')
    allFilesExist = false
  }

  // 检查 manifest 内容
  console.log('\n📋 Checking manifest...')
  const manifestPath = path.join(distDir, 'manifest.json')
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      console.log(`✅ Manifest version: ${manifest.manifest_version}`)
      console.log(`✅ Name: ${manifest.name}`)
      console.log(`✅ Version: ${manifest.version}`)
    } catch (error) {
      console.log('❌ Invalid manifest JSON')
      allFilesExist = false
    }
  } else {
    console.log('❌ manifest.json missing')
    allFilesExist = false
  }

  if (allFilesExist) {
    console.log(`\n🎉 ${browser} build verification PASSED!`)
    console.log(`📁 Ready to load from: ${distDir}`)
  } else {
    console.log(`\n❌ ${browser} build verification FAILED!`)
  }

  return allFilesExist
}

// 验证所有浏览器构建
const browsers = ['chrome', 'firefox']
let allPassed = true

browsers.forEach(browser => {
  const passed = verifyBuild(browser)
  if (!passed) allPassed = false
})

if (allPassed) {
  console.log('\n🎉 All builds verified successfully!')
  console.log('\n📋 Loading instructions:')
  console.log('Chrome: chrome://extensions/ → Load unpacked → dist/chrome/')
  console.log('Firefox: about:debugging → This Firefox → Load Temporary Add-on → dist/firefox/manifest.json')
} else {
  console.log('\n❌ Some builds failed verification')
  process.exit(1)
}