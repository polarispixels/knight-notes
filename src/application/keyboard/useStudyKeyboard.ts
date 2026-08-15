import { onBeforeUnmount, onMounted } from 'vue'

export interface StudyKeyboardHandlers {
  next(): void
  previous(): void
  toStart(): void
  toEnd(): void
  flip(): void
  escape(): void
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  )
}

/** Binds the spec's study-reader shortcuts for the lifetime of a component. */
export function useStudyKeyboard(handlers: StudyKeyboardHandlers): void {
  function onKeydown(event: KeyboardEvent) {
    if (isEditable(event.target)) return
    if (event.metaKey || event.ctrlKey || event.altKey) return
    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        handlers.next()
        break
      case 'ArrowLeft':
        handlers.previous()
        break
      case 'Home':
        handlers.toStart()
        break
      case 'End':
        handlers.toEnd()
        break
      case 'f':
      case 'F':
        handlers.flip()
        break
      case 'Escape':
        handlers.escape()
        return // don't swallow Escape from other listeners
      default:
        return
    }
    event.preventDefault()
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
