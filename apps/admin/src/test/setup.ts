import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

const emptyRect = new DOMRect(0, 0, 0, 0)

if (typeof document.elementFromPoint !== 'function') {
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: () => document.querySelector<HTMLElement>('[role="textbox"]'),
  })
}

Object.defineProperties(Range.prototype, {
  getBoundingClientRect: {
    configurable: true,
    value: () => emptyRect,
  },
  getClientRects: {
    configurable: true,
    value: () => [],
  },
})

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      addEventListener: () => undefined,
      matches: false,
      removeEventListener: () => undefined,
    }),
  })
}

if (!('ResizeObserver' in window)) {
  class ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  }

  Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: ResizeObserver })
}
