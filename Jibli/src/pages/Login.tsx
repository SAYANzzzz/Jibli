import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, User } from "lucide-react";
import { ensureUserProfile, sendPasswordReset, signIn, signInWithProvider } from "../auth";
import logo from "../assets/Fast-Logo.gif";

const googleLoginEnabled = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === "true";
const facebookLoginEnabled = import.meta.env.VITE_ENABLE_FACEBOOK_LOGIN === "true";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/request";
  const registered = searchParams.get("registered") === "1";
  const registerPath = `/register?next=${encodeURIComponent(nextPath)}`;
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providerLoading, setProviderLoading] = useState<"google" | "facebook" | "">("");
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const formEmail = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const { error } = await signIn(formEmail, password);

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(error.message);
      return;
    }

    try {
      await ensureUserProfile();
    } catch (profileError) {
      setIsSubmitting(false);
      setErrorMessage(
        profileError instanceof Error
          ? profileError.message
          : "Login worked, but profile creation failed.",
      );
      return;
    }

    setIsSubmitting(false);
    navigate(nextPath, { replace: true });
  };

  const handleProviderLogin = async (provider: "google" | "facebook") => {
    setErrorMessage("");
    setSuccessMessage("");

    const isEnabled = provider === "google" ? googleLoginEnabled : facebookLoginEnabled;

    if (!isEnabled) {
      setErrorMessage(
        `${provider === "google" ? "Google" : "Facebook"} login is not enabled yet. Use email/password login for now.`,
      );
      return;
    }

    setProviderLoading(provider);
    const { data, error } = await signInWithProvider(provider, nextPath);

    if (error) {
      setErrorMessage(error.message);
      setProviderLoading("");
      return;
    }

    if (!data.url) {
      setErrorMessage(`${provider} login is not configured in Supabase.`);
      setProviderLoading("");
      return;
    }

    window.location.assign(data.url);
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();
    setErrorMessage("");
    setSuccessMessage("");

    if (!trimmedEmail) {
      setErrorMessage("Enter your email first, then click reset password.");
      return;
    }

    setIsResetting(true);
    const { error } = await sendPasswordReset(trimmedEmail);
    setIsResetting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Password reset email sent. Open it and choose a new password.");
  };

  return (
    <div className="authPage">
      <header className="authTopbar">
        <Link to="/" className="authBrand">
          <img src={logo} alt="Jibli logo" className="logoImg" />
          <span>Jibli</span>
        </Link>

        <div className="authNavActions">
          <Link to="/" className="authOutlineBtn">
            Back to Home
          </Link>
          <Link to={registerPath} className="authPrimaryBtn">
            Register
          </Link>
        </div>
      </header>

      <div className="authCard">
        <img src={logo} alt="Jibli logo" className="authCardLogo" />

        <h1>Login</h1>
        <p>Sign in to your account</p>
        <div className="authNotice">Login is required to access your panier and track orders.</div>
        {registered && (
          <div className="authNotice">
            Account created. If email confirmation is enabled in Supabase, confirm your email
            first.
          </div>
        )}
        {errorMessage && <div className="authError">{errorMessage}</div>}
        {successMessage && <div className="authNotice success">{successMessage}</div>}

        <form className="loginForm" onSubmit={handleLogin}>
          <div className="loginInput">
            <User size={24} />
            <input
              name="email"
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="loginInput">
            <KeyRound size={24} />
            <input
              name="password"
              type="password"
              placeholder="Password"
              aria-label="Password"
              required
            />
          </div>

          <button type="submit" className="authButton" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="forgotText">
          I forgot my password.{" "}
          <button type="button" onClick={handlePasswordReset} disabled={isResetting}>
            {isResetting ? "Sending..." : "Click here to reset"}
          </button>
        </p>

        <div className="divider">
          <span></span>
          <p>or continue with</p>
          <span></span>
        </div>

        <button
          type="button"
          className="socialButton"
          onClick={() => handleProviderLogin("google")}
          disabled={Boolean(providerLoading)}
          title={googleLoginEnabled ? "Continue with Google" : "Google login is not enabled yet"}
        >
          <strong className="socialIcon">G</strong>
          {providerLoading === "google"
            ? "Opening Google..."
            : googleLoginEnabled
              ? "Continue with Google"
              : "Google login coming soon"}
        </button>

        <button
          type="button"
          className="socialButton"
          onClick={() => handleProviderLogin("facebook")}
          disabled={Boolean(providerLoading)}
          title={facebookLoginEnabled ? "Continue with Facebook" : "Facebook login is not enabled yet"}
        >
          <strong className="socialIcon">f</strong>
          {providerLoading === "facebook"
            ? "Opening Facebook..."
            : facebookLoginEnabled
              ? "Continue with Facebook"
              : "Facebook login coming soon"}
        </button>

        <Link to={registerPath} className="registerAccountBtn">
          Register New Account
        </Link>
      </div>
    </div>
  );
}

export default Login;
