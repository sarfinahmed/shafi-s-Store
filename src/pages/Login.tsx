import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input } from "../components/ui";

export function Login() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get("register") === "true");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { loginWithEmail, registerWithEmail, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    setIsRegister(searchParams.get("register") === "true");
  }, [searchParams]);

  const toggleRegister = () => {
    const newVal = !isRegister;
    setIsRegister(newVal);
    navigate(newVal ? "/login?register=true" : "/login", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    try {
      if (isRegister) {
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      navigate("/");
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || (err.message && err.message.includes('auth/invalid-credential'))) {
        setError("Wrong email or password.");
      } else if (err.code === 'auth/email-already-in-use' || (err.message && err.message.includes('auth/email-already-in-use'))) {
        setError("An account with this email already exists.");
      } else {
        setError(err.message || "Failed to authenticate");
      }
    }
  };

  return (
    <div className="max-w-sm md:max-w-md mx-auto mt-8 md:mt-20 p-5 md:p-10 bg-[#0a0a0a] rounded-2xl md:rounded-3xl shadow-2xl border border-zinc-900">
      <div className="text-center mb-5 md:mb-8">
        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-white">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-[10px] md:text-sm text-zinc-500 font-medium mt-1 md:mt-2">
          {isRegister ? "Join us to access premium products." : "Sign in to your premium dashboard."}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        {isRegister && (
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 md:mb-2">Full Name</label>
            <Input 
              type="text" 
              placeholder="e.g. Alex Rivera" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isRegister}
              className="h-10 md:h-12"
            />
          </div>
        )}
        <div>
          <label className="block text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 md:mb-2">Email Address</label>
          <Input 
            type="email" 
            placeholder="name@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            className="h-10 md:h-12"
          />
        </div>
        <div>
          <label className="block text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 md:mb-2">Password</label>
          <Input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            className="h-10 md:h-12"
          />
        </div>
        {error && <p className="text-xs md:text-sm font-medium text-red-500 bg-red-500/10 p-2 md:p-3 rounded-lg border border-red-500/20">{error}</p>}
        <Button className="w-full mt-2 md:mt-4 text-sm md:text-base py-2 md:py-3" type="submit" disabled={loading}>
          {loading ? "Please wait..." : (isRegister ? "Register" : "Sign In")}
        </Button>
      </form>

      <div className="mt-6 md:mt-8 text-center text-xs md:text-sm font-medium">
        <span className="text-zinc-500">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
        </span>
        <button 
          type="button"
          onClick={toggleRegister} 
          className="text-white hover:underline decoration-zinc-500 underline-offset-4"
        >
          {isRegister ? "Sign In" : "Create one"}
        </button>
      </div>
    </div>
  );
}
