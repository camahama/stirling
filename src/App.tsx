import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { messages, type Locale } from "./i18n/messages";
import { estimateAreaFromImage } from "./utils/imageArea";

type AreaState = {
  pixelArea: number;
  calibratedArea: number | null;
};

export function App() {
  const [locale, setLocale] = useState<Locale>("sv");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(200);
  const [cmPerPixel, setCmPerPixel] = useState<string>("");
  const [area, setArea] = useState<AreaState | null>(null);

  const t = useMemo(() => messages[locale], [locale]);

  const onImageSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setImageUrl(nextUrl);
    setArea(null);
  };

  const onEstimate = () => {
    if (!imageUrl) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      const numericScale = cmPerPixel.trim() === "" ? null : Number(cmPerPixel);
      const result = estimateAreaFromImage(img, threshold, numericScale);
      setArea(result);
    };
    img.src = imageUrl;
  };

  const onReset = () => {
    setImageUrl(null);
    setArea(null);
    setCmPerPixel("");
    setThreshold(200);
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <h1>{t.appTitle}</h1>
        <p>{t.appSubtitle}</p>
      </header>

      <section className="panel controls">
        <div className="field-row">
          <label htmlFor="locale">{t.languageLabel}</label>
          <select
            id="locale"
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
          >
            <option value="sv">{t.swedishLabel}</option>
            <option value="en">{t.englishLabel}</option>
          </select>
        </div>

        <div className="field-row">
          <label htmlFor="image">{t.uploadLabel}</label>
          <input id="image" type="file" accept="image/*" onChange={onImageSelected} />
        </div>

        <div className="field-row">
          <label htmlFor="threshold">{t.thresholdLabel}: {threshold}</label>
          <input
            id="threshold"
            type="range"
            min={50}
            max={250}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
          />
          <small>{t.thresholdHint}</small>
        </div>

        <div className="field-row">
          <label htmlFor="scale">{t.scaleLabel}</label>
          <input
            id="scale"
            type="number"
            min={0}
            step="0.001"
            value={cmPerPixel}
            onChange={(event) => setCmPerPixel(event.target.value)}
          />
          <small>{t.scaleHint}</small>
        </div>

        <div className="button-row">
          <button type="button" onClick={onEstimate} disabled={!imageUrl}>
            {t.estimateButton}
          </button>
          <button type="button" onClick={onReset}>
            {t.resetButton}
          </button>
        </div>
      </section>

      <section className="panel preview">
        {imageUrl ? <img src={imageUrl} alt={t.previewAlt} /> : <p>{t.noImageText}</p>}
      </section>

      <section className="panel results">
        <h2>{t.resultTitle}</h2>
        <p>
          <strong>{t.pixelAreaLabel}:</strong> {area ? area.pixelArea : "-"}
        </p>
        <p>
          <strong>{t.calibratedAreaLabel}:</strong>{" "}
          {area?.calibratedArea !== null && area?.calibratedArea !== undefined
            ? area.calibratedArea.toFixed(2)
            : "-"}
        </p>
      </section>

      <section className="panel calculations">
        <h2>{t.calculationTitle}</h2>
        <p>
          <strong>{t.perimeterPlaceholderLabel}:</strong> {t.placeholderValue}
        </p>
      </section>
    </main>
  );
}
