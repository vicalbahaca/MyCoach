# Setup En Vercel (Storage Privado)

Este documento deja la base para eliminar el `413 Content Too Large` en `/api/intake/analyze` moviendo la subida de archivos a storage privado.

## Objetivo

- Subir archivos grandes sin pasar por el body de una Function.
- Evitar exposición pública de fotos y vídeos.
- Mantener análisis con Gemini sin romper el flujo actual de `/plan`.

## Recomendación de base

- Storage: `Vercel Blob` en modo privado.
- API de análisis: sigue en `src/app/api/intake/analyze/route.ts`, pero recibiendo referencias de archivo (no binario).
- DB: opcional al inicio; recomendada en producción para trazabilidad.

## 1) Dependencias

Instalar en el repo:

```bash
npm install @vercel/blob
```

## 2) Crear storage en Vercel

1. Vercel Dashboard -> proyecto `my-coach`.
2. Storage -> Blob -> crear store.
3. Configurar acceso privado (no público por defecto).

## 3) Variables de entorno

En Vercel (Production/Preview/Development):

- `BLOB_READ_WRITE_TOKEN` (lo genera Vercel al conectar Blob).
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (si aplica en este proyecto).

## 4) Privacidad real (sin exponer archivos)

- Guardar objetos como privados.
- No persistir URLs públicas en frontend.
- Emitir URL firmada de lectura solo desde backend y con expiración corta.
- Borrar objeto cuando termine el análisis o aplicar TTL corto (24-72h).

## 5) Concurrencia (2+ usuarios simultáneos)

No hay conflicto si la clave de objeto es única:

```txt
uploads/{userId}/{sessionId}/{timestamp}-{uuid}-{safeFilename}
```

Reglas:

- Nunca usar nombre de archivo plano como key.
- Nunca escribir sobre la misma key.
- Guardar `sessionId` por intento de análisis.

## 6) ¿Necesito base de datos?

No es obligatorio para la primera versión, pero sí recomendable.

Sin DB (mínimo viable):

- subir -> analizar -> borrar.
- guardar referencias en memoria de la sesión cliente.

Con DB (recomendado):

- auditar `owner`, `sessionId`, `status`, `createdAt`.
- reintentos y limpieza fiable.
- soporte y trazabilidad de errores.

Puedes usar:

- `Vercel Postgres` (si quieres mantener todo en Vercel).
- `Supabase` (si ya usáis su stack/Auth/RLS).
