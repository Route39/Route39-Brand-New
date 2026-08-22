import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Car, Eye, EyeOff, MapPin, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/providers/AuthProvider";

const schema = z.object({
  userName: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const BRAND = "#0037e7";
const BRAND_DEEP = "#001a8a";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const now = useClock();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { userName: "", password: "" },
  });

  useEffect(() => {
    if (user) {
      const redirect = params.get("redirect") ?? "/home";
      navigate(redirect, { replace: true });
    }
  }, [navigate, params, user]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await login(values);
      const redirect = params.get("redirect") ?? "/home";
      navigate(redirect, { replace: true });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to sign in. Check credentials and try again.",
      );
    }
  });

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_minmax(420px,520px)]">
      <style>{LOGIN_KEYFRAMES}</style>

      <BrandPanel time={time} />

      <section className="flex items-center justify-center px-6 py-10 lg:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="size-8 rounded-md" />
            <span className="text-base font-semibold tracking-tight">Route39 Admin</span>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <header className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                Access the operations console for your fleet.
              </p>
            </header>

            {submitError ? (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-4">
              <Field
                label="Username"
                htmlFor="userName"
                error={errors.userName?.message}
                required
              >
                <Input
                  id="userName"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="dispatcher"
                  {...register("userName")}
                />
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                error={errors.password?.message}
                required
              >
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </Field>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="group h-10 w-full"
              style={{ backgroundColor: BRAND }}
            >
              {isSubmitting ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>

            <footer className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span>Route39 Admin · v3.21</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                All systems normal
              </span>
            </footer>
          </form>
        </div>
      </section>
    </div>
  );
}

function BrandPanel({ time }: { time: string }) {
  return (
    <aside className="relative isolate hidden flex-col overflow-hidden p-10 text-white lg:flex lg:p-12">
      <div
        aria-hidden
        className="absolute inset-0 -z-30"
        style={{
          background: `linear-gradient(150deg, ${BRAND_DEEP} 0%, ${BRAND} 50%, #1959ff 100%)`,
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 -z-20 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 90%)",
        }}
      />

      <svg
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M-5,68 Q22,42 50,54 Q72,62 88,32 L120,22"
          fill="none"
          stroke="white"
          strokeOpacity="0.18"
          strokeWidth="0.22"
          strokeDasharray="240"
          strokeDashoffset="240"
          style={{ animation: "loginDraw 3s cubic-bezier(0.65,0,0.35,1) 0.4s forwards" }}
        />
        <path
          d="M-5,85 Q30,82 62,68 Q82,58 120,42"
          fill="none"
          stroke="white"
          strokeOpacity="0.1"
          strokeWidth="0.16"
          strokeDasharray="240"
          strokeDashoffset="240"
          style={{ animation: "loginDraw 4s cubic-bezier(0.65,0,0.35,1) 0.8s forwards" }}
        />
      </svg>

      <header
        className="login-rise flex items-center gap-2.5"
        style={{ animationDelay: "40ms" }}
      >
        <img
          src={`${import.meta.env.BASE_URL}icon.svg`}
          alt=""
          className="size-9 rounded-lg ring-1 ring-white/20"
        />
        <div className="leading-tight">
          <div className="text-[0.95rem] font-semibold tracking-tight">Route39</div>
          <div className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white/55">
            Admin Console
          </div>
        </div>
      </header>

      <div className="my-auto max-w-md space-y-4 py-10">
        <div
          className="login-rise inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-inset ring-white/15 backdrop-blur-sm"
          style={{ animationDelay: "120ms" }}
        >
          <span className="relative inline-flex size-1.5 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full bg-emerald-300"
              style={{ animation: "loginPulse 2s infinite" }}
            />
            <span className="relative size-1.5 rounded-full bg-emerald-300" />
          </span>
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.12em]">
            Operations live
          </span>
        </div>

        <h2
          className="login-rise text-4xl font-semibold leading-[1.1] tracking-tight"
          style={{ animationDelay: "200ms" }}
        >
          Run your fleet from one place.
        </h2>

        <p
          className="login-rise text-[0.95rem] leading-relaxed text-white/75"
          style={{ animationDelay: "280ms" }}
        >
          Dispatch rides, manage drivers, monitor revenue and respond to incidents — all in real
          time.
        </p>
      </div>

      <div
        className="login-rise grid grid-cols-3 gap-3"
        style={{ animationDelay: "400ms" }}
      >
        <BrandStat icon={Car} value="423" label="Drivers online" delta="+12" />
        <BrandStat icon={MapPin} value="2,194" label="Trips today" delta="+8.2%" />
        <BrandStat icon={TrendingUp} value="3:41" label="Avg pickup" delta="−14s" />
      </div>

      <div
        className="login-rise mt-6 flex items-center justify-between text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white/45"
        style={{ animationDelay: "480ms" }}
      >
        <span className="tabular-nums">New York · {time}</span>
        <span className="tabular-nums">Load 52.4 / 60</span>
      </div>
    </aside>
  );
}

function BrandStat({
  icon: Icon,
  value,
  label,
  delta,
}: {
  icon: typeof Car;
  value: string;
  label: string;
  delta: string;
}) {
  return (
    <div className="rounded-lg bg-white/8 p-3 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between text-white/65">
        <Icon className="size-3.5" />
        <span className="text-[0.65rem] font-medium tabular-nums text-emerald-300/90">
          {delta}
        </span>
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums leading-none">{value}</div>
      <div className="mt-1.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-white/55">
        {label}
      </div>
    </div>
  );
}

const LOGIN_KEYFRAMES = `
@keyframes loginDraw { to { stroke-dashoffset: 0; } }
@keyframes loginPulse {
  0%, 100% { opacity: 0.75; transform: scale(1); }
  50% { opacity: 0; transform: scale(2.4); }
}
@keyframes loginRise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.login-rise { animation: loginRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
@media (prefers-reduced-motion: reduce) {
  .login-rise { animation: none; }
}
`;
