export type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export type UseBoolean = {
  readonly value: boolean;
  readonly setValue: (value: boolean) => void;
  readonly setTrue: () => void;
  readonly setFalse: () => void;
  readonly toggle: () => void;
};
