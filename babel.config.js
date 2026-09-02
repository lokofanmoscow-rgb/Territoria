module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Должен быть последним в списке плагинов (требование reanimated/worklets).
    plugins: ['react-native-worklets/plugin'],
  };
};
