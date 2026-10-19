import heroImage from '../assets/hero-athletes.png';

export default function BackgroundScene() {
  return (
    <div className="bg-scene" aria-hidden="true">
      <div className="bg-img-container">
        <img
          src={heroImage}
          alt="Athletes sprinting and training with neon lighting"
          className="bg-hero-img"
        />
      </div>
      <div className="bg-overlay-radial" />
      <div className="bg-overlay-vignette" />
      <div className="bg-ambient-glow glow-1" />
      <div className="bg-ambient-glow glow-2" />
      <div className="bg-ambient-glow glow-3" />
    </div>
  );
}
