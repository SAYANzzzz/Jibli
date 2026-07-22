import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, User } from "lucide-react";
import { ensureUserProfile, getAuthErrorMessage, sendPasswordReset, signIn, signInWithProvider } from "../auth";
import logo from "../assets/Fast-Logo.gif";
import { useTranslation } from "../i18n/LanguageContext";

const googleLoginEnabled = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === "true";
const facebookLoginEnabled = import.meta.env.VITE_ENABLE_FACEBOOK_LOGIN === "true";

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/request";
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
      setErrorMessage(getAuthErrorMessage(error, t("login.loginFailed")));
      return;
    }

    try {
      await ensureUserProfile();
    } catch (profileError) {
      setIsSubmitting(false);
      setErrorMessage(profileError instanceof Error ? profileError.message : t("login.profileFailedLogin"));
      return;
    }

    setIsSubmitting(false);
    navigate(nextPath, { replace: true });
  };

  const handleProviderLogin = async (provider: "google" | "facebook") => {
    setErrorMessage("");
    setSuccessMessage("");

    const isEnabled = provider === "google" ? googleLoginEnabled : facebookLoginEnabled;
    const providerName = provider === "google" ? "Google" : "Facebook";

    if (!isEnabled) {
      setErrorMessage(t("login.providerNotEnabled", { provider: providerName }));
      return;
    }

    setProviderLoading(provider);
    const { data, error } = await signInWithProvider(provider, nextPath);

    if (error) {
      setErrorMessage(getAuthErrorMessage(error, t("login.providerFailed", { provider: providerName })));
      setProviderLoading("");
      return;
    }

    if (!data.url) {
      setErrorMessage(t("login.providerNotConfigured", { provider: providerName }));
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
      setErrorMessage(t("login.enterEmailFirst"));
      return;
    }

    setIsResetting(true);
    const { error } = await sendPasswordReset(trimmedEmail);
    setIsResetting(false);

    if (error) {
      setErrorMessage(getAuthErrorMessage(error, t("login.resetFailed")));
      return;
    }

    setSuccessMessage(t("login.resetSent"));
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
            {t("login.backToHome")}
          </Link>
          <Link to={registerPath} className="authPrimaryBtn">
            {t("nav.register")}
          </Link>
        </div>
      </header>

      <div className="authCard">
        <img src={logo} alt="Jibli logo" className="authCardLogo" />

        <h1>{t("login.title")}</h1>
        <p>{t("login.subtitle")}</p>
        <div className="authNotice">{t("login.notice")}</div>
        {errorMessage && <div className="authError">{errorMessage}</div>}
        {successMessage && <div className="authNotice success">{successMessage}</div>}

        <form className="loginForm" onSubmit={handleLogin}>
          <div className="loginInput">
            <User size={24} />
            <input
              name="email"
              type="email"
              placeholder={t("login.email")}
              aria-label={t("login.email")}
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
              placeholder={t("login.password")}
              aria-label={t("login.password")}
              required
            />
          </div>

          <button type="submit" className="authButton" disabled={isSubmitting}>
            {isSubmitting ? t("login.loggingIn") : t("login.submit")}
          </button>
        </form>

        <p className="forgotText">
          {t("login.forgotText")}{" "}
          <button type="button" onClick={handlePasswordReset} disabled={isResetting}>
            {isResetting ? t("login.sendingReset") : t("login.resetLink")}
          </button>
        </p>

        <div className="divider">
          <span></span>
          <p>{t("login.orContinueWith")}</p>
          <span></span>
        </div>

        <button
          type="button"
          className="socialButton"
          onClick={() => handleProviderLogin("google")}
          disabled={Boolean(providerLoading)}
          title={googleLoginEnabled ? t("login.continueWithGoogle") : t("login.googleComingSoon")}
        >
          <strong className="socialIcon">G</strong>
          {providerLoading === "google"
            ? t("login.openingGoogle")
            : googleLoginEnabled
              ? t("login.continueWithGoogle")
              : t("login.googleComingSoon")}
        </button>

        <button
          type="button"
          className="socialButton"
          onClick={() => handleProviderLogin("facebook")}
          disabled={Boolean(providerLoading)}
          title={facebookLoginEnabled ? t("login.continueWithFacebook") : t("login.facebookComingSoon")}
        >
          <strong className="socialIcon">f</strong>
          {providerLoading === "facebook"
            ? t("login.openingFacebook")
            : facebookLoginEnabled
              ? t("login.continueWithFacebook")
              : t("login.facebookComingSoon")}
        </button>

        <Link to={registerPath} className="registerAccountBtn">
          {t("login.registerNewAccount")}
        </Link>
      </div>
    </div>
  );
}

export default Login;
