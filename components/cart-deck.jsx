"use client";

/**
 * Throw Deck — adapted for the Eluru Foods cart.
 *
 * Original: @dorianbaffier / kokonutui.com (MIT)
 * This version is plain JSX so it can be bundled into the static cart page.
 */

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Physics
// ---------------------------------------------------------------------------

const TILTS = [0, -2, 1.5, -1];
const SLOT_Y = 9;
const SLOT_SCALE = 0.035;
const MAX_SLOT = TILTS.length - 1;

const MAX_DRAG_ROTATION = 18;
const THROW_VELOCITY = 0.5;
const THROW_DISTANCE = 0.35;
const TAP_SLOP = 5;
const VELOCITY_WINDOW = 90;

const HOME = { k: 420, c: 30 };
const FLIGHT = { k: 150, c: 15 };
const RETURN = { k: 240, c: 26 };

const TOP_Z = 1000;

function slotPose(depth) {
  const d = Math.min(depth, MAX_SLOT);
  return { x: 0, y: d * SLOT_Y, r: TILTS[d] ?? 0, s: 1 - d * SLOT_SCALE };
}

function lerpPose(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    r: a.r + (b.r - a.r) * t,
    s: a.s + (b.s - a.s) * t,
  };
}

function poseTransform({ x, y, r, s }) {
  return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;
}

function makeBody(depth) {
  const pose = slotPose(depth);
  return {
    ...pose,
    vx: 0,
    vy: 0,
    vr: 0,
    vs: 0,
    phase: "rest",
    out: pose,
    dx: 1,
    dy: 0,
    z: null,
    apexZ: null,
  };
}

function springAxis(value, velocity, target, spring, dt) {
  const accel = -spring.k * (value - target) - spring.c * velocity;
  const v = velocity + accel * dt;
  return [value + v * dt, v];
}

function stepBody(body, target, dt) {
  let spring = HOME;
  if (body.phase === "out") {
    spring = FLIGHT;
  } else if (body.phase === "return") {
    spring = RETURN;
  }
  const steps = Math.max(1, Math.ceil(dt * 240));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    [body.x, body.vx] = springAxis(body.x, body.vx, target.x, spring, h);
    [body.y, body.vy] = springAxis(body.y, body.vy, target.y, spring, h);
    [body.r, body.vr] = springAxis(body.r, body.vr, target.r, spring, h);
    [body.s, body.vs] = springAxis(body.s, body.vs, target.s, spring, h);
  }
}

function isSettled(body, target) {
  return (
    Math.abs(body.x - target.x) < 0.1 &&
    Math.abs(body.y - target.y) < 0.1 &&
    Math.abs(body.r - target.r) < 0.02 &&
    Math.abs(body.s - target.s) < 0.0005 &&
    Math.abs(body.vx) + Math.abs(body.vy) < 2 &&
    Math.abs(body.vr) < 1 &&
    Math.abs(body.vs) < 0.01
  );
}

function clearance(w, h, ux, uy) {
  const along = Math.min(
    ux === 0 ? Number.POSITIVE_INFINITY : w / Math.abs(ux),
    uy === 0 ? Number.POSITIVE_INFINITY : h / Math.abs(uy)
  );
  return along + 24;
}

function releaseVelocity(samples) {
  const last = samples.at(-1);
  const first = samples.find(
    (sample) => last && last.t - sample.t <= VELOCITY_WINDOW
  );
  if (!(first && last) || last.t - first.t < 8) {
    return { vx: 0, vy: 0 };
  }
  const dt = last.t - first.t;
  return { vx: (last.x - first.x) / dt, vy: (last.y - first.y) / dt };
}

function cardState(phase) {
  if (phase === "drag") {
    return "drag";
  }
  return phase === "rest" ? "rest" : "fly";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CardStack({
  cards = [],
  accent = "#f97316",
  actionLabel = "Add to cart",
  onAction,
  onChange,
  className,
}) {
  const count = cards.length;
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [openId, setOpenId] = useState(null);
  const reduceMotion = useReducedMotion();

  const orderRef = useRef(order);
  const bodies = useRef(cards.map((_, i) => makeBody(i)));
  const nodes = useRef([]);
  const drag = useRef(null);
  const progress = useRef(0);
  const raf = useRef(0);
  const last = useRef(0);
  const reduced = useRef(false);
  const suppressClick = useRef(false);
  const focusTop = useRef(false);
  const closeRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  reduced.current = reduceMotion === true;

  const write = useCallback((index, depth) => {
    const node = nodes.current[index];
    const body = bodies.current[index];
    if (!(node && body)) {
      return;
    }
    node.style.transform = poseTransform(body);
    node.style.zIndex = String(body.z ?? orderRef.current.length - depth);
    const state = cardState(body.phase);
    if (node.dataset.state !== state) {
      node.dataset.state = state;
    }
  }, []);

  const targetFor = useCallback((body, depth) => {
    if (body.phase === "out") {
      return body.out;
    }
    const pose = slotPose(depth);
    if (depth > 0 && progress.current > 0) {
      return lerpPose(pose, slotPose(depth - 1), progress.current * 0.6);
    }
    return pose;
  }, []);

  const advance = useCallback(
    (index, depth, dt) => {
      const body = bodies.current[index];
      if (!body) {
        return false;
      }
      if (body.phase === "drag") {
        write(index, depth);
        return true;
      }
      if (reduced.current && body.phase === "out") {
        body.phase = "rest";
        body.z = null;
      }
      const target = targetFor(body, depth);
      if (reduced.current) {
        Object.assign(body, target, { vx: 0, vy: 0, vr: 0, vs: 0 });
      } else {
        stepBody(body, target, dt);
      }
      if (body.phase === "out" && body.vx * body.dx + body.vy * body.dy <= 0) {
        body.phase = "return";
        body.z = body.apexZ;
      }
      const settled = isSettled(body, target);
      if (settled && body.phase !== "out") {
        body.phase = "rest";
        body.z = null;
      }
      write(index, depth);
      return !settled;
    },
    [targetFor, write]
  );

  const tick = useCallback(
    (now) => {
      const dt = Math.min((now - last.current) / 1000, 1 / 30);
      last.current = now;
      let active = false;
      orderRef.current.forEach((index, depth) => {
        if (advance(index, depth, dt)) {
          active = true;
        }
      });
      raf.current = active ? requestAnimationFrame(tick) : 0;
    },
    [advance]
  );

  const kick = useCallback(() => {
    if (raf.current) {
      return;
    }
    last.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useEffect(() => {
    if (orderRef.current.length === count) {
      return;
    }
    const next = Array.from({ length: count }, (_, i) => i);
    bodies.current = next.map((i) => makeBody(i));
    orderRef.current = next;
    setOrder(next);
    setOpenId(null);
    kick();
  }, [count, kick]);

  const commitOrder = useCallback(
    (next) => {
      orderRef.current = next;
      setOrder(next);
      const top = cards[next[0] ?? 0];
      if (top) {
        onChangeRef.current?.(top);
      }
      kick();
    },
    [cards, kick]
  );

  const throwTop = useCallback(
    (vx, vy, fx, fy) => {
      const current = orderRef.current;
      const index = current[0];
      if (index === undefined || current.length < 2) {
        return;
      }
      const body = bodies.current[index];
      const node = nodes.current[index];
      if (!body) {
        return;
      }
      const speed = Math.hypot(vx, vy);
      const rawX = speed > 0.05 ? vx : fx;
      const rawY = speed > 0.05 ? vy : fy;
      const norm = Math.hypot(rawX, rawY) || 1;
      const ux = rawX / norm;
      const uy = rawY / norm;
      const w = node?.offsetWidth ?? 224;
      const h = node?.offsetHeight ?? 280;
      const distance = clearance(w, h, ux, uy) + Math.min(speed * 50, 90);
      const launch = Math.max(speed, 0.9) * 1000;
      body.phase = "out";
      body.dx = ux;
      body.dy = uy;
      body.out = {
        x: ux * distance,
        y: uy * distance,
        r: Math.max(-40, Math.min(40, body.r + ux * 26)),
        s: 1,
      };
      body.vx = ux * launch;
      body.vy = uy * launch;
      body.vr += ux * launch * 0.05;
      body.z = TOP_Z;
      body.apexZ = null;
      commitOrder([...current.slice(1), index]);
    },
    [commitOrder]
  );

  const bringBack = useCallback(() => {
    const current = orderRef.current;
    const index = current.at(-1);
    if (index === undefined || current.length < 2) {
      return;
    }
    const body = bodies.current[index];
    const node = nodes.current[index];
    if (!body) {
      return;
    }
    const ux = -0.97;
    const uy = -0.24;
    const w = node?.offsetWidth ?? 224;
    const h = node?.offsetHeight ?? 280;
    const distance = clearance(w, h, ux, uy) + 20;
    body.phase = "out";
    body.dx = ux;
    body.dy = uy;
    body.out = { x: ux * distance, y: uy * distance, r: -16, s: 1 };
    body.vx = ux * 1100;
    body.vy = uy * 1100;
    body.z = 0;
    body.apexZ = TOP_Z - 1;
    commitOrder([index, ...current.slice(0, -1)]);
  }, [commitOrder]);

  const cycle = useCallback(
    (direction) => {
      if (direction === 1) {
        throwTop(1.3, -0.35, 1, 0);
      } else {
        bringBack();
      }
    },
    [throwTop, bringBack]
  );

  useEffect(() => {
    if (!focusTop.current || openId) {
      return;
    }
    focusTop.current = false;
    const topCard = order[0];
    if (topCard !== undefined) {
      nodes.current[topCard]?.focus({ preventScroll: true });
    }
  }, [order, openId]);

  const closeDetails = useCallback(() => {
    focusTop.current = true;
    setOpenId(null);
  }, []);

  useEffect(() => {
    if (!openId) {
      return;
    }
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetails();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, closeDetails]);

  const handlePointerDown = (event, index) => {
    suppressClick.current = false;
    if (drag.current || orderRef.current[0] !== index) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    const body = bodies.current[index];
    if (!body) {
      return;
    }
    const node = event.currentTarget;
    const rect = node.getBoundingClientRect();
    node.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      index,
      startX: event.clientX,
      startY: event.clientY,
      baseX: body.x,
      baseY: body.y,
      width: node.offsetWidth,
      lever: event.clientY - rect.top < rect.height / 2 ? 1 : -1,
      moved: false,
      samples: [{ t: event.timeStamp, x: event.clientX, y: event.clientY }],
    };
  };

  const handlePointerMove = (event) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved) {
      if (Math.hypot(dx, dy) < TAP_SLOP) {
        return;
      }
      if (event.pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        return;
      }
    }
    const body = bodies.current[current.index];
    if (!body) {
      return;
    }
    current.moved = true;
    current.samples.push({
      t: event.timeStamp,
      x: event.clientX,
      y: event.clientY,
    });
    if (current.samples.length > 24) {
      current.samples.shift();
    }
    body.phase = "drag";
    body.x = current.baseX + dx;
    body.y = current.baseY + dy;
    body.s = 1;
    body.r =
      Math.max(-1, Math.min(1, body.x / current.width)) *
      MAX_DRAG_ROTATION *
      current.lever;
    body.vx = 0;
    body.vy = 0;
    body.vr = 0;
    body.vs = 0;
    progress.current = Math.min(
      Math.hypot(body.x, body.y) / (current.width * THROW_DISTANCE),
      1
    );
    kick();
  };

  const handlePointerUp = (event, cancelled = false) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) {
      return;
    }
    drag.current = null;
    progress.current = 0;
    const body = bodies.current[current.index];
    if (!(body && current.moved)) {
      kick();
      return;
    }
    if (cancelled) {
      body.phase = "rest";
      kick();
      return;
    }
    suppressClick.current = true;
    const { vx, vy } = releaseVelocity(current.samples);
    const speed = Math.hypot(vx, vy);
    const distance = Math.hypot(body.x, body.y);
    const heading = distance > 0 ? (vx * body.x + vy * body.y) / distance : 0;
    const fast = speed > THROW_VELOCITY && heading > -0.2;
    const far = distance > current.width * THROW_DISTANCE && heading > -0.3;
    if (fast || far) {
      throwTop(vx, vy, body.x / (distance || 1), body.y / (distance || 1));
      return;
    }
    body.phase = "rest";
    body.vx = vx * 1000;
    body.vy = vy * 1000;
    body.vr = ((vx * 1000) / current.width) * MAX_DRAG_ROTATION * current.lever;
    kick();
  };

  const handleKeyDown = (event) => {
    suppressClick.current = false;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTop.current = true;
      cycle(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTop.current = true;
      cycle(-1);
    }
  };

  const topIndex = order[0] ?? 0;
  const top = cards[topIndex];
  const open = openId ? cards.find((card) => card.id === openId) : undefined;

  if (count === 0) {
    return null;
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          "relative mx-auto flex min-h-[20rem] w-full max-w-md flex-col items-center justify-center py-4",
          className
        )}
        style={{ "--deck-accent": accent }}
      >
        <section
          aria-label="Card deck. Drag a card away or use the arrow keys to cycle."
          className="relative aspect-[4/5] w-[min(14rem,calc(100%-4rem))]"
          inert={Boolean(open)}
        >
          {cards.map((card, index) => {
            const depth = order.indexOf(index);
            const isTop = depth === 0;
            const isOpen = openId === card.id;
            return (
              <button
                aria-label={`${card.title}, ${card.subtitle}. Open details`}
                className={cn(
                  "group/deck-card absolute inset-0 origin-bottom touch-pan-y select-none rounded-2xl text-left outline-none will-change-transform",
                  "shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-4px_rgb(0_0_0/0.12)] transition-shadow duration-200 ease-out dark:shadow-[0_1px_2px_rgb(0_0_0/0.4),0_6px_16px_-6px_rgb(0_0_0/0.7)]",
                  "data-[state=drag]:shadow-[0_2px_4px_rgb(0_0_0/0.05),0_28px_48px_-16px_rgb(0_0_0/0.3)] data-[state=fly]:shadow-[0_2px_4px_rgb(0_0_0/0.05),0_28px_48px_-16px_rgb(0_0_0/0.3)]",
                  "focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
                  isTop && "cursor-grab data-[state=drag]:cursor-grabbing",
                  isOpen && "shadow-none dark:shadow-none"
                )}
                data-state="rest"
                inert={!isTop}
                key={card.id}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  if (orderRef.current[0] === index) {
                    setOpenId(card.id);
                  }
                }}
                onKeyDown={handleKeyDown}
                onLostPointerCapture={(event) => handlePointerUp(event, true)}
                onPointerCancel={(event) => handlePointerUp(event, true)}
                onPointerDown={(event) => handlePointerDown(event, index)}
                onPointerMove={handlePointerMove}
                onPointerUp={(event) => handlePointerUp(event)}
                ref={(node) => {
                  nodes.current[index] = node;
                }}
                style={{
                  transform: poseTransform(slotPose(index)),
                  zIndex: count - index,
                }}
                tabIndex={isTop ? 0 : -1}
                type="button"
              >
                {!isOpen && (
                  <motion.span
                    className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900"
                    layoutDependency={openId}
                    layoutId={`deck-${card.id}`}
                    transition={LAYOUT_SPRING}
                  >
                    <motion.span
                      className="relative block min-h-0 flex-1 overflow-hidden rounded-xl"
                      layoutDependency={openId}
                      layoutId={`deck-art-${card.id}`}
                      transition={LAYOUT_SPRING}
                    >
                      {card.art}
                    </motion.span>
                    <span className="flex items-end justify-between gap-3 px-1.5 pt-2.5 pb-1">
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-sm text-zinc-900 dark:text-zinc-100">
                          {card.title}
                        </span>
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {card.subtitle}
                        </span>
                      </span>
                      {card.price && (
                        <span className="shrink-0 text-sm text-zinc-900 tabular-nums dark:text-zinc-100">
                          {card.price}
                        </span>
                      )}
                    </span>
                  </motion.span>
                )}
              </button>
            );
          })}
        </section>

        <div
          className="mt-5 flex w-[min(14rem,calc(100%-4rem))] items-center justify-between gap-2"
          inert={Boolean(open)}
        >
          <button
            aria-label="Previous card"
            className={NAV_BUTTON}
            onClick={() => cycle(-1)}
            type="button"
          >
            <ChevronLeft className="size-4" />
          </button>
          <p
            aria-live="polite"
            className="min-w-0 truncate text-center text-xs text-zinc-500 tabular-nums dark:text-zinc-400"
          >
            <span className="text-zinc-900 dark:text-zinc-100">
              {String(topIndex + 1).padStart(2, "0")}
            </span>
            {" / "}
            {String(count).padStart(2, "0")}
            <span className="sr-only">: {top?.title}</span>
          </p>
          <button
            aria-label="Next card"
            className={NAV_BUTTON}
            onClick={() => cycle(1)}
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <DeckDetails
              actionLabel={actionLabel}
              card={open}
              closeRef={closeRef}
              key="details"
              onAction={onAction}
              onClose={closeDetails}
              openId={openId}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function DeckDetails({
  card,
  openId,
  actionLabel,
  onAction,
  onClose,
  closeRef,
}) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-white/85 p-4 backdrop-blur-sm dark:bg-zinc-950/85"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    >
      <motion.div
        aria-label={card.title}
        aria-modal="true"
        className="relative flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_24px_48px_-12px_rgb(0_0_0/0.25)] dark:border-zinc-800 dark:bg-zinc-900"
        layoutDependency={openId}
        layoutId={`deck-${card.id}`}
        role="dialog"
        transition={LAYOUT_SPRING}
      >
        <motion.div
          className="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-xl"
          layoutDependency={openId}
          layoutId={`deck-art-${card.id}`}
          transition={LAYOUT_SPRING}
        >
          {card.art}
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="min-h-0 overflow-y-auto px-2 pt-3 pb-1"
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          initial={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25, delay: 0.08, ease: EASE_OUT }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-medium text-base text-zinc-900 dark:text-zinc-100">
              {card.title}
            </h3>
            {card.price && (
              <span className="text-sm text-zinc-900 tabular-nums dark:text-zinc-100">
                {card.price}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {card.subtitle}
          </p>
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed dark:text-zinc-300">
            {card.description}
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
            {card.specs.map((spec) => (
              <div
                className="min-w-0 bg-white px-2.5 py-2 dark:bg-zinc-900"
                key={spec.label}
              >
                <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {spec.label}
                </dt>
                <dd className="truncate text-xs text-zinc-900 dark:text-zinc-100">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
          <button
            className="mt-3 h-9 w-full rounded-lg bg-[var(--deck-accent)] font-medium text-sm text-white transition-[filter] duration-150 ease-out hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 active:brightness-95 dark:focus-visible:ring-offset-zinc-900"
            onClick={() => onAction?.(card)}
            type="button"
          >
            {actionLabel}
          </button>
        </motion.div>
        <button
          aria-label="Close details"
          className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-white text-zinc-600 transition-colors duration-150 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          <X className="size-3.5" />
        </button>
      </motion.div>
    </motion.div>
  );
}

const EASE_OUT = [0.23, 1, 0.32, 1];
const LAYOUT_SPRING = { type: "spring", duration: 0.45, bounce: 0 };
const NAV_BUTTON =
  "flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 active:translate-y-px dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";
