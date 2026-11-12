"use client";

import React from "react";
import {
  Briefcase,
  Calendar,
  Code2,
  Globe,
  Link2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { CV_SECTION_LABELS, CV_UI_LABELS } from "@/constants/cv";
import {
  formatCvDateRange,
  formatCvMonthYear,
  getBaseFontPt,
  getFontCssFamily,
  getPaddingConfig,
  isSafeWebUrl,
} from "@/lib/cv-format";
import { getCvTemplate } from "@/lib/cv-templates";
import { isSafeMediaUrl } from "@/lib/orientation-utils";
import type {
  CvLocale,
  CvSectionKey,
  ICvContentData,
  ICvStyleConfig,
} from "@/types/cv";

export interface CvA4RendererProps {
  cv: ICvContentData;
  templateId: string;
  styleConfig: ICvStyleConfig;
  sectionOrder: CvSectionKey[];
  hiddenSections: CvSectionKey[];
  locale: CvLocale;
}

function SectionHeading({
  title,
  accentColor,
  isClassic,
  isSidebar,
}: {
  title: string;
  accentColor: string;
  isClassic: boolean;
  isSidebar?: boolean;
}) {
  return (
    <div
      className="mb-2 pb-1 flex items-center gap-2"
      style={{
        borderBottom: isSidebar
          ? `1.5px solid ${accentColor}55`
          : isClassic
            ? `1.5px solid ${accentColor}`
            : `1px solid #cbd5e1`,
      }}
    >
      <h2
        className="font-bold uppercase tracking-wider"
        style={{
          color: accentColor,
          fontSize: isSidebar ? "0.95em" : "1.02em",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

export function CvA4Renderer({
  cv,
  templateId,
  styleConfig,
  sectionOrder,
  hiddenSections,
  locale,
}: CvA4RendererProps) {
  const template = getCvTemplate(templateId);
  const labels = CV_SECTION_LABELS[locale];
  const ui = CV_UI_LABELS[locale];
  const hiddenSet = new Set<CvSectionKey>(hiddenSections);

  const fontCss = getFontCssFamily(styleConfig.fontFamily);
  const basePt = getBaseFontPt(styleConfig.fontSizeScale);
  const paddingPx = getPaddingConfig(styleConfig.pagePadding).px;
  const accent = styleConfig.accentColor || template.defaultStyleConfig.accentColor;
  const isClassic = template.style === "CLASSIC_EXECUTIVE";
  const showAvatar =
    template.supportsAvatar &&
    styleConfig.showAvatar &&
    Boolean(cv.personalInfo.avatarUrl) &&
    isSafeMediaUrl(cv.personalInfo.avatarUrl);

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

  const renderSection = (key: CvSectionKey, inSidebar = false) => {
    if (!hasSectionData(key)) return null;

    switch (key) {
      case "summary":
        return (
          <section key="summary" className="mb-4">
            <SectionHeading
              title={labels.summary}
              accentColor={accent}
              isClassic={isClassic}
              isSidebar={inSidebar}
            />
            <p className="text-slate-700 whitespace-pre-line">{cv.summary}</p>
          </section>
        );

      case "education":
        return (
          <section key="education" className="mb-4">
            <SectionHeading
              title={labels.education}
              accentColor={accent}
              isClassic={isClassic}
              isSidebar={inSidebar}
            />
            <div className="space-y-2.5">
              {cv.education.map((edu) => {
                const dateText = formatCvDateRange(
                  edu.startDate,
                  edu.endDate,
                  edu.isCurrent,
                  locale
                );
                return (
                  <div key={edu.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-bold text-slate-900">{edu.school}</p>
                      {dateText && (
                        <span className="text-[0.9em] text-slate-500 shrink-0 font-medium">
                          {dateText}
                        </span>
                      )}
                    </div>
                    {(edu.degree || edu.major || edu.gpa) && (
                      <p className="text-slate-700 font-medium">
                        {[edu.degree, edu.major].filter(Boolean).join(" · ")}
                        {edu.gpa ? ` · ${ui.gpa}: ${edu.gpa}` : ""}
                      </p>
                    )}
                    {edu.description && (
                      <p className="text-slate-600 mt-0.5 whitespace-pre-line">
                        {edu.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "experience":
        return (
          <section key="experience" className="mb-4">
            <SectionHeading
              title={labels.experience}
              accentColor={accent}
              isClassic={isClassic}
              isSidebar={inSidebar}
            />
            <div className="space-y-3">
              {cv.experience.map((exp) => {
                const dateText = formatCvDateRange(
                  exp.startDate,
                  exp.endDate,
                  exp.isCurrent,
                  locale
                );
                return (
                  <div key={exp.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-bold text-slate-900">{exp.position}</p>
                      {dateText && (
                        <span className="text-[0.9em] text-slate-500 shrink-0 font-medium">
                          {dateText}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-slate-700">
                      {[exp.company, exp.location].filter(Boolean).join(" · ")}
                    </p>
                    {exp.highlights?.length > 0 && (
                      <ul className="mt-1 space-y-0.5 pl-4 list-disc text-slate-700">
                        {exp.highlights.filter(Boolean).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "projects":
        return (
          <section key="projects" className="mb-4">
            <SectionHeading
              title={labels.projects}
              accentColor={accent}
              isClassic={isClassic}
              isSidebar={inSidebar}
            />
            <div className="space-y-2.5">
              {cv.projects.map((proj) => {
                const dateText = formatCvDateRange(
                  proj.startDate,
                  proj.endDate,
                  proj.isCurrent,
                  locale
                );
                return (
                  <div key={proj.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-bold text-slate-900">{proj.name}</span>
                        {proj.role && (
                          <span className="text-[0.92em] text-slate-600 font-medium">
                            ({proj.role})
                          </span>
                        )}
                      </div>
                      {dateText && (
                        <span className="text-[0.9em] text-slate-500 shrink-0 font-medium">
                          {dateText}
                        </span>
                      )}
                    </div>
                    {proj.technologies && (
                      <p className="text-[0.92em] text-slate-600">
                        <span className="font-semibold">{ui.technologies}:</span>{" "}
                        {proj.technologies}
                      </p>
                    )}
                    {isSafeWebUrl(proj.link) && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-[0.9em] underline break-all"
                        style={{ color: accent }}
                      >
                        {proj.link}
                      </a>
                    )}
                    {proj.highlights?.length > 0 && (
                      <ul className="mt-1 space-y-0.5 pl-4 list-disc text-slate-700">
                        {proj.highlights.filter(Boolean).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "skills":
        return (
          <section key="skills" className="mb-4">
            <SectionHeading
              title={labels.skills}
              accentColor={accent}
              isClassic={isClassic}
              isSidebar={inSidebar}
            />
            <div className="space-y-2">
              {cv.skills
                .filter((g) => g.items.length > 0)
                .map((group) => (
                  <div key={group.id}>
                    <p className="font-semibold text-slate-900 mb-0.5">
                      {group.groupName}
                    </p>
                    {inSidebar ? (
                      <div className="flex flex-wrap gap-1">
                        {group.items.map((item) => (
                          <span
                            key={item.id}
                            className="inline-block rounded px-1.5 py-0.5 text-[0.9em] font-medium bg-white/80 border border-slate-200 text-slate-700"
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-700">
                        {group.items.map((item) => item.name).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </section>
        );

      case "achievements":
        return (
          <section key="achievements" className="mb-4">
            <SectionHeading
              title={labels.achievements}
              accentColor={accent}
              isClassic={isClassic}
              isSidebar={inSidebar}
            />
            <div className="space-y-1.5">
              {cv.achievements.map((ach) => (
                <div key={ach.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-slate-900">{ach.title}</p>
                    {ach.year ? (
                      <span
                        className="text-[0.9em] font-semibold shrink-0"
                        style={{ color: accent }}
                      >
                        {ach.year}
                      </span>
                    ) : null}
                  </div>
                  {ach.issuer && (
                    <p className="text-[0.92em] text-slate-600">{ach.issuer}</p>
                  )}
                  {ach.description && (
                    <p className="text-slate-600 text-[0.93em] whitespace-pre-line">
                      {ach.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case "activities":
        return (
          <section key="activities" className="mb-4">
            <SectionHeading
              title={labels.activities}
              accentColor={accent}
              isClassic={isClassic}
              isSidebar={inSidebar}
            />
            <div className="space-y-2.5">
              {cv.activities.map((act) => {
                const dateText = formatCvDateRange(
                  act.startDate,
                  act.endDate,
                  act.isCurrent,
                  locale
                );
                return (
                  <div key={act.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-bold text-slate-900">{act.name}</p>
                      {dateText && (
                        <span className="text-[0.9em] text-slate-500 shrink-0 font-medium">
                          {dateText}
                        </span>
                      )}
                    </div>
                    {(act.role || act.organization) && (
                      <p className="font-medium text-slate-700">
                        {[act.role, act.organization].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {act.description && (
                      <p className="text-slate-600 mt-0.5 whitespace-pre-line">
                        {act.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "certifications":
        return (
          <section key="certifications" className="mb-4">
            <SectionHeading
              title={labels.certifications}
              accentColor={accent}
              isClassic={isClassic}
              isSidebar={inSidebar}
            />
            <div className="space-y-1.5">
              {cv.certifications.map((cert) => {
                const dateStr = formatCvMonthYear(cert.issueDate);
                return (
                  <div key={cert.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {cert.name}
                        {cert.scoreOrLevel ? ` — ${cert.scoreOrLevel}` : ""}
                      </p>
                      {dateStr && (
                        <span className="text-[0.9em] text-slate-500 shrink-0">
                          {dateStr}
                        </span>
                      )}
                    </div>
                    {cert.issuer && (
                      <p className="text-[0.92em] text-slate-600">{cert.issuer}</p>
                    )}
                    {isSafeWebUrl(cert.credentialUrl) && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-[0.88em] underline break-all"
                        style={{ color: accent }}
                      >
                        {ui.credential}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "custom":
        return (
          <React.Fragment key="custom">
            {cv.customSections
              .filter((sec) => sec.items.length > 0)
              .map((sec) => (
                <section key={sec.id} className="mb-4">
                  <SectionHeading
                    title={sec.sectionTitle}
                    accentColor={accent}
                    isClassic={isClassic}
                    isSidebar={inSidebar}
                  />
                  <div className="space-y-2">
                    {sec.items.map((item) => (
                      <div key={item.id}>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          {item.dateText && (
                            <span className="text-[0.9em] text-slate-500 shrink-0">
                              {item.dateText}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <p className="font-medium text-slate-700">{item.subtitle}</p>
                        )}
                        {item.description && (
                          <p className="text-slate-600 whitespace-pre-line">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
          </React.Fragment>
        );

      default:
        return null;
    }
  };

  const contacts = [
    cv.personalInfo.email
      ? { icon: Mail, text: cv.personalInfo.email, href: "" }
      : null,
    cv.personalInfo.phone
      ? { icon: Phone, text: cv.personalInfo.phone, href: "" }
      : null,
    cv.personalInfo.location
      ? { icon: MapPin, text: cv.personalInfo.location, href: "" }
      : null,
    cv.personalInfo.dateOfBirth
      ? { icon: Calendar, text: `${ui.dateOfBirth}: ${cv.personalInfo.dateOfBirth}`, href: "" }
      : null,
    cv.personalInfo.linkedin
      ? { icon: Briefcase, text: cv.personalInfo.linkedin.replace(/^https?:\/\//, ""), href: cv.personalInfo.linkedin }
      : null,
    cv.personalInfo.github
      ? { icon: Code2, text: cv.personalInfo.github.replace(/^https?:\/\//, ""), href: cv.personalInfo.github }
      : null,
    cv.personalInfo.portfolio
      ? { icon: Link2, text: cv.personalInfo.portfolio.replace(/^https?:\/\//, ""), href: cv.personalInfo.portfolio }
      : null,
    cv.personalInfo.website
      ? { icon: Globe, text: cv.personalInfo.website.replace(/^https?:\/\//, ""), href: cv.personalInfo.website }
      : null,
  ].filter(Boolean) as Array<{ icon: React.ElementType; text: string; href: string }>;

  const headerCentered = styleConfig.headerAlign === "center";

  const renderHeader = () => (
    <header
      className={`pb-3.5 mb-4 border-b-2 flex gap-4 ${
        headerCentered ? "flex-col items-center text-center" : "items-start justify-between"
      }`}
      style={{ borderColor: accent }}
    >
      <div className="min-w-0 flex-1">
        <h1
          className="font-extrabold tracking-tight leading-tight uppercase"
          style={{
            color: accent,
            fontSize: "2.05em",
          }}
        >
          {cv.personalInfo.fullName || "HỌ VÀ TÊN"}
        </h1>
        {cv.personalInfo.jobTitle && (
          <p
            className="font-semibold text-slate-700 mt-0.5"
            style={{ fontSize: "1.15em" }}
          >
            {cv.personalInfo.jobTitle}
          </p>
        )}
        {contacts.length > 0 && (
          <div
            className={`mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[0.92em] text-slate-600 ${
              headerCentered ? "justify-center" : "justify-start"
            }`}
          >
            {contacts.map((c, idx) => {
              const Icon = c.icon;
              return (
                <span key={idx} className="inline-flex items-center gap-1">
                  <Icon className="h-3 w-3 shrink-0" style={{ color: accent }} />
                  {isSafeWebUrl(c.href) ? (
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="hover:underline break-all"
                    >
                      {c.text}
                    </a>
                  ) : (
                    <span>{c.text}</span>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {showAvatar && (
        <div
          className="h-20 w-20 rounded-xl overflow-hidden shrink-0 border-2 bg-slate-100"
          style={{ borderColor: accent }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cv.personalInfo.avatarUrl}
            alt={cv.personalInfo.fullName}
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </header>
  );

  const isTwoCol = template.layoutType !== "single-column";
  const sidebarKeySet = new Set<CvSectionKey>(template.sidebarSections || []);
  const sidebarOrder = sectionOrder.filter((k) => sidebarKeySet.has(k));
  const mainOrder = sectionOrder.filter((k) => !sidebarKeySet.has(k));

  return (
    <div
      className="bg-white text-slate-800 w-[794px] min-h-[1123px] box-border relative"
      style={{
        fontFamily: fontCss,
        fontSize: `${basePt}pt`,
        lineHeight: styleConfig.lineHeight,
        padding: `${paddingPx}px`,
      }}
    >
      {renderHeader()}

      {!isTwoCol ? (
        <div>{sectionOrder.map((key) => renderSection(key, false))}</div>
      ) : (
        <div
          className={`grid gap-5 items-start ${
            template.layoutType === "two-column-left"
              ? "grid-cols-[230px_1fr]"
              : "grid-cols-[1fr_230px]"
          }`}
        >
          {template.layoutType === "two-column-left" ? (
            <>
              <aside
                className="rounded-xl p-3.5"
                style={{ backgroundColor: `${accent}0D` }}
              >
                {sidebarOrder.map((key) => renderSection(key, true))}
              </aside>
              <div className="min-w-0">
                {mainOrder.map((key) => renderSection(key, false))}
              </div>
            </>
          ) : (
            <>
              <div className="min-w-0">
                {mainOrder.map((key) => renderSection(key, false))}
              </div>
              <aside
                className="rounded-xl p-3.5"
                style={{ backgroundColor: `${accent}0D` }}
              >
                {sidebarOrder.map((key) => renderSection(key, true))}
              </aside>
            </>
          )}
        </div>
      )}
    </div>
  );
}

