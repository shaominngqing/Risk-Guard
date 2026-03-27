import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { MacDesktop } from '../components/MacDesktop';
import { CharGradientLine } from '../components/GradientText';
import { BARK_ASCII, COLORS, FONT_MONO, GRADIENT_CSS, SCENE_DURATIONS } from '../theme';
import { springIn } from '../animations';

/**
 * Closing Scene (3s = 90 frames)
 *
 * Call to action — install command + GitHub + star.
 *
 * 0-10f:  Logo fades in
 * 10-25f: Install command appears
 * 25-40f: GitHub link + star CTA
 * 40-90f: Hold, gentle glow
 */

export const S_Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo
  const logoSpring = springIn(frame, fps, 5, 'snappy');
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoScale = interpolate(logoSpring, [0, 1], [0.9, 1]);

  // Install command
  const cmdSpring = springIn(frame, fps, 18, 'gentle');
  const cmdOpacity = interpolate(cmdSpring, [0, 1], [0, 1]);
  const cmdY = interpolate(cmdSpring, [0, 1], [15, 0]);

  // GitHub CTA
  const ctaSpring = springIn(frame, fps, 32, 'gentle');
  const ctaOpacity = interpolate(ctaSpring, [0, 1], [0, 1]);
  const ctaY = interpolate(ctaSpring, [0, 1], [15, 0]);

  return (
    <MacDesktop darken={0.6}>
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Logo */}
        <div style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          fontFamily: FONT_MONO, fontSize: 22, lineHeight: 1.12,
          marginBottom: 28,
        }}>
          {BARK_ASCII.map((line, i) => (
            <div key={i}>
              <CharGradientLine
                text={line}
                colors={['#00afff', '#00d7ff', '#00ffff', '#5fffff', '#00d7d7', '#00afff']}
              />
            </div>
          ))}
        </div>

        {/* Install command box */}
        <div style={{
          opacity: cmdOpacity,
          transform: `translateY(${cmdY}px)`,
          fontFamily: FONT_MONO, fontSize: 15,
          padding: '14px 28px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${COLORS.c2}30`,
          boxShadow: `0 0 30px rgba(0,215,255,0.08)`,
          color: COLORS.c2,
          marginBottom: 24,
        }}>
          curl -fsSL <span style={{ color: '#888' }}>https://...bark.../install.sh</span> | bash
        </div>

        {/* GitHub + CTA */}
        <div style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          textAlign: 'center',
          fontFamily: FONT_MONO,
        }}>
          <div style={{
            fontSize: 20, color: 'rgba(255,255,255,0.8)',
            marginBottom: 10,
          }}>
            github.com/shaominngqing/<span style={{ color: COLORS.c2, fontWeight: 700 }}>bark-claude-code-hook</span>
          </div>
          <div style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.4)',
          }}>
            Star ⭐ if you find it useful
          </div>
        </div>
      </AbsoluteFill>
    </MacDesktop>
  );
};
