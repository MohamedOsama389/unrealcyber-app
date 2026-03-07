import type { Flashcard, QuizQuestion, ReactionPrediction } from "./types";

export const buildStudyFlashcards = (prediction: ReactionPrediction): Flashcard[] => [
  { question: "What reaction type is this?", answer: prediction.reactionType.replace("_", " ") },
  { question: "What is the balanced equation?", answer: prediction.balancedEquation },
  { question: "Why does it happen?", answer: [...prediction.reason, ...prediction.drivingForce].join(" ") || "No driving force identified." },
  {
    question: "Is this redox?",
    answer: prediction.redox.isRedox
      ? `Yes. Reducing agent: ${prediction.redox.reducingAgent ?? "unknown"}; Oxidizing agent: ${prediction.redox.oxidizingAgent ?? "unknown"}.`
      : "No clear oxidation-number change detected."
  }
];

export const buildStudyQuiz = (prediction: ReactionPrediction): QuizQuestion[] => {
  const mcq: QuizQuestion[] = [
    {
      type: "mcq",
      prompt: "Which type best matches this reaction?",
      options: [prediction.reactionType.replace("_", " "), "combustion", "decomposition", "polymerization"],
      answer: prediction.reactionType.replace("_", " ")
    },
    {
      type: "mcq",
      prompt: "What is the strongest driving force here?",
      options: [prediction.drivingForce[0] ?? "No clear driving force", "random collision", "catalyst only", "inert gas effect"],
      answer: prediction.drivingForce[0] ?? "No clear driving force"
    },
    {
      type: "mcq",
      prompt: "Is this redox?",
      options: [prediction.redox.isRedox ? "Yes" : "No", prediction.redox.isRedox ? "No" : "Yes", "Cannot classify", "Always yes"],
      answer: prediction.redox.isRedox ? "Yes" : "No"
    },
    {
      type: "mcq",
      prompt: "Which equation is balanced?",
      options: [prediction.balancedEquation, prediction.molecularEquation, "None", "All"],
      answer: prediction.balancedEquation
    },
    {
      type: "mcq",
      prompt: "If no reaction occurs, the best explanation is usually:",
      options: ["No driving force or reactivity condition not met", "Atoms disappear", "Mass is not conserved", "Charges are ignored"],
      answer: "No driving force or reactivity condition not met"
    }
  ];

  const short: QuizQuestion[] = [
    { type: "short", prompt: "Write the balanced equation.", answer: prediction.balancedEquation },
    {
      type: "short",
      prompt: "State the oxidizing and reducing agents (if any).",
      answer: prediction.redox.isRedox
        ? `Reducing agent: ${prediction.redox.reducingAgent ?? "unknown"}; Oxidizing agent: ${prediction.redox.oxidizingAgent ?? "unknown"}.`
        : "No redox agent pair detected in MVP rules."
    },
    {
      type: "short",
      prompt: "Explain in one sentence why this reaction proceeds or not.",
      answer: [...prediction.reason, ...prediction.drivingForce].join(" ") || "No reaction predicted."
    }
  ];

  return [...mcq, ...short];
};
