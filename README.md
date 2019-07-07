# cajamar-scraper
Obtiene los últimos movimientos de la cuenta bancaria mediante la información online.


flujo seguridad

servidor tiene la clave privada. cliente tiene la clave publica.
cliente comienza la conexion, mandando a cliente una clave simétrica (encriptada con la clave publica)
servidor desencripta con su clave privada, obteniendo asi la clave simetrica. Entonces cifra un mensaje "OK" y se lo manda a cliente.
Cliente desencripta con la clave simetrica, si lee el "OK" entonces manda sus credenciales encriptadas con la clave simetrica.

A partir de ese momento, servidor y cliente se van comunicando con mensajes encriptados con esa clave simetrica.