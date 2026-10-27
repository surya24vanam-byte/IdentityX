from flask import Blueprint, request, g
from datetime import datetime, timezone
from app.extensions import db
from app.models.credential import Credential
from app.services.security_service import SecurityService
from app.utils.decorators import token_required, permission_required
from app.utils.helpers import success_response, error_response, get_client_ip
from app.utils.validators import validate_required_fields

credential_bp = Blueprint("credentials", __name__, url_prefix="/api/credentials")

@credential_bp.route("", methods=["GET"])
@token_required
@permission_required("VIEW_CREDENTIALS")
def list_credentials():
    user = g.current_user
    # Admin can view all if requested with ?all=true, else user's own
    show_all = request.args.get("all", "false").lower() == "true" and user.has_permission("MANAGE_USERS")
    if show_all:
        creds = Credential.query.order_by(Credential.created_at.desc()).all()
    else:
        creds = Credential.query.filter_by(user_id=user.id).order_by(Credential.created_at.desc()).all()

    return success_response(
        data={"credentials": [c.to_dict() for c in creds]},
        message="Credentials retrieved."
    )

@credential_bp.route("", methods=["POST"])
@token_required
@permission_required("ADD_CREDENTIAL")
def create_credential():
    user = g.current_user
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["credential_type", "title", "issuer"])
    if not is_valid:
        return error_response(err, "VALIDATION_ERROR", 400)

    cred = Credential(
        user_id=user.id,
        credential_type=data.get("credential_type").strip().upper(),
        title=data.get("title").strip(),
        issuer=data.get("issuer").strip(),
        status="ACTIVE"
    )
    if "metadata" in data and isinstance(data["metadata"], dict):
        cred.set_metadata(data["metadata"])

    db.session.add(cred)
    db.session.commit()

    SecurityService.log_event(
        event_type="CREDENTIAL_ADDED",
        description=f"User {user.email} added digital credential: {cred.title} ({cred.credential_type}).",
        severity="LOW",
        user_id=user.id,
        ip_address=get_client_ip(request),
        metadata={"credential_id": cred.id, "type": cred.credential_type}
    )

    return success_response(
        data={"credential": cred.to_dict()},
        message="Digital credential created successfully.",
        status_code=201
    )

@credential_bp.route("/<int:cred_id>", methods=["GET"])
@token_required
@permission_required("VIEW_CREDENTIALS")
def get_credential(cred_id):
    user = g.current_user
    cred = Credential.query.get(cred_id)
    if not cred:
        return error_response("Credential not found.", "NOT_FOUND", 404)

    if cred.user_id != user.id and not user.has_permission("MANAGE_USERS"):
        return error_response("Access denied to this credential.", "FORBIDDEN", 403)

    return success_response(data={"credential": cred.to_dict()}, message="Credential retrieved.")

@credential_bp.route("/<int:cred_id>", methods=["PUT"])
@token_required
def update_credential(cred_id):
    user = g.current_user
    cred = Credential.query.get(cred_id)
    if not cred:
        return error_response("Credential not found.", "NOT_FOUND", 404)

    if cred.user_id != user.id and not user.has_permission("MANAGE_USERS"):
        return error_response("Access denied to update this credential.", "FORBIDDEN", 403)

    data = request.get_json(silent=True) or {}
    if "title" in data and data["title"]:
        cred.title = data["title"].strip()
    if "issuer" in data and data["issuer"]:
        cred.issuer = data["issuer"].strip()
    if "metadata" in data and isinstance(data["metadata"], dict):
        cred.set_metadata(data["metadata"])

    db.session.commit()

    SecurityService.log_event(
        event_type="CREDENTIAL_UPDATED",
        description=f"User {user.email} updated digital credential: {cred.title}.",
        severity="LOW",
        user_id=user.id,
        ip_address=get_client_ip(request)
    )

    return success_response(data={"credential": cred.to_dict()}, message="Credential updated.")

@credential_bp.route("/<int:cred_id>", methods=["DELETE"])
@token_required
def delete_credential(cred_id):
    user = g.current_user
    cred = Credential.query.get(cred_id)
    if not cred:
        return error_response("Credential not found.", "NOT_FOUND", 404)

    if cred.user_id != user.id and not user.has_permission("MANAGE_USERS"):
        return error_response("Access denied to delete this credential.", "FORBIDDEN", 403)

    db.session.delete(cred)
    db.session.commit()

    SecurityService.log_event(
        event_type="CREDENTIAL_DELETED",
        description=f"User {user.email} removed credential: {cred.title}.",
        severity="LOW",
        user_id=user.id,
        ip_address=get_client_ip(request)
    )

    return success_response(message="Credential removed successfully.")

@credential_bp.route("/<int:cred_id>/verify", methods=["POST"])
@token_required
def request_or_complete_verification(cred_id):
    user = g.current_user
    cred = Credential.query.get(cred_id)
    if not cred:
        return error_response("Credential not found.", "NOT_FOUND", 404)

    # If Admin, can directly verify or reject
    if user.has_permission("REVIEW_VERIFICATIONS"):
        data = request.get_json(silent=True) or {}
        new_status = data.get("status", "VERIFIED").upper()
        if new_status not in ("VERIFIED", "REVOKED", "ACTIVE"):
            new_status = "VERIFIED"

        cred.status = new_status
        if new_status == "VERIFIED":
            cred.verified_at = datetime.now(timezone.utc)
        db.session.commit()

        SecurityService.log_event(
            event_type="CREDENTIAL_VERIFIED_BY_ADMIN",
            description=f"Admin {user.email} changed credential {cred.id} status to {new_status}.",
            severity="LOW",
            user_id=cred.user_id,
            ip_address=get_client_ip(request)
        )

        return success_response(data={"credential": cred.to_dict()}, message=f"Credential marked as {new_status}.")

    # If regular user, requests verification
    if cred.user_id != user.id:
        return error_response("Access denied.", "FORBIDDEN", 403)

    cred.status = "PENDING_VERIFICATION"
    db.session.commit()

    SecurityService.log_event(
        event_type="CREDENTIAL_VERIFICATION_REQUESTED",
        description=f"User {user.email} requested verification for credential '{cred.title}'.",
        severity="LOW",
        user_id=user.id,
        ip_address=get_client_ip(request)
    )

    return success_response(data={"credential": cred.to_dict()}, message="Verification requested. A compliance officer will review it.")
