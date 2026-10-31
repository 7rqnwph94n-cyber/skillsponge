import { ExpertProfile, HandoverPack, KnowledgeRecord } from './domain';

export interface ContinuityRiskRow {
  expertId: string;
  expertName: string;
  riskLevel: ExpertProfile['riskLevel'];
  retirementWindowEnd?: string;
  handoverPackId?: string;
  handoverStatus?: HandoverPack['status'];
  coverageScore?: number;
  targetRole?: string;
  linkedRecords: number;
  approvedLinkedRecords: number;
  flaggedReason: string;
}

const riskWeight: Record<ExpertProfile['riskLevel'], number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3
};

function getFlagReason(row: Omit<ContinuityRiskRow, 'flaggedReason'>): string {
  if (!row.handoverPackId) {
    return 'No handover pack';
  }
  if ((row.coverageScore ?? 0) < 60) {
    return 'Low handover coverage';
  }
  if (row.approvedLinkedRecords === 0) {
    return 'No approved linked records';
  }
  return 'On track';
}

export function buildContinuityRiskRows(experts: ExpertProfile[], handoverPacks: HandoverPack[], records: KnowledgeRecord[]): ContinuityRiskRow[] {
  const packByExpertId = new Map(handoverPacks.map((pack) => [pack.expertProfileId, pack] as const));

  const rows = experts.map((expert) => {
    const pack = packByExpertId.get(expert.id);
    const linked = records.filter((record) => record.sourceExpertId === expert.id);
    const approvedLinked = linked.filter((record) => record.approvalState === 'APPROVED');

    const rowBase: Omit<ContinuityRiskRow, 'flaggedReason'> = {
      expertId: expert.id,
      expertName: expert.name,
      riskLevel: expert.riskLevel,
      retirementWindowEnd: expert.retirementWindowEnd,
      handoverPackId: pack?.id,
      handoverStatus: pack?.status,
      coverageScore: pack?.coverageScore,
      targetRole: pack?.targetRole,
      linkedRecords: linked.length,
      approvedLinkedRecords: approvedLinked.length
    };

    return {
      ...rowBase,
      flaggedReason: getFlagReason(rowBase)
    };
  });

  return rows.sort((a, b) => {
    const riskDelta = riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
    if (riskDelta !== 0) return riskDelta;

    const coverageA = a.coverageScore ?? -1;
    const coverageB = b.coverageScore ?? -1;
    if (coverageA !== coverageB) return coverageA - coverageB;

    return a.expertName.localeCompare(b.expertName);
  });
}
