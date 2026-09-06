/**
 * Neon Pong — AI Opponent Engine
 * 4 intelligent AI profiles with distinct reaction models, trajectory prediction,
 * and strategic corner slicing.
 */

export const AI_PROFILES = {
  novice: {
    name: 'Novice',
    speed: 6.0,
    reactionDelay: 120, // ms
    jitterRange: 28,
    predictBounces: false,
    cornerSlicing: false
  },
  pro: {
    name: 'Pro',
    speed: 9.0,
    reactionDelay: 40,
    jitterRange: 10,
    predictBounces: true,
    cornerSlicing: false
  },
  master: {
    name: 'Master',
    speed: 12.5,
    reactionDelay: 0,
    jitterRange: 2,
    predictBounces: true,
    cornerSlicing: true
  },
  cyber: {
    name: 'Cyber',
    speed: 16.0,
    reactionDelay: 0,
    jitterRange: 0,
    predictBounces: true,
    cornerSlicing: true
  }
};

export class AIOpponent {
  constructor(profileKey = 'pro') {
    this.setProfile(profileKey);
    this.targetY = 0;
    this.lastPredictTime = 0;
    this.currentOffset = 0;
  }

  setProfile(profileKey) {
    this.profileKey = profileKey;
    this.profile = AI_PROFILES[profileKey] || AI_PROFILES.pro;
  }

  computeTargetY(ball, paddle, courtWidth, courtHeight, currentTime) {
    // Only recalculate periodically or when ball is incoming
    if (currentTime - this.lastPredictTime > (this.profile.reactionDelay || 30)) {
      this.lastPredictTime = currentTime;

      // If ball is moving away from AI, return towards court center
      if (ball.vx <= 0) {
        this.targetY = courtHeight / 2;
        return this.targetY;
      }

      // If novice and ball is still on player's half, remain calm
      if (this.profileKey === 'novice' && ball.x < courtWidth * 0.45) {
        this.targetY = courtHeight / 2 + (Math.sin(currentTime * 0.003) * 30);
        return this.targetY;
      }

      // Ball is incoming: calculate projected arrival Y
      let projectedY = ball.y;

      if (this.profile.predictBounces) {
        // Project trajectory towards paddle.x
        const distToPaddle = Math.max(1, paddle.x - ball.x);
        const timeToArrival = distToPaddle / Math.max(1, ball.vx);

        // Simple bounce simulation
        let simY = ball.y + (ball.vy * timeToArrival);
        const effectiveHeight = courtHeight - 20; // accounting for 10px wall margins

        // Reflect off walls within domain [10, courtHeight - 10]
        let bounces = 0;
        while ((simY < 10 || simY > courtHeight - 10) && bounces < 6) {
          if (simY < 10) {
            simY = 20 - simY;
          } else if (simY > courtHeight - 10) {
            simY = 2 * (courtHeight - 10) - simY;
          }
          bounces++;
        }
        projectedY = Math.max(10, Math.min(courtHeight - 10, simY));
      } else {
        // Simple direct tracking
        projectedY = ball.y;
      }

      // Human-like jitter error
      if (this.profile.jitterRange > 0) {
        this.currentOffset = (Math.random() - 0.5) * this.profile.jitterRange;
      } else {
        this.currentOffset = 0;
      }

      // Intentional edge slicing for advanced AI
      if (this.profile.cornerSlicing) {
        // Aim to hit top or bottom third of paddle to impart steep angle
        const sliceSide = ball.y > courtHeight / 2 ? -1 : 1;
        this.currentOffset += sliceSide * (paddle.height * 0.32);
      }

      this.targetY = projectedY + this.currentOffset;
    }

    return this.targetY;
  }
}
