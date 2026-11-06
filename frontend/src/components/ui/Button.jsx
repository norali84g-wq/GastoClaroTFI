export default function Button({
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`button button--${variant} ${className}`.trim()}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
