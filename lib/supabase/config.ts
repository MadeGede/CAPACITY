function validProjectUrl(value: string | undefined): boolean {
  if (!value || value.includes("your-project")) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  validProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-")
);

export const modeCookieName = "capacity-data-mode";
export type DataMode = "demo" | "real";
