/**
 * The "Do you need a developer if AI can build your app?" post's quiz: eight
 * yes-or-no questions in two groups, and one of three verdicts. Every
 * question and every verdict is written in the post's own prose, word for
 * word, so the page without JavaScript and the Dev.to copy lose nothing.
 */

/** Which group a question belongs to. */
export type QuizGroup = "stake" | "warning"

/** A reader's answer to one question. */
export type QuizAnswer = "yes" | "no"

/** One yes-or-no question. */
export interface QuizQuestion {
  /** A stable id for the radio group. */
  id: string
  group: QuizGroup
  /** The question, as the post writes it. */
  label: string
}

/** The two groups' headings, as the post writes them. */
export const GROUP_TITLES: Record<QuizGroup, string> = {
  stake: "What depends on your app",
  warning: "What the code shows",
}

/** The eight questions, in the post's order. */
export const QUESTIONS: readonly QuizQuestion[] = [
  {
    id: "real-users",
    group: "stake",
    label: "Do people outside your team use it for real, not as a demo?",
  },
  { id: "payments", group: "stake", label: "Does it take payments?" },
  {
    id: "personal-data",
    group: "stake",
    label:
      "Does it store personal data, such as names, emails, health or money details?",
  },
  {
    id: "downtime",
    group: "stake",
    label: "Would someone lose money or a day of work if it went down?",
  },
  {
    id: "months",
    group: "warning",
    label: "Have you kept changing it with AI for two months or more?",
  },
  {
    id: "regressions",
    group: "warning",
    label: "Has fixing one thing broken another, more than once?",
  },
  {
    id: "shared-edits",
    group: "warning",
    label: "Do several people edit the same data at the same time?",
  },
  {
    id: "bill",
    group: "warning",
    label:
      "Has the bill for hosting or the database grown faster than your users?",
  },
]

/** One of the quiz's three answers. */
export interface Verdict {
  id: "enough" | "review" | "ongoing"
  /** The verdict itself, as the post's bold lead writes it. */
  title: string
  /** Why, in the post's words. */
  text: string
}

/** The three verdicts, in the post's order. */
export const VERDICTS: Readonly<Record<Verdict["id"], Verdict>> = {
  enough: {
    id: "enough",
    title: "AI is enough for now",
    text:
      "Nobody's money, data or work depends on the app yet, so keep building and find out whether people want it. Messy code is fine in a prototype.",
  },
  review: {
    id: "review",
    title: "Get a one-off review",
    text:
      "Real people depend on the app, but the code isn't showing the warning signs yet. Do the self-check above, then have an experienced developer read the code once.",
  },
  ongoing: {
    id: "ongoing",
    title: "You need someone on it ongoing",
    text:
      "People depend on the app and the code already shows the warning signs. Every new prompt adds to the problem, so someone with judgement should read the changes regularly.",
  },
}

/** What the verdict area says before the reader answers anything. */
export const PROMPT = "Answer a question to see where you stand."

/** Warning signs at or above this, with any stake, mean ongoing help. */
export const ONGOING_WARNINGS = 2

/** What a set of answers adds up to. */
export interface QuizResult {
  /** Questions answered, yes or no. */
  answered: number
  /** "Yes" answers in the first group. */
  stakes: number
  /** "Yes" answers in the second group. */
  warnings: number
  /** Null until at least one question is answered. */
  verdict: Verdict | null
}

/**
 * Scores the reader's answers by the post's rules. Unanswered questions
 * count as no. No "yes" in the first group: AI is enough for now. A "yes"
 * there with at most one "yes" in the second group: a one-off review. A
 * "yes" there with two or more in the second group: someone ongoing.
 */
export function quizResult(
  answers: Readonly<Record<string, QuizAnswer>>,
): QuizResult {
  let answered = 0
  let stakes = 0
  let warnings = 0
  for (const q of QUESTIONS) {
    const answer = answers[q.id]
    if (answer === undefined) continue
    answered++
    if (answer !== "yes") continue
    if (q.group === "stake") stakes++
    else warnings++
  }
  const verdict = answered === 0
    ? null
    : stakes === 0
    ? VERDICTS.enough
    : warnings >= ONGOING_WARNINGS
    ? VERDICTS.ongoing
    : VERDICTS.review
  return { answered, stakes, warnings, verdict }
}

/** The quiz's Dev.to fallback: the questions and the rules, as tables. */
export function developerNeedQuizMarkdown(): string {
  const rows = QUESTIONS.map((q) => `| ${q.label} | ${GROUP_TITLES[q.group]} |`)
  return [
    "| Question | Group |",
    "| --- | --- |",
    ...rows,
    "",
    "| Your answers | Verdict |",
    "| --- | --- |",
    `| No "yes" in the first group | ${VERDICTS.enough.title} |`,
    `| A "yes" in the first group, at most one in the second | ${VERDICTS.review.title} |`,
    `| A "yes" in the first group, two or more in the second | ${VERDICTS.ongoing.title} |`,
  ].join("\n")
}
