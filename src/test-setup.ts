// Test setup file for vitest
import { afterAll, beforeEach, vi } from 'vitest';

// Local type definitions for test mocks
interface FilePropertyBag {
  type?: string;
  lastModified?: number;
}

interface BlobPropertyBag {
  type?: string;
}

interface MockProgressEvent<T = unknown> {
  target: T | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const setImmediate: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const setTimeout: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const setInterval: any;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock process.exit to prevent tests from actually exiting
const originalExit = process.exit;
process.exit = vi.fn() as never;

// Restore original exit after tests
afterAll(() => {
  process.exit = originalExit;
});

// Mock setTimeout and setInterval for faster tests
vi.stubGlobal(
  'setTimeout',
  vi.fn((fn, delay) => {
    if (delay && delay > 100) {
      // For long delays, run immediately
      return setImmediate(fn);
    }
    return setTimeout(fn, Math.min(delay || 0, 10));
  })
);

vi.stubGlobal(
  'setInterval',
  vi.fn((fn, delay) => {
    return setInterval(fn, Math.min(delay || 0, 10));
  })
);

// Mock fetch for API tests
global.fetch = vi.fn();

// Mock File API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(
    bits: (string | ArrayBuffer | ArrayBufferView)[],
    name: string,
    options: FilePropertyBag = {}
  ) {
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : 0), 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

// Mock FileReader
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: Error | null = null;
  readyState: number = 0;
  onload: ((event: MockProgressEvent) => void) | null = null;
  onerror: ((event: MockProgressEvent) => void) | null = null;

  readAsText(file: { name?: string }) {
    this.readyState = 2; // DONE
    this.result = typeof file === 'string' ? file : `# ${file.name || 'test'}\nTest content`;
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }

  readAsArrayBuffer(_file: unknown) {
    this.readyState = 2; // DONE
    this.result = new ArrayBuffer(100);
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }
};

// Mock URL.createObjectURL and revokeObjectURL
global.URL = {
  ...global.URL,
  createObjectURL: vi.fn(() => 'mock://blob-url'),
  revokeObjectURL: vi.fn(),
};

// Mock Blob
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).Blob = class MockBlob {
  size: number;
  type: string;

  constructor(array: unknown[], options: BlobPropertyBag = {}) {
    this.size = array.reduce((acc, item) => acc + (item?.length || 0), 0);
    this.type = options.type || '';
  }
};

// Mock localStorage
const mockStorage = {
  store: {} as { [key: string]: string },
  getItem: vi.fn((key: string) => mockStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockStorage.store = {};
  }),
};

Object.defineProperty(global, 'localStorage', {
  value: mockStorage,
});

// Reset localStorage before each test
beforeEach(() => {
  mockStorage.store = {};
  vi.clearAllMocks();
});

// Mock DOM methods that might be used in tests
Object.defineProperty(global, 'getComputedStyle', {
  value: vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
  })),
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
    },
    userAgent: 'node.js',
  },
});

// Mock alert, confirm, prompt
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
global.prompt = vi.fn(() => 'test-input');
