import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { MacDesktop } from '../components/MacDesktop';
import { Transition3D } from '../components/Transition3D';
import { Camera, cameraSteadyZoom } from '../components/Camera';
import { ClaudeTerminal, ClaudeActivity, ShellPrompt } from '../components/ClaudeCodeUI';
import { CharGradientLine } from '../components/GradientText';
import { SceneLabel } from '../components/SceneLabel';
import { BARK_ASCII_SMALL, COLORS, SCENE_DURATIONS } from '../theme';

const HELP = [
  { cmd: 'status', desc: 'Show daemon & hook status' },
  { cmd: 'on / off', desc: 'Enable / disable hook' },
  { cmd: 'toggle', desc: 'Toggle on/off' },
  { cmd: 'test <cmd>', desc: "Test a command's risk level" },
  { cmd: 'test -v <cmd>', desc: 'Verbose: show all 7 layers' },
  { cmd: 'cache [clear]', desc: 'View / clear SQLite cache' },
  { cmd: 'log [N|clear]', desc: 'View / clear assessment log' },
  { cmd: 'stats', desc: 'Statistics dashboard' },
  { cmd: 'rules [edit]', desc: 'Custom TOML rules' },
  { cmd: 'tui', desc: 'Terminal dashboard (live feed)' },
  { cmd: 'install', desc: 'Register hook in settings.json' },
  { cmd: 'update', desc: 'Update to latest version' },
  { cmd: 'uninstall', desc: 'Completely remove' },
];

export const S17_Help: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Transition3D type="rotateIn">
      <Camera keyframes={cameraSteadyZoom(SCENE_DURATIONS.help)}>
      <MacDesktop darken={0.4}>
        <SceneLabel text="Command List" sub="完整命令 · bark help" color={COLORS.gradientStart} delay={8} />
        <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ClaudeTerminal width={1100} height={650} enterDelay={3} title="bark help">
            <ShellPrompt command="bark help" delay={3} typingSpeed={4.0} />
            {frame >= 8 && (
              <ClaudeActivity delay={8} style={{ margin: '6px 0' }}>
                {BARK_ASCII_SMALL.map((line, i) => (
                  <CharGradientLine key={i} text={line} style={{ fontSize: 15, lineHeight: 1.2 }} />
                ))}
                <div style={{ color: '#888', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                  AI-Powered Risk Assessment for Claude Code
                </div>
              </ClaudeActivity>
            )}
            {frame >= 16 && (
              <ClaudeActivity delay={16} style={{ marginTop: 6 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Usage: bark &lt;command&gt;</div>
              </ClaudeActivity>
            )}
            {HELP.map((item, i) => {
              const d = 20 + i * 2.5;
              return frame >= d ? (
                <ClaudeActivity key={i} delay={Math.floor(d)} style={{
                  display: 'flex', gap: 16, padding: '1px 0', fontSize: 13,
                }}>
                  <span style={{ color: COLORS.gradientMid, width: 160, fontWeight: 600 }}>{item.cmd}</span>
                  <span style={{ color: '#888' }}>{item.desc}</span>
                </ClaudeActivity>
              ) : null;
            })}
          </ClaudeTerminal>
        </AbsoluteFill>
      </MacDesktop>
      </Camera>
    </Transition3D>
  );
};
