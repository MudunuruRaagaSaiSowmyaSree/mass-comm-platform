from indicnlp.tokenize import indic_tokenize
from indicnlp.normalize.indic_normalize import IndicNormalizerFactory


class IndicProcessor:
    def __init__(self):
        # Supported languages for your project
        self.supported_langs = {
            "hi",
            "te",
            "bn",
        }
        self.factory = IndicNormalizerFactory()

    def clean_text(self, text: str, lang_code: str) -> str:
        """Cleans and normalizes regional language text (Task 3: Normalization)."""
        text = text.strip()
        if lang_code in self.supported_langs:
            normalizer = self.factory.get_normalizer(lang_code)
            text = normalizer.normalize(text)
        return text

    def tokenize(self, text: str, lang_code: str) -> list:
        """Splits text into meaningful tokens (Task 3: Tokenization)."""
        if lang_code in self.supported_langs:
            return list(indic_tokenize.trivial_tokenize(text, lang_code))
        return text.split()

    def process(self, text: str, lang_code: str) -> dict:
        """Full preprocessing pipeline: normalize + tokenize."""
        normalized = self.clean_text(text, lang_code)
        tokens = self.tokenize(normalized, lang_code)
        return {"normalized_text": normalized, "tokens": tokens}