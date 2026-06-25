import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { fileToBase64 } from '@/utils/file-utils.js'
import { useI18n } from 'vue-i18n'

export function useFileDrop(opt = {}) {
  const { t } = useI18n()
  const dragOver = ref(false)
  let dragCounter = 0

  function onDragEnter() {
    dragCounter++
    dragOver.value = true
  }

  function onDragLeave() {
    dragCounter--
    if (dragCounter <= 0) {
      dragCounter = 0
      dragOver.value = false
    }
  }

  async function handleDrop(e, form, editorRef) {
    dragOver.value = false
    dragCounter = 0
    const files = e.dataTransfer?.files
    if (!files || !files.length) return

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/')
      const content = await fileToBase64(file)

      if (isImage) {
        try {
          const action = await ElMessageBox.confirm(
            t('dropImageHint', { name: file.name }),
            t('dropImageTitle'),
            { confirmButtonText: t('insertInline'), cancelButtonText: t('addAsAttachment'), distinguishCancelAndClose: true, type: 'info' }
          )
          if (action === 'confirm') {
            const ed = editorRef?.value
            if (ed?.insertContent) {
              ed.insertContent(`<img src="${content}" alt="${file.name}" style="max-width:100%"/>`)
            }
            continue
          }
        } catch (e) {}
      }
      form.attachments.push({ content, filename: file.name, size: file.size, contentType: file.type })
    }
  }

  return { dragOver, onDragEnter, onDragLeave, handleDrop }
}
