// app/components/shared/schedule-field-handler.ts
// Path: app/components/shared/schedule-field-handler.ts

import { schoolConfig } from '@/lib/config/school-config';

export const handleScheduleTypeChange = (
  value: string, 
  formData: any, 
  setFormData: (data: any) => void
) => {
  // When schedule type is selected, update the times
  const schedule = Object.values(schoolConfig.schedules).find(
    s => s.type === value || `${s.startTime}-${s.endTime}` === value
  );
  
  if (schedule) {
    setFormData({
      ...formData,
      schedule_type: value,
      schedule_start: schedule.startTime,
      schedule_end: schedule.endTime
    });
  }
};