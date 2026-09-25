/**
 * Bloodchain Operator Cloud - Google Apps Script
 * Handles scheduled automation when local PC is powered off.
 */

// Configuration - Google Sheets IDs
const CONFIG = {
  APPROVAL_SHEET_ID: "1lzSZwAGfBsHlRORcw8vE8Ql38BSF_g1RTtnIbp2Y7w4",
  CRM_SHEET_ID: "1AO6eThWxmzqI7VB0I1Nh7y3f5-51TGQZ-TBdWMvUeNI",
  RESEARCH_SHEET_ID: "1ggJXubPaHJGfx6vMeXL2sf4SUvgafjvZVRBgoxcQcfM",
  CONTENT_CALENDAR_ID: "1gyUIWHD5FuUz3LSWVO8nF-Nh1uavcw7wWwjENdPZWkM",
  OPERATOR_EMAIL: Session.getActiveUser().getEmail()
};

/**
 * 1. Daily Morning Briefing Trigger (Run at 06:00 or 07:00 daily)
 */
function sendMorningBriefing() {
  const dateStr = new Date().toLocaleDateString();
  const approvals = getPendingApprovals();
  const upcomingMeetings = getTodayMeetings();

  let emailBody = `BLOODCHAIN MORNING BRIEFING\nDate: ${dateStr}\n\n`;
  emailBody += `1. Overnight Summary\n`;
  emailBody += ` - Status: Cloud operations running normally\n`;
  emailBody += ` - Pending Approvals: ${approvals.length}\n\n`;

  emailBody += `2. Approval Required\n`;
  if (approvals.length === 0) {
    emailBody += ` - No pending items in queue.\n`;
  } else {
    approvals.forEach((item, index) => {
      emailBody += ` [ ] [${item.category || 'TASK'}] ${item.title || item.summary} (ID: ${item.id})\n`;
    });
  }

  emailBody += `\n3. Scheduled Meetings Today\n`;
  if (upcomingMeetings.length === 0) {
    emailBody += ` - No external meetings scheduled for today.\n`;
  } else {
    upcomingMeetings.forEach(m => {
      emailBody += ` - ${m.title} at ${m.time}\n`;
    });
  }

  emailBody += `\n4. Recommended Focus Today\n`;
  emailBody += ` 1. Review pending approval queue\n`;
  emailBody += ` 2. Verify local Bloodchain node status\n`;
  emailBody += ` 3. Review research updates\n\n`;

  emailBody += `Delivered by Bloodchain Cloud Operator.`;

  GmailApp.sendEmail(
    CONFIG.OPERATOR_EMAIL,
    `Bloodchain Daily Briefing - ${dateStr}`,
    emailBody
  );
}

/**
 * 2. Hourly Approval Queue Checker
 */
function processApprovedActions() {
  if (!CONFIG.APPROVAL_SHEET_ID || CONFIG.APPROVAL_SHEET_ID === "YOUR_APPROVAL_SHEET_ID") return;
  const sheet = SpreadsheetApp.openById(CONFIG.APPROVAL_SHEET_ID).getSheetByName("Bloodchain Approval Queue") || SpreadsheetApp.openById(CONFIG.APPROVAL_SHEET_ID).getActiveSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const headers = data[0];
  const statusCol = headers.indexOf("Status");
  const approveCol = headers.indexOf("Approve?");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[approveCol] === true || row[approveCol] === "APPROVED" || row[statusCol] === "approved") {
      // Mark as executed or queued for local execution
      Logger.log(`Processing approved row ${i}: ${row[headers.indexOf("Title")]}`);
    }
  }
}

/**
 * Helper to fetch pending approvals from sheet
 */
function getPendingApprovals() {
  if (!CONFIG.APPROVAL_SHEET_ID || CONFIG.APPROVAL_SHEET_ID === "YOUR_APPROVAL_SHEET_ID") return [];
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.APPROVAL_SHEET_ID).getActiveSheet();
    const rows = sheet.getDataRange().getValues();
    const items = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][9] === "pending" || rows[i][9] === "PENDING") {
        items.push({
          id: rows[i][0],
          category: rows[i][3],
          title: rows[i][5],
          summary: rows[i][6]
        });
      }
    }
    return items;
  } catch (e) {
    Logger.log("Error reading approval sheet: " + e);
    return [];
  }
}

/**
 * Helper to get today's calendar meetings
 */
function getTodayMeetings() {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const events = CalendarApp.getDefaultCalendar().getEvents(now, endOfDay);
  return events.map(e => ({
    title: e.getTitle(),
    time: e.getStartTime().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));
}
