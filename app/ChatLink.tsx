"use client";

import type { ComponentProps } from "react";

export const OPEN_CONCIERGE_CHAT = "mlt:open-concierge-chat";

export default function ChatLink({ children, ...props }: Omit<ComponentProps<"a">, "href" | "onClick">) {
  return <a {...props} href="#concierge-chat" role="button" onClick={event => {
    event.preventDefault();
    window.dispatchEvent(new Event(OPEN_CONCIERGE_CHAT));
  }}>{children}</a>;
}
