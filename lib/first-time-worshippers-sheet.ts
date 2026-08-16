import "server-only";

import { readFile } from "node:fs/promises";

import { google } from "googleapis";

import {
  getFirstTimeWorshipperSheetName,
  type FirstTimeWorshipperValues,
} from "./first-time-worshippers";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

const GOOGLE_SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function protectSpreadsheetValue(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

async function getServiceAccountCredentials(): Promise<ServiceAccountCredentials> {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS?.trim();

  if (json) {
    return JSON.parse(json) as ServiceAccountCredentials;
  }

  const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH?.trim();

  if (!credentialsPath) {
    throw new Error("Google service account credentials are not configured.");
  }

  return JSON.parse(await readFile(credentialsPath, "utf8")) as ServiceAccountCredentials;
}

function getSpreadsheetId(): string {
  const spreadsheetId = process.env.FIRST_TIME_WORSHIPPERS_SHEET_ID?.trim();

  if (!spreadsheetId) {
    throw new Error("First-time worshipper spreadsheet is not configured.");
  }

  return spreadsheetId;
}

function getLagosDateMarker(now = new Date()): string {
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return `Date: ${date}`;
}

export async function appendFirstTimeWorshipper(
  values: FirstTimeWorshipperValues,
): Promise<void> {
  const sheetName = getFirstTimeWorshipperSheetName(values.location);

  if (!sheetName) {
    throw new Error("Unknown church location.");
  }

  const credentials = await getServiceAccountCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: GOOGLE_SHEETS_SCOPES,
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = getSpreadsheetId();
  const range = `'${sheetName.replaceAll("'", "''")}'!A:G`;
  const dateMarker = getLagosDateMarker();
  const [existing, spreadsheet] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range }),
    sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties(sheetId,title)",
    }),
  ]);
  const sheetId = spreadsheet.data.sheets?.find(
    (sheet) => sheet.properties?.title === sheetName,
  )?.properties?.sheetId;

  if (sheetId === undefined) {
    throw new Error("Church location sheet was not found.");
  }

  const lastRow = [...(existing.data.values ?? [])]
    .reverse()
    .find((row) => row.some((cell) => Boolean(cell?.trim())));
  const rows = [
    ...(lastRow?.[0] === dateMarker
      ? []
      : [[dateMarker, "", "", "", "", "", ""]]),
    [
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Lagos",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date()),
      protectSpreadsheetValue(values.fullName),
      protectSpreadsheetValue(values.phone),
      protectSpreadsheetValue(values.whatsappNumber),
      protectSpreadsheetValue(values.email),
      protectSpreadsheetValue(values.homeAddress),
      protectSpreadsheetValue(values.location),
    ],
  ];

  const appended = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });

  if (rows[0]?.[0] === dateMarker) {
    const updatedRange = appended.data.updates?.updatedRange;
    const match = updatedRange?.match(/![A-Z]+(\d+):[A-Z]+\d+$/);
    const dateRowIndex = match ? Number(match[1]) - 1 : null;

    if (dateRowIndex !== null) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: dateRowIndex,
                  endRowIndex: dateRowIndex + 1,
                  startColumnIndex: 0,
                  endColumnIndex: 7,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.88,
                      green: 0.94,
                      blue: 1,
                    },
                    textFormat: {
                      bold: true,
                      foregroundColor: {
                        red: 0.02,
                        green: 0.08,
                        blue: 0.48,
                      },
                    },
                  },
                },
                fields:
                  "userEnteredFormat(backgroundColor,textFormat.bold,textFormat.foregroundColor)",
              },
            },
          ],
        },
      });
    }
  }
}
