import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useStudyKeyboard, type StudyKeyboardHandlers } from '../keyboard/useStudyKeyboard'

function press(key: string, target?: EventTarget) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  if (target && 'dispatchEvent' in target) {
    ;(target as HTMLElement).dispatchEvent(event)
  } else {
    window.dispatchEvent(event)
  }
  return event
}

describe('useStudyKeyboard', () => {
  let handlers: StudyKeyboardHandlers
  beforeEach(() => {
    handlers = {
      next: vi.fn(),
      previous: vi.fn(),
      toStart: vi.fn(),
      toEnd: vi.fn(),
      flip: vi.fn(),
      escape: vi.fn(),
    }
  })

  function mountWithKeyboard() {
    return mount(
      defineComponent({
        setup() {
          useStudyKeyboard(handlers)
          return () => h('div')
        },
      }),
      { attachTo: document.body },
    )
  }

  it('maps keys to navigation handlers', () => {
    const wrapper = mountWithKeyboard()
    press('ArrowRight')
    press(' ')
    press('ArrowLeft')
    press('Home')
    press('End')
    press('f')
    press('Escape')
    expect(handlers.next).toHaveBeenCalledTimes(2)
    expect(handlers.previous).toHaveBeenCalledTimes(1)
    expect(handlers.toStart).toHaveBeenCalledTimes(1)
    expect(handlers.toEnd).toHaveBeenCalledTimes(1)
    expect(handlers.flip).toHaveBeenCalledTimes(1)
    expect(handlers.escape).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('ignores keys while typing in an input or textarea', () => {
    const wrapper = mountWithKeyboard()
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    press('ArrowRight', textarea)
    press('f', textarea)
    expect(handlers.next).not.toHaveBeenCalled()
    expect(handlers.flip).not.toHaveBeenCalled()
    textarea.remove()
    wrapper.unmount()
  })

  it('stops listening after unmount', () => {
    const wrapper = mountWithKeyboard()
    wrapper.unmount()
    press('ArrowRight')
    expect(handlers.next).not.toHaveBeenCalled()
  })
})

describe('useStudyKeyboard: focused controls', () => {
  it('leaves Space to a focused button instead of advancing', () => {
    const handlers = {
      next: vi.fn(), previous: vi.fn(), toStart: vi.fn(),
      toEnd: vi.fn(), flip: vi.fn(), escape: vi.fn(),
    }
    const wrapper = mount(
      defineComponent({
        setup() {
          useStudyKeyboard(handlers)
          return () => h('div')
        },
      }),
      { attachTo: document.body },
    )
    const button = document.createElement('button')
    document.body.appendChild(button)
    press(' ', button)
    expect(handlers.next).not.toHaveBeenCalled()
    press('ArrowRight', button) // arrows still work with a button focused
    expect(handlers.next).toHaveBeenCalledTimes(1)
    button.remove()
    wrapper.unmount()
  })
})
