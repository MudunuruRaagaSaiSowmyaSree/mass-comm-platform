from fastapi import Depends, HTTPException, status
from app.core.deps import get_current_user
from app.models.user import User, Role


def require_role(*allowed_roles: Role):
    def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:

        print(
            "RBAC DEBUG:",
            "user_role=", repr(current_user.role),
            "user_role_type=", type(current_user.role),
            "allowed_roles=", allowed_roles,
        )

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )

        return current_user

    return role_checker