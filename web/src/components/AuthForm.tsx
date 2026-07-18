import { useState, type FormEvent } from "react";
import { API_URL } from "../lib/format";

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body =
        mode === "register"
          ? { email, password, fullName, phone }
          : { email, password };
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      localStorage.setItem("wwp_token", data.accessToken ?? data.token);
      localStorage.setItem("wwp_user", JSON.stringify(data.user));
      setSuccess(mode === "register" ? "Account created. Redirecting…" : "Welcome back. Redirecting…");
      setTimeout(() => {
        window.location.href = "/events";
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 flex rounded-lg border border-wwp-border bg-wwp-surface p-1">
        {(["register", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={[
              "flex-1 rounded-md py-2.5 text-sm font-semibold capitalize transition",
              mode === m ? "bg-wwp-red text-white" : "text-wwp-muted hover:text-white",
            ].join(" ")}
          >
            {m === "register" ? "Create account" : "Log in"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="card-surface space-y-4 p-6">
        {mode === "register" && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-xs text-wwp-muted">Full name</span>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-wwp-border bg-wwp-black px-3 py-2.5 text-sm outline-none focus:border-wwp-red/60"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-wwp-muted">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-wwp-border bg-wwp-black px-3 py-2.5 text-sm outline-none focus:border-wwp-red/60"
              />
            </label>
          </>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs text-wwp-muted">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-wwp-border bg-wwp-black px-3 py-2.5 text-sm outline-none focus:border-wwp-red/60"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-wwp-muted">Password</span>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-wwp-border bg-wwp-black px-3 py-2.5 text-sm outline-none focus:border-wwp-red/60"
          />
        </label>

        {error && <p className="text-sm text-wwp-red">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-wwp-red py-3 text-sm font-bold tracking-wide text-white uppercase hover:bg-wwp-red-dark disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "register" ? "Create account" : "Log in"}
        </button>
      </form>
    </div>
  );
}
