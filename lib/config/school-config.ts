// app/config/school-config.ts
// Path: app/config/school-config.ts
// Centralized school configuration

import { classColorOptions, colors, getModuleColor } from '@/lib/styles';







export const schoolConfig = {
  // Age groups with descriptions
  ageGroups: [
    { value: '0-1 years', label: 'Infants (0-1 years)', minAge: 0, maxAge: 1 },
    { value: '1-2 years', label: 'Young Toddlers (1-2 years)', minAge: 1, maxAge: 2 },
    { value: '2-3 years', label: 'Toddlers (2-3 years)', minAge: 2, maxAge: 3 },
    { value: '3-4 years', label: 'Preschool (3-4 years)', minAge: 3, maxAge: 4 },
    { value: '4-5 years', label: 'Pre-K (4-5 years)', minAge: 4, maxAge: 5 },
    { value: '5-6 years', label: 'Kindergarten (5-6 years)', minAge: 5, maxAge: 6 },
  ],



  // Schedule types
  schedules: {
    preschool: {
      name: 'Preschool',
      startTime: '09:00',
      endTime: '13:00',
      description: 'Morning preschool program',
      color: getModuleColor('attendance', 'primary'), // Sienna
    },
    fullDay: {
      name: 'Full Day',
      startTime: '09:00',
      endTime: '18:30',
      description: 'Full day program with extended care',
      color: colors.primary, // Primary brown
    },
    morningCare: {
      name: 'Morning Care',
      startTime: '07:30',
      endTime: '09:00',
      description: 'Early morning drop-off',
      color: colors.secondary, // Yellow
    },
    afterCare: {
      name: 'After Care',
      startTime: '13:00',
      endTime: '18:30',
      description: 'Afternoon extended care',
      color: getModuleColor('classes', 'primary'), // Chocolate
    },
    flexible: {
      name: 'Flexible',
      startTime: '07:30',
      endTime: '18:30',
      description: 'Custom schedule within operating hours',
      color: getModuleColor('curriculum', 'primary'), // Peru
    }
  },

// Default class form data
  defaultClassData: {
    name: '', 
    age_group: '', 
    capacity: 15,
    schedule_type: '',
    schedule_start: '09:00', 
    schedule_end: '13:00',
    description: '', 
    color_code: '#8B4513', // This will need to be a string value
    is_active: true,
    featured_image: '',
    attachments: [],
    documents: [],
    videos: [],
    photos: []
  },


  // Validation rules
  classValidation: {
    minCapacity: 1,
    maxCapacity: 50,
    timeRegex: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    errorMessages: {
      name: 'Class name is required',
      ageGroup: 'Age group is required',
      capacity: 'Capacity must be between 1 and 50',
      invalidTime: 'Invalid time format (HH:MM)',
      endBeforeStart: 'End time must be after start time',
      duplicate: 'A class with this name already exists',
      foreignKey: 'Invalid reference. Please check your selections',
      nullValue: 'Please fill in all required fields',
      generic: 'Failed to save class. Please try again.'
    }
  },

  // Form field definitions for class management
  getClassFormFields() {
    return [
      { 
        key: 'name', 
        label: 'Class Name', 
        type: 'text' as const, 
        required: true, 
        placeholder: 'e.g., Toddlers A' 
      },
      { 
        key: 'age_group', 
        label: 'Age Group', 
        type: 'select' as const, 
        required: true, 
        options: this.getAgeGroupOptions(),
        placeholder: 'Select age group' 
      },
      { 
        key: 'schedule_type',
        label: 'Schedule Type',
        type: 'select' as const,
        required: false,
        options: this.getScheduleOptions(),
        placeholder: 'Select preset schedule'
      },
      { 
        key: 'capacity', 
        label: 'Capacity', 
        type: 'number' as const, 
        required: true, 
        placeholder: '15'
      },
      { 
        key: 'schedule_start', 
        label: 'Start Time', 
        type: 'select' as const, 
        required: true, 
        options: this.timeSlots.dropOff.map(time => ({ value: time, label: time })),
        placeholder: 'Select start time' 
      },
      { 
        key: 'schedule_end', 
        label: 'End Time', 
        type: 'select' as const, 
        required: true, 
        options: this.timeSlots.pickUp.map(time => ({ value: time, label: time })),
        placeholder: 'Select end time' 
      },
      { 
        key: 'description', 
        label: 'Description', 
        type: 'textarea' as const, 
        placeholder: 'Brief description of the class' 
      },
      { 
        key: 'color_code', 
        label: 'Class Color', 
        type: 'select' as const,
        required: true,
        options: this.getColorOptions(),
        placeholder: 'Select color'
      },
      { 
        key: 'is_active', 
        label: 'Active Status', 
        type: 'checkbox' as const 
      }
    ];
  },

  // Icon and text configuration
  classTexts: {
    title: 'Class Management',
    subtitle: 'Manage your daycare classes',
    addButton: 'Add Class',
    emptyTitle: 'No classes found',
    emptySubtitle: 'Create your first class to get started',
    editTitle: 'Edit Class',
    addTitle: 'Add Class',
    updateButton: 'Update',
    createButton: 'Create',
    studentLabel: 'students',
    teacherLabel: 'teachers'
  },


  // Time slots for flexible scheduling
  timeSlots: {
    dropOff: [
      '07:30', '08:00', '08:30', '09:00', '09:30', 
      '10:00', '10:30', '11:00', '11:30', '12:00',
      '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00'
    ],
    pickUp: [
      '11:00', '11:30', '12:00', '12:30', '13:00',
      '13:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30', '18:00',
      '18:30'
    ]
  },

  // Class settings
  classSettings: {
    maxCapacity: 15,
    minCapacity: 4,
    teacherRatio: {
      '0-1 years': 3,  // 1 teacher per 3 infants
      '1-2 years': 4,  // 1 teacher per 4 young toddlers
      '2-3 years': 5,  // 1 teacher per 5 toddlers
      '3-4 years': 8,  // 1 teacher per 8 preschoolers
      '4-5 years': 10, // 1 teacher per 10 pre-k
      '5-6 years': 12  // 1 teacher per 12 kindergarten
    }
  },

  // Class colors for visual identification - now using brand colors
  classColors: classColorOptions,

  // Operating hours
  operatingHours: {
    openTime: '07:30',
    closeTime: '18:30',
    daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    holidays: [] // To be populated with school holidays
  },

  // Helper functions
  getScheduleOptions() {
    return Object.values(this.schedules).map(schedule => ({
      value: `${schedule.startTime}-${schedule.endTime}`,
      label: `${schedule.name} (${schedule.startTime} - ${schedule.endTime})`,
      ...schedule
    }));
  },

  getAgeGroupOptions() {
    return this.ageGroups.map(group => ({
      value: group.value,
      label: group.label
    }));
  },

  getColorOptions() {
    return classColorOptions;
  },

  // Get appropriate schedules for an age group
  getSchedulesForAgeGroup(ageGroup: string) {
    const age = this.ageGroups.find(g => g.value === ageGroup);
    if (!age) return this.getScheduleOptions();
    
    // Infants and young toddlers might not have preschool option
    if (age.maxAge < 3) {
      return this.getScheduleOptions().filter(s => s.name !== 'Preschool');
    }
    
    return this.getScheduleOptions();
  }
};