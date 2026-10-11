import { useEffect, useRef, useState } from "react";
import { api } from "../../api";
import { useT } from "../../lib/fx";
import { shopStore } from "../../lib/shop";
import type { AppsConfig, Ticket } from "../../types";

interface Msg { from: "me" | "them"; text: string; at: number }

/** Live Chat app: storefront chat bubble. Customer messages become support
 *  tickets; merchant replies from the Support admin page appear in the chat. */
export function LiveChatBubble({ apps }: { apps: AppsConfig }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cfg = apps.liveChat;
  const key = "bx-chat-" + shopStore();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      if (saved?.ticketId) {
        setTicketId(saved.ticketId); setStarted(true);
        setMsgs([{ from: "them", text: cfg.welcome, at: Date.now() }]);
      }
    } catch {}
  }, [key, cfg.welcome]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  // Poll for merchant replies.
  useEffect(() => {
    if (!ticketId || !open) return;
    let stop = false;
    const poll = async () => {
      try {
        const list: Ticket[] = await api.support.list(shopStore());
        const tk = list.find((x) => x.id === ticketId);
        if (tk && !stop) {
          const replies: Msg[] = tk.replies.map((r: any) => ({
            from: "them", text: typeof r === "string" ? r : r.text, at: r.at ?? Date.now(),
          }));
          setMsgs((m) => {
            const mine = m.filter((x) => x.from === "me");
            const base: Msg[] = [{ from: "them", text: cfg.welcome, at: Date.now() }];
            return [...base, ...mine, ...replies.filter((r) => !mine.some((x) => x.text === r.text))];
          });
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => { stop = true; clearInterval(id); };
  }, [ticketId, open, cfg.welcome]);

  if (!cfg.on) return null;

  const begin = async () => {
    if (!name.trim() || !input.trim()) return;
    try {
      const tk = await api.support.create(shopStore(), `Live chat — ${name.trim()}`, input.trim());
      setTicketId(tk.id); setStarted(true);
      try { localStorage.setItem(key, JSON.stringify({ ticketId: tk.id })); } catch {}
      setMsgs([
        { from: "them", text: cfg.welcome, at: Date.now() },
        { from: "me", text: input.trim(), at: Date.now() },
      ]);
      setInput("");
    } catch {}
  };
  const send = async () => {
    if (!input.trim() || !ticketId) return;
    const text = input.trim();
    setMsgs((m) => [...m, { from: "me", text, at: Date.now() }]);
    setInput("");
    try { await api.support.reply(shopStore(), ticketId, text); } catch {}
  };

  return (
    <>
      {!open && (
        <button className="app-chat-fab" onClick={() => setOpen(true)} aria-label={t("Chat with us")}>💬</button>
      )}
      {open && (
        <div className="app-chat" role="dialog" aria-label={t("Live chat")}>
          <div className="app-chat-head">
            <b>💬 {t("Live chat")}</b>
            <button onClick={() => setOpen(false)} aria-label={t("Close")}>✕</button>
          </div>
          <div className="app-chat-body">
            {!started ? (
              <div className="app-chat-start">
                <p className="mu-t">{cfg.welcome}</p>
                <input placeholder={t("Your name")} aria-label={t("Your name")} value={name} onChange={(e) => setName(e.target.value)} />
                <input placeholder={t("Type your message…")} aria-label={t("Message")} value={input}
                  onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && begin()} />
                <button className="btn" disabled={!name.trim() || !input.trim()} onClick={begin}>{t("Start chat")}</button>
              </div>
            ) : (
              <>
                {msgs.map((m, i) => (
                  <div key={i} className={"app-chat-msg " + m.from}><span>{m.text}</span></div>
                ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>
          {started && (
            <div className="app-chat-input">
              <input placeholder={t("Type a message…")} aria-label={t("Message")} value={input}
                onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
              <button className="btn s" onClick={send}>{t("Send")}</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
