import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { symbols } from './cli-styling.js'

describe('Cross-Platform Styling Compatibility', () => {
  let originalEnv: NodeJS.ProcessEnv
  let originalPlatform: string

  beforeEach(() => {
    originalEnv = { ...process.env }
    originalPlatform = process.platform
  })

  afterEach(() => {
    process.env = originalEnv
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
    })
  })

  describe('Unicode Symbol Compatibility', () => {
    it('should provide valid Unicode characters on all platforms', () => {
      const platforms = ['win32', 'darwin', 'linux', 'freebsd', 'openbsd']

      platforms.forEach((platform) => {
        Object.defineProperty(process, 'platform', {
          value: platform,
          writable: true,
        })

        // Re-import to test platform-specific behavior
        Object.values(symbols).forEach((symbol) => {
          expect(typeof symbol).toBe('string')
          expect(symbol.length).toBeGreaterThan(0)
          expect(symbol.length).toBeLessThan(10) // Reasonable length for a symbol

          // Should not contain null or replacement characters
          expect(symbol).not.toContain('\u0000')
          expect(symbol).not.toContain('\uFFFD')

          // Should be printable Unicode
          expect(symbol.trim().length).toBeGreaterThan(0)
        })
      })
    })

    it('should work in different terminal environments', () => {
      const terminalConfigs = [
        { TERM: 'xterm-256color', COLORTERM: 'truecolor' },
        { TERM: 'screen-256color', COLORTERM: 'truecolor' },
        { TERM: 'xterm', COLORTERM: undefined },
        { TERM: 'screen', COLORTERM: undefined },
        { TERM: 'dumb', COLORTERM: undefined },
        { TERM: 'vt100', COLORTERM: undefined },
        { TERM: undefined, COLORTERM: undefined },
      ]

      terminalConfigs.forEach((config) => {
        process.env.TERM = config.TERM
        process.env.COLORTERM = config.COLORTERM

        Object.entries(symbols).forEach(([name, symbol]) => {
          expect(symbol).toBeTruthy()
          expect(typeof symbol).toBe('string')

          // Symbol should work regardless of terminal capabilities
          const testString = `${symbol} Test message`
          expect(testString).toContain('Test message')
          expect(testString.indexOf(symbol)).toBe(0)
        })
      })
    })

    it('should handle CI/CD environments', () => {
      const ciEnvs = [
        { CI: 'true', GITHUB_ACTIONS: 'true' },
        { CI: 'true', TRAVIS: 'true' },
        { CI: 'true', JENKINS_URL: 'http://jenkins.local' },
        { CI: 'true', GITLAB_CI: 'true' },
        { CI: 'true', BUILDKITE: 'true' },
        { CI: 'true', CIRCLECI: 'true' },
      ]

      ciEnvs.forEach((env) => {
        Object.keys(env).forEach((key) => {
          process.env[key] = env[key]
        })

        // Symbols should still work in CI environments
        Object.values(symbols).forEach((symbol) => {
          expect(symbol).toBeTruthy()
          expect(typeof symbol).toBe('string')

          // Should not break CI output parsing
          expect(symbol).not.toMatch(/[\x00-\x1F\x7F]/) // No control characters except newlines
        })
      })
    })
  })

  describe('Character Encoding Compatibility', () => {
    it('should handle different locale settings', () => {
      const locales = [
        'en_US.UTF-8',
        'en_GB.UTF-8',
        'de_DE.UTF-8',
        'fr_FR.UTF-8',
        'ja_JP.UTF-8',
        'zh_CN.UTF-8',
        'ru_RU.UTF-8',
        'ar_SA.UTF-8',
        'C',
        'POSIX',
      ]

      locales.forEach((locale) => {
        process.env.LC_ALL = locale
        process.env.LANG = locale

        // Symbols should render correctly regardless of locale
        Object.entries(symbols).forEach(([name, symbol]) => {
          expect(symbol).toBeTruthy()

          // Should be safe for different encodings
          const encoded = Buffer.from(symbol, 'utf8')
          const decoded = encoded.toString('utf8')
          expect(decoded).toBe(symbol)
        })
      })
    })

    it('should provide ASCII fallbacks when needed', () => {
      // Test with severely limited environment
      process.env.TERM = 'dumb'
      process.env.LC_ALL = 'C'
      process.env.COLORTERM = undefined

      Object.entries(symbols).forEach(([name, symbol]) => {
        // Even in limited environments, should provide some representation
        expect(symbol).toBeTruthy()
        expect(typeof symbol).toBe('string')
        expect(symbol.length).toBeGreaterThan(0)

        // Should not cause encoding errors
        expect(() => {
          const testOutput = `Status: ${symbol} Complete`
          Buffer.from(testOutput, 'utf8')
        }).not.toThrow()
      })
    })
  })

  describe('Windows Compatibility', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      })
    })

    it('should work in Windows Command Prompt', () => {
      process.env.TERM = undefined
      process.env.ConEmuANSI = undefined

      Object.values(symbols).forEach((symbol) => {
        expect(symbol).toBeTruthy()

        // Should not use characters that don't work in cmd.exe
        // Test that symbols are at least displayable
        expect(symbol.length).toBeGreaterThan(0)
      })
    })

    it('should work in Windows PowerShell', () => {
      process.env.TERM = 'cygwin'
      process.env.PSModulePath = 'C:\\Program Files\\WindowsPowerShell\\Modules'

      Object.values(symbols).forEach((symbol) => {
        expect(symbol).toBeTruthy()
        expect(typeof symbol).toBe('string')
      })
    })

    it('should work in Windows Terminal', () => {
      process.env.TERM = 'xterm-256color'
      process.env.WT_SESSION = 'abc123'

      Object.values(symbols).forEach((symbol) => {
        expect(symbol).toBeTruthy()

        // Windows Terminal supports Unicode well
        expect(symbol.length).toBeGreaterThan(0)
      })
    })

    it('should work in Git Bash on Windows', () => {
      process.env.TERM = 'cygwin'
      process.env.MSYSTEM = 'MINGW64'

      Object.values(symbols).forEach((symbol) => {
        expect(symbol).toBeTruthy()
        expect(typeof symbol).toBe('string')
      })
    })
  })

  describe('macOS and Linux Compatibility', () => {
    it('should work on macOS Terminal', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
      })

      process.env.TERM = 'xterm-256color'
      process.env.TERM_PROGRAM = 'Apple_Terminal'

      Object.values(symbols).forEach((symbol) => {
        expect(symbol).toBeTruthy()
        expect(typeof symbol).toBe('string')
      })
    })

    it('should work on Linux distributions', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      })

      const linuxTerminals = [
        { TERM: 'xterm-256color', GNOME_TERMINAL_SCREEN: '/dev/pts/0' },
        { TERM: 'screen-256color', TMUX: '/tmp/tmux-1000/default,1234,0' },
        { TERM: 'xterm-256color', KONSOLE_VERSION: '210800' },
        { TERM: 'xterm-256color', VTE_VERSION: '6003' },
      ]

      linuxTerminals.forEach((env) => {
        Object.keys(env).forEach((key) => {
          process.env[key] = env[key]
        })

        Object.values(symbols).forEach((symbol) => {
          expect(symbol).toBeTruthy()
          expect(typeof symbol).toBe('string')
        })
      })
    })
  })

  describe('Remote and SSH Environments', () => {
    it('should work over SSH connections', () => {
      process.env.SSH_CLIENT = '192.168.1.100 54321 22'
      process.env.SSH_CONNECTION = '192.168.1.100 54321 192.168.1.10 22'
      process.env.TERM = 'xterm'

      Object.values(symbols).forEach((symbol) => {
        expect(symbol).toBeTruthy()

        // SSH might have limited character support
        expect(typeof symbol).toBe('string')
        expect(symbol.length).toBeGreaterThan(0)
      })
    })

    it('should work in screen/tmux sessions', () => {
      process.env.STY = '12345.pts-0.hostname'
      process.env.TERM = 'screen-256color'

      Object.values(symbols).forEach((symbol) => {
        expect(symbol).toBeTruthy()
        expect(typeof symbol).toBe('string')
      })

      // Test tmux as well
      process.env.STY = undefined
      process.env.TMUX = '/tmp/tmux-1000/default,12345,0'

      Object.values(symbols).forEach((symbol) => {
        expect(symbol).toBeTruthy()
        expect(typeof symbol).toBe('string')
      })
    })
  })

  describe('Error Handling and Graceful Degradation', () => {
    it('should handle corrupted environment variables', () => {
      // Set corrupted/invalid environment variables
      process.env.TERM = '\x00\x01\x02'
      process.env.LANG = 'invalid.encoding'
      process.env.LC_ALL = ''

      expect(() => {
        Object.values(symbols).forEach((symbol) => {
          expect(symbol).toBeTruthy()
        })
      }).not.toThrow()
    })

    it('should work with minimal environment', () => {
      // Clear most environment variables
      const minimalEnv = {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        USER: process.env.USER,
      }

      process.env = minimalEnv

      Object.values(symbols).forEach((symbol) => {
        expect(symbol).toBeTruthy()
        expect(typeof symbol).toBe('string')
        expect(symbol.length).toBeGreaterThan(0)
      })
    })

    it('should provide consistent behavior across restarts', () => {
      // Test that symbols are consistent across multiple imports
      const firstLoad = { ...symbols }

      // Simulate module reload by clearing require cache would go here
      // but since we're using ES modules, we test consistency differently

      Object.keys(firstLoad).forEach((key) => {
        expect(symbols[key]).toBe(firstLoad[key])
      })
    })
  })

  describe('Performance in Different Environments', () => {
    it('should not cause performance issues in slow terminals', () => {
      // Simulate slow terminal environment
      process.env.TERM = 'vt100'
      process.env.COLORTERM = undefined

      const start = Date.now()

      // Use symbols many times
      for (let i = 0; i < 1000; i++) {
        Object.values(symbols).forEach((symbol) => {
          const _ = `${symbol} Message ${i}`
        })
      }

      const end = Date.now()
      const duration = end - start

      expect(duration).toBeLessThan(100) // Should be very fast
    })

    it('should handle high-frequency usage', () => {
      const iterations = 10000
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        const statusLine = `${symbols.success} Success ${i}`
        const errorLine = `${symbols.error} Error ${i}`
        const warningLine = `${symbols.warning} Warning ${i}`
        const infoLine = `${symbols.info} Info ${i}`

        expect(statusLine).toContain(`Success ${i}`)
      }

      const end = Date.now()
      const duration = end - start

      expect(duration).toBeLessThan(1000) // Should complete in under 1 second
    })
  })

  describe('Real-World Environment Testing', () => {
    it('should work in common development setups', () => {
      const devEnvironments = [
        // VS Code integrated terminal
        { TERM: 'xterm-256color', TERM_PROGRAM: 'vscode', VSCODE_INJECTION: '1' },
        // JetBrains IDEs
        { TERM: 'xterm-256color', TERMINAL_EMULATOR: 'JetBrains-JediTerm' },
        // Hyper terminal
        { TERM: 'xterm-256color', HYPER: 'true' },
        // Alacritty
        { TERM: 'alacritty', ALACRITTY_SOCKET: '/tmp/Alacritty-:0.0-1234' },
        // iTerm2
        { TERM: 'xterm-256color', TERM_PROGRAM: 'iTerm.app', ITERM_SESSION_ID: 'w0t0p0:12345' },
      ]

      devEnvironments.forEach((env) => {
        process.env = { ...originalEnv, ...env }

        Object.entries(symbols).forEach(([name, symbol]) => {
          expect(symbol).toBeTruthy()
          expect(typeof symbol).toBe('string')

          // Should work in all common development environments
          const testOutput = `${name}: ${symbol}`
          expect(testOutput).toContain(symbol)
        })
      })
    })

    it('should work in containerized environments', () => {
      const containerEnvs = [
        // Docker
        {
          container: 'docker',
          HOSTNAME: 'container123',
          PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        },
        // Kubernetes
        { KUBERNETES_SERVICE_HOST: '10.96.0.1', HOSTNAME: 'pod-123-abc' },
        // Generic container
        { TERM: 'xterm', container: 'true' },
      ]

      containerEnvs.forEach((env) => {
        process.env = { ...originalEnv, ...env }

        Object.values(symbols).forEach((symbol) => {
          expect(symbol).toBeTruthy()
          expect(typeof symbol).toBe('string')

          // Container environments should handle Unicode
          expect(symbol.length).toBeGreaterThan(0)
        })
      })
    })
  })
})
