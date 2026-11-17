import {V2, V3, cross, dot, norm, sub, UP} from './math';

export type Cam = {pos: V3; target: V3; f: number; cx: number; cy: number};
export type P = V2 & {d: number; s: number};

/** Pinhole projection. World: x right, y up, z away from the first camera. */
export const makeProjector = (cam: Cam) => {
  const fw = norm(sub(cam.target, cam.pos));
  const right = norm(cross(UP, fw));
  const up = cross(fw, right);
  const project = (p: V3): P => {
    const d = sub(p, cam.pos);
    const depth = Math.max(0.05, dot(d, fw));
    const s = cam.f / depth;
    return {x: cam.cx + dot(d, right) * s, y: cam.cy - dot(d, up) * s, d: depth, s};
  };
  return {project, fw, right, up, cam};
};
export type Projector = ReturnType<typeof makeProjector>;

export const W = 1080;
export const H = 1920;
