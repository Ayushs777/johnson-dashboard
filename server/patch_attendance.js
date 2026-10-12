require('dotenv').config();
const fs = require('fs');

const filePath = 'f:/JOHNSON DASHBAORD/server/services/googleSheetsService.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the entire grid detection block (the single for-loop approach)
const oldBlock = `  // 1. Check if this sheet is a monthly matrix grid sheet (like the "Attendance" tab in screenshot)
  let empIdColIdx = -1;
  let empNameColIdx = -1;
  let dayHeaderRowIdx = -1;
  const dayColMap = {}; // { dayNumber: colIndex }
  let gridYear = new Date().getFullYear();
  let gridMonth = new Date().getMonth() + 1; // 1-12

  // Month names for title-row detection (e.g. "September")
  const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];

  for (let r = 0; r < Math.min(15, rows.length); r++) {
    const row = rows[r] || [];

    // --- Month/Year detection ---
    // Strategy 1: find a full date string like "01-09-2026" or "2026-09-01"
    // Strategy 2: find standalone 4-digit year + standalone 1-2 digit month number OR month name
    let rowYearCandidate = 0;
    let rowMonthCandidate = 0;
    row.forEach((cell) => {
      const cellStr = String(cell || '').trim();
      // Full date pattern
      const dMatch = cellStr.match(/(\\d{2})[-/](\\d{2})[-/](\\d{4})/) || cellStr.match(/(\\d{4})[-/](\\d{2})[-/](\\d{2})/);
      if (dMatch) {
        if (dMatch[3] && dMatch[3].length === 4) {
          gridMonth = parseInt(dMatch[2], 10);
          gridYear = parseInt(dMatch[3], 10);
        } else if (dMatch[1] && dMatch[1].length === 4) {
          gridYear = parseInt(dMatch[1], 10);
          gridMonth = parseInt(dMatch[2], 10);
        }
      }
      // Standalone 4-digit year
      if (/^\\d{4}$/.test(cellStr)) {
        const y = parseInt(cellStr, 10);
        if (y >= 2020 && y <= 2099) rowYearCandidate = y;
      }
      // Standalone month number (1-12)
      if (/^\\d{1,2}$/.test(cellStr)) {
        const m = parseInt(cellStr, 10);
        if (m >= 1 && m <= 12) rowMonthCandidate = m;
      }
      // Month name in title
      const lc = cellStr.toLowerCase();
      const mIdx = MONTH_NAMES.findIndex(mn => lc.includes(mn));
      if (mIdx !== -1) rowMonthCandidate = mIdx + 1;
    });
    // Apply standalone year/month only if both found in same row
    if (rowYearCandidate && rowMonthCandidate) {
      gridYear = rowYearCandidate;
      gridMonth = rowMonthCandidate;
    }

    // --- Header detection ---
    row.forEach((cell, cIdx) => {
      const cellStr = String(cell || '').trim();
      const norm = normalizeHeader(cell);
      // Prefer 'empid' or 'ecode' over serial-number-like headers
      if (norm === 'empid' || norm === 'ecode' || norm === 'employeecode' || norm === 'empcode') {
        // Strict ECode headers — always prefer these
        empIdColIdx = cIdx;
        dayHeaderRowIdx = r;
      } else if ((norm === 'sn' || norm === 'sno') && empIdColIdx === -1) {
        // Only fallback to S.No if nothing better found
        empIdColIdx = cIdx;
        dayHeaderRowIdx = r;
      }
      if (norm === 'employeename' || norm === 'name' || norm === 'empname') {
        empNameColIdx = cIdx;
      }
      // Day number detection: handles '01', '1', etc.
      const cleanNumStr = cellStr.replace(/^0+/, '') || '0';
      const dayNum = parseInt(cleanNumStr, 10);
      if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31 && /^\\d{1,2}$/.test(cellStr)) {
        if (!(dayNum in dayColMap)) {
          dayColMap[dayNum] = cIdx;
        }
      }
    });

    if (Object.keys(dayColMap).length >= 5) {
      if (empIdColIdx === -1) empIdColIdx = 1; // Default to Column B (index 1) for Emp ID if header title was omitted
      dayHeaderRowIdx = r;
      break;
    }
  }`;

const newBlock = `  // ── GRID DETECTION (two-pass, row-isolated) ──────────────────────────────────
  // Real sheet layout:
  //   Row 0: Title "ATTENDANCE SHEET FOR THE MONTH OF ..."
  //   Row 1: "Start Date 01-09-2026  End Date 30-09-2026"
  //   Row 2: empty / merged cells
  //   Row 3: COUNT/SUMMARY row — has stray numbers (21, 22, 27 ...) — MUST NOT USE for day mapping
  //   Row 4: Column headers — S.N., EMP ID., DOJ, Employee Name, ..., Tue, Wed, Thu ...
  //   Row 5: Day number row — (empty x10), 01, 02, 03 ... 30
  //   Row 6+: Employee data rows
  //
  // The previous single-pass approach mixed day-number detection across ALL rows,
  // so stray numbers in Row 3 (like 21, 22, 27) were stored first in dayColMap
  // at WRONG column indices, and the "if (!(dayNum in dayColMap))" guard then
  // prevented the correct Row 5 values from overwriting them — causing wrong data.
  //
  // Fix: two separate passes — Pass 1 finds month/year + EMP ID header row,
  //      Pass 2 builds dayColMap ONLY from the row with the most day numbers
  //      in the neighbourhood of the header row.

  let empIdColIdx    = -1;
  let empNameColIdx  = -1;
  let empHeaderRowIdx = -1;  // row that contains S.N., EMP ID., Employee Name ...
  let dayNumRowIdx   = -1;   // row that contains 01, 02, 03 ... 30
  const dayColMap = {};
  let gridYear  = new Date().getFullYear();
  let gridMonth = new Date().getMonth() + 1;

  const MONTH_NAMES = ['january','february','march','april','may','june','july',
                       'august','september','october','november','december'];

  // ── Pass 1: month/year detection + find EMP ID header row ────────────────────
  for (let r = 0; r < Math.min(15, rows.length); r++) {
    const row = rows[r] || [];
    let rowYearCandidate = 0, rowMonthCandidate = 0;

    row.forEach(cell => {
      const s = String(cell || '').trim();
      const dm = s.match(/(\\d{2})[-/](\\d{2})[-/](\\d{4})/) || s.match(/(\\d{4})[-/](\\d{2})[-/](\\d{2})/);
      if (dm) {
        if (dm[3] && dm[3].length === 4) { gridMonth = parseInt(dm[2],10); gridYear = parseInt(dm[3],10); }
        else if (dm[1] && dm[1].length === 4) { gridYear = parseInt(dm[1],10); gridMonth = parseInt(dm[2],10); }
      }
      if (/^\\d{4}$/.test(s)) { const y=parseInt(s,10); if(y>=2020&&y<=2099) rowYearCandidate=y; }
      if (/^\\d{1,2}$/.test(s)) { const m=parseInt(s,10); if(m>=1&&m<=12) rowMonthCandidate=m; }
      const lc = s.toLowerCase();
      const mi = MONTH_NAMES.findIndex(mn => lc.includes(mn));
      if (mi !== -1) rowMonthCandidate = mi + 1;
    });
    if (rowYearCandidate && rowMonthCandidate) { gridYear=rowYearCandidate; gridMonth=rowMonthCandidate; }

    // EMP ID header row — only strict ECode/EmpID column headers qualify
    if (empHeaderRowIdx === -1) {
      row.forEach((cell, cIdx) => {
        const norm = normalizeHeader(cell);
        if (['empid','ecode','employeecode','empcode'].includes(norm)) {
          empIdColIdx = cIdx; empHeaderRowIdx = r;
        }
        if (['employeename','name','empname'].includes(norm) && empNameColIdx === -1) {
          empNameColIdx = cIdx;
        }
      });
    }
  }

  // ── Pass 2: build dayColMap ONLY from the best day-number row ─────────────────
  // Scan empHeaderRowIdx and the 3 rows that follow.
  // Pick whichever row has the most 1–31 day numbers.
  if (empHeaderRowIdx !== -1) {
    let bestRow = -1, bestCount = 0;
    const scanLimit = Math.min(empHeaderRowIdx + 4, rows.length - 1);
    for (let r = empHeaderRowIdx; r <= scanLimit; r++) {
      let cnt = 0;
      (rows[r] || []).forEach(cell => {
        const s = String(cell||'').trim();
        const n = parseInt(s.replace(/^0+/,'')||'0', 10);
        if (!isNaN(n) && n>=1 && n<=31 && /^\\d{1,2}$/.test(s)) cnt++;
      });
      if (cnt > bestCount) { bestCount=cnt; bestRow=r; }
    }
    if (bestRow !== -1 && bestCount >= 5) {
      dayNumRowIdx = bestRow;
      (rows[bestRow] || []).forEach((cell, cIdx) => {
        const s = String(cell||'').trim();
        const n = parseInt(s.replace(/^0+/,'')||'0', 10);
        if (!isNaN(n) && n>=1 && n<=31 && /^\\d{1,2}$/.test(s)) {
          dayColMap[n] = cIdx;
        }
      });
    }
  }

  const dayHeaderRowIdx = dayNumRowIdx !== -1 ? dayNumRowIdx : empHeaderRowIdx;`;

if (!content.includes(oldBlock.slice(0, 80))) {
  console.error('OLD BLOCK NOT FOUND - first 80 chars:', JSON.stringify(oldBlock.slice(0, 80)));
  process.exit(1);
}

const newContent = content.replace(oldBlock, newBlock);
if (newContent === content) {
  console.error('REPLACEMENT FAILED - content unchanged');
  process.exit(1);
}

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('SUCCESS - file updated');
