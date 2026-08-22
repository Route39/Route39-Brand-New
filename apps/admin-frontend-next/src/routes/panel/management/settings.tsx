import { useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { LifeBuoy } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/Field";
import { FormActions, FormGrid, FormSection, FormShell } from "@/components/forms/FormShell";
import { SOCIAL_LINKS } from "@/components/icons/SocialIcons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/panel/PageHeader";
import { Spinner } from "@/components/ui/spinner";
import {
  CURRENT_CONFIGURATION_QUERY,
  UPDATE_CONFIGURATIONS_MUTATION,
  UPDATE_PASSWORD_MUTATION,
} from "@/lib/graphql/documents/management-detail-2";
import { LICENSE_INFORMATION_QUERY } from "@/lib/graphql/documents/extras-2";
import { ME_QUERY } from "@/lib/graphql/documents/auth";
import { UPDATE_PROFILE_MUTATION } from "@/lib/graphql/documents/extras";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be 8+ characters"),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

const configSchema = z.object({
  companyName: z.string().optional(),
  backendMapsAPIKey: z.string().optional(),
  adminPanelAPIKey: z.string().optional(),
});

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobileNumber: z.string().optional(),
  userName: z.string().min(1, "Username is required"),
});

type PwValues = z.infer<typeof passwordSchema>;
type ConfigValues = z.infer<typeof configSchema>;
type ProfileValues = z.infer<typeof profileSchema>;

const TAB_VALUES = ["profile", "platform", "password", "license"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function hashToTab(hash: string): TabValue {
  const v = hash.replace(/^#/, "");
  return (TAB_VALUES as readonly string[]).includes(v) ? (v as TabValue) : "profile";
}

export default function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = hashToTab(location.hash);

  const handleChange = useCallback(
    (value: string) => {
      navigate(`${location.pathname}${location.search}#${value}`, { replace: true });
    },
    [navigate, location.pathname, location.search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your profile, system configuration, and password."
      />
      <Tabs value={active} onValueChange={handleChange}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="license">License</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="platform">
          <PlatformConfigForm />
        </TabsContent>
        <TabsContent value="password">
          <PasswordForm />
        </TabsContent>
        <TabsContent value="license">
          <LicenseInfoCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileForm() {
  const { user } = useAuth();
  const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }],
  });
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      mobileNumber: user?.mobileNumber ?? "",
      userName: user?.userName ?? "",
    },
  });

  if (!user) return null;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await updateProfile({
        variables: {
          input: {
            firstName: values.firstName || null,
            lastName: values.lastName || null,
            email: values.email || null,
            mobileNumber: values.mobileNumber || null,
            userName: values.userName,
          },
        },
      });
      toast.success("Profile updated");
      reset(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  });

  return (
    <FormShell onSubmit={onSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormSection title="Your profile" description="Edit your own operator details.">
        <FormGrid>
          <Field label="First name" htmlFor="firstName">
            <Input id="firstName" {...register("firstName")} />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <Input id="lastName" {...register("lastName")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Username" htmlFor="userName" error={errors.userName?.message} required>
            <Input id="userName" {...register("userName")} />
          </Field>
          <Field label="Mobile number" htmlFor="mobileNumber">
            <Input id="mobileNumber" {...register("mobileNumber")} />
          </Field>
        </FormGrid>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
      </FormSection>
      <FormActions>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? <Spinner size="sm" className="text-primary-foreground" /> : "Save profile"}
        </Button>
      </FormActions>
    </FormShell>
  );
}

function PlatformConfigForm() {
  const { data, loading: loadingConfig } = useQuery(CURRENT_CONFIGURATION_QUERY);
  const [updateConfig] = useMutation(UPDATE_CONFIGURATIONS_MUTATION, {
    refetchQueries: [{ query: CURRENT_CONFIGURATION_QUERY }],
  });
  const [error, setError] = useState<string | null>(null);

  const cfg = data?.currentConfiguration;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
    reset,
  } = useForm<ConfigValues>({
    resolver: zodResolver(configSchema),
    values: {
      companyName: cfg?.companyName ?? "",
      backendMapsAPIKey: cfg?.backendMapsAPIKey ?? "",
      adminPanelAPIKey: cfg?.adminPanelAPIKey ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const result = await updateConfig({
        variables: {
          input: {
            companyName: values.companyName || null,
            backendMapsAPIKey: values.backendMapsAPIKey || null,
            adminPanelAPIKey: values.adminPanelAPIKey || null,
          },
        },
      });
      const status = result.data?.updateConfigurations.status;
      if (status && status !== "OK") {
        throw new Error(result.data?.updateConfigurations.message ?? "Update failed");
      }
      toast.success("Configuration saved");
      reset(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  });

  if (loadingConfig && !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading configuration…
      </div>
    );
  }

  return (
    <FormShell onSubmit={onSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormSection title="Platform" description="Branding and Google Maps API keys.">
        <Field label="Company name" htmlFor="companyName">
          <Input id="companyName" {...register("companyName")} />
        </Field>
        <FormGrid>
          <Field label="Backend Maps API key" htmlFor="backendMapsAPIKey">
            <Input id="backendMapsAPIKey" {...register("backendMapsAPIKey")} />
          </Field>
          <Field label="Admin panel Maps API key" htmlFor="adminPanelAPIKey">
            <Input id="adminPanelAPIKey" {...register("adminPanelAPIKey")} />
          </Field>
        </FormGrid>
      </FormSection>
      <FormActions>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? <Spinner size="sm" className="text-primary-foreground" /> : "Save changes"}
        </Button>
      </FormActions>
    </FormShell>
  );
}

function PasswordForm() {
  const [updatePassword] = useMutation(UPDATE_PASSWORD_MUTATION);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PwValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirm: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await updatePassword({
        variables: { input: { oldPassword: values.oldPassword, newPassword: values.newPassword } },
      });
      toast.success("Password updated");
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password update failed");
    }
  });

  return (
    <FormShell onSubmit={onSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormSection title="Password" description="Update the password for your admin account.">
        <Field label="Current password" htmlFor="oldPassword" error={errors.oldPassword?.message} required>
          <Input id="oldPassword" type="password" autoComplete="current-password" {...register("oldPassword")} />
        </Field>
        <FormGrid>
          <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message} required>
            <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message} required>
            <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
          </Field>
        </FormGrid>
      </FormSection>
      <FormActions>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" className="text-primary-foreground" /> : "Change password"}
        </Button>
      </FormActions>
    </FormShell>
  );
}

function supportPhraseFor(date: string | null | undefined): string {
  if (!date) return "No support window";
  const expiry = new Date(date).getTime();
  if (Number.isNaN(expiry)) return "Support window unavailable";
  const days = Math.round((expiry - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    const n = Math.abs(days);
    return n === 0 ? "Expired today" : `Expired ${n} day${n === 1 ? "" : "s"} ago`;
  }
  if (days === 0) return "Ends today";
  return `Valid for ${days} day${days === 1 ? "" : "s"}`;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:items-center sm:gap-4 sm:py-3.5">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

function LicenseInfoCard() {
  const { data, loading, error } = useQuery(LICENSE_INFORMATION_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const license = data?.licenseInformation?.license;

  if (loading && !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading license information…
      </div>
    );
  }

  if (error || !license) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        License information unavailable.
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-6 py-4">
        <h2 className="text-sm font-semibold">License</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Details for the license that activated this installation.
        </p>
      </header>
      <dl className="px-6">
        <InfoRow label="Buyer">{license.buyerName || "—"}</InfoRow>
        <InfoRow label="License type">
          <Badge variant="outline">{license.licenseType}</Badge>
        </InfoRow>
        <InfoRow label="Support">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span>{license.supportExpireDate ? formatDate(license.supportExpireDate) : "—"}</span>
              <span className="text-xs text-muted-foreground">
                {supportPhraseFor(license.supportExpireDate)}
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://support.bettersuite.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LifeBuoy className="size-3.5" />
                Contact support
              </a>
            </Button>
          </div>
        </InfoRow>
        <InfoRow label="Connected apps">
          {license.connectedApps.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {license.connectedApps.map((app) => (
                <Badge key={app} variant="muted">
                  {app}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </InfoRow>
        <InfoRow label="Platform addons">
          {license.platformAddons.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {license.platformAddons.map((addon) => (
                <Badge key={addon} variant="muted">
                  {addon}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </InfoRow>
      </dl>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
        <span className="text-xs text-muted-foreground">Follow BetterSuite</span>
        <div className="flex items-center gap-2">
          {SOCIAL_LINKS.map(({ label, href, node }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              {node}
            </a>
          ))}
        </div>
      </footer>
    </section>
  );
}
