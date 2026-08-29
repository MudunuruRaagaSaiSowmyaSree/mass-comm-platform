import shutil
from pathlib import Path

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter
)
from langchain_chroma import Chroma

from app.rag.loader import load_documents
from app.rag.embedding import get_embeddings


BASE_DIR = Path(__file__).resolve().parents[2]

VECTOR_DB_PATH = (
    BASE_DIR / "app" / "rag" / "vector_db"
)

COLLECTION_NAME = "mass_comm_knowledge"


def create_vector_database():

    print("=" * 70)
    print("CREATING VECTOR DATABASE")
    print("=" * 70)

    # ---------------------------------------------------------
    # DELETE OLD DATABASE
    # ---------------------------------------------------------

    if VECTOR_DB_PATH.exists():

        print("Deleting old vector database...")

        shutil.rmtree(VECTOR_DB_PATH)

    VECTOR_DB_PATH.mkdir(
        parents=True,
        exist_ok=True
    )

    # ---------------------------------------------------------
    # LOAD DOCUMENTS
    # ---------------------------------------------------------

    documents = load_documents()

    print(
        f"Loaded {len(documents)} documents."
    )

    if not documents:
        raise RuntimeError(
            "No knowledge-base documents found."
        )

    # ---------------------------------------------------------
    # SPLIT DOCUMENTS
    # ---------------------------------------------------------

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=80
    )

    chunks = splitter.split_documents(
        documents
    )

    print(
        f"Created {len(chunks)} chunks."
    )

    # ---------------------------------------------------------
    # EMBEDDINGS
    # ---------------------------------------------------------

    print("Loading multilingual embedding model...")

    embeddings = get_embeddings()

    # ---------------------------------------------------------
    # CHROMA
    # ---------------------------------------------------------

    print("Creating Chroma database...")

    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(VECTOR_DB_PATH),
        collection_name=COLLECTION_NAME
    )

    print("=" * 70)
    print("VECTOR DATABASE CREATED SUCCESSFULLY")
    print("=" * 70)


if __name__ == "__main__":
    create_vector_database()