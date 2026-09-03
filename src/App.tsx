import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type { Profile } from "./types";
import { useTheme } from "./hooks/useTheme";
import { useI18n } from "./i18n";
import ProfileList from "./components/ProfileList";
import ProfileForm from "./components/ProfileForm";
import ConnectionTestModal from "./components/ConnectionTestModal";
import SetPasswordModal from "./components/SetPasswordModal";
import ConfirmDialog from "./components/ConfirmDialog";
import AlertDialog from "./components/AlertDialog";

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [passwordSet, setPasswordSet] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [formInitial, setFormInitial] = useState<Profile | null>(null);
  const [testing, setTesting] = useState<{ profile: Profile; password: string } | null>(null);
  const [passwordFor, setPasswordFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Profile | null>(null);
  const [testStatus, setTestStatus] = useState<Record<string, boolean>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [theme, toggleTheme] = useTheme();
  const { t, lang, toggleLang } = useI18n();

  async function refresh() {
    try {
      setProfiles(await invoke<Profile[]>("list_profiles"));
      setError(null);
    } catch (e) {
      setError(String(e));
    }
    try {
      const withPw = await invoke<string[]>("password_status");
      const map: Record<string, boolean> = {};
      for (const n of withPw) map[n] = true;
      setPasswordSet(map);
    } catch {
      // keyring unavailable — leave all icons as "unset"
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSave(profile: Profile, password: string) {
    if (editing) {
      await invoke("update_profile", { profile, password: password || null });
    } else {
      await invoke("add_profile", { profile, password });
    }
    setEditing(null);
    setFormInitial(null);
    setFormOpen(false);
    await refresh();
  }

  async function handleDelete(p: Profile) {
    try {
      await invoke("delete_profile", { name: p.name });
      setDeleting(null);
      await refresh();
    } catch (e) {
      setAlertMsg(String(e));
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-page text-primary">
      <header className="border-b border-subtle px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#336791] to-[#539bf5] flex items-center justify-center text-white font-bold text-sm mono">
          pg
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold tracking-tight">PostgreSQL MCP Profiles Manager</h1>
          <p className="text-xs text-muted">{t("app.subtitle")}</p>
        </div>
        <button
          onClick={toggleLang}
          className="h-8 px-2 rounded-md border border-strong bg-raised hover:bg-raised-hover flex items-center justify-center text-xs font-medium text-secondary hover:text-primary transition-colors"
          title={lang === "zh" ? "Switch to English" : "切换到中文"}
        >
          {lang === "zh" ? "EN" : "中"}
        </button>
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-md border border-strong bg-raised hover:bg-raised-hover flex items-center justify-center text-secondary hover:text-primary transition-colors"
          title={theme === "dark" ? t("app.theme.toLight") : t("app.theme.toDark")}
        >
          {theme === "dark" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </header>

      <main className="flex-1 p-6 w-full">
        {error && (
          <div className="mb-4 rounded-lg bg-err-bg border border-err-border px-4 py-3 text-sm text-err-text">
            {error}
          </div>
        )}
        <ProfileList
          profiles={profiles}
          testStatus={testStatus}
          passwordSet={passwordSet}
          onAdd={() => { setEditing(null); setFormInitial(null); setFormOpen(true); }}
          onEdit={(p) => { setFormInitial(null); setEditing(p); setFormOpen(true); }}
          onCopy={(p) => {
            setEditing(null);
            setFormInitial({ ...p, name: `${p.name}-copy` });
            setFormOpen(true);
          }}
          onDelete={(p) => setDeleting(p)}
          onTest={(p) => setTesting({ profile: p, password: "" })}
          onSetPassword={(p) => setPasswordFor(p.name)}
          onOpenDir={() => invoke("open_config_dir").catch((e) => setAlertMsg(String(e)))}
          onRefresh={refresh}
        />
      </main>

      {formOpen && (
        <ProfileForm
          key={formInitial ? `copy-${formInitial.name}` : editing ? `edit-${editing.name}` : "add"}
          title={formInitial ? t("form.copy") : undefined}
          initial={formInitial ?? editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setFormInitial(null); }}
        />
      )}
      {testing && (
        <ConnectionTestModal
          profile={testing.profile}
          password={testing.password}
          onResult={(ok) => setTestStatus((s) => ({ ...s, [testing.profile.name]: ok }))}
          onClose={() => setTesting(null)}
        />
      )}
      {passwordFor && (
        <SetPasswordModal profileName={passwordFor} onClose={() => { setPasswordFor(null); refresh(); }} />
      )}
      {deleting && (
        <ConfirmDialog
          title={t("delete.title")}
          message={t("delete.message", { name: deleting.name })}
          confirmLabel={t("delete.confirm")}
          cancelLabel={t("common.cancel")}
          onConfirm={() => handleDelete(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
      {alertMsg && (
        <AlertDialog title={t("common.error")} message={alertMsg} okLabel={t("common.ok")} onClose={() => setAlertMsg(null)} />
      )}
    </div>
  );
}

export default App;
