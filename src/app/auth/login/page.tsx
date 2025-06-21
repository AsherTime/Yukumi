"use client";

import * as React from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { FaGoogle, FaDiscord } from "react-icons/fa"

interface FormData {
  email: string
  password: string
}

// Input component
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        className={`h-12 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input"

// Button component
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <button
        className={`inline-flex h-12 items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button"

// Social Button component
const SocialButton = ({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label: string }) => (
  <button
    onClick={onClick}
    className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-white transition-colors hover:bg-white/10"
  >
    {icon}
    <span className="sr-only">{label}</span>
  </button>
);

// Separator component
function Separator({ className = "" }: { className?: string }) {
  return <div className={`h-[1px] bg-white/20 ${className}`} />;
}

// Loading Spinner component
const LoadingSpinner = () => (
  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
);

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<FormData>({
    email: "",
    password: "",
  })
  const router = useRouter();

  // Add initialization check
  React.useEffect(() => {
    const checkSupabase = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log("Supabase initialization check:", {
          session: !!session,
          error: error?.message,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not Set",
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not Set"
        })
      } catch (error) {
        console.error("Supabase initialization error:", error)
      }
    }
    checkSupabase()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Sign in with Email/Password
  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    console.log("Login form submitted");

    if (!formData.email || !formData.password) {
      console.log("Missing email or password");
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    console.log("Attempting to sign in with:", formData.email);

    try {
      console.log("Supabase client check:", {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error("Login error details:", {
          message: error.message,
          status: error.status,
          name: error.name
        });
        if (
          error.message.toLowerCase().includes("invalid login credentials") ||
          error.status === 400
        ) {
          alert("Incorrect email or password.");
        } else {
          alert("An unexpected error occurred. Please try again later.");
        }

        return;
      }

      if (data.user) {
        console.log("Login successful, user:", data.user);
        toast.success("Login successful!");
        setFormData({ email: "", password: "" });
        router.push("/homepage"); // Redirect to home page
      }
    }
    catch (err: any) {
      //console.error("Unexpected sign-in error:", err);  // Optional
      alert("Something went wrong. Please try again.");
    }
    finally {
      setIsLoading(false);
    }
  }

  // Social login with Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('Google login error:', error.message);
  };

  // Social login with Discord
  const signInWithDiscord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
    });
    if (error) console.error('Discord login error:', error.message);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[504px] space-y-6 rounded-xl bg-black/20 p-6 backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center space-y-2 text-center"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Login
          </h1>
        </motion.div>

        <form onSubmit={onSubmit} className="flex flex-col space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <Input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </motion.div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="flex items-center space-x-2">
            <Separator className="w-16" />
            <span className="text-sm text-white/70">or</span>
            <Separator className="w-16" />
          </div>
          <span className="text-sm text-white/70">sign in with</span>
          <div className="flex space-x-4">
            <SocialButton
              icon={<FaGoogle className="h-5 w-5" />}
              onClick={signInWithGoogle}
              label="Google"
            />
            <SocialButton
              icon={<FaDiscord className="h-5 w-5" />}
              onClick={signInWithDiscord}
              label="Discord"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 