import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "Create Business Account | CAPACITY", robots: { index: false, follow: false } };
export default function RegisterPage() { return <Suspense><AuthForm variant="register" /></Suspense>; }
