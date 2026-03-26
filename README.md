<p align="center">
  <img src="assets/banner.svg" alt="Bark" width="800">
</p>

<p align="center">
  <strong>AI-Powered Risk Assessment for Claude Code</strong><br>
  <sub>A good dog that barks at danger so you don't have to watch the screen all day.</sub>
</p>

<p align="center">
  English | <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center">
  <video src="https://github.com/user-attachments/assets/dc618b98-f39a-4aee-b72f-e60b842c2910" width="800" controls autoplay muted loop></video>
</p>

## The Problem

You: *runs 5 Claude Code sessions in parallel, goes to make coffee*

Claude: "Can I read this file?" ✋ "Can I edit this file?" ✋ "Can I run `ls`?" ✋

You: *spills coffee, runs back to click "Allow" 47 times*

There has to be a better way.

## How It Works

Bark is like a well-trained guard dog for your Claude Code sessions. It sniffs every tool call and decides:

- `ls -la` → *tail wag, no bark* 🐕
- `git push` → *small woof* 🐕 (notification)
- `rm -rf /` → *LOUD BARK + BLOCKS THE DOOR* 🐕‍🦺🚨

| Scenario | Action | Latency |
|---|---|---|
| Read-only tools (Read, Grep, Glob...) | Silent allow | 0s |
| Normal file edits | Silent allow | 0s |
| Bash commands (cached) | Auto allow / notify | 0s |
| Bash commands (first time) | AI risk assessment | ~7s |
| High-risk operations | System notification + terminal confirmation | — |

### Risk Levels

- **Level 0** (Low) — Silent allow. Read-only commands, builds, tests.
- **Level 1** (Medium) — System notification + auto allow. Package installs, git push, file moves.
- **Level 2** (High) — Notification + sound + terminal confirmation. Force push, `rm -rf /`, database drops, remote code execution.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/shaominngqing/bark-claude-code-hook/main/install.sh | bash
```

Or clone and install locally:

```bash
git clone https://github.com/shaominngqing/bark-claude-code-hook.git
bash bark-claude-code-hook/install.sh
```

> Takes effect in new Claude Code sessions automatically.

## Usage

```bash
bark status         # Show status
bark on / off       # Enable / disable
bark toggle         # Toggle on/off
bark test <cmd>     # Test a command's risk level
bark test -v <cmd>  # Test with verbose debug output
bark test -n <cmd>  # Dry-run: show assessment, always allow
bark cache [clear]  # View / clear cache
bark log [N|clear]  # View / clear logs
bark stats          # Show statistics dashboard
bark rules [edit]   # View / edit custom rules
bark update         # Update to latest version
bark uninstall      # Completely uninstall
```

### Examples

```bash
bark test ls -la
# ✅ allow  ([Low] Read-only directory listing)  [0.0s]  — good boy, no bark

bark test git push
# ✅ allow  ([Medium] Push to remote, recoverable)  [7.1s]  — small woof

bark test rm -rf /
# 🚨 ask  ([High] Extremely dangerous recursive root deletion)  [6.8s]  — BARK BARK BARK
```

## Architecture

```
Claude Code tool call
        │
        ▼
┌──────────────────────────────┐
│  Layer 1: Fast Rules         │  Deterministic tool-level checks
│  Read/Grep/Glob → allow     │  No Bash command rules here
│  Normal file edits → allow  │
└──────────┬───────────────────┘
           │ miss
           ▼
┌──────────────────────────────┐
│  Layer 1.5: Custom Rules     │  User-defined patterns
│  bark.conf             │  allow / notify / block
└──────────┬───────────────────┘
           │ miss
           ▼
┌──────────────────────────────┐
│  Layer 2: Cache Lookup       │  Commands normalized to patterns
│  "rm -rf" → reuse last      │  md5 hash, 24h TTL
│  AI judgment                 │
└──────────┬───────────────────┘
           │ cache miss
           ▼
┌──────────────────────────────┐
│  Layer 3: AI Assessment      │  claude -p understands semantics
│  Returns risk level + reason │  Result cached for next time
└──────────┬───────────────────┘
           │
           ▼
  Level 0 → Silent allow
  Level 1 → System notification + allow
  Level 2 → Notification + sound + terminal confirmation
```

### Custom Rules

Create `~/.claude/hooks/bark.conf` to define your own rules (checked before AI assessment):

```conf
# Format: action: pattern (* wildcard supported)
allow: npm test
allow: npm run *
allow: make *
notify: git push
block: rm -rf /
```

**Design philosophy**: No hardcoded Bash rules. AI understands command semantics better than regex matching. Cache ensures zero latency for repeated command patterns.

## Bark vs Other Permission Modes

Claude Code offers several built-in permission modes, but each has trade-offs:

| Mode | Command | What it does | Limitation |
|---|---|---|---|
| **Default** | `claude` | Asks permission for every tool call | Constant interruptions |
| **Accept Edits** | `claude -y` | Auto-allows file edits, still asks for Bash | Bash commands still blocked |
| **Auto Mode** | `claude --permission-mode auto` | Rule-based classifier (Team plan only) | No AI understanding, no caching, not customizable |
| **Skip Permissions** | `claude --dangerously-skip-permissions` | Allows everything | Zero safety — dangerous |
| **Bark** 🐕 | `claude` (with Bark installed) | AI-powered semantic assessment | — |

### Why Bark?

| Feature | Auto Mode | Bark |
|---|---|---|
| **Availability** | Team plan only | Free & open source |
| **Assessment** | Static rule matching | AI semantic understanding |
| **Custom rules** | Not supported | `bark.conf` — allow/notify/block |
| **Caching** | None | 24h TTL, same pattern = 0ms |
| **Statistics** | None | `bark stats` — full dashboard |
| **Logs** | None | `bark log` — colored, filterable |
| **Notifications** | None | macOS/Linux system notifications |
| **Offline testing** | Not possible | `bark test <cmd>` |

Bark fills the gap between "approve everything manually" and "skip all safety checks". It understands *what* commands do, not just *what they look like*.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- `jq` in PATH (`brew install jq` / `apt install jq`)
- `claude` CLI (required for AI assessment layer)
- macOS (system notifications) or Linux (requires `notify-send`)

## Uninstall

```bash
bark uninstall
# The dog goes home 🐕💤
```

## FAQ

**Q: Will Bark slow down my Claude Code?**
A: For safe operations — zero latency. For Bash commands, first-time AI assessment takes ~7s, then cached forever (24h). Your dog learns fast.

**Q: What if Bark blocks something I actually want to run?**
A: High-risk operations aren't denied — they just require your confirmation. Bark asks "Are you sure?", not "No."

**Q: Does Bark work with `--dangerously-skip-permissions`?**
A: That flag skips ALL hooks including Bark. It's like telling your guard dog to take the day off while leaving the front door open. Not recommended.

**Q: Why not just use Auto Mode?**
A: Auto Mode is great! But it requires a Team plan, has no caching, no stats, no custom rules, and uses static pattern matching instead of AI. Bark is the free-range organic alternative. 🌿

## License

MIT — Free as in freedom, free as in beer, free as in "the dog doesn't charge for guarding your house." 🐕
