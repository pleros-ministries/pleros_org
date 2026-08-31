import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { SogpIntroVideo } from "../../components/sogp/sogp-intro-video";

test("renders a self-hosted video that starts only after the visitor acts", () => {
  const html = renderToStaticMarkup(
    <SogpIntroVideo
      src="/site/sogp/welcome.mp4"
      posterSrc="/site/sogp/welcome.jpg"
      title="Welcome to SOGP"
    />,
  );

  expect(html).toContain("<video");
  expect(html).toContain('preload="metadata"');
  expect(html).toContain("Play Welcome to SOGP");
  expect(html).toContain("aspect-square");
  expect(html).not.toContain("aspect-[9/16]");
  expect(html).not.toContain("autoplay");
  expect(html).not.toContain("youtube");
});
