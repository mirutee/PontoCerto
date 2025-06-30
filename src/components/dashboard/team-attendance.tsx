import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { team_attendance, type Attendance } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function TeamAttendance() {
  const getStatusVariant = (
    status: Attendance['status']
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Presente':
        return 'secondary';
      case 'Ausente':
        return 'destructive';
      case 'De Licença':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Funcionário</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Departamento</TableHead>
          <TableHead className="hidden md:table-cell">Check-in</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {team_attendance.map((employee, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={employee.avatar}
                    alt={employee.name}
                    data-ai-hint="person portrait"
                  />
                  <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="font-medium">{employee.name}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(employee.status)}>
                {employee.status}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {employee.department}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {employee.checkIn ?? 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
