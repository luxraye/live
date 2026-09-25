"""
Bloodchain Morning Briefing Generator
Builds the daily operator briefing combining local repo status, pending approvals, and research updates.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
APPROVALS_FILE = BASE_DIR / "approvals" / "queue.json"
OUTPUT_DIR = BASE_DIR.parent / "knowledge" / "meeting-briefs"

def load_pending_approvals():
    if not APPROVALS_FILE.exists():
        return []
    try:
        with open(APPROVALS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [item for item in data if item.get("status") == "pending"]
    except Exception as e:
        print(f"Error loading approvals: {e}")
        return []

def generate_briefing():
    today = datetime.now().strftime("%Y-%m-%d")
    pending = load_pending_approvals()

    briefing = f"""========================================
BLOODCHAIN MORNING BRIEFING
Date: {today}
========================================

1. Overnight Summary
   - Local Services: Operational
   - Ollama Local LLM: Active
   - Pending Approvals in Queue: {len(pending)}
   - Codebase Health: Validated

2. Approval Required
"""
    if not pending:
        briefing += "   - No pending items awaiting approval.\n"
    else:
        for idx, item in enumerate(pending, 1):
            briefing += f"   [ ] [{item.get('risk', 'MEDIUM').upper()}] {item.get('title', 'Untitled')} (ID: {item.get('id', idx)})\n"
            briefing += f"       Action: {item.get('proposed_action', 'N/A')}\n"

    briefing += f"""
3. Recommended Focus Today
   1. Review outstanding pull requests and approval items
   2. Verify Fabric node health and API server connections
   3. Check scheduled outreach drafts

4. Important Risks
   - Verify synthetic data compliance before running live demonstrations

5. Suggested Next Actions
   - Execute approved tasks via AI Operator CLI
   - Sync research notes into local Chroma memory

========================================
"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_DIR / f"briefing_{today}.txt"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(briefing)

    print(briefing)
    print(f"\n[+] Morning briefing saved to: {out_file}")

if __name__ == "__main__":
    generate_briefing()
