import ThemeToggle from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <div className="p-8 flex items-center justify-center gap-4">
      <span className="text-muted-foreground">Toggle theme:</span>
      <ThemeToggle />
    </div>
  );
}
