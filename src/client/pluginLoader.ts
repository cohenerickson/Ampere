for (const plugin of __$ampere.config.plugins) {
  try {
    if (plugin.client) {
      __$ampere.logger.info("Loading plugin", plugin.name);
      plugin.client(window);
      __$ampere.logger.info("Loaded plugin", plugin.name);
    }
  } catch (e) {
    __$ampere.logger.error("Failed to load plugin", plugin.name, e);
  }
}
