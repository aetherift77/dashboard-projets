"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderKanban,
  Boxes,
  LayoutDashboard,
  ListChecks,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Pas de barre latérale sur la page de connexion.
  if (pathname === "/login") return null;

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-5 flex flex-col gap-5">
      <h1 className="text-2xl font-bold">⚡ Aether Dashboard</h1>

      <nav className="flex flex-col gap-2 mt-5 flex-1">
        <Link
          href="/"
          className="flex items-center gap-2 p-3 rounded-xl hover:bg-zinc-800"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link
          href="/kanban"
          className="flex items-center gap-2 p-3 rounded-xl hover:bg-zinc-800"
        >
          <FolderKanban size={18} />
          Kanban
        </Link>

        <Link
          href="/etapes"
          className="flex items-center gap-2 p-3 rounded-xl hover:bg-zinc-800"
        >
          <ListChecks size={18} />
          Étapes
        </Link>

        <Link
          href="/inventaire"
          className="flex items-center gap-2 p-3 rounded-xl hover:bg-zinc-800"
        >
          <Boxes size={18} />
          Inventaire
        </Link>
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-2 p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-left transition-colors"
      >
        <LogOut size={18} />
        Déconnexion
      </button>
    </aside>
  );
}
