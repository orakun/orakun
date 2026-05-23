export const formatTRY = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(n);

export const formatDate = (d: Date | string) =>
  new Intl.DateTimeFormat("tr-TR").format(new Date(d));

export const formatPercent = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits: 2,
    signDisplay: "always",
  }).format(n);

export const formatNumber = (n: number, decimals = 4) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(n);
