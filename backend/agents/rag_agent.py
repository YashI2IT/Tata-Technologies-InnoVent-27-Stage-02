import os
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from backend.config import get_config

cfg = get_config()

MANUALS_FOLDER = str(cfg.MANUALS_DIR)
CHROMA_DB_PATH = str(cfg.CHROMA_DIR)

EMBEDDING_MODEL_PATH = os.path.join(str(cfg.RESOURCE_DIR), "models", "all-MiniLM-L6-v2")

if not os.path.exists(EMBEDDING_MODEL_PATH):
    raise RuntimeError(f"MODEL MISSING:\nall-MiniLM-L6-v2\n\nMODEL EXPECTED LOCATION:\n{EMBEDDING_MODEL_PATH}")

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

EMBEDDINGS = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL_PATH
)

class RAGAgent:
    def __init__(self, manuals_folder: str = None, chroma_db_path: str = None):
        self.manuals_folder = manuals_folder or os.environ.get("MANUALS_DIR", MANUALS_FOLDER)
        self.chroma_db_path = chroma_db_path or os.environ.get("CHROMA_DIR", CHROMA_DB_PATH)
        self.vectorstore = None
        self.retriever = None
        self._load_or_ingest()

    def _load_or_ingest(self):
        # If chroma_db exists, load it
        if os.path.exists(self.chroma_db_path) and os.listdir(self.chroma_db_path):
            self.vectorstore = Chroma(
                persist_directory=self.chroma_db_path,
                embedding_function=EMBEDDINGS
            )
        else:
            self._ingest_pdfs()

        # Create retriever from vectorstore if available
        if self.vectorstore is not None:
            self.retriever = self.vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 3}
            )

    def _ingest_pdfs(self):
        if not os.path.exists(self.manuals_folder):
            return

        pdf_files = [f for f in os.listdir(self.manuals_folder) if f.endswith(".pdf")]
        if not pdf_files:
            return

        all_docs = []
        for pdf_file in pdf_files:
            pdf_path = os.path.join(self.manuals_folder, pdf_file)
            loader = PyMuPDFLoader(pdf_path)
            docs = loader.load()
            all_docs.extend(docs)

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " "]
        )

        chunks = splitter.split_documents(all_docs)
        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=EMBEDDINGS,
            persist_directory=self.chroma_db_path
        )

    def retrieve(self, defect_type: str) -> dict:
        if not self.retriever:
            return {
                "query": defect_type,
                "procedure": "No maintenance procedures available in knowledge base.",
                "source": "N/A",
                "page": 0,
                "chunks": []
            }

        query = f"how to repair {defect_type} on aircraft skin metal structure inspection corrective maintenance action"
        try:
            docs = self.retriever.invoke(query)
        except Exception:
            return {
                "query": defect_type,
                "procedure": "Manual retrieval query failed.",
                "source": "N/A",
                "page": 0,
                "chunks": []
            }

        if not docs:
            return {
                "query": defect_type,
                "procedure": "No procedure found.",
                "source": "N/A",
                "page": 0,
                "chunks": []
            }

        chunks = []
        for doc in docs:
            chunks.append({
                "text": doc.page_content,
                "source": doc.metadata.get("source", "unknown"),
                "page": doc.metadata.get("page", 0)
            })

        return {
            "query": defect_type,
            "procedure": chunks[0]["text"],
            "source": chunks[0]["source"],
            "page": chunks[0]["page"],
            "chunks": chunks
        }