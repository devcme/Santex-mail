<template>
  <div class="content-box" ref="contentBox">
    <div ref="container" class="content-html"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUiStore } from '@/store/ui.js'

const props = defineProps({
  html: {
    type: String,
    required: true
  },
  bgMode: {
    type: Number,
    default: 0
  },
  zoom: {
    type: Number,
    default: 1
  }
})

const container = ref(null)
const contentBox = ref(null)
const uiStore = useUiStore()
let shadowRoot = null

function updateContent() {
  if (!shadowRoot) return;

  const isDark = uiStore.dark
  let textColor, bgColor, linkColor
  const useDrFilter = props.bgMode === 1

  if (props.bgMode === 1 || (props.bgMode === 0 && isDark)) {
    textColor = '#E5EAF3'
    bgColor = '#141414'
    linkColor = '#409EFF'
  } else {
    textColor = '#13181D'
    bgColor = '#FFFFFF'
    linkColor = '#0E70DF'
  }

  const drFilterCSS = useDrFilter ? `
        .shadow-content {
          filter: invert(0.92) hue-rotate(180deg);
        }
        .shadow-content img,
        .shadow-content video,
        .shadow-content svg,
        .shadow-content [style*="background-image"],
        .shadow-content [style*="background:url"],
        .shadow-content [style*="background: url"] {
          filter: invert(0.92) hue-rotate(180deg);
        }
  ` : ''

  try {
    const bodyStyleRegex = /<body[^>]*style="([^"]*)"[^>]*>/i;
    const bodyStyleMatch = props.html.match(bodyStyleRegex);
    const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : '';

    const cleanedHtml = props.html.replace(/<\/?body[^>]*>/gi, '');

    shadowRoot.innerHTML = `
      <style>
        :host {
          all: initial;
          width: 100%;
          height: 100%;
          font-family: -apple-system, Inter, BlinkMacSystemFont,
                      'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: ${textColor};
          word-break: break-word;
        }

        h1, h2, h3, h4 {
            font-size: 18px;
            font-weight: 700;
        }

        p {
          margin: 0;
        }

        a {
          text-decoration: none;
          color: ${linkColor};
        }

        .shadow-content {
          background: ${bgColor};
          width: fit-content;
          height: fit-content;
          min-width: 100%;
          ${bodyStyle ? bodyStyle : ''}
        }

        img:not(table img) {
          max-width: 100%;
          height: auto !important;
        }

        ${drFilterCSS}

      </style>
      <div class="shadow-content">
        ${cleanedHtml}
      </div>
    `;

    applyZoom()
  } catch (e) {
    console.warn('ShadowHtml render error:', e)
    if (shadowRoot) {
      shadowRoot.innerHTML = `<div class="shadow-content">${props.html}</div>`
    }
  }
}

function applyZoom() {
  if (!shadowRoot) return
  const shadowContent = shadowRoot.querySelector('.shadow-content')
  if (shadowContent) {
    shadowContent.style.zoom = props.zoom
  }
}

function autoScale() {
  if (!shadowRoot || !contentBox.value) return
  try {
    const parent = contentBox.value
    const shadowContent = shadowRoot.querySelector('.shadow-content')

    if (!shadowContent) return

    const parentWidth = parent.offsetWidth
    const childWidth = shadowContent.scrollWidth

    if (childWidth === 0) return

    const scale = parentWidth / childWidth

    const hostElement = shadowRoot.host
    hostElement.style.zoom = scale
  } catch (e) {
    console.warn('ShadowHtml autoScale error:', e)
  }
}

onMounted(() => {
  shadowRoot = container.value.attachShadow({ mode: 'open' })
  updateContent()
})

watch(() => props.html, () => {
  updateContent()
})

watch(() => uiStore.dark, () => {
  updateContent()
})

watch(() => props.bgMode, () => {
  updateContent()
})

watch(() => props.zoom, () => {
  applyZoom()
})
</script>

<style scoped>
.content-box {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: auto;
  font-family: -apple-system, Inter, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
}

.content-html {
  width: 100%;
  min-height: 100%;
}
</style>
