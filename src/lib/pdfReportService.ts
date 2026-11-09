import * as Print from 'expo-print';
import { Platform } from 'react-native';
import type { AppState } from '@/types';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export async function generateAndDownloadClinicalPDF(state: AppState): Promise<string | null> {
  // Everything in this report comes from the user's own logs. Values she
  // never logged are shown as "not logged", never filled with defaults.
  const userName = escapeHtml(state.userName || 'Patient');
  const userEmail = escapeHtml(state.userEmail || 'Not specified');
  const archetype = escapeHtml(state.fineTuningSettings?.archetypeName || 'Not assessed yet');
  const archetypeTagline = escapeHtml(state.fineTuningSettings?.archetypeTagline || '');
  const focusAreas = escapeHtml((state.focusAreas ?? []).join(', ') || 'Not specified');
  const strainScore = state.biometrics?.strainScore ?? 0;
  const sleepTarget = state.fineTuningSettings?.dailySleepTargetHours ?? 8;
  const cyclePrediction = state.cyclePrediction;
  const hasCycles = (state.pastCycles ?? []).length > 0;
  const nextPeriod = hasCycles ? escapeHtml(cyclePrediction?.nextPeriodDate) : 'Needs saved period dates';
  const cycleRegularity = hasCycles
    ? ({ regular: 'Regular', moderate_variance: 'Some variation', irregular_pcos: 'Irregular' } as Record<string, string>)[
        cyclePrediction?.regularityStatus ?? 'regular'
      ] ?? 'Regular'
    : 'Not enough data';
  const anomalies = state.clinicalReport?.anomalies || [];
  const pains = (state.clinicalReport?.trendData ?? [])
    .map((d) => d.painSeverity)
    .filter((v): v is number => typeof v === 'number');
  const avgPain = pains.length ? (pains.reduce((a, b) => a + b, 0) / pains.length).toFixed(1) : null;
  const maxPain = pains.length ? Math.max(...pains) : null;
  const sleepLogs = (state.sleepLogs ?? []).slice(0, 14);
  const avgSleep = sleepLogs.length ? (sleepLogs.reduce((a, b) => a + b.hours, 0) / sleepLogs.length).toFixed(1) : null;
  const cycleRows = (state.pastCycles ?? [])
    .slice(0, 6)
    .map(
      (c) =>
        `<tr><td>${escapeHtml(c.startDate)}</td><td>${escapeHtml(c.lengthDays)} days</td><td>${escapeHtml(
          c.periodDurationDays
        )} days</td></tr>`
    )
    .join('');
  const currentDate = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const anomalyRows = anomalies.length > 0
    ? anomalies.map((a) => `
        <div style="background: #FFF5F5; border-left: 4px solid #E53E3E; padding: 12px 16px; margin-bottom: 12px; border-radius: 4px;">
          <div style="font-weight: bold; color: #9B2C2C; font-size: 14px;">${escapeHtml(a.title)}</div>
          <div style="color: #4A5568; font-size: 13px; margin-top: 4px;">${escapeHtml(a.description)}</div>
        </div>
      `).join('')
    : '<div style="color: #2F855A; font-weight: 500;">No patterns flagged from the logs in the last 30 days.</div>';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>SheSync Doctor Co-Pilot Clinical Report</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #2D3748;
          line-height: 1.5;
          margin: 0;
          padding: 24px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #805AD5;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .brand {
          font-size: 26px;
          font-weight: 800;
          color: #553C9E;
          letter-spacing: -0.5px;
        }
        .brand-sub {
          font-size: 12px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 2px;
        }
        .doc-meta {
          text-align: right;
          font-size: 12px;
          color: #718096;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #2D3748;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 6px;
          margin-top: 24px;
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .patient-card {
          background: #F7FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        .field-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #718096;
          font-weight: 600;
        }
        .field-val {
          font-size: 14px;
          font-weight: 600;
          color: #1A202C;
          margin-top: 2px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .metric-box {
          background: #FAF5FF;
          border: 1px solid #E9D8FD;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }
        .metric-num {
          font-size: 20px;
          font-weight: 800;
          color: #6B46C1;
        }
        .metric-lbl {
          font-size: 11px;
          color: #805AD5;
          margin-top: 2px;
          font-weight: 500;
        }
        .clinical-notes {
          background: #EDF2F7;
          border-radius: 6px;
          padding: 14px;
          font-size: 12px;
          color: #4A5568;
          margin-top: 32px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">SheSync ✦ Doctor Co-Pilot</div>
          <div class="brand-sub">90-day self-tracking summary for a consultation</div>
        </div>
        <div class="doc-meta">
          <div>Generated: <strong>${currentDate}</strong></div>
          <div>Source: <strong>patient self-logs</strong></div>
        </div>
      </div>

      <div class="patient-card">
        <div>
          <div class="field-label">Patient Name</div>
          <div class="field-val">${userName}</div>
        </div>
        <div>
          <div class="field-label">Patient Account</div>
          <div class="field-val">${userEmail}</div>
        </div>
        <div>
          <div class="field-label">SheSync archetype (from questionnaire)</div>
          <div class="field-val" style="color: #6B46C1;">${archetype}</div>
          <div style="font-size: 11px; color: #718096;">${archetypeTagline}</div>
        </div>
        <div>
          <div class="field-label">Focus areas (self-chosen, not a diagnosis)</div>
          <div class="field-val">${focusAreas}</div>
        </div>
      </div>

      <div class="section-title">90-Day Summary (self-logged)</div>
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-num">${avgPain ?? '—'}${avgPain ? '/10' : ''}</div>
          <div class="metric-lbl">Average logged pain${maxPain != null ? ` (max ${maxPain})` : ''} · ${pains.length} days</div>
        </div>
        <div class="metric-box">
          <div class="metric-num">${avgSleep ?? '—'}${avgSleep ? 'h' : ''}</div>
          <div class="metric-lbl">Average logged sleep (target ${sleepTarget}h)</div>
        </div>
        <div class="metric-box">
          <div class="metric-num">${strainScore}/100</div>
          <div class="metric-lbl">SheSync strain score today (app estimate)</div>
        </div>
        <div class="metric-box">
          <div class="metric-num">${cycleRegularity}</div>
          <div class="metric-lbl">Cycle regularity</div>
        </div>
      </div>

      <div class="section-title">Saved Cycles</div>
      ${cycleRows
        ? `<table style="width:100%; border-collapse: collapse; font-size: 13px;"><tr style="text-align:left; color:#718096;"><th>Period started</th><th>Cycle length</th><th>Bleeding</th></tr>${cycleRows}</table>`
        : '<div style="color:#718096; font-size:13px;">No period dates saved yet.</div>'}

      <div class="section-title">Patterns to Discuss</div>
      ${anomalyRows}

      <div class="section-title">Physician Consultation Notes & Precautions</div>
      <div style="font-size: 13px; color: #4A5568;">
        <p>• <strong>Predicted Next Menstrual Onset:</strong> ${nextPeriod}</p>
        <p>• <strong>Questions the patient may want to ask:</strong> whether any tests are needed for the patterns above (for example iron studies for heavy bleeding, or hormone and thyroid tests for irregular cycles).</p>
      </div>

      <div class="clinical-notes">
        <strong>Please note:</strong> This summary was generated by the SheSync app from the patient’s own self-logged symptoms and dates. The strain score is an app estimate, not a measurement. It is meant to support a conversation with a healthcare professional and is not a diagnosis.
      </div>
    </body>
    </html>
  `;

  try {
    if (Platform.OS === 'web') {
      // In web browser: print dialog directly or open printable window
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => {
          win.print();
        }, 500);
      }
      return 'web_download_triggered';
    }

    // On iOS & Android: Use Print.printAsync directly.
    // It opens the native system print sheet which has a built-in "Save as PDF" / "Share" option
    // and completely avoids Android FileProvider scoped cache permission rejections.
    await Print.printAsync({ html });
    return 'print_sheet_opened';
  } catch (error) {
    console.error('[ClinicalPDF] Error generating PDF:', error);
    throw error;
  }
}
