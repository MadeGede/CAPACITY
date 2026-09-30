import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "Sign In | CAPACITY", robots: { index: false, follow: false } };
export default function LoginPage() { return <Suspense><AuthForm variant="login" /></Suspense>; }
