#!/usr/bin/env node

/**
 * Bonsai 8B にターミナルから直接質問する
 *
 * llama-server を起動せずに、llama-cli を直接呼び出してワンショットで回答を得る。
 * バイナリは bin/ 配下を自動検索（cpu, vulkan, cuda, mac, rocm, hip）。
 *
 * 前提:
 *   - PrismML Bonsai-demo のセットアップが完了していること
 *   - Node.js がインストールされていること
 *
 * 使い方:
 *   # Bonsai-demo ディレクトリ内で実行
 *   node chat.mjs "質問文"
 *
 *   # 別の場所から実行する場合は BONSAI_DIR で Bonsai-demo の場所を指定
 *   BONSAI_DIR=/path/to/Bonsai-demo node chat.mjs "質問文"
 *
 * 例:
 *   node chat.mjs "Pythonでフィボナッチを再帰で書いて"
 *   node chat.mjs "Hello, who are you?"
 */

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// --- 設定 ---
// Bonsai-demo のルートディレクトリ（環境変数で上書き可能）
const bonsaiDir = process.env.BONSAI_DIR || ".";
// コマンドライン引数から質問文を取得
const prompt = process.argv[2];

// --- 引数チェック ---
if (!prompt) {
  console.error("使い方: node chat.mjs \"質問文\"");
  console.error("例:     node chat.mjs \"Pythonでフィボナッチを再帰で書いて\"");
  process.exit(1);
}

// --- バイナリ検索 ---
// セットアップ時の環境（CPU, GPU, OS）によって bin/ 配下のディレクトリ名が変わる
// 見つかった最初のバイナリを使う
const isWin = process.platform === "win32";
const exe = isWin ? "llama-cli.exe" : "llama-cli";
const searchDirs = ["cpu", "vulkan", "cuda", "mac", "rocm", "hip"];
let bin = null;
for (const dir of searchDirs) {
  const candidate = resolve(bonsaiDir, `bin/${dir}/${exe}`);
  if (existsSync(candidate)) {
    bin = candidate;
    break;
  }
}

// --- モデルパス ---
const model = resolve(bonsaiDir, "models/gguf/8B/Bonsai-8B.gguf");

// --- 存在チェック ---
if (!bin) {
  console.error(`バイナリが見つかりません（bin/ 内を検索: ${searchDirs.join(", ")}）`);
  console.error("PrismML Bonsai-demo のセットアップを先に実行してください");
  process.exit(1);
}

if (!existsSync(model)) {
  console.error(`モデルが見つかりません: ${model}`);
  console.error("PrismML Bonsai-demo のセットアップを先に実行してください");
  process.exit(1);
}

// --- 実行 ---
// -p: プロンプト（質問文）
// -st: シングルターン（1回だけ回答して終了）
// -c 8192: コンテキストサイズを8,192トークンに制限（メモリ節約、約1.2GB）
execFile(bin, ["-m", model, "-p", prompt, "-st", "-c", "8192"], (err, stdout, stderr) => {
  if (err) {
    console.error("実行エラー:", err.message);
    process.exit(1);
  }
  console.log(stdout);
});
