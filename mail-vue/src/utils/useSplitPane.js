import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useEmailStore } from '@/store/email.js'
import { useUiStore } from '@/store/ui.js'

const PANEL_KEY = 'split-panel-width'
const NARROW_BREAKPOINT = 512
const MIN_LIST = 400
const MIN_DETAIL = 280
const FULLSCREEN_THRESHOLD = MIN_LIST + MIN_DETAIL

export function useSplitPane() {
  const emailStore = useEmailStore()
  const uiStore = useUiStore()
  const selectedEmail = ref(null)
  const panelWidth = ref(parseInt(localStorage.getItem(PANEL_KEY)) || 420)
  const isResizing = ref(false)
  const isNarrow = computed(() => !!selectedEmail.value && panelWidth.value < NARROW_BREAKPOINT)
  let startX = 0
  let startWidth = 0

  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

  function getSidebarWidth() {
    if (windowWidth.value <= 512) return 0
    return uiStore.asideShow ? 176 : 64
  }

  const containerWidth = computed(() => Math.max(0, windowWidth.value - getSidebarWidth()))
  const isFullScreenDetail = computed(() => !!selectedEmail.value && containerWidth.value < FULLSCREEN_THRESHOLD)

  function onWindowResize() {
    windowWidth.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', onWindowResize)
    squeezePanel()
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', onWindowResize)
  })

  function squeezePanel() {
    const maxW = containerWidth.value - MIN_DETAIL - 8
    if (maxW < MIN_LIST) return
    if (panelWidth.value > maxW) {
      panelWidth.value = Math.max(MIN_LIST, maxW)
    }
  }

  watch(containerWidth, () => squeezePanel())

  function setEmail(email, opts = {}) {
    emailStore.contentData.email = email
    if (opts.delType != null) emailStore.contentData.delType = opts.delType
    if (opts.showStar != null) emailStore.contentData.showStar = opts.showStar
    if (opts.showReply != null) emailStore.contentData.showReply = opts.showReply
    emailStore.contentData.showUnread = opts.showUnread ?? true
    selectedEmail.value = email
  }

  function closeDetail() {
    selectedEmail.value = null
  }

  function dblClickContent(email, opts = {}) {
    const emailData = JSON.parse(JSON.stringify(email))
    emailStore.contentData.email = emailData
    if (opts.delType != null) emailStore.contentData.delType = opts.delType
    if (opts.showStar != null) emailStore.contentData.showStar = opts.showStar
    if (opts.showReply != null) emailStore.contentData.showReply = opts.showReply
    emailStore.contentData.showUnread = opts.showUnread ?? true

    const url = `${window.location.origin}/detail`
    const win = window.open(url, '_blank', 'width=800,height=700')
    if (win) win.focus()
  }

  function getContainerWidth() {
    return containerWidth.value
  }

  function startResize(e) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    isResizing.value = true
    startX = e.clientX
    startWidth = panelWidth.value
    document.addEventListener('mousemove', onResize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  function onResize(e) {
    if (!isResizing.value) return
    const cw = containerWidth.value
    const delta = e.clientX - startX
    const maxWidth = cw - MIN_DETAIL - 8
    const minWidth = Math.min(MIN_LIST, maxWidth)
    const newWidth = Math.max(minWidth, Math.min(startWidth + delta, maxWidth))
    panelWidth.value = newWidth
    if (newWidth >= maxWidth) {
      closeDetail()
    }
  }

  function stopResize() {
    if (!isResizing.value) return
    isResizing.value = false
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    const cw = containerWidth.value
    const maxWidth = cw - MIN_DETAIL - 8
    if (panelWidth.value >= maxWidth) {
      panelWidth.value = Math.max(MIN_LIST, parseInt(localStorage.getItem(PANEL_KEY)) || 420)
    }

    localStorage.setItem(PANEL_KEY, panelWidth.value)
  }

  function handleTouchStart(e) {
    if (e.touches.length !== 1) return
    e.preventDefault()
    isResizing.value = true
    startX = e.touches[0].clientX
    startWidth = panelWidth.value
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
  }

  function onTouchMove(e) {
    if (!isResizing.value) return
    const cw = containerWidth.value
    const delta = e.touches[0].clientX - startX
    const maxWidth = cw - MIN_DETAIL - 8
    const minWidth = Math.min(MIN_LIST, maxWidth)
    const newWidth = Math.max(minWidth, Math.min(startWidth + delta, maxWidth))
    panelWidth.value = newWidth
    if (newWidth >= maxWidth) {
      closeDetail()
    }
  }

  function onTouchEnd() {
    stopResize()
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)
  }

  return {
    selectedEmail,
    panelWidth,
    isResizing,
    isNarrow,
    isFullScreenDetail,
    setEmail,
    closeDetail,
    dblClickContent,
    startResize,
    handleTouchStart
  }
}
