import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Pipeline } from './pipeline.entity';

@Entity({ name: 'pipeline_stages' })
@Unique(['pipelineId', 'order'])
export class PipelineStage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'pipeline_id' })
  pipelineId!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'smallint' })
  order!: number;

  @ManyToOne(() => Pipeline)
  @JoinColumn({ name: 'pipeline_id' })
  pipeline?: Pipeline;
}
