import boxen from 'boxen'
import Table from 'cli-table3'
import figures from 'figures'
import gradient from 'gradient-string'
import pc from 'picocolors'

// Cross-platform symbols
export const symbols = {
  success: figures.tick,
  error: figures.cross,
  warning: figures.warning,
  info: figures.info,
  arrow: figures.arrowRight,
  bullet: figures.bullet,
  star: figures.star,
  heart: figures.heart,
  checkbox: figures.checkboxOn,
  radioOn: figures.radioOn,
  pointer: figures.pointer,
  line: figures.line,
  corner: figures.pointer, // Use pointer as fallback since cornerDownRight might not exist
}

// Color schemes
export const colors = {
  primary: pc.cyan,
  success: pc.green,
  error: pc.red,
  warning: pc.yellow,
  info: pc.blue,
  muted: pc.gray,
  bold: pc.bold,
  dim: pc.dim,
}

// Gradient themes
export const gradients = {
  primary: (text: string) => gradient(['#00f5ff', '#0099ff'])(text),
  success: (text: string) => gradient(['#00ff88', '#00aa55'])(text),
  warning: (text: string) => gradient(['#ffaa00', '#ff6600'])(text),
  error: (text: string) => gradient(['#ff4444', '#cc0000'])(text),
  rainbow: (text: string) => gradient.rainbow(text),
}

// Status indicators with symbols and colors
export const status = {
  success: (text: string) => `${colors.success(symbols.success)} ${text}`,
  error: (text: string) => `${colors.error(symbols.error)} ${text}`,
  warning: (text: string) => `${colors.warning(symbols.warning)} ${text}`,
  info: (text: string) => `${colors.info(symbols.info)} ${text}`,
  processing: (text: string) => `${colors.primary(symbols.arrow)} ${text}`,
  bullet: (text: string) => `${colors.muted(symbols.bullet)} ${text}`,
}

// Box styling presets
export const boxes = {
  success: (text: string, title?: string) =>
    boxen(text, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
      title,
      titleAlignment: 'center',
    }),
  error: (text: string, title?: string) =>
    boxen(text, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'red',
      title,
      titleAlignment: 'center',
    }),
  info: (text: string, title?: string) =>
    boxen(text, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      title,
      titleAlignment: 'center',
    }),
  warning: (text: string, title?: string) =>
    boxen(text, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
      title,
      titleAlignment: 'center',
    }),
}

// Table creation helpers
export const createTable = (options?: any) =>
  new Table({
    style: { head: ['cyan'] },
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
    ...options,
  })

// Create a results summary table
export const createResultsTable = (stats: {
  filesProcessed?: number
  totalRepaired?: number
  totalIssues?: number
  validFiles?: number
  totalFiles?: number
  issueCount?: number
}) => {
  const table = createTable({
    head: ['Metric', 'Count', 'Status'],
  })

  if (stats.filesProcessed !== undefined) {
    table.push(['Files Processed', stats.filesProcessed.toString(), status.info('')])
  }

  if (stats.totalRepaired !== undefined) {
    const statusIcon = stats.totalRepaired > 0 ? status.success('') : status.info('')
    table.push(['Files Repaired', stats.totalRepaired.toString(), statusIcon])
  }

  if (stats.totalIssues !== undefined) {
    const statusIcon = stats.totalIssues === 0 ? status.success('') : status.warning('')
    table.push(['Issues Resolved', stats.totalIssues.toString(), statusIcon])
  }

  if (stats.totalFiles !== undefined) {
    table.push(['Total Files', stats.totalFiles.toString(), status.info('')])
  }

  if (stats.validFiles !== undefined) {
    const statusIcon = stats.validFiles > 0 ? status.success('') : status.warning('')
    table.push(['Valid Files', stats.validFiles.toString(), statusIcon])
  }

  if (stats.issueCount !== undefined) {
    const statusIcon = stats.issueCount === 0 ? status.success('') : status.warning('')
    table.push(['Issues Found', stats.issueCount.toString(), statusIcon])
  }

  if (stats.totalFiles !== undefined && stats.validFiles !== undefined) {
    const rate = Math.round((stats.validFiles / stats.totalFiles) * 100)
    const statusIcon =
      rate >= 90 ? status.success('') : rate >= 70 ? status.warning('') : status.error('')
    table.push(['Success Rate', `${rate}%`, statusIcon])
  }

  return table
}

// Create validation issues table
export const createIssuesTable = (
  issues: Array<{ type: string; message: string; severity?: number; file?: string }>
) => {
  const table = createTable({
    head: ['File', 'Type', 'Issue', 'Severity'],
  })

  issues.forEach((issue) => {
    const severityIcon =
      issue.severity && issue.severity >= 7
        ? status.error('High')
        : issue.severity && issue.severity >= 4
          ? status.warning('Med')
          : status.info('Low')

    const typeIcon =
      issue.type === 'error'
        ? colors.error(issue.type)
        : issue.type === 'warning'
          ? colors.warning(issue.type)
          : colors.info(issue.type)

    table.push([issue.file ? colors.dim(issue.file) : '-', typeIcon, issue.message, severityIcon])
  })

  return table
}

// Brand header
export const createBrandHeader = (title: string, version?: string) => {
  const titleText = gradients.primary(title)
  const versionText = version ? colors.dim(`v${version}`) : ''
  const headerText = versionText ? `${titleText} ${versionText}` : titleText

  return boxen(headerText, {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'cyan',
    textAlignment: 'center',
  })
}

// Progress indicators
export const progress = {
  step: (current: number, total: number, description: string) =>
    `${colors.primary(`[${current}/${total}]`)} ${colors.bold(description)}`,

  percentage: (percent: number, description: string) => {
    const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5))
    return `${colors.primary(bar)} ${colors.bold(`${percent}%`)} ${description}`
  },
}

// Help section formatting
export const formatHelpSection = (
  title: string,
  items: Array<{ name: string; description: string }>
) => {
  const lines = ['', colors.bold(colors.primary(title)), colors.dim('─'.repeat(title.length)), '']

  items.forEach((item) => {
    lines.push(`  ${colors.success(symbols.bullet)} ${colors.bold(item.name)}`)
    lines.push(`    ${colors.muted(item.description)}`)
    lines.push('')
  })

  return lines.join('\n')
}
