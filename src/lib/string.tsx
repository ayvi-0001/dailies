export const camelCaseToTitleCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, " $1")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
};

export const camelCaseToSnakeCase = (str: string): string => {
  str = str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1_$2");
  return str.toLowerCase();
};
