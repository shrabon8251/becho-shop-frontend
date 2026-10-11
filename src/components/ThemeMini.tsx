import { themeStyle, type ThemeDef } from "../lib/theme";

/** Compact static storefront thumbnail for theme pickers. */
export function ThemeMini({ def }: { def: ThemeDef }) {
  return (
    <div className="ob-tmini" style={themeStyle(def.theme)} aria-hidden>
      <div className="ob-tmini-nav"><i /><b>{def.name}</b></div>
      <div className="ob-tmini-hero" />
      <div className="ob-tmini-grid">{[0, 1, 2, 3].map((i) => <span key={i} />)}</div>
    </div>
  );
}
