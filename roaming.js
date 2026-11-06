// Room coordinates, independent of the viewport and growth scale. Care keeps
// the last position; only this idle walk controller may translate the pet.
export const WALK_ATLAS = '/public/assets/didi-walk-v1.png';
export const WALK_LIMIT = 32;
export const WALK_SPEED = 12; // room pixels / second
export const WALK_FRAME_MS = 140;
// Fixed registration for each age, measured from the generated atlas. Never
// compensate per frame: feet move as part of the gait, the torso does not bob.
export function walkRegistration(stage) {
  const cell = 1254 / 4;
  return { x: -5, y: 147 - (stage === 'kitten' ? 286 : 291) * 156 / cell };
}

export function planWalk(from = 0, random = Math.random) {
  from = Math.max(-WALK_LIMIT, Math.min(WALK_LIMIT, from));
  const direction = from >= 12 ? -1 : from <= -12 ? 1 : random() < .5 ? -1 : 1;
  const to = direction * (20 + Math.floor(random() * 13));
  return { from, to, direction, duration: Math.abs(to - from) / WALK_SPEED * 1000 };
}

export function walkSample(plan, elapsed) {
  const progress = Math.min(1, Math.max(0, elapsed / plan.duration));
  return {
    x: Math.round(plan.from + (plan.to - plan.from) * progress),
    frame: Math.floor(Math.max(0, elapsed) / WALK_FRAME_MS) % 8,
    done: progress === 1,
  };
}

export function walkFramePosition(frame, stage) {
  if (!Number.isInteger(frame) || frame < 0 || frame > 7) throw new RangeError('Invalid walk frame');
  const index = frame + (stage === 'kitten' ? 0 : 8);
  return { x: (index % 4) * 100 / 3, y: Math.floor(index / 4) * 100 / 3 };
}
