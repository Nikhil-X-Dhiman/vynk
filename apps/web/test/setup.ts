import '@testing-library/jest-dom';
import { vi } from 'vitest';
import 'fake-indexeddb/auto'; // Using fake-indexeddb for realistic IDB testing

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

// Mock the Service Worker API
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: vi.fn(),
    ready: Promise.resolve(),
    controller: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  },
});

// Mock user-select style property which jsdom doesn't support
Object.defineProperty(document.documentElement.style, 'userSelect', {
  value: 'auto',
  writable: true,
});
