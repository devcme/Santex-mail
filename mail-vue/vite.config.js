import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), 'VITE')
    return {
        server: {
            host: true,
            port: 3001,
            hmr: true,
        },
        base: env.VITE_STATIC_URL || '/',
        plugins: [vue(),
            VitePWA({
                injectRegister: 'script-defer',
                manifest: {
                    name: env.VITE_PWA_NAME,
                    short_name: env.VITE_PWA_NAME,
                    background_color: '#FFFFFF',
                    theme_color: '#FFFFFF',
                    display: 'standalone',
                    start_url: '/',
                    scope: '/',
                    icons: [
                        {
                            src: 'mail-pwa.png',
                            sizes: '192x192',
                            type: 'image/png',
                        },
                        {
                            src: 'mail-pwa.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any maskable',
                        }
                    ],
                },
                workbox: {
                    disableDevLogs: true,
                    globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico,json}'],
                    globIgnores: ['**/registerSW.js'],
                    navigateFallback: 'index.html',
                    navigateFallbackDenylist: [/^\/api\//, /^\/oss\//, /^\/attachments\//],
                    cleanupOutdatedCaches: true,
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'google-fonts-cache',
                                expiration: {
                                    maxEntries: 10,
                                    maxAgeSeconds: 60 * 60 * 24 * 365
                                },
                                cacheableResponse: { statuses: [0, 200] }
                            }
                        },
                        {
                            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2)$/i,
                            handler: 'StaleWhileRevalidate',
                            options: {
                                cacheName: 'static-assets-cache',
                                expiration: {
                                    maxEntries: 100,
                                    maxAgeSeconds: 60 * 60 * 24 * 30
                                }
                            }
                        },
                        {
                            urlPattern: /\/api\/(?:email|allEmail)\/list/i,
                            handler: 'NetworkFirst',
                            options: {
                                cacheName: 'email-api-cache',
                                networkTimeoutSeconds: 10,
                                expiration: {
                                    maxEntries: 50,
                                    maxAgeSeconds: 60 * 60 * 24
                                },
                                cacheableResponse: { statuses: [0, 200] }
                            }
                        }
                    ]
                }
            }),
            AutoImport({
                resolvers: [ElementPlusResolver()],
            }),
            Components({
                resolvers: [ElementPlusResolver()],
            })
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src')
            }
        },
        build: {
            target: 'es2022',
            outDir: env.VITE_OUT_DIR || 'dist',
            emptyOutDir: true,
            assetsInclude: ['**/*.json']
        }
    }
})
