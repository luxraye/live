"""
Bloodchain AI Operator - Chroma Vector Memory Manager
Provides persistent local semantic storage and retrieval.
"""

import os
from pathlib import Path
import chromadb
from chromadb.config import Settings

MEMORY_DIR = Path(__file__).resolve().parent / "chroma"

def get_chroma_client():
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(MEMORY_DIR))

def add_document(collection_name: str, doc_id: str, document: str, metadata: dict = None):
    client = get_chroma_client()
    collection = client.get_or_create_collection(name=collection_name)
    collection.upsert(
        ids=[doc_id],
        documents=[document],
        metadatas=[metadata or {}]
    )
    print(f"[+] Stored document '{doc_id}' in collection '{collection_name}'")

def query_memory(collection_name: str, query_text: str, n_results: int = 3):
    client = get_chroma_client()
    collection = client.get_or_create_collection(name=collection_name)
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    return results

if __name__ == "__main__":
    print("[*] Initializing Chroma memory test...")
    add_document(
        collection_name="bloodchain_knowledge",
        doc_id="intro_001",
        document="Bloodchain is a decentralized blood supply and logistics tracking system designed to streamline donor management and cold chain compliance.",
        metadata={"category": "architecture", "scope": "overview"}
    )
    results = query_memory("bloodchain_knowledge", "What is Bloodchain?")
    print("[+] Query results:")
    for doc in results.get("documents", [[]])[0]:
        print(f" - {doc}")
