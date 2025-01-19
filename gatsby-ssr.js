import React from "react"

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
