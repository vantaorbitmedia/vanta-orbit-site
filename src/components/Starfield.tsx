export default function Starfield() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="stars-layer stars-layer-one" />
      <div className="stars-layer stars-layer-two" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.28),transparent_28%),radial-gradient(circle_at_18%_64%,rgba(124,58,237,0.18),transparent_28%)]" />
    </div>
  );
}
