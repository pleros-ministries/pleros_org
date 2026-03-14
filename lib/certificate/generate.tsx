import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    backgroundColor: "#ffffff",
  },
  border: {
    border: "2pt solid #18181b",
    borderRadius: 4,
    padding: 50,
    width: "100%",
    alignItems: "center",
  },
  org: {
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#71717a",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#52525b",
    marginBottom: 30,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 8,
  },
  detail: {
    fontSize: 12,
    color: "#52525b",
    marginBottom: 4,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#18181b",
    marginTop: 20,
    marginBottom: 20,
  },
  date: {
    fontSize: 10,
    color: "#a1a1aa",
    marginTop: 24,
  },
  footer: {
    fontSize: 9,
    color: "#a1a1aa",
    marginTop: 30,
    textAlign: "center",
  },
});

type CertificateProps = {
  studentName: string;
  levelTitle: string;
  levelNumber: number;
  graduatedAt: string;
  graduatedBy: string;
};

function CertificateDocument({
  studentName,
  levelTitle,
  levelNumber,
  graduatedAt,
  graduatedBy,
}: CertificateProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.org}>Pleros Ministries &amp; Missions</Text>
          <Text style={styles.title}>Certificate of Completion</Text>
          <Text style={styles.subtitle}>Pleros Perfecting Courses</Text>

          <Text style={styles.detail}>This certifies that</Text>
          <Text style={styles.name}>{studentName}</Text>
          <Text style={styles.detail}>has successfully completed</Text>
          <Text style={styles.levelTitle}>{levelTitle}</Text>
          <Text style={styles.detail}>Level {levelNumber} of the PPC curriculum</Text>

          <Text style={styles.date}>
            Graduated on {graduatedAt} · Approved by {graduatedBy}
          </Text>

          <Text style={styles.footer}>
            Pleros Perfecting Courses · ppc.pleros.org
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateCertificatePdf(
  props: CertificateProps,
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <CertificateDocument {...props} />,
  );
  return Buffer.from(buffer);
}
