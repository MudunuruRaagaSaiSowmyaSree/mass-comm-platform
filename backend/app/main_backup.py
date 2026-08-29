from contextlib import asynccontextmanager

from fastapi import (
    BackgroundTasks,
    FastAPI,
    HTTPException,
    Request,
)

from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import PlainTextResponse

from fastapi.staticfiles import StaticFiles

from sqlalchemy import select

from app.database import (
    get_db,
    init_db,
)

from app.models.chat_history import (
    ChatHistory,
)

from app.models.message_delivery import (
    MessageDelivery,
)

from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)

from app.models.engagement_event import (
    EngagementEvent,
)

from app.rag.pipeline import (
    run_rag_pipeline,
)

from app.services.whatsapp import (
    send_whatsapp_message,
)

from app.services.campaign_scheduler import (
    start_campaign_scheduler,
    stop_campaign_scheduler,
)

from app.services.delivery_tracking import (
    update_delivery_status,
)

from app.routers import (
    ai,
    audience,
    auth,
    campaign,
    campaign_delivery,
    campaign_recipient,
    campaign_schedule,
    chat,
    compliance,
    content,
    mandi,
    message_delivery,
    organization,
    pipeline,
    report,
    review,
    template,
    translation,
    voice,
    weather,
)

from app.routers.chat_history import (
    router as chat_history_router,
)

from app.routers.delivery_tracking import (
    router as delivery_tracking_router,
)

from app.routers import feedback

from app.routers.analytics import (
    router as analytics_router,
)


# ============================================================
# WHATSAPP CONFIGURATION
# ============================================================

WHATSAPP_VERIFY_TOKEN = (
    "masscomm_webhook_2026"
)


# ============================================================
# LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle.

    Startup:
        1. Initialize database.
        2. Start campaign scheduler.

    Shutdown:
        1. Stop campaign scheduler.
    """

    print()
    print("=" * 60)
    print("Starting AI-Based Multilingual Assistance System")
    print("=" * 60)

    # --------------------------------------------------------
    # DATABASE
    # --------------------------------------------------------

    await init_db()

    print(
        "Database initialized successfully."
    )

    # --------------------------------------------------------
    # CAMPAIGN SCHEDULER
    # --------------------------------------------------------

    try:

        await start_campaign_scheduler()

        print(
            "Campaign scheduler started successfully."
        )

    except Exception as exc:

        print(
            "WARNING: Campaign scheduler could not start."
        )

        print(
            f"Scheduler error: {exc}"
        )

    print(
        "Application startup complete."
    )

    print("=" * 60)
    print()

    # --------------------------------------------------------
    # APPLICATION RUNNING
    # --------------------------------------------------------

    yield

    # --------------------------------------------------------
    # SHUTDOWN
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("Application shutting down...")
    print("=" * 60)

    try:

        await stop_campaign_scheduler()

        print(
            "Campaign scheduler stopped successfully."
        )

    except Exception as exc:

        print(
            "WARNING: Campaign scheduler could not stop."
        )

        print(
            f"Scheduler shutdown error: {exc}"
        )

    print()


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI-Based Multilingual Assistance System",
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

# ------------------------------------------------------------
# Core application routers
# ------------------------------------------------------------

app.include_router(
    auth.router
)

app.include_router(
    audience.router
)

app.include_router(
    organization.router
)

app.include_router(
    campaign.router
)

app.include_router(
    template.router
)

app.include_router(
    voice.router
)

app.include_router(
    chat.router
)


# ------------------------------------------------------------
# Campaign-related routers
# ------------------------------------------------------------

app.include_router(
    campaign_recipient.router
)

app.include_router(
    message_delivery.router
)

app.include_router(
    campaign_delivery.router
)

app.include_router(
    campaign_schedule.router
)


# ------------------------------------------------------------
# AI / content / workflow routers
# ------------------------------------------------------------

app.include_router(
    content.router
)

app.include_router(
    compliance.router
)

app.include_router(
    review.router
)

app.include_router(
    pipeline.router
)

app.include_router(
    translation.router
)

app.include_router(
    ai.router
)


# ------------------------------------------------------------
# Existing multilingual / utility routers
# ------------------------------------------------------------

app.include_router(
    weather.router
)

app.include_router(
    mandi.router
)

app.include_router(
    report.router
)


# ------------------------------------------------------------
# Chat history
# ------------------------------------------------------------

app.include_router(
    chat_history_router
)


# ============================================================
# MODULE 3 - DELIVERY TRACKING
# ============================================================

app.include_router(
    delivery_tracking_router
)


# ------------------------------------------------------------
# Channel configuration
# ------------------------------------------------------------

from app.routers.channel_config import (
    router as channel_config_router,
)

app.include_router(
    channel_config_router
)

app.include_router(
    feedback.router
)

app.include_router(
    analytics_router
)


# ============================================================
# STATIC AUDIO FILES
# ============================================================

app.mount(
    "/audio",
    StaticFiles(
        directory="generated_audio"
    ),
    name="audio",
)


# ============================================================
# HOME
# ============================================================

@app.get("/")
async def home():
    """
    Basic backend health endpoint.
    """

    return {
        "message": "Backend is working!",
        "module_1": "multi-channel integration",
        "module_2": "campaign scheduling and automated delivery",
        "status": "running",
    }


# ============================================================
# WHATSAPP WEBHOOK VERIFICATION
# ============================================================

@app.get("/webhook")
async def verify_webhook(
    request: Request,
):
    """
    Verify WhatsApp Cloud API webhook with Meta.
    """

    params = request.query_params

    mode = params.get(
        "hub.mode"
    )

    token = params.get(
        "hub.verify_token"
    )

    challenge = params.get(
        "hub.challenge"
    )

    print()
    print("=" * 60)
    print(
        "WhatsApp webhook verification request"
    )

    print(
        f"Mode: {mode}"
    )

    print(
        f"Token provided: {bool(token)}"
    )

    print(
        f"Challenge provided: {bool(challenge)}"
    )

    print("=" * 60)

    if (
        mode == "subscribe"
        and token == WHATSAPP_VERIFY_TOKEN
        and challenge
    ):

        print(
            "WhatsApp webhook verification successful."
        )

        return PlainTextResponse(
            challenge
        )

    print(
        "WhatsApp webhook verification failed."
    )

    raise HTTPException(
        status_code=403,
        detail="Verification failed",
    )


# ============================================================
# LOAD WHATSAPP CONVERSATION HISTORY
# ============================================================

async def load_whatsapp_history(
    sender: str,
):
    """
    Load the previous WhatsApp conversation
    for a sender.

    The WhatsApp sender number is used as session_id.

    Returns:

        [
            {
                "user": "...",
                "bot": "..."
            }
        ]

    History is returned oldest -> newest.
    """

    sender = sender.strip()

    if not sender:

        return []

    db_generator = get_db()

    db = await db_generator.__anext__()

    try:

        result = await db.execute(
            select(ChatHistory)
            .where(
                ChatHistory.session_id == sender
            )
            .order_by(
                ChatHistory.created_at.desc()
            )
            .limit(5)
        )

        rows = result.scalars().all()

        history = []

        for item in reversed(rows):

            history.append(
                {
                    "user": item.message,
                    "bot": item.response,
                }
            )

        return history

    except Exception as exc:

        print()
        print(
            "ERROR loading WhatsApp conversation history:"
        )

        print(
            str(exc)
        )

        return []

    finally:

        await db.close()


# ============================================================
# SAVE WHATSAPP CHAT HISTORY
# ============================================================

async def save_whatsapp_chat_history(
    sender: str,
    question: str,
    answer: str,
    language: str,
):
    """
    Save a WhatsApp conversation.

    WhatsApp phone numbers are not application UUIDs,
    so sender is stored in session_id.

    user_id intentionally remains None.
    """

    sender = sender.strip()

    if not sender:

        return

    db_generator = get_db()

    db = await db_generator.__anext__()

    try:

        history = ChatHistory(
            user_id=None,
            session_id=sender,
            message=question,
            response=answer,
            language=language,
        )

        db.add(history)

        await db.commit()

        print(
            "WhatsApp conversation saved."
        )

    except Exception as exc:

        await db.rollback()

        print()
        print(
            "ERROR saving WhatsApp conversation:"
        )

        print(
            str(exc)
        )

    finally:

        await db.close()


# ============================================================
# PROCESS WHATSAPP DELIVERY STATUS
# ============================================================

async def process_whatsapp_delivery_status(
    status_event: dict,
):
    """
    Process a WhatsApp Cloud API delivery-status event.

    Meta sends events such as:

        sent
        delivered
        read
        failed

    The Meta WhatsApp message ID is found in:

        statuses[].id

    That value corresponds to:

        message_deliveries.provider_message_id
    """

    provider_message_id = (
        status_event.get(
            "id",
            "",
        )
        or ""
    ).strip()

    status_value = (
        status_event.get(
            "status",
            "",
        )
        or ""
    ).strip().lower()

    recipient_phone = (
        status_event.get(
            "recipient_id",
            "",
        )
        or ""
    ).strip()

    timestamp = (
        status_event.get(
            "timestamp",
            "",
        )
        or ""
    )

    print()
    print("=" * 60)

    print(
        "WhatsApp delivery status received"
    )

    print(
        f"Provider message ID: {provider_message_id}"
    )

    print(
        f"WhatsApp status: {status_value}"
    )

    print(
        f"Recipient: {recipient_phone}"
    )

    print(
        f"Timestamp: {timestamp}"
    )

    print("=" * 60)

    if not provider_message_id:

        print(
            "WARNING: WhatsApp status has no message ID."
        )

        return

    if not status_value:

        print(
            "WARNING: WhatsApp status has no status value."
        )

        return

    # --------------------------------------------------------
    # MAP META STATUS TO APPLICATION STATUS
    # --------------------------------------------------------

    status_mapping = {
        "sent": RecipientStatus.SENT,
        "delivered": RecipientStatus.DELIVERED,
        "read": RecipientStatus.DELIVERED,
        "failed": RecipientStatus.FAILED,
    }

    if status_value not in status_mapping:

        print(
            f"Ignoring unsupported WhatsApp status: "
            f"{status_value}"
        )

        return

    application_status = status_mapping[
        status_value
    ]

    # --------------------------------------------------------
    # GET DATABASE
    # --------------------------------------------------------

    db_generator = get_db()

    db = await db_generator.__anext__()

    try:

        # ====================================================
        # FIND DELIVERY BY META MESSAGE ID
        # ====================================================

        result = await db.execute(
            select(MessageDelivery)
            .where(
                MessageDelivery.provider_message_id
                == provider_message_id
            )
            .limit(1)
        )

        delivery = (
            result.scalars().first()
        )

        if not delivery:

            print()
            print(
                "WARNING: No message delivery found "
                "for WhatsApp provider message ID:"
            )

            print(
                provider_message_id
            )

            return

        print()
        print(
            "Matching message delivery found:"
        )

        print(
            f"Delivery ID: {delivery.id}"
        )

        print(
            f"Current status: {delivery.status}"
        )

        print(
            f"New status: {application_status}"
        )

        # ====================================================
        # EXTRACT ERROR MESSAGE
        # ====================================================

        error_message = None

        if status_value == "failed":

            errors = status_event.get(
                "errors",
                [],
            )

            if errors:

                first_error = errors[0]

                error_code = first_error.get(
                    "code"
                )

                error_title = first_error.get(
                    "title"
                )

                error_message_body = first_error.get(
                    "message"
                )

                error_message = (
                    f"WhatsApp delivery failed. "
                    f"code={error_code}; "
                    f"title={error_title}; "
                    f"message={error_message_body}"
                )

            else:

                error_message = (
                    "WhatsApp delivery failed."
                )

        # ====================================================
        # UPDATE MESSAGE DELIVERY
        # ====================================================

        await update_delivery_status(
            db=db,
            delivery=delivery,
            status=application_status,
            error_message=error_message,
        )

        # ====================================================
        # UPDATE CAMPAIGN RECIPIENT
        # ====================================================

        if delivery.recipient_id:

            recipient_result = await db.execute(
                select(CampaignRecipient)
                .where(
                    CampaignRecipient.id
                    == delivery.recipient_id
                )
                .limit(1)
            )

            campaign_recipient = (
                recipient_result.scalars().first()
            )

            if campaign_recipient:

                current_recipient_status = (
                    campaign_recipient.status
                )

                # --------------------------------------------
                # Do not downgrade a delivered/read message
                # back to SENT.
                # --------------------------------------------

                should_update_recipient = True

                if (
                    current_recipient_status
                    == RecipientStatus.DELIVERED
                    and application_status
                    == RecipientStatus.SENT
                ):

                    should_update_recipient = False

                if (
                    current_recipient_status
                    == RecipientStatus.FAILED
                    and application_status
                    == RecipientStatus.SENT
                ):

                    should_update_recipient = False

                if should_update_recipient:

                    campaign_recipient.status = (
                        application_status
                    )

                    print(
                        "Campaign recipient status updated:"
                    )

                    print(
                        f"{current_recipient_status} "
                        f"-> "
                        f"{application_status}"
                    )

        # ====================================================
        # COMMIT
        # ====================================================

        await db.commit()

        await db.refresh(
            delivery
        )

        print()
        print(
            "WhatsApp delivery status updated successfully."
        )

        print(
            f"Delivery ID: {delivery.id}"
        )

        print(
            f"Final status: {delivery.status}"
        )

        print(
            f"Sent at: {delivery.sent_at}"
        )

        print(
            f"Delivered at: {delivery.delivered_at}"
        )

        print(
            f"Failed at: {delivery.failed_at}"
        )

    except Exception as exc:

        await db.rollback()

        print()
        print("=" * 60)

        print(
            "ERROR processing WhatsApp delivery status:"
        )

        print(
            str(exc)
        )

        print("=" * 60)

    finally:

        await db.close()


# ============================================================
# PROCESS WHATSAPP STATUS WEBHOOK
# ============================================================

async def process_whatsapp_statuses(
    value: dict,
):
    """
    Process all WhatsApp delivery statuses contained
    inside a Meta webhook value object.
    """

    statuses = value.get(
        "statuses",
        [],
    )

    if not statuses:

        print(
            "No WhatsApp delivery statuses found."
        )

        return

    print()
    print(
        f"WhatsApp statuses received: {len(statuses)}"
    )

    for status_event in statuses:

        try:

            await process_whatsapp_delivery_status(
                status_event=status_event,
            )

        except Exception as exc:

            print()
            print(
                "ERROR processing individual "
                "WhatsApp status:"
            )

            print(
                str(exc)
            )


# ============================================================
# PROCESS WHATSAPP MESSAGE IN BACKGROUND
# ============================================================

async def process_whatsapp_message(
    sender: str,
    message_text: str,
    message_id: str,
):
    """
    Process an incoming WhatsApp message.

    Flow:

        WhatsApp message
              |
              v
        Load conversation history
              |
              v
        Run multilingual RAG
              |
              v
        Save conversation
              |
              v
        Send WhatsApp response
    """

    try:

        print()
        print("=" * 60)

        print(
            "Processing WhatsApp message in background"
        )

        print(
            f"Message ID: {message_id}"
        )

        print(
            f"From: {sender}"
        )

        print(
            f"Message: {message_text}"
        )

        print("=" * 60)

        # ====================================================
        # 1. LOAD HISTORY
        # ====================================================

        print(
            "Loading WhatsApp conversation history..."
        )

        history = await load_whatsapp_history(
            sender=sender,
        )

        print(
            f"Previous messages loaded: {len(history)}"
        )

        if history:

            print()
            print(
                "Previous conversation:"
            )

            for index, item in enumerate(
                history,
                start=1,
            ):

                print(
                    f"{index}. User: "
                    f"{item.get('user', '')}"
                )

                print(
                    f"   Bot: "
                    f"{item.get('bot', '')}"
                )

        # ====================================================
        # 2. RUN RAG PIPELINE
        # ====================================================

        print()
        print(
            "Running AI/RAG pipeline..."
        )

        result = await run_rag_pipeline(
            question=message_text,
            language=None,
            history=history,
        )

        # ====================================================
        # 3. GET ANSWER
        # ====================================================

        answer = result.get(
            "answer",
            "",
        )

        if not answer:

            answer = (
                "Sorry, I could not generate "
                "a response right now."
            )

        print()
        print(
            "AI response:"
        )

        print(
            answer
        )

        # ====================================================
        # 4. GET LANGUAGE
        # ====================================================

        detected_language = (
            result.get("language")
            or result.get("response_language")
            or "en"
        )

        detected_language = str(
            detected_language
        ).strip().lower()

        if not detected_language:

            detected_language = "en"

        print(
            f"Response language: {detected_language}"
        )

        # ====================================================
        # 5. PIPELINE INFORMATION
        # ====================================================

        print()
        print(
            "Pipeline result:"
        )

        print(
            f"Domain: "
            f"{result.get('domain', 'unknown')}"
        )

        print(
            f"Confidence: "
            f"{result.get('confidence_score', 0)}"
        )

        print(
            f"Confidence status: "
            f"{result.get('confidence_status', 'unknown')}"
        )

        print(
            f"Needs human: "
            f"{result.get('needs_human', False)}"
        )

        # ====================================================
        # 6. SAVE HISTORY
        # ====================================================

        await save_whatsapp_chat_history(
            sender=sender,
            question=message_text,
            answer=answer,
            language=detected_language,
        )

        # ====================================================
        # 7. SEND WHATSAPP RESPONSE
        # ====================================================

        print()
        print(
            "Sending AI response to WhatsApp..."
        )

        response = await send_whatsapp_message(
            to=sender,
            message=answer,
        )

        print()
        print(
            "WhatsApp AI reply sent successfully:"
        )

        print(
            response
        )

        print()

    except Exception as exc:

        print()
        print("=" * 60)

        print(
            "ERROR processing WhatsApp message:"
        )

        print(
            str(exc)
        )

        print("=" * 60)

        print()


# ============================================================
# WHATSAPP INCOMING MESSAGE / STATUS WEBHOOK
# ============================================================

@app.post("/webhook")
async def receive_whatsapp_message(
    request: Request,
    background_tasks: BackgroundTasks,
):
    """
    Receive WhatsApp Cloud API webhook events.

    Handles both:

        1. Incoming WhatsApp messages
        2. WhatsApp delivery statuses

    Delivery statuses include:

        sent
        delivered
        read
        failed

    The webhook returns HTTP 200 immediately.
    """

    # ========================================================
    # READ BODY
    # ========================================================

    try:

        data = await request.json()

    except Exception as exc:

        print()
        print(
            "ERROR: Could not parse WhatsApp webhook JSON."
        )

        print(
            str(exc)
        )

        return {
            "status": "error",
            "message": "Invalid JSON payload.",
        }

    print()
    print("=" * 60)

    print(
        "WhatsApp webhook received:"
    )

    print(
        data
    )

    print("=" * 60)

    # ========================================================
    # PROCESS ENTRIES
    # ========================================================

    try:

        entries = data.get(
            "entry",
            [],
        )

        if not entries:

            print(
                "Webhook contains no entries."
            )

            return {
                "status": "ok"
            }

        for entry in entries:

            changes = entry.get(
                "changes",
                [],
            )

            for change in changes:

                # =================================================
                # ONLY PROCESS MESSAGES FIELD
                # =================================================

                if change.get(
                    "field"
                ) != "messages":

                    print(
                        "Ignoring webhook field:"
                        f" {change.get('field')}"
                    )

                    continue

                value = change.get(
                    "value",
                    {},
                )

                # =================================================
                # PROCESS DELIVERY STATUSES
                # =================================================

                statuses = value.get(
                    "statuses",
                    [],
                )

                if statuses:

                    print()
                    print(
                        "Webhook contains WhatsApp "
                        "delivery statuses."
                    )

                    # ---------------------------------------------
                    # Process status updates in background.
                    # ---------------------------------------------

                    background_tasks.add_task(
                        process_whatsapp_statuses,
                        value,
                    )

                    print(
                        f"Scheduled {len(statuses)} "
                        "WhatsApp status event(s)."
                    )

                # =================================================
                # PROCESS INCOMING MESSAGES
                # =================================================

                messages = value.get(
                    "messages",
                    [],
                )

                if not messages:

                    if statuses:

                        print(
                            "Webhook contains statuses "
                            "but no incoming messages."
                        )

                    else:

                        print(
                            "Webhook contains no incoming messages."
                        )

                    continue

                # =================================================
                # PROCESS EACH MESSAGE
                # =================================================

                for message in messages:

                    # =============================================
                    # ONLY PROCESS TEXT MESSAGES
                    # =============================================

                    message_type = message.get(
                        "type"
                    )

                    if message_type != "text":

                        print(
                            f"Ignoring non-text message: "
                            f"{message_type}"
                        )

                        continue

                    # =============================================
                    # MESSAGE ID
                    # =============================================

                    message_id = message.get(
                        "id",
                        "",
                    )

                    # =============================================
                    # SENDER
                    # =============================================

                    sender = message.get(
                        "from",
                        "",
                    )

                    # =============================================
                    # MESSAGE TEXT
                    # =============================================

                    text_data = message.get(
                        "text",
                        {},
                    )

                    incoming_text = (
                        text_data.get(
                            "body",
                            "",
                        )
                        .strip()
                    )

                    # =============================================
                    # VALIDATE SENDER
                    # =============================================

                    if not sender:

                        print(
                            "Message has no sender."
                        )

                        continue

                    # =============================================
                    # VALIDATE MESSAGE
                    # =============================================

                    if not incoming_text:

                        print(
                            "Message has no text."
                        )

                        continue

                    # =============================================
                    # LOG MESSAGE
                    # =============================================

                    print()
                    print(
                        f"WhatsApp message from "
                        f"{sender}: "
                        f"{incoming_text}"
                    )

                    print(
                        f"Message ID: {message_id}"
                    )

                    # =============================================
                    # SCHEDULE BACKGROUND PROCESSING
                    # =============================================

                    background_tasks.add_task(
                        process_whatsapp_message,
                        sender,
                        incoming_text,
                        message_id,
                    )

                    print()
                    print(
                        "WhatsApp message accepted."
                    )

                    print(
                        "AI processing scheduled in background."
                    )

        # ========================================================
        # RETURN IMMEDIATELY
        # ========================================================

        return {
            "status": "ok"
        }

    except Exception as exc:

        print()
        print("=" * 60)

        print(
            "ERROR receiving WhatsApp webhook:"
        )

        print(
            str(exc)
        )

        print("=" * 60)

        return {
            "status": "error",
            "message": str(exc),
        }