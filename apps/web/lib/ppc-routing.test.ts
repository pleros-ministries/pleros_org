import { describe, expect, test } from "vitest";

import { getPpcRewritePath } from "./ppc-routing";

describe("getPpcRewritePath", () => {
  test("rewrites root requests on ppc host", () => {
    expect(getPpcRewritePath("ppc.pleros.org", "/")).toBe("/ppc");
  });

  test("rewrites nested student requests on ppc host", () => {
    expect(getPpcRewritePath("ppc.pleros.org", "/student/level/2")).toBe(
      "/ppc/student/level/2",
    );
  });

  test("supports ppc host with port", () => {
    expect(getPpcRewritePath("ppc.pleros.org:3000", "/student")).toBe(
      "/ppc/student",
    );
  });

  test("does not rewrite admin namespace requests on ppc host", () => {
    expect(getPpcRewritePath("ppc.pleros.org", "/admin")).toBeNull();
    expect(getPpcRewritePath("ppc.pleros.org", "/admin/students")).toBeNull();
  });

  test("does not rewrite non-ppc hosts", () => {
    expect(getPpcRewritePath("pleros.org", "/")).toBeNull();
    expect(getPpcRewritePath("localhost:3000", "/")).toBeNull();
  });

  test("does not rewrite paths already in /ppc namespace", () => {
    expect(getPpcRewritePath("ppc.pleros.org", "/ppc")).toBeNull();
    expect(getPpcRewritePath("ppc.pleros.org", "/ppc/admin")).toBeNull();
  });

  test("does not rewrite next internals, api routes, or static files", () => {
    expect(getPpcRewritePath("ppc.pleros.org", "/_next/static/chunk.js")).toBeNull();
    expect(getPpcRewritePath("ppc.pleros.org", "/api/health")).toBeNull();
    expect(getPpcRewritePath("ppc.pleros.org", "/favicon.ico")).toBeNull();
    expect(getPpcRewritePath("ppc.pleros.org", "/brand/logo.svg")).toBeNull();
  });
});
