export type Locale = "sv" | "en";

export type UiText = {
  appTitle: string;
  appSubtitle: string;
  uploadLabel: string;
  thresholdLabel: string;
  thresholdHint: string;
  scaleLabel: string;
  scaleHint: string;
  estimateButton: string;
  resetButton: string;
  resultTitle: string;
  pixelAreaLabel: string;
  calibratedAreaLabel: string;
  calculationTitle: string;
  perimeterPlaceholderLabel: string;
  placeholderValue: string;
  noImageText: string;
  languageLabel: string;
  swedishLabel: string;
  englishLabel: string;
  previewAlt: string;
};

export const messages: Record<Locale, UiText> = {
  sv: {
    appTitle: "Stirling Whiteboard Area",
    appSubtitle: "Ladda upp en bild av tavlan, uppskatta ytan och bygg vidare med egna berakningar.",
    uploadLabel: "Valk bild",
    thresholdLabel: "Traskel for figurdetektion",
    thresholdHint: "Lagre varde ignorerar fler ljusa pixlar. Standard fungerar ofta pa vita tavlor.",
    scaleLabel: "Kalibrering (cm per pixel)",
    scaleHint: "Ange skala om du vill fa area i cm2.",
    estimateButton: "Berakna area",
    resetButton: "Nollstall",
    resultTitle: "Resultat",
    pixelAreaLabel: "Area (pixlar)",
    calibratedAreaLabel: "Area (cm2)",
    calculationTitle: "Fortsatta berakningar",
    perimeterPlaceholderLabel: "Exempel: omkrets (placeholder)",
    placeholderValue: "Kommer i nasta steg",
    noImageText: "Ingen bild laddad an.",
    languageLabel: "Sprak",
    swedishLabel: "Svenska",
    englishLabel: "Engelska",
    previewAlt: "Forhandsvisning av uppladdad bild"
  },
  en: {
    appTitle: "Stirling Whiteboard Area",
    appSubtitle: "Upload a whiteboard image, estimate figure area, and build additional calculations.",
    uploadLabel: "Choose image",
    thresholdLabel: "Figure detection threshold",
    thresholdHint: "Lower values ignore more bright pixels. Default usually works for whiteboards.",
    scaleLabel: "Calibration (cm per pixel)",
    scaleHint: "Provide a scale if you want area in cm2.",
    estimateButton: "Estimate area",
    resetButton: "Reset",
    resultTitle: "Results",
    pixelAreaLabel: "Area (pixels)",
    calibratedAreaLabel: "Area (cm2)",
    calculationTitle: "Further calculations",
    perimeterPlaceholderLabel: "Example: perimeter (placeholder)",
    placeholderValue: "Coming in next step",
    noImageText: "No image uploaded yet.",
    languageLabel: "Language",
    swedishLabel: "Swedish",
    englishLabel: "English",
    previewAlt: "Preview of uploaded image"
  }
};
