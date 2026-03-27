import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { FPS, SCENE_DURATIONS, COLORS } from './theme';

import { S00_Hook } from './scenes/S00_Hook';
import { S00b_Intercept } from './scenes/S00b_Intercept';
import { S01_Opening } from './scenes/S01_Opening';
import { S02_Features } from './scenes/S02_Features';
import { S02_Install } from './scenes/S02_Install';
import { S03_Workflow } from './scenes/S03_Workflow';
import { S_Closing } from './scenes/S_Closing';

const scenes = [
  { Component: S00_Hook, duration: SCENE_DURATIONS.hook },
  { Component: S00b_Intercept, duration: SCENE_DURATIONS.intercept },
  { Component: S01_Opening, duration: SCENE_DURATIONS.opening },
  { Component: S02_Features, duration: SCENE_DURATIONS.features },
  { Component: S02_Install, duration: SCENE_DURATIONS.install },
  { Component: S03_Workflow, duration: SCENE_DURATIONS.workflow },
  { Component: S_Closing, duration: SCENE_DURATIONS.closing },
];

export const BarkDemo: React.FC = () => {
  let offset = 0;

  return (
    <AbsoluteFill style={{ background: COLORS.termBg }}>
      {scenes.map((scene, i) => {
        const from = offset;
        const durationInFrames = scene.duration * FPS;
        offset += durationInFrames;
        const { Component } = scene;

        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames}>
            <AbsoluteFill>
              <Component />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
