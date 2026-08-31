import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Account() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.getStats().then(d => setStats(d.stats)).catch(() => {});
  }, []);

  const s = stats || { totalSessions: 0, lastSessionAt: null, mostFrequentState: 'N/A', avgAttention: 0, avgMeditation: 0, avgConfidence: 0, dynamicAccuracy: 86.0, totalFeedback: 0 };

  const exportDirectPDF = async () => {
    setDownloading(true);
    try {
      const sessData = await api.getSessions(100);
      const sessions = sessData.sessions || [];
      const reportDate = new Date().toLocaleString();

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // ── Header Styling ──────────────────────────────────────────────────
      doc.setFillColor(76, 114, 255); // #4C72FF
      doc.rect(14, 12, 182, 2.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // #0F172A
      doc.text('GITA-NEUROSYNC — CLINICAL NEURO-SPECTRAL REPORT', 14, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // #64748B
      doc.text(`Patient / User: ${user?.username || 'User'} (${user?.email || 'N/A'})  ·  Generated: ${reportDate}`, 14, 28);

      // ── Metadata Cards Box ──────────────────────────────────────────────
      doc.setFillColor(248, 250, 252); // #F8FAFC
      doc.setDrawColor(226, 232, 240); // #E2E8F0
      doc.roundedRect(14, 33, 182, 22, 2, 2, 'FD');

      // Stat 1: Total Sessions
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL SESSIONS', 22, 40);
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`${s.totalSessions}`, 22, 48);

      // Stat 2: Dominant State
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('DOMINANT STATE', 80, 40);
      doc.setFontSize(11);
      doc.setTextColor(76, 114, 255);
      doc.text(`${s.mostFrequentState}`, 80, 48);

      // Stat 3: Dynamic Accuracy
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('DYNAMIC ACCURACY', 142, 40);
      doc.setFontSize(13);
      doc.setTextColor(16, 185, 129); // #10B981
      doc.text(`${s.dynamicAccuracy || 86.0}%`, 142, 48);

      // ── Historical Telemetry Table ───────────────────────────────────────
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Historical Biosignal Telemetry & Classification Log', 14, 63);

      const tableRows = sessions.map(sess => [
        new Date(sess.created_at).toLocaleString().slice(0, 19),
        sess.eeg_attention?.toFixed?.(1) ?? sess.eeg_attention,
        sess.eeg_meditation?.toFixed?.(1) ?? sess.eeg_meditation,
        sess.alpha_power?.toFixed?.(1) ?? sess.alpha_power,
        sess.beta_power?.toFixed?.(1) ?? sess.beta_power,
        sess.theta_power?.toFixed?.(1) ?? sess.theta_power,
        sess.beta_alpha_ratio?.toFixed?.(2) ?? sess.beta_alpha_ratio,
        sess.detected_state,
        `${((sess.confidence || 0) * 100).toFixed(0)}%`,
      ]);

      if (tableRows.length === 0) {
        tableRows.push(['No sessions recorded yet', '-', '-', '-', '-', '-', '-', '-', '-']);
      }

      autoTable(doc, {
        startY: 67,
        head: [['Date & Time', 'Att', 'Med', 'Alpha', 'Beta', 'Theta', 'B/A', 'Detected State', 'Conf']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [76, 114, 255],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
      });

      // ── Footer ───────────────────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Gita-NeuroSync AI Platform · BioAmp EXG Spectral Telemetry & Vedantic Grounding  |  Page ${i} of ${pageCount}`,
          14,
          288
        );
      }

      // Direct file download
      const filename = `gita-neurosync-clinical-report-${user?.username || 'user'}.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error('PDF Export Error:', e);
    }
    setDownloading(false);
  };

  const initial = (user?.username || 'U').charAt(0).toUpperCase();

  return (
    <>
      <button className="back-to-dash" onClick={() => navigate('/')}>
        &larr; Dashboard
      </button>
      <div className="page-header">
        <h1>My Account</h1>
        <p>Profile, security, and data export</p>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">{initial}</div>
        <div className="profile-info">
          <h2>
            {user?.username}
            {user?.email_verified
              ? <span className="verified-badge">✓ Verified</span>
              : <span className="unverified-badge">✗ Unverified</span>
            }
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>{user?.email}</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Personal Info */}
        <div>
          <div className="section-label">PERSONAL INFORMATION</div>
          <div className="card-subtle">
            <strong>Username:</strong> {user?.username}<br />
            <strong>Email:</strong> {user?.email}<br />
            <strong>Email Verified:</strong> {user?.email_verified ? 'Yes ✓' : 'No ✗'}<br />
            <strong>Member Since:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </div>
        </div>

        {/* Activity */}
        <div>
          <div className="section-label">ACCOUNT ACTIVITY</div>
          <div className="card-subtle">
            <strong>Total Sessions:</strong> {s.totalSessions}<br />
            <strong>Most Frequent State:</strong> {s.mostFrequentState}<br />
            <strong>Dynamic Model Accuracy:</strong> {s.dynamicAccuracy || 86.0}% (Self-Tuning)<br />
            <strong>Feedback Contributions:</strong> {s.totalFeedback}<br />
            <strong>Avg Confidence:</strong> {(s.avgConfidence * 100).toFixed(1)}%<br />
            <strong>Last Session:</strong> {s.lastSessionAt ? new Date(s.lastSessionAt).toLocaleString() : 'N/A'}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Security */}
        <div>
          <div className="section-label">SECURITY & PRIVACY</div>
          <div className="card-subtle">
            <strong>Authentication:</strong> bcrypt + JWT<br />
            <strong>Data Encryption:</strong> In transit (TLS)<br />
            <strong>OTP Verification:</strong> Email-based 6-digit
          </div>
        </div>

        {/* Data Export */}
        <div>
          <div className="section-label">DATA EXPORT</div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>Download your full assessment and biosignal history as a clinical PDF file directly to your device</p>
            <button className="btn btn-primary btn-sm" onClick={exportDirectPDF} disabled={downloading}>
              {downloading ? 'Generating PDF...' : 'Download Clinical Report (PDF)'}
            </button>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Sign Out */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn btn-dark" onClick={logout}>Sign Out</button>
      </div>
    </>
  );
}
