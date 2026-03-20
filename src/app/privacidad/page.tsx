import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacidad | MyCoach",
  description: "Política de privacidad de MyCoach.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacidad"
      intro="En MyCoach tratamos los datos personales con un enfoque de mínima exposición y uso responsable. Esta política explica qué información recogemos, por qué la usamos y cómo protegemos tu contexto deportivo."
      sections={[
        {
          title: "Información que recopilamos",
          paragraphs: [
            "Podemos recopilar datos de identificación básicos, información de contacto, contexto deportivo, historial de entrenamiento, objetivos físicos, respuestas del formulario, archivos que subas y eventos de uso de la plataforma.",
            "Cuando el usuario decide compartir imágenes, vídeos o rutinas, ese material se utiliza exclusivamente para prestar el servicio, mejorar la personalización del plan y mantener trazabilidad interna del proceso.",
          ],
        },
        {
          title: "Finalidad del tratamiento",
          paragraphs: [
            "Usamos la información para generar rutinas, adaptar recomendaciones, dar soporte, resolver incidencias técnicas, prevenir usos indebidos y mejorar la experiencia general del producto.",
            "También podemos emplear datos agregados o anonimizados con fines analíticos, de investigación interna y de optimización operativa, sin que ello permita identificar al usuario concreto.",
          ],
        },
        {
          title: "Conservación y seguridad",
          paragraphs: [
            "Conservamos la información durante el tiempo necesario para prestar el servicio, cumplir obligaciones legales o resolver reclamaciones relacionadas con la cuenta o el uso de la plataforma.",
            "Aplicamos medidas técnicas y organizativas razonables para reducir riesgos de acceso no autorizado, pérdida, alteración o divulgación accidental de la información.",
          ],
        },
        {
          title: "Derechos del usuario",
          paragraphs: [
            "El usuario puede solicitar acceso, rectificación, supresión, limitación del tratamiento u oposición al uso de sus datos, así como pedir la portabilidad cuando resulte aplicable.",
            "Para cualquier solicitud relacionada con privacidad o protección de datos, MyCoach podrá pedir información adicional para verificar la identidad antes de ejecutar cambios sobre la cuenta o el historial.",
          ],
        },
      ]}
      title="Política de privacidad"
      updatedAt="20 de marzo de 2026"
    />
  );
}
