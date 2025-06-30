export type Attendance = {
  name: string;
  avatar: string;
  status: 'Presente' | 'Ausente' | 'De Licença';
  department: string;
  checkIn?: string;
};

export const team_attendance: Attendance[] = [];

export type Absence = {
  name: string;
  avatar: string;
  type: 'Férias' | 'Licença Médica' | 'Pessoal';
  dates: string;
};

export const upcoming_absences: Absence[] = [];
