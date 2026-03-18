type IllustrationProps = {
  className?: string;
};

export function HeroRoutineMachine({ className = "" }: IllustrationProps) {
  return (
    <div className={`hero-machine ${className}`}>
      <div className="hero-machine__halo" />
      <div className="hero-machine__panel">
        <div className="hero-machine__screen">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-machine__slot">
          <div className="hero-machine__card">
            <div className="hero-machine__chip" />
            <div className="hero-machine__line" />
          </div>
        </div>
        <div className="hero-machine__receipt">
          <div />
          <div />
          <div />
          <div className="hero-machine__check" />
        </div>
      </div>
    </div>
  );
}

export function ProcessScanner({ className = "" }: IllustrationProps) {
  return (
    <div className={`scanner-card ${className}`}>
      <div className="scanner-card__frame">
        <div className="scanner-card__figure">
          <div className="scanner-card__head" />
          <div className="scanner-card__torso" />
          <div className="scanner-card__arm scanner-card__arm--left" />
          <div className="scanner-card__arm scanner-card__arm--right" />
          <div className="scanner-card__leg scanner-card__leg--left" />
          <div className="scanner-card__leg scanner-card__leg--right" />
        </div>
        <div className="scanner-card__scanline" />
      </div>
      <div className="scanner-card__stats">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function ExcelMeshIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`excel-grid ${className}`}>
      <div className="excel-grid__sheet excel-grid__sheet--back" />
      <div className="excel-grid__sheet excel-grid__sheet--front">
        <div className="excel-grid__head">
          <span />
          <span />
          <span />
        </div>
        <div className="excel-grid__rows">
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <div className="excel-grid__row" key={rowIndex}>
              <span />
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      </div>
      <div className="excel-grid__badge">.xlsx</div>
    </div>
  );
}
