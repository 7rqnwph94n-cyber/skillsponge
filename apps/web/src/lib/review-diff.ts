import { KnowledgeRecord, RecordVersion } from './domain';

export interface DiffField {
  label: string;
  before: string;
  after: string;
}

export interface RecordVersionDiff {
  hasChanges: boolean;
  fields: DiffField[];
}

function asLine(value: string | string[] | number | undefined): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number') return String(value);
  return value ?? '';
}

function addField(fields: DiffField[], label: string, before: string | string[] | number | undefined, after: string | string[] | number | undefined) {
  const beforeText = asLine(before);
  const afterText = asLine(after);
  if (beforeText !== afterText) {
    fields.push({ label, before: beforeText, after: afterText });
  }
}

function addTypeSpecificFields(fields: DiffField[], before: KnowledgeRecord, after: KnowledgeRecord) {
  if (before.type !== after.type) {
    addField(fields, 'Record type', before.type, after.type);
    return;
  }

  if (after.type === 'PROCEDURE' && before.type === 'PROCEDURE') {
    addField(fields, 'Procedure steps', before.steps, after.steps);
    return;
  }

  if (after.type === 'FIELD_NOTE' && before.type === 'FIELD_NOTE') {
    addField(fields, 'Observation', before.observation, after.observation);
    addField(fields, 'Immediate action', before.immediateAction, after.immediateAction);
    return;
  }

  if (after.type === 'FAILURE_PATTERN' && before.type === 'FAILURE_PATTERN') {
    addField(fields, 'Pattern signals', before.patternSignals, after.patternSignals);
    addField(fields, 'Likely causes', before.likelyCauses, after.likelyCauses);
    return;
  }

  if (after.type === 'LESSON_LEARNED' && before.type === 'LESSON_LEARNED') {
    addField(fields, 'Lesson points', before.lessonPoints, after.lessonPoints);
    return;
  }

  if (after.type === 'EXPERT_INTERVIEW' && before.type === 'EXPERT_INTERVIEW') {
    addField(fields, 'Expert name', before.expertName, after.expertName);
    addField(fields, 'What novices miss', before.answers.whatNoviceMisses, after.answers.whatNoviceMisses);
    addField(fields, 'Top danger signs', before.answers.topThreeDangerSigns, after.answers.topThreeDangerSigns);
    addField(fields, 'Similar but different fault', before.answers.similarButDifferentFault, after.answers.similarButDifferentFault);
    addField(fields, 'First check before opening', before.answers.firstCheckBeforeOpening, after.answers.firstCheckBeforeOpening);
    addField(fields, 'Manual gap', before.answers.whatManualMisses, after.answers.whatManualMisses);
    return;
  }

  if (after.type === 'SHADOWING_RECORD' && before.type === 'SHADOWING_RECORD') {
    addField(fields, 'Senior technician', before.seniorTechnician, after.seniorTechnician);
    addField(fields, 'Junior technician', before.juniorTechnician, after.juniorTechnician);
    addField(fields, 'Competency score', before.competencyScore, after.competencyScore);
    addField(fields, 'Session outcome', before.sessionOutcome, after.sessionOutcome);
  }
}

export function buildVersionDiff(currentVersion: RecordVersion | undefined, previousVersion: RecordVersion | undefined): RecordVersionDiff {
  if (!currentVersion || !previousVersion) {
    return { hasChanges: false, fields: [] };
  }

  const current = currentVersion.snapshot;
  const previous = previousVersion.snapshot;
  const fields: DiffField[] = [];

  addField(fields, 'Title', previous.title, current.title);
  addField(fields, 'Body', previous.body, current.body);
  addField(fields, 'Confidence', previous.confidence, current.confidence);
  addField(fields, 'Asset', previous.context.asset, current.context.asset);
  addField(fields, 'System', previous.context.system, current.context.system);
  addField(fields, 'Task', previous.context.task, current.context.task);
  addField(fields, 'Symptom', previous.context.symptom, current.context.symptom);
  addField(fields, 'Environment', previous.context.environment, current.context.environment);
  addField(fields, 'Tags', previous.tags, current.tags);
  addTypeSpecificFields(fields, previous, current);

  return {
    hasChanges: fields.length > 0,
    fields
  };
}
