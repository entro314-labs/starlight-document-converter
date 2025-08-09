import type { FileProcessor, ProcessingContext } from '../types.js';

// JSON data structure interfaces
interface JsonObject {
  [key: string]: JsonValue;
}

type JsonArray = JsonValue[];

type JsonValue = string | number | boolean | null | undefined | JsonObject | JsonArray;

interface OpenAPIInfo extends JsonObject {
  title?: string;
  description?: string;
  version?: string;
}

interface OpenAPISpec extends JsonObject {
  openapi?: string;
  swagger?: string;
  info?: OpenAPIInfo;
  paths?: JsonObject;
  servers?: JsonArray;
}

interface DataSchema extends JsonObject {
  $schema?: string;
  type?: string;
  properties?: JsonObject;
  title?: string;
  description?: string;
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
    author: 'Starlight Document Converter'
  },
  
  validate: (content: string): boolean => {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  },
  
  process: (content: string, context: ProcessingContext): string => {
    try {
      const jsonData = JSON.parse(content);
      
      // Generate markdown based on JSON structure
      let markdown = '';
      
      // Try to determine JSON type and format accordingly
      if (isAPISpec(jsonData)) {
        markdown = formatAsAPISpec(jsonData, context);
      } else if (isConfigFile(jsonData)) {
        markdown = formatAsConfig(jsonData, context);
      } else if (isDataSchema(jsonData)) {
        markdown = formatAsSchema(jsonData, context);
      } else {
        markdown = formatAsGenericJSON(jsonData, context);
      }
      
      return markdown;
    } catch (error) {
      throw new Error(`Failed to process JSON: ${error}`);
    }
  }
};

function isAPISpec(data: JsonValue): data is OpenAPISpec {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as JsonObject;
  return !!(obj.openapi || obj.swagger || (obj.paths && typeof obj.paths === 'object'));
}

function isConfigFile(data: JsonValue): data is JsonObject {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as JsonObject;
  return !!(obj.name || obj.version || obj.scripts || obj.dependencies || obj.config);
}

function isDataSchema(data: JsonValue): data is DataSchema {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as JsonObject;
  return !!(obj.$schema || obj.type === 'object' || obj.properties);
}

function formatAsAPISpec(data: OpenAPISpec, _context: ProcessingContext): string {
  const title = data.info?.title || 'API Specification';
  const description = data.info?.description || 'API documentation generated from OpenAPI specification.';
  const version = data.info?.version || '1.0.0';
  
  let markdown = `# ${title}\n\n`;
  markdown += `${description}\n\n`;
  markdown += `**Version:** ${version}\n\n`;
  
  if (data.servers && Array.isArray(data.servers) && data.servers.length > 0) {
    markdown += `## Servers\n\n`;
    (data.servers as JsonArray).forEach((server: JsonValue) => {
      const serverObj = server as JsonObject;
      markdown += `- ${serverObj.url}`;
      if (serverObj.description) {
        markdown += ` - ${serverObj.description}`;
      }
      markdown += '\n';
    });
    markdown += '\n';
  }
  
  if (data.paths) {
    markdown += `## API Endpoints\n\n`;
    Object.entries(data.paths as JsonObject).forEach(([path, methods]: [string, JsonValue]) => {
      markdown += `### \`${path}\`\n\n`;
      if (typeof methods === 'object' && methods !== null && !Array.isArray(methods)) {
        Object.entries(methods as JsonObject).forEach(([method, spec]: [string, JsonValue]) => {
          const specObj = spec as JsonObject;
          markdown += `#### ${method.toUpperCase()}\n\n`;
          if (specObj.summary) {
            markdown += `${specObj.summary}\n\n`;
          }
          if (specObj.description) {
            markdown += `${specObj.description}\n\n`;
          }
        });
      }
    });
  }
  
  return markdown;
}

function formatAsConfig(data: JsonObject, context: ProcessingContext): string {
  const name = data.name || context.filename.replace('.json', '');
  const description = data.description || 'Configuration file documentation.';
  
  let markdown = `# ${name}\n\n`;
  markdown += `${description}\n\n`;
  
  if (data.version) {
    markdown += `**Version:** ${data.version}\n\n`;
  }
  
  // Format main configuration sections
  const ignoredKeys = ['name', 'version', 'description'];
  const sections = Object.entries(data).filter(([key]) => !ignoredKeys.includes(key));
  
  sections.forEach(([key, value]) => {
    markdown += `## ${formatSectionTitle(key)}\n\n`;
    markdown += formatConfigValue(value);
    markdown += '\n\n';
  });
  
  return markdown;
}

function formatAsSchema(data: DataSchema, _context: ProcessingContext): string {
  const title = data.title || 'Data Schema';
  const description = data.description || 'Data schema documentation.';
  
  let markdown = `# ${title}\n\n`;
  markdown += `${description}\n\n`;
  
  if (data.type) {
    markdown += `**Type:** ${data.type}\n\n`;
  }
  
  if (data.properties) {
    markdown += `## Properties\n\n`;
    Object.entries(data.properties as JsonObject).forEach(([prop, spec]: [string, JsonValue]) => {
      const specObj = spec as JsonObject;
      markdown += `### \`${prop}\`\n\n`;
      if (specObj.type) {
        markdown += `**Type:** ${specObj.type}\n\n`;
      }
      if (specObj.description) {
        markdown += `${specObj.description}\n\n`;
      }
      if (specObj.example !== undefined) {
        markdown += `**Example:** \`${specObj.example}\`\n\n`;
      }
    });
  }
  
  return markdown;
}

function formatAsGenericJSON(data: JsonValue, context: ProcessingContext): string {
  const filename = context.filename.replace('.json', '');
  const title = formatSectionTitle(filename);
  
  let markdown = `# ${title}\n\n`;
  markdown += `JSON data documentation.\n\n`;
  
  // Create a formatted representation of the JSON structure
  markdown += `## Data Structure\n\n`;
  markdown += '```json\n';
  markdown += JSON.stringify(data, null, 2);
  markdown += '\n```\n\n';
  
  // If it's a flat object, create a properties table
  if (typeof data === 'object' && data !== null && !Array.isArray(data) && isFlattish(data)) {
    markdown += `## Properties\n\n`;
    markdown += '| Property | Type | Value |\n';
    markdown += '|----------|------|-------|\n';
    
    Object.entries(data as JsonObject).forEach(([key, value]) => {
      const type = Array.isArray(value) ? 'array' : typeof value;
      const displayValue = typeof value === 'string' ? value : JSON.stringify(value);
      markdown += `| ${key} | ${type} | ${displayValue} |\n`;
    });
  }
  
  return markdown;
}

function formatSectionTitle(key: string): string {
  return key.replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatConfigValue(value: JsonValue): string {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(item => `- ${item}`).join('\n');
    } else {
      return Object.entries(value as JsonObject)
        .map(([k, v]) => `- **${k}**: ${JSON.stringify(v)}`)
        .join('\n');
    }
  }
  return String(value);
}

function isFlattish(obj: JsonValue): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return Object.values(obj as JsonObject).every(value => 
    typeof value !== 'object' || value === null || Array.isArray(value)
  );
}