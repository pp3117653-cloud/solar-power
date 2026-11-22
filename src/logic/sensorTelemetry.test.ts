import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SensorVerificationEngine } from './sensorTelemetry';
import { createSyntheticHandLandmarks } from './gestureEngine';

test('sensor telemetry reports observed points per second instead of the benchmark constant', () => {
  const engine = new SensorVerificationEngine();
  const hands = [
    { handedness: 'Right' as const, landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.4, 0.5) },
  ];
  engine.verifyFrame([], 'IDLE', 1000);
  const snapshot = engine.verifyFrame(hands, 'ROTATE', 1100);

  assert.equal(snapshot.totalHands, 1);
  assert.equal(snapshot.totalLandmarks, 21);
  assert.equal(snapshot.sampleRateHz, 10);
  assert.equal(snapshot.measuredSensorsPerSec, 210);
  assert.equal(snapshot.targetSensorsPerSec, 274);
});

test('sensor telemetry returns zero observed points when no hands are present', () => {
  const engine = new SensorVerificationEngine();
  const snapshot = engine.verifyFrame([], 'IDLE', 1000);

  assert.equal(snapshot.totalHands, 0);
  assert.equal(snapshot.totalLandmarks, 0);
  assert.equal(snapshot.measuredSensorsPerSec, 0);
  assert.equal(snapshot.sampleRateHz, Number((1 / 0.022).toFixed(1)));
});
