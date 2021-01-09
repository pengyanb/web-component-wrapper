import React from 'react';
import ReactDOM from 'react-dom';
import retargetEvents from 'react-shadow-dom-retarget-events';

interface IWrapperOptions {
  useShadowDOM?: boolean;
}

export const reactWebComponentWrapper = (reactComponent: React.FunctionComponent<any> | React.ComponentClass<any>, tagName: string, options: IWrapperOptions = { useShadowDOM: true }) => {
  class WrapperElement extends HTMLElement {
    mountPoint: HTMLElement;
    renderedElement: Element | undefined;

    constructor() {
      super();
      this.mountPoint = this;
    }

    private getAttributesFrom(element: HTMLElement): any {
      const attributes: Partial<any> & React.Attributes = {};
      Array.from(element.attributes).map(attribute => {
        const camelizedKey = attribute.name.replace(/-./g, x => x[1].toUpperCase());
        attributes[camelizedKey] = attribute.value;
      });
      return attributes;
    }

    private renderReactComponent() {
      const wrapperInstance: WrapperElement = this;
      ReactDOM.render(React.createElement(reactComponent, this.getAttributesFrom(this), React.createElement('slot')), this.mountPoint, function(this: HTMLElement) {
        wrapperInstance.renderedElement = this;
      });
    }

    connectedCallback() {
      if (options?.useShadowDOM) {
        this.mountPoint = document.createElement('div');
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(this.mountPoint);
        const styleTag = document.createElement('style');
        styleTag.innerHTML = "/*__WebComponentInlineStyle__*/";
        shadowRoot.appendChild(styleTag);

        retargetEvents(shadowRoot);
      } 
      this.renderReactComponent();
    }

    attributeChangedCallback() {
      this.renderReactComponent();
    }
  }
  customElements.define(tagName, WrapperElement);
};


