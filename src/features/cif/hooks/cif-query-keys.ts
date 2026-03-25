export const cifQueryKeys = {
  vhfPatient: (patientId: number) => ["cif", "vhf", "patient", patientId] as const,
  vhfPatients: () => ["cif", "vhf", "patients"] as const,
  mpoxPatients: () => ["cif", "mpox", "patients"] as const,
  measlesPatients: (outbreakId: string) => ["cif", "measles", "patients", outbreakId] as const,
  polioPatients: (outbreakId: string) => ["cif", "polio", "patients", outbreakId] as const
};
