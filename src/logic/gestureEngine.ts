import { TUNING_CONFIG } from '../config/constants';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

export type HandPoseType = 'OPEN_PALM' | 'PINCH' | 'POINTING' | 'PEACE_SIGN' | 'THREE_FINGERS' | 'SHAKA_SIGN' | 'FIST' | 'NEUTRAL';

export type ActiveGestureType =
  | 'IDLE'
  | 'ROTATE'
  | 'ZOOM'
  | 'DUAL_CONTROL'
  | 'DRAG'
  | 'EXPLODE'
  | 'ASSEMBLE'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'POINT'
  | 'PEACE_NARRATION'
  | 'THREE_FINGER_PRESET'
  | 'SHAKA_SCALE'
  | 'TWO_FIST_HOLOGRAM'
  | 'COOP_4HAND'
  | 'FIST_PUNCH_SELECT'
  | 'RESET';

export interface HandObservation {
  handedness: 'Left' | 'Right';
  landmarks: Landmark3D[];
}

export interface GestureFrameOutput {
  handsCount: number;
  activeGesture: ActiveGestureType;
  gestureLabel: string;
  deltaRotationX: number;
  deltaRotationY: number;
  deltaZoom: number;
  deltaMoveX: number;
  deltaMoveY: number;
  targetExplode: number | null;
  pointerScreen: { x: number; y: number } | null;
  palmScreen: { x: number; y: number } | null;
  resetProgress: number;
  triggeredReset: boolean;
  swipeTriggered: 'next' | 'prev' | null;
  pinchJustStarted: boolean;
  fistPunchTriggered?: boolean;
  peaceNarrationTriggered?: boolean;
  threeFingerPresetTriggered?: boolean;
  shakaScaleTriggered?: boolean;
  twoFistHologramTriggered?: boolean;
}

export function emaSmooth(
  prev: number,
  next: number,
  alpha = TUNING_CONFIG.HAND_SMOOTHING_ALPHA
): number {
  return prev + alpha * (next - prev);
}

export function applyDeadzone(val: number, threshold: number): number {
  if (Math.abs(val) <= threshold) return 0;
  return val > 0 ? val - threshold : val + threshold;
}

export function dist2D(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/**
 * Classifies a single hand's 21 MediaPipe landmarks into a discrete pose using
 * aspect-corrected coordinates and ratios relative to handScale = dist(0, 9).
 */
export function classifyHandPose(
  landmarks: Landmark3D[],
  wasPinching = false,
  aspect = 1
): {
  pose: HandPoseType;
  pinchDistance: number;
  pinchRatio: number;
  handScale: number;
  isPinching: boolean;
} {
  if (!landmarks || landmarks.length < 21) {
    return {
      pose: 'NEUTRAL',
      pinchDistance: 1,
      pinchRatio: 10,
      handScale: TUNING_CONFIG.MIN_HAND_SCALE,
      isPinching: false,
    };
  }

  const safeAspect = aspect > 0 ? aspect : 1;
  const scaled = landmarks.map((lm) => ({
    x: lm.x * safeAspect,
    y: lm.y,
    z: lm.z,
  }));

  const wrist = scaled[0];
  const thumbTip = scaled[4];
  const indexMcp = scaled[5];
  const indexPip = scaled[6];
  const indexTip = scaled[8];
  const middleMcp = scaled[9];
  const middlePip = scaled[10];
  const middleTip = scaled[12];
  const ringPip = scaled[14];
  const ringTip = scaled[16];
  const pinkyPip = scaled[18];
  const pinkyTip = scaled[20];

  const handScale = Math.max(TUNING_CONFIG.MIN_HAND_SCALE, dist2D(wrist, middleMcp));
  const pinchDistance = dist2D(thumbTip, indexTip);
  const pinchRatio = pinchDistance / handScale;

  const isPinching = wasPinching
    ? pinchRatio < TUNING_CONFIG.PINCH_END_RATIO
    : pinchRatio <= TUNING_CONFIG.PINCH_START_RATIO;

  const isExtended = (tip: { x: number; y: number }, pip: { x: number; y: number }) =>
    dist2D(tip, wrist) > dist2D(pip, wrist) * TUNING_CONFIG.FINGER_EXTENDED_RATIO;

  const indexExt = isExtended(indexTip, indexPip);
  const middleExt = isExtended(middleTip, middlePip);
  const ringExt = isExtended(ringTip, ringPip);
  const pinkyExt = isExtended(pinkyTip, pinkyPip);

  const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;
  const pinchElevated = dist2D(indexTip, wrist) > dist2D(indexMcp, wrist) * 1.12;

  if (isPinching && (extendedCount >= 2 || pinchElevated)) {
    return { pose: 'PINCH', pinchDistance, pinchRatio, handScale, isPinching: true };
  }

  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { pose: 'POINTING', pinchDistance, pinchRatio, handScale, isPinching: false };
  }

  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return { pose: 'PEACE_SIGN', pinchDistance, pinchRatio, handScale, isPinching: false };
  }

  if (indexExt && middleExt && ringExt && !pinkyExt) {
    return { pose: 'THREE_FINGERS', pinchDistance, pinchRatio, handScale, isPinching: false };
  }

  if (!indexExt && !middleExt && !ringExt && pinkyExt) {
    return { pose: 'SHAKA_SIGN', pinchDistance, pinchRatio, handScale, isPinching: false };
  }

  if (extendedCount >= 4) {
    return { pose: 'OPEN_PALM', pinchDistance, pinchRatio, handScale, isPinching: false };
  }

  if (extendedCount === 0) {
    return { pose: 'FIST', pinchDistance, pinchRatio, handScale, isPinching: false };
  }

  if (isPinching) {
    return { pose: 'PINCH', pinchDistance, pinchRatio, handScale, isPinching: true };
  }

  return { pose: 'NEUTRAL', pinchDistance, pinchRatio, handScale, isPinching: false };
}

class PoseDebouncer {
  private establishedPose: HandPoseType | null = null;
  private candidatePose: HandPoseType | null = null;
  private candidateCount = 0;

  public reset(): void {
    this.establishedPose = null;
    this.candidatePose = null;
    this.candidateCount = 0;
  }

  public update(rawPose: HandPoseType, isPinching: boolean): HandPoseType {
    // Pinch hysteresis is exempt from pose frame debouncing
    if (isPinching || rawPose === 'PINCH') {
      this.establishedPose = 'PINCH';
      this.candidatePose = null;
      this.candidateCount = 0;
      return 'PINCH';
    }

    // First pose after hand appears (or immediately after exiting pinch) is accepted right away
    if (this.establishedPose === null || this.establishedPose === 'PINCH') {
      this.establishedPose = rawPose;
      this.candidatePose = null;
      this.candidateCount = 0;
      return rawPose;
    }

    if (rawPose === this.establishedPose) {
      this.candidatePose = null;
      this.candidateCount = 0;
      return this.establishedPose;
    }

    if (rawPose === this.candidatePose) {
      this.candidateCount += 1;
      if (this.candidateCount >= TUNING_CONFIG.POSE_DEBOUNCE_FRAMES) {
        this.establishedPose = rawPose;
        this.candidatePose = null;
        this.candidateCount = 0;
      }
    } else {
      this.candidatePose = rawPose;
      this.candidateCount = 1;
      if (TUNING_CONFIG.POSE_DEBOUNCE_FRAMES <= 1) {
        this.establishedPose = rawPose;
      }
    }

    return this.establishedPose;
  }
}

export class GestureStateMachine {
  private lastCoopMidX: number | null = null;
  private lastCoopMidY: number | null = null;
  private wasFistSingle = false;
  private lastFistPunchMs = 0;
  private smoothedPalmX = 0.5;
  private smoothedPalmY = 0.5;
  private prevPalmX: number | null = null;
  private prevPalmY: number | null = null;

  private smoothedRightPalmY = 0.5;
  private prevRightPinchY: number | null = null;
  private prevSinglePinchY: number | null = null;
  private prevTwoHandSpread: number | null = null;

  private wasPinchingSingle = false;
  private wasPinchingRight = false;
  private wasPinchingLeft = false;

  private singleDebouncer = new PoseDebouncer();
  private leftDebouncer = new PoseDebouncer();
  private rightDebouncer = new PoseDebouncer();

  private prevHandCount = 0;
  private lastHandSeenMs: number | null = null;
  private openPalmStableFrames = 0;

  private smoothedPointerX = 0.5;
  private smoothedPointerY = 0.5;

  private resetAnchor: { x: number; y: number; startTime: number } | null = null;
  private resetTriggeredForHold = false;

  private swipeHistory: Array<{ x: number; y: number; time: number }> = [];
  private lastSwipeTime = -99999;
  private peaceHoldStartMs: number | null = null;
  private lastPeaceTriggerMs = -99999;
  private threeHoldStartMs: number | null = null;
  private lastThreeTriggerMs = -99999;
  private shakaHoldStartMs: number | null = null;
  private lastShakaTriggerMs = -99999;
  private twoFistHoldStartMs: number | null = null;
  private lastTwoFistTriggerMs = -99999;

  public resetInternalState(): void {
    this.prevPalmX = null;
    this.prevPalmY = null;
    this.prevRightPinchY = null;
    this.prevSinglePinchY = null;
    this.prevTwoHandSpread = null;
    this.wasPinchingSingle = false;
    this.wasPinchingRight = false;
    this.wasPinchingLeft = false;
    this.singleDebouncer.reset();
    this.leftDebouncer.reset();
    this.rightDebouncer.reset();
    this.prevHandCount = 0;
    this.lastHandSeenMs = null;
    this.openPalmStableFrames = 0;
    this.resetAnchor = null;
    this.resetTriggeredForHold = false;
    this.swipeHistory = [];
  }

  private clearTransitionDeltas(): void {
    this.prevPalmX = null;
    this.prevPalmY = null;
    this.prevRightPinchY = null;
    this.prevSinglePinchY = null;
    this.prevTwoHandSpread = null;
    this.resetAnchor = null;
    this.swipeHistory = [];
    this.openPalmStableFrames = 0;
  }

  public processFrame(
    hands: HandObservation[],
    nowMs: number,
    aspect = 1,
    sensitivity = 1
  ): GestureFrameOutput {
    const safeAspect = aspect > 0 ? aspect : 1;
    const safeSens = Math.min(1.5, Math.max(0.5, sensitivity || 1));

    const out: GestureFrameOutput = {
      handsCount: hands.length,
      activeGesture: 'IDLE',
      gestureLabel: 'No hand detected',
      deltaRotationX: 0,
      deltaRotationY: 0,
      deltaZoom: 0,
      deltaMoveX: 0,
      deltaMoveY: 0,
      targetExplode: null,
      pointerScreen: null,
      palmScreen: null,
      resetProgress: 0,
      triggeredReset: false,
      swipeTriggered: null,
      pinchJustStarted: false,
    };

    if (hands.length === 0) {
      if (
        this.lastHandSeenMs === null ||
        nowMs - this.lastHandSeenMs >= TUNING_CONFIG.HAND_LOSS_GRACE_MS
      ) {
        this.resetInternalState();
      }
      return out;
    }

    this.lastHandSeenMs = nowMs;

    // 3.5: When hand count changes (1 <-> 2), null prevPalm, prevPinch and prevSpread
    if (this.prevHandCount !== 0 && this.prevHandCount !== hands.length) {
      this.clearTransitionDeltas();
    }
    this.prevHandCount = hands.length;

    // Mirror X coordinates in [0..1] screen space
    const mirroredHands = hands.map((h) => ({
      handedness: h.handedness,
      landmarks: h.landmarks.map((lm) => ({
        x: 1 - lm.x,
        y: lm.y,
        z: lm.z,
      })),
    }));

    // 4-HAND CO-OP PROCESSING (2 You + 2 Friend)
    if (mirroredHands.length >= 3) {
      const sorted = [...mirroredHands].sort((a, b) => a.landmarks[0].x - b.landmarks[0].x);
      const outerL = sorted[0].landmarks[9] ?? sorted[0].landmarks[0];
      const outerR = sorted[sorted.length - 1].landmarks[9] ?? sorted[sorted.length - 1].landmarks[0];
      const span = dist2D(outerL, outerR);

      let avgX = 0;
      let avgY = 0;
      for (const h of sorted) {
        const p = h.landmarks[9] ?? h.landmarks[0];
        avgX += p.x;
        avgY += p.y;
      }
      avgX /= sorted.length;
      avgY /= sorted.length;

      if (this.lastCoopMidX !== null && this.lastCoopMidY !== null) {
        out.deltaRotationY =
          applyDeadzone(avgX - this.lastCoopMidX, TUNING_CONFIG.ROTATION_DEADZONE) *
          TUNING_CONFIG.ROTATION_SENSITIVITY_X *
          safeSens;
        out.deltaRotationX =
          applyDeadzone(avgY - this.lastCoopMidY, TUNING_CONFIG.ROTATION_DEADZONE) *
          TUNING_CONFIG.ROTATION_SENSITIVITY_Y *
          safeSens;
      }
      this.lastCoopMidX = avgX;
      this.lastCoopMidY = avgY;

      out.activeGesture = 'COOP_4HAND';
      out.gestureLabel = `4-Hand Co-Op (${Math.min(4, mirroredHands.length)} hands)`;
      out.targetExplode = Math.max(0, Math.min(1, (span - 0.35) / 0.45));
      out.palmScreen = { x: avgX, y: avgY };
      return out;
    }
    this.lastCoopMidX = null;
    this.lastCoopMidY = null;

    // TWO-HAND PROCESSING
    if (mirroredHands.length >= 2) {
      const h0 = mirroredHands[0];
      const h1 = mirroredHands[1];

      const [leftHand, rightHand] =
        h0.landmarks[0].x <= h1.landmarks[0].x ? [h0, h1] : [h1, h0];

      const leftRaw = classifyHandPose(leftHand.landmarks, this.wasPinchingLeft, safeAspect);
      const rightRaw = classifyHandPose(rightHand.landmarks, this.wasPinchingRight, safeAspect);

      const leftPose = this.leftDebouncer.update(leftRaw.pose, leftRaw.isPinching);
      const rightPose = this.rightDebouncer.update(rightRaw.pose, rightRaw.isPinching);

      const pinchJustStarted =
        (!this.wasPinchingRight && rightRaw.isPinching) ||
        (!this.wasPinchingLeft && leftRaw.isPinching);
      this.wasPinchingLeft = leftRaw.isPinching;
      this.wasPinchingRight = rightRaw.isPinching;
      out.pinchJustStarted = pinchJustStarted;

      const leftPalm = leftHand.landmarks[9];
      const rightPalm = rightHand.landmarks[9];
      out.palmScreen = {
        x: (leftPalm.x + rightPalm.x) * 0.5,
        y: (leftPalm.y + rightPalm.y) * 0.5,
      };

      const leftPalmScaled = { x: leftPalm.x * safeAspect, y: leftPalm.y };
      const rightPalmScaled = { x: rightPalm.x * safeAspect, y: rightPalm.y };
      const spread = dist2D(leftPalmScaled, rightPalmScaled);
      const avgHandScale = Math.max(
        TUNING_CONFIG.MIN_HAND_SCALE,
        (leftRaw.handScale + rightRaw.handScale) * 0.5
      );

      this.resetAnchor = null;
      this.openPalmStableFrames = 0;

      // Case A0: Both hands closed fists held 0.7s -> Toggle Hologram Pyramid Mode
      if (leftPose === 'FIST' && rightPose === 'FIST') {
        if (this.twoFistHoldStartMs === null) {
          this.twoFistHoldStartMs = nowMs;
        }
        if (nowMs - this.twoFistHoldStartMs >= 700 && nowMs - this.lastTwoFistTriggerMs >= 1800) {
          this.lastTwoFistTriggerMs = nowMs;
          this.twoFistHoldStartMs = null;
          out.twoFistHologramTriggered = true;
        }
        out.activeGesture = 'TWO_FIST_HOLOGRAM';
        out.gestureLabel = 'Two fists: Toggle Hologram';
        return out;
      } else {
        this.twoFistHoldStartMs = null;
      }

      // Case A: Two hands both pinching -> zoom by change in distance between hands
      if (leftPose === 'PINCH' && rightPose === 'PINCH') {
        if (this.prevTwoHandSpread !== null) {
          const dSpread = applyDeadzone(
            spread - this.prevTwoHandSpread,
            TUNING_CONFIG.ZOOM_DEADZONE
          );
          out.deltaZoom = dSpread * TUNING_CONFIG.TWO_HAND_ZOOM_SENSITIVITY * safeSens;
        }
        this.prevTwoHandSpread = spread;
        this.prevRightPinchY = null;
        out.activeGesture = 'ZOOM';
        out.gestureLabel = 'Two-hand pinch zoom';
        return out;
      }

      // Case B: Two open hands -> continuous explode ratio
      if (leftPose === 'OPEN_PALM' && rightPose === 'OPEN_PALM') {
        const spreadRatio = spread / avgHandScale;
        const minR = TUNING_CONFIG.EXPLODE_MIN_RATIO;
        const maxR = TUNING_CONFIG.EXPLODE_MAX_RATIO;
        const explodeVal = clamp01((spreadRatio - minR) / (maxR - minR));
        out.targetExplode = explodeVal;
        this.prevTwoHandSpread = spread;
        this.prevRightPinchY = null;

        if (spreadRatio >= maxR) {
          out.activeGesture = 'EXPLODE';
          out.gestureLabel = 'Explode view';
        } else if (spreadRatio <= minR) {
          out.activeGesture = 'ASSEMBLE';
          out.gestureLabel = 'Assemble view';
        } else {
          out.activeGesture = 'DUAL_CONTROL';
          out.gestureLabel = `Explode (${Math.round(explodeVal * 100)}%)`;
        }
        return out;
      }

      // Case C: Left open + Right pinch -> Left rotates, Right zooms vertically
      this.smoothedPalmX = emaSmooth(
        this.prevPalmX === null ? leftPalm.x : this.smoothedPalmX,
        leftPalm.x
      );
      this.smoothedPalmY = emaSmooth(
        this.prevPalmY === null ? leftPalm.y : this.smoothedPalmY,
        leftPalm.y
      );

      if (leftPose === 'OPEN_PALM' && this.prevPalmX !== null && this.prevPalmY !== null) {
        const dx = applyDeadzone(
          this.smoothedPalmX - this.prevPalmX,
          TUNING_CONFIG.ROTATION_DEADZONE
        );
        const dy = applyDeadzone(
          this.smoothedPalmY - this.prevPalmY,
          TUNING_CONFIG.ROTATION_DEADZONE
        );
        out.deltaRotationY = dx * TUNING_CONFIG.ROTATION_SENSITIVITY_X * safeSens;
        out.deltaRotationX = dy * TUNING_CONFIG.ROTATION_SENSITIVITY_Y * safeSens;
      }
      this.prevPalmX = this.smoothedPalmX;
      this.prevPalmY = this.smoothedPalmY;

      if (rightPose === 'PINCH' || rightRaw.isPinching) {
        this.smoothedRightPalmY = emaSmooth(
          this.prevRightPinchY === null ? rightPalm.y : this.smoothedRightPalmY,
          rightPalm.y
        );
        if (this.prevRightPinchY !== null) {
          const dyPinch = applyDeadzone(
            this.smoothedRightPalmY - this.prevRightPinchY,
            TUNING_CONFIG.ZOOM_DEADZONE
          );
          // Moving hand up (smaller y) -> zoom in (+deltaZoom)
          out.deltaZoom = -dyPinch * TUNING_CONFIG.PINCH_ZOOM_SENSITIVITY * safeSens;
        }
        this.prevRightPinchY = this.smoothedRightPalmY;
      } else {
        this.prevRightPinchY = null;
      }

      out.activeGesture = 'DUAL_CONTROL';
      out.gestureLabel = 'Two-hand control';
      return out;
    }

    // SINGLE-HAND PROCESSING
    this.prevTwoHandSpread = null;
    this.prevRightPinchY = null;

    const hand = mirroredHands[0];
    const lm = hand.landmarks;
    const palm = lm[9];
    const indexTip = lm[8];
    out.palmScreen = { x: palm.x, y: palm.y };

    const rawClass = classifyHandPose(lm, this.wasPinchingSingle, safeAspect);
    const pose = this.singleDebouncer.update(rawClass.pose, rawClass.isPinching);

    out.pinchJustStarted = !this.wasPinchingSingle && rawClass.isPinching;
    this.wasPinchingSingle = rawClass.isPinching;

    this.smoothedPalmX = emaSmooth(
      this.prevPalmX === null ? palm.x : this.smoothedPalmX,
      palm.x
    );
    this.smoothedPalmY = emaSmooth(
      this.prevPalmY === null ? palm.y : this.smoothedPalmY,
      palm.y
    );

    // Single-hand multi-finger action gestures (Peace ✌️ = Narration, 3 Fingers = Cycle Layers, Shaka 🤙 = Cell/Body Scale)
    if (pose === 'PEACE_SIGN') {
      if (this.peaceHoldStartMs === null) this.peaceHoldStartMs = nowMs;
      if (nowMs - this.peaceHoldStartMs >= 550 && nowMs - this.lastPeaceTriggerMs >= 1800) {
        this.lastPeaceTriggerMs = nowMs;
        this.peaceHoldStartMs = null;
        out.peaceNarrationTriggered = true;
      }
      out.activeGesture = 'PEACE_NARRATION';
      out.gestureLabel = 'Peace ✌️: Start / Pause 4-Min Explanation';
      return out;
    } else {
      this.peaceHoldStartMs = null;
    }

    if (pose === 'THREE_FINGERS') {
      if (this.threeHoldStartMs === null) this.threeHoldStartMs = nowMs;
      if (nowMs - this.threeHoldStartMs >= 550 && nowMs - this.lastThreeTriggerMs >= 1400) {
        this.lastThreeTriggerMs = nowMs;
        this.threeHoldStartMs = null;
        out.threeFingerPresetTriggered = true;
      }
      out.activeGesture = 'THREE_FINGER_PRESET';
      out.gestureLabel = '3 Fingers: Cycle Body Layers';
      return out;
    } else {
      this.threeHoldStartMs = null;
    }

    if (pose === 'SHAKA_SIGN') {
      if (this.shakaHoldStartMs === null) this.shakaHoldStartMs = nowMs;
      if (nowMs - this.shakaHoldStartMs >= 550 && nowMs - this.lastShakaTriggerMs >= 1400) {
        this.lastShakaTriggerMs = nowMs;
        this.shakaHoldStartMs = null;
        out.shakaScaleTriggered = true;
      }
      out.activeGesture = 'SHAKA_SCALE';
      out.gestureLabel = 'Shaka 🤙: Cell ↔ Body Scale';
      return out;
    } else {
      this.shakaHoldStartMs = null;
    }


    const rawDx = this.prevPalmX !== null ? this.smoothedPalmX - this.prevPalmX : 0;
    const rawDy = this.prevPalmY !== null ? this.smoothedPalmY - this.prevPalmY : 0;

    this.prevPalmX = this.smoothedPalmX;
    this.prevPalmY = this.smoothedPalmY;

    // 1. Pointing (Index Finger Raycast Cursor)
    if (pose === 'POINTING') {
      this.resetAnchor = null;
      this.prevSinglePinchY = null;
      this.openPalmStableFrames = 0;
      this.smoothedPointerX = emaSmooth(this.smoothedPointerX, indexTip.x, 0.35);
      this.smoothedPointerY = emaSmooth(this.smoothedPointerY, indexTip.y, 0.35);
      out.activeGesture = 'POINT';
      out.gestureLabel = 'Point and inspect';
      out.pointerScreen = { x: this.smoothedPointerX, y: this.smoothedPointerY };
      return out;
    }

    // 2. Pinch Zoom (3.6: vertical palm movement while pinching zooms; rotation/pan disabled)
    if (pose === 'PINCH' || rawClass.isPinching) {
      this.resetAnchor = null;
      this.openPalmStableFrames = 0;
      if (this.prevSinglePinchY !== null) {
        const dyPinch = applyDeadzone(
          this.smoothedPalmY - this.prevSinglePinchY,
          TUNING_CONFIG.ZOOM_DEADZONE
        );
        // Upward movement (dy < 0) zooms in (+deltaZoom)
        out.deltaZoom = -dyPinch * TUNING_CONFIG.PINCH_ZOOM_SENSITIVITY * safeSens;
      }
      this.prevSinglePinchY = this.smoothedPalmY;
      out.activeGesture = 'ZOOM';
      out.gestureLabel = 'Pinch zoom';
      return out;
    }
    this.prevSinglePinchY = null;

    // 3. Closed Fist Drag (Move / Pan Object)
    if (pose === 'FIST') {
      const punchReady = !this.wasFistSingle && nowMs - this.lastFistPunchMs >= 600;
      this.wasFistSingle = true;
      if (punchReady) {
        this.lastFistPunchMs = nowMs;
        out.activeGesture = 'FIST_PUNCH_SELECT';
        out.gestureLabel = 'Fist Punch Select';
        out.fistPunchTriggered = true;
        out.pointerScreen = { x: palm.x, y: palm.y };
      }
      this.resetAnchor = null;
      this.openPalmStableFrames = 0;
      const moveDx = applyDeadzone(rawDx, TUNING_CONFIG.MOVE_DEADZONE);
      const moveDy = applyDeadzone(rawDy, TUNING_CONFIG.MOVE_DEADZONE);
      out.deltaMoveX = moveDx * TUNING_CONFIG.DRAG_SENSITIVITY_X * safeSens;
      out.deltaMoveY = -moveDy * TUNING_CONFIG.DRAG_SENSITIVITY_Y * safeSens;
      out.activeGesture = 'DRAG';
      out.gestureLabel = 'Move model';
      return out;
    }

    // 4. Open Palm: Stable Swipe, 2s Still Reset, or Smooth Rotate
    if (pose === 'OPEN_PALM') {
      this.openPalmStableFrames += 1;

      this.swipeHistory.push({ x: palm.x, y: palm.y, time: nowMs });
      this.swipeHistory = this.swipeHistory.filter((p) => nowMs - p.time <= 260);

      if (
        this.openPalmStableFrames >= TUNING_CONFIG.SWIPE_STABLE_PALM_FRAMES &&
        this.swipeHistory.length >= 3 &&
        nowMs - this.lastSwipeTime >= TUNING_CONFIG.SWIPE_COOLDOWN_MS
      ) {
        const oldest = this.swipeHistory[0];
        const dtSec = Math.max(0.05, (nowMs - oldest.time) / 1000);
        const swipeDx = palm.x - oldest.x;
        const swipeDy = palm.y - oldest.y;
        const vx = swipeDx / dtSec;

        if (
          Math.abs(swipeDx) > 0.22 &&
          Math.abs(swipeDx) > Math.abs(swipeDy) * 2.0 &&
          Math.abs(vx) >= TUNING_CONFIG.SWIPE_VELOCITY_THRESHOLD
        ) {
          this.lastSwipeTime = nowMs;
          this.swipeHistory = [];
          this.resetAnchor = null;
          if (swipeDx > 0) {
            out.activeGesture = 'SWIPE_RIGHT';
            out.gestureLabel = 'Next model';
            out.swipeTriggered = 'next';
          } else {
            out.activeGesture = 'SWIPE_LEFT';
            out.gestureLabel = 'Previous model';
            out.swipeTriggered = 'prev';
          }
          return out;
        }
      }

      // 2-second stillness check for Reset
      if (!this.resetAnchor) {
        this.resetAnchor = { x: this.smoothedPalmX, y: this.smoothedPalmY, startTime: nowMs };
        this.resetTriggeredForHold = false;
      } else {
        const drift = dist2D(
          { x: this.smoothedPalmX, y: this.smoothedPalmY },
          { x: this.resetAnchor.x, y: this.resetAnchor.y }
        );
        if (drift > TUNING_CONFIG.RESET_STILLNESS_RADIUS) {
          this.resetAnchor = { x: this.smoothedPalmX, y: this.smoothedPalmY, startTime: nowMs };
          this.resetTriggeredForHold = false;
        } else {
          const heldMs = nowMs - this.resetAnchor.startTime;
          out.resetProgress = Math.min(1, heldMs / TUNING_CONFIG.RESET_HOLD_DURATION_MS);
          if (heldMs >= TUNING_CONFIG.RESET_HOLD_DURATION_MS && !this.resetTriggeredForHold) {
            this.resetTriggeredForHold = true;
            out.activeGesture = 'RESET';
            out.gestureLabel = 'View reset';
            out.triggeredReset = true;
            out.targetExplode = 0;
            return out;
          }
        }
      }

      const rotDx = applyDeadzone(rawDx, TUNING_CONFIG.ROTATION_DEADZONE);
      const rotDy = applyDeadzone(rawDy, TUNING_CONFIG.ROTATION_DEADZONE);
      out.deltaRotationY = rotDx * TUNING_CONFIG.ROTATION_SENSITIVITY_X * safeSens;
      out.deltaRotationX = rotDy * TUNING_CONFIG.ROTATION_SENSITIVITY_Y * safeSens;
      out.activeGesture = 'ROTATE';
      out.gestureLabel =
        out.resetProgress > 0.25
          ? `Hold still to reset (${Math.round(out.resetProgress * 100)}%)`
          : 'Rotate';
      return out;
    }

    this.openPalmStableFrames = 0;
    out.activeGesture = 'IDLE';
    out.gestureLabel = 'Hand ready';
    return out;
  }
}

/**
 * Generates deterministic 21-point hand landmarks for tests and the Developer Simulator.
 */
export function createSyntheticHandLandmarks(
  pose: HandPoseType,
  centerX = 0.5,
  centerY = 0.55,
  pinchSpread = 0.02
): Landmark3D[] {
  const lm: Landmark3D[] = Array.from({ length: 21 }, () => ({
    x: centerX,
    y: centerY,
    z: 0,
  }));

  const wristY = centerY + 0.14;
  lm[0] = { x: centerX, y: wristY, z: 0 };

  const mcpOffsets = [-0.055, -0.018, 0.018, 0.055];
  const pipIndice = [6, 10, 14, 18];
  const dipIndice = [7, 11, 15, 19];
  const tipIndice = [8, 12, 16, 20];
  const mcpIndice = [5, 9, 13, 17];

  for (let i = 0; i < 4; i++) {
    const x = centerX + mcpOffsets[i];
    const mcpY = centerY + 0.02;
    lm[mcpIndice[i]] = { x, y: mcpY, z: 0 };

    const isIndex = i === 0;
    const shouldExtend =
      pose === 'OPEN_PALM' || (pose === 'POINTING' && isIndex) || (pose === 'PINCH' && !isIndex);

    if (shouldExtend) {
      lm[pipIndice[i]] = { x, y: mcpY - 0.05, z: 0 };
      lm[dipIndice[i]] = { x, y: mcpY - 0.095, z: 0 };
      lm[tipIndice[i]] = { x, y: mcpY - 0.14, z: 0 };
    } else if (pose === 'PINCH' && isIndex) {
      lm[pipIndice[i]] = { x: centerX - 0.03, y: centerY - 0.03, z: 0 };
      lm[dipIndice[i]] = { x: centerX - 0.02, y: centerY - 0.04, z: 0 };
      lm[tipIndice[i]] = {
        x: centerX - pinchSpread * 0.5,
        y: centerY - 0.04 - pinchSpread * 0.5,
        z: 0,
      };
    } else {
      lm[pipIndice[i]] = { x, y: mcpY - 0.03, z: 0 };
      lm[dipIndice[i]] = { x, y: mcpY - 0.01, z: 0 };
      lm[tipIndice[i]] = { x, y: mcpY + 0.02, z: 0 };
    }
  }

  lm[1] = { x: centerX - 0.04, y: wristY - 0.03, z: 0 };
  lm[2] = { x: centerX - 0.065, y: centerY + 0.05, z: 0 };
  lm[3] = { x: centerX - 0.08, y: centerY + 0.01, z: 0 };

  if (pose === 'PINCH') {
    lm[4] = {
      x: centerX + pinchSpread * 0.5,
      y: centerY - 0.04 + pinchSpread * 0.5,
      z: 0,
    };
  } else if (pose === 'OPEN_PALM') {
    lm[4] = { x: centerX - 0.11, y: centerY - 0.03, z: 0 };
  } else {
    lm[4] = { x: centerX - 0.03, y: centerY + 0.03, z: 0 };
  }

  return lm;
}
