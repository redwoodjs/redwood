// See https://cameronjs.com/js for more info

import { Application } from "stimulus";
import { definitionsFromContext } from "stimulus/webpack-helpers";

const application = Application.start();
const context = require.context("./controllers", true, /\.js$/);
application.load(definitionsFromContext(context));

var Turbolinks = require('turbolinks')
Turbolinks.start()
