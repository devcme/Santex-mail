import { ref } from 'vue'
import { useEmailStore } from '@/store/email.js'

const PANEL_KEY = 'split-panel-width'
const NARROW_BREAKPOINT = 512

export function useSplitPane() {
  const emailStore = useEmailStore()
  const selectedEmail = ref(null)
  const panelWidth = ref(parseInt(localStorage.getItem(PANEL_KEY)) || 420)
  const isResizing = ref(false)
  const isNarrow = ref(false)
  let startX = 0
  let startWidth = 0
  let narrowObserver = null

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
    const container = document.querySelector('.email-split')
    return container ? container.clientWidth : window.innerWidth
  }

  function initNarrowObserver(el) {
    if (!el || narrowObserver) return
    const listPanel = el.querySelector('.email-list-panel')
    if (!listPanel) return
    narrowObserver = new ResizeObserver(() => {
      isNarrow.value = listPanel.clientWidth < NARROW_BREAKPOINT
    })
    narrowObserver.observe(listPanel)
  }

  function destroyNarrowObserver() {
    if (narrowObserver) {
      narrowObserver.disconnect()
      narrowObserver = null
    }
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
    const containerWidth = getContainerWidth()
    const delta = e.clientX - startX
    const maxWidth = containerWidth - 320
    const newWidth = Math.max(280, Math.min(startWidth + delta, maxWidth))
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

    const containerWidth = getContainerWidth()
    const maxWidth = containerWidth - 320
    if (panelWidth.value >= maxWidth) {
      panelWidth.value = Math.max(280, parseInt(localStorage.getItem(PANEL_KEY)) || 420)
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
    const containerWidth = getContainerWidth()
    const delta = e.touches[0].clientX - startX
    const maxWidth = containerWidth - 320
    const newWidth = Math.max(280, Math.min(startWidth + delta, maxWidth))
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
    setEmail,
    closeDetail,
    dblClickContent,
    startResize,
    handleTouchStart,
    initNarrowObserver,
    destroyNarrowObserver
  }
}
