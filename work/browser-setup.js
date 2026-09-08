const fs=require('node:fs');
let playwright;try{playwright=require('playwright')}catch{playwright=require(`${process.env.HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`)}
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
exports.chromium=playwright.chromium;exports.options={headless:true,...(fs.existsSync(chrome)?{executablePath:chrome}: {})};
