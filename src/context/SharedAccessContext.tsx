import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { SharedAccess } from "../types";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";

interface SharedAccessContextType {
  sentInvitations: SharedAccess[];
  receivedInvitations: SharedAccess[];
  activeShares: SharedAccess[];
  loading: boolean;
  sendInvitation: (email: string) => Promise<void>;
  acceptInvitation: (id: string) => Promise<void>;
  rejectInvitation: (id: string) => Promise<void>;
  revokeAccess: (id: string) => Promise<void>;
}

const SharedAccessContext = createContext<SharedAccessContextType | undefined>(
  undefined,
);

function mapSharedAccess(row: any): SharedAccess {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerEmail: row.owner_email ?? "",
    sharedWithEmail: row.shared_with_email,
    sharedWithId: row.shared_with_id ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

export function SharedAccessProvider({ children }: { children: ReactNode }) {
  const [allAccess, setAllAccess] = useState<SharedAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadAccess();
    else {
      setAllAccess([]);
      setLoading(false);
    }
  }, [user]);

  const loadAccess = async () => {
    try {
      setLoading(true);
      if (!user) {
        setAllAccess([]);
        return;
      }
      const { data, error } = await supabase
        .from("shared_access")
        .select("*")
        .or(`owner_id.eq.${user.id},shared_with_id.eq.${user.id}`);
      if (error) throw error;
      setAllAccess((data ?? []).map(mapSharedAccess));
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (email: string) => {
    if (!user) return;
    const { error } = await supabase.from("shared_access").insert({
      owner_id: user.id,
      shared_with_email: email,
      status: "pending",
    });
    if (error) throw error;
    await loadAccess();
  };

  const acceptInvitation = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("shared_access")
      .update({ status: "accepted", shared_with_id: user.id })
      .eq("id", id);
    if (error) throw error;
    await loadAccess();
  };

  const rejectInvitation = async (id: string) => {
    const { error } = await supabase
      .from("shared_access")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) throw error;
    await loadAccess();
  };

  const revokeAccess = async (id: string) => {
    const { error } = await supabase
      .from("shared_access")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await loadAccess();
  };

  const sentInvitations = allAccess.filter((a) => a.ownerId === user?.id);
  const receivedInvitations = allAccess.filter(
    (a) => a.sharedWithEmail === user?.email && a.status === "pending",
  );
  const activeShares = allAccess.filter((a) => a.status === "accepted");

  return (
    <SharedAccessContext.Provider
      value={{
        sentInvitations,
        receivedInvitations,
        activeShares,
        loading,
        sendInvitation,
        acceptInvitation,
        rejectInvitation,
        revokeAccess,
      }}
    >
      {children}
    </SharedAccessContext.Provider>
  );
}

export function useSharedAccess() {
  const ctx = useContext(SharedAccessContext);
  if (!ctx)
    throw new Error("useSharedAccess must be used within SharedAccessProvider");
  return ctx;
}
