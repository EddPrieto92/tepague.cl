# Gestión de secretos

## Regla

Los valores de credenciales no se guardan en el repositorio, documentación, notas, tickets, capturas, logs ni URLs compartidas.

Los nombres de variables pueden documentarse, pero sus valores y formatos no.

## Almacenamiento permitido

- Desarrollo local: `.env.local`, ignorado por Git.
- Despliegue: gestor de secretos de la plataforma.
- Integraciones: gestor de credenciales del proveedor correspondiente.

## Rotación

Si una credencial se pega en un archivo versionado, una nota, un log o un canal compartido, se considera comprometida. Borrarla no es suficiente: debe revocarse y reemplazarse en el proveedor.

## Validación

Antes de compartir o publicar cambios:

```bash
npm run security:secrets
npm run typecheck
npm test
npm run build
```

La validación local informa únicamente los archivos sospechosos; nunca imprime el valor detectado.
