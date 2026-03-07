import type { BondType } from "../engine/types";
import { getElement, getLikelyIonicCharge } from "../engine/chemistry";
import { isElemental, splitIonicCompound } from "../chemistry";
import type { ReactionPrediction } from "../chemistry";

interface BondAnimationProps {
  leftSymbol: string;
  rightSymbol: string;
  bondType: BondType;
  prediction?: ReactionPrediction | null;
}

const firstSymbol = (formula: string): string | undefined => formula.match(/^([A-Z][a-z]?)/)?.[1];

const formatCharge = (raw: number): string => {
  const magnitude = Math.abs(raw);
  if (raw > 0) {
    return magnitude === 1 ? "+" : `${magnitude}+`;
  }
  if (raw < 0) {
    return magnitude === 1 ? "-" : `${magnitude}-`;
  }
  return "";
};

const detectMetalAcidDisplacement = (prediction?: ReactionPrediction | null): { anion: string } | undefined => {
  if (!prediction || prediction.reactionType !== "single_substitution") {
    return undefined;
  }
  const hasHydrogenGas = prediction.products.some((p) => p.formula === "H2");
  if (!hasHydrogenGas) {
    return undefined;
  }
  const acidReactant = prediction.reactants.find((r) => /^H[A-Za-z0-9()]*$/.test(r.formula) && r.formula !== "H2O");
  const acidIons = acidReactant ? splitIonicCompound(acidReactant.formula) : undefined;
  if (!acidIons) {
    return undefined;
  }
  return { anion: acidIons.anion.formula };
};

const detectMetalSaltDisplacement = (
  prediction?: ReactionPrediction | null
): { incoming: string; displaced: string; anion: string; transferCount: number; displacedCharge: number } | undefined => {
  if (!prediction || prediction.reactionType !== "single_substitution") {
    return undefined;
  }
  if (prediction.products.some((p) => p.formula === "H2")) {
    return undefined;
  }

  const incomingTerm = prediction.reactants.find((r) => isElemental(r.formula));
  const compoundTerm = prediction.reactants.find((r) => !isElemental(r.formula));
  if (!incomingTerm || !compoundTerm) {
    return undefined;
  }

  const incoming = firstSymbol(incomingTerm.formula);
  const reactantIons = splitIonicCompound(compoundTerm.formula);
  if (!incoming || !reactantIons) {
    return undefined;
  }

  const incomingElement = getElement(incoming);
  if (!incomingElement || incomingElement.category !== "metal") {
    return undefined;
  }

  const displacedTerm = prediction.products.find((p) => isElemental(p.formula) && p.formula !== incoming && p.formula !== "H2");
  const displaced = displacedTerm ? firstSymbol(displacedTerm.formula) : undefined;
  if (!displaced) {
    return undefined;
  }

  const displacedElement = getElement(displaced);
  if (!displacedElement || displacedElement.category !== "metal") {
    return undefined;
  }

  return {
    incoming,
    displaced,
    anion: reactantIons.anion.formula,
    transferCount: Math.max(1, Math.abs(reactantIons.cation.charge)),
    displacedCharge: reactantIons.cation.charge
  };
};

const detectCompoundSwap = (
  prediction?: ReactionPrediction | null
): {
  leftCation: string;
  leftAnion: string;
  rightCation: string;
  rightAnion: string;
  productA: string;
  productB: string;
  leaving: string[];
} | undefined => {
  if (!prediction || !prediction.occurred) {
    return undefined;
  }
  if (!["double_substitution", "acid_base_neutralization"].includes(prediction.reactionType)) {
    return undefined;
  }
  if (prediction.reactants.length < 2) {
    return undefined;
  }

  const left = splitIonicCompound(prediction.reactants[0].formula);
  const right = splitIonicCompound(prediction.reactants[1].formula);
  if (!left || !right) {
    return undefined;
  }

  const productA = prediction.products[0]?.formula ?? "";
  const productB = prediction.products[1]?.formula ?? "";
  const leaving = prediction.products
    .map((p) => p.formula)
    .filter((formula) => !splitIonicCompound(formula) && formula !== productA && formula !== productB);

  return {
    leftCation: left.cation.formula,
    leftAnion: left.anion.formula,
    rightCation: right.cation.formula,
    rightAnion: right.anion.formula,
    productA,
    productB,
    leaving
  };
};

export function BondAnimation({ leftSymbol, rightSymbol, bondType, prediction }: BondAnimationProps) {
  if (bondType === "unsupported") {
    return null;
  }

  const left = getElement(leftSymbol);
  const right = getElement(rightSymbol);

  const typicalCovalentValence: Record<string, number> = {
    H: 1,
    O: 2,
    N: 3,
    C: 4,
    F: 1,
    Cl: 1,
    Br: 1,
    I: 1,
    S: 2,
    P: 3
  };

  const ionicTransferCount = (() => {
    if (bondType !== "ionic" || !left || !right) {
      return 1;
    }
    const leftIsMetal = left.category === "metal";
    const cation = leftIsMetal ? left : right;
    const cationCharge = Math.max(0, getLikelyIonicCharge(cation));
    return Math.max(1, cationCharge || 1);
  })();

  const ionicLabels = (() => {
    if (bondType !== "ionic" || !left || !right) {
      return { left: `${leftSymbol}`, right: `${rightSymbol}` };
    }
    const leftCharge = getLikelyIonicCharge(left);
    const rightCharge = getLikelyIonicCharge(right);
    return {
      left: `${leftSymbol}${formatCharge(leftCharge)}`,
      right: `${rightSymbol}${formatCharge(rightCharge)}`
    };
  })();

  const covalentSharedPairs = (() => {
    if (bondType === "ionic" || !left || !right) {
      return 1;
    }
    const leftNeed = typicalCovalentValence[left.symbol] ?? 1;
    const rightNeed = typicalCovalentValence[right.symbol] ?? 1;
    return Math.max(1, Math.min(3, Math.min(leftNeed, rightNeed)));
  })();

  const metalAcidDisplacement = detectMetalAcidDisplacement(prediction);
  const metalSaltDisplacement = detectMetalSaltDisplacement(prediction);
  const compoundSwap = detectCompoundSwap(prediction);
  const noReaction = Boolean(prediction && !prediction.occurred);

  if (noReaction && prediction) {
    const leftFormula = prediction.reactants[0]?.formula ?? leftSymbol;
    const rightFormula = prediction.reactants[1]?.formula ?? rightSymbol;
    const reason = prediction.reason[0] ?? "No driving force found.";
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold">Bond Animation (no reaction)</h3>
        <svg viewBox="0 0 520 190" className="h-44 w-full">
          <rect x="58" y="54" width="152" height="76" rx="16" fill="#f8fafc" stroke="#94a3b8" />
          <text x="134" y="96" textAnchor="middle" className="fill-slate-800 text-2xl font-bold">{leftFormula}</text>

          <rect x="308" y="54" width="152" height="76" rx="16" fill="#f8fafc" stroke="#94a3b8" />
          <text x="384" y="96" textAnchor="middle" className="fill-slate-800 text-2xl font-bold">{rightFormula}</text>

          <text x="260" y="98" textAnchor="middle" className="fill-slate-600 text-lg font-semibold">no reaction</text>
          <text x="260" y="144" textAnchor="middle" className="fill-slate-500 text-sm">{reason}</text>
        </svg>
        <p className="text-xs text-slate-600">These reactants stay as they are under current rules; no displacement or ion swap is favored.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold">Bond Animation ({bondType})</h3>

      {metalAcidDisplacement ? (
        <svg viewBox="0 0 520 190" className="h-44 w-full">
          <defs>
            <filter id="gasGlow">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="bond-atom-left acid-metal-approach">
            <circle cx="120" cy="95" r="42" fill="#ffedd5" stroke="#f97316" strokeWidth="1.7" />
            <text x="120" y="103" textAnchor="middle" className="fill-slate-900 text-3xl font-bold">
              {leftSymbol}
            </text>
          </g>

          <g className="acid-h-leaves">
            <circle cx="252" cy="90" r="26" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="260" y="98" textAnchor="middle" className="fill-blue-700 text-2xl font-bold">
              H
            </text>
          </g>

          <g className="acid-cl-stays">
            <circle cx="338" cy="90" r="31" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
            <text x="338" y="98" textAnchor="middle" className="fill-slate-700 text-2xl font-bold">
              {metalAcidDisplacement.anion}{formatCharge(-1)}
            </text>
            <line x1="276" y1="90" x2="307" y2="90" stroke="#64748b" strokeWidth="2" strokeDasharray="4 3" className="acid-hcl-link" />
          </g>

          <line x1="162" y1="96" x2="305" y2="96" stroke="#1e293b" strokeWidth="3" className="acid-salt-bond" />
          <text x="224" y="76" className="fill-orange-600 text-sm font-semibold acid-salt-bond">
            {leftSymbol}+ + {metalAcidDisplacement.anion}-
          </text>

          <g className="bond-displaced-h2">
            <circle cx="425" cy="130" r="17" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" filter="url(#gasGlow)" />
            <text x="425" y="136" textAnchor="middle" className="fill-emerald-700 text-base font-bold">
              H2 vapor
            </text>
          </g>

          <g className="bond-product-salt">
            <rect x="180" y="132" width="172" height="33" rx="16" fill="#0f172a" />
            <text x="266" y="153" textAnchor="middle" className="fill-white text-sm font-semibold">
              {leftSymbol}{metalAcidDisplacement.anion} formed
            </text>
          </g>
        </svg>
      ) : null}

      {!metalAcidDisplacement && metalSaltDisplacement ? (
        <svg viewBox="0 0 520 190" className="h-44 w-full">
          <defs>
            <filter id="metalOutGlow">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="bond-atom-left metal-displace-incoming">
            <circle cx="110" cy="95" r="40" fill="#ffedd5" stroke="#f97316" strokeWidth="1.7" />
            <text x="110" y="103" textAnchor="middle" className="fill-slate-900 text-3xl font-bold">
              {metalSaltDisplacement.incoming}
            </text>
          </g>

          <g>
            <circle cx="258" cy="90" r="30" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" className="metal-displaced-out" />
            <text x="258" y="98" textAnchor="middle" className="fill-blue-700 text-2xl font-bold metal-displaced-out">
              {metalSaltDisplacement.displaced}{formatCharge(metalSaltDisplacement.displacedCharge)}
            </text>
            <circle cx="336" cy="90" r="31" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
            <text x="336" y="98" textAnchor="middle" className="fill-slate-700 text-2xl font-bold">
              {metalSaltDisplacement.anion}
            </text>
            <line x1="286" y1="90" x2="307" y2="90" stroke="#64748b" strokeWidth="2" className="metal-salt-link" />
          </g>

          {Array.from({ length: metalSaltDisplacement.transferCount }, (_, i) => (
            <circle
              key={`metal-transfer-${i}`}
              cx="145"
              cy={88 + i * 10}
              r={4.5}
              fill="#2563eb"
              className="bond-electron-transfer"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}

          <line x1="152" y1="96" x2="304" y2="96" stroke="#1e293b" strokeWidth="3" className="metal-new-bond" />
          <text x="215" y="76" className="fill-orange-600 text-sm font-semibold metal-new-bond">
            {metalSaltDisplacement.incoming}+ + {metalSaltDisplacement.anion}-
          </text>

          <g className="metal-leaving-solid">
            <circle cx="430" cy="124" r="19" fill="#f1f5f9" stroke="#334155" strokeWidth="1.5" filter="url(#metalOutGlow)" />
            <text x="430" y="130" textAnchor="middle" className="fill-slate-700 text-base font-bold">
              {metalSaltDisplacement.displaced}
            </text>
          </g>

          <g className="bond-product-salt">
            <rect x="180" y="132" width="172" height="33" rx="16" fill="#0f172a" />
            <text x="266" y="153" textAnchor="middle" className="fill-white text-sm font-semibold">
              {metalSaltDisplacement.incoming}{metalSaltDisplacement.anion} formed
            </text>
          </g>
        </svg>
      ) : null}

      {!metalAcidDisplacement && !metalSaltDisplacement && compoundSwap ? (
        <svg viewBox="0 0 520 190" className="h-44 w-full">
          <g>
            <circle cx="108" cy="88" r="26" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.4" />
            <text x="108" y="95" textAnchor="middle" className="fill-blue-700 text-lg font-bold">{compoundSwap.leftCation}</text>
            <circle cx="188" cy="88" r="26" fill="#f8fafc" stroke="#64748b" strokeWidth="1.4" />
            <text x="188" y="95" textAnchor="middle" className="fill-slate-700 text-lg font-bold">{compoundSwap.leftAnion}</text>
            <line x1="133" y1="88" x2="163" y2="88" stroke="#64748b" strokeWidth="2" />
          </g>

          <g>
            <circle cx="322" cy="88" r="26" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.4" />
            <text x="322" y="95" textAnchor="middle" className="fill-blue-700 text-lg font-bold">{compoundSwap.rightCation}</text>
            <circle cx="402" cy="88" r="26" fill="#f8fafc" stroke="#64748b" strokeWidth="1.4" />
            <text x="402" y="95" textAnchor="middle" className="fill-slate-700 text-lg font-bold">{compoundSwap.rightAnion}</text>
            <line x1="347" y1="88" x2="377" y2="88" stroke="#64748b" strokeWidth="2" />
          </g>

          <path d="M 118 116 C 164 136, 214 136, 258 116" fill="none" stroke="#0f172a" strokeWidth="2" className="swap-arrow" />
          <path d="M 332 116 C 288 136, 238 136, 192 116" fill="none" stroke="#0f172a" strokeWidth="2" className="swap-arrow" />

          <circle cx="108" cy="88" r="5" fill="#2563eb" className="swap-cation-left" />
          <circle cx="322" cy="88" r="5" fill="#2563eb" className="swap-cation-right" />

          <g className="swap-products">
            <rect x="96" y="140" width="138" height="30" rx="14" fill="#0f172a" />
            <text x="165" y="160" textAnchor="middle" className="fill-white text-sm font-semibold">{compoundSwap.productA}</text>
            <rect x="286" y="140" width="138" height="30" rx="14" fill="#0f172a" />
            <text x="355" y="160" textAnchor="middle" className="fill-white text-sm font-semibold">{compoundSwap.productB}</text>
          </g>

          {compoundSwap.leaving.length ? (
            <text x="260" y="132" textAnchor="middle" className="fill-emerald-700 text-sm font-semibold">
              {compoundSwap.leaving.join(" + ")} leaves
            </text>
          ) : null}
        </svg>
      ) : null}

      {!metalAcidDisplacement && !metalSaltDisplacement && !compoundSwap ? (
        <svg viewBox="0 0 520 190" className="h-44 w-full">
          <defs>
            <linearGradient id="electronTrail" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="bond-atom-left">
            <circle cx="145" cy="92" r="47" fill="#ffedd5" stroke="#f97316" strokeWidth="1.7" />
            <circle cx="145" cy="92" r="66" fill="none" stroke="#fdba74" strokeDasharray="3 4" strokeWidth="1.2" />
            <text x="145" y="100" textAnchor="middle" className="fill-slate-900 text-3xl font-bold">
              {leftSymbol}
            </text>
          </g>

          <g className="bond-atom-right">
            <circle cx="375" cy="92" r="47" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1.7" />
            <circle cx="375" cy="92" r="66" fill="none" stroke="#7dd3fc" strokeDasharray="3 4" strokeWidth="1.2" />
            <text x="375" y="100" textAnchor="middle" className="fill-slate-900 text-3xl font-bold">
              {rightSymbol}
            </text>
          </g>

          {bondType === "ionic" ? (
            <>
              <rect x="214" y="82" width="92" height="20" fill="url(#electronTrail)" className="bond-trail" />
              {Array.from({ length: ionicTransferCount }, (_, i) => (
                <circle
                  key={`transfer-${i}`}
                  cx="218"
                  cy={84 + i * 10}
                  r={i === 0 ? 5 : 4.5}
                  fill="#2563eb"
                  filter="url(#glow)"
                  className={i === 0 ? "bond-electron-transfer" : "bond-electron-transfer delay"}
                  style={{ animationDelay: `${i * 0.28}s` }}
                />
              ))}
              <text x="190" y="40" className="fill-orange-600 text-sm font-semibold bond-fade-in-late">
                {ionicLabels.left}
              </text>
              <text x="328" y="40" className="fill-sky-700 text-sm font-semibold bond-fade-in-late">
                {ionicLabels.right}
              </text>
            </>
          ) : (
            <>
              <line x1="236" y1="92" x2="284" y2="92" stroke="#1e293b" strokeWidth={2 + covalentSharedPairs * 0.8} className="bond-line-pulse" />
              {Array.from({ length: covalentSharedPairs * 2 }, (_, i) => (
                <circle
                  key={`shared-${i}`}
                  cx={247 + (i % 2) * 24}
                  cy={84 + Math.floor(i / 2) * 12}
                  r={4.3}
                  fill="#2563eb"
                  filter="url(#glow)"
                  className={i % 2 === 0 ? "bond-shared-electron" : "bond-shared-electron delay"}
                  style={{ animationDelay: `${i * 0.22}s` }}
                />
              ))}
            </>
          )}

          <g className="bond-product-label">
            <rect x="197" y="140" width="126" height="30" rx="15" fill="#0f172a" />
            <text x="260" y="159" textAnchor="middle" className="fill-white text-sm font-semibold">
              Product Formed
            </text>
          </g>
        </svg>
      ) : null}

      <p className="text-xs text-slate-600">
        {metalAcidDisplacement
          ? "Hydrogen leaves the acid pair, H2 vapor forms, and the metal bonds with the acid anion."
          : metalSaltDisplacement
            ? `The incoming metal replaces ${metalSaltDisplacement.displaced}; displaced metal comes out and new salt forms with ${metalSaltDisplacement.anion}.`
            : compoundSwap
              ? "Both compounds dissociate and swap partners. New ion pairs form based on driving force."
            : bondType === "ionic"
              ? `Electrons move from the metal atom toward the nonmetal atom (${ionicTransferCount} electron${ionicTransferCount > 1 ? "s" : ""} shown).`
              : `Atoms share electron pair(s) in the overlap region (${covalentSharedPairs} shared pair${covalentSharedPairs > 1 ? "s" : ""} shown).`}
      </p>
    </div>
  );
}
