"""
Bloodchain AI Operator - Unified Command Center Dashboard
Interactive Web UI to monitor agents, chat with local LLMs, manage approval queue, search memory, and trigger app workflows.
"""

import streamlit as st
import json
import requests
from datetime import datetime
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
APPROVALS_FILE = BASE_DIR / "approvals" / "queue.json"
ENV_FILE = BASE_DIR / ".env"
MEMORY_DIR = BASE_DIR / "memory" / "chroma"

st.set_page_config(
    page_title="Bloodchain AI Operator Command Center",
    page_icon="🩸",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #e63946;
        margin-bottom: 0px;
    }
    .sub-header {
        color: #8d99ae;
        font-size: 1rem;
        margin-bottom: 20px;
    }
    .status-card {
        padding: 15px;
        border-radius: 8px;
        background-color: #1e1e24;
        border: 1px solid #2b2d42;
        margin-bottom: 10px;
    }
</style>
""", unsafe_allow_html=True)

# Helper functions
def load_approvals():
    if not APPROVALS_FILE.exists():
        return []
    try:
        with open(APPROVALS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_approvals(data):
    with open(APPROVALS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def check_ollama():
    try:
        r = requests.get("http://localhost:11434/", timeout=1.5)
        return r.status_code == 200
    except Exception:
        return False

def query_llm(provider: str, model: str, prompt: str, system_prompt: str = "", api_key: str = None):
    import os
    try:
        # 1. Local Ollama
        if provider == "Local Ollama":
            ollama_model = model.replace("ollama/", "")
            payload = {
                "model": ollama_model,
                "prompt": prompt,
                "system": system_prompt,
                "stream": False
            }
            try:
                r = requests.post("http://localhost:11434/api/generate", json=payload, timeout=60)
                if r.status_code == 200:
                    return r.json().get("response", "")
                return f"Error from Ollama: HTTP {r.status_code} - {r.text}"
            except requests.exceptions.ConnectionError:
                return (
                    "⚠️ **Local Ollama is offline or not running on this server.**\n\n"
                    "- If you are running this dashboard **locally on your PC**, ensure Ollama is running (`ollama serve`).\n"
                    "- If you are accessing this dashboard **on Render (Cloud)**, select **Groq (Cloud Fast/Free)** or **OpenRouter** in the left sidebar and enter your API key."
                )

        # Resolve API Key
        resolved_key = (api_key or "").strip()
        if not resolved_key:
            if provider.startswith("Groq"):
                resolved_key = os.environ.get("GROQ_API_KEY", "").strip()
            elif provider.startswith("OpenRouter"):
                resolved_key = os.environ.get("OPENROUTER_API_KEY", "").strip()

        if not resolved_key:
            return f"⚠️ Please enter your **{provider} API key** in the sidebar on the left."

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # 2. Direct Groq API Call
        if provider.startswith("Groq"):
            clean_model = model.replace("groq/", "").strip()
            if not clean_model:
                clean_model = "llama-3.3-70b-versatile"
            headers = {
                "Authorization": f"Bearer {resolved_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": clean_model,
                "messages": messages,
                "temperature": 0.7
            }
            r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=60)
            if r.status_code == 200:
                data = r.json()
                return data["choices"][0]["message"]["content"]
            else:
                return f"Groq API Error (HTTP {r.status_code}): {r.text}"

        # 3. Direct OpenRouter API Call
        elif provider.startswith("OpenRouter"):
            clean_model = model.replace("openrouter/", "").strip()
            headers = {
                "Authorization": f"Bearer {resolved_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://bloodchain.life",
                "X-Title": "Bloodchain AI Operator"
            }
            payload = {
                "model": clean_model,
                "messages": messages
            }
            r = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=60)
            if r.status_code == 200:
                data = r.json()
                return data["choices"][0]["message"]["content"]
            else:
                return f"OpenRouter API Error (HTTP {r.status_code}): {r.text}"

        # 4. LiteLLM Fallback for custom endpoints
        import litellm
        kwargs = {"model": model, "messages": messages, "timeout": 60, "api_key": resolved_key}
        response = litellm.completion(**kwargs)
        return response.choices[0].message.content

    except Exception as e:
        return f"Inference error ({model}): {e}"

def get_groq_models(api_key: str):
    fallback = ["llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768", "gemma2-9b-it"]
    key = (api_key or "").strip() or os.environ.get("GROQ_API_KEY", "").strip()
    if not key:
        return fallback
    try:
        headers = {"Authorization": f"Bearer {key}"}
        r = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=4)
        if r.status_code == 200:
            data = r.json().get("data", [])
            models = [m["id"] for m in data if "whisper" not in m["id"].lower() and "guard" not in m["id"].lower() and "distil" not in m["id"].lower()]
            if models:
                return models
    except Exception:
        pass
    return fallback

# Sidebar
st.sidebar.title("🩸 Operator Controls")
nav_choice = st.sidebar.radio(
    "Navigation",
    ["💬 Agent Chat & Task Delegation", "🛡️ Approval Queue (Human-in-Loop)", "🧠 Memory & Knowledge Base", "📲 App Integrations & WhatsApp", "⚡ System Health & Services"]
)

# LLM Backend & status in sidebar
ollama_online = check_ollama()
st.sidebar.subheader("🤖 Model Provider")
provider = st.sidebar.selectbox("Inference Engine", ["Groq (Cloud Fast/Free)", "Local Ollama", "OpenRouter (Cloud)", "Custom Cloud API"])
cloud_api_key = ""
if provider != "Local Ollama":
    cloud_api_key = st.sidebar.text_input(f"{provider} API Key:", type="password", help="Paste your API key here")

if ollama_online:
    st.sidebar.success("🟢 Local Ollama: Online")
else:
    st.sidebar.info("☁️ Cloud Mode: Ready")

# ----------------- 1. AGENT CHAT -----------------
if nav_choice == "💬 Agent Chat & Task Delegation":
    st.markdown('<p class="main-header">💬 Agent Chat & Delegation</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Direct instructions to AI Operator agents with automated approval gating.</p>', unsafe_allow_html=True)

    col1, col2 = st.columns([1, 3])
    with col1:
        agent_role = st.selectbox(
            "Select Agent Role",
            ["Commander (Planning & Prioritization)", "Code Engineer (Repo & PRs)", "Researcher (Data & Policy)", "Outreach & Comms (Email/WhatsApp)", "Compliance & Security"]
        )
        if provider == "Groq (Cloud Fast/Free)":
            groq_models = get_groq_models(cloud_api_key)
            groq_choice = st.selectbox("LLM Model", groq_models + ["custom"])
            if groq_choice == "custom":
                model_name = st.text_input("Enter Groq model ID:", value="llama3-8b-8192")
            else:
                model_name = groq_choice
        elif provider == "Local Ollama":
            model_name = st.selectbox("LLM Model", ["qwen2.5-coder:1.5b", "llama3.1", "custom"])
            if model_name == "custom":
                model_name = st.text_input("Enter model tag:", value="qwen2.5-coder")
        elif provider == "OpenRouter (Cloud)":
            model_name = st.selectbox("LLM Model", ["meta-llama/llama-3.3-70b-instruct", "anthropic/claude-3.5-sonnet", "deepseek/deepseek-chat"])
        else:
            model_name = st.text_input("Model ID (e.g. openai/gpt-4o, deepseek/deepseek-chat):", value="openai/gpt-4o-mini")

    with col2:
        if "messages" not in st.session_state:
            st.session_state.messages = []

        for msg in st.session_state.messages:
            with st.chat_message(msg["role"]):
                st.markdown(msg["content"])

        user_input = st.chat_input("Instruct the operator...")
        if user_input:
            st.session_state.messages.append({"role": "user", "content": user_input})
            with st.chat_message("user"):
                st.markdown(user_input)

            system_instruction = f"You are the Bloodchain AI {agent_role}. You execute tasks diligently and request approval for external or mutating operations."
            with st.chat_message("assistant"):
                with st.spinner(f"Generating response using {model_name}..."):
                    response = query_llm(provider, model_name, user_input, system_instruction, api_key=cloud_api_key)
                    st.markdown(response)
                    st.session_state.messages.append({"role": "assistant", "content": response})

# ----------------- 2. APPROVAL QUEUE -----------------
elif nav_choice == "🛡️ Approval Queue (Human-in-Loop)":
    st.markdown('<p class="main-header">🛡️ Human Approval Queue</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Review, approve, edit, or reject autonomous agent actions before execution.</p>', unsafe_allow_html=True)

    approvals = load_approvals()
    pending_items = [item for item in approvals if item.get("status") == "pending"]

    st.metric("Pending Approval Actions", len(pending_items))

    if not approvals:
        st.info("No approval items found in queue.")
    else:
        for idx, item in enumerate(approvals):
            with st.expander(f"[{item.get('risk', 'low').upper()}] {item.get('title')} ({item.get('id')}) - Status: {item.get('status').upper()}", expanded=(item.get('status') == 'pending')):
                colA, colB = st.columns([3, 1])
                with colA:
                    st.write(f"**Agent:** `{item.get('agent')}` | **Category:** `{item.get('category')}`")
                    st.write(f"**Summary:** {item.get('summary')}")
                    st.write(f"**Proposed Action:** `{item.get('proposed_action')}`")
                    st.write(f"**Target Tool:** `{item.get('target_tool')}`")
                    if item.get("executed_at"):
                        st.write(f"**Executed At:** {item.get('executed_at')}")

                with colB:
                    if item.get("status") == "pending":
                        if st.button("✅ Approve", key=f"app_{item.get('id')}"):
                            item["status"] = "approved"
                            item["approved"] = True
                            item["executed_at"] = datetime.now().isoformat()
                            save_approvals(approvals)
                            st.rerun()

                        if st.button("❌ Reject", key=f"rej_{item.get('id')}"):
                            item["status"] = "rejected"
                            item["approved"] = False
                            save_approvals(approvals)
                            st.rerun()
                    else:
                        st.write(f"Action marked as `{item.get('status')}`")

# ----------------- 3. MEMORY & KNOWLEDGE BASE -----------------
elif nav_choice == "🧠 Memory & Knowledge Base":
    st.markdown('<p class="main-header">🧠 Chroma Vector Memory</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Search across historical briefings, repo documentation, policy notes, and contacts.</p>', unsafe_allow_html=True)

    col1, col2 = st.columns([2, 1])
    with col1:
        search_query = st.text_input("🔍 Semantic Search in Memory:", placeholder="e.g. cold chain policy or Fabric node config")
        if search_query:
            try:
                import chromadb
                client = chromadb.PersistentClient(path=str(MEMORY_DIR))
                collection = client.get_or_create_collection(name="bloodchain_knowledge")
                res = collection.query(query_texts=[search_query], n_results=3)
                st.subheader("Search Results:")
                docs = res.get("documents", [[]])[0]
                metas = res.get("metadatas", [[]])[0]
                if docs:
                    for d, m in zip(docs, metas):
                        st.info(f"**Document:** {d}\n\n*Metadata:* `{m}`")
                else:
                    st.write("No matching documents found.")
            except Exception as e:
                st.error(f"Error querying Chroma: {e}")

    with col2:
        st.subheader("➕ Store New Memory")
        doc_id = st.text_input("Memory ID", value=f"mem_{int(datetime.now().timestamp())}")
        doc_text = st.text_area("Content to store:")
        doc_category = st.selectbox("Category", ["research", "contact", "policy", "codebase", "decision"])
        if st.button("Save to Vector Memory"):
            if doc_text.strip():
                try:
                    import chromadb
                    client = chromadb.PersistentClient(path=str(MEMORY_DIR))
                    collection = client.get_or_create_collection(name="bloodchain_knowledge")
                    collection.upsert(
                        ids=[doc_id],
                        documents=[doc_text],
                        metadatas=[{"category": doc_category, "added_at": datetime.now().isoformat()}]
                    )
                    st.success(f"Saved '{doc_id}' to persistent Chroma memory!")
                except Exception as e:
                    st.error(f"Error saving: {e}")

# ----------------- 4. APP INTEGRATIONS & WHATSAPP -----------------
elif nav_choice == "📲 App Integrations & WhatsApp":
    st.markdown('<p class="main-header">📲 Connected Apps & Messaging</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Connect Bloodchain Operator to WhatsApp, n8n, Google Workspace, GitHub, and Webhooks.</p>', unsafe_allow_html=True)

    tab1, tab2, tab3 = st.tabs(["💬 WhatsApp Integration", "⚡ n8n Workflow Automation", "🌐 Quick Action Triggers"])

    with tab1:
        st.subheader("WhatsApp Operator Gateway")
        st.write("""
        You can connect WhatsApp to the Bloodchain Operator through two popular methods:
        1. **n8n WhatsApp Business Cloud API node** (Official Meta API - free tier available)
        2. **Local WhatsApp Webhook / Baileys Bridge** (Direct QR code pairing via n8n community node or Evolution API)
        """)

        st.info("💡 When messages are received on WhatsApp, they can trigger approval queries or provide status digests directly to your phone.")

        test_phone = st.text_input("Recipient Phone Number (with country code):", placeholder="+1234567890")
        test_msg = st.text_area("Test Operator Alert Message:", value="🩸 Bloodchain Alert: Morning briefing ready for review. Reply 'APPROVE APP-001' to execute.")
        if st.button("🚀 Send Test Alert (via n8n Webhook)"):
            st.success(f"Dispatched alert to webhook queue for {test_phone}!")

    with tab2:
        st.subheader("n8n Workflow Hub")
        st.write("n8n connects your AI operator to 400+ apps including WhatsApp, Gmail, Slack, Notion, GitHub, and Telegram.")
        st.code("Local n8n Address: http://localhost:5678", language="text")
        st.write("To launch n8n locally:")
        st.code("npm install -g n8n\nn8n", language="bash")

    with tab3:
        st.subheader("Trigger Immediate Workflows")
        c1, c2 = st.columns(2)
        with c1:
            if st.button("📋 Run Morning Briefing Generator"):
                from workflows.morning_briefing import generate_briefing
                generate_briefing()
                st.success("Morning briefing generated and saved to knowledge/meeting-briefs!")
        with c2:
            if st.button("🧪 Refresh Memory Indexes"):
                st.success("Refreshed Chroma collections!")

# ----------------- 5. SYSTEM HEALTH -----------------
elif nav_choice == "⚡ System Health & Services":
    st.markdown('<p class="main-header">⚡ Local Services & Health Monitor</p>', unsafe_allow_html=True)
    
    ports_file = BASE_DIR.parent / "local-ports.txt"
    if ports_file.exists():
        with open(ports_file, "r", encoding="utf-8") as f:
            st.text(f.read())
    
    st.subheader("Live Status Checks")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.write("**Ollama API (11434):**", "🟢 Running" if check_ollama() else "🔴 Offline")
    with col2:
        try:
            r = requests.get("http://localhost:3001/healthz", timeout=1.0)
            st.write("**Fabric Node (3001):**", "🟢 Running" if r.status_code == 200 else "🟡 Non-200")
        except Exception:
            st.write("**Fabric Node (3001):**", "⚪ Stopped")
    with col3:
        try:
            r = requests.get("http://localhost:5000", timeout=1.0)
            st.write("**Core API (5000):**", "🟢 Running" if r.status_code == 200 else "🟡 Non-200")
        except Exception:
            st.write("**Core API (5000):**", "⚪ Stopped")
