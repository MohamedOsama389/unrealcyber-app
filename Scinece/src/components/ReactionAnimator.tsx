import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { buildReactionAnimationPlan } from "../animation/planner";
import type {
  AnimationStage,
  AtomActor,
  BondActor,
  ElectronPathActor,
  GasBubbleActor,
  ProductGroupActor,
  SharedPairActor
} from "../animation/types";
import type { ReactionPrediction } from "../chemistry";

interface ReactionAnimatorProps {
  prediction: ReactionPrediction;
}

type Speed = 0.75 | 1 | 1.5 | 2;

const SPEED_OPTIONS: Speed[] = [0.75, 1, 1.5, 2];

const STAGE_LABEL: Record<AnimationStage, string> = {
  before: "Before",
  reaction: "Reaction",
  after: "After"
};

const PALETTE: Record<AtomActor["category"], { nucleus: string; shell: string; text: string; electron: string }> = {
  metal: { nucleus: "#f59e0b", shell: "#fbbf24", text: "#7c2d12", electron: "#0ea5e9" },
  nonmetal: { nucleus: "#0ea5e9", shell: "#38bdf8", text: "#083344", electron: "#0f172a" },
  ion: { nucleus: "#64748b", shell: "#94a3b8", text: "#0f172a", electron: "#22d3ee" },
  molecule: { nucleus: "#475569", shell: "#94a3b8", text: "#f8fafc", electron: "#22d3ee" }
};

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const ringRadii = (shellCount: number): number[] => Array.from({ length: Math.max(1, shellCount) }, (_, i) => 26 + i * 14);
const outerRadius = (shellCount: number): number => ringRadii(shellCount).at(-1) ?? 26;
const atomVisualRadius = (atom: AtomActor): number => atom.renderStyle === "polyatomic" ? 38 : outerRadius(atom.shellCount) + 12;

const transitionFor = (speed: Speed): { type: "spring"; stiffness: number; damping: number; mass: number } => ({
  type: "spring",
  stiffness: 190,
  damping: 21,
  mass: speed === 2 ? 0.7 : speed === 0.75 ? 1.2 : speed === 1.5 ? 0.85 : 1
});

const chargeText = (charge: number): string => {
  if (charge === 0) return "";
  if (charge > 0) return charge === 1 ? "+" : `${charge}+`;
  return Math.abs(charge) === 1 ? "-" : `${Math.abs(charge)}-`;
};

const AtomGlyph = ({
  atom,
  stage,
  speed,
  hideChargeInGroup
}: {
  atom: AtomActor;
  stage: AnimationStage;
  speed: Speed;
  hideChargeInGroup: boolean;
}) => {
  const state = atom.states[stage];
  const palette = PALETTE[atom.category];
  const groupedAfter = stage === "after" && hideChargeInGroup;
  if (atom.renderStyle === "polyatomic") {
    return (
      <motion.g
        initial={false}
        animate={{ x: state.x, y: state.y, opacity: state.opacity, scale: state.scale }}
        transition={transitionFor(speed)}
      >
        <rect x={-34} y={-22} width={68} height={44} rx={14} fill="#dbeafe" stroke="#64748b" strokeWidth={1.8} />
        <text textAnchor="middle" dominantBaseline="middle" fontWeight={800} fontSize={17} fill="#0f172a">
          {atom.badgeLabel ?? atom.symbol}
        </text>
        {state.charge !== 0 && !groupedAfter ? (
          <text x={28} y={-18} textAnchor="start" fontSize={11} fontWeight={800} fill="#0f172a">
            {chargeText(state.charge)}
          </text>
        ) : null}
      </motion.g>
    );
  }

  const rings = ringRadii(atom.shellCount);
  const valence = clamp(state.valenceElectrons, 0, 8);
  const orbit = rings[rings.length - 1] ?? 26;
  const textSize = atom.symbol.length > 2 ? 12 : atom.symbol.length === 2 ? 16 : 19;

  return (
    <motion.g
      initial={false}
      animate={{ x: state.x, y: state.y, opacity: state.opacity, scale: state.scale }}
      transition={transitionFor(speed)}
    >
      {rings.map((r, index) => (
        <circle
          key={`${atom.id}-ring-${index}`}
          cx={0}
          cy={0}
          r={r}
          fill="none"
          stroke={palette.shell}
          strokeOpacity={groupedAfter ? 0.28 : 0.65}
          strokeWidth={groupedAfter ? 1.6 : 2}
        />
      ))}

      {Array.from({ length: valence }, (_, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(valence, 1);
        return (
          <circle
            key={`${atom.id}-valence-${i}`}
            cx={orbit * Math.cos(angle)}
            cy={orbit * Math.sin(angle)}
            r={4.5}
            fill={palette.electron}
            opacity={groupedAfter ? 0.55 : 1}
            filter="url(#electronGlow)"
          />
        );
      })}

      <circle cx={0} cy={0} r={18} fill={palette.nucleus} stroke="#e2e8f0" strokeWidth={1.5} />
      <text textAnchor="middle" dominantBaseline="middle" fontWeight={800} fontSize={textSize} fill={palette.text}>
        {atom.symbol}
      </text>
      {state.charge !== 0 && !groupedAfter ? (
        <text x={16} y={-18} textAnchor="start" fontSize={11} fontWeight={800} fill="#0f172a">
          {chargeText(state.charge)}
        </text>
      ) : null}
    </motion.g>
  );
};

const BondGlyph = ({
  bond,
  atoms,
  stage,
  speed
}: {
  bond: BondActor;
  atoms: Map<string, AtomActor>;
  stage: AnimationStage;
  speed: Speed;
}) => {
  const from = atoms.get(bond.fromAtomId);
  const to = atoms.get(bond.toAtomId);
  if (!from || !to) return null;

  const fromState = from.states[stage];
  const toState = to.states[stage];
  const state = bond.states[stage];
  const involvesPolyatomic = from.renderStyle === "polyatomic" || to.renderStyle === "polyatomic";

  const dx = toState.x - fromState.x;
  const dy = toState.y - fromState.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-4, 4] : [-6, 0, 6];

  return (
    <g>
      {offsets.map((offset, index) => (
        <motion.line
          key={`${bond.id}-${index}`}
          initial={false}
          x1={fromState.x + nx * offset}
          y1={fromState.y + ny * offset}
          x2={toState.x + nx * offset}
          y2={toState.y + ny * offset}
          stroke={involvesPolyatomic ? "#94a3b8" : "#0f172a"}
          strokeLinecap="round"
          animate={{
            x1: fromState.x + nx * offset,
            y1: fromState.y + ny * offset,
            x2: toState.x + nx * offset,
            y2: toState.y + ny * offset,
            opacity: involvesPolyatomic ? state.opacity * 0.6 : state.opacity,
            strokeWidth: involvesPolyatomic ? Math.max(1.2, state.thickness * 0.7) : state.thickness
          }}
          transition={transitionFor(speed)}
        />
      ))}
    </g>
  );
};

const SharedPairGlyph = ({
  pair,
  atoms,
  stage,
  speed
}: {
  pair: SharedPairActor;
  atoms: Map<string, AtomActor>;
  stage: AnimationStage;
  speed: Speed;
}) => {
  const left = atoms.get(pair.leftAtomId);
  const right = atoms.get(pair.rightAtomId);
  if (!left || !right) return null;

  const ls = left.states[stage];
  const rs = right.states[stage];
  const state = pair.states[stage];

  const mx = (ls.x + rs.x) / 2;
  const my = (ls.y + rs.y) / 2;

  return (
    <g>
      {Array.from({ length: pair.pairCount }, (_, i) => {
        const py = my + (i - (pair.pairCount - 1) / 2) * 11;
        return (
          <g key={`${pair.id}-${i}`}>
            <motion.circle
              initial={false}
              animate={{ cx: mx - state.spread / 2, cy: py, opacity: state.opacity }}
              transition={transitionFor(speed)}
              r={4.2}
              fill="#0284c7"
              filter="url(#electronGlow)"
            />
            <motion.circle
              initial={false}
              animate={{ cx: mx + state.spread / 2, cy: py, opacity: state.opacity }}
              transition={transitionFor(speed)}
              r={4.2}
              fill="#0284c7"
              filter="url(#electronGlow)"
            />
          </g>
        );
      })}
    </g>
  );
};

const ElectronPathGlyph = ({
  path,
  atoms,
  stage,
  speed,
  cycle
}: {
  path: ElectronPathActor;
  atoms: Map<string, AtomActor>;
  stage: AnimationStage;
  speed: Speed;
  cycle: number;
}) => {
  const from = atoms.get(path.fromAtomId);
  const to = atoms.get(path.toAtomId);
  if (!from || !to) return null;

  const fs = from.states[stage];
  const ts = to.states[stage];

  const startR = outerRadius(from.shellCount);
  const endR = outerRadius(to.shellCount);

  const sx = fs.x + startR * Math.cos(path.fromAngle);
  const sy = fs.y + startR * Math.sin(path.fromAngle);
  const txFull = ts.x + endR * Math.cos(path.toAngle);
  const tyFull = ts.y + endR * Math.sin(path.toAngle);

  const tx = sx + (txFull - sx) * path.targetMix;
  const ty = sy + (tyFull - sy) * path.targetMix;

  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const d = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / d) * path.curvature;
  const cy = my + (dx / d) * path.curvature;

  const state = path.states[stage];
  const reactionDuration = 1.18 / speed;

  const animateProps = stage === "reaction"
    ? { cx: [sx, cx, tx], cy: [sy, cy, ty], opacity: [0, state.opacity, 0.95] }
    : stage === "before"
      ? { cx: sx, cy: sy, opacity: state.opacity }
      : { cx: tx, cy: ty, opacity: state.opacity };

  return (
    <motion.circle
      key={`${path.id}-${stage}-${cycle}`}
      initial={false}
      animate={animateProps}
      transition={stage === "reaction"
        ? { duration: reactionDuration, ease: "easeInOut", times: [0, 0.5, 1] }
        : transitionFor(speed)}
      r={4.6}
      fill="#0ea5e9"
      filter="url(#electronGlow)"
    />
  );
};

const GasBubbleGlyph = ({ bubble, stage, speed }: { bubble: GasBubbleActor; stage: AnimationStage; speed: Speed }) => {
  const state = bubble.states[stage];
  return (
    <motion.g initial={false} animate={{ x: state.x, y: state.y, opacity: state.opacity, scale: state.scale }} transition={transitionFor(speed)}>
      <circle cx={0} cy={0} r={24} fill="#dcfce7" stroke="#16a34a" strokeWidth={2} filter="url(#bubbleGlow)" />
      <text textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight={800} fill="#166534">{bubble.label}</text>
    </motion.g>
  );
};

const ProductGroupGlyph = ({
  group,
  atoms,
  stage,
  speed
}: {
  group: ProductGroupActor;
  atoms: Map<string, AtomActor>;
  stage: AnimationStage;
  speed: Speed;
}) => {
  const state = group.states[stage];
  if (state.opacity <= 0) {
    return null;
  }

  const members = group.atomIds
    .map((id) => atoms.get(id))
    .filter((item): item is AtomActor => Boolean(item));
  if (!members.length) {
    return null;
  }

  const extents = members.map((member) => {
    const s = member.states[stage];
    const r = atomVisualRadius(member);
    return { left: s.x - r, right: s.x + r, top: s.y - r, bottom: s.y + r };
  });

  const minX = Math.min(...extents.map((e) => e.left)) - 18;
  const maxX = Math.max(...extents.map((e) => e.right)) + 18;
  const minY = Math.min(...extents.map((e) => e.top)) - 18;
  const maxY = Math.max(...extents.map((e) => e.bottom)) + 28;
  const width = maxX - minX;
  const height = maxY - minY;

  return (
    <motion.g initial={false} animate={{ opacity: state.opacity }} transition={transitionFor(speed)}>
      <rect x={minX} y={minY} width={width} height={height} rx={24} fill="#eff6ff" fillOpacity={0.38} stroke="#93c5fd" strokeWidth={1.8} />
      <rect x={minX + width / 2 - 40} y={maxY - 20} width={80} height={22} rx={11} fill="#dbeafe" stroke="#93c5fd" strokeWidth={1.2} />
      <text x={minX + width / 2} y={maxY - 6} textAnchor="middle" fontSize={12} fontWeight={800} fill="#1e3a8a">
        {group.label}
      </text>
    </motion.g>
  );
};

export function ReactionAnimator({ prediction }: ReactionAnimatorProps) {
  const [speed, setSpeed] = useState<Speed>(1);
  const [stageIndex, setStageIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [replayTick, setReplayTick] = useState(0);
  const [paused, setPaused] = useState(false);

  const planData = useMemo(() => buildReactionAnimationPlan(prediction), [prediction]);
  const stage = planData.stages[stageIndex] ?? "before";

  const atomsById = useMemo(() => new Map(planData.atoms.map((item) => [item.id, item])), [planData.atoms]);
  const groupedAfterChargeHiddenIds = useMemo(() => {
    if (stage !== "after") {
      return new Set<string>();
    }
    const hidden = new Set<string>();
    planData.productGroups
      .filter((group) => group.states.after.opacity > 0.5)
      .forEach((group) => {
        group.atomIds.forEach((id) => {
          const atom = atomsById.get(id);
          if (atom && atom.renderStyle !== "polyatomic") {
            hidden.add(id);
          }
        });
      });
    return hidden;
  }, [atomsById, planData.productGroups, stage]);

  useEffect(() => {
    setPaused(false);
    setStageIndex(0);
    setCycle(0);
    setReplayTick((current) => current + 1);
  }, [planData.id]);

  useEffect(() => {
    if (paused) {
      return () => undefined;
    }
    const duration = planData.stageDurationMs[stage] / speed;
    const timerId = window.setTimeout(() => {
      setStageIndex((current) => {
        const next = (current + 1) % planData.stages.length;
        if (next === 0) {
          setCycle((value) => value + 1);
        }
        return next;
      });
    }, duration);

    return () => window.clearTimeout(timerId);
  }, [paused, planData.stageDurationMs, planData.stages.length, stage, speed, replayTick]);

  const replay = (): void => {
    setPaused(false);
    setStageIndex(0);
    setCycle((value) => value + 1);
    setReplayTick((value) => value + 1);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Atomic-Shell Animation</p>
          <h4 className="text-lg font-bold text-slate-900">{planData.equation}</h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Speed</span>
          {SPEED_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSpeed(value)}
              className={`rounded px-2 py-1 font-semibold ${speed === value ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-700"}`}
            >
              {value}x
            </button>
          ))}
          <button type="button" onClick={replay} className="rounded bg-slate-900 px-3 py-1.5 font-semibold text-white">
            Replay
          </button>
          <button
            type="button"
            onClick={() => setPaused((current) => !current)}
            className={`rounded px-3 py-1.5 font-semibold text-white ${paused ? "bg-amber-500" : "bg-slate-700"}`}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
        {planData.stages.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setStageIndex(planData.stages.indexOf(name));
              setPaused(true);
            }}
            className={`rounded px-2 py-1 ${stage === name ? "bg-sky-600 text-white" : "bg-slate-200"}`}
          >
            {STAGE_LABEL[name]}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${planData.layout.width} ${planData.layout.height}`}
        className="h-[420px] w-full rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,#f0f9ff,transparent_45%),radial-gradient(circle_at_80%_80%,#ecfeff,transparent_45%),#ffffff]"
        role="img"
        aria-label="Atomic shell reaction animation"
      >
        <defs>
          <filter id="electronGlow">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bubbleGlow">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {planData.bonds.map((bond) => (
          <BondGlyph key={bond.id} bond={bond} atoms={atomsById} stage={stage} speed={speed} />
        ))}

        {planData.sharedPairs.map((pair) => (
          <SharedPairGlyph key={pair.id} pair={pair} atoms={atomsById} stage={stage} speed={speed} />
        ))}

        {planData.electronPaths.map((path) => (
          <ElectronPathGlyph key={path.id} path={path} atoms={atomsById} stage={stage} speed={speed} cycle={cycle} />
        ))}

        {planData.productGroups.map((group) => (
          <ProductGroupGlyph key={group.id} group={group} atoms={atomsById} stage={stage} speed={speed} />
        ))}

        {planData.atoms.map((item) => (
          <AtomGlyph key={item.id} atom={item} stage={stage} speed={speed} hideChargeInGroup={groupedAfterChargeHiddenIds.has(item.id)} />
        ))}

        {planData.gasBubbles.map((bubble) => (
          <GasBubbleGlyph key={bubble.id} bubble={bubble} stage={stage} speed={speed} />
        ))}
      </svg>

      <p className="mt-3 text-sm text-slate-700">{planData.stageCaption[stage]}</p>
    </section>
  );
}


