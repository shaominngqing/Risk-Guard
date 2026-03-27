import React, { CSSProperties } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS } from '../theme';

/**
 * Pixel-perfect Claude Code CLI UI — based on REAL terminal output.
 *
 * Real Claude Code layout:
 * - Startup: 3-line header (logo left, version/model/path right)
 * - User input: "❯ message" (blue ❯)
 * - Claude response: "⏺ text" (white filled circle)
 * - Tool call: "⏺ ToolName(args)" then "  ⎿  Running…" / "  ⎿  result"
 * - Confirm box: full-width box at bottom with title, command, options
 * - Status: "✻ Cooked for Ns" (orange asterisk)
 * - Separator: long ─── line
 */

const MONO = "'Menlo', 'SF Mono', 'Monaco', monospace";
const BG = '#1e1e1e';
const TITLE_BAR_BG = '#2a2a2a';
const TEXT = '#e0e0e0';
const DIM = '#808080';
const TOOL_GREEN = '#4ec970';
const CLAUDE_RED = '#d4634a';
const PROMPT_BLUE = '#58a6ff';
const ORANGE = '#e8915a';

// ─────────── Terminal Window ───────────
interface ClaudeTerminalProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  style?: CSSProperties;
  enterDelay?: number;
  title?: string;
}

export const ClaudeTerminal: React.FC<ClaudeTerminalProps> = ({
  children,
  width = 1300,
  height = 780,
  style,
  enterDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entered = enterDelay > 0 ? spring({
    frame: Math.max(0, frame - enterDelay),
    fps,
    config: { damping: 22, mass: 1, stiffness: 160 },
  }) : 1;

  const opacity = interpolate(entered, [0, 1], [0, 1]);
  const scl = interpolate(entered, [0, 1], [0.95, 1]);
  const ty = interpolate(entered, [0, 1], [20, 0]);

  return (
    <div style={{
      width, height, borderRadius: 10, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      opacity, transform: `translateY(${ty}px) scale(${scl})`,
      boxShadow: '0 22px 70px 4px rgba(0,0,0,0.56), 0 0 0 0.5px rgba(0,0,0,0.3)',
      ...style,
    }}>
      {/* Title bar */}
      <div style={{
        height: 36, background: TITLE_BAR_BG,
        display: 'flex', alignItems: 'center', paddingLeft: 14,
        flexShrink: 0, borderBottom: `1px solid #1a1a1a`,
      }}>
        {[
          { bg: '#ff5f57', border: '#e0443e' },
          { bg: '#febc2e', border: '#dea123' },
          { bg: '#28c840', border: '#1aab29' },
        ].map((d, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: d.bg, marginRight: 8, border: `0.5px solid ${d.border}`,
          }} />
        ))}
      </div>

      {/* Body */}
      <div style={{
        flex: 1, background: BG, padding: '16px 24px',
        fontFamily: MONO, fontSize: 15, lineHeight: 1.7, color: TEXT,
        overflow: 'hidden', position: 'relative',
      }}>
        {children}
      </div>
    </div>
  );
};

// ─────────── Startup Header (3-line, no card border) ───────────
// Real format:
//  ▐▛███▜▌   Claude Code v2.1.85
// ▝▜█████▛▘  model · API Usage Billing
//   ▘▘ ▝▝    /Users/xxx/project
export const ClaudeCodeHeader: React.FC<{
  delay?: number;
  path?: string;
  model?: string;
}> = ({ delay = 0, path = '~/project', model = 'claude-opus-4-6' }) => {
  const frame = useCurrentFrame();
  if (frame < delay) return null;

  const logoLines = [
    ' \u2590\u259B\u2588\u2588\u2588\u259C\u258C',
    '\u259D\u259C\u2588\u2588\u2588\u2588\u2588\u259B\u2598',
    '  \u2598\u2598 \u259D\u259D',
  ];
  const infoLines = [
    { text: `Claude Code v2.1.85`, color: TEXT },
    { text: `${model} · API Usage Billing`, color: DIM },
    { text: path, color: DIM },
  ];

  return (
    <ClaudeActivity delay={delay} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Logo as a single pre block — no line gaps */}
        <pre style={{
          color: CLAUDE_RED, fontFamily: MONO, fontSize: 22,
          lineHeight: 1.0, margin: 0, padding: 0,
          letterSpacing: 0,
        }}>{logoLines.join('\n')}</pre>
        {/* Info column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: TEXT, fontSize: 16, fontWeight: 600 }}>
            {infoLines[0].text}
          </span>
          <span style={{ color: DIM, fontSize: 14 }}>
            {infoLines[1].text}
          </span>
          <span style={{ color: DIM, fontSize: 14 }}>
            {infoLines[2].text}
          </span>
        </div>
      </div>
    </ClaudeActivity>
  );
};

// ─────────── User Input "❯ text" ───────────
interface InputBoxProps {
  text: string;
  delay?: number;
  typingSpeed?: number;
  submitFrame?: number;
}

export const InputBox: React.FC<InputBoxProps> = ({
  text, delay = 0, typingSpeed = 1.5, submitFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < delay) return null;

  const submitted = submitFrame != null && frame >= submitFrame;

  let chars = 0;
  if (!submitted) {
    const elapsed = frame - delay;
    let acc = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const mult = ch === ' ' ? 0.55 : ch === '"' ? 0.4 : 1.0;
      acc += 1 / (typingSpeed * mult);
      if (acc > elapsed) break;
      chars++;
    }
    chars = Math.min(chars, text.length);
  }

  const cursorOn = Math.floor(frame / Math.round(fps * 0.53)) % 2 === 0;

  return (
    <div style={{ marginTop: 10 }}>
      {/* Top separator */}
      <div style={{ height: 1, background: '#333', marginBottom: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 22 }}>
        <span style={{ color: PROMPT_BLUE, marginRight: 8, fontWeight: 600 }}>❯</span>
        {!submitted && (
          <span style={{ color: TEXT }}>{text.slice(0, chars)}</span>
        )}
        <span style={{
          display: 'inline-block', width: 2, height: 17,
          background: TEXT, marginLeft: 1,
          opacity: cursorOn ? 1 : 0,
        }} />
      </div>
      {/* Bottom separator */}
      <div style={{ height: 1, background: '#333', marginTop: 8 }} />
    </div>
  );
};

// ─────────── Submitted User Message "❯ text" ───────────
export const UserMessage: React.FC<{
  text: string;
  delay?: number;
}> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  if (frame < delay) return null;

  return (
    <ClaudeActivity delay={delay} style={{ marginBottom: 4, marginTop: 6 }}>
      <span style={{ color: PROMPT_BLUE, fontWeight: 600 }}>❯ </span>
      <span style={{ color: TEXT }}>{text}</span>
    </ClaudeActivity>
  );
};

// ─────────── Claude Response "⏺ text" ───────────
export const ClaudeResponse: React.FC<{
  text: string;
  delay?: number;
  wordsPerFrame?: number;
  style?: CSSProperties;
}> = ({ text, delay = 0, wordsPerFrame = 0.4, style: propStyle }) => {
  const frame = useCurrentFrame();
  if (frame < delay) return null;

  const elapsed = frame - delay;
  const words = text.split(' ');
  const wordsToShow = Math.min(Math.floor(elapsed * wordsPerFrame), words.length);

  return (
    <ClaudeActivity delay={delay} style={{ marginTop: 8, ...propStyle }}>
      <span style={{ color: TEXT }}>⏺ </span>
      <span style={{ color: TEXT }}>{words.slice(0, wordsToShow).join(' ')}</span>
    </ClaudeActivity>
  );
};

// ─────────── Tool Call "⏺ ToolName(args)" + "  ⎿  Running…" ───────────
export const ToolCall: React.FC<{
  tool: string;
  args: string;
  delay?: number;
  status?: 'running' | 'waiting' | 'done' | 'none';
  style?: CSSProperties;
}> = ({ tool, args, delay = 0, status = 'none', style: propStyle }) => {
  const frame = useCurrentFrame();
  if (frame < delay) return null;

  return (
    <ClaudeActivity delay={delay} style={{ marginTop: 4, ...propStyle }}>
      <div>
        <span style={{ color: TOOL_GREEN }}>⏺ </span>
        <span style={{ color: TOOL_GREEN, fontWeight: 700 }}>{tool}</span>
        <span style={{ color: DIM }}>({args})</span>
      </div>
      {status !== 'none' && (
        <div style={{ paddingLeft: 18, color: DIM, fontSize: 13 }}>
          ⎿  {status === 'running' ? 'Running…' : status === 'waiting' ? 'Waiting…' : 'Done'}
        </div>
      )}
    </ClaudeActivity>
  );
};

// ─────────── Tool Result "  ⎿  text" ───────────
export const ToolResult: React.FC<{
  text: string;
  delay?: number;
  color?: string;
  style?: CSSProperties;
}> = ({ text, delay = 0, color = DIM, style: propStyle }) => {
  const frame = useCurrentFrame();
  if (frame < delay) return null;

  return (
    <ClaudeActivity delay={delay} style={{ paddingLeft: 18, ...propStyle }}>
      <span style={{ color: DIM }}>⎿  </span>
      <span style={{ color }}>{text}</span>
    </ClaudeActivity>
  );
};

// ─────────── Thinking / Status ───────────
export const ClaudeThinking: React.FC<{
  delay?: number;
  endFrame?: number;
}> = ({ delay = 0, endFrame }) => {
  const frame = useCurrentFrame();
  if (frame < delay) return null;
  if (endFrame && frame >= endFrame) return null;

  const dots = '.'.repeat((Math.floor((frame - delay) / 8) % 3) + 1);

  return (
    <ClaudeActivity delay={delay} style={{ marginTop: 6 }}>
      <span style={{ color: ORANGE }}>✻ </span>
      <span style={{ color: DIM }}>Thinking{dots}</span>
    </ClaudeActivity>
  );
};

// ─────────── Cooked status "✻ Cooked for Ns" ───────────
export const CookedStatus: React.FC<{
  seconds: number;
  delay?: number;
}> = ({ seconds, delay = 0 }) => {
  const frame = useCurrentFrame();
  if (frame < delay) return null;

  return (
    <ClaudeActivity delay={delay} style={{ marginTop: 6 }}>
      <span style={{ color: ORANGE }}>✻ </span>
      <span style={{ color: DIM }}>Cooked for {seconds}s</span>
    </ClaudeActivity>
  );
};

// ─────────── Separator line ───────────
export const Separator: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  if (frame < delay) return null;

  return (
    <div style={{ color: '#333', marginTop: 8, marginBottom: 8, overflow: 'hidden', whiteSpace: 'nowrap' }}>
      {'─'.repeat(120)}
    </div>
  );
};

// ─────────── Confirm Box (bottom overlay) ───────────
// Real format:
// ─────────────────────────
//  Bash command
//    git init /tmp/test-repo-confirm
//    Initialize a test git repo in /tmp
//
//  This command requires approval
//
//  Do you want to proceed?
//  ❯ 1. Yes
//    2. Yes, and don't ask again for: git init:*
//    3. No
//
//  Esc to cancel · Tab to amend · ctrl+e to explain
export const ConfirmBox: React.FC<{
  tool: string;
  command: string;
  description: string;
  delay?: number;
  selected?: number; // 1, 2, or 3
}> = ({ tool, command, description, delay = 0, selected = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < delay) return null;

  const entered = spring({
    frame: frame - delay, fps,
    config: { damping: 20, mass: 0.8, stiffness: 250 },
  });
  const opacity = interpolate(entered, [0, 1], [0, 1]);
  const ty = interpolate(entered, [0, 1], [10, 0]);

  const options = [
    'Yes',
    `Yes, and don't ask again for: ${command.split(' ')[0]}:*`,
    'No',
  ];

  return (
    <div style={{
      opacity, transform: `translateY(${ty}px)`,
      marginTop: 8,
    }}>
      <div style={{ color: '#333', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: 8 }}>
        {'─'.repeat(120)}
      </div>
      <div style={{ paddingLeft: 4 }}>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 4 }}>
          {tool} command
        </div>
        <div style={{ color: PROMPT_BLUE, paddingLeft: 12, marginBottom: 2, fontSize: 13 }}>
          {command}
        </div>
        <div style={{ color: DIM, paddingLeft: 12, marginBottom: 10, fontSize: 12 }}>
          {description}
        </div>
        <div style={{ color: TEXT, marginBottom: 6, fontSize: 13 }}>
          This command requires approval
        </div>
        <div style={{ color: TEXT, marginBottom: 6, fontSize: 13 }}>
          Do you want to proceed?
        </div>
        {options.map((opt, i) => {
          const num = i + 1;
          const isSelected = num === selected;
          return (
            <div key={i} style={{
              fontSize: 13, marginBottom: 2,
              color: isSelected ? PROMPT_BLUE : DIM,
            }}>
              <span style={{ marginRight: 4 }}>{isSelected ? '❯' : ' '}</span>
              {num}. {opt}
            </div>
          );
        })}
        <div style={{ color: '#555', fontSize: 11, marginTop: 8 }}>
          Esc to cancel · Tab to amend · ctrl+e to explain
        </div>
      </div>
    </div>
  );
};

// ─────────── Bark Assessment Result ───────────
export const BarkResult: React.FC<{
  level: 'low' | 'medium' | 'high';
  text: string;
  delay?: number;
  cached?: boolean;
}> = ({ level, text, delay = 0, cached = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < delay) return null;

  const entered = spring({
    frame: frame - delay, fps,
    config: { damping: 18, mass: 0.6, stiffness: 320 },
  });
  const opacity = interpolate(entered, [0, 1], [0, 1]);
  const translateX = interpolate(entered, [0, 1], [15, 0]);

  const cfg = {
    low: { fg: COLORS.low, icon: '✓', label: 'Low' },
    medium: { fg: COLORS.medium, icon: '⚠', label: 'Medium' },
    high: { fg: COLORS.high, icon: '🚨', label: 'High' },
  }[level];

  return (
    <span style={{
      opacity, transform: `translateX(${translateX}px)`,
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 13, marginLeft: 12,
    }}>
      <span style={{ color: cfg.fg }}>{cfg.icon} [{cfg.label}]</span>
      <span style={{ color: DIM }}>{text}</span>
      {cached && <span style={{ color: '#555' }}>(cached)</span>}
    </span>
  );
};

// ─────────── Generic Animated Line ───────────
export const ClaudeActivity: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: CSSProperties;
}> = ({ children, delay = 0, style: propStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < delay) return null;

  const entered = spring({
    frame: frame - delay, fps,
    config: { damping: 30, mass: 0.8, stiffness: 300 },
  });
  const opacity = interpolate(entered, [0, 1], [0, 1]);
  const translateY = interpolate(entered, [0, 1], [6, 0]);

  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)`, ...propStyle }}>
      {children}
    </div>
  );
};

// ─────────── Spinner (for Bark AI assessment) ───────────
export const Spinner: React.FC<{
  text?: string;
  startFrame?: number;
}> = ({ text = 'AI assessing...', startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;
  if (elapsed < 0) return null;

  const FRAMES = ['▸▹▹▹▹', '▹▸▹▹▹', '▹▹▸▹▹', '▹▹▹▸▹', '▹▹▹▹▸'];
  const idx = Math.floor(elapsed / 2.4) % FRAMES.length;

  return (
    <span style={{ fontFamily: MONO, fontSize: 14 }}>
      <span style={{ color: TOOL_GREEN, letterSpacing: 1 }}>{FRAMES[idx]}</span>
      <span style={{ color: DIM, marginLeft: 8 }}>{text}</span>
    </span>
  );
};

// ─────────── Shell Prompt (for bark CLI scenes) ───────────
export const ShellPrompt: React.FC<{
  command: string;
  delay?: number;
  typingSpeed?: number;
}> = ({ command, delay = 0, typingSpeed = 2.0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < delay) return null;

  const elapsed = frame - delay;
  let chars = 0;
  let acc = 0;
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    const mult = ch === ' ' ? 0.55 : ch === '-' ? 0.5 : 1.0;
    acc += 1 / (typingSpeed * mult);
    if (acc > elapsed) break;
    chars++;
  }
  chars = Math.min(chars, command.length);
  const done = chars >= command.length;
  const cursorOn = Math.floor(frame / Math.round(fps * 0.53)) % 2 === 0;

  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ color: TOOL_GREEN }}>➜</span>
      <span style={{ color: '#e5c07b' }}>  ~ </span>
      <span style={{ color: TEXT }}>{command.slice(0, chars)}</span>
      {(!done || cursorOn) && (
        <span style={{
          display: 'inline-block', width: 2, height: 17,
          background: TEXT, marginLeft: 1,
          opacity: !done ? 1 : cursorOn ? 0.7 : 0,
        }} />
      )}
    </div>
  );
};
