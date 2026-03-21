# Checklist De Implementación + Runbook

## Checklist de implementación (orden recomendado)

1. Añadir dependencia de Blob:

```bash
npm install @vercel/blob
```

2. Crear helper de storage:

- `src/lib/storage/blob.ts`
- métodos:
  - `uploadPrivateFile(...)`
  - `readPrivateFileAsBuffer(...)`
  - `deletePrivateFile(...)`

3. Crear endpoints de upload:

- `src/app/api/uploads/context/route.ts`
- `src/app/api/uploads/visual/route.ts`

4. Cambiar cliente en [routine-builder.tsx](/Users/victorsaiz/Documents/MyCoach/src/components/routine-builder.tsx):

- subir archivo a storage al adjuntarlo.
- guardar referencias (`UploadedAsset[]`) en estado.
- en `personalizeForm()`, enviar solo JSON con referencias.

5. Cambiar intake route [route.ts](/Users/victorsaiz/Documents/MyCoach/src/app/api/intake/analyze/route.ts):

- recibir JSON de referencias.
- resolver referencias -> `ProcessedAttachment`.
- continuar con `generateIntakeAnalysis(...)`.

6. Adaptar [file-intelligence.ts](/Users/victorsaiz/Documents/MyCoach/src/lib/file-intelligence.ts):

- nuevo path para procesar desde `UploadedAsset`.

7. Logging útil (cliente + servidor):

- tamaño total antes de llamar a `/api/intake/analyze`
- conteo de archivos por tipo
- tiempo de subida y tiempo de análisis
- motivo exacto de fallo (`invalid-format`, `size-limit`, `storage-read-failed`)

## Límite funcional recomendado

- Contexto (`ruta/documentos`): máximo total `10 MB`.
- Visual (`fotos/videos`): máximo total `100 MB`.

## Qué mostrar en UI

- estado `subiendo...`
- progreso de subida por archivo
- estado `subido`
- estado `analizando...`
- error de subida con botón de reintento

## Runbook de incidentes

### Caso: 413 en `/api/intake/analyze`

Síntoma:

- consola navegador: `POST .../api/intake/analyze 413`

Causa:

- aún se está enviando binario en el request de intake.

Acción:

1. revisar payload de `personalizeForm()` en cliente.
2. confirmar que solo viajan referencias JSON.
3. comprobar logs de tamaño total.

### Caso: archivo sube pero no se analiza

Síntoma:

- upload OK, `analyze` 500.

Acción:

1. revisar permisos/token de lectura en storage.
2. verificar que `pathname/url` exista.
3. revisar logs en `route.ts` con `sessionId`.

### Caso: datos privados expuestos

Acción inmediata:

1. rotar token de storage.
2. invalidar URLs firmadas activas.
3. activar borrado agresivo temporal.

## Verificación final antes de deploy

- `npm run lint`
- `npm run build`
- test manual:
  - subida contexto (PDF/XLSX)
  - subida visual (~5MB vídeo)
  - analizar formulario sin 413
  - comprobar que el archivo no es accesible públicamente sin firma/token

## Rollout sugerido

1. Deploy en `preview`.
2. Test de carga con 2 usuarios simultáneos.
3. Activar en `production`.
4. Monitor 48h:
   - ratio de error en `/api/intake/analyze`
   - tiempo medio de subida
   - tiempo medio de análisis

