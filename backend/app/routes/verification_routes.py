from flask import Blueprint, request, g
from app.models.verification import IdentityVerification
from app.services.verification_service import VerificationService
from app.utils.decorators import token_required, permission_required
from app.utils.helpers import success_response, error_response, get_client_ip
from app.utils.validators import validate_required_fields

verification_bp = Blueprint("verification", __name__, url_prefix="/api/verification")

@verification_bp.route("", methods=["POST"])
@token_required
@permission_required("SUBMIT_VERIFICATION")
def submit_verification():
    user = g.current_user
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["document_type", "document_number"])
    if not is_valid:
        return error_response(err, "VALIDATION_ERROR", 400)

    ip_address = get_client_ip(request)
    success, message, record = VerificationService.submit_verification(
        user=user,
        document_type=data.get("document_type"),
        document_number=data.get("document_number"),
        details=data.get("details"),
        ip_address=ip_address
    )

    if not success:
        return error_response(message, "SUBMISSION_FAILED", 400)

    return success_response(
        data={"verification": record.to_dict()},
        message=message,
        status_code=201
    )

@verification_bp.route("", methods=["GET"])
@token_required
def list_verifications():
    user = g.current_user
    is_reviewer = user.has_permission("REVIEW_VERIFICATIONS")
    
    if is_reviewer and request.args.get("all", "false").lower() == "true":
        status_filter = request.args.get("status")
        query = IdentityVerification.query
        if status_filter:
            query = query.filter_by(status=status_filter.upper())
        records = query.order_by(IdentityVerification.submitted_at.desc()).all()
    else:
        records = IdentityVerification.query.filter_by(user_id=user.id).order_by(IdentityVerification.submitted_at.desc()).all()

    return success_response(
        data={"verifications": [r.to_dict() for r in records]},
        message="Verification requests retrieved."
    )

@verification_bp.route("/<int:ver_id>", methods=["GET"])
@token_required
def get_verification(ver_id):
    user = g.current_user
    record = IdentityVerification.query.get(ver_id)
    if not record:
        return error_response("Verification record not found.", "NOT_FOUND", 404)

    if record.user_id != user.id and not user.has_permission("REVIEW_VERIFICATIONS"):
        return error_response("Access denied.", "FORBIDDEN", 403)

    return success_response(
        data={"verification": record.to_dict()},
        message="Verification record retrieved."
    )

@verification_bp.route("/<int:ver_id>/review", methods=["POST"])
@token_required
@permission_required("REVIEW_VERIFICATIONS")
def review_verification(ver_id):
    reviewer = g.current_user
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["status"])
    if not is_valid:
        return error_response(err, "VALIDATION_ERROR", 400)

    status = data.get("status").strip().upper()
    notes = data.get("review_notes", "")

    ip_address = get_client_ip(request)
    success, message = VerificationService.review_verification(
        verification_id=ver_id,
        reviewer=reviewer,
        status=status,
        review_notes=notes,
        ip_address=ip_address
    )

    if not success:
        return error_response(message, "REVIEW_FAILED", 400)

    record = IdentityVerification.query.get(ver_id)
    return success_response(
        data={"verification": record.to_dict()},
        message=message
    )
