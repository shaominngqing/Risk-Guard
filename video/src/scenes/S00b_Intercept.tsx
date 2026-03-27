import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { MacDesktop } from '../components/MacDesktop';
import { CharGradientLine } from '../components/GradientText';
import { BARK_ASCII_SMALL, COLORS, FONT_MONO } from '../theme';
import { springIn } from '../animations';

/**
 * Transition Scene (3s = 90 frames)
 *
 * From pain to solution.
 *
 * 0-30f:  "如果安全的操作自动放行" fades in
 *         "危险的操作才来找你呢？"
 * 30-55f: Bark logo + "这就是 Bark" springs in
 * 55-75f: Tagline: "A good dog that barks at danger so you don't have to watch."
 * 75-90f: Hold + fade
 */

export const S00b_Intercept: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Question text
  const q1Spring = springIn(frame, fps, 5, 'gentle');
  const q1Opacity = interpolate(q1Spring, [0, 1], [0, 1]);
  const q1Y = interpolate(q1Spring, [0, 1], [20, 0]);

  const q2Spring = springIn(frame, fps, 15, 'gentle');
  const q2Opacity = interpolate(q2Spring, [0, 1], [0, 1]);
  const q2Y = interpolate(q2Spring, [0, 1], [15, 0]);

  // Question fades out when Bark comes in
  const qFade = frame >= 28
    ? interpolate(frame, [28, 38], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;

  // Bark logo + name
  const barkSpring = springIn(frame, fps, 35, 'snappy');
  const barkOpacity = interpolate(barkSpring, [0, 1], [0, 1]);
  const barkScale = interpolate(barkSpring, [0, 1], [0.85, 1]);

  // Tagline
  const tagSpring = springIn(frame, fps, 50, 'gentle');
  const tagOpacity = interpolate(tagSpring, [0, 1], [0, 1]);
  const tagY = interpolate(tagSpring, [0, 1], [12, 0]);

  // Subtitle features
  const subSpring = springIn(frame, fps, 60, 'gentle');
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  return (
    <MacDesktop darken={0.6}>
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Question */}
        <div style={{ opacity: qFade, textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            opacity: q1Opacity, transform: `translateY(${q1Y}px)`,
            fontFamily: FONT_MONO, fontSize: 26, color: 'rgba(255,255,255,0.8)',
            marginBottom: 10,
          }}>
            如果<span style={{ color: COLORS.low, fontWeight: 700 }}>安全的操作</span>自动放行
          </div>
          <div style={{
            opacity: q2Opacity, transform: `translateY(${q2Y}px)`,
            fontFamily: FONT_MONO, fontSize: 26, color: 'rgba(255,255,255,0.8)',
          }}>
            <span style={{ color: COLORS.high, fontWeight: 700 }}>危险的操作</span>才来找你呢？
          </div>
        </div>

        {/* Bark logo + name */}
        <div style={{
          opacity: barkOpacity,
          transform: `scale(${barkScale})`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 18, lineHeight: 1.15,
            marginBottom: 14,
          }}>
            {BARK_ASCII_SMALL.map((line, i) => (
              <CharGradientLine key={i} text={line}
                colors={['#00afff', '#00d7ff', '#00ffff', '#5fffff', '#00d7d7', '#00afff']}
              />
            ))}
          </div>

          {/* Tagline */}
          <div style={{
            opacity: tagOpacity, transform: `translateY(${tagY}px)`,
            fontFamily: FONT_MONO, fontSize: 16,
            color: 'rgba(255,255,255,0.45)',
            textAlign: 'center', maxWidth: 600, lineHeight: 1.6,
          }}>
            A good dog that barks at danger so you don't have to watch the screen all day.
          </div>

          {/* Key features in one line */}
          <div style={{
            opacity: subOpacity,
            display: 'flex', gap: 20, marginTop: 20,
            fontFamily: FONT_MONO, fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
          }}>
            <span><span style={{ color: COLORS.low }}>●</span> 安全操作 → 自动放行</span>
            <span><span style={{ color: COLORS.medium }}>●</span> 可疑操作 → 通知你</span>
            <span><span style={{ color: COLORS.high }}>●</span> 危险操作 → 拦截确认</span>
          </div>
        </div>
      </AbsoluteFill>
    </MacDesktop>
  );
};
