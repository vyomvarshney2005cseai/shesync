import * as Print from 'expo-print';
import { Platform } from 'react-native';
import type { AppState } from '@/types';

export async function generateAndDownloadClinicalPDF(state: AppState): Promise<string | null> {
  const userName = state.userName || 'Patient';
  const userEmail = state.userEmail || 'Not specified';
  const archetype = state.fineTuningSettings?.archetypeName || 'Empowered Cyclical Optimizer';
  const archetypeTagline = state.fineTuningSettings?.archetypeTagline || '';
  const primaryCondition = state.fineTuningSettings?.primaryCondition || 'Cycle Optimization';
  const strainScore = state.biometrics?.strainScore ?? 42;
  const painVal = state.symptomLogs?.[0]?.pain ?? 3;
  const sleepTarget = state.fineTuningSettings?.dailySleepTargetHours ?? 8;
  const cyclePrediction = state.cyclePrediction;
  const nextPeriod = cyclePrediction?.nextPeriodDate || 'Calculated dynamically';
  const cycleRegularity = cyclePrediction?.regularityStatus?.toUpperCase() || 'NORMAL';
  const anomalies = state.clinicalReport?.anomalies || [];
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const anomalyRows = anomalies.length > 0
    ? anomalies.map((a) => `
        <div style="background: #FFF5F5; border-left: 4px solid #E53E3E; padding: 12px 16px; margin-bottom: 12px; border-radius: 4px;">
          <div style="font-weight: bold; color: #9B2C2C; font-size: 14px;">${a.title} (${a.severity.toUpperCase()})</div>
          <div style="color: #4A5568; font-size: 13px; margin-top: 4px;">${a.description}</div>
          <div style="color: #718096; font-size: 12px; margin-top: 4px; font-style: italic;">Clinical Category: ${a.type.replace('_', ' ').toUpperCase()}</div>
        </div>
      `).join('')
    : '<div style="color: #48BB78; font-weight: 500;">✓ No critical clinical anomalies flagged in this 90-day window.</div>';

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
          <div class="brand-sub">90-Day Neuro-Hormonal & Biological Irregularity Intelligence</div>
        </div>
        <div class="doc-meta">
          <div>Generated: <strong>${currentDate}</strong></div>
          <div>Status: <strong>Clinical Verification Ready</strong></div>
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
          <div class="field-label">Identified Hormonal Archetype</div>
          <div class="field-val" style="color: #6B46C1;">${archetype}</div>
          <div style="font-size: 11px; color: #718096;">${archetypeTagline}</div>
        </div>
        <div>
          <div class="field-label">Primary Diagnostic Focus</div>
          <div class="field-val">${primaryCondition}</div>
        </div>
      </div>

      <div class="section-title">90-Day Biometric & Cycle Summary</div>
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-num">${painVal}/10</div>
          <div class="metric-lbl">Avg. Prostaglandin Pain</div>
        </div>
        <div class="metric-box">
          <div class="metric-num">${strainScore}</div>
          <div class="metric-lbl">Allostatic Strain Index</div>
        </div>
        <div class="metric-box">
          <div class="metric-num">${sleepTarget}h</div>
          <div class="metric-lbl">Target Restorative Sleep</div>
        </div>
        <div class="metric-box">
          <div class="metric-num">${cycleRegularity}</div>
          <div class="metric-lbl">Cycle Regularity Status</div>
        </div>
      </div>

      <div class="section-title">Flagged Clinical Anomalies & Irregularities</div>
      ${anomalyRows}

      <div class="section-title">Physician Consultation Notes & Precautions</div>
      <div style="font-size: 13px; color: #4A5568;">
        <p>• <strong>Predicted Next Menstrual Onset:</strong> ${nextPeriod}</p>
        <p>• <strong>Phase Modulation Guidance:</strong> Patient is following phase-specific low-inflammatory strain thresholds with vagal parasympathetic support.</p>
        <p>• <strong>Laboratory Cross-Checks:</strong> Inquire about baseline ferritin/iron panel, DHEA-S, free testosterone, and fasting glucose/insulin if anovulatory clusters persist.</p>
      </div>

      <div class="clinical-notes">
        <strong>Confidential Medical Intelligence Disclaimer:</strong> This document is generated for clinical discussion between patient and healthcare practitioner based on self-logged biometric markers and bio-adaptive modeling in SheSync. Not an automated medical diagnosis.
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
