import os
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    HAS_CHROMADB = True
except ImportError:
    HAS_CHROMADB = False

    class MockCollection:
        def __init__(self, name: str, metadata: dict = None):
            self.name = name
            self.metadata = metadata or {}
            self.ids = []
            self.documents = []
            self.metadatas = []
            self.embeddings = []

        def add(self, ids, embeddings, documents, metadatas):
            for i, emb, doc, meta in zip(ids, embeddings, documents, metadatas):
                if i in self.ids:
                    idx = self.ids.index(i)
                    self.documents[idx] = doc
                    self.metadatas[idx] = meta
                    self.embeddings[idx] = emb
                else:
                    self.ids.append(i)
                    self.embeddings.append(emb)
                    self.documents.append(doc)
                    self.metadatas.append(meta)

        def query(self, query_embeddings, n_results=5, where=None):
            matched_docs = []
            matched_metas = []
            matched_ids = []
            
            # Extract standard key/value filters
            for idx, (doc, meta, i) in enumerate(zip(self.documents, self.metadatas, self.ids)):
                match = True
                if where:
                    for k, v in where.items():
                        if meta.get(k) != v:
                            match = False
                            break
                if match:
                    matched_docs.append(doc)
                    matched_metas.append(meta)
                    matched_ids.append(i)
                    
            limit = min(n_results, len(matched_docs))
            return {
                "ids": [matched_ids[:limit]],
                "documents": [matched_docs[:limit]],
                "metadatas": [matched_metas[:limit]]
            }

        def get(self, ids):
            matched_ids = []
            matched_metas = []
            matched_docs = []
            for i in ids:
                if i in self.ids:
                    idx = self.ids.index(i)
                    matched_ids.append(i)
                    matched_metas.append(self.metadatas[idx])
                    matched_docs.append(self.documents[idx])
            return {
                "ids": matched_ids,
                "metadatas": matched_metas,
                "documents": matched_docs
            }

        def delete(self, ids):
            for i in ids:
                if i in self.ids:
                    idx = self.ids.index(i)
                    del self.ids[idx]
                    del self.embeddings[idx]
                    del self.documents[idx]
                    del self.metadatas[idx]

    class MockChromaClient:
        def __init__(self):
            self.collections = {}

        def get_or_create_collection(self, name: str, metadata: dict = None):
            if name not in self.collections:
                self.collections[name] = MockCollection(name, metadata)
            return self.collections[name]

        def heartbeat(self):
            return True


class MemoryService:
    def __init__(self):
        self.client = None
        self.embeddings_client = None
        self.user_memory_collection = None
        self.document_collection = None
        
        # Setup OpenAI client for embeddings
        if settings.OPENAI_API_KEY:
            self.embeddings_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
        self._initialize_chroma()

    def _initialize_chroma(self):
        if not HAS_CHROMADB:
            logger.warning("chromadb package is not installed. Using in-memory MockChromaClient fallback.")
            self.client = MockChromaClient()
        else:
            try:
                # Attempt HTTP client connection (configured for docker orchestration)
                logger.info(f"Connecting to ChromaDB at {settings.CHROMA_HOST}:{settings.CHROMA_PORT}...")
                self.client = chromadb.HttpClient(
                    host=settings.CHROMA_HOST,
                    port=settings.CHROMA_PORT,
                    settings=ChromaSettings(anonymized_telemetry=False)
                )
                # Ping database to verify connection
                self.client.heartbeat()
                logger.info("Successfully connected to HTTP ChromaDB service.")
            except Exception as e:
                logger.warning(f"Could not connect to ChromaDB HTTP service: {e}. Falling back to local PersistentClient.")
                # Fall back to localized persistence directory (ensures server runs locally out-of-box)
                persist_dir = os.path.join(settings.WORKSPACE_DIR, "chroma_persistence")
                os.makedirs(persist_dir, exist_ok=True)
                self.client = chromadb.PersistentClient(
                    path=persist_dir,
                    settings=ChromaSettings(anonymized_telemetry=False)
                )

        try:
            # Initialize collections
            self.user_memory_collection = self.client.get_or_create_collection(
                name="user_memories",
                metadata={"description": "Long-term semantic user facts and preference memories"}
            )
            self.document_collection = self.client.get_or_create_collection(
                name="document_index",
                metadata={"description": "Indexed user text files and PDFs chunks"}
            )
        except Exception as coll_err:
            logger.critical(f"ChromaDB Collections initialization failed: {coll_err}")

    def _get_embedding(self, text: str) -> List[float]:
        """
        Generate text embeddings using OpenAI API.
        If API key is missing or calls fail, return simple deterministic placeholder vectors.
        """
        if self.embeddings_client:
            try:
                response = self.embeddings_client.embeddings.create(
                    input=[text],
                    model="text-embedding-3-small"
                )
                return response.data[0].embedding
            except Exception as e:
                logger.error(f"OpenAI embedding generation failed: {e}. Falling back to default vector.")
        
        # Heuristic fallback embeddings generator (1536 float dimensions)
        # Standard hash-based float mock representation
        vector = [0.0] * 1536
        for idx, char in enumerate(text[:1536]):
            vector[idx % 1536] = float(ord(char)) / 255.0
        return vector

    def add_user_memory(self, user_id: int, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Store a semantic fact about the user in long term memory collection."""
        if not self.user_memory_collection:
            logger.error("ChromaDB memory collection is unavailable.")
            return ""
        
        import hashlib
        # Use a deterministic SHA-256 hash instead of Python's process-bound built-in hash()
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        doc_id = f"user_{user_id}_mem_{content_hash}"
        embedding = self._get_embedding(content)
        meta = metadata or {}
        meta["user_id"] = user_id
        
        self.user_memory_collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[content],
            metadatas=[meta]
        )
        logger.info(f"Stored user memory vector for User ID {user_id}: {content[:40]}...")
        return doc_id

    def search_user_memories(self, user_id: int, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve most semantically relevant memories associated with user."""
        if not self.user_memory_collection:
            return []
            
        embedding = self._get_embedding(query)
        results = self.user_memory_collection.query(
            query_embeddings=[embedding],
            n_results=limit,
            where={"user_id": user_id}
        )
        
        memories = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else [{}]*len(docs)
            ids = results["ids"][0]
            for doc, meta, uid in zip(docs, metas, ids):
                memories.append({"id": uid, "content": doc, "metadata": meta})
        return memories

    def add_document_chunk(self, file_id: str, chunk_index: int, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Indexes a text chunk of a PDF/Word file in the vector repository."""
        if not self.document_collection:
            return ""
            
        chunk_id = f"doc_{file_id}_chunk_{chunk_index}"
        embedding = self._get_embedding(content)
        meta = metadata or {}
        meta["file_id"] = file_id
        meta["chunk_index"] = chunk_index
        
        self.document_collection.add(
            ids=[chunk_id],
            embeddings=[embedding],
            documents=[content],
            metadatas=[meta]
        )
        return chunk_id

    def search_document_chunks(self, file_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Searches index for matching blocks of a specific file."""
        if not self.document_collection:
            return []
            
        embedding = self._get_embedding(query)
        results = self.document_collection.query(
            query_embeddings=[embedding],
            n_results=limit,
            where={"file_id": file_id}
        )
        
        chunks = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else [{}]*len(docs)
            ids = results["ids"][0]
            for doc, meta, cid in zip(docs, metas, ids):
                chunks.append({"id": cid, "content": doc, "metadata": meta})
        return chunks

# Global Memory Service Instance
memory_service = MemoryService()
