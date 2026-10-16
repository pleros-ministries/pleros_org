// Normalise supplied 2x exports and browser capture scale for visual review.
// This creates review artifacts only; it never changes app source/baselines.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const evidence = path.resolve("docs/pleros-dashboard-v3/evidence");
const source = process.argv[2];
if (!source) throw new Error("Pass the extracted design folder.");
const reference = await sharp(path.join(source, "Pleros-you.png")).resize(390, 956).extract({ left: 0, top: 40, width: 390, height: 889 }).png().toBuffer();
await fs.writeFile(path.join(evidence, "reference-app.png"), reference);
// Codex IAB capture adds trailing bounds at this browser zoom. The rendered
// app pixels are already CSS scale (confirmed against 350px DOM card width).
// Crop the extra bounds; do not shrink the actual app composition.
const mobile = await sharp(path.join(evidence, "mobile-crop.jpg")).extract({ left: 0, top: 0, width: 390, height: 844 }).png().toBuffer();
await fs.writeFile(path.join(evidence, "implementation-app.png"), mobile);
const refViewport = await sharp(reference).extract({ left: 0, top: 0, width: 390, height: 844 }).toBuffer();
await sharp({ create: { width: 796, height: 844, channels: 3, background: "#e7e9ec" } }).composite([{ input: refViewport, left: 0, top: 0 }, { input: mobile, left: 406, top: 0 }]).png().toFile(path.join(evidence, "comparison.png"));
const overlay = await sharp(mobile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 3; i < overlay.data.length; i += 4) overlay.data[i] = 128;
await sharp(refViewport).composite([{ input: overlay.data, raw: overlay.info }]).png().toFile(path.join(evidence, "overlay.png"));
await sharp(refViewport).composite([{ input: mobile, blend: "difference" }]).png().toFile(path.join(evidence, "difference.png"));
await sharp(path.join(evidence, "mobile-full.jpg")).extract({ left: 0, top: 0, width: 390, height: 1000 }).png().toFile(path.join(evidence, "implementation-full.png"));
await sharp({ create: { width: 796, height: 1000, channels: 3, background: "#ffffff" } }).composite([{ input: reference, left: 0, top: 0 }, { input: await sharp(path.join(evidence,"implementation-full.png")).toBuffer(), left: 406, top: 0 }]).png().toFile(path.join(evidence,"comparison-full.png"));
for (const [name,width,height] of [["mobile-drawer",390,844],["desktop-pastor",1440,900],["tablet-unit-leader",768,1024],["narrow-320",320,844]]) {
  await sharp(path.join(evidence,`${name}.jpg`)).extract({left:0,top:0,width,height}).png().toFile(path.join(evidence,`${name}.png`));
}

function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map(x => parseInt(x, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
const pairs = { ink: ["252b33", "ffffff"], muted: ["63676d", "ffffff"], action: ["2056d6", "ffffff"], learningMeta: ["d8e4ff", "2056d6"], learningSupport: ["e1eaff", "2056d6"], amber: ["92400e", "f7e4cd"], green: ["166534", "d5e8dc"], neutral: ["4a5273", "e9edf5"], blue: ["2331ae", "e4ebfd"], lilac: ["6d28d9", "e9dffa"] };
const contrast = Object.fromEntries(Object.entries(pairs).map(([name, [a,b]]) => { const values = [luminance(a),luminance(b)].sort((x,y)=>y-x); const ratio = (values[0]+.05)/(values[1]+.05); return [name,{ foreground: `#${a}`, background: `#${b}`, ratio: Number(ratio.toFixed(2)), normalTextPass: ratio >= 4.5 }]; }));
await fs.writeFile(path.join(evidence,"contrast.json"),JSON.stringify(contrast,null,2)+"\n");
const files = ["components/dashboard/v3/baseline.tsx", "components/dashboard/v3/primitives.tsx", "components/dashboard/v3/dashboard.module.css", "components/dashboard/v3/lucide-icons.json", "app/preview/dashboard-v3/page.tsx", "app/preview/dashboard-v3/loading.tsx", "app/preview/dashboard-v3/error.tsx", "components/root-integrations.tsx", "next.config.ts", ...["Regular","Medium","SemiBold","Bold"].map(weight=>`app/fonts/be-vietnam-pro/BeVietnamPro-${weight}.ttf`)];
const hashes = Object.fromEntries(await Promise.all(files.map(async file=>[file,crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex")])));
await fs.writeFile(path.join(evidence,"source-fingerprints.json"),JSON.stringify({ baselineCommit:"939482b", workingTree:"uncommitted", hashes },null,2)+"\n");
console.log(JSON.stringify({ contrast, artifacts: ["comparison.png", "overlay.png", "difference.png"] },null,2));
