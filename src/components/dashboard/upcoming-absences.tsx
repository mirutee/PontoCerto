import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { upcoming_absences } from '@/lib/data';

export default function UpcomingAbsences() {
  return (
    <div className="space-y-4">
      {upcoming_absences.map((absence, index) => (
        <div key={index} className="flex items-center gap-4">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={absence.avatar}
              alt={absence.name}
              data-ai-hint="person portrait"
            />
            <AvatarFallback>{absence.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{absence.name}</p>
            <p className="text-sm text-muted-foreground">{absence.dates}</p>
          </div>
          <Badge variant="outline">{absence.type}</Badge>
        </div>
      ))}
    </div>
  );
}
