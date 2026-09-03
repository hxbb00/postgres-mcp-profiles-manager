import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import type { Profile } from "../types";
import { useI18n } from "../i18n";

interface Props {
  profile: Profile;
  password: string;
  onResult?: (ok: boolean) => void;
  onClose: () => void;
}

export default function ConnectionTestModal({ profile, password, onResult, onClose }: Props) {
  const { t } = useI18n();
  const [passwordInput, setPasswordInput] = useState(password);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const msg = await invoke<string>("test_connection", {
        profile,
        password: passwordInput || null,
      });
      setResult({ ok: true, message: msg });
      onResult?.(true);
    } catch (e) {
      setResult({ ok: false, message: String(e) });
      onResult?.(false);
    } finally {
      setRunning(false);
    }
  }

  const input =
    "w-full bg-input border border-strong rounded-md px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-[#539bf5] focus:ring-1 focus:ring-[#539bf5] transition-colors";

  return (
    <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-panel border border-strong rounded-xl shadow-2xl p-6 w-[440px] max-w-full">
        <h3 className="text-base font-semibold text-primary mb-1">{t("test.title")}</h3>
        <p className="text-sm text-muted mb-4">
          <span className="text-secondary font-medium">{profile.name}</span>
          <span className="mono text-xs ml-2">{profile.host}:{profile.port}</span>
        </p>

        <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">{t("test.password")}</label>
        <input
          className={input}
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder={t("test.password.stored")}
        />

        {result && (
          <div
            className={`mt-4 p-3 rounded-md text-sm border ${
              result.ok
                ? "bg-ok-bg border-ok-border text-ok-text"
                : "bg-err-bg border-err-border text-err-text"
            }`}
          >
            <span className="font-medium mr-1.5">{result.ok ? "✓" : "✕"}</span>
            {result.message}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-secondary bg-raised border border-strong rounded-md hover:bg-raised-hover hover:text-primary transition-colors"
          >
            {t("common.close")}
          </button>
          <button
            onClick={run}
            disabled={running}
            className="px-4 py-2 text-xs font-medium text-white bg-accent border border-accent-border rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {running ? t("test.running") : t("test.run")}
          </button>
        </div>
      </div>
    </div>
  );
}
