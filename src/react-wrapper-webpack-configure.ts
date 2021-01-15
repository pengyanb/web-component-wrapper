import webpack from "webpack";
import HtmlWebpackPlugin = require('html-webpack-plugin');
import * as path from "path";

const CONST_WEB_COMPONENT_ENTRY_KEY = "webComponentEntry:";
const CONST_USE_WEB_COMPONENT_KEY = "useWebComponent:";
const CONST_INLINE_STYLE_PLACEHOLDER = "/*__WebComponentInlineStyle__*/";

const isCss = (fileName: string) => new RegExp(".css$").test(fileName);
const isWebComponentJs = (fileName: string) =>
  new RegExp("webComponent.*.chunk.js$").test(fileName);

let webComponentEntry: string = "";
let useWebComponent: boolean = false;
class WebComponentStylerPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap("WebComponentStylerPlugin_compiler", (compilation) => {
      const htmlWebpackPluginhooks = HtmlWebpackPlugin.getHooks(compilation);

      htmlWebpackPluginhooks.alterAssetTags.tap("WebComponentStylerPlugin_alterAssetTags", (data) => {
        console.log("!!!!! WebComponentStylerPlugin_alterAssetTags: ", data)
        if (useWebComponent) {

        }
        return data;
      });
    });
    compiler.hooks.afterCompile.tap("WebComponentStylerPlugin_afterCompiler", (compilation) => {
      let styleString = "";
      const styleSet = new Set();
      Object.keys(compilation.assets).forEach(fileName => {
        const asset = compilation.assets[fileName];
        if (isCss(fileName) && !styleSet.has(fileName)) {
          styleSet.add(fileName);
          styleString += asset.source();
        }
      });
      Object.keys(compilation.assets).forEach(fileName => {
        const asset = compilation.assets[fileName];
        if (isWebComponentJs(fileName) && Array.isArray(asset.children)) {
          asset.children.forEach((child: any) => {
            if (child._value && child._value.indexOf(CONST_INLINE_STYLE_PLACEHOLDER) !== -1) {
              child._value = child._value.replace(
                CONST_INLINE_STYLE_PLACEHOLDER,
                styleString
              );
            }
          });
        }
      });
    });
  }
}

export const reactWrapperWebpackConfigure = (webpackConfig: webpack.Configuration) => {
  const options = process.argv.slice(2);

  options.forEach(option => {
    if (option.startsWith(CONST_WEB_COMPONENT_ENTRY_KEY)) {
      webComponentEntry = option.replace(CONST_WEB_COMPONENT_ENTRY_KEY, "");
    }
    if (option.startsWith(CONST_USE_WEB_COMPONENT_KEY)) {
      useWebComponent = option.replace(CONST_USE_WEB_COMPONENT_KEY, "").toLowerCase() === 'true';
    }
  });

  if (webComponentEntry !== "") {
    if (typeof webpackConfig.entry === 'string') {
      webpackConfig.entry = {
        main: webpackConfig.entry,
        webComponent: path.join(process.cwd(), webComponentEntry)
      }
    } else if (Array.isArray(typeof webpackConfig.entry)) {
      webpackConfig.entry = [...(webpackConfig.entry as string[]), webComponentEntry];
    } else if (typeof webpackConfig.entry === 'object' && webpackConfig.entry !== null) {
      webpackConfig.entry = {
        ...webpackConfig.entry,
        webComponent: path.join(process.cwd(), webComponentEntry)
      };
    }

    webpackConfig.plugins?.push(new WebComponentStylerPlugin());
  }
  return webpackConfig;
};

