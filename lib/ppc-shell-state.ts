export const PPC_SIDEBAR_STORAGE_KEY = "ppc.sidebar.collapsed";

export function parseSidebarCollapsedState(raw: string | null): boolean {
  return raw === "1";
}

export function serializeSidebarCollapsedState(collapsed: boolean): string {
  return collapsed ? "1" : "0";
}
