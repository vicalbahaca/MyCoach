# MyCoach

Plataforma web para crear rutinas personalizadas y mesociclos exportables a Excel para musculación, pesas, Hyrox y CrossFit.

## Qué incluye

- Landing page visual en `/` con copy SEO y CTA principal.
- Constructor en `/plan` con 5 pasos, adjuntos opcionales y formulario dinámico.
- Análisis previo con Gemini para personalizar preguntas según contexto y material visual.
- Generación de rutina en tablas con:
  - tooltips
  - modal de técnica por ejercicio
  - sustitución de ejercicios desde la UI
  - modificación posterior vía prompt
  - exportación a Excel editable
- Fallback heurístico local cuando `GEMINI_API_KEY` no está configurada.

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- `@google/genai` para Gemini
- `xlsx` para exportación a Excel
- `mammoth` para extraer texto de `.docx`

## Variables de entorno

Crea un `.env.local` con:

```bash
GEMINI_API_KEY=tu_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Si no defines `GEMINI_API_KEY`, la app seguirá funcionando con un generador fallback.

## Desarrollo

```bash
npm install
npm run dev
```

## Validación realizada

```bash
npm run lint
npm run build
```
