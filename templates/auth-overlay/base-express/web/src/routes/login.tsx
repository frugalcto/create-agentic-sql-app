import { Form, redirect, useActionData, useNavigation, useSearchParams } from "react-router-dom";
import type { ActionFunctionArgs } from "react-router-dom";

import { ApiClientError, login } from "../api/client.js";

export interface LoginActionData {
  error?: string;
}

export async function loginAction({
  request,
}: ActionFunctionArgs): Promise<LoginActionData | Response> {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const returnTo = formData.get("returnTo");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email and password are required." };
  }

  try {
    await login(email, password);
    const destination =
      typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : "/";
    return redirect(destination);
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { error: error.details.displayMessage };
    }

    return { error: "Something went wrong." };
  }
}

export function LoginRoute() {
  const actionData = useActionData<LoginActionData>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";
  const isSubmitting = navigation.state === "submitting";

  return (
    <section className="page-stack">
      <article className="card">
        <h1>Sign in</h1>
        <p className="architecture-note">
          Authentication is owned by PostgreSQL stored procedures. Sessions are stored in the
          database and enforced with row-level security.
        </p>
        <Form className="login-form" method="post">
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="username"
              defaultValue="admin@example.com"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              defaultValue="password123"
              name="password"
              required
              type="password"
            />
          </label>
          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </Form>
        {actionData?.error ? <p className="state state--error">{actionData.error}</p> : null}
        <p className="architecture-note">
          Seeded accounts: <strong>admin@example.com</strong> (owner) and{" "}
          <strong>viewer@example.com</strong> (viewer). Password: <code>password123</code>.
        </p>
      </article>
    </section>
  );
}
