import webpack from "webpack";
import { ReplaceSource } from "webpack-sources";
import * as path from "path";
import HtmlWebpackPlugin, { } from "html-webpack-plugin";

const CONST_WEB_COMPONENT_ENTRY_KEY = "webComponentEntry:";
const CONST_USE_WEB_COMPONENT_KEY = "useWebComponent:";
const CONST_INLINE_STYLE_PLACEHOLDER = '"/*__WebComponentInlineStyle__*/"';

const isCss = (fileName: string) => new RegExp(".css$").test(fileName);
// const isWebComponentJs = (fileName: string) =>
//   new RegExp("webComponent.*.chunk.js$").test(fileName);

let webComponentEntry: string = "";
let useWebComponent: boolean = false;
let htmlWebpackPlugin: HtmlWebpackPlugin | undefined;

class WebComponentStylerPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap("WebComponentStylerPlugin_compilation", (compilation) => {
      if (htmlWebpackPlugin && typeof ((htmlWebpackPlugin.constructor as any).getHooks) === 'function') {
        const htmlWebpackPluginhooks: HtmlWebpackPlugin.Hooks = (htmlWebpackPlugin.constructor as any).getHooks(compilation);
        htmlWebpackPluginhooks.beforeAssetTagGeneration.tap('WebComponentStylerPlugin_beforeAssetTagGeneration', (data) => {
          if (useWebComponent) {
            data.assets.js = data.assets.js.filter((jsPath: string) => {
              return !jsPath.includes("main") || jsPath.includes("bundle");
            });
            data.assets.css = data.assets.css.filter((cssPath: string) => {
              return !cssPath.includes("main") || cssPath.includes("bundle");
            });
          } else {
            data.assets.js = data.assets.js.filter((jsPath: string) => {
              return !jsPath.includes("webComponent");
            });
            data.assets.css = data.assets.css.filter((cssPath: string) => {
              return !cssPath.includes("webComponent");
            });
          }
          return data;
        });
      }

      compilation.hooks.optimizeChunkAssets.tap("WebComponentStylerPlugin_optimizeChunkAssets", chunks => {
        let styleString = "";
        chunks.map(chunk => {
          chunk.files.map(file => {
            if (isCss(file) && file.includes('webComponent')) {
              styleString += compilation.assets[file].source();
            }
          });
        });
        chunks.map(chunk => {
          chunk.files.map(file => {
            const source = compilation.assets[file].source();
            if (source.includes(CONST_INLINE_STYLE_PLACEHOLDER)) {
              const start = source.indexOf(CONST_INLINE_STYLE_PLACEHOLDER);
              compilation.updateAsset(file, function (old) {
                var replaceSource = new ReplaceSource(old);
                replaceSource.replace(start, start + CONST_INLINE_STYLE_PLACEHOLDER.length - 1, "`" + styleString + "`");
                var newSource = replaceSource.source();
                return replaceSource;
              });
            }
          });
        });
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
    webpackConfig.plugins?.forEach((plugin) => {
      if (plugin.constructor.name === "HtmlWebpackPlugin") {
        htmlWebpackPlugin = plugin;
      }
    })
  }
  return webpackConfig;
};

