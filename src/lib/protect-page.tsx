"use client";

import { useEffect } from "react";

const requireAuth = () => {
  // eslint-disable-next-line no-undef
  const loggedIn = document.cookie.includes("logged-in=true");

  if (!loggedIn) {
    // eslint-disable-next-line no-undef
    window.location.href = "/";
  }
};

export const AuthPageInvisible = () => {
  useEffect(() => {
    requireAuth();
  }, []);

  return <></>;
};
