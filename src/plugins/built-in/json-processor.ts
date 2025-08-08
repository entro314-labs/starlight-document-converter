import type { FileProcessor, ProcessingContext } from '../types.js';

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

function isAPISpec(data: any): boolean {
  return data.openapi || data.swagger || (data.paths && typeof data.paths === 'object');
}

function isConfigFile(data: any): boolean {
  return data.name || data.version || data.scripts || data.dependencies || data.config;
}

function isDataSchema(data: any): boolean {
  return data.$schema || data.type === 'object' || data.properties;
}

function formatAsAPISpec(data: any, context: ProcessingContext): string {
  const title = data.info?.title || 'API Specification';
  const description = data.info?.description || 'API documentation generated from OpenAPI specification.';
  const version = data.info?.version || '1.0.0';
  
  let markdown = `# ${title}\n\n`;
  markdown += `${description}\n\n`;
  markdown += `**Version:** ${version}\n\n`;
  
  if (data.servers && data.servers.length > 0) {
    markdown += `## Servers\n\n`;
    data.servers.forEach((server: any) => {
      markdown += `- ${server.url}`;
      if (server.description) {
        markdown += ` - ${server.description}`;
      }
      markdown += '\n';
    });
    markdown += '\n';
  }
  
  if (data.paths) {
    markdown += `## API Endpoints\n\n`;
    Object.entries(data.paths).forEach(([path, methods]: [string, any]) => {
      markdown += `### \`${path}\`\n\n`;
      Object.entries(methods).forEach(([method, spec]: [string, any]) => {
        markdown += `#### ${method.toUpperCase()}\n\n`;
        if (spec.summary) {
          markdown += `${spec.summary}\n\n`;
        }
        if (spec.description) {
          markdown += `${spec.description}\n\n`;
        }
      });
    });
  }
  
  return markdown;
}

function formatAsConfig(data: any, context: ProcessingContext): string {
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

function formatAsSchema(data: any, context: ProcessingContext): string {
  const title = data.title || 'Data Schema';
  const description = data.description || 'Data schema documentation.';
  
  let markdown = `# ${title}\n\n`;
  markdown += `${description}\n\n`;
  
  if (data.type) {
    markdown += `**Type:** ${data.type}\n\n`;
  }
  
  if (data.properties) {
    markdown += `## Properties\n\n`;
    Object.entries(data.properties).forEach(([prop, spec]: [string, any]) => {
      markdown += `### \`${prop}\`\n\n`;
      if (spec.type) {
        markdown += `**Type:** ${spec.type}\n\n`;
      }
      if (spec.description) {
        markdown += `${spec.description}\n\n`;
      }
      if (spec.example !== undefined) {
        markdown += `**Example:** \`${spec.example}\`\n\n`;
      }
    });
  }
  
  return markdown;
}

function formatAsGenericJSON(data: any, context: ProcessingContext): string {
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
  if (typeof data === 'object' && !Array.isArray(data) && isFlattish(data)) {
    markdown += `## Properties\n\n`;
    markdown += '| Property | Type | Value |\n';
    markdown += '|----------|------|-------|\n';
    
    Object.entries(data).forEach(([key, value]) => {
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

function formatConfigValue(value: any): string {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(item => `- ${item}`).join('\n');
    } else {
      return Object.entries(value)
        .map(([k, v]) => `- **${k}**: ${JSON.stringify(v)}`)
        .join('\n');
    }
  }
  return String(value);
}

function isFlattish(obj: any): boolean {
  return Object.values(obj).every(value => 
    typeof value !== 'object' || value === null || Array.isArray(value)
  );
}