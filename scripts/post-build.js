import fs from 'fs'
import path from 'path'

const browser = process.argv[2]
const isFirefox = browser === 'firefox'
const distDir = path.join(process.cwd(), 'dist', browser)

function createManifest() {
  const baseManifest = {
    name: 'Mark Translation',
    version: '1.0.0',
    description: 'A browser extension for Chinese-English translation using AI models',
    permissions: [
      'activeTab',
      'storage'
    ],
    host_permissions: [
      'https://*/*'
    ],
    action: {
      default_popup: 'popup.html',
      default_title: 'Mark Translation'
    },
    options_page: 'options.html',
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content.js'],
        run_at: 'document_end'
      }
    ],
    icons: {
      '16': 'icons/icon-idle-16.png',
      '32': 'icons/icon-idle-32.png',
      '48': 'icons/icon-idle-48.png',
      '128': 'icons/icon-idle-128.png'
    }
  }

  if (isFirefox) {
    // Firefox 使用 manifest v2 兼容模式
    const { action, ...baseManifestWithoutAction } = baseManifest;
    return {
      ...baseManifestWithoutAction,
      manifest_version: 2,
      browser_action: baseManifest.action,
      background: {
        scripts: ['background.js'],
        persistent: false
      }
    }
  } else {
    // Chrome 使用 manifest v3
    return {
      ...baseManifest,
      manifest_version: 3,
      background: {
        service_worker: 'background.js',
        type: 'module'
      }
    }
  }
}

// 生成图标
console.log(`🔄 Generating icons for ${browser}...`)

// 直接导入并调用图标生成函数
const { createIconsForBrowser } = await import('./create-icons.js')
await createIconsForBrowser(browser)

// 生成 manifest
const manifest = createManifest()
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

console.log(`✅ ${browser} build completed!`)
console.log(`📁 Output directory: ${distDir}`)
