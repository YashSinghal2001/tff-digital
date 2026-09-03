#!/usr/bin/env node

/**
 * Verifies SMTP connectivity and authentication for the configured mailbox
 * WITHOUT sending an email — nodemailer's `verify()` only opens a
 * connection, authenticates, then closes it again.
 *
 * Safe to run any time in development. Never invoked automatically during
 * build or tests.
 *
 * Usage: npm run email:verify
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    const isQuoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (isQuoted) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();

  const host = process.env.SMTP_HOST ?? "";
  const port = Number(process.env.SMTP_PORT ?? "465");
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true;
  const user = process.env.SMTP_USER ?? "";
  const pass = process.env.SMTP_PASSWORD ?? "";

  const missing = [];
  if (!host) missing.push("SMTP_HOST");
  if (!user) missing.push("SMTP_USER");
  if (!pass) missing.push("SMTP_PASSWORD");

  if (missing.length > 0) {
    console.error(`[verify-smtp] Missing required env var(s): ${missing.join(", ")}`);
    console.error("[verify-smtp] Set them in .env.local or your shell environment.");
    process.exitCode = 1;
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  console.log(`[verify-smtp] Connecting to ${host}:${port} (secure=${secure}) as ${user}...`);

  try {
    await transporter.verify();
    console.log("[verify-smtp] OK — SMTP connection and authentication succeeded. No email was sent.");
  } catch (error) {
    console.error("[verify-smtp] FAILED —", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

main();
