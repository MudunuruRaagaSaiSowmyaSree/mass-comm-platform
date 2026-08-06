import time

class SessionManager:
    def __init__(self):
        self.sessions = {}

    def get_session(self, session_id: str, default_lang: str = "hi"):
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "preferred_language": default_lang,
                "history": [],
                "created_at": time.time()
            }
        return self.sessions[session_id]

    def add_interaction(self, session_id: str, user_text: str, bot_text: str, detected_lang: str):
        session = self.get_session(session_id)
        session["preferred_language"] = detected_lang
        session["history"].append({
            "user": user_text,
            "bot": bot_text
        })