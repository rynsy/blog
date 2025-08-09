const React = require('react')
const gatsby = jest.requireActual('gatsby')

module.exports = {
  ...gatsby,
  graphql: jest.fn(),
  Link: jest.fn().mockImplementation(
    ({ to, activeClassName, activeStyle, getProps, ...rest }) =>
      React.createElement('a', {
        ...rest,
        href: to,
        'data-testid': 'gatsby-link',
      })
  ),
  StaticQuery: jest.fn(),
  useStaticQuery: jest.fn(),
  navigate: jest.fn(),
  withPrefix: jest.fn(path => path),
  parsePath: jest.fn(),
}