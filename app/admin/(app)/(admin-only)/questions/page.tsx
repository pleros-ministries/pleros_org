import { AdminQuestionsPage } from "@/components/community/admin-questions-page";
import { requireAdmin } from "@/lib/auth/require-role";
import { resolveAskPlerosInbox } from "@/lib/community/ask-pleros";
import {
  getQuestionForStaff,
  listQuestionsForStaff,
} from "@/lib/db/queries/ask-pleros";

export default async function AdminQuestionsRoute({
  searchParams,
}: {
  searchParams: Promise<{ question?: string }>;
}) {
  await requireAdmin();

  const { question } = await searchParams;
  const selectedId = Number(question);
  const [questions, selected] = await Promise.all([
    listQuestionsForStaff(),
    Number.isInteger(selectedId) && selectedId > 0
      ? getQuestionForStaff(selectedId)
      : Promise.resolve(null),
  ]);

  return (
    <AdminQuestionsPage
      key={selected?.id ?? "none"}
      questions={questions}
      selected={selected}
      inboxConfigured={resolveAskPlerosInbox(process.env) !== null}
    />
  );
}
