export function runPerfectWorld(entities: number) {
  const points = Array.from({ length: entities }, (_, index) => {
    const angle = (index / entities) * Math.PI * 2;
    const radius = 80 + (index % 5) * 12;
    return {
      x: 250 + Math.cos(angle) * radius,
      y: 220 + Math.sin(angle) * radius
    };
  });

  return {
    points,
    metrics: {
      entities,
      rings: Math.min(5, Math.ceil(entities / 8))
    }
  };
}
