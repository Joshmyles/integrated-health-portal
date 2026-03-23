"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { useLogin } from "@/src/features/auth/hooks/use-login";
import { AuthRequestError } from "@/src/features/auth/lib/auth-client";
import styles from "./login-page.module.css";

export function LoginPage() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRouting, startRoutingTransition] = useTransition();
  const loginMutation = useLogin();
  const isBusy = loginMutation.isPending || isRouting;
  const errorMessage =
    loginMutation.error instanceof AuthRequestError
      ? loginMutation.error.message
      : loginMutation.error
        ? "The login request could not be completed. Please check your connection and try again."
        : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.reset();

    try {
      await loginMutation.mutateAsync({ password, username });
      startRoutingTransition(() => {
        router.replace("/");
        router.refresh();
      });
    } catch {
      return;
    }
  }

  return (
    <main className={styles.pageFrame}>
      <section className={styles.desktopWindow}>
        <header className={styles.titleBar}>
          <span className={styles.titleText}>MoH Uganda: National Health Portal - Login</span>
          <span className={styles.titleMeta}>Secure Access</span>
        </header>

        <div className={styles.windowBody}>
          <section className={styles.heroPanel}>
            <p className={styles.heroEyebrow}>Operational access point</p>
            <h1 className={styles.heroTitle}>Sign in to continue to the Integrated Health Portal.</h1>
            <p className={styles.heroCopy}>
              The screen keeps the same legacy desktop character as the main portal so the
              transition into response and reporting workflows feels consistent.
            </p>

            <dl className={styles.metaList}>
              <div className={styles.metaRow}>
                <dt className={styles.metaLabel}>Authentication target:</dt>
                <dd className={styles.metaValue}>response.health.go.ug</dd>
              </div>
              <div className={styles.metaRow}>
                <dt className={styles.metaLabel}>Session mode:</dt>
                <dd className={styles.metaValue}>Secure cookie after upstream confirmation</dd>
              </div>
              <div className={styles.metaRow}>
                <dt className={styles.metaLabel}>Workspace access:</dt>
                <dd className={styles.metaValue}>Navigation and content APIs require login</dd>
              </div>
            </dl>

            <div className={styles.infoPanel}>
              Use the same username and password you would send to the `/login` endpoint. No
              credentials are hardcoded into the page.
            </div>
          </section>

          <section className={styles.formPanel}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Operator Login</h2>
              <p className={styles.formCopy}>
                Enter your credentials to open the portal shell.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.fieldLabel} htmlFor="username">
                Username
              </label>
              <input
                autoComplete="username"
                className={styles.fieldInput}
                disabled={isBusy}
                id="username"
                name="username"
                onChange={(event) => {
                  if (loginMutation.isError) {
                    loginMutation.reset();
                  }

                  setUsername(event.target.value);
                }}
                placeholder="Enter your username"
                required
                type="text"
                value={username}
              />

              <label className={styles.fieldLabel} htmlFor="password">
                Password
              </label>
              <div className={styles.passwordField}>
                <input
                  autoComplete="current-password"
                  className={`${styles.fieldInput} ${styles.passwordInput}`}
                  disabled={isBusy}
                  id="password"
                  name="password"
                  onChange={(event) => {
                    if (loginMutation.isError) {
                      loginMutation.reset();
                    }

                    setPassword(event.target.value);
                  }}
                  placeholder="Enter your password"
                  required
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  className={styles.passwordToggle}
                  disabled={isBusy}
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  type="button"
                >
                  <span className={styles.passwordToggleIcon} aria-hidden="true">
                    {isPasswordVisible ? (
                      <svg fill="none" height="16" viewBox="0 0 20 20" width="16">
                        <path
                          d="M2.3 2.3 17.7 17.7"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M4.6 6.1C2.9 7.5 1.8 9 1.8 9S4.8 14 10 14c1.4 0 2.6-.3 3.7-.8"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M7.4 4.9c.8-.3 1.7-.5 2.6-.5 5.2 0 8.2 5 8.2 5s-.7 1.1-2 2.4"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M8.6 8.6a2 2 0 0 0 2.8 2.8"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.4"
                        />
                      </svg>
                    ) : (
                      <svg fill="none" height="16" viewBox="0 0 20 20" width="16">
                        <path
                          d="M1.8 10s3-5 8.2-5 8.2 5 8.2 5-3 5-8.2 5-8.2-5-8.2-5Z"
                          stroke="currentColor"
                          strokeLinejoin="round"
                          strokeWidth="1.4"
                        />
                        <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    )}
                  </span>
                </button>
              </div>

              {errorMessage ? (
                <p aria-live="polite" className={styles.errorMessage} role="alert">
                  {errorMessage}
                </p>
              ) : (
                <p className={styles.helperText}>
                  Successful sign-in sends you directly into the portal workspace.
                </p>
              )}

              <div className={styles.buttonRow}>
                <button className={styles.submitButton} disabled={isBusy} type="submit">
                  {isBusy ? "Signing in..." : "Login"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
