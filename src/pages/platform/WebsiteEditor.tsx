import { useState } from "react";
import { api } from "../../api";
import { Card } from "../../components/ui";
import { SaveBar, toast, Loading } from "../../components/polaris";
import { useLoad } from "../../lib/useLoad";
import { useT } from "../../lib/fx";
import { defaultLanding } from "../../lib/landing";
import { THEMES } from "../../lib/theme";
import type { LandingContent } from "../../types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className="mu-t">{label}</span>{children}</label>;
}
function ListEditor<T>({ items, render, onChange, addLabel, blank }: {
  items: T[]; render: (x: T, i: number, set: (patch: Partial<T>) => void) => React.ReactNode;
  onChange: (next: T[]) => void; addLabel: string; blank: () => T;
}) {
  const t = useT();
  return (
    <div>
      {items.map((x, i) => (
        <Card key={i}>
          <div className="between" style={{ marginBottom: 8 }}>
            <b>#{i + 1}</b>
            <div className="row">
              {i > 0 && <button className="btn s" onClick={() => onChange(items.map((y, j) => j === i ? items[i - 1] : j === i - 1 ? items[i] : y))}>↑</button>}
              {i < items.length - 1 && <button className="btn s" onClick={() => onChange(items.map((y, j) => j === i ? items[i + 1] : j === i + 1 ? items[i] : y))}>↓</button>}
              <button className="btn s danger" onClick={() => onChange(items.filter((_, j) => j !== i))}>{t("Remove")}</button>
            </div>
          </div>
          {render(x, i, (patch) => onChange(items.map((y, j) => j === i ? { ...y, ...patch } : y)))}
        </Card>
      ))}
      <button className="btn s" onClick={() => onChange([...items, blank()])}>+ {addLabel}</button>
    </div>
  );
}

export default function WebsiteEditor() {
  const t = useT();
  const { data } = useLoad(() => api.platform.landing.get().catch(() => defaultLanding()), []);
  const [c, setC] = useState<LandingContent | null>(null);
  const [base, setBase] = useState<LandingContent | null>(null);
  const [sec, setSec] = useState("hero");
  if (!data) return <Loading />;
  const cur = c ?? data;
  if (!c) { setC(data); setBase(data); }
  const dirty = base && JSON.stringify(cur) !== JSON.stringify(base);
  const set = (patch: Partial<LandingContent>) => setC({ ...cur, ...patch });
  const save = async () => { try { const saved = await api.platform.landing.save(cur); setC(saved); setBase(saved); toast(t("Website saved")); } catch (e) { toast((e as Error).message, true); } };
  const secs: [string, string][] = [
    ["hero", t("Hero")], ["announcement", t("Announcement bar")], ["features", t("Features")],
    ["pricing", t("Pricing")], ["themes", t("Themes")], ["testimonials", t("Testimonials")],
    ["faq", t("FAQ")], ["cta", t("Bottom CTA")],
  ];
  return (
    <div>
      <div className="seg" style={{ marginBottom: 12, flexWrap: "wrap" }}>
        {secs.map(([id, label]) => <button key={id} className={"btn s" + (sec === id ? " on" : "")} onClick={() => setSec(id)}>{label}</button>)}
      </div>
      {sec === "hero" && <Card>
        <Row label={t("Title")}><input value={cur.hero.title} onChange={(e) => set({ hero: { ...cur.hero, title: e.target.value } })} /></Row>
        <Row label={t("Title accent (gradient line)")}><input value={cur.hero.titleAccent} onChange={(e) => set({ hero: { ...cur.hero, titleAccent: e.target.value } })} /></Row>
        <Row label={t("Subtitle")}><textarea rows={3} value={cur.hero.subtitle} onChange={(e) => set({ hero: { ...cur.hero, subtitle: e.target.value } })} /></Row>
        <Row label={t("Button text")}><input value={cur.hero.cta} onChange={(e) => set({ hero: { ...cur.hero, cta: e.target.value } })} /></Row>
        <Row label={t("Note under button")}><input value={cur.hero.note} onChange={(e) => set({ hero: { ...cur.hero, note: e.target.value } })} /></Row>
      </Card>}
      {sec === "announcement" && <Card>
        <label className="check"><input type="checkbox" checked={cur.announcement.on} onChange={(e) => set({ announcement: { ...cur.announcement, on: e.target.checked } })} />{t("Show announcement bar")}</label>
        <Row label={t("Text")}><input value={cur.announcement.text} onChange={(e) => set({ announcement: { ...cur.announcement, text: e.target.value } })} /></Row>
      </Card>}
      {sec === "features" && <ListEditor items={cur.features} addLabel={t("Add feature")} blank={() => ({ icon: "✨", title: "", desc: "" })}
        onChange={(features) => set({ features })}
        render={(f, _i, patch) => (<>
          <div className="grid2">
            <Row label={t("Icon (emoji)")}><input value={f.icon} onChange={(e) => patch({ icon: e.target.value })} /></Row>
            <Row label={t("Title")}><input value={f.title} onChange={(e) => patch({ title: e.target.value })} /></Row>
          </div>
          <Row label={t("Description")}><textarea rows={2} value={f.desc} onChange={(e) => patch({ desc: e.target.value })} /></Row>
        </>)} />}
      {sec === "pricing" && <Card>
        <div className="grid2">
          <Row label={t("Starter (৳)")}><input type="number" value={cur.pricing.starter} onChange={(e) => set({ pricing: { ...cur.pricing, starter: +e.target.value || 0 } })} /></Row>
          <Row label={t("Growth (৳)")}><input type="number" value={cur.pricing.growth} onChange={(e) => set({ pricing: { ...cur.pricing, growth: +e.target.value || 0 } })} /></Row>
          <Row label={t("Pro (৳)")}><input type="number" value={cur.pricing.pro} onChange={(e) => set({ pricing: { ...cur.pricing, pro: +e.target.value || 0 } })} /></Row>
        </div>
        <Row label={t("Fee note")}><input value={cur.pricing.note} onChange={(e) => set({ pricing: { ...cur.pricing, note: e.target.value } })} /></Row>
        <p className="mu-t">⚠️ {t("This changes the public landing page prices. Plan billing changes go through Settings → Plans.")}</p>
      </Card>}
      {sec === "themes" && <Card>
        <Row label={t("Featured theme")}><select value={cur.themes.featured} onChange={(e) => set({ themes: { ...cur.themes, featured: e.target.value } })}>
          <option value="">{t("None")}</option>
          {THEMES.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}
        </select></Row>
        <p className="mu-t">{t("Visible themes on the landing page (unchecked = hidden):")}</p>
        <div className="grid2">
          {THEMES.map((th) => {
            const vis = cur.themes.visible.length ? cur.themes.visible : THEMES.map((x) => x.id);
            return (
              <label key={th.id} className="check">
                <input type="checkbox" checked={vis.includes(th.id)}
                  onChange={(e) => set({ themes: { ...cur.themes, visible: e.target.checked ? [...vis, th.id] : vis.filter((v) => v !== th.id) } })} />
                {th.name}
              </label>
            );
          })}
        </div>
      </Card>}
      {sec === "testimonials" && <ListEditor items={cur.testimonials} addLabel={t("Add testimonial")} blank={() => ({ name: "", role: "", text: "", rating: 5 })}
        onChange={(testimonials) => set({ testimonials })}
        render={(x, _i, patch) => (<>
          <Row label={t("Quote")}><textarea rows={3} value={x.text} onChange={(e) => patch({ text: e.target.value })} /></Row>
          <div className="grid2">
            <Row label={t("Name")}><input value={x.name} onChange={(e) => patch({ name: e.target.value })} /></Row>
            <Row label={t("Role")}><input value={x.role} onChange={(e) => patch({ role: e.target.value })} /></Row>
            <Row label={t("Rating (1-5)")}><input type="number" min={1} max={5} value={x.rating} onChange={(e) => patch({ rating: Math.min(5, Math.max(1, +e.target.value || 5)) })} /></Row>
          </div>
        </>)} />}
      {sec === "faq" && <ListEditor items={cur.faq} addLabel={t("Add FAQ")} blank={() => ({ q: "", a: "" })}
        onChange={(faq) => set({ faq })}
        render={(x, _i, patch) => (<>
          <Row label={t("Question")}><input value={x.q} onChange={(e) => patch({ q: e.target.value })} /></Row>
          <Row label={t("Answer")}><textarea rows={3} value={x.a} onChange={(e) => patch({ a: e.target.value })} /></Row>
        </>)} />}
      {sec === "cta" && <Card>
        <Row label={t("Title")}><input value={cur.cta.title} onChange={(e) => set({ cta: { ...cur.cta, title: e.target.value } })} /></Row>
        <Row label={t("Subtitle")}><textarea rows={2} value={cur.cta.subtitle} onChange={(e) => set({ cta: { ...cur.cta, subtitle: e.target.value } })} /></Row>
        <Row label={t("Button text")}><input value={cur.cta.button} onChange={(e) => set({ cta: { ...cur.cta, button: e.target.value } })} /></Row>
      </Card>}
      <SaveBar dirty={!!dirty} onSave={() => void save()} onDiscard={() => setC(base)} />
    </div>
  );
}
