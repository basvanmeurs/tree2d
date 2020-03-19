export type SpacingMode =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch';

export default function getSpacing(
  mode: SpacingMode,
  numberOfItems: number,
  remainingSpace: number,
): {
  spacingBefore: number;
  spacingBetween: number;
} {
  const itemGaps = numberOfItems - 1;
  let spacePerGap;

  let spacingBefore;
  let spacingBetween;

  switch (mode) {
    case 'flex-start':
      spacingBefore = 0;
      spacingBetween = 0;
      break;
    case 'flex-end':
      spacingBefore = remainingSpace;
      spacingBetween = 0;
      break;
    case 'center':
      spacingBefore = remainingSpace / 2;
      spacingBetween = 0;
      break;
    case 'space-between':
      spacingBefore = 0;
      spacingBetween = Math.max(0, remainingSpace) / itemGaps;
      break;
    case 'space-around':
      if (remainingSpace < 0) {
        return getSpacing('center', numberOfItems, remainingSpace);
      } else {
        spacePerGap = remainingSpace / (itemGaps + 1);
        spacingBefore = 0.5 * spacePerGap;
        spacingBetween = spacePerGap;
      }
      break;
    case 'space-evenly':
      if (remainingSpace < 0) {
        return getSpacing('center', numberOfItems, remainingSpace);
      } else {
        spacePerGap = remainingSpace / (itemGaps + 2);
        spacingBefore = spacePerGap;
        spacingBetween = spacePerGap;
      }
      break;
    case 'stretch':
      spacingBefore = 0;
      spacingBetween = 0;
      break;
    default:
      throw new Error('Unknown mode: ' + mode);
  }

  return { spacingBefore, spacingBetween };
}
