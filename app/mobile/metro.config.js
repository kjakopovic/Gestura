const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
let config = getDefaultConfig(projectRoot);

// Include your ONNX (and wasm) as assets
config.resolver.assetExts = [...config.resolver.assetExts, "onnx", "wasm"];

config.resolver.extraNodeModules = {
  "onnxruntime-react-native": path.resolve(
    projectRoot,
    "node_modules/onnxruntime-react-native"
  ),
  ...config.resolver.extraNodeModules,
};

// Wrap with NativeWind (must be the final export)
module.exports = withNativeWind(config, {
  input: "./app/globals.css",
});
