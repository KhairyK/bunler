#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../bunler.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parsing args
const args = process.argv.slice(2);

function showVersion() {
  console.log("bunler v1.0.0");
}

function bundling() {
  console.log("🚀 Bunler is bundling...");

  let collectedCSS = "";
  let processedFiles = new Set();

  function processJS(filePath) {
    const absPath = path.resolve(filePath);

    if (processedFiles.has(absPath)) return "";
    processedFiles.add(absPath);

    let content = fs.readFileSync(absPath, "utf8");

    // import CSS
    const cssRegex = /import\s+['"](.+\.css)['"];/g;
    content = content.replace(cssRegex, (match, cssPath) => {
      const cssFullPath = path.join(path.dirname(absPath), cssPath);
      let cssContent = fs.readFileSync(cssFullPath, "utf8");
      collectedCSS += cssContent + "\n";
      return "";
    });

    // import JS
    const jsRegex = /import\s+.*?['"](.+\.js)['"];/g;
    content = content.replace(jsRegex, (match, jsPath) => {
      const jsFullPath = path.join(path.dirname(absPath), jsPath);
      return processJS(jsFullPath);
    });

    if (config.minify) {
      content = content.replace(/\s+/g, " ").trim();
    }

    return content + "\n";
  }

  // Pastikan folder dist
  const distDir = path.dirname(config.outJS);
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  // Bundle JS
  const bundledJS = processJS(config.entry);
  fs.writeFileSync(config.outJS, bundledJS, "utf8");
  console.log(`✅ JS bundled: ${config.outJS}`);

  // Minify CSS
  if (config.minify) collectedCSS = collectedCSS.replace(/\s+/g, " ").trim();
  fs.writeFileSync(config.outCSS, collectedCSS, "utf8");
  console.log(`✅ CSS bundled: ${config.outCSS}`);
}

// CLI commands
if (args.includes("--version")) {
  showVersion();
} else if (args.includes("--bundling")) {
  bundling();
} else {
  console.log("bunler CLI");
  console.log("Usage:");
  console.log("  bunler --bundling   # Run bundler");
  console.log("  bunler --version    # Show version");
}
