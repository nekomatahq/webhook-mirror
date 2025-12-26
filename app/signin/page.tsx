"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInSchema, signUpSchema } from "./validation";
import { validateSignIn, validateSignUp } from "./actions";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const validateClientSide = (emailValue: string, passwordValue: string) => {
    const schema = flow === "signIn" ? signInSchema : signUpSchema;
    const result = schema.safeParse({ email: emailValue, password: passwordValue });
    
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        if (issue.path && issue.path[0]) {
          errors[issue.path[0] as keyof FieldErrors] = issue.message;
        }
      });
      setFieldErrors(errors);
      return false;
    }
    
    setFieldErrors({});
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value && fieldErrors.email) {
      validateClientSide(value, password);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value && fieldErrors.password) {
      validateClientSide(email, value);
    }
  };

  const handleFlowChange = (newFlow: "signIn" | "signUp") => {
    setFlow(newFlow);
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateClientSide(email, password)) {
      return;
    }

    setLoading(true);

    const validationResult = flow === "signIn"
      ? await validateSignIn({ email, password })
      : await validateSignUp({ email, password });

    if (!validationResult.success) {
      setFieldErrors(validationResult.errors as FieldErrors);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    formData.set("flow", flow);

    try {
      await signIn("password", formData);
      router.replace("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn("github");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-sm mx-auto h-screen justify-center items-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col gap-10 w-full"
      >
        <div className="text-center flex flex-col gap-3">
          <h1 className="text-3xl font-light text-foreground tracking-wide">Nekomata</h1>
          <p className="text-sm text-muted-foreground/70 leading-relaxed font-light tracking-wide">
            Sign in to continue
          </p>
        </div>
        
        <button
          className="bg-background text-foreground/80 hover:text-foreground rounded-full py-3.5 border-[0.5px] border-border/40 hover:bg-foreground/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-light tracking-wide transition-all duration-300 outline-none focus-visible:ring-1 focus-visible:ring-ring/20"
          type="button"
          onClick={handleGithubSignIn}
          disabled={loading}
        >
          {loading ? (
             <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <svg
              className="w-5 h-5 opacity-70"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          )}
          Sign in with GitHub
        </button>

        <div className="flex items-center gap-6 w-full opacity-60">
          <div className="flex-1 h-[0.5px] bg-border/40"></div>
          <span className="text-xs text-muted-foreground tracking-widest uppercase">or</span>
          <div className="flex-1 h-[0.5px] bg-border/40"></div>
        </div>

        <form
          className="flex flex-col gap-6 w-full"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-3">
            <input
              className={`bg-transparent text-foreground rounded-md p-3.5 border-[0.5px] outline-none placeholder:text-muted-foreground/50 leading-relaxed font-light tracking-wide transition-colors duration-300 focus:border-foreground/30 ${
                fieldErrors.email
                  ? "border-destructive/40"
                  : "border-border/40"
              }`}
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => validateClientSide(email, password)}
              required
            />
            <AnimatePresence>
              {fieldErrors.email && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive/80 px-1 font-light"
                >
                  {fieldErrors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-col gap-3">
            <input
              className={`bg-transparent text-foreground rounded-md p-3.5 border-[0.5px] outline-none placeholder:text-muted-foreground/50 leading-relaxed font-light tracking-wide transition-colors duration-300 focus:border-foreground/30 ${
                fieldErrors.password
                  ? "border-destructive/40"
                  : "border-border/40"
              }`}
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => validateClientSide(email, password)}
              required
            />
            <AnimatePresence>
              {fieldErrors.password && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive/80 px-1 font-light"
                >
                  {fieldErrors.password}
                </motion.p>
              )}
            </AnimatePresence>
            {flow === "signUp" && !fieldErrors.password && (
              <p className="text-xs text-muted-foreground/60 px-1 font-light leading-relaxed">
                Password must be at least 8 characters with uppercase, lowercase, and a number
              </p>
            )}
          </div>
          
          <button
            className="bg-foreground text-background hover:bg-foreground/90 rounded-full py-3.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-light tracking-wide border-[0.5px] border-transparent transition-all duration-300 mt-2"
            type="submit"
            disabled={loading}
          >
             {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (flow === "signIn" ? "Sign in" : "Create account")}
          </button>
          
          <div className="flex flex-row gap-2 text-sm justify-center leading-relaxed mt-4">
            <span className="text-muted-foreground/60 font-light">
              {flow === "signIn"
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>
            <span
              className="text-foreground/80 hover:text-foreground cursor-pointer font-normal transition-colors"
              onClick={() => handleFlowChange(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Sign up" : "Sign in"}
            </span>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-destructive/5 border-[0.5px] border-destructive/20 rounded-md p-4 mt-2"
              >
                <p className="text-destructive/80 text-sm leading-relaxed font-light text-center">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
