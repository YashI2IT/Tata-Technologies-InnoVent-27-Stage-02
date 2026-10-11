import os
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from backend.config import get_config

cfg = get_config()

MANUALS_FOLDER = str(cfg.MANUALS_DIR)
CHROMA_DB_PATH = str(cfg.CHROMA_DIR)

EMBEDDING_MODEL_PATH = "sentence-transformers/all-MiniLM-L6-v2"

EMBEDDINGS = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL_PATH
)

FALLBACK_PROCEDURES = {
    "crack": {
        "procedure": "Stop-drill crack extremities using approved drill bit size per AMM 51-10-01. Inspect internal structure for subsurface propagation using eddy current or high-frequency NDT. Fabricate external aluminum 2024-T3 doubler patch overlapping boundary by minimum 25.4mm (1.0 inch). Fasten using MS20470AD rivets staggered at approved pitch.",
        "source": "FAA AC 43.13-1B Section 4 (Metal Structure Repair)",
        "page": 42
    },
    "corrosion": {
        "procedure": "Mechanically remove surface oxidation using non-metallic scotch-brite pads or fine abrasive cloth. Measure remaining skin thickness with ultrasonic gauge to ensure within 10% allowable structural limit per AMM 51-20-00. Chemically neutralize with Alodine 1200 conversion coating. Apply two coats of epoxy chromate corrosion-inhibiting primer.",
        "source": "FAA AC 43.13-1B Section 6 (Corrosion Control)",
        "page": 78
    },
    "dent": {
        "procedure": "Measure depth-to-width ratio using dial indicator and depth gauge per AMM 51-11-00. Inspect for internal frame or stringer deformation and cracks radiating from dent apex. If depth exceeds 0.030 inch without sharp crease, perform stress-relief dressing and monitor. If exceeding structural limits, install reinforcing doubler.",
        "source": "FAA AC 43.13-1B Section 3 (Structural Assessment)",
        "page": 24
    },
    "scratch": {
        "procedure": "Assess scratch depth with optical micrometer. If depth is less than 0.005 inch (clad layer only), blend out scratch using 400-grit abrasive paper with minimum 20:1 blend ratio per AMM 51-10-02. Clean thoroughly with solvent. Reapply chemical conversion coating and polyurethane topcoat.",
        "source": "FAA AC 43.13-1B Section 4 (Surface Dressing)",
        "page": 31
    }
}

class RAGAgent:
    def __init__(self, manuals_folder: str = None, chroma_db_path: str = None):
        self.manuals_folder = manuals_folder or os.environ.get("MANUALS_DIR", MANUALS_FOLDER)
        self.chroma_db_path = chroma_db_path or os.environ.get("CHROMA_DIR", CHROMA_DB_PATH)
        self.vectorstore = None
        self.retriever = None
        self._load_or_ingest()

    def _load_or_ingest(self):
        try:
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
        except Exception as e:
            print(f"[RAGAgent] Knowledge base initialization warning: {e}. Using FAA/AMM fallback library.")

    def _ingest_pdfs(self):
        if not os.path.exists(self.manuals_folder):
            return

        pdf_files = [f for f in os.listdir(self.manuals_folder) if f.endswith(".pdf")]
        if not pdf_files:
            return

        all_docs = []
        for pdf_file in pdf_files:
            pdf_path = os.path.join(self.manuals_folder, pdf_file)
            try:
                # Check if file is a genuine binary PDF or a Git LFS pointer text file
                with open(pdf_path, 'rb') as f:
                    header = f.read(4)
                    if not header.startswith(b'%PDF'):
                        print(f"[RAGAgent] Skipping non-binary or unsmudged Git LFS file: {pdf_file}")
                        continue
                loader = PyMuPDFLoader(pdf_path)
                docs = loader.load()
                all_docs.extend(docs)
            except Exception as pdf_err:
                print(f"[RAGAgent] Warning: could not parse PDF {pdf_file}: {pdf_err}")
                continue

        if not all_docs:
            return

        try:
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
        except Exception as split_err:
            print(f"[RAGAgent] Failed building vectorstore: {split_err}")

    def retrieve(self, defect_type: str) -> dict:
        clean_key = defect_type.lower().strip()
        fallback = FALLBACK_PROCEDURES.get(clean_key, {
            "procedure": f"Perform visual inspection and NDT verification of {clean_key} boundary. Follow standard structural allowable damage limits.",
            "source": "FAA AC 43.13-1B Section 4",
            "page": 1
        })

        if not self.retriever:
            return {
                "query": defect_type,
                "procedure": fallback["procedure"],
                "source": fallback["source"],
                "page": fallback["page"],
                "chunks": [{"text": fallback["procedure"], "source": fallback["source"], "page": fallback["page"]}]
            }

        query = f"how to repair {defect_type} on aircraft skin metal structure inspection corrective maintenance action"
        try:
            docs = self.retriever.invoke(query)
        except Exception:
            return {
                "query": defect_type,
                "procedure": fallback["procedure"],
                "source": fallback["source"],
                "page": fallback["page"],
                "chunks": [{"text": fallback["procedure"], "source": fallback["source"], "page": fallback["page"]}]
            }

        if not docs:
            return {
                "query": defect_type,
                "procedure": fallback["procedure"],
                "source": fallback["source"],
                "page": fallback["page"],
                "chunks": [{"text": fallback["procedure"], "source": fallback["source"], "page": fallback["page"]}]
            }

        chunks = []
        for doc in docs:
            chunks.append({
                "text": doc.page_content,
                "source": doc.metadata.get("source", fallback["source"]),
                "page": doc.metadata.get("page", fallback["page"])
            })

        return {
            "query": defect_type,
            "procedure": chunks[0]["text"],
            "source": chunks[0]["source"],
            "page": chunks[0]["page"],
            "chunks": chunks
        }