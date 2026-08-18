import {LangDirection} from '@app/enums/LangDirection';




export const isRTL = (d: LangDirection): boolean => d === LangDirection.RTL;

export const getFlexDirection = (d: LangDirection): 'row' | 'row-reverse' =>
  isRTL(d) ? 'row-reverse' : 'row';

export const getTextAlign = (d: LangDirection): 'left' | 'right' =>
  isRTL(d) ? 'right' : 'left';

export const getAlignSelf = (d: LangDirection): 'flex-start' | 'flex-end' =>
  isRTL(d) ? 'flex-end' : 'flex-start';

export const getMarginLeft = (d: LangDirection, v: number) => ({
  [isRTL(d) ? 'marginRight' : 'marginLeft']: v,
});

export const getMarginRight = (d: LangDirection, v: number) => ({
  [isRTL(d) ? 'marginLeft' : 'marginRight']: v,
});

export const getPaddingLeft = (d: LangDirection, v: number) => ({
  [isRTL(d) ? 'paddingRight' : 'paddingLeft']: v,
});

export const getPaddingRight = (d: LangDirection, v: number) => ({
  [isRTL(d) ? 'paddingLeft' : 'paddingRight']: v,
});


export const getScaleX = (d: LangDirection) => ({
  transform: [{scaleX: isRTL(d) ? -1 : 1}],
});
