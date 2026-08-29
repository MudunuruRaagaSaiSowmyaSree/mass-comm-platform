import smtplib
from email.message import EmailMessage

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

USERNAME = "aimasscomm@gmail.com"

# Put your Gmail App Password here locally.
# Do NOT send the password to me.
PASSWORD = "gvyg sdnn agff fcwg"

FROM_EMAIL = "aimasscomm@gmail.com"
TO_EMAIL = "mrs3@yopmail.com"

message = EmailMessage()

message["From"] = FROM_EMAIL
message["To"] = TO_EMAIL
message["Subject"] = "Mass Communication Platform Test"

message.set_content(
    "This is a direct SMTP test from the Mass Communication Platform."
)

print("Connecting to Gmail SMTP...")

with smtplib.SMTP(
    SMTP_HOST,
    SMTP_PORT,
    timeout=30,
) as server:

    server.ehlo()

    print("Starting TLS...")

    server.starttls()

    server.ehlo()

    print("Logging into Gmail...")

    server.login(
        USERNAME,
        PASSWORD,
    )

    print("Sending email...")

    server.send_message(message)

    print("EMAIL SENT SUCCESSFULLY")