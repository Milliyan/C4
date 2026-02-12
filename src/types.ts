export interface CircuitNodeData {
  label: string;
  value: number; // Resistance, Capacitance, Inductance, Voltage, Current
  unit: string;
  phase?: number; // For AC sources
  type: 'resistor' | 'capacitor' | 'inductor' | 'voltage_source' | 'current_source' | 'op_amp' | 'ground' | 'junction';
  rotation?: number; // 0, 90, 180, 270
}

export type AnalysisMethod = 'nodal' | 'mesh' | 'superposition' | 'source_transformation' | 'thevenin' | 'norton' | 'op_amp' | 'spice';

export interface ComplexNumber {
  re: number;
  im: number;
}
