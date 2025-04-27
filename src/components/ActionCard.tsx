import React from "react";

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  gradientFrom: string;
  gradientTo: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  gradientFrom,
  gradientTo,
}) => {
  const content = (
    <div
      className={`rounded-lg p-6 shadow-sm border bg-gradient-to-r from-${gradientFrom} to-${gradientTo} cursor-pointer transition hover:scale-[1.02]`}
    >
      <Icon className="w-8 h-8 mb-4" />
      <h2 className="font-bold text-lg mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );

  if (href) {
    return (
      <a href={href} tabIndex={0}>
        {content}
      </a>
    );
  }

  return (
    <div tabIndex={0} onClick={onClick}>
      {content}
    </div>
  );
};