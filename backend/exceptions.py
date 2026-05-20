class DomainError(Exception):
    """Base for all domain exceptions."""


class NotFoundError(DomainError):
    """A requested resource does not exist."""


class ConflictError(DomainError):
    """The request conflicts with current state (duplicate, already exists)."""


class BadRequestError(DomainError):
    """The request is malformed or violates business rules."""


class UnauthorizedError(DomainError):
    """Authentication or authorization failure."""
