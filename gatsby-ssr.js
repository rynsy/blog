import React from "react"
import RootWrapper from "./src/components/RootWrapper"

// Wrap the entire app with ThemeProvider for SSR
export const wrapRootElement = ({ element }) => {
  return React.createElement(RootWrapper, null, element)
}

export function onRenderBody({ setHeadComponents }) {
  setHeadComponents([
    <script
      key="redirect-script"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var redirect = sessionStorage.redirect;
            delete sessionStorage.redirect;
            if (redirect && redirect !== location.href) {
              history.replaceState(null, null, redirect);
            }
          })();
        `,
      }}
    />,
  ])
}
