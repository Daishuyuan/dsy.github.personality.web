import type { AlgorithmFrame, AlgorithmPoint, ParticleWorldVisualization } from "../data/types";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: AlgorithmPoint[];
}

const bounds = { width: 520, height: 360 };
const center = { x: bounds.width / 2, y: bounds.height / 2 };

export function runPerfectWorld(entities: number) {
  let particles = initializeParticles(entities);
  const frames: AlgorithmFrame[] = [];
  let collisions = 0;

  frames.push(buildFrame(particles, 0, collisions, "力场初始化", "实体按环形轨道初始化，每个实体都有位置、速度和轨迹缓存。"));

  for (let step = 1; step <= 72; step += 1) {
    const next = integrate(particles);
    particles = next.particles;
    collisions += next.collisions;
    if (step % 2 === 0 || step === 72) {
      frames.push(
        buildFrame(
          particles,
          step,
          collisions,
          "力场积分",
          "中心吸引力、切向扰动、速度阻尼和边界反弹共同决定下一帧位置。"
        )
      );
    }
  }

  const points = particles.map(({ x, y }) => ({ x, y }));
  const trails = particles.map((particle) => particle.trail.slice());
  const kineticEnergy = getKineticEnergy(particles);

  return {
    points,
    trails,
    frames,
    metrics: {
      entities,
      steps: 72,
      collisions,
      kineticEnergy: kineticEnergy.toFixed(2)
    },
    visualization: {
      kind: "particle-world",
      bounds,
      center
    } satisfies ParticleWorldVisualization
  };
}

function initializeParticles(entities: number): Particle[] {
  return Array.from({ length: entities }, (_, index) => {
    const ring = index % 4;
    const angle = (index / Math.max(1, entities)) * Math.PI * 2;
    const radius = 48 + ring * 28;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const tangent = angle + Math.PI / 2;
    const speed = 1.1 + ring * 0.18;
    return {
      id: index,
      x,
      y,
      vx: Math.cos(tangent) * speed,
      vy: Math.sin(tangent) * speed,
      trail: [{ x, y }]
    };
  });
}

function integrate(particles: Particle[]) {
  const nextParticles: Particle[] = [];
  let collisionCount = 0;
  for (const particle of particles) {
    const dx = center.x - particle.x;
    const dy = center.y - particle.y;
    const distance = Math.max(20, Math.hypot(dx, dy));
    const pull = 0.22;
    const swirl = 0.055;

    let vx = (particle.vx + (dx / distance) * pull + (-dy / distance) * swirl) * 0.986;
    let vy = (particle.vy + (dy / distance) * pull + (dx / distance) * swirl) * 0.986;
    let x = particle.x + vx;
    let y = particle.y + vy;

    if (x < 18 || x > bounds.width - 18) {
      x = Math.min(bounds.width - 18, Math.max(18, x));
      vx *= -0.72;
      collisionCount += 1;
    }
    if (y < 18 || y > bounds.height - 18) {
      y = Math.min(bounds.height - 18, Math.max(18, y));
      vy *= -0.72;
      collisionCount += 1;
    }

    nextParticles.push({
      id: particle.id,
      x,
      y,
      vx,
      vy,
      trail: [...particle.trail.slice(-28), { x, y }]
    });
  }
  return { particles: nextParticles, collisions: collisionCount };
}

function buildFrame(
  particles: Particle[],
  step: number,
  collisions: number,
  phase: string,
  explanation: string
): AlgorithmFrame {
  const points = particles.map(({ x, y }) => ({ x, y }));
  const trails = particles.map((particle) => particle.trail.slice());
  const first = particles[0] ?? { x: center.x, y: center.y, vx: 0, vy: 0 };
  return {
    points,
    trails,
    current: { x: first.x, y: first.y },
    phase,
    explanation,
    message: `world step ${step}`,
    metrics: {
      step,
      entity: particles.length,
      kineticEnergy: getKineticEnergy(particles).toFixed(2),
      centerPull: "0.22",
      drag: "0.986",
      collisions
    }
  };
}

function getKineticEnergy(particles: Array<{ vx: number; vy: number }>) {
  return particles.reduce((sum, particle) => sum + 0.5 * (particle.vx ** 2 + particle.vy ** 2), 0);
}
