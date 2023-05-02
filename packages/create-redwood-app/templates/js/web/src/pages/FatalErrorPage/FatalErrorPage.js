let RedwoodDevFatalErrorPage = void 0
if (process.env.NODE_ENV === 'development') {
  RedwoodDevFatalErrorPage =
    require('@redwoodjs/web/dist/components/DevFatalErrorPage').DevFatalErrorPage
}
export default RedwoodDevFatalErrorPage ||
  (() =>
    /* @__PURE__ */ React.createElement(
      'main',
      null,
      /* @__PURE__ */ React.createElement('style', {
        dangerouslySetInnerHTML: {
          __html: `
              html, body {
                margin: 0;
              }
              html * {
                box-sizing: border-box;
              }
              main {
                display: flex;
                align-items: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
                text-align: center;
                background-color: #E2E8F0;
                height: 100vh;
              }
              section {
                background-color: white;
                border-radius: 0.25rem;
                width: 32rem;
                padding: 1rem;
                margin: 0 auto;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
              }
              h1 {
                font-size: 2rem;
                margin: 0;
                font-weight: 500;
                line-height: 1;
                color: #2D3748;
              }
            `,
        },
      }),
      /* @__PURE__ */ React.createElement(
        'section',
        null,
        /* @__PURE__ */ React.createElement(
          'h1',
          null,
          /* @__PURE__ */ React.createElement(
            'span',
            null,
            'Something went wrong'
          )
        )
      )
    ))
