import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Términos | MyCoach",
  description: "Términos y condiciones de uso de MyCoach.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Términos"
      intro="Estos términos regulan el acceso y uso de MyCoach. Al utilizar la plataforma, el usuario acepta estas condiciones y se compromete a usar el servicio de forma lícita, responsable y coherente con su finalidad."
      sections={[
        {
          title: "Uso de la plataforma",
          paragraphs: [
            "MyCoach ofrece herramientas de planificación, organización de rutinas y visualización de información relacionada con el entrenamiento. El usuario es responsable de revisar que el uso del servicio sea adecuado para su situación personal.",
            "No está permitido utilizar la plataforma para fines fraudulentos, para introducir contenido ilícito o para intentar comprometer la seguridad, disponibilidad o integridad técnica del servicio.",
          ],
        },
        {
          title: "Naturaleza del servicio",
          paragraphs: [
            "La información disponible en MyCoach tiene carácter informativo y operativo dentro del contexto de planificación deportiva. No sustituye la valoración médica, fisioterapéutica o clínica cuando esta resulte necesaria.",
            "Cada usuario debe valorar con criterio propio, y en su caso con ayuda profesional, si una rutina o recomendación encaja con su estado de salud, lesiones previas o nivel de experiencia.",
          ],
        },
        {
          title: "Propiedad intelectual",
          paragraphs: [
            "El diseño de la plataforma, sus textos, flujos, estructuras visuales, materiales descargables y elementos distintivos de marca forman parte de los activos de MyCoach o de sus respectivos titulares.",
            "Queda prohibida la reproducción, distribución o explotación no autorizada de los contenidos del servicio salvo consentimiento expreso y por escrito del titular correspondiente.",
          ],
        },
        {
          title: "Limitación de responsabilidad",
          paragraphs: [
            "MyCoach no garantiza disponibilidad continua e ininterrumpida del servicio y podrá realizar pausas, actualizaciones o tareas de mantenimiento cuando sea necesario para asegurar el funcionamiento de la plataforma.",
            "En la máxima medida permitida por la ley, MyCoach no responderá por daños indirectos, pérdida de datos, interrupciones temporales del servicio o decisiones tomadas exclusivamente por el usuario a partir del contenido mostrado.",
          ],
        },
      ]}
      title="Términos y condiciones"
      updatedAt="20 de marzo de 2026"
    />
  );
}
