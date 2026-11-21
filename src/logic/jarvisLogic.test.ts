import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDeadzone,
  classifyHandPose,
  createSyntheticHandLandmarks,
  emaSmooth,
  GestureStateMachine,
  Landmark3D,
} from './gestureEngine';
import { JARVIS_REPLIES, parseVoiceTranscript } from './voiceCommands';
import { SCIENCE_MODELS } from '../config/constants';

function scaleLandmarks(landmarks: Landmark3D[], factor: number): Landmark3D[] {
  const cx = landmarks[0].x;
  const cy = landmarks[0].y;
  return landmarks.map((lm) => ({
    x: cx + (lm.x - cx) * factor,
    y: cy + (lm.y - cy) * factor,
    z: lm.z * factor,
  }));
}

test('EMA smoothing and deadzone filtering behave deterministically', () => {
  const smoothed = emaSmooth(0, 10, 0.25);
  assert.equal(smoothed, 2.5);
  assert.equal(applyDeadzone(0.005, 0.01), 0);
  assert.ok(Math.abs(applyDeadzone(0.025, 0.01) - 0.015) < 1e-6);
});

test('classifyHandPose accurately distinguishes OPEN_PALM, PINCH, POINTING, and FIST', () => {
  const openLm = createSyntheticHandLandmarks('OPEN_PALM', 0.5, 0.5);
  assert.equal(classifyHandPose(openLm).pose, 'OPEN_PALM');

  const pinchLm = createSyntheticHandLandmarks('PINCH', 0.5, 0.5, 0.02);
  assert.equal(classifyHandPose(pinchLm).pose, 'PINCH');

  const pointLm = createSyntheticHandLandmarks('POINTING', 0.5, 0.5);
  assert.equal(classifyHandPose(pointLm).pose, 'POINTING');

  const fistLm = createSyntheticHandLandmarks('FIST', 0.5, 0.5);
  assert.equal(classifyHandPose(fistLm).pose, 'FIST');
});

test('Scale invariance: OPEN_PALM scaled 0.4x and 1.5x stays OPEN_PALM; PINCH scaled 1.5x and 2x stays PINCH', () => {
  const openBase = createSyntheticHandLandmarks('OPEN_PALM', 0.5, 0.5);
  assert.equal(classifyHandPose(scaleLandmarks(openBase, 0.4)).pose, 'OPEN_PALM');
  assert.equal(classifyHandPose(scaleLandmarks(openBase, 1.5)).pose, 'OPEN_PALM');

  const pinchBase = createSyntheticHandLandmarks('PINCH', 0.5, 0.5, 0.02);
  assert.equal(classifyHandPose(scaleLandmarks(pinchBase, 1.5)).pose, 'PINCH');
  assert.equal(classifyHandPose(scaleLandmarks(pinchBase, 2.0)).pose, 'PINCH');
});

test('GestureStateMachine triggers RESET after holding open palm still for 2000ms', () => {
  const machine = new GestureStateMachine();
  const openHand = {
    handedness: 'Right' as const,
    landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.5, 0.5),
  };

  const f0 = machine.processFrame([openHand], 1000);
  assert.equal(f0.triggeredReset, false);
  assert.equal(f0.activeGesture, 'ROTATE');

  const fMid = machine.processFrame([openHand], 2000);
  assert.equal(fMid.triggeredReset, false);
  assert.ok(fMid.resetProgress >= 0.45 && fMid.resetProgress <= 0.55);

  const fDone = machine.processFrame([openHand], 3050);
  assert.equal(fDone.triggeredReset, true);
  assert.equal(fDone.activeGesture, 'RESET');
  assert.equal(fDone.targetExplode, 0);
});

test('Hand loss < 300 ms keeps state; >= 300 ms resets internal state', () => {
  const machine = new GestureStateMachine();
  const openHand = {
    handedness: 'Right' as const,
    landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.5, 0.5),
  };

  // Start holding at t=1000
  machine.processFrame([openHand], 1000);
  const f1 = machine.processFrame([openHand], 1800);
  assert.ok(f1.resetProgress > 0.35);

  // Brief hand loss for 200 ms (< 300 ms) keeps resetAnchor
  machine.processFrame([], 1950);
  const fRecovered = machine.processFrame([openHand], 2000);
  assert.ok(fRecovered.resetProgress >= 0.45);

  // Hand loss for 350 ms (>= 300 ms) resets state
  machine.processFrame([], 2360);
  const fAfterReset = machine.processFrame([openHand], 2400);
  assert.equal(fAfterReset.resetProgress, 0);
});

test('GestureStateMachine detects two-hand spread EXPLODE, close ASSEMBLE, and continuous 0..1 mapping', () => {
  const machine = new GestureStateMachine();
  // handScale for synthetic hand is 0.12.
  // Wide spread: 0.82 - 0.18 = 0.64 -> ratio = 0.64 / 0.12 = 5.33 >= 4.5 -> EXPLODE (1)
  const leftWide = {
    handedness: 'Left' as const,
    landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.82, 0.5),
  };
  const rightWide = {
    handedness: 'Right' as const,
    landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.18, 0.5),
  };

  const explodeOut = machine.processFrame([leftWide, rightWide], 1000);
  assert.equal(explodeOut.activeGesture, 'EXPLODE');
  assert.equal(explodeOut.targetExplode, 1);

  // Mid spread: 0.695 - 0.305 = 0.39 -> ratio = 0.39 / 0.12 = 3.25 -> (3.25 - 2.0) / 2.5 = 0.5
  const leftMid = {
    handedness: 'Left' as const,
    landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.695, 0.5),
  };
  const rightMid = {
    handedness: 'Right' as const,
    landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.305, 0.5),
  };
  const midOut = machine.processFrame([leftMid, rightMid], 1100);
  assert.equal(midOut.activeGesture, 'DUAL_CONTROL');
  assert.ok(midOut.targetExplode !== null && Math.abs(midOut.targetExplode - 0.5) < 0.05);

  // Close spread: 0.56 - 0.44 = 0.12 -> ratio = 0.12 / 0.12 = 1.0 <= 2.0 -> ASSEMBLE (0)
  const leftClose = {
    handedness: 'Left' as const,
    landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.56, 0.5),
  };
  const rightClose = {
    handedness: 'Right' as const,
    landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.44, 0.5),
  };
  const assembleOut = machine.processFrame([leftClose, rightClose], 1200);
  assert.equal(assembleOut.activeGesture, 'ASSEMBLE');
  assert.equal(assembleOut.targetExplode, 0);
});

test('parseVoiceTranscript supports English, Hinglish, Devanagari, intent priority, and wake-word rules', () => {
  const cmdSolar = parseVoiceTranscript('Jarvis, show solar system');
  assert.equal(cmdSolar.recognized, true);
  assert.deepEqual(cmdSolar.action, { type: 'SELECT_MODEL', modelId: 'solar' });

  const cmdExplode = parseVoiceTranscript('Jarvis alag karo');
  assert.equal(cmdExplode.recognized, true);
  assert.deepEqual(cmdExplode.action, { type: 'EXPLODE' });

  const cmdThanks = parseVoiceTranscript('Jarvis, thank you so much!');
  assert.equal(cmdThanks.recognized, true);
  assert.deepEqual(cmdThanks.action, { type: 'THANK_YOU_EASTER_EGG' });

  const devExplode = parseVoiceTranscript('अलग करो');
  assert.equal(devExplode.recognized, true);
  assert.deepEqual(devExplode.action, { type: 'EXPLODE' });

  const devSolar = parseVoiceTranscript('सौर मंडल');
  assert.equal(devSolar.recognized, true);
  assert.deepEqual(devSolar.action, { type: 'SELECT_MODEL', modelId: 'solar' });

  const cmdHuman = parseVoiceTranscript('Jarvis show human body');
  assert.equal(cmdHuman.recognized, true);
  assert.deepEqual(cmdHuman.action, { type: 'SELECT_MODEL', modelId: 'human-body' });

  const devHuman = parseVoiceTranscript('मानव शरीर');
  assert.equal(devHuman.recognized, true);
  assert.deepEqual(devHuman.action, { type: 'SELECT_MODEL', modelId: 'human-body' });

  const narrStart = parseVoiceTranscript('Continue explaining the human body');
  assert.equal(narrStart.recognized, true);
  assert.deepEqual(narrStart.action, { type: 'START_HUMAN_BODY_NARRATION' });

  const wapasJodo = parseVoiceTranscript('Jarvis wapas jodo');
  assert.equal(wapasJodo.recognized, true);
  assert.deepEqual(wapasJodo.action, { type: 'ASSEMBLE' });
});

test('Every jarvisReply string, when parsed, triggers no action', () => {
  for (const reply of Object.values(JARVIS_REPLIES)) {
    const parsedNoWake = parseVoiceTranscript(reply, false);
    assert.equal(parsedNoWake.recognized, false, `Reply "${reply}" should not trigger an action`);
    assert.equal(parsedNoWake.action, null);

    const parsedWithWake = parseVoiceTranscript(reply, true);
    assert.equal(parsedWithWake.recognized, false);
    assert.equal(parsedWithWake.action, null);
  }
});

test('All 5 science models have 3 facts and valid explodable sub-parts', () => {
  assert.equal(SCIENCE_MODELS.length, 2);
  for (const model of SCIENCE_MODELS) {
    assert.equal(model.facts.length, 3);
    assert.ok(model.parts.length >= 4);
  }
});
