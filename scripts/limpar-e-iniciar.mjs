#!/usr/bin/env node
/**
 * Remove a pasta .next (cache) e inicia o servidor de desenvolvimento.
 * Use quando houver erros de conexão ou travamentos.
 */
import { rmSync, existsSync } from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const nextDir = join(root, ".next");

if (existsSync(nextDir)) {
  try {
    rmSync(nextDir, { recursive: true });
    console.log("✓ Cache .next removido.");
  } catch (e) {
    console.warn("⚠ Não foi possível remover .next:", e.message);
    console.warn("  Feche o VS Code/Cursor e qualquer terminal que use o projeto e tente novamente.");
  }
}

console.log("Iniciando servidor em http://localhost:3000 ...");
const child = spawn("npx", ["next", "dev", "--port", "3000"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
