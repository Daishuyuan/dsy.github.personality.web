export function runThreePlayground(objects: number, helper: boolean) {
  const points = Array.from({ length: objects }, (_, index) => ({
    x: 250 + Math.cos((index / objects) * Math.PI * 2) * 120,
    y: 220 + Math.sin((index / objects) * Math.PI * 2) * 120
  }));

  return {
    points,
    metrics: {
      objects,
      helper: helper ? "显示辅助线" : "隐藏辅助线"
    }
  };
}
