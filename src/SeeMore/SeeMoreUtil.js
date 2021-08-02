import { PixelRatio } from 'react-native';
import reactNativeTextSize from 'react-native-text-size';

/**
 * When difference between partialTextWidth and widthLimit is less than
 * this value, we mark the truncation index.
 */
const DIFFERENCE_THRESHOLD = 10;

/**
 * Finds the point where the text will be truncated, leaving enough space to show
 * the "read more" link
 *
 * @param text {string} Text for which you need to find the truncation index
 * @param numberOfLines {number} Number of lines being displayed
 * @param fontSize {number} Font size
 * @param fontFamily {string} Font family
 * @param fontWeight {string} Font weight
 * @param containerWidth {number} Width of the container in which the text will be contained
 * @param seeMoreText {string} See more text
 */
async function getTruncationIndex(
  text,
  numberOfLines,
  fontSize,
  fontFamily,
  fontWeight,
  containerWidth,
  seeMoreText,
) {
  const scaledFontSize = Math.round(fontSize * PixelRatio.getFontScale());

  const { width: totalTextWidth } = await reactNativeTextSize.measure({
    text,
    fontSize: scaledFontSize,
    fontFamily,
    fontWeight,
  });

  /**
   * Max possible width of the text when it is collapsed.
   * 10 is approx value of white space width per line.
   */
  const widthLimit = (containerWidth - 30) * numberOfLines;

  if (totalTextWidth < widthLimit) {
    return undefined;
  }

  let index = 0;
  let start = 0;
  let end = text.length - 1;

  let nextSpaceIndex = 0
  let currentLine = ''
  let currentWidth = 0
  let lastLineStartIndex = 0
  let breaksCount = 0

  let i = 0
  while (start <= end && breaksCount < numberOfLines) {
    const slicedText = text.slice(start)
    nextSpaceIndex = slicedText.indexOf(' ')
    const nextWord = slicedText.slice(0, nextSpaceIndex)
    const { width: potentialLineWidth } = await reactNativeTextSize.measure({
      text: currentLine + nextWord,
      fontSize: scaledFontSize,
      fontFamily,
      fontWeight,
    });
    if (potentialLineWidth > containerWidth) {
      currentLine = nextWord + ' '
      lastLineStartIndex = start
      breaksCount++
    } else {
      currentLine += nextWord + ' '
    }
    if (currentWidth + potentialLineWidth > totalTextWidth) {
      index = start
      break
    }
    currentWidth += potentialLineWidth
    start += nextSpaceIndex + 1
    index = start
    i++
  }

  end = start + nextSpaceIndex
  while (start <= end) {
    const { width: partialTextWidth } = await reactNativeTextSize.measure({
      text: text.slice(lastLineStartIndex, start),
      fontSize: scaledFontSize,
      fontFamily,
      fontWeight,
    });
    if (Math.abs(containerWidth - partialTextWidth) <= DIFFERENCE_THRESHOLD) {
      break
    }
    start++
  }
  index = start - 1
  let truncationIndex = index - (seeMoreText.length + 12);

  // If there is a new line character before this truncation index, this will break
  // So we find the first new line character before truncationIndex and set that as the
  // new truncation index
  const newLineCharacterIndex = text.slice(0, truncationIndex).indexOf('\n');
  if (newLineCharacterIndex > -1) {
    truncationIndex = newLineCharacterIndex;
  }

  return truncationIndex;
}

export default {
  getTruncationIndex,
};
