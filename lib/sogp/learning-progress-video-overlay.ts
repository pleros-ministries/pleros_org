import {
  LEARNING_PROGRESS_SHARE_ACCENT_DARK as ACCENT_DARK,
  LEARNING_PROGRESS_SHARE_NAVY as NAVY,
  LEARNING_PROGRESS_SHARE_PADDING as PADDING,
  LEARNING_PROGRESS_SHARE_PATTERN_BLUE as PATTERN_BLUE,
  LEARNING_PROGRESS_SHARE_SKY as SKY,
  LEARNING_PROGRESS_SHARE_WHAT_I_LEARNT_GREEN as WHAT_I_LEARNT_GREEN,
} from "@/lib/sogp/learning-progress-share";

const POPPINS_FAMILY = "PlerosPoppinsVideo";
const NEWSREADER_FAMILY = "PlerosNewsreaderVideo";
const WHITE = "#FFFFFF";

let fontsPromise: Promise<void> | null = null;
function loadOverlayFonts(): Promise<void> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      if (typeof document === "undefined" || !("fonts" in document)) return;
      const faces = await Promise.all([
        new FontFace(
          POPPINS_FAMILY,
          "url(/fonts/sogp-share/Poppins-Medium.ttf)",
          { weight: "500" },
        ).load(),
        new FontFace(
          POPPINS_FAMILY,
          "url(/fonts/sogp-share/Poppins-SemiBold.ttf)",
          { weight: "600" },
        ).load(),
        new FontFace(
          POPPINS_FAMILY,
          "url(/fonts/sogp-share/Poppins-Bold.ttf)",
          { weight: "700" },
        ).load(),
        new FontFace(
          NEWSREADER_FAMILY,
          "url(/fonts/sogp-share/Newsreader-Medium.ttf)",
          { weight: "500" },
        ).load(),
      ]);
      faces.forEach((face) => document.fonts.add(face));
    })();
  }
  return fontsPromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

let logoPromise: Promise<HTMLImageElement> | null = null;
function getLogo(): Promise<HTMLImageElement> {
  if (!logoPromise) logoPromise = loadImage("/site/sogp/pleros-logo-white.png");
  return logoPromise;
}

let patternPromise: Promise<HTMLImageElement> | null = null;
function getPattern(): Promise<HTMLImageElement> {
  if (!patternPromise) patternPromise = loadImage("/site/sogp/share-card-pattern.png");
  return patternPromise;
}

export type LearningProgressOverlayAssets = {
  logo: HTMLImageElement;
  pattern: HTMLImageElement;
};

// Loads the branded fonts, logo, and background pattern once per session —
// mirrors the image card route's memoized data-URI/font promises — so
// re-mounting the recorder doesn't re-fetch them.
export async function loadLearningProgressOverlayAssets(): Promise<LearningProgressOverlayAssets> {
  const [logo, pattern] = await Promise.all([
    getLogo(),
    getPattern(),
    loadOverlayFonts(),
  ]);
  return { logo, pattern };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// object-fit: cover — crops the source to the destination's aspect ratio
// instead of stretching it.
function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  if (!sourceWidth || !sourceHeight || dw <= 0 || dh <= 0) return;
  const sourceAspect = sourceWidth / sourceHeight;
  const destAspect = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (sourceAspect > destAspect) {
    sw = sourceHeight * destAspect;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / destAspect;
    sy = (sourceHeight - sh) / 2;
  }
  ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
}

// object-fit: contain — scales the source to fit entirely inside the
// destination without cropping, preserving the full original framing.
function drawContain(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  if (!sourceWidth || !sourceHeight || dw <= 0 || dh <= 0) return;
  const sourceAspect = sourceWidth / sourceHeight;
  const destAspect = dw / dh;
  let drawWidth = dw;
  let drawHeight = dh;
  if (sourceAspect > destAspect) {
    drawHeight = dw / sourceAspect;
  } else {
    drawWidth = dh * sourceAspect;
  }
  ctx.drawImage(
    source,
    0,
    0,
    sourceWidth,
    sourceHeight,
    dx + (dw - drawWidth) / 2,
    dy + (dh - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

let blurBackgroundCanvas: HTMLCanvasElement | null = null;
function getBlurBackgroundCanvas(): HTMLCanvasElement {
  if (!blurBackgroundCanvas) blurBackgroundCanvas = document.createElement("canvas");
  return blurBackgroundCanvas;
}

// A landscape camera feed cropped tight enough to fill a tall portrait frame
// with no bars ends up looking uncomfortably zoomed in (most of the width is
// cut away). Instead: fill the frame edge-to-edge with a heavily downscaled
// (and therefore naturally soft/blurred, cheaply so — no per-frame canvas
// blur filter) cover-fit copy, then draw the full, un-cropped frame sharply
// on top at its natural size — the same "blurred fill + contained subject"
// treatment apps like Instagram/TikTok use to fit landscape video into a
// vertical frame without cropping or leaving dead bars.
function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;

  const small = getBlurBackgroundCanvas();
  const smallWidth = 64;
  const smallHeight = Math.max(1, Math.round(smallWidth * (dh / dw)));
  small.width = smallWidth;
  small.height = smallHeight;
  const smallCtx = small.getContext("2d");
  if (smallCtx) {
    drawCover(smallCtx, video, sourceWidth, sourceHeight, 0, 0, smallWidth, smallHeight);
    ctx.drawImage(small, dx, dy, dw, dh);
  }
  ctx.fillStyle = "rgba(10, 26, 110, 0.35)";
  ctx.fillRect(dx, dy, dw, dh);

  drawContain(ctx, video, sourceWidth, sourceHeight, dx, dy, dw, dh);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
): string[] {
  ctx.font = font;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(attempt).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function truncateToFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
): string {
  ctx.font = font;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}

// Draws the same branding the image card bakes into its PNG — patterned
// navy background, wordmark + logo header, a framed/cover-fit video, and a
// day badge / headline / author / "Visit pleros.org/sogp" footer — onto a
// canvas frame. Called every animation frame for the live preview, and
// identically while MediaRecorder captures the canvas stream, so what the
// learner sees is exactly what gets recorded.
export function drawLearningProgressOverlay(
  ctx: CanvasRenderingContext2D,
  options: {
    width: number;
    height: number;
    video: HTMLVideoElement;
    dayText: string;
    teachingLabel: string;
    headline: string;
    authorName: string;
    assets: LearningProgressOverlayAssets;
  },
): void {
  const { width, height, video, dayText, teachingLabel, headline, authorName, assets } =
    options;
  const scale = width / 1080;
  const padding = PADDING * scale;

  // Background
  ctx.fillStyle = PATTERN_BLUE;
  ctx.fillRect(0, 0, width, height);
  if (assets.pattern.complete && assets.pattern.naturalWidth) {
    drawCover(
      ctx,
      assets.pattern,
      assets.pattern.naturalWidth,
      assets.pattern.naturalHeight,
      0,
      0,
      width,
      height,
    );
  }

  // Header: wordmark left, logo right
  const headerLogoHeight = 72 * scale;
  ctx.fillStyle = WHITE;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${30 * scale}px ${POPPINS_FAMILY}`;
  ctx.fillText("SCHOOL OF", padding, padding + 26 * scale);
  ctx.fillText("GOD’S PURPOSE", padding, padding + 26 * scale + 34 * scale);
  if (assets.logo.complete && assets.logo.naturalHeight) {
    const logoWidth =
      (assets.logo.naturalWidth / assets.logo.naturalHeight) * headerLogoHeight;
    ctx.drawImage(
      assets.logo,
      width - padding - logoWidth,
      padding,
      logoWidth,
      headerLogoHeight,
    );
  }
  const headerBottom = padding + headerLogoHeight;

  // Footer metrics — computed bottom-up before drawing, so the video frame
  // above can be sized to fill exactly the remaining space.
  const dayBadgeHeight = 66 * scale;
  const dayBadgeFont = `700 ${30 * scale}px ${POPPINS_FAMILY}`;
  const dayBadgePaddingX = 34 * scale;
  ctx.font = dayBadgeFont;
  const dayTextWidth = ctx.measureText(dayText).width;
  const dotSize = 7 * scale;
  const dotGap = 18 * scale;
  const teachingFont = `600 ${19 * scale}px ${POPPINS_FAMILY}`;
  const teachingLabelText = teachingLabel.toUpperCase();
  ctx.font = teachingFont;
  const teachingWidth = ctx.measureText(teachingLabelText).width;
  const dayBadgeWidth =
    dayBadgePaddingX * 2 + dayTextWidth + dotGap + dotSize + dotGap + teachingWidth;

  const maxTextWidth = width - padding * 2;
  let headlineFontSize = 60 * scale;
  let headlineLines: string[] = [headline];
  for (const size of [60, 52, 44, 38]) {
    headlineFontSize = size * scale;
    const font = `500 ${headlineFontSize}px ${NEWSREADER_FAMILY}`;
    headlineLines = wrapText(ctx, headline, maxTextWidth, font);
    if (headlineLines.length <= 2) break;
  }
  if (headlineLines.length > 2) {
    const font = `500 ${headlineFontSize}px ${NEWSREADER_FAMILY}`;
    headlineLines = [
      headlineLines[0]!,
      truncateToFit(ctx, `${headlineLines[1]}`, maxTextWidth, font),
    ];
  }
  const headlineLineHeight = headlineFontSize * 1.12;
  const headlineBlockHeight = headlineLineHeight * headlineLines.length;

  const authorFontSize = 24 * scale;
  const authorRowHeight = authorFontSize * 1.3;

  const visitBarHeight = 96 * scale;

  const gapHeaderToFrame = 36 * scale;
  const gapFrameToBadge = 36 * scale;
  const gapBadgeToHeadline = 18 * scale;
  const gapHeadlineToAuthor = 24 * scale;
  const gapAuthorToVisit = 28 * scale;

  const footerHeight =
    dayBadgeHeight +
    gapBadgeToHeadline +
    headlineBlockHeight +
    gapHeadlineToAuthor +
    authorRowHeight +
    gapAuthorToVisit +
    visitBarHeight +
    padding;

  const frameLeft = padding;
  const frameWidth = width - padding * 2;
  const frameTop = headerBottom + gapHeaderToFrame;
  const frameBottom = height - footerHeight - gapFrameToBadge;
  const frameHeight = Math.max(0, frameBottom - frameTop);
  const frameRadius = 28 * scale;

  // Video frame
  ctx.save();
  roundRectPath(ctx, frameLeft, frameTop, frameWidth, frameHeight, frameRadius);
  ctx.clip();
  if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
    drawVideoFrame(ctx, video, frameLeft, frameTop, frameWidth, frameHeight);
  } else {
    ctx.fillStyle = NAVY;
    ctx.fillRect(frameLeft, frameTop, frameWidth, frameHeight);
  }
  ctx.restore();

  // Footer: day badge, headline, author row, visit bar
  let cursorY = frameBottom + gapFrameToBadge;

  roundRectPath(ctx, frameLeft, cursorY, dayBadgeWidth, dayBadgeHeight, dayBadgeHeight / 2);
  ctx.fillStyle = SKY;
  ctx.fill();
  ctx.textBaseline = "middle";
  ctx.fillStyle = NAVY;
  ctx.font = dayBadgeFont;
  ctx.fillText(dayText, frameLeft + dayBadgePaddingX, cursorY + dayBadgeHeight / 2);
  const dotX = frameLeft + dayBadgePaddingX + dayTextWidth + dotGap;
  ctx.beginPath();
  ctx.fillStyle = ACCENT_DARK;
  ctx.arc(dotX + dotSize / 2, cursorY + dayBadgeHeight / 2, dotSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = teachingFont;
  ctx.fillStyle = WHAT_I_LEARNT_GREEN;
  ctx.fillText(teachingLabelText, dotX + dotSize + dotGap, cursorY + dayBadgeHeight / 2);

  cursorY += dayBadgeHeight + gapBadgeToHeadline;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = WHITE;
  headlineLines.forEach((line, index) => {
    ctx.font = `500 ${headlineFontSize}px ${NEWSREADER_FAMILY}`;
    ctx.fillText(
      line,
      frameLeft,
      cursorY + headlineFontSize * 0.85 + index * headlineLineHeight,
    );
  });
  cursorY += headlineBlockHeight + gapHeadlineToAuthor;

  ctx.fillStyle = WHITE;
  ctx.font = `600 ${authorFontSize}px ${POPPINS_FAMILY}`;
  ctx.fillText(`— ${authorName}`, frameLeft, cursorY + authorFontSize * 0.85);
  cursorY += authorRowHeight + gapAuthorToVisit;

  roundRectPath(ctx, frameLeft, cursorY, frameWidth, visitBarHeight, visitBarHeight / 2);
  ctx.fillStyle = SKY;
  ctx.fill();
  const visitPaddingX = 40 * scale;
  ctx.textBaseline = "middle";
  ctx.fillStyle = NAVY;
  ctx.font = `600 ${32 * scale}px ${POPPINS_FAMILY}`;
  ctx.fillText("Visit pleros.org/sogp", frameLeft + visitPaddingX, cursorY + visitBarHeight / 2);

  const arrowSize = 24 * scale;
  const arrowX = frameLeft + frameWidth - visitPaddingX - arrowSize;
  const arrowY = cursorY + visitBarHeight / 2;
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(arrowX + arrowSize, arrowY);
  ctx.moveTo(arrowX + arrowSize * 0.55, arrowY - arrowSize * 0.4);
  ctx.lineTo(arrowX + arrowSize, arrowY);
  ctx.lineTo(arrowX + arrowSize * 0.55, arrowY + arrowSize * 0.4);
  ctx.stroke();
}
