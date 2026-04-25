import { useEffect, useState } from "react";
import { platform } from "@tauri-apps/plugin-os";

type Padding = {
  top: string;
  bottom: string;
  left: string;
  right: string;
};

const IOS_SIDES = {
  bottom: "max(0.75rem, env(safe-area-inset-bottom), 16px)",
  left: "max(0.75rem, env(safe-area-inset-left), 16px)",
  right: "max(0.75rem, env(safe-area-inset-right), 16px)",
};

const ANDROID: Padding = {
  top: "35px",
  bottom: "16px",
  left: "16px",
  right: "16px",
};

function detectIsAndroid(): boolean {
  try {
    return platform() === "android";
  } catch {
    return (
      typeof navigator !== "undefined" && /android/i.test(navigator.userAgent)
    );
  }
}

export default function AppShell({
  children,
  className = "",
  iosTopExtra = "1.5rem",
}: {
  children: React.ReactNode;
  className?: string;
  iosTopExtra?: string;
}) {
  const [isAndroid, setIsAndroid] = useState<boolean>(detectIsAndroid);

  useEffect(() => {
    setIsAndroid(detectIsAndroid());
  }, []);

  const padding: Padding = isAndroid
    ? ANDROID
    : {
        ...IOS_SIDES,
        top: `calc(env(safe-area-inset-top, 40px) + ${iosTopExtra})`,
      };

  return (
    <main
      className={`h-dvh flex flex-col text-white ${className}`}
      style={{
        paddingTop: padding.top,
        paddingBottom: padding.bottom,
        paddingLeft: padding.left,
        paddingRight: padding.right,
      }}
    >
      {children}
    </main>
  );
}
