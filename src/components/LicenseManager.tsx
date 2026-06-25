import React, { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Users,
  Trash2,
  CalendarClock,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Crown,
} from "lucide-react";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface LicenseKey {
  key: string;
  durationDays: number;
  isUsed: boolean;
  createdAt: string;
}

interface UserRecord {
  id: string;
  username: string;
  role: "admin" | "seller";
  createdAt: string;
  licenseExpiresAt: string;
}

interface LicenseManagerProps {
  authToken: string | null;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("km-KH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function isExpired(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

function isLifetime(iso: string) {
  return new Date(iso).getFullYear() >= 2099;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LicenseManager({ authToken }: LicenseManagerProps) {
  const [activeTab, setActiveTab] = useState<"keys" | "users">("keys");

  // ── Keys state ──
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [count, setCount] = useState(5);
  const [durationDays, setDurationDays] = useState(30);
  const [keyLoading, setKeyLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [keyError, setKeyError] = useState("");
  const [keySuccess, setKeySuccess] = useState("");

  // ── Users state ──
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [usersSuccess, setUsersSuccess] = useState("");

  // ── Delete confirmation state ──
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState("");

  // ─── API calls ──────────────────────────────────────────────────────────────

  const fetchKeys = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/admin/keys", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) setKeys(data.keys || []);
    } catch (err) {
      console.error("Error fetching keys:", err);
    }
  };

  const fetchUsers = async () => {
    if (!authToken) return;
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setUsersError(data.error || "Failed to fetch users");
      }
    } catch (err: any) {
      setUsersError(err.message || "Network error");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [authToken]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  // ── Key generation ──
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setKeyLoading(true);
    setKeyError("");
    setKeySuccess("");

    try {
      const res = await fetch("/api/admin/generate-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ count, durationDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setKeySuccess(`បានបង្កើតសោចំនួន ${count} គ្រាប់ដោយជោគជ័យ!`);
      fetchKeys();
    } catch (err: any) {
      setKeyError(err.message || "Failed to generate keys");
    } finally {
      setKeyLoading(false);
    }
  };

  const handleCopy = (keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKey(keyStr);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Extend license ──
  const handleExtend = async (user: UserRecord, days: number) => {
    if (!authToken) return;
    setUsersError("");
    setUsersSuccess("");
    try {
      const res = await fetch("/api/admin/users/extend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username: user.username, durationDays: days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extension failed");
      setUsersSuccess(`បន្ថែម ${days} ថ្ងៃជូន "${user.username}" ដោយជោគជ័យ!`);
      fetchUsers();
    } catch (err: any) {
      setUsersError(err.message || "Failed to extend license");
    }
  };

  // ── Delete account ──
  const handleDeleteConfirm = async () => {
    if (!authToken || !confirmDeleteId) return;
    setUsersError("");
    setUsersSuccess("");
    const name = confirmDeleteName;
    setConfirmDeleteId(null);
    setConfirmDeleteName("");

    try {
      const res = await fetch(`/api/admin/users/${confirmDeleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deletion failed");
      setUsersSuccess(`គណនី "${name}" ត្រូវបានលុបដោយជោគជ័យ!`);
      fetchUsers();
    } catch (err: any) {
      setUsersError(err.message || "Failed to delete account");
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-indigo-600 rounded" />
        <div>
          <h2 className="text-md font-bold text-slate-700">
            គ្រប់គ្រងប្រព័ន្ធ (Admin Panel)
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            គ្រប់គ្រងលេខកូដសោរ និងគណនីអ្នកប្រើប្រាស់ទាំងអស់
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("keys")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "keys"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          🔑 លេខកូដសោរ
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "users"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          👥 គណនីអ្នកប្រើប្រាស់
        </button>
      </div>

      {/* ── Tab: License Keys ── */}
      {activeTab === "keys" && (
        <div className="space-y-4">
          {/* Alerts */}
          {keyError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-3 rounded-lg font-medium">
              ⚠️ {keyError}
            </div>
          )}
          {keySuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-3 rounded-lg font-medium">
              ✅ {keySuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Generate Form */}
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-4 h-fit">
              <h3 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                បង្កើតសោរថ្មី (Generate Keys)
              </h3>

              <form onSubmit={handleGenerate} className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    ចំនួនគ្រាប់ (Key Count)
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  >
                    <option value={1}>1 គ្រាប់</option>
                    <option value={5}>5 គ្រាប់</option>
                    <option value={10}>10 គ្រាប់</option>
                    <option value={20}>20 គ្រាប់</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    រយៈពេលសុពលភាព (Duration)
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  >
                    <option value={30}>30 ថ្ងៃ (1 ខែ)</option>
                    <option value={90}>90 ថ្ងៃ (3 ខែ)</option>
                    <option value={180}>180 ថ្ងៃ (6 ខែ)</option>
                    <option value={365}>365 ថ្ងៃ (1 ឆ្នាំ)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={keyLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm active:translate-y-0.5"
                >
                  {keyLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "បង្កើតឥឡូវនេះ (Generate Now)"
                  )}
                </button>
              </form>
            </div>

            {/* Key List */}
            <div className="md:col-span-2 border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[300px]">
              <div className="bg-slate-50 border-b border-slate-200 p-3 px-4 flex justify-between items-center">
                <span className="text-xs font-black text-slate-600">
                  សោរដែលមិនទាន់ប្រើប្រាស់ ({keys.length} គ្រាប់)
                </span>
                <button
                  onClick={fetchKeys}
                  className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto max-h-[400px] divide-y divide-slate-100 bg-white">
                {keys.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                    <Key className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                    <p className="text-[10px] font-medium">
                      មិនទាន់មានលេខកូដសោរក្នុងប្រព័ន្ធទេ
                    </p>
                  </div>
                ) : (
                  keys.map((k) => (
                    <div
                      key={k.key}
                      className="flex justify-between items-center py-2.5 px-1"
                    >
                      <div>
                        <code className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100/50 p-1 px-2 rounded-md font-mono select-all">
                          {k.key}
                        </code>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-bold ml-2 p-0.5 px-1.5 rounded-full border border-slate-200">
                          {k.durationDays} ថ្ងៃ
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(k.key)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          copiedKey === k.key
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        {copiedKey === k.key ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Key
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: User Accounts ── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Alerts */}
          {usersError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-3 rounded-lg font-medium">
              ⚠️ {usersError}
            </div>
          )}
          {usersSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-3 rounded-lg font-medium">
              ✅ {usersSuccess}
            </div>
          )}

          {/* User Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-3 px-4 flex justify-between items-center">
              <span className="text-xs font-black text-slate-600">
                គណនីអ្នកប្រើប្រាស់ ({users.length} គណនី)
              </span>
              <button
                onClick={fetchUsers}
                className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">កំពុងផ្ទុក...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <Users className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                <p className="text-[10px] font-medium">
                  មិនទាន់មានអ្នកប្រើប្រាស់ក្នុងប្រព័ន្ធទេ
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black text-slate-500 uppercase tracking-wide bg-slate-50/80">
                      <th className="px-4 py-2.5">ឈ្មោះអ្នកប្រើប្រាស់</th>
                      <th className="px-4 py-2.5">តួនាទី</th>
                      <th className="px-4 py-2.5">ស្ថានភាពសោ</th>
                      <th className="px-4 py-2.5">ផុតកំណត់</th>
                      <th className="px-4 py-2.5 text-right">ដំណើរការ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const expired = isExpired(u.licenseExpiresAt);
                      const lifetime = isLifetime(u.licenseExpiresAt);
                      const isMaster = u.username.toLowerCase() === "adminkosal2006";

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Username */}
                          <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-1.5">
                            {isMaster && (
                              <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            )}
                            {u.username}
                          </td>

                          {/* Role badge */}
                          <td className="px-4 py-3">
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                u.role === "admin"
                                  ? "bg-violet-50 text-violet-700 border-violet-200"
                                  : "bg-sky-50 text-sky-700 border-sky-200"
                              }`}
                            >
                              {u.role === "admin" ? "Admin" : "Seller"}
                            </span>
                          </td>

                          {/* License status */}
                          <td className="px-4 py-3">
                            {lifetime ? (
                              <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full w-fit">
                                <ShieldCheck className="w-3 h-3" />
                                Lifetime
                              </span>
                            ) : expired ? (
                              <span className="flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full w-fit">
                                <ShieldAlert className="w-3 h-3" />
                                ផុតកំណត់
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
                                <ShieldCheck className="w-3 h-3" />
                                សកម្ម
                              </span>
                            )}
                          </td>

                          {/* Expiry date */}
                          <td className="px-4 py-3 text-[10px] text-slate-500 font-medium">
                            {lifetime ? "—" : formatDate(u.licenseExpiresAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            {isMaster ? (
                              <span className="text-[9px] text-slate-400 font-medium italic">
                                Master Admin
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {/* Extend buttons */}
                                <button
                                  onClick={() => handleExtend(u, 30)}
                                  title="Extend 30 days"
                                  className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg transition-all"
                                >
                                  <CalendarClock className="w-3 h-3" />
                                  +30ថ្ងៃ
                                </button>
                                <button
                                  onClick={() => handleExtend(u, 90)}
                                  title="Extend 90 days"
                                  className="flex items-center gap-1 text-[9px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-1 rounded-lg transition-all"
                                >
                                  <CalendarClock className="w-3 h-3" />
                                  +90ថ្ងៃ
                                </button>
                                <button
                                  onClick={() => handleExtend(u, 365)}
                                  title="Extend 365 days"
                                  className="flex items-center gap-1 text-[9px] font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2 py-1 rounded-lg transition-all"
                                >
                                  <CalendarClock className="w-3 h-3" />
                                  +1ឆ្នាំ
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => {
                                    setConfirmDeleteId(u.id);
                                    setConfirmDeleteName(u.username);
                                  }}
                                  title="Delete Account"
                                  className="flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  លុប
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-80 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  បញ្ជាក់ការលុប
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  សកម្មភាពនេះមិនអាចប្រឡប់វិញបានទេ!
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-700 bg-rose-50 border border-rose-100 p-3 rounded-lg">
              តើអ្នកចង់លុបគណនី{" "}
              <span className="font-black text-rose-700">
                "{confirmDeleteName}"
              </span>{" "}
              ពិតមែនទេ? ទិន្នន័យទាំងអស់នឹងត្រូវបានលុបចោល។
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setConfirmDeleteId(null);
                  setConfirmDeleteName("");
                }}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
              >
                បោះបង់
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm"
              >
                លុបចេញ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
