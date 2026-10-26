// ---------- First-person walk ----------
// Arrows (or WASD): ↑ ↓ walk forward and back and ← → turn; holding Shift, ← → sidestep and ↑ ↓ look up and down.
// The mouse also looks around (with the pointer captured) and a click uses what the hand in the centre of the screen
// points at (doors, TV, taps…). Esc to exit.
// If the browser does not allow capturing the mouse (e.g. inside a frame), the walk still works and you look by dragging.
// The eyes are 1.60 m above whatever floor is underneath, so steps (up to 30 cm) are climbed up and down;
// walls, furniture and glass cannot be walked through.
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const EYE = 1.6, RADIUS = 0.25, STEP_UP = 0.3, REACH = 2.5, WALK = 1.4, TURN = 1.6, LOOK = 1.0;   // m/s and rad/s
const DRAG = 0.004;                                                                          // rad per pixel when looking by dragging

// camera · floors: floor and step meshes · solids(): meshes that block the way
// pick(raycaster): { d, fn } of the nearest usable thing, or null · onChange(active): called on entering and leaving
// helpText / helpTextDrag: the help line shown at the bottom (with a captured mouse / when looking by dragging)
export function createWalk({ camera, floors, solids, pick, onChange, helpText, helpTextDrag }) {
  const plc = new PointerLockControls(camera, document.body);
  const hand = document.getElementById('hand'), help = document.getElementById('walkHelp');
  const keys = new Set(), ray = new THREE.Raycaster(), center = new THREE.Vector2(0, 0);
  const state = { active: false, free: false, entering: false, feet: 0, colliders: [], target: null };

  const visible = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const firstHit = (origin, dir, far, list) => {
    ray.set(origin, dir); ray.far = far;
    return ray.intersectObjects(list, false).find(h => visible(h.object));
  };
  const groundAt = (x, z, from) => {
    const h = firstHit(new THREE.Vector3(x, from, z), new THREE.Vector3(0, -1, 0), 4, floors);
    return h ? h.point.y : null;
  };
  // Can we move `dist` in the (horizontal) direction `dir` without touching anything at knee and chest height?
  const isFree = (pos, dir, dist) => [0.45, 1.3].every(hgt => {
    const o = new THREE.Vector3(pos.x, state.feet + hgt, pos.z);
    return !firstHit(o, dir, dist + RADIUS, state.colliders);
  });

  function enter(start, lookAt) {
    state.colliders = [];
    solids().forEach(root => root.traverse(o => { if (o.isMesh && !floors.includes(o)) state.colliders.push(o); }));
    camera.position.set(start.x, 0, start.z);
    state.feet = groundAt(start.x, start.z, 3) ?? 0;
    camera.position.y = state.feet + EYE;
    camera.lookAt(lookAt.x, state.feet + EYE, lookAt.z);
    state.entering = true;
    // Ask for the pointer directly so the rejection can be caught (inside a frame it usually fails: then we look by dragging)
    document.body.requestPointerLock?.()?.catch?.(() => {});
  }
  function begin(free) {
    state.entering = false; state.active = true; state.free = free;
    help.textContent = free ? helpTextDrag : helpText;
    hand.hidden = false; help.hidden = false; onChange(true);
  }
  function end() {
    state.active = false; state.free = false; hand.hidden = true; help.hidden = true; keys.clear(); onChange(false);
  }
  plc.addEventListener('lock', () => begin(false));
  plc.addEventListener('unlock', () => { if (!state.free) end(); });
  // Without mouse capture: walk anyway, looking by dragging (otherwise the camera would stay at eye level and the arrows
  // would keep moving the normal view)
  document.addEventListener('pointerlockerror', () => { if (state.entering) begin(true); });

  addEventListener('keydown', e => {
    if (!state.active) return;
    if (state.free && e.code === 'Escape') { end(); return; }
    keys.add(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  });
  addEventListener('keyup', e => keys.delete(e.code));
  const drag = { on: false, x: 0, y: 0, moved: false };
  document.addEventListener('mousedown', e => {
    if (!state.active || e.button !== 0) return;
    if (state.free) { Object.assign(drag, { on: true, x: e.clientX, y: e.clientY, moved: false }); return; }
    if (state.target) state.target();
  });
  document.addEventListener('mousemove', e => {
    if (!state.free || !drag.on) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true; drag.x = e.clientX; drag.y = e.clientY;
    euler.setFromQuaternion(camera.quaternion);
    euler.y += dx * DRAG; euler.x = THREE.MathUtils.clamp(euler.x + dy * DRAG, -1.3, 1.3);   // the scene is dragged, as in Street View
    camera.quaternion.setFromEuler(euler);
  });
  document.addEventListener('mouseup', e => {
    if (!state.free || !drag.on || e.button !== 0) return;
    drag.on = false;
    if (!drag.moved && state.target) state.target();                  // click without dragging: use what the hand points at
  });

  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), move = new THREE.Vector3();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const held = (...codes) => codes.some(c => keys.has(c));
  function tick(dt) {
    if (!state.active) return;
    // Where the hand points: the nearest usable thing, if within reach
    ray.setFromCamera(center, camera); ray.far = Infinity;
    const hit = pick(ray);
    state.target = hit && hit.d <= REACH ? hit.fn : null;
    hand.classList.toggle('on', !!state.target);
    hand.textContent = state.target ? '👆' : '✋';
    // Keys: without Shift, ↑ ↓ walk and ← → turn; with Shift, ← → sidestep and ↑ ↓ tilt the view
    const shift = held('ShiftLeft', 'ShiftRight');
    const up = held('KeyW', 'ArrowUp'), down = held('KeyS', 'ArrowDown');
    const left = held('KeyA', 'ArrowLeft'), rightKey = held('KeyD', 'ArrowRight');
    euler.setFromQuaternion(camera.quaternion);
    if (!shift && (left || rightKey)) euler.y += (left ? 1 : -1) * TURN * dt;
    if (shift && (up || down)) euler.x = THREE.MathUtils.clamp(euler.x + (up ? 1 : -1) * LOOK * dt, -1.3, 1.3);
    camera.quaternion.setFromEuler(euler);
    // Movement on the floor plane, sliding along walls (each axis is tried separately)
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    right.crossVectors(fwd, camera.up).normalize();
    move.set(0, 0, 0);
    if (!shift && up) move.add(fwd);
    if (!shift && down) move.sub(fwd);
    if (shift && rightKey) move.add(right);
    if (shift && left) move.sub(right);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(WALK * dt);
      for (const axis of [new THREE.Vector3(move.x, 0, 0), new THREE.Vector3(0, 0, move.z)]) {
        const dist = axis.length();
        if (dist < 1e-5) continue;
        const dir = axis.clone().divideScalar(dist), p = camera.position;
        const nx = p.x + axis.x, nz = p.z + axis.z;
        const g = groundAt(nx, nz, state.feet + STEP_UP + 0.05);
        if (g === null || g - state.feet > STEP_UP || !isFree(p, dir, dist)) continue;
        p.x = nx; p.z = nz;
      }
    }
    // Height: the eyes follow the floor (smoothly when going up or down a step)
    const g = groundAt(camera.position.x, camera.position.z, state.feet + STEP_UP + 0.05);
    if (g !== null) state.feet += (g - state.feet) * Math.min(1, dt * 12);
    camera.position.y = state.feet + EYE;
  }

  return { enter, exit: () => (state.free ? end() : plc.unlock()), tick, controls: plc, get active() { return state.active; }, supported: 'pointerLockElement' in document };
}
