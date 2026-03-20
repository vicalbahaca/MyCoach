"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_NAME = "mycoach_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`)
  );

  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsHydrated(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function handleDecision(value: "accepted" | "rejected") {
    writeCookie(COOKIE_NAME, value);
    setIsHydrated(false);
  }

  const isVisible = isHydrated && !readCookie(COOKIE_NAME);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 rounded-[2rem] border border-slate-200/70 bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_28px_70px_-34px_rgba(18,25,45,0.42)] backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="max-w-3xl">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.26em] text-[#0050cc]">
            Cookies
          </p>
          <p className="text-sm leading-7 text-[#424656] sm:text-[15px]">
            Utilizamos cookies para recordar tu decisión sobre privacidad y mejorar la
            estabilidad de la experiencia. Puedes aceptar o rechazar su uso no esencial.
            Más información en{" "}
            <Link className="font-semibold text-[#0050cc]" href="/cookies">
              política de cookies
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:min-w-[280px] sm:flex-row sm:justify-end">
          <button
            className="rounded-full border border-slate-300 bg-transparent px-6 py-3 text-sm font-bold text-[#1a1c1b] transition hover:border-[#1a1c1b]"
            onClick={() => handleDecision("rejected")}
            type="button"
          >
            Rechazar
          </button>
          <button
            className="rounded-full bg-[#1b1b1b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2a2a2a]"
            onClick={() => handleDecision("accepted")}
            type="button"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
