import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MinistryFormV3, PrivateContactFields } from "@/components/community/report/ministry-v3/ministry-form";

describe("unified ministry form", () => {
  it("permits a count-only report and exposes named-contact capture", () => {
    const html = renderToStaticMarkup(<MinistryFormV3 dateKey="2026-10-13" onSave={async () => ({ ok: true })} />);
    expect(html).toContain("One simple report");
    expect(html).toContain("Evangelism");
    expect(html).toContain("Discipleship");
    expect(html).toContain("You can report a count without saving contacts.");
    expect(html).toContain("Add contact");
    expect(html).toContain("Named people are included in this total.");
    expect(html).not.toContain("Step 1 of");
  });
  it("keeps counts and people labels consistent on discipleship", () => {
    const html = renderToStaticMarkup(<MinistryFormV3 dateKey="2026-10-13" initialKind="follow_up" onSave={async () => ({ ok: true })} />);
    expect(html).toContain("People involved");
    expect(html).toContain("Phone call");
    expect(html).not.toContain("People reached");
  });
  it("labels required capture fields and optional email, including accessible errors", () => {
    const html = renderToStaticMarkup(<PrivateContactFields value={{ name: "", phone: "", email: "", note: "" }} update={() => {}} error={{ field: "phone", message: "Enter a phone number." }} />);
    expect(html).toContain("Full name · required");
    expect(html).toContain("Phone number · required");
    expect(html).toContain("Email · optional");
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="private-contact-phone-error"');
  });
});
