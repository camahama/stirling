export type Locale = "sv" | "en";

export type UiText = {
  appTitle: string;
  appSubtitle: string;
  languageLabel: string;
  step1Title: string;
  step2Title: string;
  step3Title: string;
  step4Title: string;
  uploadLabel: string;
  startCornersButton: string;
  restartCornersButton: string;
  rectifyButton: string;
  updateScaleButton: string;
  noImageText: string;
  previewAlt: string;
  startContourButton: string;
  restartContourButton: string;
  pixelAreaLabel: string;
  calibratedAreaLabel: string;
  uploadHelp: string;
  rectifyHelp: string;
  calibrationHelp: string;
  contourHelp: string;
  pixelAreaHelp: string;
  calibratedAreaHelp: string;
  copyrightText: string;
};

export const messages: Record<Locale, UiText> = {
  sv: {
    appTitle: "Stirling Whiteboard Area",
    appSubtitle: "Stegvis arbetsflode for bilduppladdning, normalisering, kalibrering och mätning",
    languageLabel: "Sprak",
    step1Title: "1. Ladda upp en bild av din whiteboard",
    step2Title: "2. Räta upp bilden",
    step3Title: "3. Kalibrera skalan",
    step4Title: "4. Rita kontur",
    uploadLabel: "Välj bild",
    startCornersButton: "Välj hörn",
    restartCornersButton: "Börja om",
    rectifyButton: "Räta upp bilden",
    updateScaleButton: "Uppdatera skala",
    noImageText: "Ingen bild laddad ännu.",
    previewAlt: "Förhandsvisning av uppladdad bild",
    startContourButton: "Rita kontur",
    restartContourButton: "Nollställ kontur",
    pixelAreaLabel: "Area i pixlar",
    calibratedAreaLabel: "Beräknad area",
    uploadHelp: "Ladda upp ett foto av tavlan eller diagrammet som ska analyseras. Bilden bör visa hela rutnätet och hela den ritade kurvan så tydligt som möjligt.",
    rectifyHelp: "Markera fyra hörn i bilden som motsvarar en rektangel. Om ett hörn hamnar lite fel kan du dra punkten till rätt plats innan du klickar på knappen för att räta upp bilden.",
    calibrationHelp: "Fyll i de kända värdena för volym och tryck. Observera att Vmin är okänd - skillnaden är det viktiga. Markera sedan de två punkterna i bilden som motsvarar hörnen (Vmin, pmax) och (Vmax, pmin), så att appen kan omvandla pixlar till fysiska enheter.",
    contourHelp: "Klicka stegvis längs den slutna figurens ytterkontur. När du klickar på startpunkten igen stängs kurvan, och därefter kan du dra i befintliga punkter eller klicka på en kant för att lägga till en ny punkt.",
    pixelAreaHelp: "Detta är arean inuti den ritade konturen, uttryckt direkt i bildpixlar. Mest användbart som en geometrisk kontroll innan kalibreringen är klar.",
    calibratedAreaHelp: "Detta är samma inritade area omräknad med hjälp av pV-kalibreringen. Resultatet visas som energi i mJ och är det värde som ska användas vidare i analysen.",
    copyrightText: "Fysiska institutionen, Lunds universitet, 2026 – martin.magnusson@fysik.lu.se",
  },
  en: {
    appTitle: "Stirling Whiteboard Area",
    appSubtitle: "Step-by-step workflow for upload, normalization, and calibration.",
    languageLabel: "Language",
    step1Title: "1. Upload image",
    step2Title: "2. Rectify image",
    step3Title: "3. Calibrate scale",
    step4Title: "4. Draw contour",
    uploadLabel: "Choose image",
    startCornersButton: "Start corner selection",
    restartCornersButton: "Start over",
    rectifyButton: "Rectify image",
    updateScaleButton: "Update scale",
    noImageText: "No image uploaded yet.",
    previewAlt: "Preview of uploaded image",
    startContourButton: "Start contour",
    restartContourButton: "Restart contour",
    pixelAreaLabel: "Pixel area",
    calibratedAreaLabel: "Estimated area",
    uploadHelp: "Upload a photo of the whiteboard or diagram you want to analyze. The image should show the full grid and the full drawn loop as clearly as possible.",
    rectifyHelp: "Start by marking the four corners of the grid in the image. If a corner is slightly off, you can drag it into place before you press the button to rectify the image.",
    calibrationHelp: "Enter the known values for V_min, V_max, p_max, and p_min. Then mark the two image points corresponding to the corners (Vmin, pmax) and (Vmax, pmin) so the app can convert pixels into physical units.",
    contourHelp: "Click step by step along the outer contour of the closed figure. When you click the starting point again the curve closes, and only after that can you drag existing points or click on an edge to insert a new one.",
    pixelAreaHelp: "This is the area enclosed by the drawn contour measured directly in image pixels. It is mainly useful as a geometric check before the physical calibration is complete.",
    calibratedAreaHelp: "This is the same enclosed area converted using the PV calibration. The result is shown as energy in millijoules and is the value intended for further analysis.",
    copyrightText: "Department of Physics, Lund University, 2026 – martin.magnusson@fysik.lu.se",
  }
};
