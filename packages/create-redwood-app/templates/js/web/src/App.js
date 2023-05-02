import { FatalErrorBoundary, RedwoodProvider } from "@redwoodjs/web";
import { RedwoodApolloProvider } from "@redwoodjs/web/apollo";
import FatalErrorPage from "src/pages/FatalErrorPage";
import Routes from "src/Routes";
import "./index.css";
const App = () => /* @__PURE__ */ React.createElement(FatalErrorBoundary, { page: FatalErrorPage }, /* @__PURE__ */ React.createElement(RedwoodProvider, { titleTemplate: "%PageTitle | %AppTitle" }, /* @__PURE__ */ React.createElement(RedwoodApolloProvider, null, /* @__PURE__ */ React.createElement(Routes, null))));
export default App;
