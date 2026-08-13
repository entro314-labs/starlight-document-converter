// Test setup file for vitest
import { afterAll, beforeEach, vi } from 'vite-plus/test'

// Local type definitions for test mocks
interface FilePropertyBag {
  type?: string
  lastModified?: number
}

interface BlobPropertyBag {
  type?: string
}

interface MockProgressEvent<T = unknown> {
  target: T | null
}

const nativeSetTimeout = globalThis.setTimeout.bind(globalThis)
const nativeSetInterval = globalThis.setInterval.bind(globalThis)

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}

// Mock process.exit to prevent tests from actually exiting
const processExitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
  throw new Error('process.exit was called during tests')
})

// Restore original behavior after tests
afterAll(() => {
  processExitSpy.mockRestore()
})

// Mock setTimeout and setInterval for faster tests
vi.stubGlobal(
  'setTimeout',
  vi.fn((fn: () => void, delay?: number) => {
    const normalizedDelay = typeof delay === 'number' ? (delay > 100 ? 0 : Math.min(delay, 10)) : 0
    return nativeSetTimeout(fn, normalizedDelay)
  })
)

vi.stubGlobal(
  'setInterval',
  vi.fn((fn: () => void, delay?: number) => {
    const normalizedDelay = typeof delay === 'number' ? Math.min(delay, 10) : 0
    return nativeSetInterval(fn, normalizedDelay)
  })
)

// Mock fetch for API tests
vi.stubGlobal('fetch', vi.fn())

// Mock File API
class MockFile {
  name: string
  size: number
  type: string
  lastModified: number

  constructor(
    bits: (string | ArrayBuffer | ArrayBufferView)[],
    name: string,
    options: FilePropertyBag = {}
  ) {
    this.name = name
    this.size = bits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : 0), 0)
    this.type = options.type || ''
    this.lastModified = options.lastModified || Date.now()
  }
}

Object.defineProperty(globalThis, 'File', {
  value: MockFile,
  writable: true,
  configurable: true,
})

// Mock FileReader
class MockFileReader {
  result: string | ArrayBuffer | null = null
  error: Error | null = null
  readyState = 0
  onload: ((event: MockProgressEvent) => void) | null = null
  onerror: ((event: MockProgressEvent) => void) | null = null

  readAsText(file: { name?: string } | string) {
    this.readyState = 2 // DONE
    this.result = typeof file === 'string' ? file : `# ${file.name || 'test'}\nTest content`
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: this })
      }
    }, 0)
  }

  readAsArrayBuffer(_file: unknown) {
    this.readyState = 2 // DONE
    this.result = new ArrayBuffer(100)
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: this })
      }
    }, 0)
  }
}

Object.defineProperty(globalThis, 'FileReader', {
  value: MockFileReader,
  writable: true,
  configurable: true,
})

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(globalThis.URL, 'createObjectURL', {
  value: vi.fn(() => 'mock://blob-url'),
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true,
  configurable: true,
})

// Mock Blob
class MockBlob {
  size: number
  type: string

  constructor(array: unknown[], options: BlobPropertyBag = {}) {
    this.size = array.reduce<number>((acc, item) => {
      if (typeof item === 'string') return acc + item.length
      if (item instanceof ArrayBuffer) return acc + item.byteLength
      if (ArrayBuffer.isView(item)) return acc + item.byteLength
      return acc
    }, 0)
    this.type = options.type || ''
  }
}

Object.defineProperty(globalThis, 'Blob', {
  value: MockBlob,
  writable: true,
  configurable: true,
})

// Mock localStorage
const mockStorage = {
  store: {} as { [key: string]: string },
  getItem: vi.fn((key: string) => mockStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage.store[key]
  }),
  clear: vi.fn(() => {
    mockStorage.store = {}
  }),
}

Object.defineProperty(global, 'localStorage', {
  value: mockStorage,
})

// Reset localStorage before each test
beforeEach(() => {
  mockStorage.store = {}
  vi.clearAllMocks()
})

// Mock DOM methods that might be used in tests
Object.defineProperty(global, 'getComputedStyle', {
  value: vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
  })),
})

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
    },
    userAgent: 'node.js',
  },
})

// Mock alert, confirm, prompt
vi.stubGlobal('alert', vi.fn())
vi.stubGlobal(
  'confirm',
  vi.fn(() => true)
)
vi.stubGlobal(
  'prompt',
  vi.fn(() => 'test-input')
)
