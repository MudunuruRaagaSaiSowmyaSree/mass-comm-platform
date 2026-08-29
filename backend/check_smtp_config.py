from app.database import settings

print("SMTP_HOST =", repr(settings.SMTP_HOST))
print("SMTP_PORT =", settings.SMTP_PORT)
print("SMTP_USERNAME =", repr(settings.SMTP_USERNAME))
print("SMTP_FROM_EMAIL =", repr(settings.SMTP_FROM_EMAIL))
print("SMTP_PASSWORD_SET =", bool(settings.SMTP_PASSWORD))
