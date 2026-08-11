export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  }
  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: '',
    lg: 'text-base px-8 py-3.5',
  }
  return (
    <button className={`${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
