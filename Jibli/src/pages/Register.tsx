import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { ensureUserProfile, resendSignupOtp, signUp, verifySignupOtp } from "../auth";
import logo from "../assets/Fast-Logo.gif";
import { useTranslation } from "../i18n/LanguageContext";

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/request";
  const loginPath = `/login?next=${encodeURIComponent(nextPath)}`;
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Once the account is created, Supabase emails a verification code (sent
  // from jiblitunisia@gmail.com) instead of a click-through link. The
  // account can't sign in until that code is verified here. Don't assume a
  // fixed digit count for the code — it's been observed as 8 digits, not
  // Supabase's usual 6.
  const [pendingAccount, setPendingAccount] = useState<{
    email: string;
    fullName: string;
    phone: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");

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
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      // Email confirmation isn't enabled in Supabase — the account is
      // already active, so skip straight past the code step.
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
      return;
    }

    setIsSubmitting(false);
    setPendingAccount({ email, fullName, phone });
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!pendingAccount) {
      return;
    }

    setErrorMessage("");
    setIsVerifying(true);

    const { error } = await verifySignupOtp(pendingAccount.email, code.trim());

    if (error) {
      setIsVerifying(false);
      setErrorMessage(error.message);
      return;
    }

    try {
      await ensureUserProfile({
        full_name: pendingAccount.fullName,
        phone: pendingAccount.phone,
      });
    } catch (profileError) {
      setIsVerifying(false);
      setErrorMessage(profileError instanceof Error ? profileError.message : t("register.profileFailedVerify"));
      return;
    }

    setIsVerifying(false);
    navigate(nextPath, { replace: true });
  };

  const handleResend = async () => {
    if (!pendingAccount) {
      return;
    }

    setErrorMessage("");
    setResendNotice("");
    setIsResending(true);

    const { error } = await resendSignupOtp(pendingAccount.email);

    setIsResending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setResendNotice(t("register.resendSuccess"));
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

        {!pendingAccount ? (
          <>
            <h1>{t("register.title")}</h1>
            <p>{t("register.subtitle")}</p>
            <div className="authNotice">{t("register.notice")}</div>
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
                <input name="email" type="email" placeholder={t("register.email")} aria-label={t("register.email")} required />
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
          </>
        ) : (
          <>
            <h1>{t("register.verifyTitle")}</h1>
            <p>{t("register.verifySubtitle", { email: pendingAccount.email })}</p>
            <div className="authNotice">{t("register.verifyNotice")}</div>
            {errorMessage && <div className="authError">{errorMessage}</div>}
            {resendNotice && <div className="authNotice success">{resendNotice}</div>}

            <form className="loginForm" onSubmit={handleVerify}>
              <div className="loginInput">
                <ShieldCheck size={24} />
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  type="text"
                  inputMode="numeric"
                  placeholder={t("register.codePlaceholder")}
                  aria-label={t("register.codePlaceholder")}
                  maxLength={12}
                  required
                />
              </div>

              <button type="submit" className="authButton" disabled={isVerifying || code.trim().length === 0}>
                {isVerifying ? t("register.verifying") : t("register.verifySubmit")}
              </button>
            </form>

            <p className="forgotText">
              {t("register.noCode")}{" "}
              <button type="button" onClick={handleResend} disabled={isResending}>
                {isResending ? t("register.resending") : t("register.resendCode")}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Register;
