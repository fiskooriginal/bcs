import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { formatRelativeTime, formatDateTime } from '@/lib/date-utils';

interface RelativeTimeProps {
  dateString: string;
  className?: string;
  prefix?: string;
}

export function RelativeTime({ dateString, className, prefix }: RelativeTimeProps) {
  const content = prefix ? `${prefix} ${formatRelativeTime(dateString)}` : formatRelativeTime(dateString);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className}>{content}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{formatDateTime(dateString)}</p>
      </TooltipContent>
    </Tooltip>
  );
}
