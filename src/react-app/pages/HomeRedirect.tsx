import { useEffect } from "react";

export default function HomeRedirect() {
  useEffect(() => {
    // força reload real e cai na home
    window.location.href = "/";
  }, []);

  return null;
}