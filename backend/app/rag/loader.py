from pathlib import Path

from langchain_community.document_loaders import (
    TextLoader
)


BASE_DIR = Path(__file__).resolve().parents[2]

DATA_PATH = BASE_DIR / "app" / "knowledge_base"


def load_documents():

    documents = []

    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Knowledge base directory not found: {DATA_PATH}"
        )

    for file_path in sorted(DATA_PATH.glob("*.txt")):

        domain = file_path.stem

        loader = TextLoader(
            str(file_path),
            encoding="utf-8"
        )

        loaded_documents = loader.load()

        for document in loaded_documents:

            document.metadata["domain"] = domain

            document.metadata["source_file"] = (
                file_path.name
            )

            document.metadata["source_path"] = (
                str(file_path)
            )

            documents.append(document)

    return documents