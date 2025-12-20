"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  return (
    <div className="flex flex-col w-full max-w-sm mx-auto h-screen justify-center items-center px-4">
      <div className="flex flex-col gap-6 w-full">
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl text-foreground">Nekomata</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>
        <form
          className="flex flex-col gap-4 w-full bg-card p-6 rounded-lg border border-border"
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", flow);
            void signIn("password", formData)
              .catch((error) => {
                setError(error.message);
                setLoading(false);
              })
              .then(() => {
                router.push("/dashboard");
              });
          }}
        >
          <input
            className="bg-background text-foreground rounded-md p-3 border border-input outline-none placeholder:text-muted-foreground"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
          <div className="flex flex-col gap-1">
            <input
              className="bg-background text-foreground rounded-md p-3 border border-input outline-none placeholder:text-muted-foreground"
              type="password"
              name="password"
              placeholder="Password"
              minLength={8}
              required
            />
            {flow === "signUp" && (
              <p className="text-xs text-muted-foreground px-1">
                Password must be at least 8 characters
              </p>
            )}
          </div>
          <button
            className="bg-primary text-primary-foreground rounded-md py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? "Loading..." : flow === "signIn" ? "Sign in" : "Create account"}
          </button>
          <div className="flex flex-row gap-2 text-sm justify-center">
            <span className="text-muted-foreground">
              {flow === "signIn"
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>
            <span
              className="text-foreground cursor-pointer"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Sign up" : "Sign in"}
            </span>
          </div>
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
              <p className="text-destructive text-sm">
                {error}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
