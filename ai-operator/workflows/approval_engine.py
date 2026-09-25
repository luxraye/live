"""
Bloodchain Human Approval Engine
Controls and gates all high-risk autonomous actions.
"""

import json
import sys
from pathlib import Path
from datetime import datetime

APPROVALS_FILE = Path(__file__).resolve().parent.parent / "approvals" / "queue.json"

def load_queue():
    if not APPROVALS_FILE.exists():
        return []
    with open(APPROVALS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_queue(queue):
    with open(APPROVALS_FILE, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2)

def list_queue():
    queue = load_queue()
    print("\n=== BLOODCHAIN APPROVAL QUEUE ===")
    if not queue:
        print("No items in queue.")
        return
    for item in queue:
        status_marker = "[ ]" if item.get("status") == "pending" else "[X]"
        print(f"{status_marker} ID: {item.get('id')} | Status: {item.get('status')} | Risk: {item.get('risk', 'low').upper()}")
        print(f"    Title: {item.get('title')}")
        print(f"    Action: {item.get('proposed_action')}")
        print(f"    Target Tool: {item.get('target_tool')}")
        print("-" * 50)

def approve_item(item_id: str):
    queue = load_queue()
    found = False
    for item in queue:
        if item.get("id") == item_id:
            item["status"] = "approved"
            item["approved"] = True
            item["executed_at"] = datetime.now().isoformat()
            found = True
            print(f"[✓] Item {item_id} marked as APPROVED.")
            break
    if found:
        save_queue(queue)
    else:
        print(f"[!] Item {item_id} not found.")

def reject_item(item_id: str):
    queue = load_queue()
    found = False
    for item in queue:
        if item.get("id") == item_id:
            item["status"] = "rejected"
            item["approved"] = False
            found = True
            print(f"[✗] Item {item_id} marked as REJECTED.")
            break
    if found:
        save_queue(queue)
    else:
        print(f"[!] Item {item_id} not found.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd == "list":
            list_queue()
        elif cmd == "approve" and len(sys.argv) > 2:
            approve_item(sys.argv[2])
        elif cmd == "reject" and len(sys.argv) > 2:
            reject_item(sys.argv[2])
        else:
            print("Usage: python approval_engine.py [list | approve <ID> | reject <ID>]")
    else:
        list_queue()
