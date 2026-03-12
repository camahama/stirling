import { useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { messages, type Locale } from "./i18n/messages";
import { normalizeWhiteboardImage, type Point as OutlinePoint } from "./utils/normalizeImage";

type Point = {
  x: number;
  y: number;
};

type ClickTarget = "max" | "min" | null | "corner";
type CornerPoint = { x: number; y: number };

const CLOSE_RADIUS = 18;
const SEGMENT_HIT_DISTANCE = 14;

export function App() {
  const fileInputId = useId();
  const [locale, setLocale] = useState<Locale>("sv");
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [normalizedImageUrl, setNormalizedImageUrl] = useState<string | null>(null);

  const [vMax, setVMax] = useState<string>("1");
  const [vMin, setVMin] = useState<string>("0");
  const [pMax, setPMax] = useState<string>("");
  const [pMin, setPMin] = useState<string>("");
  const [maxPoint, setMaxPoint] = useState<Point | null>(null);
  const [minPoint, setMinPoint] = useState<Point | null>(null);
  const [clickTarget, setClickTarget] = useState<ClickTarget>(null);

  const [cornerPoints, setCornerPoints] = useState<CornerPoint[]>([]);
  const [cornerStepActive, setCornerStepActive] = useState(false);
  const [draggingCornerIndex, setDraggingCornerIndex] = useState<number | null>(null);

  const [contourPoints, setContourPoints] = useState<OutlinePoint[]>([]);
  const [contourStepActive, setContourStepActive] = useState(false);
  const [contourClosed, setContourClosed] = useState(false);
  const [draggingContourIndex, setDraggingContourIndex] = useState<number | null>(null);

  const previewImageRef = useRef<HTMLImageElement | null>(null);

  const t = useMemo(() => messages[locale], [locale]);
  const previewImageUrl = normalizedImageUrl ?? sourceImageUrl;
  const outlinePoints = contourClosed ? contourPoints : [];
  const orderedCornerPoints = cornerPoints.length === 4 ? orderCornersForQuad(cornerPoints) : cornerPoints;

  const onImageSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setSourceImageUrl(nextUrl);
    setNormalizedImageUrl(null);
    resetContour();
    resetCalibration();
    setCornerPoints([]);
    setCornerStepActive(false);
    event.target.value = "";
  };

  const onNormalizeImage = () => {
    if (!sourceImageUrl || cornerPoints.length !== 4) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      const normalized = normalizeWhiteboardImage(img, orderedCornerPoints);
      setNormalizedImageUrl(normalized.normalizedDataUrl);
      resetContour();
      resetCalibration();
    };
    img.src = sourceImageUrl;
  };

  const startCornerSelection = () => {
    setCornerPoints([]);
    setCornerStepActive(true);
  };

  const startContourSelection = () => {
    setContourPoints([]);
    setContourClosed(false);
    setContourStepActive(true);
    setDraggingContourIndex(null);
  };

  const selectCalibrationPoint = (target: Exclude<ClickTarget, null | "corner">) => {
    if (target === "max") {
      setMaxPoint(null);
    } else {
      setMinPoint(null);
    }
    setClickTarget(target);
  };

  const onPreviewClick = (event: MouseEvent<HTMLImageElement>) => {
    const point = getImagePoint(event, event.currentTarget);

    if (cornerStepActive) {
      if (cornerPoints.length < 4) {
        setCornerPoints([...cornerPoints, point]);
      }
      return;
    }

    if (contourStepActive) {
      handleContourClick(point);
      return;
    }

    if (!clickTarget) {
      return;
    }

    if (clickTarget === "max") {
      setMaxPoint(point);
      setClickTarget("min");
      return;
    }

    setMinPoint(point);
    setClickTarget(null);
  };

  const handleContourClick = (point: OutlinePoint) => {
    if (contourClosed) {
      const insertIndex = findSegmentInsertIndex(contourPoints, point);
      if (insertIndex >= 0) {
        const next = [...contourPoints];
        next.splice(insertIndex + 1, 0, point);
        setContourPoints(next);
      }
      return;
    }

    if (contourPoints.length >= 3 && isNearPoint(point, contourPoints[0], CLOSE_RADIUS)) {
      setContourClosed(true);
      setContourStepActive(false);
      return;
    }

    setContourPoints([...contourPoints, point]);
  };

  const onContourPointMouseDown = (event: MouseEvent<HTMLDivElement>, index: number) => {
    event.stopPropagation();
    setDraggingContourIndex(index);
  };

  const onCornerPointMouseDown = (event: MouseEvent<HTMLDivElement>, index: number) => {
    event.stopPropagation();
    setDraggingCornerIndex(index);
  };

  const onContourSegmentClick = (event: MouseEvent<SVGLineElement>, index: number) => {
    event.stopPropagation();
    if (!previewImageRef.current) {
      return;
    }

    const point = getImagePoint(event, previewImageRef.current);
    const next = [...contourPoints];
    next.splice(index + 1, 0, point);
    setContourPoints(next);
  };

  const updateDraggingContourPoint = (event: MouseEvent<HTMLDivElement>) => {
    if (draggingContourIndex === null || !previewImageRef.current) {
      return;
    }

    const point = getImagePoint(event, previewImageRef.current);
    const next = [...contourPoints];
    next[draggingContourIndex] = point;
    setContourPoints(next);
  };

  const updateDraggingCornerPoint = (event: MouseEvent<HTMLDivElement>) => {
    if (draggingCornerIndex === null || !previewImageRef.current) {
      return;
    }

    const point = getImagePoint(event, previewImageRef.current);
    const next = [...cornerPoints];
    next[draggingCornerIndex] = point;
    setCornerPoints(next);
  };

  const resetCalibration = () => {
    setVMax("1");
    setVMin("0");
    setPMax("");
    setPMin("");
    setMaxPoint(null);
    setMinPoint(null);
    setClickTarget(null);
    setCornerPoints([]);
    setCornerStepActive(false);
    setDraggingCornerIndex(null);
  };

  const resetContour = () => {
    setContourPoints([]);
    setContourClosed(false);
    setContourStepActive(false);
    setDraggingContourIndex(null);
  };

  const pixelArea = contourClosed ? polygonArea(contourPoints) : 0;
  const calibratedArea = contourClosed
    ? getCalibratedAreaMilliJoules(contourPoints, {
        vMin,
        vMax,
        pMin,
        pMax,
        topLeft: maxPoint,
        bottomRight: minPoint
      })
    : null;
  const formattedCalibratedArea =
    calibratedArea !== null ? formatLocaleNumber(calibratedArea, locale, 3) : "--";
  const showCalibrationAxes = maxPoint && minPoint && !clickTarget;
  const imageWidth = previewImageRef.current?.naturalWidth || 1;
  const imageHeight = previewImageRef.current?.naturalHeight || 1;
  const calibrationOverlay = showCalibrationAxes
    ? buildCalibrationOverlay({
        width: imageWidth,
        height: imageHeight,
        topLeft: maxPoint,
        bottomRight: minPoint,
        vMin,
        vMax,
        pMin,
        pMax
      })
    : null;

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-topbar">
          <div>
            <h1>{t.appTitle}</h1>
            <p>{t.appSubtitle}</p>
          </div>
          <div className="language-toggle" role="group" aria-label={t.languageLabel}>
            <button
              type="button"
              className={`language-toggle-button ${locale === "sv" ? "active" : ""}`}
              onClick={() => setLocale("sv")}
              aria-pressed={locale === "sv"}
            >
              SV
            </button>
            <button
              type="button"
              className={`language-toggle-button ${locale === "en" ? "active" : ""}`}
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <section className="panel controls">
        <div className="workflow-step">
          <div className="step-inline">
            <div className="step-heading">
              <h2>{t.step1Title}</h2>
              <HelpBadge text={t.uploadHelp} />
            </div>
            <div className="inline-upload">
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                onChange={onImageSelected}
                onClick={(event) => {
                  event.currentTarget.value = "";
                }}
                className="visually-hidden"
              />
              <label className="action-button compact-button prominent-button" htmlFor={fileInputId}>
                {t.uploadLabel}
              </label>
            </div>
          </div>
        </div>

        <div className="workflow-step">
          <div className="step-inline">
            <div className="step-heading">
              <h2>{t.step2Title}</h2>
              <HelpBadge text={t.rectifyHelp} />
            </div>
            <div className="button-row tight-row">
              <button
                type="button"
                className={`action-button compact-button ${cornerStepActive ? "active-tool-button" : ""}`}
                onClick={startCornerSelection}
                disabled={!sourceImageUrl || Boolean(normalizedImageUrl)}
              >
                {cornerStepActive ? t.restartCornersButton : t.startCornersButton}
              </button>
              <button
                type="button"
                className={`action-button compact-button ${cornerPoints.length === 4 ? "ready-button" : ""}`}
                onClick={onNormalizeImage}
                disabled={!sourceImageUrl || cornerPoints.length !== 4}
              >
                {t.rectifyButton}
              </button>
            </div>
          </div>
        </div>

        <div className="workflow-step">
          <div className="step-inline align-start">
            <div className="step-heading">
              <h2>{t.step3Title}</h2>
              <HelpBadge text={t.calibrationHelp} />
            </div>
            <div className="button-row tight-row">
              <button
                type="button"
                className={`action-button compact-button ${clickTarget === "max" ? "active-tool-button" : ""}`}
                onClick={() => selectCalibrationPoint("max")}
                disabled={!normalizedImageUrl}
              >
                <Variable symbol="V" subscript="min" />, <Variable symbol="p" subscript="max" />
              </button>
              <button
                type="button"
                className={`action-button compact-button ${clickTarget === "min" ? "active-tool-button" : ""}`}
                onClick={() => selectCalibrationPoint("min")}
                disabled={!normalizedImageUrl}
              >
                <Variable symbol="V" subscript="max" />, <Variable symbol="p" subscript="min" />
              </button>
            </div>
          </div>

          <div className="calibration-grid">
            <div className="field-row compact-field">
              <label htmlFor="v-min"><Variable symbol="V" subscript="min" /> <Unit text="cm3" /></label>
              <input id="v-min" type="text" inputMode="decimal" value={vMin} onChange={(event) => setVMin(event.target.value)} />
            </div>
            <div className="field-row compact-field">
              <label htmlFor="v-max"><Variable symbol="V" subscript="max" /> <Unit text="cm3" /></label>
              <input id="v-max" type="text" inputMode="decimal" value={vMax} onChange={(event) => setVMax(event.target.value)} />
            </div>
            <div className="field-row compact-field">
              <label htmlFor="p-min"><Variable symbol="p" subscript="min" /> <Unit text="10^5 Pa" /></label>
              <input id="p-min" type="text" inputMode="decimal" value={pMin} onChange={(event) => setPMin(event.target.value)} />
            </div>
            <div className="field-row compact-field">
              <label htmlFor="p-max"><Variable symbol="p" subscript="max" /> <Unit text="10^5 Pa" /></label>
              <input id="p-max" type="text" inputMode="decimal" value={pMax} onChange={(event) => setPMax(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="workflow-step">
          <div className="step-inline align-start">
            <div className="step-heading">
              <h2>{t.step4Title}</h2>
              <HelpBadge text={t.contourHelp} />
            </div>
            <div className="button-row tight-row">
              <button
                type="button"
                className={`action-button compact-button ${contourStepActive ? "active-tool-button" : ""}`}
                onClick={startContourSelection}
                disabled={!showCalibrationAxes}
              >
                {contourPoints.length > 0 ? t.restartContourButton : t.startContourButton}
              </button>
            </div>
          </div>
        </div>

        <section className="instrument-panel-grid">
          <article className="instrument-panel">
            <div className="instrument-head">
              <span className="instrument-label">{t.pixelAreaLabel}</span>
              <HelpBadge text={t.pixelAreaHelp} />
            </div>
            <strong className="instrument-value">{pixelArea > 0 ? pixelArea.toFixed(0) : "--"}</strong>
          </article>
          <article className="instrument-panel accent-panel">
            <div className="instrument-head">
              <span className="instrument-label">{t.calibratedAreaLabel}</span>
              <HelpBadge text={t.calibratedAreaHelp} />
            </div>
            <div className="instrument-reading">
              <strong className="instrument-value">{formattedCalibratedArea}</strong>
              <span className="instrument-unit">mJ</span>
            </div>
          </article>
        </section>
      </section>

      <section className="panel preview">
        {previewImageUrl ? (
          <div
            className={`image-wrap ${(clickTarget ? "calibration-active" : "") + (cornerStepActive ? " corners-active" : "") + (contourStepActive ? " guide-active" : "")}`}
            style={{ position: "relative" }}
            onMouseMove={(event) => {
              updateDraggingContourPoint(event);
              updateDraggingCornerPoint(event);
            }}
            onMouseUp={() => {
              setDraggingContourIndex(null);
              setDraggingCornerIndex(null);
            }}
            onMouseLeave={() => {
              setDraggingContourIndex(null);
              setDraggingCornerIndex(null);
            }}
          >
            <img
              ref={previewImageRef}
              src={previewImageUrl}
              alt={t.previewAlt}
              onClick={onPreviewClick}
              style={{
                display: "block",
                width: "100%",
                height: "auto"
              }}
            />

            {contourClosed ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.26)",
                  pointerEvents: "none",
                  zIndex: 1
                }}
              />
            ) : null}

            {cornerPoints.map((pt, idx) => (
              <div
                key={`corner-${idx}`}
                style={{
                  position: "absolute",
                  left: `${(pt.x / (previewImageRef.current?.naturalWidth || 1)) * 100}%`,
                  top: `${(pt.y / (previewImageRef.current?.naturalHeight || 1)) * 100}%`,
                  width: 10,
                  height: 10,
                  background: "red",
                  borderRadius: idx === 0 ? "30%" : "50%",
                  cursor: "grab",
                  transform: "translate(-50%, -50%)",
                  zIndex: 10
                }}
                onMouseDown={(event) => onCornerPointMouseDown(event, idx)}
              />
            ))}

            {cornerPoints.length === 4 ? (
              <svg
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 9
                }}
                width={previewImageRef.current?.naturalWidth || 1}
                height={previewImageRef.current?.naturalHeight || 1}
                viewBox={`0 0 ${previewImageRef.current?.naturalWidth || 1} ${previewImageRef.current?.naturalHeight || 1}`}
              >
                <polygon
                  points={orderedCornerPoints.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                  fill="rgba(255,0,0,0.1)"
                  stroke="red"
                  strokeWidth="3"
                />
              </svg>
            ) : null}

            {showCalibrationAxes && calibrationOverlay ? (
              <svg
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 7
                }}
                width={imageWidth}
                height={imageHeight}
                viewBox={`0 0 ${imageWidth} ${imageHeight}`}
              >
                <line
                  x1={calibrationOverlay.xAxisStart.x}
                  y1={calibrationOverlay.xAxisStart.y}
                  x2={calibrationOverlay.xAxisEnd.x}
                  y2={calibrationOverlay.xAxisEnd.y}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="5.5"
                />
                <line
                  x1={calibrationOverlay.xAxisStart.x}
                  y1={calibrationOverlay.xAxisStart.y}
                  x2={calibrationOverlay.xAxisEnd.x}
                  y2={calibrationOverlay.xAxisEnd.y}
                  stroke="#2e86ab"
                  strokeWidth="2.5"
                />
                <line
                  x1={calibrationOverlay.yAxisStart.x}
                  y1={calibrationOverlay.yAxisStart.y}
                  x2={calibrationOverlay.yAxisEnd.x}
                  y2={calibrationOverlay.yAxisEnd.y}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="5.5"
                />
                <line
                  x1={calibrationOverlay.yAxisStart.x}
                  y1={calibrationOverlay.yAxisStart.y}
                  x2={calibrationOverlay.yAxisEnd.x}
                  y2={calibrationOverlay.yAxisEnd.y}
                  stroke="#2e86ab"
                  strokeWidth="2.5"
                />
                {calibrationOverlay.xTicks.map((tick, index) => (
                  <g key={`x-tick-${index}`}>
                    <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="rgba(255,255,255,0.9)" strokeWidth="4" />
                    <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="#2e86ab" strokeWidth="1.5" />
                    <text
                      x={tick.labelX}
                      y={tick.labelY}
                      fill="#124559"
                      fontSize="16"
                      fontWeight="600"
                      textAnchor="middle"
                      stroke="rgba(255,255,255,0.92)"
                      strokeWidth="3"
                      paintOrder="stroke"
                    >
                      {tick.label}
                    </text>
                  </g>
                ))}
                {calibrationOverlay.yTicks.map((tick, index) => (
                  <g key={`y-tick-${index}`}>
                    <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="rgba(255,255,255,0.9)" strokeWidth="4" />
                    <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="#2e86ab" strokeWidth="1.5" />
                    <text
                      x={tick.labelX}
                      y={tick.labelY}
                      fill="#124559"
                      fontSize="16"
                      fontWeight="600"
                      textAnchor="end"
                      stroke="rgba(255,255,255,0.92)"
                      strokeWidth="3"
                      paintOrder="stroke"
                    >
                      {tick.label}
                    </text>
                  </g>
                ))}
                <circle cx={maxPoint.x} cy={maxPoint.y} r="8" fill="rgba(255,255,255,0.95)" />
                <circle cx={maxPoint.x} cy={maxPoint.y} r="5" fill="#2e86ab" />
                <circle cx={minPoint.x} cy={minPoint.y} r="8" fill="rgba(255,255,255,0.95)" />
                <circle cx={minPoint.x} cy={minPoint.y} r="5" fill="#2e86ab" />
                <text
                  x={(calibrationOverlay.xAxisStart.x + calibrationOverlay.xAxisEnd.x) / 2}
                  y={Math.min(imageHeight - 14, calibrationOverlay.xAxisStart.y + 40)}
                  fill="#124559"
                  fontSize="20"
                  fontWeight="700"
                  textAnchor="middle"
                  stroke="rgba(255,255,255,0.94)"
                  strokeWidth="4"
                  paintOrder="stroke"
                >
                  <tspan fontStyle="italic">V</tspan>
                  <tspan dx="6">(cm</tspan><tspan baselineShift="super" fontSize="13">3</tspan><tspan>)</tspan>
                </text>
                <text
                  x={Math.max(18, calibrationOverlay.yAxisStart.x - 48)}
                  y={(calibrationOverlay.yAxisStart.y + calibrationOverlay.yAxisEnd.y) / 2}
                  fill="#124559"
                  fontSize="20"
                  fontWeight="700"
                  textAnchor="middle"
                  transform={`rotate(-90 ${Math.max(18, calibrationOverlay.yAxisStart.x - 48)} ${(calibrationOverlay.yAxisStart.y + calibrationOverlay.yAxisEnd.y) / 2})`}
                  stroke="rgba(255,255,255,0.94)"
                  strokeWidth="4"
                  paintOrder="stroke"
                >
                  <tspan fontStyle="italic">p</tspan>
                  <tspan dx="6">(10</tspan><tspan baselineShift="super" fontSize="13">5</tspan><tspan> Pa)</tspan>
                </text>
              </svg>
            ) : null}

            {!showCalibrationAxes && maxPoint ? (
              <div
                style={{
                  position: "absolute",
                  left: `${(maxPoint.x / (previewImageRef.current?.naturalWidth || 1)) * 100}%`,
                  top: `${(maxPoint.y / (previewImageRef.current?.naturalHeight || 1)) * 100}%`,
                  width: 10,
                  height: 10,
                  background: "#2e86ab",
                  border: "2px solid #f4f8fb",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 8
                }}
              />
            ) : null}

            {!showCalibrationAxes && minPoint ? (
              <div
                style={{
                  position: "absolute",
                  left: `${(minPoint.x / (previewImageRef.current?.naturalWidth || 1)) * 100}%`,
                  top: `${(minPoint.y / (previewImageRef.current?.naturalHeight || 1)) * 100}%`,
                  width: 10,
                  height: 10,
                  background: "#2e86ab",
                  border: "2px solid #f4f8fb",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 8
                }}
              />
            ) : null}

            {contourClosed ? (
              <svg
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 10
                }}
                width={previewImageRef.current?.naturalWidth || 1}
                height={previewImageRef.current?.naturalHeight || 1}
                viewBox={`0 0 ${previewImageRef.current?.naturalWidth || 1} ${previewImageRef.current?.naturalHeight || 1}`}
              >
                {contourPoints.map((pt, idx) => {
                  const next = contourPoints[(idx + 1) % contourPoints.length];
                  return (
                    <line
                      key={`segment-hit-${idx}`}
                      x1={pt.x}
                      y1={pt.y}
                      x2={next.x}
                      y2={next.y}
                      stroke="transparent"
                      strokeWidth="18"
                      onClick={(event) => onContourSegmentClick(event, idx)}
                    />
                  );
                })}
                <polygon
                  points={contourPoints.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                  fill="rgba(255,176,0,0.08)"
                  stroke="rgba(255,176,0,0.7)"
                  strokeWidth="3"
                  strokeDasharray="8 6"
                  pointerEvents="none"
                />
              </svg>
            ) : contourPoints.length >= 2 ? (
              <svg
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 10
                }}
                width={previewImageRef.current?.naturalWidth || 1}
                height={previewImageRef.current?.naturalHeight || 1}
                viewBox={`0 0 ${previewImageRef.current?.naturalWidth || 1} ${previewImageRef.current?.naturalHeight || 1}`}
              >
                <polyline
                  points={contourPoints.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                  fill="none"
                  stroke="rgba(255,176,0,0.9)"
                  strokeWidth="3"
                  strokeDasharray="8 6"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}

            {contourPoints.map((pt, idx) => (
              <div
                key={`contour-${idx}`}
                style={{
                  position: "absolute",
                  left: `${(pt.x / (previewImageRef.current?.naturalWidth || 1)) * 100}%`,
                  top: `${(pt.y / (previewImageRef.current?.naturalHeight || 1)) * 100}%`,
                  width: 10,
                  height: 10,
                  background: "#ffb000",
                  borderRadius: idx === 0 ? "30%" : "50%",
                  cursor: contourClosed ? "grab" : "default",
                  transform: "translate(-50%, -50%)",
                  zIndex: 11,
                  pointerEvents: contourClosed ? "auto" : "none"
                }}
                onMouseDown={contourClosed ? (event) => onContourPointMouseDown(event, idx) : undefined}
              />
            ))}

            {!cornerStepActive && outlinePoints.length >= 3 ? (
              <svg
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 8
                }}
                width={previewImageRef.current?.naturalWidth || 1}
                height={previewImageRef.current?.naturalHeight || 1}
                viewBox={`0 0 ${previewImageRef.current?.naturalWidth || 1} ${previewImageRef.current?.naturalHeight || 1}`}
              >
                <polygon
                  points={outlinePoints.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                  fill="none"
                  stroke="#d62828"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </div>
        ) : (
          <p>{t.noImageText}</p>
        )}
      </section>

      <footer className="app-footer">
        <small>{t.copyrightText}</small>
      </footer>
    </main>
  );
}

type AxisTick = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  labelX: number;
  labelY: number;
};

type CalibrationOverlay = {
  origin: Point;
  xAxisStart: Point;
  xAxisEnd: Point;
  yAxisStart: Point;
  yAxisEnd: Point;
  xTicks: AxisTick[];
  yTicks: AxisTick[];
};

function buildCalibrationOverlay(input: {
  width: number;
  height: number;
  topLeft: Point;
  bottomRight: Point;
  vMin: string;
  vMax: string;
  pMin: string;
  pMax: string;
}): CalibrationOverlay {
  const marginX = Math.max(42, Math.round(input.width * 0.055));
  const marginY = Math.max(26, Math.round(input.height * 0.04));
  const vMinValue = parseNumericInput(input.vMin);
  const vMaxValue = parseNumericInput(input.vMax);
  const pMinValue = parseNumericInput(input.pMin);
  const pMaxValue = parseNumericInput(input.pMax);

  const origin = {
    x: marginX,
    y: input.height - marginY
  };
  const topReference = {
    x: input.width - marginX,
    y: marginY
  };
  const widthPixels = input.bottomRight.x - input.topLeft.x;
  const heightPixels = input.bottomRight.y - input.topLeft.y;
  const xAxisStartValue =
    Math.abs(widthPixels) > 1e-9
      ? vMinValue + (origin.x - input.topLeft.x) * ((vMaxValue - vMinValue) / widthPixels)
      : vMinValue;
  const xAxisEndValue =
    Math.abs(widthPixels) > 1e-9
      ? vMinValue + (topReference.x - input.topLeft.x) * ((vMaxValue - vMinValue) / widthPixels)
      : vMaxValue;
  const yAxisTopValue =
    Math.abs(heightPixels) > 1e-9
      ? pMaxValue + (topReference.y - input.topLeft.y) * ((pMinValue - pMaxValue) / heightPixels)
      : pMaxValue;
  const yAxisBottomValue =
    Math.abs(heightPixels) > 1e-9
      ? pMaxValue + (origin.y - input.topLeft.y) * ((pMinValue - pMaxValue) / heightPixels)
      : pMinValue;

  const xTicks = buildNumericAxisTicks({
    axis: "x",
    start: origin.x,
    end: topReference.x,
    fixed: origin.y,
    valueStart: xAxisStartValue,
    valueEnd: xAxisEndValue
  });
  const yTicks = buildNumericAxisTicks({
    axis: "y",
    start: topReference.y,
    end: origin.y,
    fixed: origin.x,
    valueStart: yAxisTopValue,
    valueEnd: yAxisBottomValue
  });

  return {
    origin,
    xAxisStart: origin,
    xAxisEnd: { x: topReference.x, y: origin.y },
    yAxisStart: origin,
    yAxisEnd: { x: origin.x, y: topReference.y },
    xTicks,
    yTicks
  };
}

function buildNumericAxisTicks(input: {
  axis: "x" | "y";
  start: number;
  end: number;
  fixed: number;
  valueStart: number;
  valueEnd: number;
}): AxisTick[] {
  const tickValues = createNiceTickValues(input.valueStart, input.valueEnd, input.axis === "x" ? 5 : 4);

  return tickValues.map((value, index) => {
    const t = valueToInterpolation(value, input.valueStart, input.valueEnd);
    const suppressLabel =
      (input.axis === "x" && index === 0) ||
      (input.axis === "y" && index === tickValues.length - 1);

    if (input.axis === "x") {
      const x = input.start + (input.end - input.start) * t;
      return {
        x1: x,
        y1: input.fixed - 8,
        x2: x,
        y2: input.fixed + 8,
        label: suppressLabel ? "" : formatTickValue(value),
        labelX: x,
        labelY: input.fixed + 26
      };
    }

    const y = input.start + (input.end - input.start) * t;
    return {
      x1: input.fixed - 8,
      y1: y,
      x2: input.fixed + 8,
      y2: y,
      label: suppressLabel ? "" : formatTickValue(value),
      labelX: input.fixed - 20,
      labelY: y + 5
    };
  });
}

function formatTickValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  if (Math.abs(value) >= 100 || Number.isInteger(value)) {
    return value.toFixed(0);
  }
  if (Math.abs(value) >= 10) {
    return value.toFixed(1);
  }
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function valueToInterpolation(value: number, startValue: number, endValue: number): number {
  const span = endValue - startValue;
  if (!Number.isFinite(span) || Math.abs(span) < 1e-9) {
    return 0;
  }
  return (value - startValue) / span;
}

function createNiceTickValues(startValue: number, endValue: number, maxTickCount: number): number[] {
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) {
    return [0];
  }

  if (Math.abs(endValue - startValue) < 1e-9) {
    return [startValue];
  }

  const ascending = endValue > startValue;
  const minValue = ascending ? startValue : endValue;
  const maxValue = ascending ? endValue : startValue;
  const rawStep = (maxValue - minValue) / Math.max(1, maxTickCount - 1);
  const niceStep = getNiceStep(rawStep);

  let firstTick = Math.ceil(minValue / niceStep) * niceStep;
  let lastTick = Math.floor(maxValue / niceStep) * niceStep;

  const ticks: number[] = [];
  ticks.push(startValue);

  for (let value = firstTick; value <= lastTick + niceStep * 0.5; value += niceStep) {
    if (!isCloseToAny(value, [startValue, endValue], niceStep * 0.25)) {
      ticks.push(roundToNicePrecision(value, niceStep));
    }
  }

  ticks.push(endValue);
  const uniqueTicks = Array.from(new Set(ticks.map((value) => roundToNicePrecision(value, niceStep))));
  uniqueTicks.sort((a, b) => ascending ? a - b : b - a);
  return uniqueTicks;
}

function getNiceStep(rawStep: number): number {
  const exponent = Math.floor(Math.log10(Math.abs(rawStep)));
  const fraction = Math.abs(rawStep) / 10 ** exponent;

  let niceFraction = 1;
  if (fraction <= 1) {
    niceFraction = 1;
  } else if (fraction <= 2) {
    niceFraction = 2;
  } else if (fraction <= 5) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }

  return niceFraction * 10 ** exponent;
}

function roundToNicePrecision(value: number, step: number): number {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  return Number(value.toFixed(Math.min(6, decimals)));
}

function isCloseToAny(value: number, candidates: number[], tolerance: number): boolean {
  return candidates.some((candidate) => Math.abs(candidate - value) <= tolerance);
}

function formatLocaleNumber(value: number, locale: Locale, maximumFractionDigits: number): string {
  return new Intl.NumberFormat(locale === "sv" ? "sv-SE" : "en-US", {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits
  }).format(value);
}

function orderCornersForQuad(points: Point[]): Point[] {
  if (points.length !== 4) {
    return points;
  }

  const center = points.reduce(
    (acc, point) => ({ x: acc.x + point.x / 4, y: acc.y + point.y / 4 }),
    { x: 0, y: 0 }
  );

  const clockwise = [...points].sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });

  const topLeftIndex = clockwise.reduce((bestIndex, point, index, array) => {
    const bestPoint = array[bestIndex];
    return point.x + point.y < bestPoint.x + bestPoint.y ? index : bestIndex;
  }, 0);

  const rotated = clockwise.slice(topLeftIndex).concat(clockwise.slice(0, topLeftIndex));
  const signedArea = rotated.reduce((area, point, index) => {
    const next = rotated[(index + 1) % rotated.length];
    return area + point.x * next.y - next.x * point.y;
  }, 0) / 2;

  return signedArea < 0 ? [rotated[0], rotated[3], rotated[2], rotated[1]] : rotated;
}

function HelpBadge({ text }: { text: string }) {
  return (
    <span className="help-badge" tabIndex={0} aria-label={text}>
      ?
      <span className="help-tooltip" role="tooltip">{text}</span>
    </span>
  );
}

function Variable({ symbol, subscript }: { symbol: string; subscript: string }) {
  return (
    <span className="scientific-label">
      <em>{symbol}</em>
      <sub>{subscript}</sub>
    </span>
  );
}

function Unit({ text }: { text: string }) {
  if (text === "cm3") {
    return (
      <span className="unit-label">
        / cm<sup>3</sup>
      </span>
    );
  }

  if (text === "10^5 Pa") {
    return (
      <span className="unit-label">
        / 10<sup>5</sup> Pa
      </span>
    );
  }

  return <span className="unit-label">/ {text}</span>;
}

function getImagePoint(event: MouseEvent<Element>, image: HTMLImageElement): Point {
  const rect = image.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * image.naturalWidth,
    y: ((event.clientY - rect.top) / rect.height) * image.naturalHeight
  };
}

function isNearPoint(a: Point, b: Point, radius: number): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= radius;
}

function findSegmentInsertIndex(points: Point[], target: Point): number {
  if (points.length < 2) {
    return -1;
  }

  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < points.length; i += 1) {
    const next = points[(i + 1) % points.length];
    const distance = distanceToSegment(target, points[i], next);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestDistance <= SEGMENT_HIT_DISTANCE ? bestIndex : -1;
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy
  };

  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function polygonArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const next = points[(i + 1) % points.length];
    area += points[i].x * next.y - next.x * points[i].y;
  }
  return Math.abs(area) / 2;
}

type CalibrationInputs = {
  vMin: string;
  vMax: string;
  pMin: string;
  pMax: string;
  topLeft: Point | null;
  bottomRight: Point | null;
};

function getCalibratedAreaMilliJoules(points: Point[], calibration: CalibrationInputs): number | null {
  const vMinValue = parseNumericInput(calibration.vMin);
  const vMaxValue = parseNumericInput(calibration.vMax);
  const pMinValue = parseNumericInput(calibration.pMin);
  const pMaxValue = parseNumericInput(calibration.pMax);
  const topLeft = calibration.topLeft;
  const bottomRight = calibration.bottomRight;

  if (
    !topLeft ||
    !bottomRight ||
    !Number.isFinite(vMinValue) ||
    !Number.isFinite(vMaxValue) ||
    !Number.isFinite(pMinValue) ||
    !Number.isFinite(pMaxValue)
  ) {
    return null;
  }

  const widthPixels = bottomRight.x - topLeft.x;
  const heightPixels = bottomRight.y - topLeft.y;

  if (Math.abs(widthPixels) < 1e-6 || Math.abs(heightPixels) < 1e-6) {
    return null;
  }

  const volumeScale = (vMaxValue - vMinValue) / widthPixels;
  const pressureScale = (pMinValue - pMaxValue) / heightPixels;

  if (!Number.isFinite(volumeScale) || !Number.isFinite(pressureScale)) {
    return null;
  }

  const pvArea = polygonArea(
    points.map((point) => ({
      x: vMinValue + (point.x - topLeft.x) * volumeScale,
      y: pMaxValue + (point.y - topLeft.y) * pressureScale
    }))
  );

  return pvArea * 100;
}

function parseNumericInput(value: string): number {
  return Number(value.replace(",", ".").trim());
}
