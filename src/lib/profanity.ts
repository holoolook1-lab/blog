const profanityList = ['바보', '멍청이', '쓰레기']; // 예시 금칙어

export const containsProfanity = (text: string): boolean => {
  const lowerCaseText = text.toLowerCase();
  return profanityList.some(word => lowerCaseText.includes(word));
};