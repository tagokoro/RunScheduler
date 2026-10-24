const LABELS: Record<string, string> = {
  race: "大会",
  easy_run: "イージーラン",
  interval: "インターバル",
  tempo: "テンポ走",
  long_run: "ロング走",
  recovery_run: "リカバリーラン",
  rest: "休養",
  cross_training: "クロストレーニング",
  race_pace: "レースペース走",
};
export function trainingTypeLabel(type: string) {
  return LABELS[type] ?? type;
}
