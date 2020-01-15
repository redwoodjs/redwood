const SplashPage = ({ isRedwood }) => (
  <>
    <style
      dangerouslySetInnerHTML={{
        __html: `
          div.logo {
            width: 67px;
            margin: 30px 0 15px 0;
          }
          h1 {
            font-size: 30px;
            margin: 0;
            font-family: serif;
          }
          div.body {
            width: 500px;
            margin: 40px auto 0 auto;
          }
          p {
            font-size: 16px;
          }
          div.code {
            background-color: #333;
            border: 1px solid black;
            border-radius: 4px;
            padding: 5px;
          }
          code {
            font-family: monospace;
            font-size: 14px;
            color: #888;
          }
          code div {
            margin: 2px 0;
          }
          code span {
            color: white;
          }
        `,
      }}
    />
    {isRedwood && (
      <center>
        <div className="logo">
          <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 62.13 67.3"><defs><style>{'.cls-1{fill:#db343b;}'}</style></defs><title>logo</title><path className="cls-1" d="M277.92,376.08,291.08,385a1.87,1.87,0,0,0,1,.31,1.81,1.81,0,0,0,1-.31l13.17-8.95A1.78,1.78,0,0,0,306,373l-13.16-6.47a1.82,1.82,0,0,0-1.58,0L278.14,373a1.78,1.78,0,0,0-.22,3.08Zm18.63,11.72a1.8,1.8,0,0,0,.78,1.48l10.55,7.16a1.78,1.78,0,0,0,2.19-.14l8.85-7.86a1.78,1.78,0,0,0-.08-2.73L310.39,379a1.8,1.8,0,0,0-2.12-.08l-10.94,7.43A1.8,1.8,0,0,0,296.55,387.8ZM270.9,399.05a1.79,1.79,0,0,0-.59-1.51l-4-3.53a1.74,1.74,0,0,0-1.66-.39,1.78,1.78,0,0,0-1.23,1.18l-2.33,7.28a1.79,1.79,0,0,0,2.62,2.08l6.3-3.75A1.75,1.75,0,0,0,270.9,399.05Zm33.58-.75-11.39-7.74a1.8,1.8,0,0,0-2,0L279.7,398.3a1.81,1.81,0,0,0-.78,1.36,1.84,1.84,0,0,0,.6,1.46l11.38,10.11a1.79,1.79,0,0,0,1.19.45,1.8,1.8,0,0,0,1.19-.45l11.38-10.11a1.8,1.8,0,0,0,.59-1.46A1.77,1.77,0,0,0,304.48,398.3Zm-39.22-9.86,8.84,7.86a1.8,1.8,0,0,0,2.2.14l10.54-7.16a1.79,1.79,0,0,0,0-3l-10.93-7.43a1.82,1.82,0,0,0-2.13.08l-8.45,6.75a1.76,1.76,0,0,0-.67,1.35A1.82,1.82,0,0,0,265.26,388.44Zm54.23,19.15-9-5.35a1.78,1.78,0,0,0-2.1.2l-11,9.75a1.79,1.79,0,0,0,.52,3l15.26,6.14a1.72,1.72,0,0,0,.66.13,1.79,1.79,0,0,0,1.64-1.06l4.73-10.52A1.79,1.79,0,0,0,319.49,407.59Zm3.58-5.51-2.33-7.28a1.81,1.81,0,0,0-1.23-1.19,1.79,1.79,0,0,0-1.66.39l-4,3.54a1.77,1.77,0,0,0-.59,1.51,1.74,1.74,0,0,0,.86,1.36l6.31,3.75a1.76,1.76,0,0,0,.91.25,1.79,1.79,0,0,0,1.71-2.33Zm-35.71,11.75a1.78,1.78,0,0,0-.57-1.64l-11-9.75a1.78,1.78,0,0,0-2.1-.2l-9,5.35a1.81,1.81,0,0,0-.72,2.28l4.74,10.52a1.79,1.79,0,0,0,2.3.93l15.25-6.14A1.79,1.79,0,0,0,287.36,413.83ZM305,421.75l-12.24-4.92a1.82,1.82,0,0,0-1.34,0l-12.24,4.92a1.82,1.82,0,0,0-1.12,1.46,1.78,1.78,0,0,0,.77,1.67l12.24,8.45a1.81,1.81,0,0,0,1,.32,1.78,1.78,0,0,0,1-.32l12.25-8.45a1.77,1.77,0,0,0,.76-1.67A1.79,1.79,0,0,0,305,421.75Z" transform="translate(-261.02 -366.35)"/></svg>
        </div>
        <h1>Welcome to Redwood!</h1>
      </center>
    )}
    {!isRedwood &&
      <center>
        <h1>Empty Routes!</h1>
      </center>
    }
    <div className="body">
      <p>Thanks for choosing Redwood Router! The first thing you'll
      need to do is specify a route:</p>
      <div className="code"><code>
        <div>{`import { Router, Route } from '@redwoodjs/router'`}</div>
        <div>&nbsp;</div>
        <div>{`<Router>`}</div>
        <div>&nbsp;&nbsp;<span>{`<Route path="/" page={HomePage} name="home" />`}</span></div>
        <div>&nbsp;&nbsp;{`<Route notfound page={NotFoundPage} />`}</div>
        <div>{`</Router>`}</div>
      </code></div>
    </div>
  </>
)

export default SplashPage
