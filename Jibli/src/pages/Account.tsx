import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Gamepad2, LogOut, PackageSearch, PlusCircle, Shield } from "lucide-react";
import { isAdminEmail } from "../admin";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import { useTranslation } from "../i18n/LanguageContext";

const tunisianGovernorates = [
  "Ariana",
  "Beja",
  "Ben Arous",
  "Bizerte",
  "Gabes",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kebili",
  "Kef",
  "Mahdia",
  "Manouba",
  "Medenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
];

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? fallback);
  }

  return fallback;
};

function Account() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setIsLoading(false);
        return;
      }

      const accountEmail = userData.user.email ?? "";
      setEmail(accountEmail);
      setOriginalEmail(accountEmail);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, phone, city, postal_code, avatar_url, role")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Could not load profile", profileError);
        setIsLoading(false);
        return;
      }

      if (profile) {
        setFullName(profile.full_name ?? "");
        setPhone(profile.phone ?? "");
        setCity(profile.city ?? "");
        setPostalCode(profile.postal_code ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
      }

      setIsLoading(false);
    };

    loadProfile();
  }, []);

  const displayName = fullName.trim() || t("account.defaultName");
  const canAccessAdmin = isAdminEmail(originalEmail);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const needsRequiredDetails = !fullName.trim() || !phone.trim() || !city;

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsSaving(true);

    try {
      const nextEmail = email.trim();

      if (nextEmail && nextEmail !== originalEmail) {
        const { error } = await supabase.auth.updateUser({ email: nextEmail });

        if (error) {
          throw error;
        }

        setOriginalEmail(nextEmail);
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw userError ?? new Error(t("account.mustBeLoggedIn"));
      }

      const profilePayload = {
        email: userData.user.email ?? nextEmail,
        full_name: fullName.trim(),
        phone: phone.trim(),
        city,
        postal_code: postalCode.trim() || null,
        avatar_url: avatarUrl || null,
      };

      const { data: existingProfile, error: existingProfileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (existingProfileError) {
        throw existingProfileError;
      }

      if (existingProfile) {
        const { error: updateProfileError } = await supabase
          .from("profiles")
          .update(profilePayload)
          .eq("id", userData.user.id);

        if (updateProfileError) {
          throw updateProfileError;
        }
      } else {
        const { error: insertProfileError } = await supabase.from("profiles").insert({
          id: userData.user.id,
          role: isAdminEmail(userData.user.email) ? "admin" : "user",
          ...profilePayload,
        });

        if (insertProfileError) {
          throw insertProfileError;
        }
      }

      setMessage(nextEmail !== originalEmail ? t("account.updatedEmailNotice") : t("account.updatedNotice"));
    } catch (error) {
      console.error("Could not update profile", error);
      setErrorMessage(getErrorMessage(error, t("account.saveFailed")));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <div>
      <Navbar>
        <Link to="/gaming" className="outlineBtn"><Gamepad2 size={16} /> {t("nav.gaming")}</Link>
        <Link to="/request" className="outlineBtn"><PlusCircle size={16} /> {t("nav.newOrder")}</Link>
        <Link to="/tracking" className="outlineBtn"><PackageSearch size={16} /> {t("nav.trackOrders")}</Link>
        {canAccessAdmin && (
          <Link to="/admin" className="outlineBtn"><Shield size={16} /> {t("nav.admin")}</Link>
        )}
        <button className="outlineBtn accountLogoutBtn" type="button" onClick={handleLogout}>
          <LogOut size={16} /> {t("nav.logout")}
        </button>
      </Navbar>

      <main className="accountPage profileExperience">
        <section className="profileIntro">
          <span className="eyebrow">{t("account.eyebrow")}</span>
          <h1>{t("account.title")}</h1>
          <p>{t("account.subtitle")}</p>
        </section>

        <section className="profilePhones">
          <form className="profilePhone editProfilePhone" onSubmit={handleSaveProfile}>
            <div className="accountPanelHeader">
              <div>
                <span>{t("account.editProfile")}</span>
                <h2>{displayName}</h2>
              </div>
              <Link to="/request">{t("nav.backToOrders")}</Link>
            </div>

            <div className="editAvatarWrap">
              <label className="profilePhotoPicker">
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
                <span className="profileAvatar large">
                  {avatarUrl ? <img src={avatarUrl} alt="Profile preview" /> : <span>{initials || "J"}</span>}
                </span>
                <strong>{t("account.changePhoto")}</strong>
              </label>
            </div>

            {isLoading ? (
              <div className="profileLoading">{t("account.loadingProfile")}</div>
            ) : (
              <>
                {message && <div className="noticeBox success">{message}</div>}
                {errorMessage && <div className="noticeBox warning">{errorMessage}</div>}
                {needsRequiredDetails && (
                  <div className="profileRequiredNote">
                    <strong>{t("account.requiredTitle")}</strong>
                    <span>{t("account.requiredText")}</span>
                  </div>
                )}

                <div className="accountFormGrid">
                  <div>
                    <label>{t("account.fullName")}</label>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder={t("account.fullNamePlaceholder")}
                      required
                    />
                  </div>

                  <div>
                    <label>{t("account.email")}</label>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t("account.emailPlaceholder")}
                      type="email"
                    />
                  </div>

                  <div>
                    <label>{t("account.phone")}</label>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder={t("account.phonePlaceholder")}
                      required
                    />
                  </div>

                  <div>
                    <label>{t("account.city")}</label>
                    <select value={city} onChange={(event) => setCity(event.target.value)} required>
                      <option value="">{t("account.selectCity")}</option>
                      {tunisianGovernorates.map((governorate) => (
                        <option key={governorate}>{governorate}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>{t("account.postalCode")}</label>
                    <input
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      inputMode="numeric"
                      placeholder={t("account.postalCodePlaceholder")}
                    />
                  </div>
                </div>

                <button className="saveProfileBtn" type="submit" disabled={isSaving}>
                  {isSaving ? t("account.saving") : t("account.saveProfile")}
                </button>
              </>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

export default Account;
