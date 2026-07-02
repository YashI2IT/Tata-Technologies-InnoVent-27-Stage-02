import os
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

MANUALS_FOLDER = 'manuals'
CHROMA_DB_PATH = 'chroma_db_lc'

EMBEDDINGS = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

class RAGAgent:
    def __init__(self):
        print("[RAGAgent] Initializing...")
        self.vectorstore = None
        self.retriever = None
        self._load_or_ingest()

    def _load_or_ingest(self):
        # If chroma_db_lc already exists, just load it
        if os.path.exists(CHROMA_DB_PATH) and os.listdir(CHROMA_DB_PATH):
            print("[RAGAgent] Loading existing database...")
            self.vectorstore = Chroma(
                persist_directory=CHROMA_DB_PATH,
                embedding_function=EMBEDDINGS
            )
            print(f"[RAGAgent] ✅ Loaded {self.vectorstore._collection.count()} chunks")
        else:
            print("[RAGAgent] Fresh database. Ingesting PDFs...")
            self._ingest_pdfs()

        # Create retriever from vectorstore
        self.retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 3}
        )

    def _ingest_pdfs(self):
        pdf_files = [f for f in os.listdir(MANUALS_FOLDER) if f.endswith('.pdf')]

        if not pdf_files:
            print("[RAGAgent] No PDFs found in manuals folder!")
            return

        all_docs = []

        for pdf_file in pdf_files:
            pdf_path = os.path.join(MANUALS_FOLDER, pdf_file)
            print(f"[RAGAgent] Reading: {pdf_file}")

            # LangChain PDF loader
            loader = PyMuPDFLoader(pdf_path)
            docs = loader.load()
            all_docs.extend(docs)

        # Smart text splitter
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " "]
        )

        chunks = splitter.split_documents(all_docs)
        print(f"[RAGAgent] Split into {len(chunks)} chunks")

        # Store in ChromaDB via LangChain
        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=EMBEDDINGS,
            persist_directory=CHROMA_DB_PATH
        )
        print(f"[RAGAgent] ✅ {len(chunks)} chunks stored!")    

    def retrieve(self, defect_type: str) -> dict:
        query = f"how to repair {defect_type} on aircraft skin metal structure inspection corrective maintenance action"

        # Get relevant docs from vectorstore
        docs = self.retriever.invoke(query)

        if not docs:
            return {
                "query": defect_type,
                "procedure": "No procedure found.",
                "source": "N/A",
                "page": 0,
                "chunks": []
            }

        # Build chunks list
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

if __name__ == "__main__":
    agent = RAGAgent()

    for defect in ["crack", "dent", "scratch", "missing-head", "paint-off"]:
        print(f"\n{'='*40}")
        result = agent.retrieve(defect)
        print(f"Defect  : {result['query']}")
        print(f"Source  : {result['source']}")
        print(f"Page    : {result['page']}")
        print(f"Result  : {result['procedure'][:300]}...")            