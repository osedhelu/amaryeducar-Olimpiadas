class DomainError(Exception):
    """Error de dominio. Lleva un mensaje legible y un código HTTP sugerido."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class PinNoEncontrado(DomainError):
    def __init__(self):
        super().__init__("PIN no encontrado o sesión no activa", 404)


class ClaveIncorrecta(DomainError):
    def __init__(self):
        super().__init__("Clave incorrecta", 401)


class SesionNoActiva(DomainError):
    def __init__(self):
        super().__init__("Sesión no activa", 409)


class RespuestaDuplicada(DomainError):
    def __init__(self):
        super().__init__("Ya respondiste esta pregunta", 409)


class PreguntaNoActiva(DomainError):
    def __init__(self):
        super().__init__("La pregunta ya no está activa", 409)


class SinPermiso(DomainError):
    def __init__(self):
        super().__init__("No autorizado", 403)


class DatosInvalidos(DomainError):
    def __init__(self, message: str = "Datos inválidos"):
        super().__init__(message, 400)
