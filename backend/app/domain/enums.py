from enum import Enum


class EstadoSesion(str, Enum):
    BORRADOR = "borrador"
    LOBBY = "lobby"
    PREGUNTA = "pregunta"
    RESULTADO = "resultado"
    RETO = "reto"
    PODIUM = "podium"
    FINAL = "final"


class TipoPregunta(str, Enum):
    OPCION_MULTIPLE = "opcion-multiple"
    ABIERTA = "abierta"


class SesionNumero(str, Enum):
    UNO = "1"
    DOS = "2"


class TipoReto(str, Enum):
    INDIVIDUAL = "individual"
    GRUPAL = "grupal"


class RolJWT(str, Enum):
    ANON = "anon"
    ESTUDIANTE = "estudiante"
    DOCENTE = "docente"
