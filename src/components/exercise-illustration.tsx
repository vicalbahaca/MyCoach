import type { ExercisePattern } from "@/lib/types";

type Props = {
  pattern: ExercisePattern;
  name: string;
};

function PathSet({ pattern }: { pattern: ExercisePattern }) {
  switch (pattern) {
    case "press-incline":
    case "press-horizontal":
      return (
        <>
          <line x1="88" y1="170" x2="170" y2="118" />
          <line x1="170" y1="118" x2="246" y2="118" />
          <circle cx="86" cy="170" r="12" />
          <circle cx="248" cy="118" r="12" />
          <line x1="126" y1="118" x2="126" y2="212" />
          <line x1="126" y1="212" x2="206" y2="212" />
        </>
      );
    case "row":
      return (
        <>
          <line x1="84" y1="162" x2="150" y2="162" />
          <line x1="150" y1="162" x2="210" y2="132" />
          <line x1="210" y1="132" x2="248" y2="132" />
          <circle cx="80" cy="162" r="10" />
          <circle cx="248" cy="132" r="10" />
        </>
      );
    case "pulldown":
    case "pullover":
      return (
        <>
          <line x1="86" y1="84" x2="246" y2="84" />
          <line x1="130" y1="84" x2="130" y2="212" />
          <line x1="202" y1="84" x2="202" y2="212" />
          <line x1="130" y1="118" x2="202" y2="118" />
          <circle cx="132" cy="212" r="10" />
          <circle cx="202" cy="212" r="10" />
        </>
      );
    case "squat":
      return (
        <>
          <line x1="90" y1="98" x2="250" y2="98" />
          <line x1="126" y1="98" x2="126" y2="204" />
          <line x1="210" y1="98" x2="210" y2="204" />
          <line x1="126" y1="162" x2="170" y2="204" />
          <line x1="210" y1="162" x2="170" y2="204" />
        </>
      );
    case "hinge":
      return (
        <>
          <line x1="118" y1="104" x2="206" y2="104" />
          <line x1="140" y1="104" x2="168" y2="170" />
          <line x1="168" y1="170" x2="216" y2="208" />
          <line x1="168" y1="170" x2="128" y2="214" />
          <circle cx="114" cy="106" r="10" />
          <circle cx="208" cy="106" r="10" />
        </>
      );
    case "leg-curl":
    case "leg-extension":
      return (
        <>
          <rect x="94" y="138" width="128" height="14" rx="7" />
          <line x1="138" y1="152" x2="138" y2="216" />
          <line x1="180" y1="152" x2="180" y2="216" />
          <line x1="180" y1="170" x2="248" y2="150" />
          <circle cx="250" cy="150" r="10" />
        </>
      );
    case "raise-lateral":
    case "rear-delt":
      return (
        <>
          <line x1="170" y1="88" x2="170" y2="186" />
          <line x1="170" y1="116" x2="112" y2="144" />
          <line x1="170" y1="116" x2="228" y2="144" />
          <circle cx="112" cy="144" r="10" />
          <circle cx="228" cy="144" r="10" />
          <line x1="170" y1="186" x2="138" y2="226" />
          <line x1="170" y1="186" x2="202" y2="226" />
        </>
      );
    case "curl":
      return (
        <>
          <line x1="116" y1="106" x2="170" y2="148" />
          <line x1="224" y1="106" x2="170" y2="148" />
          <circle cx="112" cy="104" r="10" />
          <circle cx="228" cy="104" r="10" />
          <line x1="170" y1="148" x2="170" y2="224" />
        </>
      );
    case "triceps":
      return (
        <>
          <line x1="170" y1="82" x2="170" y2="170" />
          <line x1="170" y1="110" x2="126" y2="84" />
          <line x1="170" y1="110" x2="216" y2="84" />
          <line x1="170" y1="148" x2="126" y2="208" />
          <line x1="170" y1="148" x2="216" y2="208" />
          <circle cx="126" cy="84" r="10" />
          <circle cx="216" cy="84" r="10" />
        </>
      );
    case "calf":
      return (
        <>
          <line x1="150" y1="86" x2="150" y2="214" />
          <line x1="192" y1="86" x2="192" y2="214" />
          <line x1="150" y1="214" x2="108" y2="226" />
          <line x1="192" y1="214" x2="234" y2="226" />
          <rect x="132" y="86" width="76" height="16" rx="8" />
        </>
      );
    case "abs":
      return (
        <>
          <rect x="118" y="96" width="104" height="126" rx="20" />
          <line x1="170" y1="110" x2="170" y2="206" />
          <line x1="132" y1="138" x2="208" y2="138" />
          <line x1="132" y1="172" x2="208" y2="172" />
        </>
      );
    default:
      return (
        <>
          <circle cx="170" cy="100" r="28" />
          <rect x="120" y="144" width="100" height="72" rx="20" />
          <line x1="170" y1="216" x2="132" y2="240" />
          <line x1="170" y1="216" x2="208" y2="240" />
        </>
      );
  }
}

export function ExerciseIllustration({ pattern, name }: Props) {
  return (
    <svg
      aria-label={`Ilustración esquemática del ejercicio ${name}`}
      className="h-full w-full"
      viewBox="0 0 340 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="18" y="18" width="304" height="244" rx="32" fill="url(#exercise-bg)" />
      <rect
        x="36"
        y="36"
        width="268"
        height="208"
        rx="26"
        fill="rgba(255,255,255,0.82)"
        stroke="rgba(66,108,255,0.16)"
      />
      <g
        stroke="rgba(17,17,17,0.9)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="10"
      >
        <PathSet pattern={pattern} />
      </g>
      <defs>
        <linearGradient id="exercise-bg" x1="28" y1="18" x2="312" y2="262" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBFAF7" />
          <stop offset="1" stopColor="#EAF0FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
