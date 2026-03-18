#!/usr/bin/env node
/**
 * Remove a pasta .next (cache), mata processos nas portas 3000/3001 e inicia o servidor.
 * Use quando houver erros "EADDRINUSE" ou "This page isn't working".
 */
import { rmSync, existsSync } from "fs";
import { spawn, execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const nextDir = join(root, ".next");

async function main() {
  // Mata processos nas portas 3000 e 3001
  for (const port of [3000, 3001]) {
    try {
      const pids = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: "utf8" }).trim();
      if (pids) {
        execSync(`kill -9 ${pids} 2>/dev/null`);
        console.log(`✓ Processo na porta ${port} encerrado.`);
      }
    } catch {
      // Porta livre, ignorar
    }
  }

  // Aguarda processos liberarem arquivos antes de remover .next
  if (existsSync(nextDir)) {
    console.log("Aguardando 2s para liberar arquivos...");
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (existsSync(nextDir)) {
    try {
      rmSync(nextDir, { recursive: true });
      console.log("✓ Cache .next removido.");
    } catch (e) {
      console.warn("⚠ Não foi possível remover .next:", e.message);
      console.warn("  Feche o VS Code/Cursor e qualquer terminal que use o projeto e tente novamente.");
    }
  }

  console.log("Iniciando servidor em http://127.0.0.1:3000 ...");
  // ulimit + --turbo evita "EMFILE: too many open files" no macOS
  const cmd = "ulimit -n 10240 2>/dev/null; exec npx next dev --port 3000 --hostname 127.0.0.1 --turbo";
  const child = spawn("sh", ["-c", cmd], {
    cwd: root,
    stdio: "inherit",
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
