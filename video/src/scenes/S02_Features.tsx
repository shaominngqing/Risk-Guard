import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from 'remotion';
import { MacDesktop } from '../components/MacDesktop';
import { COLORS, FONT_MONO, SCENE_DURATIONS, SHADOWS } from '../theme';

/**
 * Feature Reel — one feature at a time, full-screen focus.
 *
 * Each feature card takes center stage for ~1s with a fast 3D entrance,
 * then exits as the next one pushes in. Quick rhythm, high impact.
 *
 * 6 features × ~28 frames each = ~168 frames = 5.6s → fits in 6s.
 */

const FEATURES = [
  {
    icon: '🦀',
    title: 'Rust Native',
    titleZh: '原生 Rust 二进制',
    desc: 'No runtime, no dependencies, single binary',
    descZh: '零运行时，零依赖，一个文件搞定',
    color: COLORS.orange,
    glow: 'rgba(255,135,0,0.25)',
  },
  {
    icon: '📦',
    title: '4MB Binary',
    titleZh: '极致体积，秒级安装',
    desc: 'Pre-built for all platforms, download & run',
    descZh: '预编译发布，下载即用',
    color: COLORS.c2,
    glow: 'rgba(0,215,255,0.25)',
  },
  {
    icon: '🌍',
    title: 'Cross-Platform',
    titleZh: '全平台支持',
    desc: 'macOS · Linux · Windows',
    descZh: 'Intel / Apple Silicon / ARM64 / x86_64',
    color: COLORS.low,
    glow: 'rgba(63,185,80,0.25)',
  },
  {
    icon: '🧠',
    title: '7-Layer Pipeline',
    titleZh: '7 层智能评估引擎',
    desc: 'Fast rules → Cache → AST → AI → Chain tracking',
    descZh: '从 0ms 规则匹配到 AI 语义分析，层层递进',
    color: COLORS.purple,
    glow: 'rgba(175,135,255,0.25)',
  },
  {
    icon: '🌲',
    title: 'tree-sitter AST',
    titleZh: '真正的语法树解析',
    desc: 'Real Bash parser catches curl|bash in 1ms',
    descZh: '不是正则匹配，是真正的 AST 语法分析',
    color: COLORS.accent,
    glow: 'rgba(255,135,255,0.25)',
  },
  {
    icon: '⚡',
    title: 'Zero Config',
    titleZh: '零配置，开箱即用',
    desc: 'One command install, works immediately',
    descZh: '一行命令安装，无需任何配置',
    color: COLORS.c3,
    glow: 'rgba(0,255,255,0.25)',
  },
];

const CARD_DURATION = 28; // frames per feature (~0.93s)
const TRANSITION = 8;     // overlap frames for entrance

const FeatureCard: React.FC<{
  feature: typeof FEATURES[0];
  index: number;
}> = ({ feature, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8, stiffness: 200 },
  });
  const enterOpacity = interpolate(enterSpring, [0, 1], [0, 1]);
  const enterScale = interpolate(enterSpring, [0, 1], [0.8, 1]);
  const enterY = interpolate(enterSpring, [0, 1], [60, 0]);

  // Exit fade (last 6 frames of this card's sequence)
  const exitStart = CARD_DURATION - 6;
  const exitOpacity = frame > exitStart
    ? interpolate(frame, [exitStart, CARD_DURATION], [1, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 1;

  // Glow pulse
  const glowPhase = Math.max(0, frame - 10);
  const glowPulse = 0.6 + Math.sin(glowPhase * 0.12) * 0.4;

  // Counter text "1/6"
  const counter = `${index + 1}/${FEATURES.length}`;

  return (
    <AbsoluteFill style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: enterOpacity * exitOpacity,
      transform: `translateY(${enterY}px) scale(${enterScale})`,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        width: 500, height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${feature.glow} 0%, transparent 70%)`,
        opacity: glowPulse * 0.5,
        filter: 'blur(60px)',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative',
        padding: '48px 64px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${feature.color}40`,
        boxShadow: `0 0 60px ${feature.glow}, 0 20px 60px rgba(0,0,0,0.4)`,
        textAlign: 'center',
        maxWidth: 700,
        fontFamily: FONT_MONO,
      }}>
        {/* Icon */}
        <div style={{ fontSize: 56, marginBottom: 16 }}>
          {feature.icon}
        </div>

        {/* English title */}
        <div style={{
          fontSize: 38, fontWeight: 800,
          color: feature.color,
          marginBottom: 8,
          textShadow: `0 0 30px ${feature.glow}`,
        }}>
          {feature.title}
        </div>

        {/* Chinese title */}
        <div style={{
          fontSize: 22, fontWeight: 600,
          color: feature.color,
          opacity: 0.8,
          marginBottom: 20,
        }}>
          {feature.titleZh}
        </div>

        {/* English desc */}
        <div style={{
          fontSize: 17,
          color: 'rgba(255,255,255,0.65)',
          marginBottom: 6,
          lineHeight: 1.5,
        }}>
          {feature.desc}
        </div>

        {/* Chinese desc */}
        <div style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.5,
        }}>
          {feature.descZh}
        </div>
      </div>

      {/* Counter badge — bottom right */}
      <div style={{
        position: 'absolute',
        bottom: 60, right: 80,
        fontFamily: FONT_MONO,
        fontSize: 14,
        color: 'rgba(255,255,255,0.2)',
      }}>
        {counter}
      </div>
    </AbsoluteFill>
  );
};

export const S02_Features: React.FC = () => {
  return (
    <MacDesktop darken={0.6}>
      {FEATURES.map((feature, i) => (
        <Sequence key={i} from={i * CARD_DURATION} durationInFrames={CARD_DURATION}>
          <FeatureCard feature={feature} index={i} />
        </Sequence>
      ))}
    </MacDesktop>
  );
};
