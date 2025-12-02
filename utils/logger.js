// [file name]: utils/logger.js
// [file content begin]
// utils/logger.js
class Logger {
  static info(message, ...args) {
    console.log(`[INFO] ${message}`, ...args);
  }

  static warn(message, ...args) {
    console.warn(`[WARN] ${message}`, ...args);
  }

  static error(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

module.exports = Logger;
//[file content end]