import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "zh";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    "app.subtitle": "Credentials live in your OS keyring — nothing sensitive on disk",
    "app.theme.toLight": "Switch to light theme",
    "app.theme.toDark": "Switch to dark theme",
    "list.title": "Connection Profiles",
    "list.count": "{n} saved",
    "list.openFolder": "Open Config Folder",
    "list.openFolder.title": "Open ~/.postgres-mcp/",
    "list.refresh": "Refresh",
    "list.refresh.title": "Reload profiles from connections.yaml",
    "list.add": "+ Add Profile",
    "list.col.name": "Name",
    "list.col.host": "Host",
    "list.col.port": "Port",
    "list.col.user": "User",
    "list.col.database": "Database",
    "list.col.ssl": "SSL",
    "list.col.access": "Access",
    "list.col.actions": "Actions",
    "list.empty": "No connection profiles yet",
    "list.empty.hint": "Add one to get started, or open the config folder to inspect the YAML directly",
    "action.test": "Test",
    "action.password": "Password",
    "action.password.title": "Set keyring password",
    "action.edit": "Edit",
    "action.copy": "Copy",
    "action.copy.title": "Duplicate as new profile",
    "action.delete": "Delete",
    "access.ro": "read-only",
    "access.rw": "read-write",
    "pip.untested": "Not tested this session",
    "pip.ok": "Last test: connected",
    "pip.fail": "Last test: failed",
    "form.add": "Add Profile",
    "form.edit": "Edit Profile",
    "form.copy": "Copy Profile",
    "form.name": "Name",
    "form.host": "Host",
    "form.port": "Port",
    "form.user": "User",
    "form.database": "Database",
    "form.sslMode": "SSL Mode",
    "form.accessMode": "Access Mode",
    "form.password": "Password",
    "form.password.keep": "Leave blank to keep existing",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.saving": "Saving...",
    "common.ok": "OK",
    "common.close": "Close",
    "common.error": "Error",
    "test.title": "Test Connection",
    "test.password": "Password",
    "test.password.stored": "Leave blank to use stored password",
    "test.run": "Run Test",
    "test.running": "Testing...",
    "password.title": "Set Password",
    "password.storedIn": "stored in OS keyring",
    "password.isSet": "Password set in keyring",
    "password.notSet": "No password set",
    "delete.title": "Delete Profile",
    "delete.message": "Delete \"{name}\"? This removes the profile and its stored password.",
    "delete.confirm": "Delete",
  },
  zh: {
    "app.subtitle": "密码保存在系统钥匙串中，不以明文落盘",
    "app.theme.toLight": "切换到亮色主题",
    "app.theme.toDark": "切换到暗色主题",
    "list.title": "连接配置",
    "list.count": "已保存 {n} 个",
    "list.openFolder": "打开配置目录",
    "list.openFolder.title": "打开 ~/.postgres-mcp/",
    "list.refresh": "刷新",
    "list.refresh.title": "重新加载 connections.yaml",
    "list.add": "+ 添加配置",
    "list.col.name": "名称",
    "list.col.host": "主机",
    "list.col.port": "端口",
    "list.col.user": "用户",
    "list.col.database": "数据库",
    "list.col.ssl": "SSL",
    "list.col.access": "权限",
    "list.col.actions": "操作",
    "list.empty": "暂无连接配置",
    "list.empty.hint": "点击添加创建第一个配置，或打开配置目录直接查看 YAML 文件",
    "action.test": "测试",
    "action.password": "密码",
    "action.password.title": "设置钥匙串密码",
    "action.edit": "编辑",
    "action.copy": "复制",
    "action.copy.title": "复制为新配置",
    "action.delete": "删除",
    "access.ro": "只读",
    "access.rw": "读写",
    "pip.untested": "本次会话未测试",
    "pip.ok": "上次测试：连接成功",
    "pip.fail": "上次测试：连接失败",
    "form.add": "添加配置",
    "form.edit": "编辑配置",
    "form.copy": "复制配置",
    "form.name": "名称",
    "form.host": "主机",
    "form.port": "端口",
    "form.user": "用户",
    "form.database": "数据库",
    "form.sslMode": "SSL 模式",
    "form.accessMode": "权限模式",
    "form.password": "密码",
    "form.password.keep": "留空则保持不变",
    "common.cancel": "取消",
    "common.save": "保存",
    "common.saving": "保存中...",
    "common.ok": "确定",
    "common.close": "关闭",
    "common.error": "错误",
    "test.title": "测试连接",
    "test.password": "密码",
    "test.password.stored": "留空则使用已保存的密码",
    "test.run": "开始测试",
    "test.running": "测试中...",
    "password.title": "设置密码",
    "password.storedIn": "存储在系统钥匙串",
    "password.isSet": "密码已设置",
    "password.notSet": "未设置密码",
    "delete.title": "删除配置",
    "delete.message": "确定删除「{name}」吗？将同时删除该配置和已保存的密码。",
    "delete.confirm": "删除",
  },
};

interface I18nContextValue {
  lang: Lang;
  t: (key: string, vars?: Record<string, string>) => string;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  t: (k) => k,
  toggleLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("pgmcp-lang");
    if (saved === "zh" || saved === "en") return saved;
    return navigator.language.startsWith("zh") ? "zh" : "en";
  });

  useEffect(() => {
    localStorage.setItem("pgmcp-lang", lang);
  }, [lang]);

  function t(key: string, vars?: Record<string, string>): string {
    let s = translations[lang][key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, v);
      }
    }
    return s;
  }

  const toggleLang = () => setLang((l) => (l === "en" ? "zh" : "en"));

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
