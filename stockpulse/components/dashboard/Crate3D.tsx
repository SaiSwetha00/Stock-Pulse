'use client'

/**
 * A slowly turning wireframe crate. Six CSS-transformed faces, no WebGL.
 *
 * Loaded only by `CrateMark`, only after `requestIdleCallback`, and only on a
 * device that has not asked for less work. If you are reading this because you
 * want a second 3D element: don't. Phase 5 approved one.
 *
 * WHY THE CSS IS IN HERE AND NOT globals.css:
 *   Two reasons, and the second is the real one.
 *
 *   1. `globals.css` is in the shared stylesheet every route downloads,
 *      including `/login`. Rules that exist for one decoration on one
 *      authenticated page should not be paid for by a signed-out visitor.
 *   2. "Removable in one commit" has to be true of the styles as well as the
 *      markup. If these keyframes lived in globals.css they would outlive the
 *      component by exactly as long as it takes somebody to not notice them —
 *      the app already carries a documented case of a dead rule surviving its
 *      only two call sites (D33).
 *
 *   Delete this file and its style goes with it. That is the whole argument.
 *
 * PERFORMANCE SHAPE:
 *   `transform` only, a compositor-friendly property, on a 44px box that is
 *   `aria-hidden` and `pointer-events:none`. No layout, no paint of anything
 *   underneath, and the element's own box never changes size — so it cannot
 *   contribute to CLS however long it runs.
 *
 * D18: the resting state is correct. If the animation never starts, the crate
 * is still a crate at a readable angle — the keyframes only rotate it.
 */

const FACE = 'sp-crate-face'

export default function Crate3D() {
  return (
    <>
      <style>{CSS}</style>
      <div className="sp-crate-scene" aria-hidden="true">
        <div className="sp-crate">
          <span className={`${FACE} sp-crate-fz`} />
          <span className={`${FACE} sp-crate-bk`} />
          <span className={`${FACE} sp-crate-rt`} />
          <span className={`${FACE} sp-crate-lt`} />
          <span className={`${FACE} sp-crate-tp`} />
          <span className={`${FACE} sp-crate-bt`} />
        </div>
      </div>
    </>
  )
}

/**
 * 44px cube, so half-edge is 22px. `perspective` is deliberately shallow — a
 * long perspective on a 44px object reads as a flat rotating square.
 */
const CSS = `
.sp-crate-scene{
  width:44px;height:44px;
  perspective:150px;
  pointer-events:none;
}
.sp-crate{
  position:relative;
  width:44px;height:44px;
  transform-style:preserve-3d;
  /* Resting angle: the same three-quarter view the static SVG draws, so the
     swap from static to animated is a continuation rather than a jump. */
  transform:rotateX(-22deg) rotateY(-34deg);
}
.sp-crate-face{
  position:absolute;
  inset:0;
  border:1px solid var(--border-strong);
  border-radius:2px;
  background:transparent;
}
.sp-crate-fz{ transform:translateZ(22px); }
.sp-crate-bk{ transform:rotateY(180deg) translateZ(22px); }
.sp-crate-rt{ transform:rotateY(90deg) translateZ(22px); }
.sp-crate-lt{ transform:rotateY(-90deg) translateZ(22px); }
.sp-crate-bt{ transform:rotateX(-90deg) translateZ(22px); }
/* The one gold face — D22: gold is the mark, and there is one of it. Declared
   after the shared face rule so its border colour wins. */
.sp-crate-tp{ transform:rotateX(90deg) translateZ(22px); border-color:var(--accent); }

@media (prefers-reduced-motion: no-preference){
  @keyframes sp-crate-turn{
    from{ transform:rotateX(-22deg) rotateY(-34deg); }
    to  { transform:rotateX(-22deg) rotateY(326deg); }
  }
  .sp-crate{
    animation:sp-crate-turn 18s linear infinite;
  }
}
`
