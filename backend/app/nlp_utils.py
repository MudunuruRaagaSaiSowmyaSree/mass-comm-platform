from indicnlp.normalize.indic_normalize import IndicNormalizerFactory

class IndicProcessor:
    def __init__(self):
        # Supported languages for your project[cite: 1]
        self.supported_langs = {'hi', 'ta', 'te', 'kn', 'bn'}
        self.factory = IndicNormalizerFactory()

    def clean_text(self, text: str, lang_code: str) -> str:
        """Cleans and normalizes regional language text."""
        if lang_code in self.supported_langs:
            normalizer = self.factory.get_normalizer(lang_code)
            return normalizer.normalize(text)
        return text.strip()