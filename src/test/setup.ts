import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Recharts usa ResizeObserver em ambiente de browser real.
(globalThis as any).ResizeObserver = ResizeObserverMock;
