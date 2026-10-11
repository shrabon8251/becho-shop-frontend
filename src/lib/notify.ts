import type { Settings } from "../types";

export interface NotifEvent {
  id: string;
  label: string;
  /** who receives it: the shopper, the merchant, or both */
  audience: "customer" | "merchant";
  email: boolean; // default on
  sms: boolean;   // default on
  subject: string;
  emailBody: string;
  smsBody: string;
}

// Template variables: {{name}} {{order_id}} {{tracking_link}} {{store}} {{amount}}
export const NOTIF_VARS = ["{{name}}", "{{order_id}}", "{{tracking_link}}", "{{store}}", "{{amount}}"];

export const NOTIF_EVENTS: NotifEvent[] = [
  {
    id: "order_placed", label: "Order placed", audience: "customer", email: true, sms: true,
    subject: "Order {{order_id}} confirmed — {{store}}",
    emailBody: "Hi {{name}},\n\nThanks for your order {{order_id}} ({{amount}}) at {{store}}.\nWe'll notify you when it ships.",
    smsBody: "{{store}}: Order {{order_id}} received ({{amount}}). Thank you!",
  },
  {
    id: "order_shipped", label: "Order shipped", audience: "customer", email: true, sms: true,
    subject: "Your order {{order_id}} is on its way",
    emailBody: "Hi {{name}},\n\nYour order {{order_id}} has shipped!\nTrack it here: {{tracking_link}}",
    smsBody: "{{store}}: Order {{order_id}} shipped. Track: {{tracking_link}}",
  },
  {
    id: "order_delivered", label: "Order delivered", audience: "customer", email: false, sms: true,
    subject: "Order {{order_id}} delivered",
    emailBody: "Hi {{name}},\n\nYour order {{order_id}} has been delivered. Enjoy!",
    smsBody: "{{store}}: Order {{order_id}} delivered. Thanks for shopping!",
  },
  {
    id: "order_cancelled", label: "Order cancelled", audience: "customer", email: true, sms: false,
    subject: "Order {{order_id}} cancelled",
    emailBody: "Hi {{name}},\n\nYour order {{order_id}} has been cancelled. Any payment will be refunded shortly.",
    smsBody: "{{store}}: Order {{order_id}} cancelled.",
  },
  {
    id: "abandoned_checkout", label: "Abandoned checkout", audience: "customer", email: true, sms: false,
    subject: "You left something in your cart",
    emailBody: "Hi {{name}},\n\nYour cart at {{store}} is waiting — complete your order before it sells out!",
    smsBody: "{{store}}: Your cart is waiting! Complete your order now.",
  },
  {
    id: "low_stock", label: "Low stock alert", audience: "merchant", email: true, sms: false,
    subject: "Low stock warning — {{store}}",
    emailBody: "A product is running low on stock. Check your inventory.",
    smsBody: "{{store}}: Low stock alert.",
  },
  {
    id: "new_order", label: "New order alert", audience: "merchant", email: true, sms: true,
    subject: "New order {{order_id}} — {{store}}",
    emailBody: "New order {{order_id}} ({{amount}}) from {{name}}.",
    smsBody: "{{store}}: New order {{order_id}} ({{amount}}).",
  },
];

export interface SmsSettings { provider?: string; apiKey?: string; senderId?: string }
export const SMS_PROVIDERS = [
  { id: "bulksmsbd", name: "BulkSMSBD" },
  { id: "sslwireless", name: "SSL Wireless" },
  { id: "d7", name: "D7 Networks" },
];

export interface EventChannel { email: boolean; sms: boolean }
export interface EventTemplate { subject: string; emailBody: string; smsBody: string }

export function eventChannels(n: Settings["notifications"], id: string): EventChannel {
  const def = NOTIF_EVENTS.find((e) => e.id === id)!;
  return n?.events?.[id] ?? { email: def.email, sms: def.sms };
}

export function eventTemplate(n: Settings["notifications"], id: string): EventTemplate {
  const def = NOTIF_EVENTS.find((e) => e.id === id)!;
  return n?.templates?.[id] ?? { subject: def.subject, emailBody: def.emailBody, smsBody: def.smsBody };
}

/** Replace {{variables}} in a template. Unknown variables are left as-is. */
export function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

export interface SentNote { channel: "email" | "sms"; to: string; body: string }

/**
 * Mock notification dispatch. Production: the backend reads the same
 * settings, renders the same templates and sends via the merchant's own
 * Brevo API key / SMS gateway credentials. Returns what *would* be sent so the UI
 * can preview / toast it in demo mode.
 */
export function dispatchNotifications(
  settings: Settings, eventId: string,
  vars: Record<string, string>, to: { email?: string; phone?: string },
): SentNote[] {
  const ch = eventChannels(settings.notifications, eventId);
  const tpl = eventTemplate(settings.notifications, eventId);
  const out: SentNote[] = [];
  if (ch.email && to.email) {
    out.push({ channel: "email", to: to.email, body: renderTemplate(tpl.emailBody, vars) });
  }
  if (ch.sms && to.phone && (settings.notifications?.sms?.apiKey ?? "").trim()) {
    out.push({ channel: "sms", to: to.phone, body: renderTemplate(tpl.smsBody, vars) });
  }
  return out;
}
