import type { FileProcessor, ProcessingContext } from '../types.js'

// JSON data structure interfaces
interface JsonObject {
  [key: string]: JsonValue
}

type JsonArray = JsonValue[]

type JsonValue = string | number | boolean | null | undefined | JsonObject | JsonArray

interface OpenAPIInfo extends JsonObject {
  title?: string
  description?: string
  version?: string
}

interface OpenAPISpec extends JsonObject {
  openapi?: string
  swagger?: string
  info?: OpenAPIInfo
  paths?: JsonObject
  servers?: JsonArray
}

interface DataSchema extends JsonObject {
  $schema?: string
  type?: string
  properties?: JsonObject
  title?: string
  description?: string
}

function isJsonObject(data: JsonValue): data is JsonObject {
  return typeof data === 'object' && data !== null && !Array.isArray(data)
}

function stringifyJsonValue(value: JsonValue): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === null || value === undefined) return ''
  return JSON.stringify(value)
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

function isAPISpec(data: JsonValue): data is OpenAPISpec {
  if (!isJsonObject(data)) {
    return false
  }
  const obj: JsonObject = data
  return !!(obj.openapi || obj.swagger || (obj.paths && typeof obj.paths === 'object'))
}

function isConfigFile(data: JsonValue): data is JsonObject {
  if (!isJsonObject(data)) {
    return false
  }
  const obj: JsonObject = data
  return !!(obj.name || obj.version || obj.scripts || obj.dependencies || obj.config)
}

function isDataSchema(data: JsonValue): data is DataSchema {
  if (!isJsonObject(data)) {
    return false
  }
  const obj: JsonObject = data
  return !!(obj.$schema || obj.type === 'object' || obj.properties)
}

function formatSectionTitle(key: string): string {
  return key.replace(/[_-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function formatConfigValue(value: JsonValue): string {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map((item) => `- ${stringifyJsonValue(item)}`).join('\n')
    }
    return Object.entries(value)
      .map(([k, v]) => `- **${k}**: ${JSON.stringify(v)}`)
      .join('\n')
  }
  return String(value)
}

function isFlattish(obj: JsonValue): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false
  }
  return Object.values(obj).every(
    (value) => typeof value !== 'object' || value === null || Array.isArray(value)
  )
}

function formatAsAPISpec(data: OpenAPISpec, _context: ProcessingContext): string {
  const title = data.info?.title || 'API Specification'
  const description =
    data.info?.description || 'API documentation generated from OpenAPI specification.'
  const version = data.info?.version || '1.0.0'

  let markdown = `# ${title}\n\n`
  markdown += `${description}\n\n`
  markdown += `**Version:** ${version}\n\n`

  if (data.servers && Array.isArray(data.servers) && data.servers.length > 0) {
    markdown += '## Servers\n\n'
    data.servers.forEach((server: JsonValue) => {
      if (!isJsonObject(server)) {
        return
      }

      const serverUrl = stringifyJsonValue(server.url)
      markdown += `- ${serverUrl}`

      if (server.description) {
        markdown += ` - ${stringifyJsonValue(server.description)}`
      }

      markdown += '\n'
    })
    markdown += '\n'
  }

  if (data.paths) {
    markdown += '## API Endpoints\n\n'
    Object.entries(data.paths).forEach(([path, methods]: [string, JsonValue]) => {
      markdown += `### \`${path}\`\n\n`
      if (isJsonObject(methods)) {
        Object.entries(methods).forEach(([method, spec]: [string, JsonValue]) => {
          if (!isJsonObject(spec)) {
            return
          }

          markdown += `#### ${method.toUpperCase()}\n\n`
          if (spec.summary) {
            markdown += `${stringifyJsonValue(spec.summary)}\n\n`
          }
          if (spec.description) {
            markdown += `${stringifyJsonValue(spec.description)}\n\n`
          }
        })
      }
    })
  }

  return markdown
}

function formatAsConfig(data: JsonObject, context: ProcessingContext): string {
  const name =
    typeof data.name === 'string' && data.name.trim().length > 0
      ? data.name
      : context.filename.replace('.json', '')
  const description =
    typeof data.description === 'string' && data.description.trim().length > 0
      ? data.description
      : 'Configuration file documentation.'

  let markdown = `# ${name}\n\n`
  markdown += `${description}\n\n`

  if (data.version) {
    markdown += `**Version:** ${stringifyJsonValue(data.version)}\n\n`
  }

  // Format main configuration sections
  const ignoredKeys = ['name', 'version', 'description']
  const sections = Object.entries(data).filter(([key]) => !ignoredKeys.includes(key))

  sections.forEach(([key, value]) => {
    markdown += `## ${formatSectionTitle(key)}\n\n`
    markdown += formatConfigValue(value)
    markdown += '\n\n'
  })

  return markdown
}

function formatAsSchema(data: DataSchema, _context: ProcessingContext): string {
  const title = data.title || 'Data Schema'
  const description = data.description || 'Data schema documentation.'

  let markdown = `# ${title}\n\n`
  markdown += `${description}\n\n`

  if (data.type) {
    markdown += `**Type:** ${data.type}\n\n`
  }

  if (data.properties) {
    markdown += '## Properties\n\n'
    Object.entries(data.properties).forEach(([prop, spec]: [string, JsonValue]) => {
      if (!isJsonObject(spec)) {
        return
      }

      markdown += `### \`${prop}\`\n\n`
      if (spec.type) {
        markdown += `**Type:** ${stringifyJsonValue(spec.type)}\n\n`
      }
      if (spec.description) {
        markdown += `${stringifyJsonValue(spec.description)}\n\n`
      }
      if (spec.example !== undefined) {
        markdown += `**Example:** \`${stringifyJsonValue(spec.example)}\`\n\n`
      }
    })
  }

  return markdown
}

function formatAsGenericJSON(data: JsonValue, context: ProcessingContext): string {
  const filename = context.filename.replace('.json', '')
  const title = formatSectionTitle(filename)

  let markdown = `# ${title}\n\n`
  markdown += 'JSON data documentation.\n\n'

  // Create a formatted representation of the JSON structure
  markdown += '## Data Structure\n\n'
  markdown += '```json\n'
  markdown += JSON.stringify(data, null, 2)
  markdown += '\n```\n\n'

  // If it's a flat object, create a properties table
  if (typeof data === 'object' && data !== null && !Array.isArray(data) && isFlattish(data)) {
    markdown += '## Properties\n\n'
    markdown += '| Property | Type | Value |\n'
    markdown += '|----------|------|-------|\n'

    Object.entries(data).forEach(([key, value]) => {
      const type = Array.isArray(value) ? 'array' : typeof value
      const displayValue = stringifyJsonValue(value)
      markdown += `| ${key} | ${type} | ${displayValue} |\n`
    })
  }

  return markdown
}

/**
 * JSON file processor that converts JSON files to formatted markdown
 */
export const jsonProcessor: FileProcessor = {
  extensions: ['.json'],
  metadata: {
    name: 'json-processor',
    version: '1.0.0',
    description: 'Converts JSON files to formatted markdown documentation',
    author: 'Starlight Document Converter',
  },

  validate: (content: string): boolean => {
    try {
      JSON.parse(content)
      return true
    } catch {
      return false
    }
  },

  process: (content: string, context: ProcessingContext): string => {
    try {
      const jsonData = JSON.parse(content)

      // Generate markdown based on JSON structure
      let markdown = ''

      // Try to determine JSON type and format accordingly
      if (isAPISpec(jsonData)) {
        markdown = formatAsAPISpec(jsonData, context)
      } else if (isConfigFile(jsonData)) {
        markdown = formatAsConfig(jsonData, context)
      } else if (isDataSchema(jsonData)) {
        markdown = formatAsSchema(jsonData, context)
      } else {
        markdown = formatAsGenericJSON(jsonData, context)
      }

      return markdown
    } catch (error) {
      throw new Error(`Failed to process JSON: ${formatUnknownError(error)}`, { cause: error })
    }
  },
}
