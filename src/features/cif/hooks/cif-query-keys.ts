export const cifQueryKeys = {
  vhfPatient: (patientId: number) => ["cif", "vhf", "patient", patientId] as const,
  vhfPatients: () => ["cif", "vhf", "patients"] as const,
  mpoxPatients: () => ["cif", "mpox", "patients"] as const
};
