import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PipelineStage } from './entities/pipeline-stage.entity';
import { Pipeline } from './entities/pipeline.entity';

export const DEFAULT_PIPELINE_NAME = 'Arriendos';

export const DEFAULT_PIPELINE_STAGES = [
    { name: 'Semilla', order: 1, key: 'nuevo' },
    { name: 'Brote', order: 2, key: 'contactado' },
    { name: 'Planta joven', order: 3, key: 'visita' },
    { name: 'Floración', order: 4, key: 'aplicacion' },
    { name: 'Cosecha', order: 5, key: 'ganado' },
    { name: 'Marchita', order: 6, key: 'perdido' },
] as const;

export type StageKey = (typeof DEFAULT_PIPELINE_STAGES)[number]['key'];

export function stageNameToKey(name: string): StageKey | string {
    return DEFAULT_PIPELINE_STAGES.find((s) => s.name === name)?.key ?? name;
}

export function stageKeyToName(key: string): string {
    return DEFAULT_PIPELINE_STAGES.find((s) => s.key === key)?.name ?? key;
}

@Injectable()
export class PipelinesService {
    constructor(
        @InjectRepository(Pipeline)
        private readonly pipelineRepo: Repository<Pipeline>,
        @InjectRepository(PipelineStage)
        private readonly stageRepo: Repository<PipelineStage>,
    ) {}

    async ensureDefaultPipeline(organizationId: string) {
        let pipeline = await this.pipelineRepo.findOne({
            where: { organizationId, name: DEFAULT_PIPELINE_NAME },
        });

        if (!pipeline) {
            pipeline = await this.pipelineRepo.save(
                this.pipelineRepo.create({ organizationId, name: DEFAULT_PIPELINE_NAME }),
            );
        }

        const existing = await this.stageRepo.find({ where: { pipelineId: pipeline.id }, order: { order: 'ASC' } });
        if (existing.length === 0) {
            for (const stage of DEFAULT_PIPELINE_STAGES) {
                await this.stageRepo.save(
                    this.stageRepo.create({
                        pipelineId: pipeline.id,
                        name: stage.name,
                        order: stage.order,
                    }),
                );
            }
        }

        return this.getDefaultPipeline(organizationId);
    }

    async getDefaultPipeline(organizationId: string) {
        const pipeline = await this.pipelineRepo.findOne({
            where: { organizationId, name: DEFAULT_PIPELINE_NAME },
        });
        if (!pipeline) return null;

        const stages = await this.stageRepo.find({
            where: { pipelineId: pipeline.id },
            order: { order: 'ASC' },
        });

        return { ...pipeline, stages };
    }

    async getStageByKey(organizationId: string, key: string) {
        const pipeline = await this.getDefaultPipeline(organizationId);
        if (!pipeline) return null;
        const name = stageKeyToName(key);
        return pipeline.stages.find((s) => s.name === name) ?? null;
    }
}
