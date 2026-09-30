"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useDemandState } from "@/lib/data/demands";

/** Creation CTAs start a new draft; edit/resume links keep their existing context. */
export function StartDemandLink(props: Omit<ComponentProps<typeof Link>, "href" | "onClick">) {
  const { newDemand } = useDemandState();
  return <Link {...props} href="/match" onClick={newDemand} />;
}
