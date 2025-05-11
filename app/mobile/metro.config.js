const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
let config = getDefaultConfig(projectRoot);

// Treat .onnx and .wasm as static assets
config.resolver.assetExts = [...config.resolver.assetExts, "onnx", "wasm"];

// Fix up any extraNodeModules
config.resolver.extraNodeModules = {
  "onnxruntime-react-native": path.resolve(
    projectRoot,
    "node_modules/onnxruntime-react-native"
  ),
  ...config.resolver.extraNodeModules,
};

// Wrap with NativeWind
module.exports = withNativeWind(config, {
  input: "./app/globals.css",
});
