const React = require('react')
const { vi } = require('vitest')

module.exports = {
  graphql: vi.fn(),
  Link: vi.fn().mockImplementation(
    ({ to, activeClassName, activeStyle, getProps, ...rest }) =>
      React.createElement('a', {
        ...rest,
        href: to,
        'data-testid': 'gatsby-link',
      })
  ),
  StaticQuery: vi.fn(),
  useStaticQuery: vi.fn(),
  navigate: vi.fn(),
  withPrefix: vi.fn(path => path),
  parsePath: vi.fn(),
}