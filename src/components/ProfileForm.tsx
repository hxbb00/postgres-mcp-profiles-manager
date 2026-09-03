import { useState } from "react";
import { SslMode, AccessMode } from "../types";
import type { Profile } from "../types";
import { useI18n } from "../i18n";

interface Props {
  initial?: Profile;
  title?: string;
  onSave: (profile: Profile, password: string) => Promise<void>;
  onClose: () => void;
}

export default function ProfileForm({ initial, title, onSave, onClose }: Props) {
  const { t } = useI18n();
  const [form, setForm] = useState<Profile>(
    initial ?? {
      name: "",
      host: "localhost",
      port: 5432,
      user: "postgres",
      database: "postgres",
      ssl_mode: SslMode.Prefer,
      access_mode: AccessMode.Rw,
    }
  );
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form, password);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full bg-input border border-strong rounded-md px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-[#539bf5] focus:ring-1 focus:ring-[#539bf5] transition-colors";
  const label = "block text-xs font-medium text-muted uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-panel border border-strong rounded-xl shadow-2xl p-6 w-[520px] max-w-full max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-base font-semibold text-primary mb-5">{title ?? (initial ? t("form.edit") : t("form.add"))}</h3>

        {error && (
          <div className="mb-4 p-3 rounded-md text-sm bg-err-bg border border-err-border text-err-text break-words">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>{t("form.name")}</label>
            <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className={label}>{t("form.host")}</label>
            <input className={`${input} mono`} value={form.host} onChange={(e) => set("host", e.target.value)} required />
          </div>
          <div>
            <label className={label}>{t("form.port")}</label>
            <input
              className={`${input} mono`}
              type="number"
              min={1}
              max={65535}
              value={form.port}
              onChange={(e) => set("port", Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className={label}>{t("form.user")}</label>
            <input className={input} value={form.user} onChange={(e) => set("user", e.target.value)} required />
          </div>
          <div>
            <label className={label}>{t("form.database")}</label>
            <input className={input} value={form.database} onChange={(e) => set("database", e.target.value)} required />
          </div>
          <div>
            <label className={label}>{t("form.sslMode")}</label>
            <select className={input} value={form.ssl_mode} onChange={(e) => set("ssl_mode", e.target.value as SslMode)}>
              {Object.values(SslMode).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>{t("form.accessMode")}</label>
            <select className={input} value={form.access_mode} onChange={(e) => set("access_mode", e.target.value as AccessMode)}>
              {Object.values(AccessMode).map((m) => (
                <option key={m} value={m}>{m === "ro" ? t("access.ro") : t("access.rw")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>{t("form.password")}</label>
            <input
              className={input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("form.password.keep")}
            />
          </div>
        </div>

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
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-white bg-accent border border-accent-border rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
