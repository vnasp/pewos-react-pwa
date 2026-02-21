import { useState } from "react";
import { Send, Check, X, Trash2, Users, Mail } from "lucide-react";
import { useSharedAccess } from "../context/SharedAccessContext";
import { useAuth } from "../context/AuthContext";

export default function SharedAccessScreen() {
  const {
    sentInvitations,
    receivedInvitations,
    activeShares,
    loading,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    revokeAccess,
  } = useSharedAccess();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Ingresa un email");
      return;
    }
    setError(null);
    setSending(true);
    try {
      await sendInvitation(email.trim());
      setEmail("");
    } catch (err: any) {
      setError(err.message ?? "Error al enviar invitación");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6 px-5 pt-5">
      {/* Enviar invitación */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <h2 className="text-gray-900 font-bold text-base mb-3">
          Compartir acceso
        </h2>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-1 font-semibold text-sm disabled:opacity-60 active:scale-95 transition-transform"
          >
            <Send size={16} />
            {sending ? "..." : "Enviar"}
          </button>
        </form>
        {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
      </div>

      {/* Invitaciones recibidas */}
      {receivedInvitations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-gray-700 font-bold text-sm uppercase mb-3">
            Invitaciones recibidas
          </h3>
          <div className="flex flex-col gap-3">
            {receivedInvitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-amber-400"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Mail size={16} className="text-gray-500" />
                  <span className="text-gray-800 text-sm font-semibold">
                    {inv.ownerId}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptInvitation(inv.id)}
                    className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <Check size={15} /> Aceptar
                  </button>
                  <button
                    onClick={() => rejectInvitation(inv.id)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1"
                  >
                    <X size={15} /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accesos activos */}
      {activeShares.length > 0 && (
        <div className="mb-6">
          <h3 className="text-gray-700 font-bold text-sm uppercase mb-3">
            Acceso compartido activo
          </h3>
          <div className="flex flex-col gap-3">
            {activeShares.map((share) => (
              <div
                key={share.id}
                className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Users size={18} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm truncate">
                    {share.ownerId === user?.id
                      ? share.sharedWithEmail
                      : share.ownerId}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {share.ownerId === user?.id
                      ? "Compartido contigo"
                      : "Te ha compartido acceso"}
                  </p>
                </div>
                {share.ownerId === user?.id && (
                  <button
                    onClick={() => revokeAccess(share.id)}
                    className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform shrink-0"
                  >
                    <Trash2 size={15} className="text-red-600" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitaciones enviadas pendientes */}
      {sentInvitations.filter((i) => i.status === "pending").length > 0 && (
        <div>
          <h3 className="text-gray-700 font-bold text-sm uppercase mb-3">
            Invitaciones enviadas
          </h3>
          <div className="flex flex-col gap-3">
            {sentInvitations
              .filter((i) => i.status === "pending")
              .map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 opacity-70"
                >
                  <Mail size={18} className="text-gray-400 shrink-0" />
                  <p className="text-gray-600 text-sm flex-1 truncate">
                    {inv.sharedWithEmail}
                  </p>
                  <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-lg">
                    Pendiente
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {!loading &&
        activeShares.length === 0 &&
        receivedInvitations.length === 0 &&
        sentInvitations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={64} strokeWidth={1.5} />
            <p className="mt-4 text-sm text-center">
              Comparte el acceso con familiares o veterinarios
            </p>
          </div>
        )}
    </div>
  );
}
