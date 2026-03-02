import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
  scripture?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export default function Card({ children, className = '', highlight, scripture, onClick, style }: CardProps) {
  const classes = [
    'card',
    highlight ? 'card-highlight' : '',
    scripture ? 'card-scripture' : '',
    onClick ? 'cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ');

  const mergedStyle: CSSProperties = {
    ...(onClick ? { cursor: 'pointer' } : {}),
    ...style,
  };

  return (
    <div className={classes} onClick={onClick} style={mergedStyle}>
      {children}
    </div>
  );
}
