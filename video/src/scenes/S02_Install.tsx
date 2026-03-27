import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { MacDesktop } from '../components/MacDesktop';
import { Transition3D } from '../components/Transition3D';
import { ClaudeTerminal, ClaudeActivity } from '../components/ClaudeCodeUI';
import { CharGradientLine } from '../components/GradientText';
import { Camera, CameraKeyframe } from '../components/Camera';
import { BARK_ASCII, COLORS, SCENE_DURATIONS, FONT_MONO } from '../theme';

const CMD = 'curl -fsSL https://raw.githubusercontent.com/shaominngqing/bark-claude-code-hook/main/install.sh | bash';

const PIPELINE = [
  { label: 'Read-only', tools: 'Read / Grep / Glob', action: 'Allow', color: COLORS.low },
  { label: 'Edits', tools: 'Edit / Write', action: 'Allow', color: COLORS.low },
  { label: 'Bash', tools: 'All commands', action: 'AI assess (~8s)', color: COLORS.c2 },
  { label: 'Repeat', tools: 'Same pattern', action: 'Cache hit (0s)', color: COLORS.low },
  { label: 'Danger', tools: 'rm -rf / force push', action: 'Block + confirm', color: COLORS.high },
];

// Timeline (6s = 180 frames) — compressed from 8s
// 0-3:     terminal appears
// 5-42:    typing curl command (faster: 3.0x speed)
// 42-46:   "enter" pause
// 46:      output starts, camera pulls back
// 46-58:   banner lines render
// 60:      subtitle
// 63:      "▸ Detect platform"
// 66:      "✓ macOS aarch64" + "✓ claude CLI"
// 72:      "▸ Download bark binary"
// 74-94:   progress bar
// 96:      "✓ bark v2.0.2 (3.8MB)"
// 100:     "▸ Install binary"
// 103:     "✓ bark → /opt/homebrew/bin/"
// 108:     completion banner box
// 140:     quick start
// 160-180: hold

export const S02_Install: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Typing (faster) ---
  const typeStart = 5;
  const cmdElapsed = Math.max(0, frame - typeStart);
  let cmdChars = 0;
  let acc = 0;
  for (let i = 0; i < CMD.length; i++) {
    const ch = CMD[i];
    const mult = ch === ' ' ? 0.6 : ch === '/' ? 0.4 : ch === ':' ? 0.5 : 1.0;
    acc += 1 / (3.0 * mult);
    if (acc > cmdElapsed) break;
    cmdChars++;
  }
  cmdChars = Math.min(cmdChars, CMD.length);
  const typingDone = cmdChars >= CMD.length;

  // --- Output timeline ---
  const outputStart = 46;
  const bannerLines = frame >= outputStart
    ? Math.min(Math.floor((frame - outputStart) / 1.2) + 1, BARK_ASCII.length)
    : 0;
  const subtitleFrame = outputStart + Math.ceil(BARK_ASCII.length * 1.2) + 2;
  const detectFrame = subtitleFrame + 3;
  const platformOk = detectFrame + 3;
  const claudeOk = platformOk + 3;
  const downloadFrame = claudeOk + 3;
  const progressStart = downloadFrame + 2;
  const progressEnd = progressStart + 20;
  const downloadOk = progressEnd + 2;
  const installFrame = downloadOk + 4;
  const installOk = installFrame + 3;
  const bannerBoxFrame = installOk + 4;
  const quickStartFrame = bannerBoxFrame + 30;

  // Progress bar
  const progressPct = frame >= progressStart && frame < progressEnd
    ? Math.min(100, Math.floor(((frame - progressStart) / (progressEnd - progressStart)) * 100))
    : frame >= progressEnd ? 100 : 0;
  const progressWidth = 32;
  const filled = Math.floor(progressPct * progressWidth / 100);
  const sizeMB = (progressPct * 3.8 / 100).toFixed(1);

  // --- Camera ---
  const cameraKF: CameraKeyframe[] = [
    { frame: 0, scale: 1.0, x: 0, y: 0 },
    { frame: 7, scale: 1.5, x: 0, y: 5 },
    { frame: outputStart - 3, scale: 1.5, x: 0, y: 5 },
    { frame: outputStart + 8, scale: 1.05, x: 0, y: 0 },
  ];

  // Auto-scroll
  const LINE = 24;
  let contentH = 10;
  if (bannerLines > 0) contentH += bannerLines * 18;
  if (frame >= subtitleFrame) contentH += LINE;
  if (frame >= detectFrame) contentH += LINE;
  if (frame >= platformOk) contentH += LINE;
  if (frame >= claudeOk) contentH += LINE;
  if (frame >= downloadFrame) contentH += LINE;
  if (frame >= progressStart) contentH += LINE;
  if (frame >= downloadOk) contentH += LINE;
  if (frame >= installFrame) contentH += LINE;
  if (frame >= installOk) contentH += LINE;
  if (frame >= bannerBoxFrame) contentH += LINE * 9;
  if (frame >= quickStartFrame) contentH += LINE * 5;
  const VISIBLE = 580;
  const scrollY = Math.min(0, VISIBLE - contentH);

  return (
    <Transition3D type="rotateIn">
      <Camera keyframes={cameraKF}>
      <MacDesktop darken={0.4}>
        <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ClaudeTerminal width={1200} height={660} enterDelay={2}>
            <div style={{
              transform: `translateY(${scrollY}px)`,
              transition: 'transform 0.3s ease-out',
            }}>

            {/* Prompt + curl command */}
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: '#3fb950' }}>❯❯</span>
              <span style={{ color: '#e5c07b' }}> ~ </span>
              <span style={{ color: '#fff' }}>{CMD.slice(0, cmdChars)}</span>
              {!typingDone && (
                <span style={{
                  display: 'inline-block', width: 7, height: 15,
                  background: '#fff', verticalAlign: 'text-bottom', marginLeft: 1,
                }} />
              )}
            </div>

            {/* Banner */}
            {bannerLines > 0 && (
              <div style={{ fontSize: 12, lineHeight: 1.15, margin: '6px 0' }}>
                {BARK_ASCII.slice(0, bannerLines).map((line, i) => (
                  <CharGradientLine key={i} text={line}
                    colors={['#00afff', '#00d7ff', '#00ffff', '#5fffff', '#00d7d7', '#00afff']}
                    style={{ fontSize: 12 }}
                  />
                ))}
              </div>
            )}
            {frame >= subtitleFrame && (
              <div style={{ color: '#888', fontStyle: 'italic', fontSize: 13, marginBottom: 6 }}>
                AI-Powered Risk Assessment for Claude Code v2.0.2
              </div>
            )}

            {/* Detect platform */}
            {frame >= detectFrame && (
              <ClaudeActivity delay={detectFrame} style={{ marginBottom: 2 }}>
                <span style={{ color: COLORS.c1, fontWeight: 700 }}>  ▸ </span>
                <span style={{ fontWeight: 700 }}>Detect platform</span>
              </ClaudeActivity>
            )}
            {frame >= platformOk && (
              <ClaudeActivity delay={platformOk} style={{ paddingLeft: 20 }}>
                <span style={{ color: COLORS.low }}>✓ </span>macOS aarch64
              </ClaudeActivity>
            )}
            {frame >= claudeOk && (
              <ClaudeActivity delay={claudeOk} style={{ paddingLeft: 20 }}>
                <span style={{ color: COLORS.low }}>✓ </span>claude CLI
              </ClaudeActivity>
            )}

            {/* Download binary */}
            {frame >= downloadFrame && (
              <ClaudeActivity delay={downloadFrame} style={{ marginTop: 4, marginBottom: 2 }}>
                <span style={{ color: COLORS.c1, fontWeight: 700 }}>  ▸ </span>
                <span style={{ fontWeight: 700 }}>Download bark binary</span>
              </ClaudeActivity>
            )}
            {frame >= progressStart && frame < downloadOk && (
              <div style={{ paddingLeft: 20, fontSize: 13, fontFamily: FONT_MONO }}>
                <span>  </span>
                {Array.from({ length: progressWidth }).map((_, i) => (
                  <span key={i} style={{ color: i < filled ? COLORS.c1 : '#444' }}>━</span>
                ))}
                <span style={{ color: '#888', marginLeft: 8 }}>{sizeMB}/3.8MB</span>
                <span style={{ color: '#888', marginLeft: 8 }}>{progressPct}%</span>
              </div>
            )}
            {frame >= downloadOk && (
              <ClaudeActivity delay={downloadOk} style={{ paddingLeft: 20 }}>
                <span style={{ color: COLORS.low }}>✓ </span>bark v2.0.2 (3.8MB)
              </ClaudeActivity>
            )}

            {/* Install binary */}
            {frame >= installFrame && (
              <ClaudeActivity delay={installFrame} style={{ marginTop: 4, marginBottom: 2 }}>
                <span style={{ color: COLORS.c1, fontWeight: 700 }}>  ▸ </span>
                <span style={{ fontWeight: 700 }}>Install binary</span>
              </ClaudeActivity>
            )}
            {frame >= installOk && (
              <ClaudeActivity delay={installOk} style={{ paddingLeft: 20 }}>
                <span style={{ color: COLORS.low }}>✓ </span>bark → /opt/homebrew/bin/
              </ClaudeActivity>
            )}

            {/* Completion banner */}
            {frame >= bannerBoxFrame && (
              <ClaudeActivity delay={bannerBoxFrame} style={{ marginTop: 8 }}>
                <div style={{ color: '#555', fontSize: 13 }}>  ╭{'─'.repeat(48)}╮</div>
                <div style={{ color: '#555', fontSize: 13, display: 'flex' }}>
                  <span>  │ </span>
                  <CharGradientLine text=" Installation Complete!"
                    colors={['#00afff', '#00d7ff', '#00ffff', '#5fffff']}
                    style={{ fontWeight: 700, fontSize: 14 }}
                  />
                  <span style={{ flex: 1 }} />
                  <span style={{ color: '#555' }}>{'              '}│</span>
                </div>
                <div style={{ color: '#555', fontSize: 13 }}>  ├{'─'.repeat(48)}┤</div>
                {PIPELINE.map((row, i) => {
                  const d = bannerBoxFrame + 3 + i * 2;
                  return frame >= d ? (
                    <ClaudeActivity key={i} delay={d}>
                      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#555' }}>  │</span>
                        <span style={{ color: row.color }}>◆</span>
                        <span style={{ color: '#888', width: 65, display: 'inline-block' }}>{row.label}</span>
                        <span style={{ color: '#888' }}>{row.tools}</span>
                        <span style={{ color: '#555', margin: '0 4px' }}>──▸</span>
                        <span style={{ color: row.color, fontWeight: 600 }}>{row.action}</span>
                      </div>
                    </ClaudeActivity>
                  ) : null;
                })}
                {frame >= bannerBoxFrame + 16 && (
                  <div style={{ color: '#555', fontSize: 13 }}>  ╰{'─'.repeat(48)}╯</div>
                )}
              </ClaudeActivity>
            )}

            {/* Quick start */}
            {frame >= quickStartFrame && (
              <ClaudeActivity delay={quickStartFrame} style={{ marginTop: 6 }}>
                <div style={{ fontWeight: 700, marginBottom: 3, fontSize: 13 }}>  Quick Start</div>
                <div style={{ fontSize: 13, paddingLeft: 16, color: '#888' }}>
                  <span style={{ color: COLORS.c2 }}>bark</span> help{'           '}Show all commands
                </div>
                <div style={{ fontSize: 13, paddingLeft: 16, color: '#888' }}>
                  <span style={{ color: COLORS.c2 }}>bark</span> test rm -rf /{'  '}Test any command
                </div>
              </ClaudeActivity>
            )}

            </div>
          </ClaudeTerminal>
        </AbsoluteFill>
      </MacDesktop>
      </Camera>
    </Transition3D>
  );
};
