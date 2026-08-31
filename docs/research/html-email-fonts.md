# Sen and Be Vietnam Pro in HTML email

Research date: 31 August 2026

## Recommendation

Treat Sen and Be Vietnam Pro as progressive enhancement, not as a layout dependency.

- Use **Sen 600** for display headings and **Sen 500** for the CTA label.
- Use **Be Vietnam Pro 400** for body copy and **Be Vietnam Pro 600** only for short emphasis.
- Keep the fallback stacks on every relevant element, including inline styles:
  - headings and CTA: `'Sen', 'Trebuchet MS', Arial, sans-serif`
  - body: `'Be Vietnam Pro', Arial, Helvetica, sans-serif`
- Keep button copy at `font-weight:500`; this is visibly softer than the present 600 while remaining legible when the client falls back to Arial.
- Load only the required faces in a `<style>` block with `@font-face`, wrapped in `@media screen`. Use WOFF2 URLs returned by the official Google Fonts CSS API, or equivalent HTTPS-hosted WOFF2 files. Do not make the email depend on the font request succeeding.
- Continue to inline structural and visual styles. The web-font declarations should be the only optional enhancement.
- Add an Outlook conditional override for any element assigned a custom family, so classic Outlook explicitly uses Arial rather than risking Times New Roman.

Suggested pattern:

```html
<style type="text/css">
  @media screen {
    @font-face {
      font-family: 'Sen';
      font-style: normal;
      font-weight: 500;
      font-display: swap;
      src: url('https://fonts.gstatic.com/s/sen/v12/6xKjdSxYI9_3nPWN.woff2') format('woff2');
    }

    @font-face {
      font-family: 'Be Vietnam Pro';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('https://fonts.gstatic.com/s/bevietnampro/v12/QdVPSTAyLFyeg_IDWvOJmVES_Hw3BXo.woff2') format('woff2');
    }
  }
</style>
<!--[if mso]>
<style type="text/css">
  .email-heading,
  .email-button,
  .email-body { font-family: Arial, sans-serif !important; }
</style>
<![endif]-->
```

Example inline use:

```html
<h1 class="email-heading"
    style="font-family:'Sen','Trebuchet MS',Arial,sans-serif;font-weight:600;">
  Your enrolment is confirmed
</h1>

<p class="email-body"
   style="font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif;font-weight:400;">
  Welcome to SOGP.
</p>

<a class="email-button"
   style="font-family:'Sen','Trebuchet MS',Arial,sans-serif;font-weight:500;">
  Visit your dashboard to get started
</a>
```

## Why this is the safe approach

### Gmail

Gmail officially supports `font-family`, font weights, inline `<style>` blocks, and a documented subset of CSS, but its supported list does not include `@font-face`, `@import`, or external stylesheet links. Its unsupported CSS can be ignored. Therefore Gmail should be expected to render the supplied web-safe fallback rather than Sen or Be Vietnam Pro. [Gmail CSS support](https://developers.google.com/workspace/gmail/design/css)

Independent email-client tests agree: Gmail does not load arbitrary `@font-face` fonts; Roboto and Google Sans only work because Gmail itself embeds them. [Can I Email: `@font-face`](https://www.caniemail.com/features/css-at-font-face/)

### Outlook

Classic Outlook for Windows uses Microsoft Word in its HTML processing path, and Microsoft documents that CSS formatting can be lost or rewritten by the Word HTML engine. [Microsoft: formatting lost when editing `HtmlBody`](https://learn.microsoft.com/en-us/troubleshoot/outlook/user-interface/formatting-lost-when-editing-the-htmlbody-property)

The email-client test matrix records a specific classic-Outlook failure: an `@font-face` declaration can cause elements to ignore their ordinary font stack and fall back to Times New Roman. Wrapping web-font declarations in `@media screen` and adding the MSO-only Arial override keeps that failure mode away from the rendered message. [Can I Email: `@font-face` notes](https://www.caniemail.com/features/css-at-font-face/)

### Apple Mail and other WebKit clients

WebKit supports `@font-face` and WOFF2, so clients using that rendering capability can upgrade to the brand fonts when remote assets are allowed. [WebKit: improved font loading](https://webkit.org/blog/6643/improved-font-loading/)

Observed email-client tests show `@font-face` support in Apple Mail on macOS and iOS, but broad failure in Gmail and classic Outlook. The reported percentage is a share of tested clients, not market share, so it must not be read as recipient reach. [Can I Email: `@font-face`](https://www.caniemail.com/features/css-at-font-face/) and [support methodology](https://www.caniemail.com/support/)

## Loading method

For ordinary web pages, Google recommends a `<link rel="stylesheet">` to its CSS API. In email, however, independent client tests put `<link>` support below `@font-face`, and `@import` is also limited. A direct `@font-face` declaration in the email's `<style>` block is therefore the least fragile progressive enhancement. [Google Fonts CSS API](https://developers.google.com/fonts/docs/getting_started), [Can I Email: `<link>`](https://www.caniemail.com/features/html-link/), [Can I Email: `@import`](https://www.caniemail.com/features/css-at-import/)

The Google Fonts endpoint returns user-agent-specific CSS containing `@font-face` rules and font-file URLs. The implementation uses the Latin WOFF2 URLs returned for Sen 500/600 and Be Vietnam Pro 400/600 on 31 August 2026. Request only the families and weights used by the message; Google also advises always ending each font stack with a fallback family. [Google Fonts technical considerations](https://developers.google.com/fonts/docs/technical_considerations) and [CSS API v2](https://developers.google.com/fonts/docs/css2)

The standards-level fallback model is intentionally robust: user agents walk the comma-separated family list, and authors are encouraged to finish with a generic family. If a downloadable font is unavailable, the fallback should remain visible. [W3C CSS Fonts Module Level 4](https://www.w3.org/TR/css-fonts-4/)

## Verification checklist

Before shipping, send the real generated message to:

1. Gmail web and Gmail mobile: expect Arial/Helvetica fallbacks and confirm no wrapping or CTA-height regression.
2. Classic Outlook for Windows: confirm the MSO override prevents Times New Roman.
3. New Outlook/Outlook.com: confirm acceptable fallback rendering; web-font behaviour is not a contract.
4. Apple Mail on macOS and iOS: confirm Sen and Be Vietnam Pro load, but also test once with remote content disabled.
5. A narrow mobile viewport: confirm the longer CTA does not wrap awkwardly when Arial replaces Sen.

The email should be approved on its fallback rendering first. Successful brand-font loading is an enhancement.
