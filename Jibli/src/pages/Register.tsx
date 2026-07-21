import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { ensureUserProfile, resendSignupOtp, signUp, verifySignupOtp } from "../auth";
import logo from "../assets/Fast-Logo.gif";

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/request";
  const loginPath = `/login?next=${encodeURIComponent(nextPath)}`;
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Once the account is created, Supabase emails a 6-digit code (sent from
  // jiblitunisia@gmail.com) instead of a click-through link. The account
  // can't sign in until that code is verified here.
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
      setErrorMessage("Passwords do not match.");
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
        setErrorMessage(
          profileError instanceof Error
            ? profileError.message
            : "Account created, but profile creation failed.",
        );
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
      setErrorMessage(
        profileError instanceof Error
          ? profileError.message
          : "Email verified, but profile creation failed.",
      );
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

    setResendNotice("A new code was sent to your email.");
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
          <Link to={loginPath} className="authPrimaryBtn">
            Login
          </Link>
        </div>
      </header>

      <div className="authCard registerCard">
        <img src={logo} alt="Jibli logo" className="authCardLogo" />

        {!pendingAccount ? (
          <>
            <h1>Register</h1>
            <p>Create your account</p>
            <div className="authNotice">Your account keeps your panier and order tracking in one place.</div>
            {errorMessage && <div className="authError">{errorMessage}</div>}

            <form className="loginForm" onSubmit={handleRegister}>
              <div className="loginInput">
                <User size={24} />
                <input
                  name="fullName"
                  type="text"
                  placeholder="Full name"
                  aria-label="Full name"
                  required
                />
              </div>

              <div className="loginInput">
                <Mail size={24} />
                <input name="email" type="email" placeholder="Email" aria-label="Email" required />
              </div>

              <div className="loginInput">
                <Phone size={24} />
                <input
                  name="phone"
                  type="tel"
                  placeholder="Phone number"
                  aria-label="Phone number"
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
                  minLength={6}
                />
              </div>

              <div className="loginInput">
                <KeyRound size={24} />
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  aria-label="Confirm password"
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" className="authButton" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Register"}
              </button>
            </form>

            <p className="forgotText">
              Already have an account? <Link to={loginPath}>Login here</Link>
            </p>
          </>
        ) : (
          <>
            <h1>Verify your email</h1>
            <p>Enter the 6-digit code we sent to {pendingAccount.email}</p>
            <div className="authNotice">
              The code comes from jiblitunisia@gmail.com — check your spam folder if you don't see it.
            </div>
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
                  placeholder="6-digit code"
                  aria-label="Verification code"
                  maxLength={6}
                  required
                />
              </div>

              <button type="submit" className="authButton" disabled={isVerifying || code.trim().length === 0}>
                {isVerifying ? "Verifying..." : "Verify & create account"}
              </button>
            </form>

            <p className="forgotText">
              Didn't get a code?{" "}
              <button type="button" onClick={handleResend} disabled={isResending}>
                {isResending ? "Sending..." : "Resend code"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Register;
