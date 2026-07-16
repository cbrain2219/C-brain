export const complaintTypeOptions = [
  {
    title: "대표에게 제보하기",
    description: "서비스 전반에 대한 의견이나 제안을 대표에게 직접 전달합니다",
  },
  {
    title: "불친절한 서비스",
    description: "상담·응대 과정에서 불편했던 점을 알려주세요",
  },
  {
    title: "결과물의 결함",
    description: "완성된 제작물의 품질·오류에 대한 내용입니다",
  },
  {
    title: "기타",
    description: "위 항목에 해당하지 않는 내용을 자유롭게 작성해주세요",
  },
] as const;

export function getComplaintTypeDescription(value: string) {
  return (
    complaintTypeOptions.find((option) => option.title === value)
      ?.description ?? ""
  );
}
