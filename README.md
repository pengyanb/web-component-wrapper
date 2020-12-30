## Web Component Wrapper

Wrapper utility encapsulates react component in the web component.

> **WARNING**: when use with **actions/checkout@v2**, remember to fetch all history by passing the fetch-depth option
```javascript
import { reactWebComponentWrapper } from "web-component-wrapper";
import App from "./App";  // import react component

reactWebComponentWrapper(App, 'demo-app');

```

```html
<html>
  <body>
    <demo-app></demo-app>
  </body>
</html>
```

