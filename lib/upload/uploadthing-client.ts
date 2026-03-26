"use client";

import { generateReactHelpers } from "@uploadthing/react";

import type { AppFileRouter } from "@/lib/upload/uploadthing";

export const { useUploadThing } = generateReactHelpers<AppFileRouter>();
