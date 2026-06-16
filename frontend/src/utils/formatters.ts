/** Convert Western digits to Eastern Arabic / Urdu numerals */
export const toUrduNumerals = (n: number | string): string => {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
};

/** Format currency for display (PKR) */
export const formatCurrency = (amount: number, isUrdu: boolean): string => {
  const formatted = amount.toLocaleString('en-PK');
  if (isUrdu) return `Rs ${toUrduNumerals(formatted)}`;
  return `Rs ${formatted}`;
};

/** Format large numbers with K/M suffixes */
export const formatCompact = (n: number, isUrdu: boolean): string => {
  if (n >= 1000000) {
    const val = (n / 1000000).toFixed(1).replace(/\.0$/, '');
    return isUrdu ? `${toUrduNumerals(val)}M+` : `${val}M+`;
  }
  if (n >= 1000) {
    const val = (n / 1000).toFixed(1).replace(/\.0$/, '');
    return isUrdu ? `${toUrduNumerals(val)}K+` : `${val}K+`;
  }
  return isUrdu ? toUrduNumerals(n) : n.toString();
};
