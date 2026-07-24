import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Mail, Phone, User } from "lucide-react";
import { ensureUserProfile, getAuthErrorMessage, signUp } from "../auth";
import logo from "../assets/Fast-Logo.gif";
import { useTranslation } from "../i18n/LanguageContext";

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/request";
  const loginPath = `/login?next=${encodeURIComponent(nextPath)}`;
  const prefillEmail = searchParams.get("email") ?? "";
  const accountNotFound = searchParams.get("reason") === "notfound";
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "");
    const email = String(formData.get("email") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setErrorMessage(t("register.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await signUp(email, password, {
      full_name: fullName,
      phone,
    });

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(getAuthErrorMessage(error, t("register.signupFailed")));
      return;
    }

    // Supabase deliberately returns an identical-looking response whether
    // the email is new or already registered (anti-enumeration), so it
    // can't be detected from `error`. The one reliable tell: a genuinely
    // new signup gets a real identity attached to the user; an existing
    // account gets an empty `identities` array back instead.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setIsSubmitting(false);
      navigate(
        `/login?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(email)}&reason=exists`,
        { replace: true },
      );
      return;
    }

    try {
      await ensureUserProfile({
        full_name: fullName,
        phone,
      });
    } catch (profileError) {
      setIsSubmitting(false);
      setErrorMessage(profileError instanceof Error ? profileError.message : t("register.profileFailedRegister"));
      return;
    }

    setIsSubmitting(false);
    navigate(nextPath, { replace: true });
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
          <Link to={loginPath} className="authPrimaryBtn">
            {t("nav.login")}
          </Link>
        </div>
      </header>

      <div className="authCard registerCard">
        <img src={logo} alt="Jibli logo" className="authCardLogo" />

        <h1>{t("register.title")}</h1>
        <p>{t("register.subtitle")}</p>
        {accountNotFound ? (
          <div className="authNotice">{t("register.accountNotFound")}</div>
        ) : (
          <div className="authNotice">{t("register.notice")}</div>
        )}
        {errorMessage && <div className="authError">{errorMessage}</div>}

        <form className="loginForm" onSubmit={handleRegister}>
          <div className="loginInput">
            <User size={24} />
            <input
              name="fullName"
              type="text"
              placeholder={t("register.fullName")}
              aria-label={t("register.fullName")}
              required
            />
          </div>

          <div className="loginInput">
            <Mail size={24} />
            <input
              name="email"
              type="email"
              placeholder={t("register.email")}
              aria-label={t("register.email")}
              defaultValue={prefillEmail}
              required
            />
          </div>

          <div className="loginInput">
            <Phone size={24} />
            <input
              name="phone"
              type="tel"
              placeholder={t("register.phone")}
              aria-label={t("register.phone")}
              required
            />
          </div>

          <div className="loginInput">
            <KeyRound size={24} />
            <input
              name="password"
              type="password"
              placeholder={t("register.password")}
              aria-label={t("register.password")}
              required
              minLength={6}
            />
          </div>

          <div className="loginInput">
            <KeyRound size={24} />
            <input
              name="confirmPassword"
              type="password"
              placeholder={t("register.confirmPassword")}
              aria-label={t("register.confirmPassword")}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="authButton" disabled={isSubmitting}>
            {isSubmitting ? t("register.creating") : t("register.submit")}
          </button>
        </form>

        <p className="forgotText">
          {t("register.alreadyHaveAccount")} <Link to={loginPath}>{t("register.loginHere")}</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
