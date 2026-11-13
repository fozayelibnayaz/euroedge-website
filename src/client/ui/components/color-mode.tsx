import { ThemeProvider, type ThemeProviderProps } from 'next-themes';

export type ColorMode = 'light' | 'dark';

export const ColorModeProvider = (props: ThemeProviderProps) => {
  return (
    <ThemeProvider
      attribute="class"
      disableTransitionOnChange={false}
      defaultTheme="dark"
      enableSystem={false}
      {...props}
    />
  );
};
