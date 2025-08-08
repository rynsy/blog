/**
 * ESLint Configuration for TypeScript Background System
 * 
 * Provides strict linting rules for type safety and code quality
 * with specific optimizations for the interactive background modules.
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks'
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    webworker: true
  },
  rules: {
    // TypeScript-specific rules for enhanced type safety
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': ['error', {
      allowString: false,
      allowNumber: false,
      allowNullableObject: false,
      allowNullableBoolean: false,
      allowNullableString: false,
      allowNullableNumber: false,
      allowAny: false
    }],
    
    // Performance and memory management
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'warn',
    
    // Code quality
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for props
    '@typescript-eslint/no-magic-numbers': ['warn', {
      ignore: [-1, 0, 1, 2, 60, 100, 1000],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true,
      ignoreReadonlyClassProperties: true
    }],
    
    // React-specific rules
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    'react/prop-types': 'off', // TypeScript provides prop validation
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    'no-param-reassign': ['error', { props: false }],
    
    // Import/export rules
    'no-duplicate-imports': 'error',
  },
  overrides: [
    {
      // Background module specific rules
      files: ['src/bgModules/**/*.{ts,tsx}'],
      rules: {
        // Stricter rules for background modules
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/explicit-function-return-type': 'warn',
        'no-console': ['error', { allow: ['warn', 'error'] }],
        '@typescript-eslint/prefer-readonly-parameter-types': 'warn',
        
        // Performance-critical code should avoid certain patterns
        'no-nested-ternary': 'error',
        'complexity': ['warn', { max: 10 }],
        'max-depth': ['warn', { max: 4 }],
      }
    },
    {
      // Utility and type files
      files: ['src/utils/**/*.{ts,tsx}', 'src/types/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
      }
    },
    {
      // Test files
      files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-console': 'off',
      }
    },
    {
      // Configuration files
      files: ['*.config.{js,ts}', 'gatsby-*.{js,ts}'],
      env: {
        node: true
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      }
    },
    {
      // Development tools and scripts
      files: ['scripts/**/*.js'],
      env: {
        node: true
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'commonjs'
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'public/',
    '.cache/',
    'dist/',
    'build/',
    '*.d.ts',
    'gatsby-*.js' // Generated Gatsby files
  ]
}
