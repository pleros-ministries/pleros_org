// Deterministic review images, not an approval threshold or new visual baseline.
// Follow the baseline script's IAB handling: crop trailing capture bounds,
// never shrink rendered app pixels to make a mismatch disappear.
import sharp from "sharp";
import path from "node:path";

const evidence = path.resolve("docs/pleros-dashboard-v3/evidence");
for (const [stem, referenceName, captureName] of [
  ["slice2-ministry", "Pleros-report-ministry-evangelism.png", "slice2-ministry-mobile.jpg"],
  ["slice2-contact", "Pleros-report-inline-add-contact.png", "slice2-contact-mobile.jpg"],
]) {
  const reference = await sharp(path.join(evidence, referenceName)).resize({ width: 390 }).extract({ left: 0, top: 40, width: 390, height: 844 }).png().toBuffer();
  const implementation = await sharp(path.join(evidence, captureName)).extract({ left: 0, top: 0, width: 390, height: 844 }).png().toBuffer();
  await sharp(implementation).toFile(path.join(evidence, `${stem}-implementation.png`));
  await sharp({ create: { width: 796, height: 844, channels: 3, background: "#e7e9ec" } }).composite([
    { input: reference, left: 0, top: 0 }, { input: implementation, left: 406, top: 0 },
  ]).png().toFile(path.join(evidence, `${stem}-comparison.png`));
  const overlay = await sharp(implementation).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let index = 3; index < overlay.data.length; index += 4) overlay.data[index] = 128;
  await sharp(reference).composite([{ input: overlay.data, raw: overlay.info }]).png().toFile(path.join(evidence, `${stem}-overlay.png`));
  await sharp(reference).composite([{ input: implementation, blend: "difference" }]).png().toFile(path.join(evidence, `${stem}-difference.png`));
}
await sharp(path.join(evidence, "slice2-ministry-desktop.jpg")).extract({ left: 0, top: 0, width: 1440, height: 900 }).png().toFile(path.join(evidence, "slice2-ministry-desktop.png"));
console.log("Generated matched viewport comparisons, overlays and differences. Visual approval remains manual.");
