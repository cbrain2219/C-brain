import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

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
