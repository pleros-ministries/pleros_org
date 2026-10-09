import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f7fbfd",
    padding: 34,
    fontFamily: "Helvetica",
  },
  frame: {
    width: "100%",
    height: "100%",
    border: "2pt solid #061056",
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: "#5d6a87",
    marginBottom: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: "#061056",
    marginBottom: 8,
  },
  subtitle: { fontSize: 13, color: "#52617b", marginBottom: 34 },
  name: {
    fontSize: 28,
    fontWeight: 700,
    color: "#101a3f",
    marginBottom: 16,
  },
  detail: { fontSize: 13, color: "#52617b", marginBottom: 6 },
  cohort: {
    fontSize: 18,
    fontWeight: 700,
    color: "#061056",
    marginTop: 10,
    marginBottom: 24,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#061056",
    marginTop: 10,
    marginBottom: 14,
  },
  verification: { fontSize: 9, color: "#7d889c", marginTop: 26 },
  accent: { width: 72, height: 5, backgroundColor: "#cbe96b", marginBottom: 28 },
});

type SogpCertificateProps = {
  studentName: string;
  cohortTitle: string;
  issuedAt: string;
  verificationCode: string;
};

type SogpCertificateVariant =
  | { kind: "completion" }
  | { kind: "week"; week: number; weekTitle: string };

function SogpCertificateDocument({
  variant = { kind: "completion" },
  ...props
}: SogpCertificateProps & { variant?: SogpCertificateVariant }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <Text style={styles.eyebrow}>Pleros Ministries and Missions</Text>
          <Text style={styles.title}>School of God&apos;s Purpose</Text>
          <View style={styles.accent} />
          <Text style={styles.subtitle}>
            {variant.kind === "week"
              ? `Week ${variant.week} certificate`
              : "Certificate of Completion"}
          </Text>
          <Text style={styles.detail}>This certifies that</Text>
          <Text style={styles.name}>{props.studentName}</Text>
          {variant.kind === "week" ? (
            <>
              <Text style={styles.detail}>
                completed Week {variant.week} of the School of God&apos;s Purpose
              </Text>
              <Text style={styles.weekTitle}>{variant.weekTitle}</Text>
              <Text style={styles.detail}>{props.cohortTitle}</Text>
            </>
          ) : (
            <>
              <Text style={styles.detail}>completed the four-week SOGP curriculum</Text>
              <Text style={styles.cohort}>{props.cohortTitle}</Text>
            </>
          )}
          <Text style={styles.detail}>Issued {props.issuedAt}</Text>
          <Text style={styles.verification}>Verification: {props.verificationCode}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateSogpCertificatePdf(props: SogpCertificateProps) {
  const buffer = await renderToBuffer(<SogpCertificateDocument {...props} />);
  return Buffer.from(buffer);
}

export async function generateSogpWeekCertificatePdf(
  props: SogpCertificateProps & { week: number; weekTitle: string },
) {
  const { week, weekTitle, ...rest } = props;
  const buffer = await renderToBuffer(
    <SogpCertificateDocument {...rest} variant={{ kind: "week", week, weekTitle }} />,
  );
  return Buffer.from(buffer);
}

/** The issue date as every SOGP certificate prints it, in Lagos time. */
export function formatSogpCertificateDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(date);
}
