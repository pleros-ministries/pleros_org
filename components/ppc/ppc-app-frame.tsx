import type { AppSession } from "@/lib/app-session";
import { getGraduations } from "@/lib/db/queries/graduations";
import { getLevels } from "@/lib/db/queries/lessons";
import { buildStudentLevelNavItems } from "@/lib/ppc-shell";
import { PpcShell } from "@/components/ppc/ppc-shell";

type PpcAppFrameProps = {
  children: React.ReactNode;
  session: AppSession;
};

export async function PpcAppFrame({
  children,
  session,
}: PpcAppFrameProps) {
  const studentLevelNavItems =
    session.user.role === "student"
      ? buildStudentLevelNavItems(
          await getLevels(),
          (await getGraduations(session.user.id)).map(
            (graduation) => graduation.levelId,
          ),
        )
      : undefined;

  return (
    <PpcShell session={session} studentLevelNavItems={studentLevelNavItems}>
      {children}
    </PpcShell>
  );
}
