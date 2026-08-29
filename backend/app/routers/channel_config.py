from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

from app.models.channel_config import (
    ChannelConfig,
)

from app.schemas.channel_config import (
    ChannelConfigCreate,
    ChannelConfigUpdate,
    SUPPORTED_CHANNELS,
)

from app.services.channels import (
    normalize_channel,
    get_supported_channels,
)

from app.services.channel_dispatcher import (
    send_channel_message,
)


router = APIRouter(
    prefix="/channel-config",
    tags=["Channel Configuration"],
)


# ============================================================
# CONSTANTS
# ============================================================

SENSITIVE_KEYS = {
    "api_key",
    "api_secret",
    "access_token",
    "token",
    "password",
    "secret",
    "client_secret",
    "private_key",
    "authorization",
    "bearer_token",
}


# ============================================================
# HELPERS
# ============================================================

def validate_channel(
    channel: str,
) -> str:
    """
    Normalize and validate a channel name.
    """

    channel = normalize_channel(
        channel
    )

    supported_channels = set(
        SUPPORTED_CHANNELS
    )

    if channel not in supported_channels:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported channel "
                f"'{channel}'. "
                f"Supported channels are: "
                f"{', '.join(
                    sorted(supported_channels)
                )}"
            ),
        )

    return channel


# ============================================================
# MASK SENSITIVE CONFIGURATION
# ============================================================

def mask_config(
    config: dict | None,
) -> dict:
    """
    Mask sensitive values before returning configuration
    through the API.

    Example:

        access_token:
            abcdef123456

    becomes:

        access_token:
            ****3456
    """

    if not config:
        return {}

    masked = {}

    for key, value in config.items():

        key_lower = str(
            key
        ).lower()

        # ----------------------------------------------------
        # Sensitive value
        # ----------------------------------------------------

        if key_lower in SENSITIVE_KEYS:

            if value is None:

                masked[key] = ""

                continue

            value_string = str(
                value
            )

            if not value_string:

                masked[key] = ""

            elif len(value_string) <= 4:

                masked[key] = "****"

            else:

                masked[key] = (
                    "****"
                    + value_string[-4:]
                )

        # ----------------------------------------------------
        # Nested dictionary
        # ----------------------------------------------------

        elif isinstance(
            value,
            dict,
        ):

            masked[key] = mask_config(
                value
            )

        # ----------------------------------------------------
        # List
        # ----------------------------------------------------

        elif isinstance(
            value,
            list,
        ):

            masked_list = []

            for item in value:

                if isinstance(
                    item,
                    dict,
                ):

                    masked_list.append(
                        mask_config(
                            item
                        )
                    )

                else:

                    masked_list.append(
                        item
                    )

            masked[key] = masked_list

        # ----------------------------------------------------
        # Normal value
        # ----------------------------------------------------

        else:

            masked[key] = value

    return masked


# ============================================================
# SERIALIZE CHANNEL CONFIGURATION
# ============================================================

def serialize_channel_config(
    item: ChannelConfig,
) -> dict:
    """
    Convert ChannelConfig model to API response.
    """

    return {
        "id": str(
            item.id
        ),
        "channel": item.channel,
        "enabled": bool(
            item.enabled
        ),
        "config": mask_config(
            item.config or {}
        ),
        "created_at": (
            item.created_at.isoformat()
            if item.created_at
            else None
        ),
        "updated_at": (
            item.updated_at.isoformat()
            if item.updated_at
            else None
        ),
    }


# ============================================================
# GET SUPPORTED CHANNELS
# ============================================================

@router.get("/supported")
async def get_supported_channel_list():
    """
    Return all channels supported by the platform.
    """

    return {
        "channels": [
            {
                "channel": channel,
                "enabled": False,
            }
            for channel in get_supported_channels()
        ]
    }


# ============================================================
# GET ALL CHANNEL CONFIGURATIONS
# ============================================================

@router.get("/")
async def get_channel_configs(
    db: AsyncSession = Depends(get_db),
):
    """
    Return all configured communication channels.

    Sensitive credentials are masked.
    """

    result = await db.execute(
        select(ChannelConfig)
        .order_by(
            ChannelConfig.channel
        )
    )

    configs = result.scalars().all()

    return {
        "channels": [
            serialize_channel_config(
                item
            )
            for item in configs
        ]
    }


# ============================================================
# GET SINGLE CHANNEL
# ============================================================

@router.get("/{channel}")
async def get_channel_config(
    channel: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get configuration for one channel.
    """

    channel = validate_channel(
        channel
    )

    result = await db.execute(
        select(ChannelConfig)
        .where(
            ChannelConfig.channel == channel
        )
    )

    item = result.scalar_one_or_none()

    if item is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"No configuration found "
                f"for channel '{channel}'."
            ),
        )

    return serialize_channel_config(
        item
    )


# ============================================================
# CREATE CHANNEL CONFIGURATION
# ============================================================

@router.post(
    "/",
    status_code=201,
)
async def create_channel_config(
    data: ChannelConfigCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new channel configuration.
    """

    channel = validate_channel(
        data.channel
    )

    # --------------------------------------------------------
    # Check duplicate
    # --------------------------------------------------------

    result = await db.execute(
        select(ChannelConfig)
        .where(
            ChannelConfig.channel == channel
        )
    )

    existing = result.scalar_one_or_none()

    if existing:

        raise HTTPException(
            status_code=409,
            detail=(
                f"Configuration for channel "
                f"'{channel}' already exists."
            ),
        )

    # --------------------------------------------------------
    # Create
    # --------------------------------------------------------

    item = ChannelConfig(
        channel=channel,
        enabled=bool(
            data.enabled
        ),
        config=data.config or {},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(item)

    try:

        await db.commit()

        await db.refresh(
            item
        )

    except Exception as exc:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to create channel "
                f"configuration: {exc}"
            ),
        )

    return {
        "message": (
            f"Channel '{channel}' "
            "configuration created."
        ),
        "channel": serialize_channel_config(
            item
        ),
    }


# ============================================================
# UPDATE CHANNEL CONFIGURATION
# ============================================================

@router.put("/{channel}")
async def update_channel_config(
    channel: str,
    data: ChannelConfigUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing channel configuration.
    """

    channel = validate_channel(
        channel
    )

    result = await db.execute(
        select(ChannelConfig)
        .where(
            ChannelConfig.channel == channel
        )
    )

    item = result.scalar_one_or_none()

    if item is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"No configuration found "
                f"for channel '{channel}'."
            ),
        )

    # --------------------------------------------------------
    # Enabled status
    # --------------------------------------------------------

    if data.enabled is not None:

        item.enabled = bool(
            data.enabled
        )

    # --------------------------------------------------------
    # Configuration
    # --------------------------------------------------------

    if data.config is not None:

        item.config = data.config

    item.updated_at = datetime.utcnow()

    try:

        await db.commit()

        await db.refresh(
            item
        )

    except Exception as exc:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to update channel "
                f"configuration: {exc}"
            ),
        )

    return {
        "message": (
            f"Channel '{channel}' "
            "configuration updated."
        ),
        "channel": serialize_channel_config(
            item
        ),
    }


# ============================================================
# DELETE CHANNEL CONFIGURATION
# ============================================================

@router.delete("/{channel}")
async def delete_channel_config(
    channel: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a channel configuration.
    """

    channel = validate_channel(
        channel
    )

    result = await db.execute(
        select(ChannelConfig)
        .where(
            ChannelConfig.channel == channel
        )
    )

    item = result.scalar_one_or_none()

    if item is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"No configuration found "
                f"for channel '{channel}'."
            ),
        )

    try:

        await db.delete(
            item
        )

        await db.commit()

    except Exception as exc:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to delete channel "
                f"configuration: {exc}"
            ),
        )

    return {
        "message": (
            f"Channel '{channel}' "
            "configuration deleted."
        ),
        "channel": channel,
    }


# ============================================================
# ENABLE CHANNEL
# ============================================================

@router.post("/{channel}/enable")
async def enable_channel(
    channel: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Enable a configured communication channel.
    """

    channel = validate_channel(
        channel
    )

    result = await db.execute(
        select(ChannelConfig)
        .where(
            ChannelConfig.channel == channel
        )
    )

    item = result.scalar_one_or_none()

    if item is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"No configuration found "
                f"for channel '{channel}'. "
                "Create the configuration first."
            ),
        )

    item.enabled = True
    item.updated_at = datetime.utcnow()

    try:

        await db.commit()

        await db.refresh(
            item
        )

    except Exception as exc:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to enable channel: "
                f"{exc}"
            ),
        )

    return {
        "message": (
            f"Channel '{channel}' enabled."
        ),
        "channel": serialize_channel_config(
            item
        ),
    }


# ============================================================
# DISABLE CHANNEL
# ============================================================

@router.post("/{channel}/disable")
async def disable_channel(
    channel: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Disable a configured communication channel.
    """

    channel = validate_channel(
        channel
    )

    result = await db.execute(
        select(ChannelConfig)
        .where(
            ChannelConfig.channel == channel
        )
    )

    item = result.scalar_one_or_none()

    if item is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"No configuration found "
                f"for channel '{channel}'. "
                "Create the configuration first."
            ),
        )

    item.enabled = False
    item.updated_at = datetime.utcnow()

    try:

        await db.commit()

        await db.refresh(
            item
        )

    except Exception as exc:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to disable channel: "
                f"{exc}"
            ),
        )

    return {
        "message": (
            f"Channel '{channel}' disabled."
        ),
        "channel": serialize_channel_config(
            item
        ),
    }


# ============================================================
# CONFIGURATION TEST
# ============================================================

@router.post("/{channel}/test")
async def test_channel(
    channel: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Test whether a channel has the minimum configuration.

    This endpoint does NOT send a real message.

    Use /dispatch-test when you specifically want to
    exercise the dispatcher.
    """

    channel = validate_channel(
        channel
    )

    result = await db.execute(
        select(ChannelConfig)
        .where(
            ChannelConfig.channel == channel
        )
    )

    item = result.scalar_one_or_none()

    if item is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"No configuration found "
                f"for channel '{channel}'."
            ),
        )

    config = item.config or {}

    # --------------------------------------------------------
    # Configuration must exist
    # --------------------------------------------------------

    if not config:

        return {
            "success": False,
            "channel": channel,
            "enabled": bool(
                item.enabled
            ),
            "message": (
                "Channel exists but no configuration "
                "has been provided yet."
            ),
        }

    # --------------------------------------------------------
    # Required provider
    # --------------------------------------------------------

    if not config.get(
        "provider"
    ):

        return {
            "success": False,
            "channel": channel,
            "enabled": bool(
                item.enabled
            ),
            "message": (
                "Channel configuration is incomplete."
            ),
            "missing_fields": [
                "provider"
            ],
        }

    # --------------------------------------------------------
    # Channel-specific requirements
    # --------------------------------------------------------

    required_fields = {
        "email": [
            "provider",
        ],
        "sms": [
            "provider",
        ],
        "whatsapp": [
            "provider",
        ],
        "push": [
            "provider",
        ],
        "web_broadcast": [
            "provider",
        ],
    }

    missing_fields = []

    for field in required_fields.get(
        channel,
        [],
    ):

        value = config.get(
            field
        )

        if value is None:

            missing_fields.append(
                field
            )

        elif isinstance(
            value,
            str,
        ) and not value.strip():

            missing_fields.append(
                field
            )

    if missing_fields:

        return {
            "success": False,
            "channel": channel,
            "enabled": bool(
                item.enabled
            ),
            "message": (
                "Channel configuration is incomplete."
            ),
            "missing_fields": missing_fields,
        }

    # --------------------------------------------------------
    # Configuration-only success
    # --------------------------------------------------------

    return {
        "success": True,
        "channel": channel,
        "enabled": bool(
            item.enabled
        ),
        "message": (
            f"Channel '{channel}' "
            "configuration test passed."
        ),
        "mode": "configuration_only",
        "note": (
            "No real message was sent."
        ),
    }


# ============================================================
# DISPATCHER TEST
# ============================================================

@router.post("/{channel}/dispatch-test")
async def dispatch_test_channel(
    channel: str,
    recipient: str,
    message: str = (
        "This is a test message "
        "from the Mass Communication Platform."
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Test the channel dispatcher.

    IMPORTANT:

    - Email/SMS/Push/Web Broadcast currently use dummy
      implementations.
    - WhatsApp uses the existing real WhatsApp service.

    Therefore, do NOT call this endpoint for WhatsApp
    unless you intentionally want to send a real WhatsApp
    message.
    """

    channel = validate_channel(
        channel
    )

    recipient = recipient.strip()
    message = message.strip()

    if not recipient:

        raise HTTPException(
            status_code=400,
            detail="Recipient is required.",
        )

    if not message:

        raise HTTPException(
            status_code=400,
            detail="Message is required.",
        )

    # --------------------------------------------------------
    # Get configuration
    # --------------------------------------------------------

    result = await db.execute(
        select(ChannelConfig)
        .where(
            ChannelConfig.channel == channel
        )
    )

    item = result.scalar_one_or_none()

    if item is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"No configuration found "
                f"for channel '{channel}'."
            ),
        )

    # --------------------------------------------------------
    # Channel must be enabled
    # --------------------------------------------------------

    if not item.enabled:

        return {
            "success": False,
            "channel": channel,
            "recipient": recipient,
            "message": (
                "Channel is configured but disabled."
            ),
            "mode": "dispatcher_test",
        }

    config = item.config or {}

    # --------------------------------------------------------
    # Dispatch
    # --------------------------------------------------------

    try:

        delivery_result = (
            await send_channel_message(
                channel=channel,
                recipient=recipient,
                message=message,
                config=config,
            )
        )

    except Exception as exc:

        return {
            "success": False,
            "channel": channel,
            "recipient": recipient,
            "message": (
                "Channel dispatcher failed."
            ),
            "error": str(exc),
            "mode": "dispatcher_test",
        }

    # --------------------------------------------------------
    # Convert result
    # --------------------------------------------------------

    if hasattr(
        delivery_result,
        "to_dict",
    ):

        result_data = (
            delivery_result.to_dict()
        )

    elif hasattr(
        delivery_result,
        "model_dump",
    ):

        result_data = (
            delivery_result.model_dump()
        )

    elif isinstance(
        delivery_result,
        dict,
    ):

        result_data = delivery_result

    else:

        result_data = {
            "success": bool(
                getattr(
                    delivery_result,
                    "success",
                    False,
                )
            ),
            "channel": channel,
            "recipient": recipient,
            "message": message,
            "error": getattr(
                delivery_result,
                "error",
                None,
            ),
        }

    return {
        "success": bool(
            result_data.get(
                "success",
                False,
            )
        ),
        "channel": channel,
        "recipient": recipient,
        "message": message,
        "delivery": result_data,
        "mode": "dispatcher_test",
    }
