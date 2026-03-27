import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { MacDesktop } from '../components/MacDesktop';
import { Transition3D } from '../components/Transition3D';
import { ClaudeTerminal, ClaudeCodeHeader, InputBox, UserMessage, ClaudeResponse, ToolCall, ToolResult, BarkResult, ClaudeActivity, Spinner, CookedStatus, Separator, ConfirmBox } from '../components/ClaudeCodeUI';
import { MacNotification } from '../components/MacNotification';
import { Camera, CameraKeyframe } from '../components/Camera';
import { COLORS, SHADOWS, FONT_MONO } from '../theme';
import { screenShake } from '../animations';

/**
 * Workflow Demo (28s = 840 frames)
 *
 * Phase 1 (0-6s):    Read-only tools — instant ✓
 * Phase 2 (6-15s):   First Bash — AI assessment (~8s spinner)
 * Phase 3 (15-20s):  Same pattern — cache hit, 0ms
 * Phase 4 (20-28s):  git reset --hard — HIGH RISK, blocked
 */

const FPS = 30;

// ── Phase 1: Read-only (0-180) ~6s ──
const P1_HEADER = 5;
const P1_INPUT = 14;
const P1_SUBMIT = 40;
const P1_RESPONSE = 48;
const P1_TOOLS = [
  { tool: 'Read', args: 'src/main.ts', f: 66, result: 'Read 1 file' },
  { tool: 'Grep', args: '"handleAuth" src/', f: 92, result: '3 matches found' },
  { tool: 'Glob', args: '**/*.ts', f: 118, result: '12 files matched' },
  { tool: 'Edit', args: 'src/auth.ts', f: 144, result: 'Edited 1 file' },
];

// ── Phase 2: First Bash — AI assess (180-450) ──
const P2_START = 180;
const P2_RESPONSE = 196;
const P2_BASH = 220;
const P2_SPINNER_START = 228;
const P2_SPINNER_END = 380;
const P2_NOTIF = P2_SPINNER_END + 12;

// ── Phase 3: Cache hit (450-600) ──
const P3_START = 450;
const P3_RESPONSE = 464;
const P3_BASH = 484;
const P3_RESULT = 488;
const P3_NOTIF = 496;

// ── Phase 4: High risk (600-840) ──
const P4_START = 600;
const P4_RESPONSE = 616;
const P4_BASH = 640;
const P4_ALERT = 654;
const P4_NOTIF = 672;
const P4_CONFIRM = 720;

// ── Phase label ──
const PhaseLabel: React.FC<{
  text: string;
  sub: string;
  color: string;
  startFrame: number;
  endFrame: number;
}> = ({ text, sub, color, startFrame, endFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < startFrame || frame > endFrame) return null;

  const entered = spring({
    frame: Math.max(0, frame - startFrame), fps,
    config: { damping: 20, mass: 0.8, stiffness: 200 },
  });
  const opacity = interpolate(entered, [0, 1], [0, 1]);
  const translateX = interpolate(entered, [0, 1], [30, 0]);
  const fadeOut = frame > endFrame - 15
    ? interpolate(frame, [endFrame - 15, endFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;

  return (
    <div style={{
      position: 'absolute', left: '73%', top: '38%',
      transform: `translateY(-50%) translateX(${translateX}px)`,
      opacity: opacity * fadeOut, textAlign: 'left',
      zIndex: 100, maxWidth: 260,
    }}>
      <div style={{
        fontSize: 20, fontWeight: 700, color,
        fontFamily: FONT_MONO, textShadow: '0 2px 12px rgba(0,0,0,0.8)',
        marginBottom: 5,
      }}>{text}</div>
      <div style={{
        fontSize: 14, color: 'rgba(255,255,255,0.5)',
        fontFamily: FONT_MONO, textShadow: '0 1px 8px rgba(0,0,0,0.8)',
      }}>{sub}</div>
    </div>
  );
};

export const S03_Workflow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Auto-scroll — generous estimates to stay ahead of content
  const LINE = 28;      // ~15px font × 1.7 line-height ≈ 25.5, round up
  const VISIBLE = 600;
  let contentHeight = 80; // header (logo 3 lines)
  if (frame >= P1_SUBMIT) contentHeight += LINE * 1.5; // user message
  if (frame >= P1_RESPONSE) contentHeight += LINE * 2; // response text
  P1_TOOLS.forEach(t => {
    if (frame >= t.f) contentHeight += LINE * 3; // tool call + status + bark result
  });
  if (frame >= P2_RESPONSE) contentHeight += LINE * 2;
  if (frame >= P2_BASH) contentHeight += LINE * 3; // tool + status + spinner/result
  if (frame >= P2_SPINNER_END + 5) contentHeight += LINE; // cooked status
  if (frame >= P3_RESPONSE) contentHeight += LINE * 2;
  if (frame >= P3_BASH) contentHeight += LINE * 3;
  if (frame >= P4_RESPONSE) contentHeight += LINE * 2;
  if (frame >= P4_BASH) contentHeight += LINE * 3;
  if (frame >= P4_CONFIRM) contentHeight += LINE * 12; // confirm box is tall
  contentHeight += LINE * 4; // input box + separators + padding
  const scrollY = Math.min(0, VISIBLE - contentHeight);

  const shake = screenShake(frame, P4_ALERT, 8, 20);
  const flashIntensity = frame >= P4_ALERT && frame < P4_ALERT + 20
    ? Math.max(0, Math.sin((frame - P4_ALERT) * 0.5) * 0.15 * (1 - (frame - P4_ALERT) / 20))
    : 0;

  const cameraKF: CameraKeyframe[] = [
    { frame: 0, scale: 1.0, x: 0, y: 0 },
    { frame: 10, scale: 1.1, x: 0, y: 0 },
    { frame: P2_NOTIF - 2, scale: 1.1, x: 0, y: 0 },
    { frame: P2_NOTIF + 14, scale: 2.0, x: -25, y: 25 },
    { frame: P2_NOTIF + 35, scale: 2.0, x: -25, y: 25 },
    { frame: P2_NOTIF + 49, scale: 1.1, x: 0, y: 0 },
    { frame: P3_NOTIF - 2, scale: 1.1, x: 0, y: 0 },
    { frame: P3_NOTIF + 10, scale: 2.0, x: -25, y: 25 },
    { frame: P3_NOTIF + 22, scale: 2.0, x: -25, y: 25 },
    { frame: P3_NOTIF + 36, scale: 1.1, x: 0, y: 0 },
    { frame: P4_NOTIF - 2, scale: 1.1, x: 0, y: 0 },
    { frame: P4_NOTIF + 14, scale: 2.0, x: -25, y: 25 },
    { frame: P4_NOTIF + 29, scale: 2.0, x: -25, y: 25 },
    { frame: P4_NOTIF + 43, scale: 1.1, x: 0, y: 0 },
  ];

  return (
    <Transition3D type="tiltUp" enterDuration={20} exitDuration={15}>
      <Camera keyframes={cameraKF}>
      <MacDesktop darken={0.4}>
        {flashIntensity > 0 && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none',
            background: `radial-gradient(ellipse at center, rgba(248,81,73,${flashIntensity}) 0%, transparent 70%)`,
          }} />
        )}

        <PhaseLabel text="✓ Layer 1: Fast Rules" sub="只读操作直接放行 · 0ms"
          color={COLORS.low} startFrame={P1_TOOLS[0].f} endFrame={P2_START} />
        <PhaseLabel text="⏵ Layer 6: AI Assessment" sub="首次评估 ~8s · 语义分析"
          color={COLORS.c2} startFrame={P2_BASH} endFrame={P3_START} />
        <PhaseLabel text="✓ Layer 3: Cache Hit" sub="SQLite缓存命中 · 0ms"
          color={COLORS.low} startFrame={P3_BASH} endFrame={P4_START} />
        <PhaseLabel text="🚨 High Risk → Blocked" sub="高风险拦截 · 需要确认"
          color={COLORS.high} startFrame={P4_BASH} endFrame={840} />

        <AbsoluteFill style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: frame >= P4_ALERT && frame < P4_ALERT + 20
            ? `translate(${shake.x}px, ${shake.y}px)` : undefined,
        }}>
          <ClaudeTerminal width={1200} height={720} enterDelay={3}>
            <div style={{
              transform: `translateY(${scrollY}px)`,
              transition: 'transform 0.3s ease-out',
            }}>

            {/* ═══════ Phase 1: Read-only ═══════ */}
            <ClaudeCodeHeader delay={P1_HEADER} />

            <UserMessage text="fix the login bug and push the changes" delay={P1_SUBMIT} />

            {frame >= P1_RESPONSE && (
              <ClaudeResponse
                text="Let me look at the code and fix the issue."
                delay={P1_RESPONSE} wordsPerFrame={0.5}
              />
            )}

            {P1_TOOLS.map((t, i) => (
              frame >= t.f ? (
                <React.Fragment key={i}>
                  <ToolCall tool={t.tool} args={t.args} delay={t.f}
                    status={frame >= t.f + 6 ? 'done' : 'running'} />
                  {frame >= t.f + 6 && (
                    <BarkResult level="low"
                      text={t.tool === 'Edit' ? '普通文件编辑' : '只读操作'}
                      delay={t.f + 6} />
                  )}
                </React.Fragment>
              ) : null
            ))}

            {/* ═══════ Phase 2: First Bash — AI assessment ═══════ */}
            {frame >= P2_START && (
              <ClaudeResponse
                text="Bug fixed. Let me commit the changes."
                delay={P2_RESPONSE} wordsPerFrame={0.5}
                style={{ marginTop: 10 }}
              />
            )}

            {frame >= P2_BASH && (
              <>
                <ToolCall tool="Bash" args={'git commit -m "fix: login bug"'} delay={P2_BASH}
                  status={frame >= P2_SPINNER_END ? 'done' : 'running'} />
                {frame >= P2_SPINNER_START && frame < P2_SPINNER_END && (
                  <div style={{ paddingLeft: 18, marginTop: 2 }}>
                    <Spinner text="AI assessing..." startFrame={P2_SPINNER_START} />
                  </div>
                )}
                {frame >= P2_SPINNER_END && (
                  <BarkResult level="low" text="本地提交操作，可撤销" delay={P2_SPINNER_END} />
                )}
              </>
            )}

            {frame >= P2_SPINNER_END + 5 && (
              <CookedStatus seconds={12} delay={P2_SPINNER_END + 5} />
            )}

            {/* ═══════ Phase 3: Cache hit ═══════ */}
            {frame >= P3_START && (
              <ClaudeResponse
                text="Also committing the config update."
                delay={P3_RESPONSE} wordsPerFrame={0.6}
                style={{ marginTop: 10 }}
              />
            )}

            {frame >= P3_BASH && (
              <>
                <ToolCall tool="Bash" args={'git commit -m "chore: update config"'} delay={P3_BASH}
                  status={frame >= P3_RESULT ? 'done' : 'running'} />
                {frame >= P3_RESULT && (
                  <BarkResult level="low" text="本地提交操作，可撤销" delay={P3_RESULT} cached />
                )}
              </>
            )}

            {/* ═══════ Phase 4: git reset --hard ═══════ */}
            {frame >= P4_START && (
              <ClaudeResponse
                text="I need to undo some recent broken commits first."
                delay={P4_RESPONSE} wordsPerFrame={0.5}
                style={{ marginTop: 10 }}
              />
            )}

            {frame >= P4_BASH && (
              <>
                <ToolCall tool="Bash" args="git reset --hard HEAD~5" delay={P4_BASH}
                  status={frame >= P4_ALERT ? 'none' : 'running'} />
                {frame >= P4_ALERT && (
                  <BarkResult level="high" text="硬重置丢弃5个提交，不可逆" delay={P4_ALERT} />
                )}
              </>
            )}

            {/* Confirm box — real Claude format */}
            {frame >= P4_CONFIRM && (
              <ConfirmBox
                tool="Bash"
                command="git reset --hard HEAD~5"
                description="Hard reset discarding 5 commits — irreversible"
                delay={P4_CONFIRM}
              />
            )}

            {/* Input box */}
            <InputBox
              text="fix the login bug and push the changes"
              delay={P1_INPUT}
              typingSpeed={2.0}
              submitFrame={P1_SUBMIT}
            />
            </div>
          </ClaudeTerminal>
        </AbsoluteFill>

        {/* Notifications */}
        <MacNotification subtitle="已自动放行" body="本地提交操作，可撤销"
          variant="warning" startFrame={P2_NOTIF} dismissAfter={80} />
        <MacNotification subtitle="已自动放行" body="本地提交操作，可撤销 (cached)"
          variant="warning" startFrame={P3_NOTIF} dismissAfter={60} />
        <MacNotification subtitle="需要确认" body="硬重置将丢弃 5 个提交，不可逆操作"
          variant="danger" startFrame={P4_NOTIF} />
      </MacDesktop>
      </Camera>
    </Transition3D>
  );
};
