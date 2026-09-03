import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { useI18n } from "../i18n";

interface Props {
  profileName: string;
  onClose: () => void;
}

export default function SetPasswordModal({ profileName, onClose }: Props) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await invoke("set_password", { name: profileName, password });
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full bg-input border border-strong rounded-md px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-[#539bf5] focus:ring-1 focus:ring-[#539bf5] transition-colors";

  return (
    <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-panel border border-strong rounded-xl shadow-2xl p-6 w-[400px] max-w-full"
      >
        <h3 className="text-base font-semibold text-primary mb-1">{t("password.title")}</h3>
        <p className="text-xs text-muted mb-4">
          <span className="text-secondary font-medium">{profileName}</span>
          <span className="mx-1.5">·</span>
          {t("password.storedIn")} <span className="mono">postgres-mcp</span>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-md text-sm bg-err-bg border border-err-border text-err-text">
            {error}
          </div>
        )}

        <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">{t("form.password")}</label>
        <input
          type="password"
          className={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-secondary bg-raised border border-strong rounded-md hover:bg-raised-hover hover:text-primary transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving || !password}
            className="px-4 py-2 text-xs font-medium text-white bg-accent border border-accent-border rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
