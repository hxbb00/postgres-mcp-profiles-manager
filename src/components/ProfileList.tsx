import type { Profile } from "../types";
import { AccessMode } from "../types";
import { useI18n } from "../i18n";

interface Props {
  profiles: Profile[];
  testStatus: Record<string, boolean>;
  passwordSet: Record<string, boolean>;
  onAdd: () => void;
  onEdit: (p: Profile) => void;
  onCopy: (p: Profile) => void;
  onDelete: (p: Profile) => void;
  onTest: (p: Profile) => void;
  onSetPassword: (p: Profile) => void;
  onOpenDir: () => void;
  onRefresh: () => void;
}

function AccessBadge({ mode }: { mode: AccessMode }) {
  const { t } = useI18n();
  if (mode === AccessMode.Ro) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-ro-bg text-ro-text border border-ro-border">
        {t("access.ro")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rw-bg text-rw-text border border-rw-border">
      {t("access.rw")}
    </span>
  );
}

function StatusPip({ status }: { status: boolean | undefined }) {
  const { t } = useI18n();
  if (status === undefined) {
    return <span className="inline-block w-2 h-2 rounded-full border border-pip-off" title={t("pip.untested")} />;
  }
  if (status) {
    return <span className="inline-block w-2 h-2 rounded-full bg-ok-text shadow-[0_0_6px_var(--ok-border)]" title={t("pip.ok")} />;
  }
  return <span className="inline-block w-2 h-2 rounded-full bg-err-text shadow-[0_0_6px_var(--err-border)]" title={t("pip.fail")} />;
}

function LockIcon({ set }: { set: boolean }) {
  const { t } = useI18n();
  if (set) {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ok-text" aria-label={t("password.isSet")} role="img">
        <title>{t("password.isSet")}</title>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
  }
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted opacity-40" aria-label={t("password.notSet")} role="img">
      <title>{t("password.notSet")}</title>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

export default function ProfileList({ profiles, testStatus, passwordSet, onAdd, onEdit, onCopy, onDelete, onTest, onSetPassword, onOpenDir, onRefresh }: Props) {
  const { t } = useI18n();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-wider">{t("list.title")}</h2>
          <span className="text-xs text-muted mono">{t("list.count", { n: String(profiles.length) })}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-medium text-secondary bg-raised border border-strong rounded-md hover:bg-raised-hover hover:text-primary transition-colors"
            title={t("list.refresh.title")}
          >
            {t("list.refresh")}
          </button>
          <button
            onClick={onOpenDir}
            className="px-3 py-1.5 text-xs font-medium text-secondary bg-raised border border-strong rounded-md hover:bg-raised-hover hover:text-primary transition-colors"
            title={t("list.openFolder.title")}
          >
            {t("list.openFolder")}
          </button>
          <button
            onClick={onAdd}
            className="px-3 py-1.5 text-xs font-medium text-white bg-accent border border-accent-border rounded-md hover:bg-accent-hover transition-colors"
          >
            {t("list.add")}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-subtle bg-tbl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-tbl-header text-left text-xs text-muted uppercase tracking-wider">
              <th className="pl-4 pr-3 py-2.5 font-medium w-8"></th>
              <th className="px-3 py-2.5 font-medium">{t("list.col.name")}</th>
              <th className="px-3 py-2.5 font-medium">{t("list.col.host")}</th>
              <th className="px-3 py-2.5 font-medium">{t("list.col.port")}</th>
              <th className="px-3 py-2.5 font-medium">{t("list.col.user")}</th>
              <th className="px-3 py-2.5 font-medium">{t("list.col.database")}</th>
              <th className="px-3 py-2.5 font-medium">{t("list.col.ssl")}</th>
              <th className="px-3 py-2.5 font-medium">{t("list.col.access")}</th>
              <th className="pl-3 pr-4 py-2.5 font-medium text-right">{t("list.col.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.name} className="border-t border-subtle hover:bg-row-hover transition-colors">
                <td className="pl-4 pr-3 py-2.5">
                  <StatusPip status={testStatus[p.name]} />
                </td>
                <td className="px-3 py-2.5 font-medium text-primary">
                  <span className="inline-flex items-center gap-1.5">
                    {p.name}
                    <LockIcon set={!!passwordSet[p.name]} />
                  </span>
                </td>
                <td className="px-3 py-2.5 mono text-secondary">{p.host}</td>
                <td className="px-3 py-2.5 mono text-muted">{p.port}</td>
                <td className="px-3 py-2.5 text-secondary">{p.user}</td>
                <td className="px-3 py-2.5 text-secondary">{p.database}</td>
                <td className="px-3 py-2.5 mono text-xs text-muted">{p.ssl_mode}</td>
                <td className="px-3 py-2.5"><AccessBadge mode={p.access_mode} /></td>
                <td className="pl-3 pr-4 py-2.5 text-right whitespace-nowrap space-x-1">
                  <ActionBtn onClick={() => onTest(p)}>{t("action.test")}</ActionBtn>
                  <ActionBtn onClick={() => onSetPassword(p)} title={t("action.password.title")}>{t("action.password")}</ActionBtn>
                  <ActionBtn onClick={() => onEdit(p)}>{t("action.edit")}</ActionBtn>
                  <ActionBtn onClick={() => onCopy(p)} title={t("action.copy.title")}>{t("action.copy")}</ActionBtn>
                  <ActionBtn danger onClick={() => onDelete(p)}>{t("action.delete")}</ActionBtn>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="text-muted text-sm">{t("list.empty")}</div>
                  <div className="text-pip-off text-xs mt-1">{t("list.empty.hint")}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={
        danger
          ? "px-2 py-1 text-xs font-medium text-danger-text bg-danger-bg border border-danger-border rounded-md hover:bg-danger-hover transition-colors"
          : "px-2 py-1 text-xs font-medium text-secondary bg-raised border border-strong rounded-md hover:bg-raised-hover hover:text-primary transition-colors"
      }
    >
      {children}
    </button>
  );
}
