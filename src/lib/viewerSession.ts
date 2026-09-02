import { supabase } from "./supabase";

let pendingViewer: Promise<string> | null = null;

async function resolveViewerId(): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(`viewer session: ${sessionError.message}`);
  if (sessionData.session?.user.id) return sessionData.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(`anonymous sign-in: ${error?.message ?? "no user returned"}`);
  }
  return data.user.id;
}

export function getViewerId(): Promise<string> {
  if (!pendingViewer) {
    pendingViewer = resolveViewerId().finally(() => {
      pendingViewer = null;
    });
  }
  return pendingViewer;
}
