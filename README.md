## Web Component Wrapper

Wrapper utility encapsulates react application in a web component.

### Installation

```npm
npm install --save @implicitcast/web-component-wrapper @webcomponents/webcomponentsjs @craco/craco

```

### Add Boilerplate files

1. Create file 'craco.config.js' at root path with content

```js
const {
  reactWrapperWebpackConfigure,
} = require("@implicitcast/web-component-wrapper");
module.exports = {
  webpack: {
    configure: reactWrapperWebpackConfigure,
  },
};
```

2. Create a file with path 'src/index.webcomponent.tsx'

```js
import "@webcomponents/webcomponentsjs/custom-elements-es5-adapter";
import "@webcomponents/webcomponentsjs/webcomponents-loader";
import { reactWebComponentWrapper } from "@implicitcast/web-component-wrapper";
import App from "./App";
reactWebComponentWrapper(App, "web-component-test"); // Second parameter names the webComponent
```

3. Edit 'public/index.html' file

```html
<html>
  .....
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <web-component-test></web-component-test>
    <!-- Add webComponent tag -->
  </body>
</html>
```

4. Update 'package.json' file

```js
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "start:webcomp": "craco start webComponentEntry:src/index.webcomponent.tsx useWebComponent:true",
    "build:webcomp": "craco start webComponentEntry:src/index.webcomponent.tsx useWebComponent:true"
  }
}
```

5. run npm command to start app with web-component wrapper

```npm
npm run start:webcomp
```
