import webpack from "webpack";
import { ReplaceSource } from "webpack-sources";
import * as path from "path";

const CONST_WEB_COMPONENT_ENTRY_KEY = "webComponentEntry:";
const CONST_INLINE_STYLE_PLACEHOLDER = '"' + '/*__WebComponentInlineStyle__*/' + '"';

const isCss = (fileName: string) => new RegExp(".css$").test(fileName);

let webComponentEntry: string = "";
class WebComponentStylerPlugin {
  constructor(private extra: any) { }
  apply(compiler: webpack.Compiler) {
    if (this.extra.env !== "development") {
      compiler.hooks.compilation.tap("WebComponentStylerPlugin_compilation", (compilation) => {
        compilation.hooks.optimizeChunkAssets.tap("WebComponentStylerPlugin_optimizeChunkAssets", chunks => {
          let styleString = "";
          chunks.map(chunk => {
            chunk.files.map(file => {
              if (isCss(file)) {
                styleString += compilation.assets[file].source();
              }
            });
          });
          chunks.map(chunk => {
            chunk.files.map(file => {
              const source = compilation.assets[file].source();
              if (source.includes(CONST_INLINE_STYLE_PLACEHOLDER)) {
                compilation.updateAsset(file, function (old) {
                  var replaceSource = new ReplaceSource(old);
                  const start = replaceSource.source().indexOf(CONST_INLINE_STYLE_PLACEHOLDER);
                  replaceSource.replace(start, start + CONST_INLINE_STYLE_PLACEHOLDER.length - 1, "`" + styleString + "`");
                  return replaceSource;
                });
              }
            });
          });
        });
      });
    }
  }
}

export const reactWrapperWebpackConfigure = (webpackConfig: webpack.Configuration, extra: any) => {
  const options = process.argv.slice(2);

  options.forEach(option => {
    if (option.startsWith(CONST_WEB_COMPONENT_ENTRY_KEY)) {
      webComponentEntry = option.replace(CONST_WEB_COMPONENT_ENTRY_KEY, "");
    }
  });

  if (webComponentEntry !== "") {
    webpackConfig.entry = path.join(process.cwd(), webComponentEntry);
    if (webpackConfig.output) {
      webpackConfig.output.path = path.join(process.cwd(), "webcompBuild");
      extra.paths.appBuild = webpackConfig.output.path;
    }
    webpackConfig.plugins?.push(new WebComponentStylerPlugin(extra));

    if (extra.env === "development") {
      const cssRegex = /\.css$/;
      webpackConfig.module?.rules.forEach(ruleObject => {
        ruleObject.oneOf?.forEach(rule => {
          if (rule.test && Array.isArray(rule.use) && String(rule.test) === String(cssRegex)) {
            rule.use = rule.use.map(loader => {
              if (typeof loader === "string" && loader.includes("style-loader")) {
                loader = {
                  loader: loader,
                  options: {
                    insert: (element: Element) => {
                      const findWebComponent = () => {
                        const allNodes = document.getElementsByTagName('*');
                        for (var i = 0; i < allNodes.length; i++) {
                          if (allNodes[i].shadowRoot) {
                            return allNodes[i]
                          }
                        }
                        return null;
                      };
                      const injectStyleToWebComponent = (webComp: Element) => {
                        const style = webComp.shadowRoot?.querySelector('style');
                        if (style?.innerHTML.includes("__WebComponentInlineStyle__")) {
                          style.innerHTML = element.innerHTML;
                        }
                      };

                      let webComponent = findWebComponent();
                      if (webComponent) {
                        injectStyleToWebComponent(webComponent);
                      } else {
                        const observer = new MutationObserver(() => {
                          webComponent = findWebComponent();
                          if (webComponent) {
                            injectStyleToWebComponent(webComponent);
                            observer.disconnect();
                          }
                        });
                        observer.observe(document, { childList: true, subtree: true });
                      }
                    }
                  }
                }
              }
              return loader;
            });
          }
        });
      });
    }
  }
  return webpackConfig;
};

