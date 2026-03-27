import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { MacDesktop } from '../components/MacDesktop';
import { ClaudeCodeHeader } from '../components/ClaudeCodeUI';
import { COLORS } from '../theme';

/**
 * Pain Point Scene (6s = 180 frames)
 *
 * 3 tabs with real Claude Code sessions. Content appears progressively.
 * Confirmations pop up during real work. Mouse clicks tabs to switch.
 */

const MONO = "'Menlo', 'SF Mono', 'Monaco', monospace";
const BG = '#1e1e1e';
const TITLE_BAR = '#2a2a2a';
const TAB_BORDER = '#3a3a3a';
const TEXT = '#e0e0e0';
const DIM = '#808080';
const GREEN = '#4ec970';
const BLUE = '#58a6ff';
const ORANGE = '#e8915a';
const CLAUDE_RED = '#d4634a';

const TABS = [
  { name: 'api-server', path: '~/api-server', model: 'claude-opus-4-6' },
  { name: 'frontend', path: '~/frontend', model: 'claude-sonnet-4-6' },
  { name: 'infra', path: '~/infra', model: 'claude-opus-4-6' },
];

// ── Per-tab content: lines appear at specific frames ──
// Each line: { f: frame, type, ...data }
// Types: 'user', 'response', 'tool', 'toolresult', 'cooked', 'confirm', 'confirmed'

type Line =
  | { f: number; type: 'user'; text: string }
  | { f: number; type: 'response'; text: string }
  | { f: number; type: 'tool'; tool: string; args: string }
  | { f: number; type: 'toolresult'; text: string }
  | { f: number; type: 'cooked'; seconds: number }
  | { f: number; type: 'confirm'; tool: string; args: string }
  | { f: number; type: 'confirmed' };

const TAB_CONTENT: Line[][] = [
  // Tab 0: api-server — working on test failures
  [
    { f: 0, type: 'user', text: 'fix the failing tests in auth module' },
    { f: 0, type: 'response', text: "I'll start by reading the test files to understand the failures." },
    { f: 0, type: 'tool', tool: 'Read', args: 'tests/auth.test.ts' },
    { f: 0, type: 'toolresult', text: 'Read 1 file (245 lines)' },
    { f: 0, type: 'tool', tool: 'Grep', args: '"FAIL" tests/' },
    { f: 0, type: 'toolresult', text: '3 matches in 2 files' },
    { f: 0, type: 'response', text: 'Found 3 failing assertions. The issue is in the token validation logic. Let me fix it and run the tests.' },
    { f: 0, type: 'tool', tool: 'Edit', args: 'src/auth/validate.ts' },
    { f: 0, type: 'toolresult', text: 'Edited 1 file (+12 -5)' },
    // Confirmation pops up here
    { f: 8, type: 'confirm', tool: 'Bash', args: 'npm test' },
    { f: 22, type: 'confirmed' },
    // After confirm, new work continues then another confirm
    { f: 26, type: 'toolresult', text: '✓ 47 tests passed, 0 failed' },
    { f: 26, type: 'cooked', seconds: 23 },
    { f: 26, type: 'response', text: 'All tests pass. Let me commit the fix.' },
    { f: 76, type: 'confirm', tool: 'Bash', args: 'git commit -m "fix: token validation"' },
    { f: 85, type: 'confirmed' },
    { f: 117, type: 'confirm', tool: 'Bash', args: 'npm run lint' },
    { f: 124, type: 'confirmed' },
    { f: 144, type: 'confirm', tool: 'Bash', args: 'npm run build' },
    { f: 149, type: 'confirmed' },
  ],
  // Tab 1: frontend — refactoring components
  [
    { f: 0, type: 'user', text: 'refactor the dashboard components to use the new design system' },
    { f: 0, type: 'response', text: "I'll analyze the current component structure first." },
    { f: 0, type: 'tool', tool: 'Glob', args: 'src/components/dashboard/**' },
    { f: 0, type: 'toolresult', text: '18 files matched' },
    { f: 0, type: 'tool', tool: 'Read', args: 'src/components/dashboard/index.tsx' },
    { f: 0, type: 'toolresult', text: 'Read 1 file (312 lines)' },
    { f: 0, type: 'response', text: "I see the old Material UI imports. I'll migrate them to the new design tokens and update the layout grid." },
    { f: 0, type: 'tool', tool: 'Edit', args: 'src/components/dashboard/StatsCard.tsx' },
    { f: 0, type: 'toolresult', text: 'Edited 1 file (+28 -19)' },
    { f: 0, type: 'tool', tool: 'Edit', args: 'src/components/dashboard/ChartPanel.tsx' },
    { f: 0, type: 'toolresult', text: 'Edited 1 file (+45 -33)' },
    { f: 34, type: 'confirm', tool: 'Bash', args: 'npm run dev' },
    { f: 46, type: 'confirmed' },
    { f: 46, type: 'toolresult', text: 'Server started on localhost:3000' },
    { f: 46, type: 'cooked', seconds: 18 },
    { f: 93, type: 'confirm', tool: 'Bash', args: 'npx tsc --noEmit' },
    { f: 101, type: 'confirmed' },
    { f: 128, type: 'confirm', tool: 'Read', args: '.env.local' },
    { f: 133, type: 'confirmed' },
  ],
  // Tab 2: infra — checking deploy status
  [
    { f: 0, type: 'user', text: 'check the k8s deployment status and fix the failing health check' },
    { f: 0, type: 'response', text: "Let me check the current deployment and pod status." },
    { f: 0, type: 'tool', tool: 'Read', args: 'k8s/deployment.yaml' },
    { f: 0, type: 'toolresult', text: 'Read 1 file (89 lines)' },
    { f: 0, type: 'tool', tool: 'Read', args: 'k8s/service.yaml' },
    { f: 0, type: 'toolresult', text: 'Read 1 file (34 lines)' },
    { f: 0, type: 'response', text: 'The health check endpoint is pointing to /healthz but the app exposes /health. Let me fix the deployment config.' },
    { f: 0, type: 'tool', tool: 'Edit', args: 'k8s/deployment.yaml' },
    { f: 0, type: 'toolresult', text: 'Edited 1 file (+2 -2)' },
    { f: 57, type: 'confirm', tool: 'Bash', args: 'kubectl apply -f k8s/' },
    { f: 67, type: 'confirmed' },
    { f: 67, type: 'toolresult', text: 'deployment.apps/api configured' },
    { f: 67, type: 'cooked', seconds: 31 },
    { f: 107, type: 'confirm', tool: 'Bash', args: 'kubectl rollout status deploy/api' },
    { f: 114, type: 'confirmed' },
    { f: 137, type: 'confirm', tool: 'Bash', args: 'curl -s http://localhost:8080/health' },
    { f: 142, type: 'confirmed' },
  ],
];

// ── Switch events: frame → tab index ──
const SWITCHES: { f: number; tab: number }[] = [
  { f: 0, tab: 0 },
  { f: 28, tab: 1 },
  { f: 52, tab: 2 },
  { f: 72, tab: 0 },
  { f: 89, tab: 1 },
  { f: 104, tab: 2 },
  { f: 117, tab: 0 },
  { f: 126, tab: 1 },
  { f: 135, tab: 2 },
  { f: 144, tab: 0 },
];

export const S00_Hook: React.FC = () => {
  const frame = useCurrentFrame();

  // Active tab
  let activeTab = 0;
  for (const s of SWITCHES) {
    if (frame >= s.f) activeTab = s.tab;
  }

  // y count
  let yCount = 0;
  for (const tab of TAB_CONTENT) {
    for (const line of tab) {
      if (line.type === 'confirmed' && frame >= line.f) yCount++;
    }
  }

  // Mouse position
  const tabWidth = 155;
  const tabStartX = 92;

  let prevTabX = tabStartX + tabWidth / 2;
  let targetTabX = tabStartX + activeTab * tabWidth + tabWidth / 2;
  let lastSwitchF = 0;
  for (let i = SWITCHES.length - 1; i >= 0; i--) {
    if (frame >= SWITCHES[i].f) {
      lastSwitchF = SWITCHES[i].f;
      targetTabX = tabStartX + SWITCHES[i].tab * tabWidth + tabWidth / 2;
      if (i > 0) prevTabX = tabStartX + SWITCHES[i - 1].tab * tabWidth + tabWidth / 2;
      break;
    }
  }
  const moveProgress = lastSwitchF > 0
    ? interpolate(frame, [lastSwitchF, lastSwitchF + 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;
  const mouseX = prevTabX + (targetTabX - prevTabX) * moveProgress;

  // Bottom text
  const bottomOpacity = frame >= 130
    ? interpolate(frame, [130, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  const counterColor = yCount >= 8 ? COLORS.high : yCount >= 4 ? COLORS.medium : '#888';

  // Render content for the active tab
  const renderTabContent = (tabIdx: number) => {
    const lines = TAB_CONTENT[tabIdx];
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (frame < line.f && line.f > 0) continue; // f=0 means pre-existing content

      const key = `${tabIdx}-${i}`;

      switch (line.type) {
        case 'user':
          elements.push(
            <div key={key} style={{ marginTop: 6, marginBottom: 2 }}>
              <span style={{ color: BLUE, fontWeight: 600 }}>❯ </span>
              <span>{line.text}</span>
            </div>
          );
          break;

        case 'response':
          elements.push(
            <div key={key} style={{ marginTop: 6 }}>
              <span>⏺ </span>
              <span>{line.text}</span>
            </div>
          );
          break;

        case 'tool':
          elements.push(
            <div key={key} style={{ marginTop: 3 }}>
              <span style={{ color: GREEN }}>⏺ </span>
              <span style={{ color: GREEN, fontWeight: 700 }}>{line.tool}</span>
              <span style={{ color: DIM }}>({line.args})</span>
            </div>
          );
          break;

        case 'toolresult':
          elements.push(
            <div key={key} style={{ paddingLeft: 18, color: DIM }}>
              ⎿  {line.text}
            </div>
          );
          break;

        case 'cooked':
          elements.push(
            <div key={key} style={{ marginTop: 4 }}>
              <span style={{ color: ORANGE }}>✻ </span>
              <span style={{ color: DIM }}>Cooked for {line.seconds}s</span>
            </div>
          );
          break;

        case 'confirm': {
          // Find if this confirm has been resolved
          const confirmedLine = lines.find(
            (l, j) => j > i && l.type === 'confirmed'
          );
          const isConfirmed = confirmedLine && frame >= confirmedLine.f;

          if (!isConfirmed) {
            // Show the confirm box
            elements.push(
              <div key={key} style={{ marginTop: 6 }}>
                <div style={{ color: '#333', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: 6 }}>
                  {'─'.repeat(80)}
                </div>
                <div style={{ paddingLeft: 4 }}>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>
                    {line.tool} command
                  </div>
                  <div style={{ color: BLUE, paddingLeft: 12, marginBottom: 2 }}>
                    {line.args}
                  </div>
                  <div style={{ color: DIM, marginTop: 6, marginBottom: 4 }}>
                    Do you want to proceed?
                  </div>
                  <div style={{ color: BLUE }}>❯ 1. Yes</div>
                  <div style={{ color: DIM }}>  2. Yes, and don't ask again</div>
                  <div style={{ color: DIM }}>  3. No</div>
                  <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>
                    Esc to cancel · Tab to amend
                  </div>
                </div>
              </div>
            );
          } else {
            // Already confirmed — show collapsed
            elements.push(
              <div key={key} style={{ marginTop: 3, opacity: 0.4 }}>
                <span style={{ color: GREEN }}>⏺ </span>
                <span style={{ color: GREEN, fontWeight: 700 }}>{line.tool}</span>
                <span style={{ color: DIM }}>({line.args})</span>
                <div style={{ paddingLeft: 18, color: DIM }}>⎿  Allowed</div>
              </div>
            );
          }
          break;
        }

        case 'confirmed':
          // Already handled by 'confirm' rendering above
          break;
      }
    }

    return elements;
  };

  return (
    <MacDesktop darken={0.35}>
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 1200, height: 720, borderRadius: 10, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 22px 70px 4px rgba(0,0,0,0.56)',
          position: 'relative',
        }}>
          {/* Title bar + tabs */}
          <div style={{
            height: 38, background: TITLE_BAR,
            display: 'flex', alignItems: 'center',
            flexShrink: 0, borderBottom: `1px solid #1a1a1a`,
          }}>
            <div style={{ display: 'flex', paddingLeft: 14, paddingRight: 14 }}>
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

            {TABS.map((tab, i) => {
              const isActive = i === activeTab;
              return (
                <div key={i} style={{
                  width: tabWidth, height: 38,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6,
                  background: isActive ? BG : 'transparent',
                  borderRight: `1px solid ${TAB_BORDER}`,
                  borderBottom: isActive ? 'none' : `1px solid #1a1a1a`,
                  fontFamily: MONO, fontSize: 12,
                  color: isActive ? TEXT : DIM,
                }}>
                  <span style={{
                    color: isActive ? ORANGE : '#555',
                    fontSize: 14, fontWeight: 700,
                  }}>✻</span>
                  <span>{tab.name}</span>
                </div>
              );
            })}

            <div style={{ flex: 1 }} />
            {yCount > 0 && (
              <div style={{
                paddingRight: 16, fontFamily: MONO, fontSize: 13,
                color: counterColor, fontWeight: 700,
              }}>
                {yCount}× y
              </div>
            )}
          </div>

          {/* Terminal body */}
          <div style={{
            flex: 1, background: BG, padding: '14px 24px',
            fontFamily: MONO, fontSize: 15, lineHeight: 1.7, color: TEXT,
            overflow: 'hidden',
          }}>
            {/* Header — no animation, instant */}
            <ClaudeCodeHeader
              delay={0}
              path={TABS[activeTab].path}
              model={TABS[activeTab].model}
            />

            {/* Tab content */}
            {renderTabContent(activeTab)}
          </div>

          {/* Mouse cursor */}
          <div style={{
            position: 'absolute',
            left: mouseX,
            top: 19,
            zIndex: 100,
            pointerEvents: 'none',
          }}>
            <svg width="18" height="22" viewBox="0 0 18 22"
              style={{ filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.6))' }}>
              <path d="M1.5 0.5 L1.5 17 L5.8 12.8 L9.5 19.5 L11.8 18.5 L8.2 11.8 L13.5 11.5 Z"
                fill="white" stroke="black" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </AbsoluteFill>

      {/* Bottom text */}
      <div style={{
        position: 'absolute', bottom: 40, width: '100%', textAlign: 'center',
        fontFamily: MONO, opacity: bottomOpacity,
      }}>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
          一天输入 <span style={{ color: COLORS.high, fontWeight: 700 }}>200+</span> 次 y ... 你不累吗？
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
          Tired of approving safe commands all day?
        </div>
      </div>
    </MacDesktop>
  );
};
