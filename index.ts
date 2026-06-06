/**
 * block-no-verify — Pi Extension
 *
 * Prevents AI agents from bypassing local git hooks by delegating
 * to the block-no-verify CLI for all detection logic.
 *
 * Blocks: --no-verify flags, core.hooksPath overrides, and
 * GitHub MCP tool calls that write through the API.
 *
 * Usage:
 *   pi install ./block-no-verify
 *   # or
 *   pi -e ./block-no-verify
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const RUNTIME = process.execPath;

const require = createRequire(import.meta.url);

function findBinary(): string | null {
	try {
		// Resolve the package entry, then navigate to the CLI binary
		const entryPath = require.resolve("block-no-verify");
		const pkgDir = dirname(entryPath);
		return resolve(pkgDir, "cli.js");
	} catch {
		return null;
	}
}

export default function (pi: ExtensionAPI) {
	const binary = findBinary();

	pi.on("session_start", async (_event, ctx) => {
		if (!binary) {
			ctx.ui.notify(
				"⚠ block-no-verify not found — git hook bypasses will NOT be blocked\n" +
				"  Install: cd " + dirname(new URL(import.meta.url).pathname) + " && bun install",
				"warn",
			);
		}
	});

	if (!binary) return;

	pi.on("tool_call", async (event) => {
		const payload = JSON.stringify({
			tool_name: event.toolName,
			tool_input: event.input,
		});

		try {
			execSync(`"${RUNTIME}" "${binary}"`, {
				input: payload,
				stdio: ["pipe", "pipe", "pipe"],
				timeout: 5000,
			});
			// Exit 0 = allowed
			return undefined;
		} catch (err: unknown) {
			const status = (err as { status?: number }).status;
			if (status === 2) {
				const stderr = (err as { stderr?: Buffer }).stderr;
				const reason = stderr?.toString().trim();
				return {
					block: true,
					reason: `❌ ${reason || "Blocked by block-no-verify"}`,
				};
			}
			// Exit 1 = error in block-no-verify itself — don't block the agent
			return undefined;
		}
	});
}
