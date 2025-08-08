module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run serve',
      startServerReadyPattern: 'Local:', 
      url: ['http://localhost:9000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        // Bundle size related metrics
        'unused-javascript': ['error', { maxNumericValue: 50000 }], // 50KB max unused JS
        'total-byte-weight': ['error', { maxNumericValue: 1000000 }], // 1MB total
        // Performance metrics
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }]
      }
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}