import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Cookies | MyCoach",
  description: "Política de cookies de MyCoach.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      intro="Esta política explica cómo MyCoach utiliza cookies y tecnologías similares para recordar preferencias, medir el rendimiento del sitio y mantener una experiencia más estable durante la navegación."
      sections={[
        {
          title: "Qué son las cookies",
          paragraphs: [
            "Las cookies son pequeños archivos que se almacenan en el navegador del usuario y que permiten reconocer determinadas interacciones, conservar estados de sesión y mejorar la experiencia de navegación.",
            "Además de cookies, la plataforma puede usar tecnologías equivalentes para medir uso, detectar errores, recordar configuraciones o mantener la sesión iniciada cuando proceda.",
          ],
        },
        {
          title: "Tipos de cookies que usamos",
          paragraphs: [
            "Podemos utilizar cookies técnicas necesarias para el funcionamiento básico del sitio, cookies de preferencia para recordar opciones de visualización y cookies analíticas para entender cómo se usa la plataforma.",
            "Cuando proceda, también podrán emplearse cookies de terceros asociadas a herramientas de medición, seguridad, infraestructura o integración con servicios externos relevantes para el funcionamiento del producto.",
          ],
        },
        {
          title: "Gestión y configuración",
          paragraphs: [
            "El usuario puede bloquear, limitar o eliminar cookies desde la configuración de su navegador. Sin embargo, algunas funcionalidades del sitio pueden verse afectadas si se desactivan cookies técnicas esenciales.",
            "MyCoach podrá actualizar la forma en que utiliza cookies cuando cambie la arquitectura del producto, las necesidades analíticas o los proveedores que intervienen en la prestación del servicio.",
          ],
        },
        {
          title: "Consentimiento",
          paragraphs: [
            "Cuando la normativa aplicable lo requiera, MyCoach solicitará el consentimiento del usuario antes de activar determinadas cookies no esenciales.",
            "La continuidad en el uso de ciertas áreas del servicio no sustituye el consentimiento cuando este sea obligatorio, por lo que la plataforma podrá limitar funciones concretas hasta que el usuario tome una decisión válida.",
          ],
        },
      ]}
      title="Política de cookies"
      updatedAt="20 de marzo de 2026"
    />
  );
}
