import type { Flashcard, QuizQuestion } from "../chemistry";

interface StudyModePanelProps {
  reactionTitle: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export function StudyModePanel({ reactionTitle, flashcards, quiz }: StudyModePanelProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2 rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm font-semibold text-brand-700">
        Study Mode for: {reactionTitle}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Flashcards</h3>
        <div className="space-y-3">
          {flashcards.map((card, index) => (
            <article key={index} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold">Q: {card.question}</p>
              <p className="mt-1 text-sm text-slate-700">A: {card.answer}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Quiz + Solutions</h3>
        <div className="space-y-3">
          {quiz.map((question, index) => (
            <article key={index} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold">
                {index + 1}. {question.prompt}
              </p>
              {question.type === "mcq" && question.options ? (
                <ul className="mt-1 list-disc pl-5 text-slate-700">
                  {question.options.map((option, optionIndex) => (
                    <li key={optionIndex}>{option}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-emerald-700">Solution: {question.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
