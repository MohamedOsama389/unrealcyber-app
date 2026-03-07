# Reaction Visualizer + Explainer

Selection-first chemistry learning app for high-school reactions.

## What is improved

- Default workflow is now **Build reaction** (no typing required).
- Typing mode is now **advanced mode** with robust equation parsing and friendly errors.
- Fixed stale Study Mode bug by introducing a single source of truth + `resultId` guard.

## Selection-first UX

Main modes:
- `Build reaction` (default)
- `Type equation (advanced)`

Build reaction flow:
1. Select Reactant A
2. Select Reactant B
3. (Optional) set conditions (water, acid, base, medium, temperature)
4. Preview equation and click `Predict`

Reactant Picker modal tabs:
- `periodic` (element picker + side info panel)
- `compounds` (search common compounds)
- `ions` (choose cation/anion and auto-build formula by charge balance)

## Parser improvements

Supports:
- arrows: `->`, `=>`, `=`, `?`
- unicode subscripts: `H2SO4` -> `H2SO4`
- coefficients with or without spaces: `2H2O`, `2 H2O`
- optional states: `(s)`, `(l)`, `(g)`, `(aq)`

Friendly validation messages:
- missing arrow
- unknown symbol
- unmatched parentheses
- unreadable term

## State bug fix (stale study content)

Single source of truth:
- `currentInput`
- `currentResult`

On any input change:
- current result is invalidated
- flashcards/quiz are cleared

Study mode safety:
- flashcards/quiz stored with `resultId`
- study content is displayed only when `study.resultId === currentResult.id`
- study header always shows current reaction title

## Core structure

- `src/App.tsx` - selection-first workflow and state lifecycle
- `src/app/reactionState.ts` - input/result/study state helpers and `resultId` logic
- `src/components/ReactantPickerModal.tsx` - periodic/compounds/ions selector
- `src/components/ReactionSummaryCard.tsx` - always-visible summary
- `src/components/ReactionOutputTabs.tsx` - products/type/why/redox/visual tabs
- `src/chemistry/equationParser.ts` - robust parser + normalization
- `src/chemistry/reactionPredictor.ts` - reaction prediction engine
- `src/chemistry/datasets/curriculum.eg.json` - curriculum mode config

## Run

```bash
npm install
npm run dev
```

Tests:

```bash
npm test
```

Build:

```bash
npm run build
```

Desktop (Windows unpacked exe):

```bash
npm run desktop:dir
```

## Test coverage

- acceptance reactions (`src/tests/chemistry.test.ts`)
- parser normalization + friendly validation (`src/tests/parser-state.test.ts`)
- stale state protections: invalidation + `resultId` matching (`src/tests/parser-state.test.ts`)
