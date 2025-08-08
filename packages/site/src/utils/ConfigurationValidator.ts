/**
 * Type-Safe Configuration Validator for Background System V3
 * 
 * Provides runtime validation of module configurations with JSON Schema,
 * type-safe error handling, and development-friendly error messages.
 */

import {
  ModuleConfiguration,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PhysicsConfiguration,
  InteractionConfiguration
} from '@/interfaces/BackgroundSystemV3'
import {
  StrictModuleConfiguration,
  ConfigurationUpdate,
  validateAndTransformConfig
} from '@/types/utilities'

// ============================================================================
// Configuration Schema Definitions
// ============================================================================

export interface ConfigurationSchema {
  readonly type: 'object'
  readonly properties: Record<string, SchemaProperty>
  readonly required: readonly string[]
  readonly additionalProperties: boolean
}

export interface SchemaProperty {
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  readonly description?: string
  readonly default?: unknown
  readonly minimum?: number
  readonly maximum?: number
  readonly minLength?: number
  readonly maxLength?: number
  readonly enum?: readonly unknown[]
  readonly items?: SchemaProperty
  readonly properties?: Record<string, SchemaProperty>
  readonly required?: readonly string[]
  readonly pattern?: string
  readonly examples?: readonly unknown[]
}

// Base configuration schema that all modules must implement
const BASE_CONFIGURATION_SCHEMA: ConfigurationSchema = {
  type: 'object',
  properties: {
    enabled: {
      type: 'boolean',
      description: 'Whether the module is enabled',
      default: true
    },
    quality: {
      type: 'string',
      description: 'Rendering quality level',
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      examples: ['low', 'medium', 'high']
    },
    colors: {
      type: 'array',
      description: 'Array of color values in hex format',
      items: {
        type: 'string',
        pattern: '^#[0-9A-Fa-f]{6}$',
        examples: ['#FF0000', '#00FF00', '#0000FF']
      },
      minLength: 1,
      maxLength: 10
    },
    animationSpeed: {
      type: 'number',
      description: 'Animation speed multiplier',
      minimum: 0.1,
      maximum: 3.0,
      default: 1.0
    }
  },
  required: ['enabled', 'quality'],
  additionalProperties: true
}

// Physics configuration schema
const PHYSICS_CONFIGURATION_SCHEMA: ConfigurationSchema = {
  type: 'object',
  properties: {
    enabled: {
      type: 'boolean',
      description: 'Enable physics simulation',
      default: true
    },
    gravity: {
      type: 'number',
      description: 'Gravity force strength',
      minimum: -2.0,
      maximum: 2.0,
      default: 0.1
    },
    damping: {
      type: 'number',
      description: 'Velocity damping factor',
      minimum: 0.0,
      maximum: 1.0,
      default: 0.9
    },
    collisionDetection: {
      type: 'boolean',
      description: 'Enable collision detection',
      default: false
    },
    forces: {
      type: 'object',
      description: 'Force configuration',
      properties: {
        attraction: {
          type: 'number',
          minimum: -10.0,
          maximum: 10.0,
          default: -1.0
        },
        repulsion: {
          type: 'number',
          minimum: 0.0,
          maximum: 10.0,
          default: 3.0
        },
        centering: {
          type: 'number',
          minimum: 0.0,
          maximum: 1.0,
          default: 0.1
        }
      },
      required: ['attraction', 'repulsion', 'centering'],
      additionalProperties: false
    }
  },
  required: ['enabled', 'forces'],
  additionalProperties: false
}

// Interaction configuration schema
const INTERACTION_CONFIGURATION_SCHEMA: ConfigurationSchema = {
  type: 'object',
  properties: {
    enableDrag: {
      type: 'boolean',
      description: 'Enable drag interactions',
      default: true
    },
    enableClick: {
      type: 'boolean',
      description: 'Enable click interactions',
      default: true
    },
    enableHover: {
      type: 'boolean',
      description: 'Enable hover effects',
      default: true
    },
    enableKeyboard: {
      type: 'boolean',
      description: 'Enable keyboard shortcuts',
      default: false
    },
    clickToCreate: {
      type: 'boolean',
      description: 'Allow creating nodes by clicking',
      default: false
    },
    doubleClickAction: {
      type: 'string',
      description: 'Action on double click',
      enum: ['delete', 'edit', 'clone'],
      examples: ['delete', 'edit', 'clone']
    },
    keyboardShortcuts: {
      type: 'object',
      description: 'Keyboard shortcut mappings',
      additionalProperties: {
        type: 'string'
      }
    }
  },
  required: ['enableDrag', 'enableClick', 'enableHover'],
  additionalProperties: false
}

// ============================================================================
// Validation Engine
// ============================================================================

export class ConfigurationValidator {
  private readonly schemas = new Map<string, ConfigurationSchema>()
  private readonly customValidators = new Map<string, CustomValidator>()
  
  constructor() {
    // Register default schemas
    this.registerSchema('base', BASE_CONFIGURATION_SCHEMA)
    this.registerSchema('physics', PHYSICS_CONFIGURATION_SCHEMA)
    this.registerSchema('interaction', INTERACTION_CONFIGURATION_SCHEMA)
  }
  
  // ========================================================================
  // Schema Registration
  // ========================================================================
  
  registerSchema(name: string, schema: ConfigurationSchema): void {
    this.schemas.set(name, schema)
  }
  
  registerCustomValidator(name: string, validator: CustomValidator): void {
    this.customValidators.set(name, validator)
  }
  
  // ========================================================================
  // Validation Methods
  // ========================================================================
  
  validateConfiguration(
    config: unknown,
    schemaName: string = 'base'
  ): ValidationResult {
    const schema = this.schemas.get(schemaName)
    if (!schema) {
      return {
        valid: false,
        errors: [{
          path: 'schema',
          message: `Unknown schema: ${schemaName}`,
          code: 'UNKNOWN_SCHEMA',
          severity: 'error'
        }],
        warnings: []
      }
    }
    
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Validate structure
    this.validateStructure(config, schema, '', errors, warnings)
    
    // Run custom validators
    const customValidator = this.customValidators.get(schemaName)
    if (customValidator) {
      const customResult = customValidator(config)
      errors.push(...customResult.errors)
      warnings.push(...customResult.warnings)
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  validateModuleConfiguration<T extends ModuleConfiguration>(
    config: unknown
  ): ValidationResult & { config?: T } {
    // First validate against base schema
    const baseValidation = this.validateConfiguration(config, 'base')
    
    if (!baseValidation.valid || typeof config !== 'object' || config === null) {
      return baseValidation
    }
    
    const typedConfig = config as ModuleConfiguration
    
    // Additional type-specific validations
    const additionalErrors: ValidationError[] = []
    const additionalWarnings: ValidationWarning[] = []
    
    // Validate physics configuration if present
    if ('physics' in typedConfig && typedConfig.physics) {
      const physicsValidation = this.validateConfiguration(typedConfig.physics, 'physics')
      additionalErrors.push(...physicsValidation.errors.map(e => ({
        ...e,
        path: `physics.${e.path}`
      })))
      additionalWarnings.push(...physicsValidation.warnings.map(w => ({
        ...w,
        path: `physics.${w.path}`
      })))
    }
    
    // Validate interaction configuration if present
    if ('interactions' in typedConfig && typedConfig.interactions) {
      const interactionValidation = this.validateConfiguration(typedConfig.interactions, 'interaction')
      additionalErrors.push(...interactionValidation.errors.map(e => ({
        ...e,
        path: `interactions.${e.path}`
      })))
      additionalWarnings.push(...interactionValidation.warnings.map(w => ({
        ...w,
        path: `interactions.${w.path}`
      })))
    }
    
    const allErrors = [...baseValidation.errors, ...additionalErrors]
    const allWarnings = [...baseValidation.warnings, ...additionalWarnings]
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      config: allErrors.length === 0 ? (typedConfig as T) : undefined
    }
  }
  
  // ========================================================================
  // Configuration Transformation
  // ========================================================================
  
  transformConfiguration<T extends ModuleConfiguration>(
    config: unknown,
    defaults: T
  ): T {
    if (!config || typeof config !== 'object') {
      return { ...defaults }
    }
    
    const validation = this.validateModuleConfiguration<T>(config)
    
    if (!validation.valid || !validation.config) {
      console.warn('Configuration validation failed, using defaults:', validation.errors)
      return { ...defaults }
    }
    
    // Merge with defaults, ensuring all required properties exist
    return {
      ...defaults,
      ...validation.config
    }
  }
  
  createConfigurationUpdate<T extends ModuleConfiguration>(
    current: T,
    updates: Partial<T>
  ): ConfigurationUpdate<T> {
    // Type-safe partial update with validation
    const merged = { ...current, ...updates }
    const validation = this.validateModuleConfiguration<T>(merged)
    
    if (!validation.valid) {
      throw new Error(
        `Invalid configuration update: ${validation.errors.map(e => e.message).join(', ')}`
      )
    }
    
    return updates as ConfigurationUpdate<T>
  }
  
  // ========================================================================
  // Development Helpers
  // ========================================================================
  
  getSchemaDocumentation(schemaName: string): string {
    const schema = this.schemas.get(schemaName)
    if (!schema) {
      return `Schema '${schemaName}' not found`
    }
    
    return this.generateDocumentation(schema, schemaName)
  }
  
  getConfigurationExample(schemaName: string): unknown {
    const schema = this.schemas.get(schemaName)
    if (!schema) {
      return null
    }
    
    return this.generateExample(schema)
  }
  
  // ========================================================================
  // Private Methods
  // ========================================================================
  
  private validateStructure(
    value: unknown,
    schema: ConfigurationSchema | SchemaProperty,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Type checking
    if (!this.validateType(value, schema.type)) {
      errors.push({
        path,
        message: `Expected ${schema.type}, got ${typeof value}`,
        code: 'TYPE_MISMATCH',
        severity: 'error'
      })
      return
    }
    
    // Specific type validations
    switch (schema.type) {
      case 'string':
        this.validateString(value as string, schema, path, errors, warnings)
        break
      case 'number':
        this.validateNumber(value as number, schema, path, errors, warnings)
        break
      case 'array':
        this.validateArray(value as unknown[], schema, path, errors, warnings)
        break
      case 'object':
        this.validateObject(value as Record<string, unknown>, schema, path, errors, warnings)
        break
    }
  }
  
  private validateType(value: unknown, expectedType: string): boolean {
    const actualType = Array.isArray(value) ? 'array' : typeof value
    return actualType === expectedType
  }
  
  private validateString(
    value: string,
    schema: SchemaProperty,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push({
        path,
        message: `String too short. Expected at least ${schema.minLength} characters, got ${value.length}`,
        code: 'MIN_LENGTH',
        severity: 'error'
      })
    }
    
    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push({
        path,
        message: `String too long. Expected at most ${schema.maxLength} characters, got ${value.length}`,
        code: 'MAX_LENGTH',
        severity: 'error'
      })
    }
    
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern)
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `String does not match pattern: ${schema.pattern}`,
          code: 'PATTERN_MISMATCH',
          severity: 'error'
        })
      }
    }
    
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        code: 'ENUM_MISMATCH',
        severity: 'error'
      })
    }
  }
  
  private validateNumber(
    value: number,
    schema: SchemaProperty,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!isFinite(value)) {
      errors.push({
        path,
        message: 'Number must be finite',
        code: 'NOT_FINITE',
        severity: 'error'
      })
      return
    }
    
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        path,
        message: `Number too small. Expected at least ${schema.minimum}, got ${value}`,
        code: 'MIN_VALUE',
        severity: 'error'
      })
    }
    
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({
        path,
        message: `Number too large. Expected at most ${schema.maximum}, got ${value}`,
        code: 'MAX_VALUE',
        severity: 'error'
      })
    }
  }
  
  private validateArray(
    value: unknown[],
    schema: SchemaProperty,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push({
        path,
        message: `Array too short. Expected at least ${schema.minLength} items, got ${value.length}`,
        code: 'MIN_ITEMS',
        severity: 'error'
      })
    }
    
    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push({
        path,
        message: `Array too long. Expected at most ${schema.maxLength} items, got ${value.length}`,
        code: 'MAX_ITEMS',
        severity: 'error'
      })
    }
    
    if (schema.items) {
      value.forEach((item, index) => {
        this.validateStructure(item, schema.items!, `${path}[${index}]`, errors, warnings)
      })
    }
  }
  
  private validateObject(
    value: Record<string, unknown>,
    schema: ConfigurationSchema | SchemaProperty,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!('properties' in schema) || !schema.properties) {
      return
    }
    
    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in value)) {
          errors.push({
            path: path ? `${path}.${requiredProp}` : requiredProp,
            message: `Required property '${requiredProp}' is missing`,
            code: 'REQUIRED_PROPERTY',
            severity: 'error'
          })
        }
      }
    }
    
    // Validate existing properties
    for (const [propName, propValue] of Object.entries(value)) {
      const propSchema = schema.properties[propName]
      
      if (propSchema) {
        this.validateStructure(
          propValue,
          propSchema,
          path ? `${path}.${propName}` : propName,
          errors,
          warnings
        )
      } else if (!schema.additionalProperties) {
        warnings.push({
          path: path ? `${path}.${propName}` : propName,
          message: `Unknown property '${propName}'`,
          suggestion: 'Remove this property or add it to the schema'
        })
      }
    }
  }
  
  private generateDocumentation(schema: ConfigurationSchema, name: string): string {
    const lines = [`# ${name.charAt(0).toUpperCase() + name.slice(1)} Configuration\n`]
    
    if ('properties' in schema && schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        lines.push(`## ${propName}`)
        lines.push(`Type: ${propSchema.type}`)
        
        if (propSchema.description) {
          lines.push(`Description: ${propSchema.description}`)
        }
        
        if (propSchema.default !== undefined) {
          lines.push(`Default: ${JSON.stringify(propSchema.default)}`)
        }
        
        if (propSchema.examples) {
          lines.push(`Examples: ${propSchema.examples.map(ex => JSON.stringify(ex)).join(', ')}`)
        }
        
        lines.push('') // Empty line
      }
    }
    
    return lines.join('\n')
  }
  
  private generateExample(schema: ConfigurationSchema): unknown {
    if (schema.type !== 'object' || !schema.properties) {
      return null
    }
    
    const example: Record<string, unknown> = {}
    
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propSchema.default !== undefined) {
        example[propName] = propSchema.default
      } else if (propSchema.examples && propSchema.examples.length > 0) {
        example[propName] = propSchema.examples[0]
      } else {
        example[propName] = this.getTypeDefault(propSchema.type)
      }
    }
    
    return example
  }
  
  private getTypeDefault(type: string): unknown {
    switch (type) {
      case 'string': return 'example'
      case 'number': return 0
      case 'boolean': return true
      case 'array': return []
      case 'object': return {}
      default: return null
    }
  }
}

// ============================================================================
// Custom Validator Type
// ============================================================================

export type CustomValidator = (config: unknown) => {
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

// ============================================================================
// Singleton Instance and Convenience Functions
// ============================================================================

export const configValidator = new ConfigurationValidator()

// Convenience functions for common validations
export const validateModuleConfig = <T extends ModuleConfiguration>(
  config: unknown
): ValidationResult & { config?: T } => {
  return configValidator.validateModuleConfiguration<T>(config)
}

export const transformModuleConfig = <T extends ModuleConfiguration>(
  config: unknown,
  defaults: T
): T => {
  return configValidator.transformConfiguration(config, defaults)
}

export const createConfigUpdate = <T extends ModuleConfiguration>(
  current: T,
  updates: Partial<T>
): ConfigurationUpdate<T> => {
  return configValidator.createConfigurationUpdate(current, updates)
}

// Export types for external use
export type {
  ConfigurationSchema,
  SchemaProperty
}
