import type { UserIdea, ProjectType, ProjectSpec, ISpecGenerator } from '@/core/types';
import { normaliseIdeaToSpec } from '@/core/specNormaliser';

export class SpecGenerator implements ISpecGenerator {
  generate(idea: UserIdea, type: ProjectType): ProjectSpec {
    return normaliseIdeaToSpec(idea, type);
  }
}
