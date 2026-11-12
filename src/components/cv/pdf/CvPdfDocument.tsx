"use client";

import React from "react";
import {
  Document,
  Image as PdfImage,
  Link as PdfLink,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { CV_SECTION_LABELS, CV_UI_LABELS } from "@/constants/cv";
import {
  formatCvDateRange,
  formatCvMonthYear,
  getBaseFontPt,
  getPaddingConfig,
  isSafeWebUrl,
} from "@/lib/cv-format";
import { getCvTemplate } from "@/lib/cv-templates";
import { ensurePdfFontsRegistered } from "@/components/cv/pdf/registerPdfFonts";
import type {
  CvLocale,
  CvSectionKey,
  ICvContentData,
  ICvStyleConfig,
} from "@/types/cv";

ensurePdfFontsRegistered();

export interface CvPdfDocumentProps {
  cv: ICvContentData;
  templateId: string;
  styleConfig: ICvStyleConfig;
  sectionOrder: CvSectionKey[];
  hiddenSections: CvSectionKey[];
  locale: CvLocale;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#1e293b",
  },
  header: {
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1.5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerCenter: {
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1.5,
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 7,
    gap: 8,
  },
  section: {
    marginBottom: 11,
  },
  sectionHeadingWrap: {
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  itemBlock: {
    marginBottom: 6,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 1.5,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 9,
    fontWeight: 700,
  },
  twoColWrap: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  sidebarCol: {
    width: "32%",
    padding: 9,
    borderRadius: 6,
  },
  mainCol: {
    width: "68%",
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 8,
    objectFit: "cover",
    borderWidth: 1.5,
  },
});

export function CvPdfDocument({
  cv,
  templateId,
  styleConfig,
  sectionOrder,
  hiddenSections,
  locale,
}: CvPdfDocumentProps) {
  ensurePdfFontsRegistered();

  const template = getCvTemplate(templateId);
  const labels = CV_SECTION_LABELS[locale];
  const ui = CV_UI_LABELS[locale];
  const hiddenSet = new Set<CvSectionKey>(hiddenSections);

  const fontFamily = styleConfig.fontFamily || "Inter";
  const basePt = getBaseFontPt(styleConfig.fontSizeScale);
  const paddingPt = getPaddingConfig(styleConfig.pagePadding).pt;
  const accent = styleConfig.accentColor || template.defaultStyleConfig.accentColor;
  const lineHeight = styleConfig.lineHeight || 1.45;
  const isClassic = template.style === "CLASSIC_EXECUTIVE";

  const hasSectionData = (key: CvSectionKey): boolean => {
    if (hiddenSet.has(key)) return false;
    switch (key) {
      case "summary":
        return Boolean(cv.summary?.trim());
      case "education":
        return (cv.education?.length ?? 0) > 0;
      case "experience":
        return (cv.experience?.length ?? 0) > 0;
      case "skills":
        return (cv.skills || []).some((g) => g.items.length > 0);
      case "projects":
        return (cv.projects?.length ?? 0) > 0;
      case "achievements":
        return (cv.achievements?.length ?? 0) > 0;
      case "activities":
        return (cv.activities?.length ?? 0) > 0;
      case "certifications":
        return (cv.certifications?.length ?? 0) > 0;
      case "custom":
        return (cv.customSections || []).some((s) => s.items.length > 0);
      default:
        return false;
    }
  };

  const renderHeading = (title: string) => (
    <View
      minPresenceAhead={40}
      style={[
        styles.sectionHeadingWrap,
        isClassic ? { borderBottomColor: accent, borderBottomWidth: 1.3 } : {},
      ]}
    >
      <Text
        style={{
          fontSize: basePt + 0.5,
          lineHeight: 1.3,
          fontWeight: 700,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {title}
      </Text>
    </View>
  );

  const renderSection = (key: CvSectionKey) => {
    if (!hasSectionData(key)) return null;

    switch (key) {
      case "summary":
        return (
          <View key="summary" style={styles.section}>
            {renderHeading(labels.summary)}
            <Text style={{ fontSize: basePt, lineHeight, color: "#334155" }}>
              {cv.summary}
            </Text>
          </View>
        );

      case "education":
        return (
          <View key="education" style={styles.section}>
            {renderHeading(labels.education)}
            {cv.education.map((edu) => {
              const dateText = formatCvDateRange(
                edu.startDate,
                edu.endDate,
                edu.isCurrent,
                locale
              );
              return (
                <View key={edu.id} wrap={false} style={styles.itemBlock}>
                  <View style={styles.rowBetween}>
                    <Text
                      style={{
                        fontSize: basePt,
                        fontWeight: 700,
                        color: "#0f172a",
                        flex: 1,
                      }}
                    >
                      {edu.school}
                    </Text>
                    {dateText ? (
                      <Text
                        style={{
                          fontSize: basePt - 1,
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        {dateText}
                      </Text>
                    ) : null}
                  </View>
                  {edu.degree || edu.major || edu.gpa ? (
                    <Text
                      style={{
                        fontSize: basePt - 0.3,
                        color: "#334155",
                        fontWeight: 600,
                      }}
                    >
                      {[edu.degree, edu.major].filter(Boolean).join(" · ")}
                      {edu.gpa ? ` · ${ui.gpa}: ${edu.gpa}` : ""}
                    </Text>
                  ) : null}
                  {edu.description ? (
                    <Text
                      style={{
                        fontSize: basePt - 0.5,
                        color: "#475569",
                        marginTop: 2,
                      }}
                    >
                      {edu.description}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        );

      case "experience":
        return (
          <View key="experience" style={styles.section}>
            {renderHeading(labels.experience)}
            {cv.experience.map((exp) => {
              const dateText = formatCvDateRange(
                exp.startDate,
                exp.endDate,
                exp.isCurrent,
                locale
              );
              return (
                <View key={exp.id} wrap={false} style={styles.itemBlock}>
                  <View style={styles.rowBetween}>
                    <Text
                      style={{
                        fontSize: basePt,
                        fontWeight: 700,
                        color: "#0f172a",
                        flex: 1,
                      }}
                    >
                      {exp.position}
                    </Text>
                    {dateText ? (
                      <Text style={{ fontSize: basePt - 1, color: "#64748b" }}>
                        {dateText}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={{
                      fontSize: basePt - 0.3,
                      fontWeight: 600,
                      color: "#334155",
                    }}
                  >
                    {[exp.company, exp.location].filter(Boolean).join(" · ")}
                  </Text>
                  {exp.highlights?.filter(Boolean).map((line, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={[styles.bulletDot, { fontSize: basePt }]}>•</Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: basePt - 0.3,
                          color: "#334155",
                        }}
                      >
                        {line}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        );

      case "projects":
        return (
          <View key="projects" style={styles.section}>
            {renderHeading(labels.projects)}
            {cv.projects.map((proj) => {
              const dateText = formatCvDateRange(
                proj.startDate,
                proj.endDate,
                proj.isCurrent,
                locale
              );
              return (
                <View key={proj.id} wrap={false} style={styles.itemBlock}>
                  <View style={styles.rowBetween}>
                    <Text
                      style={{
                        fontSize: basePt,
                        fontWeight: 700,
                        color: "#0f172a",
                        flex: 1,
                      }}
                    >
                      {proj.name}
                      {proj.role ? ` (${proj.role})` : ""}
                    </Text>
                    {dateText ? (
                      <Text style={{ fontSize: basePt - 1, color: "#64748b" }}>
                        {dateText}
                      </Text>
                    ) : null}
                  </View>
                  {proj.technologies ? (
                    <Text style={{ fontSize: basePt - 0.5, color: "#475569" }}>
                      {ui.technologies}: {proj.technologies}
                    </Text>
                  ) : null}
                  {isSafeWebUrl(proj.link) && proj.link ? (
                    <PdfLink
                      src={proj.link}
                      style={{ fontSize: basePt - 0.7, color: accent }}
                    >
                      {proj.link}
                    </PdfLink>
                  ) : null}
                  {proj.highlights?.filter(Boolean).map((line, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={[styles.bulletDot, { fontSize: basePt }]}>•</Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: basePt - 0.3,
                          color: "#334155",
                        }}
                      >
                        {line}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        );

      case "skills":
        return (
          <View key="skills" style={styles.section}>
            {renderHeading(labels.skills)}
            {cv.skills
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <View key={group.id} wrap={false} style={{ marginBottom: 4 }}>
                  <Text
                    style={{
                      fontSize: basePt - 0.2,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {group.groupName}
                  </Text>
                  <Text style={{ fontSize: basePt - 0.3, color: "#334155" }}>
                    {group.items.map((item) => item.name).join(" · ")}
                  </Text>
                </View>
              ))}
          </View>
        );

      case "achievements":
        return (
          <View key="achievements" style={styles.section}>
            {renderHeading(labels.achievements)}
            {cv.achievements.map((ach) => (
              <View key={ach.id} wrap={false} style={{ marginBottom: 4 }}>
                <View style={styles.rowBetween}>
                  <Text
                    style={{
                      fontSize: basePt - 0.1,
                      fontWeight: 600,
                      color: "#0f172a",
                      flex: 1,
                    }}
                  >
                    {ach.title}
                  </Text>
                  {ach.year ? (
                    <Text
                      style={{
                        fontSize: basePt - 0.6,
                        fontWeight: 700,
                        color: accent,
                      }}
                    >
                      {String(ach.year)}
                    </Text>
                  ) : null}
                </View>
                {ach.issuer ? (
                  <Text style={{ fontSize: basePt - 0.6, color: "#475569" }}>
                    {ach.issuer}
                  </Text>
                ) : null}
                {ach.description ? (
                  <Text style={{ fontSize: basePt - 0.5, color: "#475569" }}>
                    {ach.description}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        );

      case "activities":
        return (
          <View key="activities" style={styles.section}>
            {renderHeading(labels.activities)}
            {cv.activities.map((act) => {
              const dateText = formatCvDateRange(
                act.startDate,
                act.endDate,
                act.isCurrent,
                locale
              );
              return (
                <View key={act.id} wrap={false} style={styles.itemBlock}>
                  <View style={styles.rowBetween}>
                    <Text
                      style={{
                        fontSize: basePt,
                        fontWeight: 700,
                        color: "#0f172a",
                        flex: 1,
                      }}
                    >
                      {act.name}
                    </Text>
                    {dateText ? (
                      <Text style={{ fontSize: basePt - 1, color: "#64748b" }}>
                        {dateText}
                      </Text>
                    ) : null}
                  </View>
                  {act.role || act.organization ? (
                    <Text
                      style={{
                        fontSize: basePt - 0.3,
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      {[act.role, act.organization].filter(Boolean).join(" · ")}
                    </Text>
                  ) : null}
                  {act.description ? (
                    <Text
                      style={{
                        fontSize: basePt - 0.4,
                        color: "#475569",
                        marginTop: 1.5,
                      }}
                    >
                      {act.description}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        );

      case "certifications":
        return (
          <View key="certifications" style={styles.section}>
            {renderHeading(labels.certifications)}
            {cv.certifications.map((cert) => {
              const issue = formatCvMonthYear(cert.issueDate);
              return (
                <View key={cert.id} wrap={false} style={{ marginBottom: 4 }}>
                  <View style={styles.rowBetween}>
                    <Text
                      style={{
                        fontSize: basePt - 0.1,
                        fontWeight: 600,
                        color: "#0f172a",
                        flex: 1,
                      }}
                    >
                      {cert.name}
                      {cert.scoreOrLevel ? ` — ${cert.scoreOrLevel}` : ""}
                    </Text>
                    {issue ? (
                      <Text style={{ fontSize: basePt - 1, color: "#64748b" }}>
                        {issue}
                      </Text>
                    ) : null}
                  </View>
                  {cert.issuer ? (
                    <Text style={{ fontSize: basePt - 0.6, color: "#475569" }}>
                      {cert.issuer}
                    </Text>
                  ) : null}
                  {isSafeWebUrl(cert.credentialUrl) && cert.credentialUrl ? (
                    <PdfLink
                      src={cert.credentialUrl}
                      style={{ fontSize: basePt - 0.8, color: accent }}
                    >
                      {cert.credentialUrl}
                    </PdfLink>
                  ) : null}
                </View>
              );
            })}
          </View>
        );

      case "custom":
        return (
          <React.Fragment key="custom">
            {cv.customSections
              .filter((sec) => sec.items.length > 0)
              .map((sec) => (
                <View key={sec.id} style={styles.section}>
                  {renderHeading(sec.sectionTitle)}
                  {sec.items.map((item) => (
                    <View key={item.id} wrap={false} style={{ marginBottom: 5 }}>
                      <View style={styles.rowBetween}>
                        <Text
                          style={{
                            fontSize: basePt,
                            fontWeight: 600,
                            color: "#0f172a",
                            flex: 1,
                          }}
                        >
                          {item.title}
                        </Text>
                        {item.dateText ? (
                          <Text style={{ fontSize: basePt - 1, color: "#64748b" }}>
                            {item.dateText}
                          </Text>
                        ) : null}
                      </View>
                      {item.subtitle ? (
                        <Text style={{ fontSize: basePt - 0.3, color: "#334155" }}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                      {item.description ? (
                        <Text style={{ fontSize: basePt - 0.4, color: "#475569" }}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))}
          </React.Fragment>
        );

      default:
        return null;
    }
  };

  const contactItems = [
    cv.personalInfo.email,
    cv.personalInfo.phone,
    cv.personalInfo.location,
    cv.personalInfo.dateOfBirth
      ? `${ui.dateOfBirth}: ${cv.personalInfo.dateOfBirth}`
      : "",
    cv.personalInfo.linkedin,
    cv.personalInfo.github,
    cv.personalInfo.portfolio,
    cv.personalInfo.website,
  ].filter(Boolean) as string[];

  const rawAvatar = cv.personalInfo.avatarUrl?.trim() || "";
  const resolvedAvatar =
    rawAvatar && typeof window !== "undefined" && rawAvatar.startsWith("/")
      ? `${window.location.origin}${rawAvatar}`
      : rawAvatar;
  const canRenderAvatar =
    template.supportsAvatar &&
    styleConfig.showAvatar &&
    Boolean(resolvedAvatar) &&
    (resolvedAvatar.startsWith("https://") ||
      resolvedAvatar.startsWith("http://") ||
      resolvedAvatar.startsWith("data:image/"));

  const headerCentered = styleConfig.headerAlign === "center";
  const isTwoCol = template.layoutType !== "single-column";
  const sidebarSet = new Set<CvSectionKey>(template.sidebarSections || []);
  const sidebarOrder = sectionOrder.filter((k) => sidebarSet.has(k));
  const mainOrder = sectionOrder.filter((k) => !sidebarSet.has(k));

  return (
    <Document title={cv.personalInfo.fullName || "UNERA CV"}>
      <Page
        size="A4"
        style={[
          styles.page,
          {
            fontFamily,
            fontSize: basePt,
            lineHeight,
            padding: paddingPt,
          },
        ]}
      >
        {/* Header */}
        <View
          style={[
            headerCentered ? styles.headerCenter : styles.header,
            { borderBottomColor: accent },
          ]}
        >
          <View
            style={
              headerCentered
                ? { width: "100%", alignItems: "center" }
                : { flex: 1 }
            }
          >
            <Text
              style={{
                fontSize: basePt * 2,
                lineHeight: 1.25,
                fontWeight: 700,
                color: accent,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {cv.personalInfo.fullName || "HỌ VÀ TÊN"}
            </Text>
            {cv.personalInfo.jobTitle ? (
              <Text
                style={{
                  fontSize: basePt + 1.5,
                  lineHeight: 1.35,
                  fontWeight: 600,
                  color: "#334155",
                  marginTop: 2,
                }}
              >
                {cv.personalInfo.jobTitle}
              </Text>
            ) : null}
            {contactItems.length > 0 ? (
              <View
                style={[
                  styles.contactRow,
                  headerCentered ? { justifyContent: "center" } : {},
                ]}
              >
                {contactItems.map((c, idx) =>
                  isSafeWebUrl(c) ? (
                    <PdfLink
                      key={idx}
                      src={c}
                      style={{ fontSize: basePt - 1, color: accent }}
                    >
                      {c.replace(/^https?:\/\//, "")}
                    </PdfLink>
                  ) : (
                    <Text
                      key={idx}
                      style={{ fontSize: basePt - 1, color: "#475569" }}
                    >
                      {c}
                    </Text>
                  )
                )}
              </View>
            ) : null}
          </View>

          {canRenderAvatar ? (
            <PdfImage
              src={resolvedAvatar}
              style={[styles.avatar, { borderColor: accent }]}
            />
          ) : null}
        </View>

        {/* Body */}
        {!isTwoCol ? (
          <View>{sectionOrder.map((k) => renderSection(k))}</View>
        ) : (
          <View style={styles.twoColWrap}>
            {template.layoutType === "two-column-left" ? (
              <>
                <View style={[styles.sidebarCol, { backgroundColor: "#f1f5f9" }]}>
                  {sidebarOrder.map((k) => renderSection(k))}
                </View>
                <View style={styles.mainCol}>
                  {mainOrder.map((k) => renderSection(k))}
                </View>
              </>
            ) : (
              <>
                <View style={styles.mainCol}>
                  {mainOrder.map((k) => renderSection(k))}
                </View>
                <View style={[styles.sidebarCol, { backgroundColor: "#f1f5f9" }]}>
                  {sidebarOrder.map((k) => renderSection(k))}
                </View>
              </>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

