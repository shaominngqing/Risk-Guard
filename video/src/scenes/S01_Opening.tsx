import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { MacDesktop } from '../components/MacDesktop';
import { Transition3D } from '../components/Transition3D';
import { CharGradientLine } from '../components/GradientText';
import { Camera, cameraOpening } from '../components/Camera';
import { BARK_ASCII, COLORS, FONT_MONO, GRADIENT_CSS, SCENE_DURATIONS } from '../theme';
import { springIn } from '../animations';

export const S01_Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Banner appears as one block
  const bannerSpring = springIn(frame, fps, 5, 'snappy');
  const bannerOpacity = interpolate(bannerSpring, [0, 1], [0, 1]);
  const bannerScale = interpolate(bannerSpring, [0, 1], [0.9, 1]);

  // Subtitle
  const subSpring = springIn(frame, fps, 14, 'gentle');
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);
  const subY = interpolate(subSpring, [0, 1], [18, 0]);

  return (
    <Transition3D type="pushIn">
      <Camera keyframes={cameraOpening(SCENE_DURATIONS.opening)}>
      <MacDesktop darken={0.55}>
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Block Pixel Art Banner */}
          <div style={{
            fontFamily: FONT_MONO, fontSize: 30, lineHeight: 1.15,
            marginBottom: 28,
            opacity: bannerOpacity, transform: `scale(${bannerScale})`,
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

          {/* Subtitle + version */}
          <div style={{
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            fontFamily: FONT_MONO, fontSize: 22,
            color: 'rgba(255,255,255,0.75)', textAlign: 'center',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            AI-Powered Risk Assessment for Claude Code
            <span style={{
              marginLeft: 16, background: GRADIENT_CSS,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', fontWeight: 700,
            }}>
              v2.0.2
            </span>
          </div>
        </AbsoluteFill>
      </MacDesktop>
      </Camera>
    </Transition3D>
  );
};
